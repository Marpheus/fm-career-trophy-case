<script setup lang="ts">
import { ref } from 'vue'

const isCopied = ref(false)

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
  } catch {
    return // clipboard blocked; the address bar still has the link
  }
  isCopied.value = true
  setTimeout(() => (isCopied.value = false), 2000)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button type="button" class="btn px-3 py-1.5 text-xs" @click="handleCopy">
      {{ isCopied ? 'Link copied' : 'Copy link' }}
    </button>
    <a href="/" class="btn px-3 py-1.5 text-xs">Your own trophy case</a>
  </div>
</template>
