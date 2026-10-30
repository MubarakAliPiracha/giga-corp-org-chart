<script setup>
import { computed, ref } from 'vue'
import { costByDimension, spanOfControl, byLevel, ratioByDepartment } from '../lib/analytics.js'
import { money, moneyFull, count, ratio } from '../lib/format.js'
import HBarChart from './HBarChart.vue'
import ColumnChart from './ColumnChart.vue'

const props = defineProps({
  org: { type: Object, required: true },
})

// Validated two-series pair (dataviz palette, light surface):
const MGMT_COLOR = '#2a78d6'
const IC_COLOR = '#eb6834'

const dimension = ref('department')
const split = ref(true)

const DIMENSIONS = [
  { key: 'department', label: 'Department' },
  { key: 'location', label: 'Location' },
  { key: 'entity', label: 'Entity' },
]

const rootId = props.org.rootId
const nodes = props.org.nodes
const rootMetrics = nodes.get(rootId).metrics
const ceo = nodes.get(rootId).person

// Each aggregation is a cached computed over the markRaw'd model — computed
// once per input change, never per render, and tree metrics are reused as-is.
const costData = computed(() => costByDimension(nodes, dimension.value, rootId))
const spanData = computed(() => spanOfControl(nodes))
const levelData = computed(() => byLevel(nodes))
const ratioData = computed(() => ratioByDepartment(nodes, rootId))

const ceoNote = 'Excludes the CEO (' + ceo.name + ', ' + money(ceo.salary) + ' salary outlier).'

const costRows = computed(() =>
  costData.value.rows.map(row => ({
    label: row.label,
    values: split.value ? [row.management, row.ic] : [row.total],
  })))

const costSeries = computed(() =>
  split.value
    ? [{ name: 'Management', color: MGMT_COLOR }, { name: 'IC', color: IC_COLOR }]
    : [{ name: 'Total cost', color: MGMT_COLOR }])

const costTakeaway = computed(() => {
  const rows = costData.value.rows
  const sum = rows.reduce((acc, row) => acc + row.total, 0)
  const top = rows[0]
  return top.label + ' carries the largest cost at ' + money(top.total) +
    ' — ' + Math.round((top.total / sum) * 100) + '% of non-CEO payroll.'
})

const spanRows = computed(() => spanData.value.rows.map(row => ({ label: row.label, value: row.managers })))
const spanTakeaway = computed(() => {
  const { singleReport, managers } = spanData.value
  return count(singleReport) + ' of ' + count(managers) + ' managers (' +
    Math.round((singleReport / managers) * 100) + '%) have exactly one direct report — a classic consolidation flag.'
})

const levelCostRows = computed(() => levelData.value.map(row => ({ label: row.label, value: row.cost })))
const levelHeadRows = computed(() => levelData.value.map(row => ({ label: row.label, value: row.headcount })))
const levelTakeaway = computed(() => {
  const byCost = [...levelData.value].sort((a, b) => b.cost - a.cost)[0]
  const byHeads = [...levelData.value].sort((a, b) => b.headcount - a.headcount)[0]
  return 'Cost peaks at level ' + byCost.level + ' (' + money(byCost.cost) +
    '); headcount peaks at level ' + byHeads.level + ' (' + count(byHeads.headcount) + ' people).'
})

const ratioRows = computed(() => ratioData.value.map(row => ({ label: row.label, values: [row.ratio] })))
const ratioTakeaway = computed(() => {
  const top = ratioData.value[0]
  const bottom = ratioData.value[ratioData.value.length - 1]
  return top.label + ' spends the largest share of payroll on managers (' + ratio(top.ratio) +
    '); ' + bottom.label + ' the smallest (' + ratio(bottom.ratio) + ').'
})

const tiles = computed(() => [
  {
    label: 'Total payroll (below CEO)',
    value: money(rootMetrics.totalCost),
    hint: moneyFull(rootMetrics.totalCost) + ' — sum of all 39,999 descendants of the CEO',
  },
  {
    label: 'Managers / ICs',
    value: count(spanData.value.managers) + ' / ' + count(40000 - spanData.value.managers),
    hint: 'People with at least one direct report vs none',
  },
  {
    label: 'Managers with 1 report',
    value: count(spanData.value.singleReport),
    hint: Math.round((spanData.value.singleReport / spanData.value.managers) * 100) + '% of all managers',
  },
  {
    label: 'Org management cost ratio',
    value: ratio(rootMetrics.managementCostRatio),
    hint: 'Management cost / total cost across everyone below the CEO',
  },
])
</script>

<template>
  <div class="flex-1 overflow-y-auto overscroll-contain p-4">
    <div class="mx-auto grid max-w-6xl gap-4">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="tile in tiles" :key="tile.label" class="rounded-xl border border-slate-200 bg-white p-4" :title="tile.hint">
          <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">{{ tile.label }}</p>
          <p class="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">{{ tile.value }}</p>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="mr-auto text-sm font-semibold text-slate-800">Cost by</h2>
          <div class="flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Group costs by">
            <button
              v-for="entry in DIMENSIONS"
              :key="entry.key"
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              :class="dimension === entry.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              :aria-pressed="dimension === entry.key"
              @click="dimension = entry.key"
            >{{ entry.label }}</button>
          </div>
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            :class="split ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'"
            :aria-pressed="split"
            @click="split = !split"
          >Mgmt vs IC split</button>
        </div>
        <HBarChart
          class="mt-2 border-0 p-0"
          :title="''"
          :rows="costRows"
          :series="costSeries"
          :takeaway="costTakeaway"
          :note="ceoNote"
        />
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <ColumnChart
          title="Span of control — direct reports per manager"
          :rows="spanRows"
          :color="MGMT_COLOR"
          x-label="Direct reports"
          :takeaway="spanTakeaway"
        />
        <ColumnChart
          title="Headcount by level"
          :rows="levelHeadRows"
          :color="MGMT_COLOR"
          x-label="Level"
          :takeaway="levelTakeaway"
        />
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <ColumnChart
          title="Salary cost by level"
          :rows="levelCostRows"
          format="money"
          :color="MGMT_COLOR"
          x-label="Level"
          note="Level 1 is the CEO alone ($20.0M outlier, labelled rather than hidden)."
        />
        <HBarChart
          title="Management cost ratio by department, ranked"
          :rows="ratioRows"
          :series="[{ name: 'Mgmt cost ratio', color: MGMT_COLOR }]"
          format="ratio"
          :takeaway="ratioTakeaway"
          :note="ceoNote"
        />
      </div>
    </div>
  </div>
</template>
