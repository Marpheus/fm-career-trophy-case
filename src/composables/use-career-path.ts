import { computed } from 'vue'
import { COMPETITIONS } from '../data/competitions'
import { endYearOf, startYearOf } from '../data/seasons'
import type { Win } from '../types'
import { useCareer } from './use-career'

const LEAGUE_NATION_BY_ID = new Map(COMPETITIONS.map((league) => [league.id, league.nation]))

/** By when the season finished; of two finishing together, the one that started first. */
const bySeason = (a: Win, b: Win) =>
  endYearOf(a.season) - endYearOf(b.season) || startYearOf(a.season) - startYearOf(b.season)

/**
 * The club moves drawn on the map, read off the trophies: nobody logs when they took or left
 * a job, and a job without a trophy does not count. A club's country is that of the league
 * it won - cups alone do not say where it plays - and national teams run alongside club
 * jobs, so they stay off the path.
 */
export const useCareerPath = () => {
  const { wins } = useCareer()

  const clubNations = computed(() => {
    const nations = new Map<string, string>()
    for (const win of wins.value) {
      const nation = LEAGUE_NATION_BY_ID.get(win.competitionId)
      if (nation && !nations.has(win.club)) nations.set(win.club, nation)
    }
    return nations
  })

  /** Countries in the order the titles came, one stop per change of country. */
  const path = computed<readonly string[]>(() =>
    [...wins.value]
      .sort(bySeason)
      .flatMap((win) => {
        const nation = clubNations.value.get(win.club)
        return nation ? [nation] : []
      })
      .filter((nation, index, nations) => nation !== nations[index - 1]),
  )

  return { path }
}
