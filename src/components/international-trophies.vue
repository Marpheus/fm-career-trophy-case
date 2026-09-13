<script setup lang="ts">
import { computed } from 'vue'
import { INTERNATIONAL, INTERNATIONAL_CONFEDERATIONS, WORLD_CUP_ID } from '../data/international'
import { useCareer } from '../composables/use-career'
import TrophyRow from './trophy-row.vue'

const { winsByCompetition, addWin, removeWin } = useCareer()

const winsFor = (competitionId: string) => winsByCompetition.value.get(competitionId) ?? []

const worldCup = INTERNATIONAL.find((competition) => competition.id === WORLD_CUP_ID)!

const intercontinental = INTERNATIONAL.filter(
  (competition) => competition.confederation === 'FIFA' && competition.id !== WORLD_CUP_ID,
)

const groups = computed(() =>
  INTERNATIONAL_CONFEDERATIONS.map((confederation) => ({
    confederation,
    competitions: INTERNATIONAL.filter((c) => c.confederation === confederation).sort(
      (a, b) => a.rank - b.rank,
    ),
  })).filter((group) => group.competitions.length > 0),
)
</script>

<template>
  <div class="space-y-6">
    <section class="panel p-4">
      <header class="mb-3 flex flex-wrap items-center gap-3 border-b border-line pb-2">
        <span class="hazard h-3 w-8 opacity-70" aria-hidden="true" />
        <h2 class="label-caps text-sm text-bone/70">The big one</h2>
      </header>
      <ul class="grid gap-2 sm:grid-cols-2">
        <TrophyRow
          :competition-id="worldCup.id"
          :name="worldCup.name"
          label="Every four years"
          :wins="winsFor(worldCup.id)"
          :season-format="worldCup.seasonFormat"
          team-label="Nation"
          tone="hero"
          @add="addWin"
          @remove="removeWin"
        />
        <TrophyRow
          v-for="competition in intercontinental"
          :key="competition.id"
          :competition-id="competition.id"
          :name="competition.name"
          label="Intercontinental"
          :wins="winsFor(competition.id)"
          :season-format="competition.seasonFormat"
          team-label="Nation"
          tone="hero"
          @add="addWin"
          @remove="removeWin"
        />
      </ul>
    </section>

    <section>
      <h2 class="label-caps mb-3 flex items-center gap-3 text-sm text-bone/70">
        <span class="hazard h-3 w-8 opacity-70" aria-hidden="true" />
        Confederation trophies
      </h2>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="group in groups" :key="group.confederation" class="panel p-3">
          <header class="mb-2 flex items-baseline justify-between border-b border-line pb-2">
            <h3 class="label-caps text-sm">{{ group.confederation }}</h3>
            <span class="font-display text-sm tabular-nums text-bone/55">
              {{ group.competitions.filter((c) => winsFor(c.id).length).length }}/{{
                group.competitions.length
              }}
            </span>
          </header>
          <ul class="space-y-1.5">
            <TrophyRow
              v-for="competition in group.competitions"
              :key="competition.id"
              :competition-id="competition.id"
              :name="competition.name"
              :wins="winsFor(competition.id)"
              :season-format="competition.seasonFormat"
              team-label="Nation"
              @add="addWin"
              @remove="removeWin"
            />
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
