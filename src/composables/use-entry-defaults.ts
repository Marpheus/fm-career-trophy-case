import { ref } from 'vue'
import { FIRST_SEASON_YEAR } from '../data/seasons'

/**
 * The season and club last entered, reused to prefill the next trophy. The season is held
 * as a start year rather than a label so it carries across leagues that format their
 * seasons differently. Not persisted - it only saves typing within a session.
 */
const lastStartYear = ref(FIRST_SEASON_YEAR)
const lastClub = ref('')

export const useEntryDefaults = () => {
  const remember = (startYear: number, club: string) => {
    lastStartYear.value = startYear
    lastClub.value = club
  }
  return { lastStartYear, lastClub, remember }
}
