import type { Competition, ContinentalCompetition } from '../types'
import type { SeasonFormat } from './seasons'

/**
 * The top division of every playable nation - one league each, no cups. Winning one of
 * these is what colours a nation in on the map.
 *
 * Sponsor names drift between FM versions, so rename freely; only the `nation` codes need
 * to match src/data/nations.json.
 */
const LEAGUES: readonly Omit<Competition, 'seasonFormat'>[] = [
  { id: 'ALB_L1', nation: 'ALB', name: 'Kategoria Superiore' },
  { id: 'AUT_L1', nation: 'AUT', name: 'Austrian Bundesliga' },
  { id: 'BLR_L1', nation: 'BLR', name: 'Belarusian Premier League' },
  { id: 'BEL_L1', nation: 'BEL', name: 'Belgian Pro League' },
  { id: 'BIH_L1', nation: 'BIH', name: 'Premier League of BiH' },
  { id: 'BGR_L1', nation: 'BGR', name: 'Bulgarian First League' },
  { id: 'HRV_L1', nation: 'HRV', name: 'HNL' },
  { id: 'CZE_L1', nation: 'CZE', name: 'Chance Liga' },
  { id: 'DNK_L1', nation: 'DNK', name: 'Danish Superliga' },
  { id: 'ENG_L1', nation: 'ENG', name: 'Premier League' },
  { id: 'EST_L1', nation: 'EST', name: 'Meistriliiga' },
  { id: 'FRO_L1', nation: 'FRO', name: 'Betri deildin' },
  { id: 'FIN_L1', nation: 'FIN', name: 'Veikkausliiga' },
  { id: 'FRA_L1', nation: 'FRA', name: 'Ligue 1' },
  { id: 'DEU_L1', nation: 'DEU', name: 'Bundesliga' },
  { id: 'GIB_L1', nation: 'GIB', name: 'Gibraltar Football League' },
  { id: 'GRC_L1', nation: 'GRC', name: 'Super League Greece' },
  { id: 'HUN_L1', nation: 'HUN', name: 'Nemzeti Bajnokság I' },
  { id: 'ISL_L1', nation: 'ISL', name: 'Besta deildin' },
  { id: 'IRL_L1', nation: 'IRL', name: 'Premier Division' },
  { id: 'ISR_L1', nation: 'ISR', name: 'Israeli Premier League' },
  { id: 'ITA_L1', nation: 'ITA', name: 'Serie A' },
  { id: 'LVA_L1', nation: 'LVA', name: 'Virsliga' },
  { id: 'LTU_L1', nation: 'LTU', name: 'A Lyga' },
  { id: 'NIR_L1', nation: 'NIR', name: 'NIFL Premiership' },
  { id: 'NLD_L1', nation: 'NLD', name: 'Eredivisie' },
  { id: 'NOR_L1', nation: 'NOR', name: 'Eliteserien' },
  { id: 'POL_L1', nation: 'POL', name: 'Ekstraklasa' },
  { id: 'PRT_L1', nation: 'PRT', name: 'Primeira Liga' },
  { id: 'ROU_L1', nation: 'ROU', name: 'SuperLiga' },
  { id: 'RUS_L1', nation: 'RUS', name: 'Russian Premier League' },
  { id: 'SCT_L1', nation: 'SCT', name: 'Scottish Premiership' },
  { id: 'SRB_L1', nation: 'SRB', name: 'Serbian SuperLiga' },
  { id: 'SVK_L1', nation: 'SVK', name: 'Niké Liga' },
  { id: 'SVN_L1', nation: 'SVN', name: 'Slovenian PrvaLiga' },
  { id: 'ESP_L1', nation: 'ESP', name: 'La Liga' },
  { id: 'SWE_L1', nation: 'SWE', name: 'Allsvenskan' },
  { id: 'CHE_L1', nation: 'CHE', name: 'Swiss Super League' },
  { id: 'TUR_L1', nation: 'TUR', name: 'Süper Lig' },
  { id: 'UKR_L1', nation: 'UKR', name: 'Ukrainian Premier League' },
  { id: 'WLS_L1', nation: 'WLS', name: 'Cymru Premier' },
  { id: 'ARG_L1', nation: 'ARG', name: 'Liga Profesional' },
  { id: 'BRA_L1', nation: 'BRA', name: 'Brasileirão Série A' },
  { id: 'CHL_L1', nation: 'CHL', name: 'Primera División' },
  { id: 'COL_L1', nation: 'COL', name: 'Categoría Primera A' },
  { id: 'PER_L1', nation: 'PER', name: 'Liga 1' },
  { id: 'URY_L1', nation: 'URY', name: 'Primera División' },
  { id: 'AUS_L1', nation: 'AUS', name: 'A-League Men' },
  { id: 'CHN_L1', nation: 'CHN', name: 'Chinese Super League' },
  { id: 'HKG_L1', nation: 'HKG', name: 'Hong Kong Premier League' },
  { id: 'IND_L1', nation: 'IND', name: 'Indian Super League' },
  { id: 'IDN_L1', nation: 'IDN', name: 'Liga 1' },
  { id: 'JPN_L1', nation: 'JPN', name: 'J1 League' },
  { id: 'MYS_L1', nation: 'MYS', name: 'Malaysia Super League' },
  { id: 'SAU_L1', nation: 'SAU', name: 'Saudi Pro League' },
  { id: 'KOR_L1', nation: 'KOR', name: 'K League 1' },
  { id: 'CAN_L1', nation: 'CAN', name: 'Canadian Premier League' },
  { id: 'MEX_L1', nation: 'MEX', name: 'Liga MX' },
  { id: 'USA_L1', nation: 'USA', name: 'MLS Cup' },
  { id: 'ZAF_L1', nation: 'ZAF', name: 'Premiership' },
]

