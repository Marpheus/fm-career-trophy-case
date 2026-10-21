import type { PersistedState } from './types'

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

interface StoredTrophyCase {
  readonly state: PersistedState | null
  readonly revision: number
}

export type SaveResult =
  | { kind: 'saved'; revision: number }
  | { kind: 'conflict'; stored: StoredTrophyCase }
  | { kind: 'failed' }

const readError = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? 'Something went wrong.'
  } catch {
    return 'The server is not reachable.'
  }
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> => {
  try {
    const response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
    if (!response.ok) {
      return { ok: false, status: response.status, error: await readError(response) }
    }
    return { ok: true, data: (await response.json()) as T }
  } catch {
    // Network down, or `vite` without Netlify answering /api with index.html.
    return { ok: false, status: 0, error: 'The server is not reachable.' }
  }
}

type Account = { username: string | null }

export const fetchAccount = () => request<Account>('/api/me')

export const register = (username: string, password: string) =>
  request<Account>('/api/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const login = (username: string, password: string) =>
  request<Account>('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) })

export const logout = () => request<Account>('/api/logout', { method: 'POST' })

export const fetchTrophyCase = () => request<StoredTrophyCase>('/api/state')

/** `keepalive` lets a save started while the tab closes still reach the server. */
export const saveTrophyCase = async (
  state: PersistedState,
  revision: number,
  isKeepalive = false,
): Promise<SaveResult> => {
  const result = await request<{ revision: number }>('/api/state', {
    method: 'PUT',
    body: JSON.stringify({ state, revision }),
    keepalive: isKeepalive,
  })
  if (result.ok) return { kind: 'saved', revision: result.data.revision }
  if (result.status !== 409) return { kind: 'failed' }
  const stored = await fetchTrophyCase()
  return stored.ok ? { kind: 'conflict', stored: stored.data } : { kind: 'failed' }
}
