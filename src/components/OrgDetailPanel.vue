<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { money, moneyFull, count, ratioFull, stripEmoji, initials } from '../lib/format.js'
import { themeFor } from '../lib/colors.js'
import { ancestorIds } from '../lib/search.js'

const props = defineProps({
  org: { type: Object, required: true },
  selectedId: { type: String, required: true },
})

const emit = defineEmits(['close', 'jump'])

const node = computed(() => props.org.nodes.get(props.selectedId))
const person = computed(() => node.value.person)
const metrics = computed(() => node.value.metrics)
const theme = computed(() => themeFor(person.value.department))
const isManager = computed(() => metrics.value.directReports > 0)

const chain = computed(() =>
  ancestorIds(props.org.nodes, props.selectedId)
    .map(id => ({ id, name: props.org.nodes.get(id).person.name })))

const facts = computed(() => [
  ['Department', person.value.department],
  ['Location', person.value.location],
  ['Level', String(person.value.level)],
  ['Entity', person.value.entity],
  ['Performance', stripEmoji(person.value.performance)],
  ['Start date', person.value.startDate],
])

const onKeydown = event => {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <aside
    class="fixed inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto overscroll-contain rounded-t-card border-t border-line bg-surface shadow-lift md:absolute md:inset-x-auto md:inset-y-0 md:right-0 md:z-20 md:max-h-none md:w-80 md:rounded-none md:border-l md:border-t-0"
    aria-label="Person details"
  >
    <div class="sticky top-0 flex items-start gap-3 border-b border-line bg-surface p-4">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
        :style="{ background: theme.tint, color: theme.strong }"
        aria-hidden="true"
      >{{ initials(person.name) }}</span>
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-base font-semibold text-ink">{{ person.name }}</h2>
        <p class="truncate text-[13px] text-ink-secondary">{{ person.title }}</p>
      </div>
      <button
        type="button"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-[120ms] hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Close details"
        @click="emit('close')"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="space-y-5 p-4">
      <nav v-if="chain.length > 0" aria-label="Reporting chain" class="text-xs leading-5">
        <template v-for="crumb in chain" :key="crumb.id">
          <button
            type="button"
            class="text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            @click="emit('jump', crumb.id)"
          >{{ crumb.name }}</button>
          <span class="mx-1 text-ink-muted" aria-hidden="true">/</span>
        </template>
        <span class="text-ink-secondary">{{ person.name }}</span>
      </nav>

      <dl class="grid grid-cols-2 gap-x-3 gap-y-2">
        <template v-for="[label, value] in facts" :key="label">
          <div>
            <dt class="text-xs text-ink-muted">{{ label }}</dt>
            <dd class="truncate text-[13px] font-medium text-ink" :title="value">{{ value }}</dd>
          </div>
        </template>
      </dl>

      <div>
        <h3 class="text-xs font-medium uppercase tracking-wide text-ink-muted">Compensation</h3>
        <dl class="mt-2 space-y-1.5">
          <div class="flex justify-between gap-2">
            <dt class="text-[13px] text-ink-secondary">Salary</dt>
            <dd class="text-[13px] font-medium text-ink">{{ moneyFull(person.salary) }}</dd>
          </div>
          <div v-if="person.bonus > 0" class="flex justify-between gap-2">
            <dt class="text-[13px] text-ink-secondary">Bonus</dt>
            <dd class="text-[13px] font-medium text-ink">{{ moneyFull(person.bonus) }}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 class="text-xs font-medium uppercase tracking-wide text-ink-muted">Team metrics</h3>
        <dl class="mt-2 space-y-1.5">
          <div class="flex justify-between gap-2">
            <dt class="text-[13px] text-ink-secondary">Direct reports</dt>
            <dd class="text-[13px] font-medium text-ink">{{ count(metrics.directReports) }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-[13px] text-ink-secondary">Descendants</dt>
            <dd class="text-[13px] font-medium text-ink">{{ count(metrics.descendants) }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-[13px] text-ink-secondary">Managers below</dt>
            <dd class="text-[13px] font-medium text-ink">{{ count(metrics.nonLeafDescendants) }}</dd>
          </div>
          <template v-if="isManager">
            <div class="flex justify-between gap-2">
              <dt class="text-[13px] text-ink-secondary">Management cost</dt>
              <dd class="text-[13px] font-medium text-ink">{{ moneyFull(metrics.managementCost) }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-[13px] text-ink-secondary">IC cost</dt>
              <dd class="text-[13px] font-medium text-ink">{{ moneyFull(metrics.icCost) }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-[13px] text-ink-secondary">Total cost</dt>
              <dd class="text-[13px] font-semibold text-ink">{{ moneyFull(metrics.totalCost) }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-[13px] text-ink-secondary">Management cost ratio</dt>
              <dd class="text-[13px] font-medium text-ink">{{ ratioFull(metrics.managementCostRatio) }}</dd>
            </div>
            <p class="pt-1 text-xs leading-5 text-ink-muted">
              Management cost ratio = management cost / total cost, over this person's
              descendants only (the person themselves is excluded).
            </p>
          </template>
        </dl>
      </div>

      <p v-if="isManager" class="text-xs text-ink-muted">
        Team salary at a glance: {{ money(metrics.managementCost) }} management ·
        {{ money(metrics.icCost) }} ICs · {{ money(metrics.totalCost) }} total.
      </p>
    </div>
  </aside>
</template>
