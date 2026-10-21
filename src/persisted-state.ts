import type { Career, PersistedState } from './types'

const isCareer = (value: unknown): value is Career => {
  if (typeof value !== 'object' || value === null) return false
  const career = value as Partial<Career>
  return typeof career.id === 'string' && Array.isArray(career.wins)
}

/** Shape check shared by the browser (imports, localStorage) and the API (saves). */
export const isPersistedState = (value: unknown): value is PersistedState => {
  if (typeof value !== 'object' || value === null) return false
  const state = value as Partial<PersistedState>
  return (
    state.version === 1 &&
    typeof state.activeCareerId === 'string' &&
    Array.isArray(state.careers) &&
    state.careers.length > 0 &&
    state.careers.every(isCareer)
  )
}
