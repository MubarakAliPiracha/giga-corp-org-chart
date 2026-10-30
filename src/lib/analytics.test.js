import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { buildTree, computeMetrics, salaryOf, COLUMNS } from './metrics.js'
import { costByDimension, spanOfControl, byLevel, ratioByDepartment } from './analytics.js'

let nodes
let rootId
let totalSalary
let ceoSalary

beforeAll(() => {
  const text = readFileSync('public/data.csv', 'utf8')
  const { data: rows } = Papa.parse(text, { header: true, skipEmptyLines: true })
  const root = buildTree(rows)
  const { byId, totals } = computeMetrics(root)
  rootId = root.id
  totalSalary = totals.totalSalary
  ceoSalary = salaryOf(root.data)
  nodes = new Map()
  byId.forEach((node, id) => {
    nodes.set(id, {
      person: {
        id,
        name: node.data[COLUMNS.name],
        department: node.data[COLUMNS.department],
        location: node.data[COLUMNS.location],
        entity: node.data[COLUMNS.entity],
        salary: salaryOf(node.data),
        level: Number(node.data[COLUMNS.level]),
      },
      childIds: node.children ? node.children.map(child => child.id) : [],
    })
  })
})

describe('costByDimension', () => {
  it('sums department totals to the overall payroll minus the excluded CEO', () => {
    const { rows, excluded } = costByDimension(nodes, 'department', rootId)
    const sum = rows.reduce((acc, row) => acc + row.total, 0)
    expect(excluded.salary).toBe(20000000)
    expect(Math.abs(sum - (totalSalary - ceoSalary))).toBeLessThan(0.01)
  })

  it('splits every bucket into management + ic exactly', () => {
    const { rows } = costByDimension(nodes, 'department', rootId)
    for (const row of rows) {
      expect(Math.abs(row.management + row.ic - row.total)).toBeLessThan(1e-6)
    }
  })

  it('covers all 40,000 people across buckets plus the excluded CEO', () => {
    const { rows } = costByDimension(nodes, 'department', rootId)
    const heads = rows.reduce((acc, row) => acc + row.headcount, 0)
    expect(heads).toBe(39999)
  })

  it('sorts buckets by total descending', () => {
    const { rows } = costByDimension(nodes, 'location', rootId)
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].total).toBeGreaterThanOrEqual(rows[i].total)
    }
  })
})

describe('spanOfControl', () => {
  it('counts every manager exactly once and spans never exceed 4', () => {
    const { rows, managers } = spanOfControl(nodes)
    expect(managers).toBe(11453)
    expect(rows.reduce((acc, row) => acc + row.managers, 0)).toBe(11453)
    expect(Math.max(...rows.map(row => Number(row.label)))).toBe(4)
  })
})

describe('byLevel', () => {
  it('spans levels 1..10 and headcounts sum to 40,000', () => {
    const rows = byLevel(nodes)
    expect(rows[0].level).toBe(1)
    expect(rows[rows.length - 1].level).toBe(10)
    expect(rows.reduce((acc, row) => acc + row.headcount, 0)).toBe(40000)
  })

  it('level 1 is exactly the CEO', () => {
    const rows = byLevel(nodes)
    expect(rows[0].headcount).toBe(1)
    expect(rows[0].cost).toBe(20000000)
  })
})

describe('ratioByDepartment', () => {
  it('keeps every ratio in [0, 1] and ranks descending', () => {
    const rows = ratioByDepartment(nodes, rootId)
    for (const row of rows) {
      expect(row.ratio).toBeGreaterThanOrEqual(0)
      expect(row.ratio).toBeLessThanOrEqual(1)
    }
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].ratio).toBeGreaterThanOrEqual(rows[i].ratio)
    }
  })
})