/**
 * Summer leagues: they play a single calendar year ("2028") rather than straddling two
 * ("2027/28"), which changes what the season picker offers. Everything else is split.
 */
const CALENDAR_YEAR_NATIONS: ReadonlySet<string> = new Set([
  // Scandinavia, the Baltics and Ireland
  'SWE',
  'NOR',
  'FIN',
  'ISL',
  'IRL',
  'EST',
  'LVA',
  'LTU',
  'FRO',
  'BLR',
  // All of South America
  'ARG',
  'BRA',
  'CHL',
  'COL',
  'PER',
  'URY',
  // East and Southeast Asia
  'CHN',
  'JPN',
  'KOR',
  'MYS',
  // North America
  'USA',
  'CAN',
])

const seasonFormatFor = (nation: string): SeasonFormat =>
  CALENDAR_YEAR_NATIONS.has(nation) ? 'calendar' : 'split'

export const COMPETITIONS: readonly Competition[] = LEAGUES.map((league) => ({
  ...league,
  seasonFormat: seasonFormatFor(league.nation),
}))

/**
 * Club competitions above national level. OFC is absent: no Oceanian league is playable in
 * this save, so the OFC Champions League cannot be won with a club.
 */
export const CONTINENTAL: readonly ContinentalCompetition[] = [
  {
    id: 'UEFA_UCL',
    name: 'Champions League',
    confederation: 'UEFA',
    rank: 1,
    seasonFormat: 'split',
  },
  { id: 'UEFA_UEL', name: 'Europa League', confederation: 'UEFA', rank: 2, seasonFormat: 'split' },
  {
    id: 'UEFA_UECL',
    name: 'Conference League',
    confederation: 'UEFA',
    rank: 3,
    seasonFormat: 'split',
  },
  { id: 'UEFA_SC', name: 'UEFA Super Cup', confederation: 'UEFA', rank: 4, seasonFormat: 'split' },

  {
    id: 'CONMEBOL_LIB',
    name: 'Copa Libertadores',
    confederation: 'CONMEBOL',
    rank: 1,
    seasonFormat: 'calendar',
  },
  {
    id: 'CONMEBOL_SUD',
    name: 'Copa Sudamericana',
    confederation: 'CONMEBOL',
    rank: 2,
    seasonFormat: 'calendar',
  },
  {
    id: 'CONMEBOL_REC',
    name: 'Recopa Sudamericana',
    confederation: 'CONMEBOL',
    rank: 3,
    seasonFormat: 'calendar',
  },

  {
    id: 'AFC_CLE',
    name: 'AFC Champions League Elite',
    confederation: 'AFC',
    rank: 1,
    seasonFormat: 'split',
  },
  {
    id: 'AFC_CL2',
    name: 'AFC Champions League Two',
    confederation: 'AFC',
    rank: 2,
    seasonFormat: 'split',
  },

  {
    id: 'CONCACAF_CC',
    name: 'CONCACAF Champions Cup',
    confederation: 'CONCACAF',
    rank: 1,
    seasonFormat: 'calendar',
  },

  {
    id: 'CAF_CL',
    name: 'CAF Champions League',
    confederation: 'CAF',
    rank: 1,
    seasonFormat: 'split',
  },
  {
    id: 'CAF_CC',
    name: 'CAF Confederation Cup',
    confederation: 'CAF',
    rank: 2,
    seasonFormat: 'split',
  },
  { id: 'CAF_SC', name: 'CAF Super Cup', confederation: 'CAF', rank: 3, seasonFormat: 'split' },

  {
    id: 'FIFA_CWC',
    name: 'FIFA Club World Cup',
    confederation: 'FIFA',
    rank: 1,
    seasonFormat: 'calendar',
  },
]

/** Confederation order used for the club sections. */
export const CLUB_CONFEDERATIONS = ['UEFA', 'CONMEBOL', 'AFC', 'CONCACAF', 'CAF', 'FIFA'] as const

/** One league per nation, so a nation's league is a direct lookup. */
export const LEAGUE_BY_NATION: ReadonlyMap<string, Competition> = new Map(
  COMPETITIONS.map((competition) => [competition.nation, competition]),
)
