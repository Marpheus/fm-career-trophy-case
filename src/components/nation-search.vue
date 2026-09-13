<script setup lang="ts">
import { computed, ref } from 'vue'
import { NATIONS } from '../data/nations'
import { PLAYABLE_NATIONS } from '../data/playable'
import NationFlag from './nation-flag.vue'

const emit = defineEmits<{ select: [code: string] }>()

const query = ref('')
const isOpen = ref(false)

/** Only playable nations can be opened, so they are all this searches. */
const playable = computed(() => NATIONS.filter((nation) => PLAYABLE_NATIONS.has(nation.code)))

const results = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return []
  return playable.value.filter((nation) => nation.name.toLowerCase().includes(term)).slice(0, 8)
})

const handleSelect = (code: string) => {
  emit('select', code)
  query.value = ''
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <input
      v-model="query"
      type="search"
      placeholder="Find a nation…"
      aria-label="Find a nation"
      class="field label-caps w-full px-3 py-1.5 text-xs"
      @focus="isOpen = true"
      @keydown.esc="query = ''"
      @keydown.enter="results[0] && handleSelect(results[0].code)"
    />
    <ul v-if="isOpen && results.length" class="panel absolute z-30 mt-1 w-full p-1">
      <li v-for="nation in results" :key="nation.code">
        <button
          type="button"
          class="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-panel-lit"
          @mousedown.prevent="handleSelect(nation.code)"
        >
          <NationFlag :flag="nation.flag" :name="nation.name" />
          <span class="label-caps truncate">{{ nation.name }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
