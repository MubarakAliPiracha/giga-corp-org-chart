import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { buildTree, computeMetrics } from './metrics.js'
import { initialExpandedIds, visibleNodeIds, expandOneLevel } from './visible.js'

// Minimal nodes map in the worker's payload shape: id -> { childIds }.
function makeNodes(entries) {
  return new Map(entries.map(([id, childIds]) => [id, { childIds }]))
}

describe('visibility on a hand-built tree', () => {
  // r -> a, b; a -> c, d; c -> e
  const nodes = makeNodes([
    ['r', ['a', 'b']],
    ['a', ['c', 'd']],
    ['b', []],
    ['c', ['e']],
    ['d', []],
    ['e', []],
  ])

  it('shows only the root when nothing is expanded', () => {
    expect(visibleNodeIds(nodes, new Set(), 'r')).toEqual(['r'])
  })

  it('initial state shows the root and level 2 only', () => {
    const expanded = initialExpandedIds(nodes, 'r')
    expect(expanded).toEqual(new Set(['r']))
    const visible = visibleNodeIds(nodes, expanded, 'r')
    // r is expanded so a and b are visible; nothing deeper is.
    expect(new Set(visible)).toEqual(new Set(['r', 'a', 'b']))
  })

  it('never shows a node whose ancestor is collapsed, even if it is expanded', () => {
    const visible = visibleNodeIds(nodes, new Set(['c']), 'r')
    expect(visible).toEqual(['r'])
  })

  it('expandOneLevel expands exactly the visible frontier', () => {
    const first = expandOneLevel(nodes, new Set(['r']), 'r')
    // visible were r, a, b -> a gains expansion (b, has no children)
    expect(first).toEqual(new Set(['r', 'a']))
    const second = expandOneLevel(nodes, first, 'r')
    expect(second).toEqual(new Set(['r', 'a', 'c']))
  })

  it('expandOneLevel beneath a selection does not touch siblings', () => {
    const next = expandOneLevel(nodes, new Set(), 'a')
    expect(next).toEqual(new Set(['a']))
  })
})

describe('visibility on the real dataset', () => {
  let nodes
  let rootId

  beforeAll(() => {
    const text = readFileSync('public/data.csv', 'utf8')
    const { data: rows } = Papa.parse(text, { header: true, skipEmptyLines: true })
    const root = buildTree(rows)
    const { byId } = computeMetrics(root)
    rootId = root.id
    nodes = new Map()
    byId.forEach((node, id) => {
      nodes.set(id, { childIds: node.children ? node.children.map(child => child.id) : [] })
    })
  })

  it('initial visible count is small and never 40,000', () => {
    const expanded = initialExpandedIds(nodes, rootId)
    const visible = visibleNodeIds(nodes, expanded, rootId)
    const level2 = nodes.get(rootId).childIds
    expect(visible.length).toBe(1 + level2.length)
    expect(visible.length).toBeLessThan(100)
    expect(visible.length).not.toBe(40000)
  })
})
