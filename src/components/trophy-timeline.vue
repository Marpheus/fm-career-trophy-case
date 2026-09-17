<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTimeline, type TimelineEntry, type TrophyKind } from '../composables/use-timeline'
import NationFlag from './nation-flag.vue'

type SortOrder = 'newest' | 'oldest'

const { seasons } = useTimeline()

const order = ref<SortOrder>('newest')

const ordered = computed(() =>
  order.value === 'newest' ? [...seasons.value].reverse() : seasons.value,
)

const trophyCount = computed(() =>
  seasons.value.reduce((total, season) => total + season.entries.length, 0),
)

const handleToggleOrder = () => {
  order.value = order.value === 'newest' ? 'oldest' : 'newest'
}

/** Amber leagues, cyan continental, orange international - the colours used everywhere else. */
const ACCENTS: Readonly<Record<TrophyKind, { border: string; text: string; dot: string }>> = {
  league: { border: 'border-l-amber', text: 'text-amber', dot: 'bg-amber' },
  continental: { border: 'border-l-cyan', text: 'text-cyan', dot: 'bg-cyan' },
  international: { border: 'border-l-orange', text: 'text-orange', dot: 'bg-orange' },
}

const KIND_LABELS: Readonly<Record<TrophyKind, string>> = {
  league: 'League',
  continental: 'Continental',
  international: 'International',
}

const tagFor = (entry: TimelineEntry): string =>
  entry.kind === 'league'
    ? (entry.nation?.name ?? entry.confederation)
    : `${entry.confederation} · ${KIND_LABELS[entry.kind]}`
</script>

<template>
  <section>
    <header class="mb-4 flex flex-wrap items-center gap-3">
      <span class="hazard h-3 w-8 opacity-70" aria-hidden="true" />
      <h2 class="label-caps text-sm text-bone/70">Career timeline</h2>
      <p v-if="trophyCount" class="label-caps text-xs text-bone/40">
        {{ trophyCount }} {{ trophyCount === 1 ? 'trophy' : 'trophies' }} · {{ seasons.length }}
        {{ seasons.length === 1 ? 'season' : 'seasons' }}
      </p>
      <button
        v-if="seasons.length > 1"
        type="button"
        class="btn ml-auto px-2.5 py-1 text-xs"
        :aria-label="`Sort seasons ${order === 'newest' ? 'oldest' : 'newest'} first`"
        @click="handleToggleOrder"
      >
        {{ order === 'newest' ? 'Newest first' : 'Oldest first' }}
      </button>
    </header>

    <p v-if="!seasons.length" class="panel px-4 py-8 text-center text-sm text-bone/50">
      No trophies yet. Win something and it lands here.
    </p>

    <ol v-else>
      <li
        v-for="season in ordered"
        :key="season.startYear"
        class="relative border-l border-line pb-6 pl-6 last:border-l-transparent last:pb-0"
      >
        <span
          class="absolute -left-[7px] top-1.5 size-3.5 rotate-45 border border-amber bg-ground"
          aria-hidden="true"
        />
        <div class="flex items-baseline gap-2.5">
          <h3 class="led text-2xl leading-none">{{ season.startYear }}</h3>
          <span class="label-caps text-[10px] text-bone/40">
            {{ season.entries.length }} {{ season.entries.length === 1 ? 'trophy' : 'trophies' }}
          </span>
        </div>

        <ul class="mt-2.5 space-y-1.5">
          <li
            v-for="entry in season.entries"
            :key="entry.win.id"
            class="panel flex items-center gap-2.5 border-l-4 px-3 py-2"
            :class="ACCENTS[entry.kind].border"
          >
            <NationFlag
              v-if="entry.nation"
              :flag="entry.nation.flag"
              :name="entry.nation.name"
              class="w-5"
            />
            <span
              v-else
              class="inline-block size-2 shrink-0 rotate-45"
              :class="ACCENTS[entry.kind].dot"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <p class="label-caps truncate text-sm" :class="ACCENTS[entry.kind].text">
                {{ entry.competitionName }}
              </p>
              <p class="truncate text-xs text-bone/60">{{ entry.win.club }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="font-display text-sm tabular-nums text-bone/80">{{ entry.win.season }}</p>
              <p class="label-caps text-[10px] text-bone/35">{{ tagFor(entry) }}</p>
            </div>
          </li>
        </ul>
      </li>
    </ol>
  </section>
</template>
