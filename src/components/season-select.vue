<script setup lang="ts">
import { computed } from 'vue'
import { seasonOptions, type SeasonFormat } from '../data/seasons'

const props = defineProps<{ format: SeasonFormat }>()
const startYear = defineModel<number>({ required: true })

const options = computed(() => seasonOptions(props.format))
</script>

<template>
  <select v-model.number="startYear" aria-label="Season" class="field label-caps px-2 py-1.5">
    <option v-for="option in options" :key="option.startYear" :value="option.startYear">
      {{ option.label }}
    </option>
  </select>
</template>
