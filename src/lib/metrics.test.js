import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { COLUMNS, buildTree, computeMetrics, bruteForceMetrics, salaryOf, pathToRoot } from './metrics.js'

// Deterministic PRNG so the 200-node sample is identical on every run.
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CENT = 0.005
const closeToCent = (actual, expected) => Math.abs(actual - expected) <= CENT

function row(id, managerId, salary) {
  return {
    [COLUMNS.id]: id,
    [COLUMNS.managerId]: managerId,
    [COLUMNS.name]: 'Person ' + id,
    [COLUMNS.salary]: String(salary),
  }
}

describe('hand-built trees', () => {
  it('computes zeros and ratio 0 for a single node', () => {
    const root = buildTree([row('a', '', 100)])
    computeMetrics(root)
    expect(root.metrics).toEqual({
      descendants: 0,
      nonLeafDescendants: 0,
      managementCost: 0,
      icCost: 0,
      totalCost: 0,
      managementCostRatio: 0,
      directReports: 0,
    })
  })

  it('splits manager vs leaf salaries in a 3-level tree', () => {
    // a manages b and e; b manages c and d. b is the only non-leaf descendant of a.
    const root = buildTree([
      row('a', '', 1000),
      row('b', 'a', 200),
      row('c', 'b', 30),
      row('d', 'b', 40),
      row('e', 'a', 500),
    ])
    computeMetrics(root)
    expect(root.metrics).toEqual({
      descendants: 4,
      nonLeafDescendants: 1,
      managementCost: 200,
      icCost: 570,
      totalCost: 770,
      managementCostRatio: 200 / 770,
      directReports: 2,
    })
    const b = root.children.find(child => child.id === 'b')
    expect(b.metrics).toEqual({
      descendants: 2,
      nonLeafDescendants: 0,
      managementCost: 0,
      icCost: 70,
      totalCost: 70,
      managementCostRatio: 0,
      directReports: 2,
    })
  })
})

describe('real dataset (public/data.csv)', () => {
  let root
  let byId
  let totals

  beforeAll(() => {
    const text = readFileSync('public/data.csv', 'utf8')
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
    expect(parsed.errors).toEqual([])
    root = buildTree(parsed.data)
    const result = computeMetrics(root)
    byId = result.byId
    totals = result.totals
  })

  const ANSWER_KEY = [
    ['CEO Melody Himes', 'p_DrnEHzsrxaHOPnwwNDBwy', {
      directReports: 4,
      descendants: 39999,
      nonLeafDescendants: 11452,
      managementCost: 689148506.54,
      icCost: 1713293713.99,
      totalCost: 2402442220.52,
      managementCostRatio: 0.2869,
    }],
    ['Pablo Pitts', 'p_cNNDKZRLm2DMkjKXx8YPdo', {
      descendants: 11842,
      nonLeafDescendants: 3392,
      managementCost: 203915814.06,
      icCost: 507738755.46,
      totalCost: 711654569.52,
    }],
    ['Drew Bromley', 'p_XkJbblsKUlQoR5W1DxAN7t', {
      descendants: 11359,
      nonLeafDescendants: 3262,
      managementCost: 196166153.25,
      icCost: 485783032.43,
      totalCost: 681949185.68,
    }],
    ['Cynthia Miller', 'p_k8GFEUg6QUUWXDrPEKCMDK', {
      descendants: 12,
      nonLeafDescendants: 3,
      managementCost: 182010.41,
      icCost: 507342.23,
      totalCost: 689352.64,
      managementCostRatio: 0.2640,
    }],
  ]

  it.each(ANSWER_KEY)('matches the answer key for %s', (label, id, expected) => {
    const metrics = byId.get(id).metrics
    for (const [key, value] of Object.entries(expected)) {
      if (key === 'managementCostRatio') {
        expect(Math.abs(metrics[key] - value), label + ' ' + key).toBeLessThanOrEqual(0.00005)
      } else if (Number.isInteger(value)) {
        expect(metrics[key], label + ' ' + key).toBe(value)
      } else {
        expect(closeToCent(metrics[key], value), label + ' ' + key + ': got ' + metrics[key]).toBe(true)
      }
    }
  })

  it('has root descendants + 1 === 40000 and exact totals', () => {
    expect(root.metrics.descendants + 1).toBe(40000)
    expect(totals.people).toBe(40000)
    expect(totals.managers).toBe(11453)
    expect(totals.leaves).toBe(28547)
    expect(totals.maxDepth).toBe(10)
  })

  it('gives every leaf all-zero metrics and ratio 0', () => {
    let leafCount = 0
    let violations = 0
    byId.forEach(node => {
      if (node.children !== undefined) return
      leafCount += 1
      const m = node.metrics
      const allZero = m.descendants === 0 && m.nonLeafDescendants === 0 &&
        m.managementCost === 0 && m.icCost === 0 && m.totalCost === 0 &&
        m.managementCostRatio === 0 && m.directReports === 0
      if (!allZero) violations += 1
    })
    expect(leafCount).toBe(28547)
    expect(violations).toBe(0)
  })

  it('matches bruteForceMetrics on 200 seeded random nodes', () => {
    const ids = [...byId.keys()]
    const random = mulberry32(40000)
    for (let i = 0; i < 200; i += 1) {
      const node = byId.get(ids[Math.floor(random() * ids.length)])
      const slow = bruteForceMetrics(node)
      const fast = node.metrics
      expect(fast.descendants).toBe(slow.descendants)
      expect(fast.nonLeafDescendants).toBe(slow.nonLeafDescendants)
      expect(fast.directReports).toBe(slow.directReports)
      for (const key of ['managementCost', 'icCost', 'totalCost', 'managementCostRatio']) {
        const tolerance = Math.max(1e-6, Math.abs(slow[key]) * 1e-9)
        expect(Math.abs(fast[key] - slow[key]), node.id + ' ' + key).toBeLessThanOrEqual(tolerance)
      }
    }
  })

  it('walks pathToRoot from a deep node up to the CEO', () => {
    const cynthia = byId.get('p_k8GFEUg6QUUWXDrPEKCMDK')
    const path = pathToRoot(cynthia)
    expect(path[0]).toBe('p_DrnEHzsrxaHOPnwwNDBwy')
    expect(path[path.length - 1]).toBe('p_k8GFEUg6QUUWXDrPEKCMDK')
    expect(path.length).toBe(cynthia.depth + 1)
  })

  it('treats blank or malformed salary as 0 via salaryOf', () => {
    expect(salaryOf({ [COLUMNS.salary]: '' })).toBe(0)
    expect(salaryOf({ [COLUMNS.salary]: 'n/a' })).toBe(0)
    expect(salaryOf({ [COLUMNS.salary]: '157478.1361' })).toBeCloseTo(157478.1361, 4)
    expect(salaryOf(undefined)).toBe(0)
  })
})
