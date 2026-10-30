<script setup>
import { computed, inject } from 'vue'
import { money, count, initials } from '../lib/format.js'
import { themeFor } from '../lib/colors.js'

const props = defineProps({
  id: { type: String, required: true },
  depth: { type: Number, default: 0 },
})

const chart = inject('orgChart')

const node = computed(() => chart.nodes.get(props.id))
const person = computed(() => node.value.person)
const metrics = computed(() => node.value.metrics)
const expanded = computed(() => chart.isExpanded(props.id))
const isManager = computed(() => metrics.value.directReports > 0)
const theme = computed(() => themeFor(person.value.department))
</script>

<template>
  <li>
    <div
      :data-row-id="id"
      class="flex cursor-pointer items-center gap-2 border-b border-line py-1.5 pr-2 transition-colors duration-[120ms]"
      :class="[
        chart.highlightedId.value === id ? 'bg-amber-50' : '',
        chart.selectedId.value === id ? 'bg-canvas' : '',
      ]"
      :style="{ paddingLeft: depth * 1.25 + 0.5 + 'rem' }"
      @click="chart.select(id)"
    >
      <button
        v-if="isManager"
        type="button"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        :aria-expanded="expanded"
        :aria-label="(expanded ? 'Collapse' : 'Expand') + ' ' + person.name"
        @click.stop="chart.toggle(id)"
      >
        <svg class="h-3 w-3 transition-transform duration-[160ms]" :class="expanded ? 'rotate-90' : ''" viewBox="0 0 6 10" fill="none" aria-hidden="true">
          <path d="M1 1l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span v-else class="w-7 shrink-0"></span>

      <span
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
        :style="{ background: theme.tint, color: theme.strong }"
        aria-hidden="true"
      >{{ initials(person.name) }}</span>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-ink">{{ person.name }}</p>
        <p class="truncate text-xs text-ink-secondary">
          {{ person.title }} · {{ person.department }}
        </p>
      </div>

      <div class="shrink-0 text-right">
        <p class="text-[13px] font-semibold text-ink">
          {{ isManager ? money(metrics.totalCost) : money(person.salary) }}
        </p>
        <p v-if="isManager" class="text-[10px] text-ink-muted">
          {{ metrics.directReports }} / {{ count(metrics.descendants) }} · {{ count(metrics.nonLeafDescendants) }} mgrs
        </p>
      </div>
    </div>

    <ul v-if="expanded && node.childIds.length > 0">
      <OrgListNode v-for="childId in node.childIds" :key="childId" :id="childId" :depth="depth + 1" />
    </ul>
  </li>
</template>
