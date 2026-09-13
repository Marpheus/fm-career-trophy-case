<script setup lang="ts">
import { computed } from 'vue'
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

const worldCups = computed(() => winsByCompetition.value.get(WORLD_CUP_ID)?.length ?? 0)
</script>

<template>
  <section class="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.5fr]">
    <div class="panel flex items-center gap-4 border-l-4 border-l-amber px-4 py-3">
      <span class="hazard h-12 w-2 shrink-0 opacity-70" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p class="label-caps text-xs text-bone/60">Nations conquered</p>
        <p class="led mt-0.5 text-4xl leading-none">
          {{ conqueredCount }}<span class="text-xl text-bone/35">/{{ leagueNations.size }}</span>
        </p>
      </div>
      <div class="h-1.5 w-24 shrink-0 self-end bg-ground">
        <div class="h-full bg-amber transition-all" :style="{ width: `${percent}%` }" />
      </div>
    </div>

    <div class="panel flex items-center gap-4 border-l-4 border-l-cyan px-4 py-3">
      <div class="min-w-0 flex-1">
        <p class="label-caps text-xs text-bone/60">Titles won</p>
        <p class="led-cyan mt-0.5 text-4xl leading-none">{{ wins.length }}</p>
      </div>
      <p class="label-caps shrink-0 self-end text-xs text-bone/45">{{ percent }}% of the world</p>
    </div>

    <div class="panel flex items-center gap-4 border-l-4 border-l-orange px-4 py-3">
      <div class="min-w-0 flex-1">
        <p class="label-caps text-xs text-bone/60">International</p>
        <p class="led-orange mt-0.5 text-4xl leading-none">
          {{ internationalWon
          }}<span class="text-xl text-bone/35">/{{ INTERNATIONAL.length }}</span>
        </p>
      </div>
      <p
        class="label-caps shrink-0 self-end text-xs"
        :class="worldCups ? 'text-amber' : 'text-bone/45'"
      >
        {{ worldCups ? `${worldCups}× World Cup` : 'No World Cup' }}
      </p>
    </div>

    <div class="panel px-4 py-3">
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
