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
})

const totalOf = row => row.values.reduce((acc, value) => acc + value, 0)
const max = computed(() => Math.max(...props.rows.map(totalOf), 1))

const short = value => (props.format === 'ratio' ? value.toFixed(2) : money(value))
const long = value => (props.format === 'ratio' ? ratioFull(value) : moneyFull(value))

const rowTitle = row =>
  row.label + ' — ' + props.series
    .map((entry, index) => entry.name + ': ' + long(row.values[index] || 0))
    .join(' · ')
</script>

<template>
  <figure class="rounded-xl border border-slate-200 bg-white p-4">
    <figcaption class="flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="text-sm font-semibold text-slate-800">{{ title }}</h3>
      <div v-if="series.length > 1" class="flex gap-3" aria-hidden="true">
        <span v-for="entry in series" :key="entry.name" class="flex items-center gap-1 text-[11px] text-slate-500">
          <span class="h-2.5 w-2.5 rounded-sm" :style="{ background: entry.color }"></span>{{ entry.name }}
        </span>
      </div>
    </figcaption>

    <div class="mt-3 space-y-1.5">
      <div
        v-for="row in rows"
        :key="row.label"
        class="-mx-1 grid grid-cols-[9rem_1fr_3.5rem] items-center gap-2 rounded px-1 py-px transition-colors hover:bg-slate-50"
        :title="rowTitle(row)"
      >
        <span class="truncate text-[11px] text-slate-600" :title="row.label">{{ row.label }}</span>
        <span class="flex h-3.5 items-center gap-px overflow-hidden rounded-[3px] bg-slate-100">
          <span
            v-for="(value, index) in row.values"
            :key="index"
            class="h-full"
            :style="{ width: (value / max) * 100 + '%', background: series[index].color }"
          ></span>
        </span>
        <span class="text-right text-[11px] font-medium tabular-nums text-slate-700">{{ short(totalOf(row)) }}</span>
      </div>
    </div>

    <p v-if="takeaway" class="mt-3 text-[11px] text-slate-500">{{ takeaway }}</p>
    <p v-if="note" class="mt-1 text-[10px] italic text-slate-500">{{ note }}</p>

    <details class="mt-2">
      <summary class="cursor-pointer text-[10px] text-slate-500 hover:text-slate-600">Data table</summary>
      <table class="mt-1 w-full text-left text-[11px]">
        <thead>
          <tr class="text-slate-500">
            <th class="py-0.5 font-normal">Label</th>
            <th v-for="entry in series" :key="entry.name" class="py-0.5 text-right font-normal">{{ entry.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.label" class="border-t border-slate-100 text-slate-600 hover:bg-slate-50">
            <td class="py-0.5">{{ row.label }}</td>
            <td v-for="(entry, index) in series" :key="entry.name" class="py-0.5 text-right tabular-nums">
              {{ long(row.values[index] || 0) }}
            </td>
          </tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>
