<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { LEAGUE_BY_NATION } from '../data/competitions'
import { CONFEDERATION_REGIONS, NATION_BY_CODE } from '../data/nations'
import { useCareer } from '../composables/use-career'
import { useEntryDefaults } from '../composables/use-entry-defaults'
import { seasonLabel } from '../data/seasons'
import NationFlag from './nation-flag.vue'
import SeasonSelect from './season-select.vue'

const props = defineProps<{ code: string }>()
const emit = defineEmits<{ close: [] }>()

const { winsByCompetition, addWin, removeWin } = useCareer()
const { lastStartYear, lastClub, remember } = useEntryDefaults()

const startYear = ref(lastStartYear.value)
const club = ref('')
const clubInput = ref<HTMLInputElement | null>(null)

const nation = computed(() => NATION_BY_CODE.get(props.code) ?? null)
const league = computed(() => LEAGUE_BY_NATION.get(props.code) ?? null)
const titles = computed(() =>
  league.value ? (winsByCompetition.value.get(league.value.id) ?? []) : [],
)

watch(
  () => props.code,
  async () => {
    startYear.value = lastStartYear.value
    club.value = lastClub.value
    await nextTick()
    clubInput.value?.focus()
    clubInput.value?.select()
  },
  { immediate: true },
)

const handleSubmit = () => {
  if (!league.value || !club.value.trim()) return
  addWin({
    competitionId: league.value.id,
    season: seasonLabel(startYear.value, league.value.seasonFormat),
    club: club.value,
  })
  remember(startYear.value, club.value)
  // Most saves add consecutive titles, so step to the next season ready for the next one.
  startYear.value += 1
  clubInput.value?.focus()
}
</script>

<template>
  <aside class="panel flex h-full flex-col overflow-hidden">
    <header
      class="flex items-center gap-3 border-b border-line bg-panel-lit px-4 py-3"
      :class="titles.length ? 'border-l-4 border-l-amber' : 'border-l-4 border-l-line'"
    >
      <NationFlag v-if="nation" :flag="nation.flag" :name="nation.name" class="w-8" />
      <div class="min-w-0 flex-1">
        <h2 class="label-caps truncate text-lg leading-tight">{{ nation?.name ?? code }}</h2>
        <p class="label-caps text-[10px] text-bone/45">
          {{
            nation ? `${nation.confederation} · ${CONFEDERATION_REGIONS[nation.confederation]}` : ''
          }}
        </p>
      </div>
      <button
        type="button"
        class="btn size-6 shrink-0 text-sm leading-none"
        aria-label="Close nation panel"
        @click="emit('close')"
      >
        ✕
      </button>
    </header>

    <div v-if="league" class="min-h-0 flex-1 overflow-y-auto p-4">
      <p class="label-caps text-[10px] text-bone/45">Top division</p>
      <p class="mt-0.5 font-display text-2xl" :class="titles.length ? 'text-amber' : 'text-bone'">
        {{ league.name }}
      </p>
      <p class="label-caps mt-1 text-xs text-bone/50">
        {{
          titles.length ? `${titles.length} title${titles.length > 1 ? 's' : ''}` : 'Not won yet'
        }}
      </p>

      <form class="mt-4 flex items-center gap-1.5" @submit.prevent="handleSubmit">
        <SeasonSelect v-model="startYear" :format="league.seasonFormat" class="w-28 text-sm" />
        <input
          ref="clubInput"
          v-model="club"
          placeholder="Club"
          aria-label="Club"
          class="field min-w-0 flex-1 px-2 py-1.5 text-sm"
        />
        <button type="submit" class="btn px-3 py-1.5 text-xs">Add</button>
      </form>

      <ul v-if="titles.length" class="mt-4 space-y-1">
        <li
          v-for="title in titles"
          :key="title.id"
          class="group flex items-center gap-2 border-l-4 border-l-amber bg-ground/45 px-2.5 py-1.5 text-sm"
        >
          <span class="font-display tabular-nums text-amber">{{ title.season }}</span>
          <span class="truncate text-bone/70">{{ title.club }}</span>
          <button
            type="button"
            class="ml-auto text-bone/40 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:text-orange"
            :aria-label="`Remove ${title.season} title`"
            @click="removeWin(title.id)"
          >
            ✕
          </button>
        </li>
      </ul>
    </div>

    <p v-else class="label-caps flex-1 p-6 text-center text-xs text-bone/50">
      No league defined for this nation.
    </p>
  </aside>
</template>
