<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { searchPeople } from '../lib/search.js'

const props = defineProps({
  nodes: { type: Map, required: true },
})

const emit = defineEmits(['pick'])

const query = ref('')
const results = ref([])
const open = ref(false)
let debounceTimer = null

watch(query, value => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    results.value = searchPeople(props.nodes, value)
    open.value = results.value.length > 0
  }, 150)
})

const pick = node => {
  emit('pick', node.person.id)
  query.value = ''
  results.value = []
  open.value = false
}

const clear = () => {
  query.value = ''
  results.value = []
  open.value = false
}

const onKeydown = event => {
  if (event.key === 'Escape') clear()
  if (event.key === 'Enter' && results.value.length > 0) pick(results.value[0])
}

onBeforeUnmount(() => clearTimeout(debounceTimer))
</script>

<template>
  <div class="relative w-full max-w-xs">
    <input
      v-model="query"
      type="search"
      placeholder="Search name, title or id…"
      aria-label="Search people by name, title or employee id"
      class="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      @keydown="onKeydown"
      @focus="open = results.length > 0"
    />
    <ul
      v-if="open"
      class="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
      role="listbox"
    >
      <li v-for="node in results" :key="node.person.id">
        <button
          type="button"
          class="flex w-full flex-col px-3 py-1.5 text-left hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-100"
          @click="pick(node)"
        >
          <span class="text-sm font-medium text-slate-800">{{ node.person.name }}</span>
          <span class="text-[11px] text-slate-500">{{ node.person.title }} · {{ node.person.department }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
