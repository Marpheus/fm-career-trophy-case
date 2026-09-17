import { computed } from 'vue'
import { COMPETITIONS, CONTINENTAL } from '../data/competitions'
import { INTERNATIONAL } from '../data/international'
import { NATION_BY_CODE } from '../data/nations'
import type { Confederation, Nation, Win } from '../types'
import { useCareer } from './use-career'

export type TrophyKind = 'league' | 'continental' | 'international'

export interface TimelineEntry {
  readonly win: Win
  readonly competitionName: string
  readonly kind: TrophyKind
  readonly confederation: Confederation
  /** Only leagues belong to a nation - that is where the flag comes from. */
  readonly nation: Nation | null
}

/** One career year. Calendar and split leagues that start together share a season. */
export interface TimelineSeason {
  readonly startYear: number
  readonly entries: readonly TimelineEntry[]
}

interface CompetitionMeta {
  readonly name: string
  readonly kind: TrophyKind
  readonly confederation: Confederation
  readonly nation: Nation | null
}

const buildMeta = (): ReadonlyMap<string, CompetitionMeta> => {
  const meta = new Map<string, CompetitionMeta>()
  for (const league of COMPETITIONS) {
    const nation = NATION_BY_CODE.get(league.nation) ?? null
    meta.set(league.id, {
      name: league.name,
      kind: 'league',
      confederation: nation?.confederation ?? 'FIFA',
      nation,
    })
  }
  for (const cup of CONTINENTAL) {
    meta.set(cup.id, {
      name: cup.name,
      kind: 'continental',
      confederation: cup.confederation,
      nation: null,
    })
  }
  for (const cup of INTERNATIONAL) {
    meta.set(cup.id, {
      name: cup.name,
      kind: 'international',
      confederation: cup.confederation,
      nation: null,
    })
  }
  return meta
}

const COMPETITION_META = buildMeta()

/** Biggest trophy of a season first, so each year leads with its headline. */
const KIND_ORDER: Readonly<Record<TrophyKind, number>> = {
  international: 0,
  continental: 1,
  league: 2,
}

/** '2027/28' and '2027' both start in 2027. Imported junk sorts to the very beginning. */
const startYearOf = (season: string): number => {
  const year = Number.parseInt(season, 10)
  return Number.isNaN(year) ? 0 : year
}

const compareEntries = (a: TimelineEntry, b: TimelineEntry): number =>
  KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.competitionName.localeCompare(b.competitionName)

/** Every win grouped into the season it was won, oldest season first. */
export const useTimeline = () => {
  const { wins } = useCareer()

  const seasons = computed<TimelineSeason[]>(() => {
    const grouped = new Map<number, TimelineEntry[]>()

    for (const win of wins.value) {
      const meta = COMPETITION_META.get(win.competitionId)
      if (!meta) continue
      const entry: TimelineEntry = {
        win,
        competitionName: meta.name,
        kind: meta.kind,
        confederation: meta.confederation,
        nation: meta.nation,
      }
      const list = grouped.get(startYearOf(win.season))
      if (list) list.push(entry)
      else grouped.set(startYearOf(win.season), [entry])
    }

    return [...grouped.entries()]
      .sort(([a], [b]) => a - b)
      .map(([startYear, entries]) => ({ startYear, entries: entries.sort(compareEntries) }))
  })

  return { seasons }
}
