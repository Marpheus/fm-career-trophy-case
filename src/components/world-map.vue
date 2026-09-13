<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { select } from 'd3-selection'
import { zoom as d3Zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import { MAP_HEIGHT, MAP_WIDTH, useWorldMap } from '../composables/use-world-map'
import { NATION_BY_CODE } from '../data/nations'
import { PLAYABLE_NATIONS } from '../data/playable'
import NationFlag from './nation-flag.vue'

const props = defineProps<{
  conquered: ReadonlySet<string>
  selected: string | null
  trophyCount: (code: string) => number
}>()

const emit = defineEmits<{ select: [code: string] }>()

const { shapes, dots, isLoading, loadError } = useWorldMap()

const svgRef = ref<SVGSVGElement | null>(null)
const scale = ref(1)
const transform = ref('')
const hovered = ref<string | null>(null)
const pointer = ref({ x: 0, y: 0 })

let behavior: ZoomBehavior<SVGSVGElement, unknown> | null = null

const hoveredNation = computed(() => (hovered.value ? NATION_BY_CODE.get(hovered.value) : null))
const isHoveredPlayable = computed(() => !!hovered.value && PLAYABLE_NATIONS.has(hovered.value))
const hoveredTrophies = computed(() => (hovered.value ? props.trophyCount(hovered.value) : 0))

const classFor = (code: string) => {
  const isPlayable = PLAYABLE_NATIONS.has(code)
  const isWon = props.conquered.has(code)
  return [
    'map-target stroke-ocean transition-colors duration-150',
    isPlayable ? 'cursor-pointer' : 'cursor-default',
    props.selected === code ? 'stroke-amber stroke-[2.5]' : '',
    isWon ? 'lit fill-amber hover:fill-orange' : '',
    isPlayable && !isWon ? 'fill-playable hover:fill-cyan' : '',
    isPlayable ? '' : 'fill-dormant',
  ]
}

const handleSelect = (code: string) => {
  if (!PLAYABLE_NATIONS.has(code)) return
  emit('select', code)
}

const handleEnter = (code: string, event: MouseEvent) => {
  hovered.value = code
  pointer.value = { x: event.clientX, y: event.clientY }
}

const handleMove = (event: MouseEvent) => {
  pointer.value = { x: event.clientX, y: event.clientY }
  // Shapes have no mouseleave of their own, so moving onto open ocean would otherwise
  // leave the last nation's tooltip hanging there.
  const tag = (event.target as Element).tagName
  if (tag !== 'path' && tag !== 'circle') hovered.value = null
}

const handleLeave = () => {
  hovered.value = null
}

const handleReset = () => {
  if (!svgRef.value || !behavior) return
  select(svgRef.value).call(behavior.transform, zoomIdentity)
}

onMounted(() => {
  if (!svgRef.value) return
  behavior = d3Zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 14])
    .translateExtent([
      [0, 0],
      [MAP_WIDTH, MAP_HEIGHT],
    ])
    .on('zoom', (event: { transform: ZoomTransform }) => {
      transform.value = event.transform.toString()
      scale.value = event.transform.k
    })
  select(svgRef.value).call(behavior).on('dblclick.zoom', null)
})

onBeforeUnmount(() => {
  if (svgRef.value) select(svgRef.value).on('.zoom', null)
})
</script>

<template>
  <div class="panel relative overflow-hidden bg-ocean">
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`"
      class="block w-full touch-none select-none"
      role="img"
      aria-label="World map of conquered nations"
      @mousemove="handleMove"
      @mouseleave="handleLeave"
    >
      <g :transform="transform">
        <path
          v-for="shape in shapes"
          :key="shape.code"
          :d="shape.d"
          :class="classFor(shape.code)"
          stroke-width="0.7"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
          :tabindex="PLAYABLE_NATIONS.has(shape.code) ? 0 : -1"
          :role="PLAYABLE_NATIONS.has(shape.code) ? 'button' : 'presentation'"
          :aria-label="NATION_BY_CODE.get(shape.code)?.name ?? shape.code"
          @click="handleSelect(shape.code)"
          @keydown.enter="handleSelect(shape.code)"
          @mouseenter="handleEnter(shape.code, $event)"
        />
        <circle
          v-for="dot in dots"
          :key="dot.code"
          :cx="dot.x"
          :cy="dot.y"
          :r="(PLAYABLE_NATIONS.has(dot.code) ? 4.2 : 2.6) / scale"
          :class="classFor(dot.code)"
          :stroke-width="1.1 / scale"
          :tabindex="PLAYABLE_NATIONS.has(dot.code) ? 0 : -1"
          :role="PLAYABLE_NATIONS.has(dot.code) ? 'button' : 'presentation'"
          :aria-label="NATION_BY_CODE.get(dot.code)?.name ?? dot.code"
          @click="handleSelect(dot.code)"
          @keydown.enter="handleSelect(dot.code)"
          @mouseenter="handleEnter(dot.code, $event)"
        />
      </g>
    </svg>

    <div v-if="isLoading" class="label-caps absolute inset-0 grid place-items-center text-sm">
      Loading the world…
    </div>
    <div
      v-else-if="loadError"
      class="label-caps absolute inset-0 grid place-items-center text-sm text-orange"
    >
      Could not load map data ({{ loadError }})
    </div>

    <button
      v-if="scale > 1"
      type="button"
      class="btn absolute top-3 right-3 px-3 py-1 text-xs"
      @click="handleReset"
    >
      Reset view
    </button>

    <div
      v-if="hoveredNation"
      class="panel pointer-events-none border-l-4 border-l-amber fixed z-50 flex items-center gap-2 px-2.5 py-1.5 text-sm"
      :style="{ left: `${pointer.x + 16}px`, top: `${pointer.y + 16}px` }"
    >
      <NationFlag :flag="hoveredNation.flag" :name="hoveredNation.name" />
      <span class="label-caps">{{ hoveredNation.name }}</span>
      <span v-if="!isHoveredPlayable" class="label-caps text-xs text-bone/40">not playable</span>
      <span v-else-if="hoveredTrophies" class="led text-sm">×{{ hoveredTrophies }}</span>
    </div>
  </div>
</template>
