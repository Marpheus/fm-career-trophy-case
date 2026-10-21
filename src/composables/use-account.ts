import { readonly, ref } from 'vue'
import * as api from '../api'

// Module-level singleton, like use-career: one signed-in user for the whole page.
const username = ref<string | null>(null)
const isChecking = ref(true)

const handleCheck = async () => {
  const result = await api.fetchAccount()
  username.value = result.ok ? result.data.username : null
  isChecking.value = false
}
void handleCheck()

/** Resolves to an error message, or null on success. */
const authenticate = async (
  call: typeof api.login,
  name: string,
  password: string,
): Promise<string | null> => {
  const result = await call(name, password)
  if (!result.ok) return result.error
  username.value = result.data.username
  return null
}

export const useAccount = () => ({
  username: readonly(username),
  isChecking: readonly(isChecking),
  login: (name: string, password: string) => authenticate(api.login, name, password),
  register: (name: string, password: string) => authenticate(api.register, name, password),
  logout: async () => {
    await api.logout()
    username.value = null
  },
})
