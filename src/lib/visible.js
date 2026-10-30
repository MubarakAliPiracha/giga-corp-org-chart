// Pure visibility logic for the chart. A node is visible when every ancestor
// on its path from the root is expanded. These functions are what the render
// layer and the dev card-count assertion both rely on.

export function initialExpandedIds(nodes, rootId) {
  const root = nodes.get(rootId)
  if (!root) return new Set()
  // Root + level 2 expanded: the root's children also show THEIR children.
  return new Set([rootId, ...root.childIds])
}

export function visibleNodeIds(nodes, expandedIds, rootId) {
  const visible = []
  const stack = [rootId]
  while (stack.length > 0) {
    const id = stack.pop()
    const node = nodes.get(id)
    if (!node) continue
    visible.push(id)
    if (expandedIds.has(id)) {
      for (const childId of node.childIds) stack.push(childId)
    }
  }
  return visible
}

// "Expand all" semantics: one level at a time beneath startId — expand every
// node currently visible from startId, never the whole 40k in one click.
export function expandOneLevel(nodes, expandedIds, startId) {
  const next = new Set(expandedIds)
  for (const id of visibleNodeIds(nodes, next, startId)) {
    if (nodes.get(id).childIds.length > 0) next.add(id)
  }
  return next
}
