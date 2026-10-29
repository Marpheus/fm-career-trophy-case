<script setup lang="ts">
import { computed, ref } from 'vue'
import AccountPanel from './components/account-panel.vue'
import ContinentalTrophies from './components/continental-trophies.vue'
import DataTransfer from './components/data-transfer.vue'
import InternationalTrophies from './components/international-trophies.vue'
import NationDrawer from './components/nation-drawer.vue'
import NationSearch from './components/nation-search.vue'
import ProfileBar from './components/profile-bar.vue'
import StatsStrip from './components/stats-strip.vue'
import TrophyTimeline from './components/trophy-timeline.vue'
import WorldMap from './components/world-map.vue'
import { useCareer } from './composables/use-career'

type View = 'clubs' | 'international' | 'timeline'

const {
  conqueredNations,
  internationalWinsByNation,
  winsForNation,
  isReadOnly,
  viewedUsername,
  profileStatus,
} = useCareer()

const view = ref<View>('clubs')
const selected = ref<string | null>(null)

const PROFILE_MESSAGES = {
  loading: 'Loading…',
  missing: 'No manager by that name.',
  error: 'This trophy case could not be loaded.',
} as const

const isContentShown = computed(() => !isReadOnly || profileStatus.value === 'ready')

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
    <!-- Phones stack it: title and account, then search, then backups. -->
    <header class="mb-5 flex flex-wrap items-center gap-3 border-b border-line pb-4">
      <span class="hazard h-9 w-2.5 shrink-0" aria-hidden="true" />
      <h1 class="font-display text-2xl tracking-wide sm:text-3xl">TROPHY CASE</h1>
      <span v-if="viewedUsername" class="label-caps text-sm text-amber">{{ viewedUsername }}</span>
      <ProfileBar v-if="isReadOnly" class="ml-auto sm:order-last sm:ml-0" />
      <AccountPanel v-else class="ml-auto min-w-0 sm:order-last sm:ml-0" />
      <NationSearch
        v-if="view === 'clubs' && isContentShown"
        class="w-full sm:ml-auto sm:w-48"
        @select="handleSelect"
      />
      <DataTransfer v-if="!isReadOnly" :class="view === 'clubs' ? '' : 'sm:ml-auto'" />
    </header>

    <p
      v-if="!isContentShown && profileStatus !== 'ready'"
      class="panel label-caps px-4 py-10 text-center text-sm text-bone/60"
    >
      {{ PROFILE_MESSAGES[profileStatus] }}
    </p>

    <template v-else>
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
              :international-wins="internationalWinsByNation"
              :selected="selected"
              :trophy-count="trophyCount"
              @select="handleSelect"
            />
            <div
              class="label-caps mt-2.5 flex flex-wrap items-center gap-4 text-[10px] text-bone/55"
            >
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
              <span class="flex items-center gap-1.5">
                <span class="text-sm leading-none text-orange">★</span>
                International trophy
              </span>
            </div>
          </div>

          <!-- Below lg it is a bottom sheet, so the map stays in view while logging titles. -->
          <NationDrawer
            v-if="selected"
            :code="selected"
            class="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:h-auto max-lg:max-h-[70dvh] max-lg:shadow-[0_-12px_32px_rgb(0_0_0/0.5)]"
            @close="selected = null"
          />
        </div>

        <ContinentalTrophies />
      </template>

      <InternationalTrophies v-else-if="view === 'international'" />

      <TrophyTimeline v-else />
    </template>
  </div>
</template>
