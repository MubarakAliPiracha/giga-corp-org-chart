<script setup>
import { computed, ref } from 'vue'
import { costByDimension, spanOfControl, byLevel, ratioByDepartment } from '../lib/analytics.js'
import { money, moneyFull, count, ratio } from '../lib/format.js'
import HBarChart from './HBarChart.vue'
import ColumnChart from './ColumnChart.vue'

const props = defineProps({
  org: { type: Object, required: true },
})

// Chart tones come from the design tokens: ink-ish for management, its light
// tint for ICs. Never default library blue/orange.
const MGMT_COLOR = '#5F5E5A'
const IC_COLOR = '#D6D3CD'

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
const totals = props.org.totals

// Each aggregation is a cached computed over the markRaw'd model — computed
// once per input change, never per render, and tree metrics are reused as-is.
const costData = computed(() => costByDimension(nodes, dimension.value, rootId))
const spanData = computed(() => spanOfControl(nodes))
const levelData = computed(() => byLevel(nodes))
const ratioData = computed(() => ratioByDepartment(nodes, rootId))

const ceoNote = 'Excludes the CEO (' + ceo.name + ', ' + money(ceo.salary) + ' salary outlier).'

const dimensionLabel = computed(() =>
  DIMENSIONS.find(entry => entry.key === dimension.value).label.toLowerCase())

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
  const rowTotals = costData.value.rows.map(row => row.total)
  const maxTotal = Math.max(...rowTotals)
  const minTotal = Math.min(...rowTotals)
  const spread = Math.round(((maxTotal - minTotal) / minTotal) * 100)
  const word = dimensionLabel.value
  return word.charAt(0).toUpperCase() + word.slice(1) +
    ' costs are within ' + spread + '% of each other (min ' + money(minTotal) +
    ', max ' + money(maxTotal) + ').'
})

const spanRows = computed(() => spanData.value.rows.map(row => ({ label: row.label, value: row.managers })))
const spanTakeaway = computed(() => {
  const { singleReport, managers } = spanData.value
  return count(singleReport) + ' of ' + count(managers) + ' managers (' +
    Math.round((singleReport / managers) * 100) + '%) have exactly one direct report — a classic consolidation flag.'
})

const levelCostRows = computed(() => levelData.value.map(row => ({ label: row.label, value: row.cost })))
const levelHeadRows = computed(() => levelData.value.map(row => ({ label: row.label, value: row.headcount })))
const levelHeadTakeaway = computed(() => {
  const byHeads = [...levelData.value].sort((a, b) => b.headcount - a.headcount)[0]
  return 'Headcount peaks at level ' + byHeads.level + ' with ' + count(byHeads.headcount) + ' people.'
})
const levelCostTakeaway = computed(() => {
  const byCost = [...levelData.value].sort((a, b) => b.cost - a.cost)[0]
  return 'Salary cost peaks at level ' + byCost.level + ' at ' + money(byCost.cost) + '.'
})

const ratioRows = computed(() => ratioData.value.map(row => ({ label: row.label, values: [row.ratio] })))
const ratioAxisMin = computed(() => {
  const min = Math.min(...ratioData.value.map(row => row.ratio))
  return Math.max(0, Math.floor((min - 0.005) * 100) / 100)
})
const ratioTakeaway = computed(() => {
  const top = ratioData.value[0]
  const bottom = ratioData.value[ratioData.value.length - 1]
  return top.label + ' spends the largest share of payroll on managers (' + ratio(top.ratio) +
    '); ' + bottom.label + ' the smallest (' + ratio(bottom.ratio) + ').'
})

const avgSpan = computed(() => ((totals.people - 1) / spanData.value.managers).toFixed(1))

const tiles = computed(() => [
  {
    label: 'Total payroll (below CEO)',
    value: money(rootMetrics.totalCost),
    context: 'Salaries of all ' + count(totals.people - 1) + ' people below the CEO',
    hint: moneyFull(rootMetrics.totalCost),
  },
  {
    label: 'Managers / ICs',
    value: count(spanData.value.managers) + ' / ' + count(totals.people - spanData.value.managers),
    context: Math.round((spanData.value.managers / totals.people) * 100) + '% of the org manages at least one person',
    hint: 'People with at least one direct report vs none',
  },
  {
    label: 'Avg span of control',
    value: avgSpan.value,
    context: count(totals.people - 1) + ' direct reports across ' + count(spanData.value.managers) + ' managers',
    hint: 'Total direct reports / number of managers',
  },
  {
    label: 'Org management cost ratio',
    value: ratio(rootMetrics.managementCostRatio),
    context: (rootMetrics.managementCostRatio * 100).toFixed(1) + '% of payroll is management',
    hint: 'Management cost / total cost across everyone below the CEO',
  },
])
</script>

<template>
  <div class="flex-1 overflow-y-auto overscroll-contain p-4">
    <div class="mx-auto grid max-w-6xl gap-4">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="tile in tiles" :key="tile.label" class="rounded-card border border-line bg-surface p-4" :title="tile.hint">
          <p class="text-xs text-ink-muted">{{ tile.label }}</p>
          <p class="mt-1.5 text-[28px] font-semibold leading-8 text-ink">{{ tile.value }}</p>
          <p class="mt-1 text-xs leading-4 text-ink-secondary">{{ tile.context }}</p>
        </div>
      </div>

      <HBarChart
        title="Management cost ratio by department, ranked"
        :rows="ratioRows"
        :series="[{ name: 'Mgmt cost ratio', color: MGMT_COLOR }]"
        format="ratio"
        :axis-min="ratioAxisMin"
        :takeaway="ratioTakeaway"
        :note="ceoNote + ' Axis starts at ' + ratioAxisMin.toFixed(2) + ', not 0, so differences stay readable.'"
      />

      <div class="rounded-card border border-line bg-surface p-4">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="mr-auto text-sm font-semibold text-ink">Cost by {{ dimensionLabel }}</h2>
          <div class="flex rounded-control bg-canvas p-0.5" role="group" aria-label="Group costs by">
            <button
              v-for="entry in DIMENSIONS"
              :key="entry.key"
              type="button"
              class="rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors duration-[120ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              :class="dimension === entry.key ? 'bg-surface text-accent shadow-card' : 'text-ink-secondary hover:text-ink'"
              :aria-pressed="dimension === entry.key"
              @click="dimension = entry.key"
            >{{ entry.label }}</button>
          </div>
          <button
            type="button"
            class="rounded-control border border-line px-2.5 py-1 text-xs font-medium transition-colors duration-[120ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            :class="split ? 'border-accent text-accent' : 'text-ink-secondary hover:text-ink'"
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
          :takeaway="levelHeadTakeaway"
        />
        <ColumnChart
          title="Salary cost by level"
          :rows="levelCostRows"
          format="money"
          :color="MGMT_COLOR"
          x-label="Level"
          :takeaway="levelCostTakeaway"
          note="Level 1 is the CEO alone ($20.0M outlier, labelled rather than hidden)."
        />
      </div>
    </div>
  </div>
</template>
