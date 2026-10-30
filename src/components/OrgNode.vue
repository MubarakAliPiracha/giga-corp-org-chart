<script setup>
import { computed, inject } from 'vue'
import NodeCard from './NodeCard.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const chart = inject('orgChart')

const node = computed(() => chart.nodes.get(props.id))
const expanded = computed(() => chart.isExpanded(props.id))
const showChildren = computed(() => expanded.value && node.value.childIds.length > 0)
</script>

<template>
  <div class="tree-node">
    <NodeCard
      :node="node"
      :expanded="expanded"
      :selected="chart.selectedId.value === id"
      :highlighted="chart.highlightedId.value === id"
      @toggle="chart.toggle"
      @select="chart.select"
    />
    <Transition name="kids">
      <div v-if="showChildren" class="flex flex-col items-center">
        <div class="tree-stem" aria-hidden="true"></div>
        <div class="tree-children">
          <div v-for="childId in node.childIds" :key="childId" class="tree-child">
            <OrgNode :id="childId" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
