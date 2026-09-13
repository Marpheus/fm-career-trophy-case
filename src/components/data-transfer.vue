<script setup lang="ts">
import { ref } from 'vue'
import { useCareer } from '../composables/use-career'

const { exportState, importState, resetCareer } = useCareer()

const fileInput = ref<HTMLInputElement | null>(null)
const message = ref<string | null>(null)
const isConfirmingReset = ref(false)

const flash = (text: string) => {
  message.value = text
  setTimeout(() => (message.value = null), 4000)
}

const handleExport = () => {
  const blob = new Blob([exportState()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `trophy-case-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const handleImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const ok = importState(await file.text())
  flash(ok ? 'Backup restored.' : 'That file is not a trophy case backup.')
  if (fileInput.value) fileInput.value.value = ''
}

/** Two-step rather than a browser confirm(), which would wipe everything on a stray click. */
const handleReset = () => {
  if (!isConfirmingReset.value) {
    isConfirmingReset.value = true
    setTimeout(() => (isConfirmingReset.value = false), 4000)
    return
  }
  resetCareer()
  isConfirmingReset.value = false
  flash('Trophy case emptied.')
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button type="button" class="btn px-3 py-1.5 text-xs" @click="handleExport">Export</button>
    <button type="button" class="btn px-3 py-1.5 text-xs" @click="fileInput?.click()">
      Import
    </button>
    <button
      type="button"
      class="btn px-3 py-1.5 text-xs"
      :class="isConfirmingReset ? 'border-orange! bg-orange/25!' : ''"
      @click="handleReset"
    >
      {{ isConfirmingReset ? 'Erase everything?' : 'Reset' }}
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="application/json"
      class="hidden"
      @change="handleImport"
    />
    <span v-if="message" class="label-caps text-xs text-bone/60">{{ message }}</span>
  </div>
</template>
