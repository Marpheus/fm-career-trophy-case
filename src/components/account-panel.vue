<script setup lang="ts">
import { computed, ref } from 'vue'
import { flushCloudSave, useCareer, type SyncStatus } from '../composables/use-career'
import { useAccount } from '../composables/use-account'

type Mode = 'login' | 'register'

const { username, isChecking, login, register, logout } = useAccount()
const { syncStatus } = useCareer()

const dialog = ref<HTMLDialogElement | null>(null)
const mode = ref<Mode>('login')
const name = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isSubmitting = ref(false)

const STATUS_LABELS: Record<SyncStatus, string> = {
  local: 'This browser only',
  loading: 'Loading…',
  saving: 'Saving…',
  synced: 'Saved',
  reloaded: 'Updated from another device',
  error: 'Not saved',
}

const statusLabel = computed(() => STATUS_LABELS[syncStatus.value])
const isRegistering = computed(() => mode.value === 'register')

const handleOpen = () => {
  error.value = null
  dialog.value?.showModal()
}

// The dialog's close event clears the password, whether closed here or with Escape.
const handleClose = () => dialog.value?.close()

const handleToggleMode = () => {
  mode.value = isRegistering.value ? 'login' : 'register'
  error.value = null
}

const handleSubmit = async () => {
  isSubmitting.value = true
  const submit = isRegistering.value ? register : login
  error.value = await submit(name.value, password.value)
  isSubmitting.value = false
  if (!error.value) handleClose()
}

const handleLogout = async () => {
  await flushCloudSave()
  await logout()
}
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <template v-if="username">
      <span class="label-caps min-w-0 truncate text-xs text-bone/60" aria-live="polite">
        <span class="text-amber">{{ username }}</span> · {{ statusLabel }}
      </span>
      <button type="button" class="btn px-3 py-1.5 text-xs" @click="handleLogout">Sign out</button>
    </template>
    <button
      v-else
      type="button"
      class="btn px-3 py-1.5 text-xs"
      :disabled="isChecking"
      @click="handleOpen"
    >
      Sign in
    </button>

    <dialog
      ref="dialog"
      aria-labelledby="account-title"
      class="panel m-auto w-80 p-5 text-bone backdrop:bg-black/60"
      @close="password = ''"
    >
      <form class="flex flex-col gap-3" @submit.prevent="handleSubmit">
        <h2 id="account-title" class="font-display text-xl tracking-wide">
          {{ isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN' }}
        </h2>
        <label class="flex flex-col gap-1">
          <span class="label-caps text-xs">Username</span>
          <input
            v-model="name"
            required
            minlength="3"
            maxlength="24"
            pattern="[A-Za-z0-9_\-]+"
            autocomplete="username"
            class="field px-2.5 py-1.5 text-sm"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="label-caps text-xs">Password</span>
          <input
            v-model="password"
            type="password"
            required
            :minlength="isRegistering ? 8 : undefined"
            maxlength="128"
            :autocomplete="isRegistering ? 'new-password' : 'current-password'"
            class="field px-2.5 py-1.5 text-sm"
          />
        </label>
        <p v-if="error" role="alert" class="text-xs text-orange">{{ error }}</p>
        <div class="flex items-center gap-2">
          <button
            type="submit"
            class="btn border-amber! px-3 py-1.5 text-xs"
            :disabled="isSubmitting"
          >
            {{ isRegistering ? 'Create account' : 'Sign in' }}
          </button>
          <button type="button" class="btn px-3 py-1.5 text-xs" @click="handleClose">Cancel</button>
        </div>
        <button
          type="button"
          class="self-start text-xs text-bone/60 underline hover:text-bone"
          @click="handleToggleMode"
        >
          {{ isRegistering ? 'Sign in instead' : 'Create an account' }}
        </button>
      </form>
    </dialog>
  </div>
</template>
