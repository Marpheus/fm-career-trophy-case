<script setup lang="ts">
import { computed } from 'vue'
import { CLUB_CONFEDERATIONS, CONTINENTAL } from '../data/competitions'
import { useCareer } from '../composables/use-career'
import TrophyRow from './trophy-row.vue'

const { winsByCompetition, addWin, removeWin } = useCareer()

const groups = computed(() =>
  CLUB_CONFEDERATIONS.map((confederation) => ({
    confederation,
    competitions: CONTINENTAL.filter((c) => c.confederation === confederation).sort(
      (a, b) => a.rank - b.rank,
    ),
  })).filter((group) => group.competitions.length > 0),
)

const winsFor = (competitionId: string) => winsByCompetition.value.get(competitionId) ?? []

const wonCount = (confederation: string) =>
  CONTINENTAL.filter((c) => c.confederation === confederation && winsFor(c.id).length).length
</script>

<template>
  <section>
    <h2 class="label-caps mb-3 flex items-center gap-3 text-sm text-bone/70">
      <span class="hazard h-3 w-8 opacity-70" aria-hidden="true" />
      Continental cups
    </h2>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="group in groups" :key="group.confederation" class="panel p-3">
        <header class="mb-2 flex items-baseline justify-between border-b border-line pb-2">
          <h3 class="label-caps text-sm">{{ group.confederation }}</h3>
          <span class="font-display text-sm tabular-nums text-bone/55">
            {{ wonCount(group.confederation) }}/{{ group.competitions.length }}
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
            @add="addWin"
            @remove="removeWin"
          />
        </ul>
      </div>
    </div>
  </section>
</template>
