// Runs off the main thread: fetch + parse + stratify + metrics on 40k rows.
// Posts back a flat, structured-clone-safe payload — never d3 nodes, whose
// parent pointers and prototypes do not survive postMessage.
import Papa from 'papaparse'
import { COLUMNS, buildTree, computeMetrics, salaryOf } from '../lib/metrics.js'

function toPerson(row) {
  return {
    id: row[COLUMNS.id],
    name: row[COLUMNS.name],
    title: row[COLUMNS.title],
    department: row[COLUMNS.department],
    location: row[COLUMNS.location],
    salary: salaryOf(row),
    level: Number(row[COLUMNS.level]),
    entity: row[COLUMNS.entity],
    performance: row[COLUMNS.performance],
    startDate: row[COLUMNS.startDate],
    bonus: Number(row[COLUMNS.bonus]) || 0,
  }
}

self.onmessage = async event => {
  const url = event.data
  try {
    const fetchStart = performance.now()
    const response = await fetch(url)
    if (!response.ok) throw new Error('Fetching ' + url + ' failed: HTTP ' + response.status)
    const text = await response.text()
    const parseStart = performance.now()
    const { data: rows, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })
    if (errors.length > 0) throw new Error('CSV parse error: ' + errors[0].message)

    const buildStart = performance.now()
    const root = buildTree(rows)
    const computeStart = performance.now()
    const { byId, totals } = computeMetrics(root)
    const flattenStart = performance.now()

    const nodes = new Map()
    byId.forEach((node, id) => {
      nodes.set(id, {
        person: toPerson(node.data),
        parentId: node.parent ? node.parent.id : null,
        childIds: node.children ? node.children.map(child => child.id) : [],
        depth: node.depth,
        metrics: node.metrics,
      })
    })
    const done = performance.now()

    self.postMessage({
      ok: true,
      rootId: root.id,
      nodes,
      totals,
      timings: {
        fetchMs: parseStart - fetchStart,
        parseMs: buildStart - parseStart,
        buildMs: computeStart - buildStart,
        computeMs: flattenStart - computeStart,
        flattenMs: done - flattenStart,
        totalMs: done - fetchStart,
      },
    })
  } catch (error) {
    self.postMessage({ ok: false, message: error.message })
  }
}
