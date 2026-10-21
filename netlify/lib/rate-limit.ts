import { db } from './db'

export interface RateLimitRule {
  /** Namespaced counter key, e.g. 'login:ip:203.0.113.7'. */
  readonly key: string
  readonly limit: number
  readonly windowSeconds: number
}

const CLEANUP_CHANCE = 0.01

const windowStart = (windowSeconds: number): Date => {
  const windowMs = windowSeconds * 1000
  return new Date(Math.floor(Date.now() / windowMs) * windowMs)
}

/** Counts one hit against the rule; returns seconds until reset when over the limit. */
const hit = async ({ key, limit, windowSeconds }: RateLimitRule): Promise<number | null> => {
  const start = windowStart(windowSeconds)
  const rows = (await db()`
    INSERT INTO rate_limits (key, window_start, hits)
    VALUES (${key}, ${start}, 1)
    ON CONFLICT (key) DO UPDATE SET
      hits = CASE WHEN rate_limits.window_start = EXCLUDED.window_start
        THEN rate_limits.hits + 1 ELSE 1 END,
      window_start = EXCLUDED.window_start
    RETURNING hits
  `) as { hits: number }[]
  if (rows[0].hits <= limit) return null
  return Math.ceil((start.getTime() + windowSeconds * 1000 - Date.now()) / 1000)
}

// Keys are per IP and per username, so the table grows with traffic; prune it now and then
// rather than running a scheduled job.
const pruneOccasionally = async (): Promise<void> => {
  if (Math.random() >= CLEANUP_CHANCE) return
  await db()`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`
}

/** Counts a hit against every rule; returns the longest wait if any is exceeded. */
export const checkRateLimit = async (rules: readonly RateLimitRule[]): Promise<number | null> => {
  const [waits] = await Promise.all([Promise.all(rules.map(hit)), pruneOccasionally()])
  const exceeded = waits.filter((wait): wait is number => wait !== null)
  return exceeded.length ? Math.max(...exceeded) : null
}
