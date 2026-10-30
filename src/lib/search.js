// Pure search over the flat nodes map. A debounced linear scan of 40k rows
// is a few milliseconds — no index needed.

export function searchPeople(nodes, query, limit = 8) {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return []

  const scored = []
  for (const [id, node] of nodes) {
    const name = node.person.name.toLowerCase()
    const title = node.person.title.toLowerCase()
    let score = null
    if (name.startsWith(needle)) score = 0
    else if (name.includes(needle)) score = 1
    else if (title.includes(needle)) score = 2
    else if (id.toLowerCase().includes(needle)) score = 3
    if (score !== null) scored.push({ score, node })
  }

  scored.sort((a, b) => a.score - b.score || a.node.person.name.localeCompare(b.node.person.name))
  return scored.slice(0, limit).map(entry => entry.node)
}

// Ancestor ids from the root down to (excluding) the person — exactly the
// nodes that must be expanded for the person to be visible.
export function ancestorIds(nodes, id) {
  const ancestors = []
  let current = nodes.get(id)
  while (current && current.parentId !== null) {
    ancestors.unshift(current.parentId)
    current = nodes.get(current.parentId)
  }
  return ancestors
}
