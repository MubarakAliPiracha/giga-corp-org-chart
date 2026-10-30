<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { searchPeople } from '../lib/search.js'

const props = defineProps({
  nodes: { type: Map, required: true },
})

const emit = defineEmits(['pick'])

const input = ref(null)
const query = ref('')
const results = ref([])
const open = ref(false)
let debounceTimer = null

const isMac = navigator.platform.toUpperCase().includes('MAC')
const shortcutHint = isMac ? '⌘K' : 'Ctrl K'

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

const focus = () => input.value && input.value.focus()
defineExpose({ focus })

onBeforeUnmount(() => clearTimeout(debounceTimer))
</script>

<template>
  <div class="relative w-full max-w-xs">
    <input
      ref="input"
      v-model="query"
      type="search"
      placeholder="Search name, title or id…"
      aria-label="Search people by name, title or employee id"
      class="w-full rounded-control border border-line bg-surface py-1.5 pl-3 pr-14 text-sm text-ink shadow-card placeholder:text-ink-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      @keydown="onKeydown"
      @focus="open = results.length > 0"
    />
    <kbd
      class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-ink-muted"
      aria-hidden="true"
    >{{ shortcutHint }}</kbd>
    <ul
      v-if="open"
      class="absolute z-40 mt-1 w-full overflow-hidden rounded-control border border-line bg-surface shadow-lift"
      role="listbox"
    >
      <li v-for="node in results" :key="node.person.id">
        <button
          type="button"
          class="flex w-full flex-col px-3 py-1.5 text-left hover:bg-canvas focus:outline-none focus-visible:bg-canvas"
          @click="pick(node)"
        >
          <span class="text-sm font-medium text-ink">{{ node.person.name }}</span>
          <span class="text-xs text-ink-secondary">{{ node.person.title }} · {{ node.person.department }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
