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
