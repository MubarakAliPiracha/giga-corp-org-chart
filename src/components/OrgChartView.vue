<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch, nextTick } from 'vue'
import OrgNode from './OrgNode.vue'
import { visibleNodeIds } from '../lib/visible.js'

const props = defineProps({
  org: { type: Object, required: true },
  state: { type: Object, required: true },
})

const viewport = ref(null)
const content = ref(null)
const transform = ref({ x: 0, y: 0, k: 1 })

const clampScale = value => Math.min(2.5, Math.max(0.05, value))

// --- pan (drag) ---
let dragging = false
let moved = false
let start = null

const onPointerDown = event => {
  if (event.button !== 0) return
  dragging = true
  moved = false
  start = { x: event.clientX, y: event.clientY, tx: transform.value.x, ty: transform.value.y }
}

const onPointerMove = event => {
  if (!dragging) return
  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  // 4px threshold so clicking a card button never turns into a pan
  if (!moved && Math.hypot(dx, dy) < 4) return
  if (!moved) {
    moved = true
    viewport.value.setPointerCapture(event.pointerId)
  }
  transform.value = { ...transform.value, x: start.tx + dx, y: start.ty + dy }
}

const onPointerUp = () => {
  dragging = false
}

// --- zoom to cursor (wheel) ---
const onWheel = event => {
  event.preventDefault()
  const current = transform.value
  const factor = Math.exp(-event.deltaY * 0.0015)
  const k = clampScale(current.k * factor)
  const rect = viewport.value.getBoundingClientRect()
  const cx = event.clientX - rect.left
  const cy = event.clientY - rect.top
  transform.value = {
    k,
    x: cx - (k / current.k) * (cx - current.x),
    y: cy - (k / current.k) * (cy - current.y),
  }
}

// --- fit and reset ---
const PADDING = 32

const fit = () => {
  const viewportRect = viewport.value.getBoundingClientRect()
  // offsetWidth/Height ignore the CSS transform: the content's natural size.
  const width = content.value.offsetWidth
  const height = content.value.offsetHeight
  if (width === 0 || height === 0) return
  const k = clampScale(Math.min(
    (viewportRect.width - PADDING) / width,
    (viewportRect.height - PADDING) / height,
    1.25,
  ))
  transform.value = {
    k,
    x: (viewportRect.width - width * k) / 2,
    y: Math.max((viewportRect.height - height * k) / 2, PADDING / 2),
  }
}

const reset = () => {
  const viewportRect = viewport.value.getBoundingClientRect()
  transform.value = {
    k: 1,
    x: (viewportRect.width - content.value.offsetWidth) / 2,
    y: PADDING / 2,
  }
}

const centerOn = async id => {
  await nextTick()
  const card = content.value.querySelector('[data-node-id="' + id + '"]')
  if (!card) return
  const viewportRect = viewport.value.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()
  const current = transform.value
  transform.value = {
    ...current,
    x: current.x + viewportRect.left + viewportRect.width / 2 - (cardRect.left + cardRect.width / 2),
    y: current.y + viewportRect.top + viewportRect.height / 3 - (cardRect.top + cardRect.height / 2),
  }
}

defineExpose({ centerOn, fit, reset })

// --- controls ---
const expandLevel = () => {
  props.state.expandLevel(props.org.nodes, props.state.selectedId.value || props.org.rootId)
}

const collapseAll = () => {
  props.state.collapseAll(props.org.rootId)
}

const select = id => {
  props.state.selectedId.value = props.state.selectedId.value === id ? null : id
}

provide('orgChart', {
  nodes: props.org.nodes,
  isExpanded: props.state.isExpanded,
  toggle: props.state.toggle,
  select,
  selectedId: props.state.selectedId,
  highlightedId: props.state.highlightedId,
})

const visibleCount = computed(() =>
  visibleNodeIds(props.org.nodes, props.state.expandedIds.value, props.org.rootId).length)

// Dev-only gate: rendered card count must equal the visible-node computation
// (and therefore never 40,000 with a collapsed tree).
if (import.meta.env.DEV) {
  watch(
    () => props.state.expandedIds.value,
    async () => {
      await nextTick()
      const rendered = content.value ? content.value.querySelectorAll('[data-card]').length : 0
      console.assert(
        rendered === visibleCount.value,
        'card count mismatch: rendered ' + rendered + ' != visible ' + visibleCount.value,
      )
    },
    { immediate: true },
  )
}

onMounted(() => {
  viewport.value.addEventListener('wheel', onWheel, { passive: false })
  reset()
})

onBeforeUnmount(() => {
  if (viewport.value) viewport.value.removeEventListener('wheel', onWheel)
})
</script>

<template>
  <div class="relative flex-1 overflow-hidden">
    <div class="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
      <button type="button" class="toolbar-btn" @click="fit">Fit</button>
      <button type="button" class="toolbar-btn" @click="reset">Reset</button>
      <button type="button" class="toolbar-btn" :title="'Expands one more level under ' + (state.selectedId.value ? 'the selected person' : 'the CEO')" @click="expandLevel">Expand level</button>
      <button type="button" class="toolbar-btn" @click="collapseAll">Collapse all</button>
      <span class="self-center rounded-full bg-white/80 px-2.5 py-1 text-[11px] text-slate-500 shadow-sm">{{ visibleCount.toLocaleString() }} cards</span>
    </div>

    <div
      ref="viewport"
      class="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div
        ref="content"
        class="w-max origin-top-left pb-10 pt-6"
        :style="{ transform: 'translate(' + transform.x + 'px,' + transform.y + 'px) scale(' + transform.k + ')' }"
      >
        <OrgNode :id="org.rootId" />
      </div>
    </div>
  </div>
</template>
