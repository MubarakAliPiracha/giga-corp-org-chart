<script setup>
import { watch, ref } from 'vue'
import { useOrgData } from './composables/useOrgData.js'
import { useOrgChartState } from './composables/useOrgChartState.js'
import { useMediaQuery } from './composables/useMediaQuery.js'
import { ancestorIds } from './lib/search.js'
import OrgChartView from './components/OrgChartView.vue'
import AnalyticsView from './components/AnalyticsView.vue'
import OrgListView from './components/OrgListView.vue'
import SearchBar from './components/SearchBar.vue'

const { status, error, org, timings } = useOrgData()
const chartState = useOrgChartState()
const chartView = ref(null)
const listView = ref(null)
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
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-800">
    <header v-if="status === 'ready'" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-3">
      <div class="min-w-0">
        <h1 class="text-lg font-semibold tracking-tight">Giga Corp · Org chart</h1>
        <p class="text-[11px] text-slate-500">
          {{ org.totals.people.toLocaleString() }} people ·
          {{ org.totals.managers.toLocaleString() }} managers ·
          {{ org.totals.leaves.toLocaleString() }} ICs ·
          computed in {{ Math.round(timings.totalMs) }} ms
          (parse {{ Math.round(timings.parseMs) }} · tree {{ Math.round(timings.buildMs) }} · metrics {{ Math.round(timings.computeMs) }})
        </p>
      </div>
      <nav class="flex rounded-lg border border-slate-200 p-0.5" aria-label="Views">
        <button
          type="button"
          class="rounded-md px-3 py-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          :class="activeTab === 'chart' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'"
          :aria-pressed="activeTab === 'chart'"
          @click="activeTab = 'chart'"
        >Org chart</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          :class="activeTab === 'analytics' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'"
          :aria-pressed="activeTab === 'analytics'"
          @click="activeTab = 'analytics'"
        >Cost analytics</button>
      </nav>
      <div class="ml-auto">
        <SearchBar :nodes="org.nodes" @pick="revealPerson" />
      </div>
    </header>

    <main class="flex min-h-0 flex-1 flex-col">
      <div v-if="status === 'loading'" class="flex flex-1 flex-col items-center justify-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
        <p class="text-sm text-slate-500">Loading 40,000 people…</p>
      </div>

      <div v-else-if="status === 'error'" class="flex flex-1 items-center justify-center p-6">
        <div class="max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p class="font-semibold">Could not load the org data.</p>
          <p class="mt-1">{{ error }}</p>
        </div>
      </div>

      <template v-else>
        <template v-if="activeTab === 'chart'">
          <OrgListView v-if="isNarrow" ref="listView" :org="org" :state="chartState" />
          <OrgChartView v-else ref="chartView" :org="org" :state="chartState" />
        </template>
        <AnalyticsView v-else :org="org" />
      </template>
    </main>
  </div>
</template>
