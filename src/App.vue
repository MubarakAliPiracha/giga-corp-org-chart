<script setup>
import { watch, ref, onMounted, onBeforeUnmount } from 'vue'
import { useOrgData } from './composables/useOrgData.js'
import { useOrgChartState } from './composables/useOrgChartState.js'
import { useMediaQuery } from './composables/useMediaQuery.js'
import { ancestorIds } from './lib/search.js'
import OrgChartView from './components/OrgChartView.vue'
import AnalyticsView from './components/AnalyticsView.vue'
import OrgListView from './components/OrgListView.vue'
import OrgDetailPanel from './components/OrgDetailPanel.vue'
import SearchBar from './components/SearchBar.vue'

const { status, error, org, timings } = useOrgData()
const chartState = useOrgChartState()
const chartView = ref(null)
const listView = ref(null)
const searchBar = ref(null)
const isNarrow = useMediaQuery('(max-width: 767px)')
const activeTab = ref('chart')

watch(status, value => {
  if (value === 'ready') {
    chartState.resetExpansion(org.value.nodes, org.value.rootId)
  }
})

let highlightTimer = null

const revealPerson = id => {
  activeTab.value = 'chart'
  chartState.expandPath(ancestorIds(org.value.nodes, id))
  chartState.selectedId.value = id
  chartState.highlightedId.value = id
  clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => {
    chartState.highlightedId.value = null
  }, 2000)
  const view = isNarrow.value ? listView.value : chartView.value
  if (view) view.centerOn(id)
}

const closePanel = () => {
  chartState.selectedId.value = null
}

// Ctrl/Cmd+K focuses search from anywhere
const onGlobalKeydown = event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (searchBar.value) searchBar.value.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))

const timingTitle = () =>
  'parse ' + Math.round(timings.value.parseMs) + ' ms · tree ' + Math.round(timings.value.buildMs) +
  ' ms · metrics ' + Math.round(timings.value.computeMs) + ' ms — ' +
  org.value.totals.managers.toLocaleString() + ' managers · ' +
  org.value.totals.leaves.toLocaleString() + ' ICs'
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
    <header
      v-if="status === 'ready'"
      class="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-3"
    >
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-ink text-surface" aria-hidden="true">
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="7" y="2" width="6" height="5" rx="1.5" />
          <rect x="1.5" y="13" width="6" height="5" rx="1.5" />
          <rect x="12.5" y="13" width="6" height="5" rx="1.5" />
          <path d="M10 7v3M10 10H4.5v3M10 10h5.5v3" />
        </svg>
      </div>
      <div class="min-w-0">
        <h1 class="text-base font-semibold tracking-tight text-ink">
          Giga Corp <span class="font-normal text-ink-secondary">· Org chart</span>
        </h1>
        <p class="cursor-help text-xs text-ink-muted" :title="timingTitle()">
          {{ org.totals.people.toLocaleString() }} people · computed in {{ Math.round(timings.totalMs) }} ms
        </p>
      </div>
      <nav class="flex rounded-control bg-canvas p-0.5" aria-label="Views">
        <button
          type="button"
          class="rounded-[6px] px-3 py-1 text-xs font-medium transition-colors duration-[120ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          :class="activeTab === 'chart' ? 'bg-surface text-accent shadow-card' : 'text-ink-secondary hover:text-ink'"
          :aria-pressed="activeTab === 'chart'"
          @click="activeTab = 'chart'"
        >Org chart</button>
        <button
          type="button"
          class="rounded-[6px] px-3 py-1 text-xs font-medium transition-colors duration-[120ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          :class="activeTab === 'analytics' ? 'bg-surface text-accent shadow-card' : 'text-ink-secondary hover:text-ink'"
          :aria-pressed="activeTab === 'analytics'"
          @click="activeTab = 'analytics'"
        >Cost analytics</button>
      </nav>
      <div class="ml-auto">
        <SearchBar ref="searchBar" :nodes="org.nodes" @pick="revealPerson" />
      </div>
    </header>

    <main class="relative flex min-h-0 flex-1 flex-col">
      <div v-if="status === 'loading'" class="flex flex-1 flex-col items-center justify-center" aria-label="Loading">
        <div class="flex flex-col items-center">
          <div class="skeleton h-28 w-60"></div>
          <div class="h-5 w-px bg-line-strong"></div>
          <div class="flex gap-5">
            <div v-for="n in 4" :key="n" class="skeleton h-28 w-44"></div>
          </div>
        </div>
        <p class="mt-6 text-[13px] text-ink-muted">Loading 40,000 people…</p>
      </div>

      <div v-else-if="status === 'error'" class="flex flex-1 items-center justify-center p-6">
        <div class="max-w-md rounded-card border border-line bg-surface p-4 text-sm text-ink">
          <p class="font-semibold">Could not load the org data.</p>
          <p class="mt-1 text-ink-secondary">{{ error }}</p>
        </div>
      </div>

      <template v-else>
        <template v-if="activeTab === 'chart'">
          <OrgListView v-if="isNarrow" ref="listView" :org="org" :state="chartState" />
          <OrgChartView v-else ref="chartView" :org="org" :state="chartState" />
        </template>
        <AnalyticsView v-else :org="org" />

        <Transition name="panel">
          <OrgDetailPanel
            v-if="activeTab === 'chart' && chartState.selectedId.value"
            :org="org"
            :selected-id="chartState.selectedId.value"
            @close="closePanel"
            @jump="revealPerson"
          />
        </Transition>
      </template>
    </main>
  </div>
</template>
