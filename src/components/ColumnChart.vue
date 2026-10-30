<script setup>
import { computed } from 'vue'
import { money, moneyFull, count } from '../lib/format.js'

const props = defineProps({
  title: { type: String, required: true },
  rows: { type: Array, required: true }, // [{ label, value }]
  format: { type: String, default: 'number' }, // 'number' | 'money'
  color: { type: String, required: true },
  xLabel: { type: String, default: '' },
  takeaway: { type: String, default: '' },
  note: { type: String, default: '' },
})

const max = computed(() => Math.max(...props.rows.map(row => row.value), 1))
const short = value => (props.format === 'money' ? money(value) : count(value))
const long = value => (props.format === 'money' ? moneyFull(value) : count(value))
</script>

<template>
  <figure class="rounded-xl border border-slate-200 bg-white p-4">
    <figcaption>
      <h3 class="text-sm font-semibold text-slate-800">{{ title }}</h3>
    </figcaption>

    <div class="mt-3 flex h-40 items-end justify-around gap-2">
      <div
        v-for="row in rows"
        :key="row.label"
        class="flex h-full w-full max-w-10 flex-col items-center justify-end rounded transition-colors hover:bg-slate-50"
        :title="props.xLabel + ' ' + row.label + ': ' + long(row.value)"
      >
        <span class="mb-0.5 text-[10px] font-medium tabular-nums text-slate-600">{{ short(row.value) }}</span>
        <span
          class="w-full rounded-t-[3px]"
          :style="{ height: Math.max((row.value / max) * 100, 1) + '%', background: color }"
        ></span>
      </div>
    </div>
    <div class="mt-1 flex justify-around gap-2 border-t border-slate-100 pt-1">
      <span v-for="row in rows" :key="row.label" class="w-full max-w-10 text-center text-[10px] text-slate-500">{{ row.label }}</span>
    </div>
    <p v-if="xLabel" class="mt-0.5 text-center text-[10px] text-slate-500">{{ xLabel }}</p>

    <p v-if="takeaway" class="mt-2 text-[11px] text-slate-500">{{ takeaway }}</p>
    <p v-if="note" class="mt-1 text-[10px] italic text-slate-500">{{ note }}</p>

    <details class="mt-2">
      <summary class="cursor-pointer text-[10px] text-slate-500 hover:text-slate-600">Data table</summary>
      <table class="mt-1 w-full text-left text-[11px]">
        <tbody>
          <tr v-for="row in rows" :key="row.label" class="border-t border-slate-100 text-slate-600 hover:bg-slate-50">
            <td class="py-0.5">{{ xLabel }} {{ row.label }}</td>
            <td class="py-0.5 text-right tabular-nums">{{ long(row.value) }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>
