<script setup lang="ts">
import { computed } from 'vue'
import { COMPETITIONS, CONTINENTAL } from '../data/competitions'
import { INTERNATIONAL, WORLD_CUP_ID } from '../data/international'
import { NATION_BY_CODE, NATION_CONFEDERATIONS } from '../data/nations'
import { PLAYABLE_NATIONS } from '../data/playable'
import type { NationConfederation } from '../types'
import { useCareer } from '../composables/use-career'

const { wins, conqueredNations, winsByCompetition } = useCareer()

/** Only nations with a playable league can be conquered, so they are the denominator. */
const leagueNations = PLAYABLE_NATIONS

const byConfederation = computed(() => {
  const totals = new Map<NationConfederation, { total: number; won: number }>()
  for (const code of leagueNations) {
    const confederation = NATION_BY_CODE.get(code)?.confederation
    if (!confederation) continue
    const entry = totals.get(confederation) ?? { total: 0, won: 0 }
    entry.total += 1
    if (conqueredNations.value.has(code)) entry.won += 1
    totals.set(confederation, entry)
  }
  return NATION_CONFEDERATIONS.filter((name) => totals.has(name)).map((name) => ({
    confederation: name,
    ...totals.get(name)!,
  }))
})

const conqueredCount = computed(
  () => [...conqueredNations.value].filter((code) => leagueNations.has(code)).length,
)

const percent = computed(() => Math.round((conqueredCount.value / leagueNations.size) * 100))

const internationalWon = computed(
  () => INTERNATIONAL.filter((competition) => winsByCompetition.value.has(competition.id)).length,
)

const CLUB_COMPETITION_IDS: ReadonlySet<string> = new Set(
  [...COMPETITIONS, ...CONTINENTAL].map((competition) => competition.id),
)

/**
 * Club titles only - national team trophies have their own counter. Wins of competitions
 * since dropped from the data (the Club World Cup) no longer count.
 */
const clubTitles = computed(
  () => wins.value.filter((win) => CLUB_COMPETITION_IDS.has(win.competitionId)).length,
)

const CARD = [
  'panel flex flex-col items-start gap-1.5 border-l-4 px-2.5 py-2',
  'sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-3',
]
const CARD_LABEL = 'label-caps text-[10px] leading-tight text-bone/60 sm:text-xs'
const CARD_NOTE = 'label-caps shrink-0 text-[10px] leading-tight sm:self-end sm:text-xs'

const worldCups = computed(() => winsByCompetition.value.get(WORLD_CUP_ID)?.length ?? 0)
</script>

<template>
  <!-- Phones fit the three counters side by side, each stacked, with the table below. -->
  <section class="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-[1fr_1fr_1fr_1.5fr]">
    <div :class="CARD" class="border-l-amber">
      <span class="hazard hidden h-12 w-2 shrink-0 opacity-70 sm:block" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p :class="CARD_LABEL">Nations conquered</p>
        <p class="led mt-0.5 text-3xl leading-none sm:text-4xl">
          {{ conqueredCount }}<span class="text-xl text-bone/35">/{{ leagueNations.size }}</span>
        </p>
      </div>
      <div class="h-1.5 w-full shrink-0 bg-ground sm:w-24 sm:self-end">
        <div class="h-full bg-amber transition-all" :style="{ width: `${percent}%` }" />
      </div>
    </div>

    <div :class="CARD" class="border-l-cyan">
      <div class="min-w-0 flex-1">
        <p :class="CARD_LABEL">Titles won</p>
        <p class="led-cyan mt-0.5 text-3xl leading-none sm:text-4xl">{{ clubTitles }}</p>
      </div>
      <p :class="CARD_NOTE" class="text-bone/45">{{ percent }}% of the world</p>
    </div>

    <div :class="CARD" class="border-l-orange">
      <div class="min-w-0 flex-1">
        <p :class="CARD_LABEL">International</p>
        <p class="led-orange mt-0.5 text-3xl leading-none sm:text-4xl">
          {{ internationalWon
          }}<span class="text-xl text-bone/35">/{{ INTERNATIONAL.length }}</span>
        </p>
      </div>
      <p :class="[CARD_NOTE, worldCups ? 'text-amber' : 'text-bone/45']">
        {{ worldCups ? `${worldCups}× World Cup` : 'No World Cup' }}
      </p>
    </div>

    <div class="panel col-span-3 px-4 py-3 lg:col-span-1">
      <p class="label-caps mb-2 text-xs text-bone/60">By confederation</p>
      <ul class="grid gap-x-5 gap-y-1 sm:grid-cols-2">
        <li
          v-for="row in byConfederation"
          :key="row.confederation"
          class="flex items-center gap-2 text-xs"
        >
          <span class="label-caps w-20 shrink-0 text-bone/80">{{ row.confederation }}</span>
          <span class="h-1.5 flex-1 bg-ground">
            <span
              class="block h-full bg-amber/80"
              :style="{ width: `${(row.won / row.total) * 100}%` }"
            />
          </span>
          <span class="w-10 shrink-0 text-right font-display tabular-nums text-bone/70">
            {{ row.won }}/{{ row.total }}
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>
