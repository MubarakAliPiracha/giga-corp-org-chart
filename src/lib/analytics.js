// Pure aggregations for the analytics tab. Everything runs over the flat
// nodes map the worker already produced — tree metrics are never recomputed.
// Per CLAUDE.md the CEO's $20M outlier is excluded from salary rollups and
// labelled in the UI instead.

const isManager = node => node.childIds.length > 0

// Salary rollup by a person dimension ('department' | 'location' | 'entity'),
// split into management (people who have reports) vs IC salaries.
export function costByDimension(nodes, dimension, excludeId) {
  const buckets = new Map()
  let excluded = null

  for (const [id, node] of nodes) {
    if (id === excludeId) {
      excluded = { name: node.person.name, salary: node.person.salary }
      continue
    }
    const key = node.person[dimension] || '(none)'
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { label: key, management: 0, ic: 0, total: 0, headcount: 0 }
      buckets.set(key, bucket)
    }
    if (isManager(node)) bucket.management += node.person.salary
    else bucket.ic += node.person.salary
    bucket.total += node.person.salary
    bucket.headcount += 1
  }

  const rows = [...buckets.values()].sort((a, b) => b.total - a.total)
  return { rows, excluded }
}

// Distribution of direct-report counts among managers. Spans are small
// integers (max 4 in this dataset) so a Map keyed by span is exact.
export function spanOfControl(nodes) {
  const distribution = new Map()
  let managers = 0

  for (const [, node] of nodes) {
    if (!isManager(node)) continue
    managers += 1
    const span = node.childIds.length
    distribution.set(span, (distribution.get(span) || 0) + 1)
  }

  const rows = [...distribution.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([span, managerCount]) => ({ label: String(span), managers: managerCount }))

  return { rows, managers, singleReport: distribution.get(1) || 0 }
}

// Headcount and salary cost per level (1..maxDepth). The CEO is included
// here — level 1 IS the CEO — and labelled in the UI rather than dropped.
export function byLevel(nodes) {
  const buckets = new Map()
  for (const [, node] of nodes) {
    const level = node.person.level
    let bucket = buckets.get(level)
    if (!bucket) {
      bucket = { label: String(level), level, headcount: 0, cost: 0 }
      buckets.set(level, bucket)
    }
    bucket.headcount += 1
    bucket.cost += node.person.salary
  }
  return [...buckets.values()].sort((a, b) => a.level - b.level)
}

// Management cost ratio per department (share of that department's payroll
// paid to people who have reports), ranked high to low.
export function ratioByDepartment(nodes, excludeId) {
  const { rows } = costByDimension(nodes, 'department', excludeId)
  return rows
    .map(row => ({ label: row.label, ratio: row.total > 0 ? row.management / row.total : 0 }))
    .sort((a, b) => b.ratio - a.ratio)
}
