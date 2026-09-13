<script setup lang="ts">
defineProps<{ flag: string; name: string }>()

const base = import.meta.env.BASE_URL
</script>

<template>
  <img
    v-if="flag"
    :src="`${base}flags/${flag}.svg`"
    :alt="`${name} flag`"
    class="inline-block aspect-[4/3] w-5 shrink-0 border border-line object-cover"
    loading="lazy"
  />
</template>
