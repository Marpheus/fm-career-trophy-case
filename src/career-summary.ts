import { COMPETITIONS, CONTINENTAL } from './data/competitions'
import { INTERNATIONAL } from './data/international'
import { PLAYABLE_NATIONS } from './data/playable'
import type { Win } from './types'

/** The headline numbers, shared by the stats strip and profile link previews. */
export interface CareerSummary {
  readonly conquered: number
  readonly conquerable: number
  readonly clubTitles: number
  readonly internationalWon: number
  readonly internationalTotal: number
}

const LEAGUE_NATION_BY_ID = new Map(COMPETITIONS.map((league) => [league.id, league.nation]))

const CLUB_COMPETITION_IDS: ReadonlySet<string> = new Set(
  [...COMPETITIONS, ...CONTINENTAL].map((competition) => competition.id),
)

const INTERNATIONAL_IDS: ReadonlySet<string> = new Set(INTERNATIONAL.map((cup) => cup.id))

/** Wins of competitions since dropped from the data (Club World Cup, Finalissima) never count. */
export const summarizeCareer = (wins: readonly Win[]): CareerSummary => {
  const conqueredNations = new Set<string>()
  const internationalWon = new Set<string>()
  let clubTitles = 0
  for (const win of wins) {
    const nation = LEAGUE_NATION_BY_ID.get(win.competitionId)
    if (nation && PLAYABLE_NATIONS.has(nation)) conqueredNations.add(nation)
    if (CLUB_COMPETITION_IDS.has(win.competitionId)) clubTitles += 1
    if (INTERNATIONAL_IDS.has(win.competitionId)) internationalWon.add(win.competitionId)
  }
  return {
    conquered: conqueredNations.size,
    conquerable: PLAYABLE_NATIONS.size,
    clubTitles,
    internationalWon: internationalWon.size,
    internationalTotal: INTERNATIONAL.length,
  }
}
