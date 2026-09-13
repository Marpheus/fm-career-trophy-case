import type { SeasonFormat } from './data/seasons'

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC' | 'FIFA'

/** Every confederation a nation can belong to. FIFA runs competitions but has no members. */
export type NationConfederation = Exclude<Confederation, 'FIFA'>

export interface Nation {
  /** Natural Earth subunit code, canonical id across map + data (e.g. ENG, SCT, CZE). */
  readonly code: string
  readonly name: string
  readonly confederation: NationConfederation
  /** flag-icons class suffix, e.g. 'gb-eng', 'cz'. */
  readonly flag: string
}

/** A nation's top division. There is exactly one per playable nation. */
export interface Competition {
  readonly id: string
  readonly nation: string
  readonly name: string
  readonly seasonFormat: SeasonFormat
}

/** A club competition above national level. */
export interface ContinentalCompetition {
  readonly id: string
  readonly name: string
  readonly confederation: Confederation
  /** Sort weight inside a confederation; lower is more prestigious. */
  readonly rank: number
  readonly seasonFormat: SeasonFormat
}

/** A national team competition. Wins record the nation managed, not a club. */
export interface InternationalCompetition {
  readonly id: string
  readonly name: string
  readonly confederation: Confederation
  readonly rank: number
  readonly seasonFormat: SeasonFormat
}

export interface Win {
  readonly id: string
  readonly competitionId: string
  /** Season label as shown in game, e.g. '2027/28'. */
  readonly season: string
  /** Club for domestic and continental trophies, national team for international ones. */
  readonly club: string
  readonly addedAt: string
}

export interface Career {
  readonly id: string
  name: string
  manager: string
  wins: Win[]
}

export interface PersistedState {
  readonly version: 1
  activeCareerId: string
  careers: Career[]
}

/** Per-nation geometry metadata emitted by scripts/build-map.mjs. */
export interface NationGeo {
  /** Point guaranteed to sit inside the nation, used to place dot markers. */
  readonly point: readonly [number, number]
  /** True when the polygon is too small to click and is drawn as a dot instead. */
  readonly small: boolean
}
