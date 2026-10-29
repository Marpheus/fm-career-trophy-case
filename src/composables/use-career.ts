import { computed, reactive, readonly, ref, watch } from 'vue'
import { fetchProfile, fetchTrophyCase, saveTrophyCase } from '../api'
import { isPersistedState } from '../persisted-state'
import { profileFromPath } from '../profile-path'
import type { Career, Competition, PersistedState, Win } from '../types'
import { useAccount } from './use-account'
import { COMPETITIONS, CONTINENTAL } from '../data/competitions'
import { INTERNATIONAL } from '../data/international'
import { findNationByName } from '../data/nations'
import { PLAYABLE_NATIONS } from '../data/playable'

const STORAGE_KEY = 'fm-career-trophy-case:v1'

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

const loadLocal = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed: unknown = JSON.parse(raw)
    return isPersistedState(parsed) ? parsed : emptyState()
  } catch {
    return emptyState()
  }
}

const saveLocal = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked (private window). Nothing useful to do here;
    // the export button is the real safety net.
  }
}

/** Set on /u/<username>: someone's public trophy case, shown read-only and never saved. */
export const viewedUsername = profileFromPath(window.location.pathname)
export const isReadOnly = viewedUsername !== null

// Module-level singleton: one career state shared by every component.
const state = reactive<PersistedState>(isReadOnly ? emptyState() : loadLocal())

export type ProfileStatus = 'loading' | 'ready' | 'missing' | 'error'

const profileStatus = ref<ProfileStatus>('loading')

const loadProfile = async (name: string) => {
  const result = await fetchProfile(name)
  if (!result.ok) {
    profileStatus.value = result.status === 404 ? 'missing' : 'error'
    return
  }
  if (result.data.state) Object.assign(state, result.data.state)
  profileStatus.value = 'ready'
}

/*
 * Persistence. Signed out, the trophy case lives in localStorage as it always has. Signed
 * in, it lives in the database and localStorage is left alone, so signing out brings back
 * whatever this browser held before.
 */

export type SyncStatus = 'local' | 'loading' | 'saving' | 'synced' | 'reloaded' | 'error'

const SAVE_DELAY_MS = 800

const { username } = useAccount()
const syncStatus = ref<SyncStatus>('local')
let revision = 0
/** JSON of what the database holds, so echoes of our own loads and saves are not re-sent. */
let lastSynced = ''
let saveTimer: ReturnType<typeof setTimeout> | undefined
let isSaving = false

const isDirty = () => JSON.stringify(state) !== lastSynced

const adoptStored = (stored: PersistedState, storedRevision: number) => {
  revision = storedRevision
  Object.assign(state, stored)
  // Serialised after assigning: jsonb reorders keys, and comparing against the stored
  // order would make every load look like an edit worth saving.
  lastSynced = JSON.stringify(state)
}

const reloadFromCloud = async (): Promise<boolean> => {
  const result = await fetchTrophyCase()
  if (!result.ok) return false
  if (result.data.state) adoptStored(result.data.state, result.data.revision)
  return true
}

const saveToCloud = async (): Promise<void> => {
  if (isSaving || !username.value || !isDirty()) return
  isSaving = true
  syncStatus.value = 'saving'
  const snapshot = JSON.stringify(state)
  const result = await saveTrophyCase(JSON.parse(snapshot) as PersistedState, revision)
  isSaving = false

  if (result.kind === 'failed') {
    syncStatus.value = 'error'
    return
  }
  if (result.kind === 'conflict') {
    // Another device saved first. Theirs wins; this tab's unsaved edit is dropped.
    if (result.stored.state) adoptStored(result.stored.state, result.stored.revision)
    syncStatus.value = 'reloaded'
    return
  }
  revision = result.revision
  lastSynced = snapshot
  syncStatus.value = 'synced'
  // Edits made while the request was in flight.
  if (isDirty()) void saveToCloud()
}

const scheduleCloudSave = () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void saveToCloud(), SAVE_DELAY_MS)
}

/** Sends any pending save now; await it before signing out. */
export const flushCloudSave = async (): Promise<void> => {
  clearTimeout(saveTimer)
  await saveToCloud()
}

const handleSignIn = async () => {
  syncStatus.value = 'loading'
  revision = 0
  lastSynced = ''
  if (!(await reloadFromCloud())) {
    syncStatus.value = 'error'
    return
  }
  syncStatus.value = 'synced'
  // A first sign-in finds nothing stored: this browser's trophies become the account's.
  if (revision === 0) await saveToCloud()
}

const handleSignOut = () => {
  clearTimeout(saveTimer)
  syncStatus.value = 'local'
  Object.assign(state, loadLocal())
}

const startPersistence = () => {
  watch(username, (name) => (name ? void handleSignIn() : handleSignOut()))

  watch(
    () => state,
    () => (username.value ? scheduleCloudSave() : saveLocal()),
    { deep: true },
  )

  // Closing the tab inside the save delay would otherwise lose the last edit.
  window.addEventListener('pagehide', () => {
    if (!username.value || !isDirty()) return
    void saveTrophyCase(JSON.parse(JSON.stringify(state)) as PersistedState, revision, true)
  })
}

// A profile never touches the viewer's own trophy case, signed in or not.
if (viewedUsername) void loadProfile(viewedUsername)
else startPersistence()

const COMPETITION_BY_ID = new Map<string, Competition>(COMPETITIONS.map((c) => [c.id, c]))
const INTERNATIONAL_IDS: ReadonlySet<string> = new Set(INTERNATIONAL.map((cup) => cup.id))

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

  /** International trophies per national team, keyed by nation code. */
  const internationalWinsByNation = computed(() => {
    const counts = new Map<string, number>()
    for (const win of wins.value) {
      if (!INTERNATIONAL_IDS.has(win.competitionId)) continue
      const nation = findNationByName(win.club)
      if (nation) counts.set(nation.code, (counts.get(nation.code) ?? 0) + 1)
    }
    return counts
  })

  const winsForNation = (nation: string) =>
    wins.value.filter((win) => COMPETITION_BY_ID.get(win.competitionId)?.nation === nation)

  const hasWon = (competitionId: string) => winsByCompetition.value.has(competitionId)

  const addWin = (input: {
    competitionId: string
    season: string
    club: string
    stage?: string
  }) => {
    const target = state.careers.find((c) => c.id === career.value.id)
    if (!target) return
    target.wins = [
      ...target.wins,
      {
        id: createId(),
        competitionId: input.competitionId,
        season: input.season.trim(),
        club: input.club.trim(),
        ...(input.stage ? { stage: input.stage } : {}),
        addedAt: new Date().toISOString(),
      },
    ]
  }

  const removeWin = (winId: string) => {
    const target = state.careers.find((c) => c.id === career.value.id)
    if (!target) return
    target.wins = target.wins.filter((win) => win.id !== winId)
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
    isReadOnly,
    viewedUsername,
    profileStatus: readonly(profileStatus),
    syncStatus: readonly(syncStatus),
    career,
    wins,
    winsByCompetition,
    conqueredNations,
    internationalWinsByNation,
    winsForNation,
    hasWon,
    addWin,
    removeWin,
    exportState,
    importState,
    resetCareer,
  }
}
