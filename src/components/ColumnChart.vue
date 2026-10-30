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
  <figure class="rounded-card border border-line bg-surface p-4">
    <figcaption>
      <h3 class="text-sm font-semibold text-ink">{{ title }}</h3>
    </figcaption>

    <div class="mt-3 flex h-40 items-end justify-around gap-2">
      <div
        v-for="row in rows"
        :key="row.label"
        class="flex h-full w-full max-w-10 flex-col items-center justify-end rounded-control transition-colors duration-[120ms] hover:bg-canvas"
        :title="props.xLabel + ' ' + row.label + ': ' + long(row.value)"
      >
        <span class="mb-0.5 text-[10px] font-medium text-ink-secondary">{{ short(row.value) }}</span>
        <span
          class="w-full rounded-t-[4px]"
          :style="{ height: Math.max((row.value / max) * 100, 1) + '%', background: color }"
        ></span>
      </div>
    </div>
    <div class="mt-1 flex justify-around gap-2 border-t border-line pt-1">
      <span v-for="row in rows" :key="row.label" class="w-full max-w-10 text-center text-[10px] text-ink-muted">{{ row.label }}</span>
    </div>
    <p v-if="xLabel" class="mt-0.5 text-center text-[10px] text-ink-muted">{{ xLabel }}</p>

    <p v-if="takeaway" class="mt-2 text-xs leading-5 text-ink-secondary">{{ takeaway }}</p>
    <p v-if="note" class="mt-1 text-xs text-ink-muted">{{ note }}</p>

    <details class="mt-2">
      <summary class="cursor-pointer text-xs text-ink-muted hover:text-ink-secondary">Data table</summary>
      <table class="mt-1 w-full text-left text-xs">
        <tbody>
          <tr v-for="row in rows" :key="row.label" class="border-t border-line text-ink-secondary hover:bg-canvas">
            <td class="py-0.5">{{ xLabel }} {{ row.label }}</td>
            <td class="py-0.5 text-right">{{ long(row.value) }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>
