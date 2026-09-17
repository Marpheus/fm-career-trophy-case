<script setup lang="ts">
import { computed, ref } from 'vue'
import ContinentalTrophies from './components/continental-trophies.vue'
import DataTransfer from './components/data-transfer.vue'
import InternationalTrophies from './components/international-trophies.vue'
import NationDrawer from './components/nation-drawer.vue'
import NationSearch from './components/nation-search.vue'
import StatsStrip from './components/stats-strip.vue'
import TrophyTimeline from './components/trophy-timeline.vue'
import WorldMap from './components/world-map.vue'
import { useCareer } from './composables/use-career'

type View = 'clubs' | 'international' | 'timeline'

const { career, conqueredNations, winsForNation, renameCareer } = useCareer()

const view = ref<View>('clubs')
const selected = ref<string | null>(null)

const managerName = computed({
  get: () => career.value.manager,
  set: (value: string) => renameCareer(career.value.name, value),
})

const trophyCount = (code: string) => winsForNation(code).length

const handleSelect = (code: string) => {
  selected.value = selected.value === code ? null : code
}

const tabClass = (tab: View) => [
  'label-caps border-b-2 px-4 py-2 text-sm transition-colors',
  view.value === tab
    ? 'border-b-amber text-amber'
    : 'border-b-transparent text-bone/50 hover:text-bone',
]
</script>

<template>
  <div class="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
    <header class="mb-5 flex flex-wrap items-center gap-3 border-b border-line pb-4">
      <span class="hazard h-9 w-2.5 shrink-0" aria-hidden="true" />
      <h1 class="font-display text-3xl tracking-wide">TROPHY CASE</h1>
      <input
        v-model="managerName"
        placeholder="Manager"
        aria-label="Manager name"
        class="field label-caps w-36 px-2.5 py-1 text-xs"
      />
      <div class="ml-auto flex items-center gap-2">
        <NationSearch v-if="view === 'clubs'" class="w-48" @select="handleSelect" />
        <DataTransfer />
      </div>
    </header>

    <StatsStrip class="mb-5" />

    <nav class="mb-5 flex gap-1 border-b border-line" aria-label="Views">
      <button type="button" :class="tabClass('clubs')" @click="view = 'clubs'">Clubs</button>
      <button type="button" :class="tabClass('international')" @click="view = 'international'">
        International
      </button>
      <button type="button" :class="tabClass('timeline')" @click="view = 'timeline'">
        Timeline
      </button>
    </nav>

    <template v-if="view === 'clubs'">
      <div class="mb-8 grid gap-4" :class="selected ? 'lg:grid-cols-[1fr_360px]' : ''">
        <div>
          <WorldMap
            :conquered="conqueredNations"
            :selected="selected"
            :trophy-count="trophyCount"
            @select="handleSelect"
          />
          <div class="label-caps mt-2.5 flex flex-wrap items-center gap-4 text-[10px] text-bone/55">
            <span class="flex items-center gap-1.5">
              <span class="inline-block size-3 bg-amber" />
              League won
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block size-3 bg-playable" />
              Playable, not yet
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block size-3 bg-dormant" />
              Not playable
            </span>
            <span class="ml-auto text-bone/35">
              Scroll to zoom · drag to pan · dots are micro-nations
            </span>
          </div>
        </div>

        <NationDrawer v-if="selected" :code="selected" @close="selected = null" />
      </div>

      <ContinentalTrophies />
    </template>

    <InternationalTrophies v-else-if="view === 'international'" />

    <TrophyTimeline v-else />

    <footer class="label-caps mt-10 border-t border-line pt-4 text-center text-[10px] text-bone/40">
      Saved in this browser only — use Export regularly
    </footer>
  </div>
</template>
