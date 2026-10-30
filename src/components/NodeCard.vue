<script setup>
import { computed } from 'vue'
import { money, moneyFull, count, ratio, ratioFull, initials } from '../lib/format.js'
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

const costTitle = computed(() =>
  'Total cost ' + moneyFull(metrics.value.totalCost) +
  ' · management cost ratio ' + ratioFull(metrics.value.managementCostRatio) +
  ' — click for all metrics')
</script>

<template>
  <article
    data-card
    :data-node-id="node.person.id"
    class="relative w-60 cursor-pointer rounded-card border border-line bg-surface pt-7 shadow-card transition-[box-shadow,transform] duration-[120ms] hover:-translate-y-px hover:shadow-lift"
    :class="[
      selected ? 'ring-2 ring-accent' : '',
      highlighted ? 'ring-2 ring-amber-400' : '',
    ]"
    :style="{ borderTop: '3px solid ' + theme.strong }"
    @click="emit('select', node.person.id)"
  >
    <span
      class="absolute -top-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full text-[13px] font-semibold ring-4 ring-surface"
      :style="{ background: theme.tint, color: theme.strong }"
      aria-hidden="true"
    >{{ initials(person.name) }}</span>

    <div class="px-3 pb-4 text-center">
      <h3 class="truncate text-sm font-semibold text-ink" :title="person.name">{{ person.name }}</h3>
      <p class="truncate text-xs text-ink-secondary" :title="person.title">{{ person.title }}</p>

      <div class="mt-2 flex justify-center">
        <span class="max-w-full truncate rounded-full border border-line bg-canvas px-2 py-0.5 text-xs text-ink-secondary">{{ person.department }}</span>
      </div>

      <p v-if="isManager" class="mt-2.5 border-t border-line pt-2 text-[13px] text-ink-secondary" :title="costTitle">
        Total <span class="font-medium text-ink">{{ money(metrics.totalCost) }}</span>
        · ratio <span class="font-medium text-ink">{{ ratio(metrics.managementCostRatio) }}</span>
      </p>
      <p v-else class="mt-2.5 border-t border-line pt-2 text-[13px] text-ink-secondary" :title="moneyFull(person.salary)">
        Salary <span class="font-medium text-ink">{{ money(person.salary) }}</span>
      </p>
    </div>

    <button
      v-if="isManager"
      type="button"
      class="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-canvas px-2.5 py-0.5 text-xs font-medium text-ink-secondary shadow-card transition-colors duration-[120ms] hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      :aria-expanded="expanded"
      :aria-label="(expanded ? 'Collapse' : 'Expand') + ' ' + person.name + ': ' + metrics.directReports + ' direct reports, ' + count(metrics.descendants) + ' descendants'"
      :title="metrics.directReports + ' direct / ' + count(metrics.descendants) + ' total descendants'"
      @click.stop="emit('toggle', node.person.id)"
    >
      {{ metrics.directReports }} / {{ count(metrics.descendants) }}
      <svg class="h-2.5 w-2.5 transition-transform duration-[160ms]" :class="expanded ? 'rotate-180' : ''" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </article>
</template>
