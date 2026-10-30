<script setup>
import { computed } from 'vue'
import { money, moneyFull, count, ratio, ratioFull, stripEmoji, initials } from '../lib/format.js'
import { themeFor } from '../lib/colors.js'

const props = defineProps({
  node: { type: Object, required: true },
  expanded: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  highlighted: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'select'])

const person = computed(() => props.node.person)
const metrics = computed(() => props.node.metrics)
const theme = computed(() => themeFor(person.value.department))
const isManager = computed(() => metrics.value.directReports > 0)

const ratioTitle = computed(() =>
  'Management cost ratio = management cost / total cost = ' +
  moneyFull(metrics.value.managementCost) + ' / ' + moneyFull(metrics.value.totalCost) +
  ' = ' + ratioFull(metrics.value.managementCostRatio) +
  '. Costs cover descendants only (this person excluded).')
</script>

<template>
  <article
    data-card
    :data-node-id="node.person.id"
    class="relative w-60 cursor-pointer rounded-xl border bg-white pt-7 shadow-sm transition-shadow hover:shadow-md"
    :class="[
      theme.card,
      selected ? 'ring-2 ring-slate-700' : '',
      highlighted ? 'ring-4 ring-amber-400 shadow-lg' : '',
    ]"
    @click="emit('select', node.person.id)"
  >
    <span
      class="absolute -top-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full text-sm font-semibold text-white shadow ring-4 ring-white"
      :class="theme.avatar"
      aria-hidden="true"
    >{{ initials(person.name) }}</span>

    <div class="px-3 pb-3 text-center">
      <h3 class="truncate text-sm font-semibold text-slate-900" :title="person.name">{{ person.name }}</h3>
      <p class="truncate text-xs text-slate-500" :title="person.title">{{ person.title }}</p>
      <p class="mt-0.5 text-[10px] text-slate-400">{{ stripEmoji(person.performance) }}</p>

      <div class="mt-2 flex flex-wrap justify-center gap-1">
        <span class="rounded-full px-2 py-0.5 text-[10px] font-medium" :class="theme.chip">{{ person.department }}</span>
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{{ person.location }}</span>
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">Level {{ person.level }}</span>
      </div>

      <dl v-if="isManager" class="mt-2.5 space-y-1 border-t border-slate-900/10 pt-2 text-left text-[11px]">
        <div class="flex justify-between gap-2" :title="moneyFull(metrics.managementCost)">
          <dt class="text-slate-500">Management cost</dt>
          <dd class="font-medium tabular-nums text-slate-800">{{ money(metrics.managementCost) }}</dd>
        </div>
        <div class="flex justify-between gap-2" :title="moneyFull(metrics.icCost)">
          <dt class="text-slate-500">IC cost</dt>
          <dd class="font-medium tabular-nums text-slate-800">{{ money(metrics.icCost) }}</dd>
        </div>
        <div class="flex justify-between gap-2" :title="moneyFull(metrics.totalCost)">
          <dt class="text-slate-500">Total cost</dt>
          <dd class="font-semibold tabular-nums text-slate-900">{{ money(metrics.totalCost) }}</dd>
        </div>
        <div class="flex justify-between gap-2" :title="ratioTitle">
          <dt class="border-b border-dotted border-slate-400 text-slate-500">Mgmt ratio</dt>
          <dd class="font-medium tabular-nums text-slate-800">{{ ratio(metrics.managementCostRatio) }}</dd>
        </div>
        <div class="flex justify-between gap-2" :title="count(metrics.nonLeafDescendants) + ' of the ' + count(metrics.descendants) + ' people below are managers'">
          <dt class="text-slate-500">Managers below</dt>
          <dd class="font-medium tabular-nums text-slate-800">{{ count(metrics.nonLeafDescendants) }}</dd>
        </div>
      </dl>

      <dl v-else class="mt-2.5 border-t border-slate-900/10 pt-2 text-left text-[11px]">
        <div class="flex justify-between gap-2" :title="moneyFull(person.salary)">
          <dt class="text-slate-500">Salary</dt>
          <dd class="font-medium tabular-nums text-slate-800">{{ money(person.salary) }}</dd>
        </div>
      </dl>
    </div>

    <button
      v-if="isManager"
      type="button"
      class="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow transition-colors hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-1"
      :aria-expanded="expanded"
      :aria-label="(expanded ? 'Collapse' : 'Expand') + ' ' + person.name + ': ' + metrics.directReports + ' direct reports, ' + count(metrics.descendants) + ' descendants'"
      :title="metrics.directReports + ' direct / ' + count(metrics.descendants) + ' total descendants'"
      @click.stop="emit('toggle', node.person.id)"
    >
      {{ metrics.directReports }} / {{ count(metrics.descendants) }}
      <svg class="h-2.5 w-2.5 transition-transform" :class="expanded ? 'rotate-180' : ''" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </article>
</template>
