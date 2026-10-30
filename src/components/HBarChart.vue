<script setup>
import { computed } from 'vue'
import { money, moneyFull, ratioFull } from '../lib/format.js'

const props = defineProps({
  title: { type: String, required: true },
  // rows: [{ label, values: [n] (single) or [mgmt, ic] (stacked), hint }]
  rows: { type: Array, required: true },
  series: { type: Array, required: true }, // [{ name, color }]
  format: { type: String, default: 'money' }, // 'money' | 'ratio'
  takeaway: { type: String, default: '' },
  note: { type: String, default: '' },
  // Non-zero baseline (single-series only): bars span axisMin..max so small
  // differences stay readable. The axis row makes the baseline explicit.
  axisMin: { type: Number, default: 0 },
})

const totalOf = row => row.values.reduce((acc, value) => acc + value, 0)
const max = computed(() => Math.max(...props.rows.map(totalOf), props.axisMin + 1e-9))

const widthPct = value =>
  Math.max(((value - props.axisMin) / (max.value - props.axisMin)) * 100, 0)

const short = value => (props.format === 'ratio' ? value.toFixed(2) : money(value))
const long = value => (props.format === 'ratio' ? ratioFull(value) : moneyFull(value))

const rowTitle = row =>
  row.label + ' — ' + props.series
    .map((entry, index) => entry.name + ': ' + long(row.values[index] || 0))
    .join(' · ')
</script>

<template>
  <figure class="rounded-card border border-line bg-surface p-4">
    <figcaption class="flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="text-sm font-semibold text-ink">{{ title }}</h3>
      <div v-if="series.length > 1" class="flex gap-3" aria-hidden="true">
        <span v-for="entry in series" :key="entry.name" class="flex items-center gap-1 text-xs text-ink-secondary">
          <span class="h-2.5 w-2.5 rounded-sm" :style="{ background: entry.color }"></span>{{ entry.name }}
        </span>
      </div>
    </figcaption>

    <div class="mt-3 space-y-1.5">
      <div
        v-for="row in rows"
        :key="row.label"
        class="-mx-1 grid grid-cols-[minmax(5rem,38%)_1fr_3.5rem] items-center gap-2 rounded-control px-1 py-px transition-colors duration-[120ms] hover:bg-canvas sm:grid-cols-[13rem_1fr_3.5rem]"
        :title="rowTitle(row)"
      >
        <span class="text-xs leading-4 text-ink-secondary sm:truncate" :title="row.label">{{ row.label }}</span>
        <span
          class="flex h-3 items-center overflow-hidden rounded-full bg-canvas"
          :style="{
            backgroundImage: 'linear-gradient(to left, #E8E6E1 1px, transparent 1px)',
            backgroundSize: '25% 100%',
          }"
        >
          <span
            v-for="(value, index) in row.values"
            :key="index"
            class="h-full"
            :style="{ width: widthPct(value) + '%', background: series[index].color }"
          ></span>
        </span>
        <span class="text-right text-xs font-medium text-ink">{{ short(totalOf(row)) }}</span>
      </div>
    </div>

    <div v-if="axisMin > 0" class="mt-1.5 grid grid-cols-[minmax(5rem,38%)_1fr_3.5rem] gap-2 sm:grid-cols-[13rem_1fr_3.5rem]">
      <span></span>
      <span class="flex justify-between text-[10px] text-ink-muted" aria-hidden="true">
        <span>{{ short(axisMin) }}</span>
        <span>{{ short(max) }}</span>
      </span>
      <span></span>
    </div>

    <p v-if="takeaway" class="mt-3 text-xs leading-5 text-ink-secondary">{{ takeaway }}</p>
    <p v-if="note" class="mt-1 text-xs text-ink-muted">{{ note }}</p>

    <details class="mt-2">
      <summary class="cursor-pointer text-xs text-ink-muted hover:text-ink-secondary">Data table</summary>
      <table class="mt-1 w-full text-left text-xs">
        <thead>
          <tr class="text-ink-muted">
            <th class="py-0.5 font-normal">Label</th>
            <th v-for="entry in series" :key="entry.name" class="py-0.5 text-right font-normal">{{ entry.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.label" class="border-t border-line text-ink-secondary hover:bg-canvas">
            <td class="py-0.5">{{ row.label }}</td>
            <td v-for="(entry, index) in series" :key="entry.name" class="py-0.5 text-right">
              {{ long(row.values[index] || 0) }}
            </td>
          </tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>
