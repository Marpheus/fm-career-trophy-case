/**
 * Season labelling. Most leagues straddle two calendar years ("2027/28"), but summer
 * leagues - Scandinavia, most of South America, MLS, much of East Asia - play a single
 * calendar year, and international tournaments are one-off events in a single year.
 */
export type SeasonFormat = 'split' | 'calendar'

/** FM24's first playable season. */
export const FIRST_SEASON_YEAR = 2023

/** How far ahead the picker goes - long enough to outlast any save. */
export const SEASON_YEARS = 40

export const seasonLabel = (startYear: number, format: SeasonFormat = 'split'): string =>
  format === 'calendar'
    ? String(startYear)
    : `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`

export const seasonOptions = (format: SeasonFormat = 'split') =>
  Array.from({ length: SEASON_YEARS }, (_, index) => {
    const startYear = FIRST_SEASON_YEAR + index
    return { startYear, label: seasonLabel(startYear, format) }
  })

/** '2027/28' and '2027' both start in 2027. Imported junk sorts to the very beginning. */
export const startYearOf = (season: string): number => {
  const year = Number.parseInt(season, 10)
  return Number.isNaN(year) ? 0 : year
}

/** A calendar season ('2032') finishes a year before a split one ('2032/33') that starts with it. */
export const endYearOf = (season: string): number =>
  startYearOf(season) + (season.includes('/') ? 1 : 0)
