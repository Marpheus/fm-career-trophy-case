import { computed, reactive, watch } from 'vue'
import type { Career, Competition, PersistedState, Win } from '../types'
import { COMPETITIONS, CONTINENTAL } from '../data/competitions'
import { INTERNATIONAL } from '../data/international'
import { PLAYABLE_NATIONS } from '../data/playable'

const STORAGE_KEY = 'fm-trophy-case:v1'

const createId = () => crypto.randomUUID()

const createCareer = (): Career => ({
  id: createId(),
  name: 'My save',
  manager: '',
  wins: [],
})

const emptyState = (): PersistedState => {
  const career = createCareer()
  return { version: 1, activeCareerId: career.id, careers: [career] }
}

const isPersistedState = (value: unknown): value is PersistedState => {
  if (typeof value !== 'object' || value === null) return false
  const state = value as Partial<PersistedState>
  return state.version === 1 && Array.isArray(state.careers) && state.careers.length > 0
}

const load = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed: unknown = JSON.parse(raw)
    return isPersistedState(parsed) ? parsed : emptyState()
  } catch {
    return emptyState()
  }
}

// Module-level singleton: one career state shared by every component.
const state = reactive<PersistedState>(load())

watch(
  () => state,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or blocked (private window). Nothing useful to do here;
      // the export button is the real safety net.
    }
  },
  { deep: true },
)

const COMPETITION_BY_ID = new Map<string, Competition>(COMPETITIONS.map((c) => [c.id, c]))
const ABOVE_NATIONAL_BY_ID = new Map(
  [...CONTINENTAL, ...INTERNATIONAL].map((competition) => [competition.id, competition]),
)

export const competitionName = (id: string): string =>
  COMPETITION_BY_ID.get(id)?.name ?? ABOVE_NATIONAL_BY_ID.get(id)?.name ?? id

/** Nations that can be conquered - the denominator for every completion figure. */
export const CONQUERABLE_NATIONS = PLAYABLE_NATIONS

export const useCareer = () => {
  const career = computed<Career>(
    () => state.careers.find((c) => c.id === state.activeCareerId) ?? state.careers[0],
  )

  const wins = computed(() => career.value.wins)

  const winsByCompetition = computed(() => {
    const map = new Map<string, Win[]>()
    for (const win of wins.value) {
      const list = map.get(win.competitionId)
      if (list) list.push(win)
      else map.set(win.competitionId, [win])
    }
    return map
  })

  /** Nations whose league has been won - the single thing that colours the map. */
  const conqueredNations = computed(() => {
    const codes = new Set<string>()
    for (const win of wins.value) {
      const competition = COMPETITION_BY_ID.get(win.competitionId)
      if (competition) codes.add(competition.nation)
    }
    return codes
  })

  const winsForNation = (nation: string) =>
    wins.value.filter((win) => COMPETITION_BY_ID.get(win.competitionId)?.nation === nation)

  const hasWon = (competitionId: string) => winsByCompetition.value.has(competitionId)

  const addWin = (input: { competitionId: string; season: string; club: string }) => {
    const target = state.careers.find((c) => c.id === career.value.id)
    if (!target) return
    target.wins = [
      ...target.wins,
      {
        id: createId(),
        competitionId: input.competitionId,
        season: input.season.trim(),
        club: input.club.trim(),
        addedAt: new Date().toISOString(),
      },
    ]
  }

  const removeWin = (winId: string) => {
    const target = state.careers.find((c) => c.id === career.value.id)
    if (!target) return
    target.wins = target.wins.filter((win) => win.id !== winId)
  }

  const renameCareer = (name: string, manager: string) => {
    const target = state.careers.find((c) => c.id === career.value.id)
    if (!target) return
    Object.assign(target, { name, manager })
  }

  const exportState = (): string => JSON.stringify(state, null, 2)

  const importState = (json: string): boolean => {
    try {
      const parsed: unknown = JSON.parse(json)
      if (!isPersistedState(parsed)) return false
      Object.assign(state, parsed)
      return true
    } catch {
      return false
    }
  }

  const resetCareer = () => {
    Object.assign(state, emptyState())
  }

  return {
    career,
    wins,
    winsByCompetition,
    conqueredNations,
    winsForNation,
    hasWon,
    addWin,
    removeWin,
    renameCareer,
    exportState,
    importState,
    resetCareer,
  }
}
