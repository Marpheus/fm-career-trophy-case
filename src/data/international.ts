import type { InternationalCompetition } from '../types'

/**
 * National team trophies. Unlike club football these are open to every nation, so OFC
 * appears here even though no Oceanian league is playable in this save.
 */
export const INTERNATIONAL: readonly InternationalCompetition[] = [
  {
    id: 'INT_WC',
    name: 'FIFA World Cup',
    confederation: 'FIFA',
    rank: 1,
    seasonFormat: 'calendar',
  },
  {
    id: 'INT_FINALISSIMA',
    name: 'Finalissima',
    confederation: 'FIFA',
    rank: 2,
    seasonFormat: 'calendar',
  },

  {
    id: 'INT_EURO',
    name: 'European Championship',
    confederation: 'UEFA',
    rank: 1,
    seasonFormat: 'calendar',
  },
  {
    id: 'INT_UNL',
    name: 'UEFA Nations League',
    confederation: 'UEFA',
    rank: 2,
    seasonFormat: 'calendar',
  },

  {
    id: 'INT_COPA',
    name: 'Copa América',
    confederation: 'CONMEBOL',
    rank: 1,
    seasonFormat: 'calendar',
  },

  {
    id: 'INT_AFCON',
    name: 'Africa Cup of Nations',
    confederation: 'CAF',
    rank: 1,
    seasonFormat: 'calendar',
  },

  {
    id: 'INT_ASIAN',
    name: 'AFC Asian Cup',
    confederation: 'AFC',
    rank: 1,
    seasonFormat: 'calendar',
  },

  {
    id: 'INT_GOLD',
    name: 'CONCACAF Gold Cup',
    confederation: 'CONCACAF',
    rank: 1,
    seasonFormat: 'calendar',
  },
  {
    id: 'INT_CNL',
    name: 'CONCACAF Nations League',
    confederation: 'CONCACAF',
    rank: 2,
    seasonFormat: 'calendar',
  },

  {
    id: 'INT_OFC',
    name: 'OFC Nations Cup',
    confederation: 'OFC',
    rank: 1,
    seasonFormat: 'calendar',
  },
]

/** The World Cup is the headline trophy and gets its own treatment in the UI. */
export const WORLD_CUP_ID = 'INT_WC'

export const INTERNATIONAL_CONFEDERATIONS = [
  'UEFA',
  'CONMEBOL',
  'CAF',
  'AFC',
  'CONCACAF',
  'OFC',
] as const
