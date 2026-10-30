import { ref, shallowRef } from 'vue'
import { initialExpandedIds, expandOneLevel } from '../lib/visible.js'

// All chart UI state lives here, NOT on the 40k nodes: expanded/selected are
// id strings, and the Set is replaced immutably so shallowRef sees the change.
export function useOrgChartState() {
  const expandedIds = shallowRef(new Set())
  const selectedId = ref(null)
  const highlightedId = ref(null)

  const isExpanded = id => expandedIds.value.has(id)

  const toggle = id => {
    const next = new Set(expandedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    expandedIds.value = next
  }

  const expandPath = ids => {
    const next = new Set(expandedIds.value)
    for (const id of ids) next.add(id)
    expandedIds.value = next
  }

  const expandLevel = (nodes, startId) => {
    expandedIds.value = expandOneLevel(nodes, expandedIds.value, startId)
  }

  const resetExpansion = (nodes, rootId) => {
    expandedIds.value = initialExpandedIds(nodes, rootId)
  }

  const collapseAll = rootId => {
    expandedIds.value = new Set([rootId])
  }

  return {
    expandedIds,
    selectedId,
    highlightedId,
    isExpanded,
    toggle,
    expandPath,
    expandLevel,
    resetExpansion,
    collapseAll,
  }
}
