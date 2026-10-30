<script setup>
import { provide, nextTick } from 'vue'
import OrgListNode from './OrgListNode.vue'

const props = defineProps({
  org: { type: Object, required: true },
  state: { type: Object, required: true },
})

const select = id => {
  props.state.selectedId.value = props.state.selectedId.value === id ? null : id
}

provide('orgChart', {
  nodes: props.org.nodes,
  isExpanded: props.state.isExpanded,
  toggle: props.state.toggle,
  select,
  selectedId: props.state.selectedId,
  highlightedId: props.state.highlightedId,
})

const centerOn = async id => {
  await nextTick()
  const row = document.querySelector('[data-row-id="' + id + '"]')
  if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

defineExpose({ centerOn })
</script>

<template>
  <div class="flex-1 overflow-y-auto overscroll-contain">
    <ul>
      <OrgListNode :id="org.rootId" :depth="0" />
    </ul>
  </div>
</template>
