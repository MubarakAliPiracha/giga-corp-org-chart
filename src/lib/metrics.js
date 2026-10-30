// Pure data layer for the org chart. No Vue imports.
//
// Metric definitions are locked: every metric is over a node's DESCENDANTS and
// excludes the node itself. A leaf therefore reports zeros, and the CEO's own
// $20,000,000 never appears in the CEO's own aggregates.

import { stratify } from 'd3-hierarchy'

// The only place CSV header names appear. Swapping datasets means editing this.
export const COLUMNS = Object.freeze({
  id: 'Employee Id',
  managerId: 'Manager',
  name: 'Name',
  title: 'Job Title',
  department: 'Department',
  location: 'Location',
  salary: 'Salary',
  level: 'level',
  entity: 'Entity',
  performance: 'Performance',
  startDate: 'Start Date',
  bonus: 'Bonus',
})

export function salaryOf(row) {
  const value = Number(row?.[COLUMNS.salary])
  return Number.isFinite(value) ? value : 0
}

export function buildTree(rows) {
  return stratify()
    .id(row => row[COLUMNS.id])
    .parentId(row => row[COLUMNS.managerId] || null)(rows)
}

// A node "has reports" iff d3's stratify gave it a children array. stratify only
// ever creates that array with at least one element and never empties it, so this
// is exact — no need to check length.
const hasReports = node => node.children !== undefined

// ONE bottom-up pass. Each node combines its children's already-computed values,
// so every node is visited exactly once: O(n) time, O(n) memory. The id index,
// payroll total and depth are accumulated in the same pass — there is no second
// traversal anywhere in this module.
export function computeMetrics(root) {
  const byId = new Map()
  let maxDepth = 0
  let totalSalary = 0
  let managers = 0
  let leaves = 0

  root.eachAfter(node => {
    const children = node.children
    let descendants = 0
    let nonLeafDescendants = 0
    let managementCost = 0
    let icCost = 0

    if (children !== undefined) {
      for (const child of children) {
        const childMetrics = child.metrics
        const childSalary = salaryOf(child.data)
        const childIsManager = hasReports(child)

        descendants += 1 + childMetrics.descendants
        nonLeafDescendants += childMetrics.nonLeafDescendants + (childIsManager ? 1 : 0)
        managementCost += childMetrics.managementCost + (childIsManager ? childSalary : 0)
        icCost += childMetrics.icCost + (childIsManager ? 0 : childSalary)
      }
    }

    const totalCost = managementCost + icCost
    node.metrics = {
      descendants,
      nonLeafDescendants,
      managementCost,
      icCost,
      totalCost,
      // Leaves have no descendants, so the ratio is 0 rather than 0/0.
      managementCostRatio: totalCost > 0 ? managementCost / totalCost : 0,
      directReports: children === undefined ? 0 : children.length,
    }

    byId.set(node.id, node)
    totalSalary += salaryOf(node.data)
    if (node.depth + 1 > maxDepth) maxDepth = node.depth + 1
    if (children === undefined) leaves += 1
    else managers += 1
  })

  return { byId, totals: { people: byId.size, totalSalary, maxDepth, managers, leaves } }
}

// Walks up parent pointers. O(depth), and depth is 10 here.
export function pathToRoot(node) {
  const path = []
  for (let current = node; current; current = current.parent) path.unshift(current.id)
  return path
}

// Deliberately slow reference implementation: walks the whole subtree directly.
// Used ONLY by tests to cross-check the single-pass computation — this per-node
// walk is exactly the O(n*depth) shape the fast pass avoids.
export function bruteForceMetrics(node) {
  let descendants = 0
  let nonLeafDescendants = 0
  let managementCost = 0
  let icCost = 0

  const stack = node.children ? [...node.children] : []
  while (stack.length > 0) {
    const current = stack.pop()
    descendants += 1
    const salary = salaryOf(current.data)
    if (current.children !== undefined) {
      nonLeafDescendants += 1
      managementCost += salary
      for (const child of current.children) stack.push(child)
    } else {
      icCost += salary
    }
  }

  const totalCost = managementCost + icCost
  return {
    descendants,
    nonLeafDescendants,
    managementCost,
    icCost,
    totalCost,
    managementCostRatio: totalCost > 0 ? managementCost / totalCost : 0,
    directReports: node.children === undefined ? 0 : node.children.length,
  }
}
