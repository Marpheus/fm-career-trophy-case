<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { Win } from '../types'
import { useEntryDefaults } from '../composables/use-entry-defaults'
import { seasonLabel, type SeasonFormat } from '../data/seasons'
import SeasonSelect from './season-select.vue'

const props = withDefaults(
  defineProps<{
    competitionId: string
    name: string
    label?: string
    wins: readonly Win[]
    seasonFormat: SeasonFormat
    teamLabel?: string
    tone?: 'default' | 'hero'
  }>(),
  { teamLabel: 'Club', tone: 'default' },
)

const emit = defineEmits<{
  add: [payload: { competitionId: string; season: string; club: string }]
  remove: [winId: string]
}>()

const { lastStartYear, lastClub, remember } = useEntryDefaults()

const isAdding = ref(false)
const startYear = ref(lastStartYear.value)
const club = ref('')
const clubInput = ref<HTMLInputElement | null>(null)

const handleOpen = async () => {
  startYear.value = lastStartYear.value
  club.value = props.teamLabel === 'Club' ? lastClub.value : ''
  isAdding.value = true
  await nextTick()
  clubInput.value?.focus()
  clubInput.value?.select()
}

const handleSubmit = () => {
  if (!club.value.trim()) return
  emit('add', {
    competitionId: props.competitionId,
    season: seasonLabel(startYear.value, props.seasonFormat),
    club: club.value,
  })
  if (props.teamLabel === 'Club') remember(startYear.value, club.value)
  isAdding.value = false
}
</script>

<template>
  <li
    class="border-l-4 bg-ground/45 px-3 transition-colors"
    :class="[wins.length ? 'border-l-amber' : 'border-l-line', tone === 'hero' ? 'py-3' : 'py-2']"
  >
    <div class="flex items-center gap-2.5">
      <div class="min-w-0 flex-1">
        <p
          class="truncate"
          :class="[
            tone === 'hero' ? 'font-display text-xl' : 'label-caps text-sm',
            wins.length ? 'text-amber' : 'text-bone/85',
          ]"
        >
          {{ name }}
        </p>
        <p v-if="label" class="label-caps text-[10px] text-bone/40">{{ label }}</p>
      </div>
      <span v-if="wins.length" class="led text-sm">×{{ wins.length }}</span>
      <button
        type="button"
        class="btn size-6 shrink-0 text-sm leading-none"
        :aria-label="`Add a win for ${name}`"
        @click="handleOpen"
      >
        +
      </button>
    </div>

    <ul v-if="wins.length" class="mt-1.5 space-y-0.5">
      <li v-for="win in wins" :key="win.id" class="group flex items-center gap-2 text-xs">
        <span class="font-display tabular-nums text-amber/85">{{ win.season }}</span>
        <span class="truncate text-bone/65">{{ win.club }}</span>
        <button
          type="button"
          class="ml-auto text-bone/40 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:text-orange"
          :aria-label="`Remove ${win.season} ${name}`"
          @click="emit('remove', win.id)"
        >
          ✕
        </button>
      </li>
    </ul>

    <form v-if="isAdding" class="mt-2 flex items-center gap-1.5" @submit.prevent="handleSubmit">
      <SeasonSelect v-model="startYear" :format="seasonFormat" class="w-24 text-xs" />
      <input
        ref="clubInput"
        v-model="club"
        :placeholder="teamLabel"
        :aria-label="teamLabel"
        class="field min-w-0 flex-1 px-2 py-1 text-xs"
        @keydown.esc="isAdding = false"
      />
      <button type="submit" class="btn px-2.5 py-1 text-xs">Save</button>
    </form>
  </li>
</template>
