import type { Config, Context } from '@netlify/functions'
import type { PersistedState } from '../../src/types'
import { normalizeUsername } from '../lib/credentials'
import { db } from '../lib/db'
import { errorResponse, jsonResponse, tooManyRequests } from '../lib/http'
import { checkRateLimit } from '../lib/rate-limit'

interface ProfileRow {
  readonly username: string
  readonly state: PersistedState | null
}

/** Every account's trophy case is public and read-only at /u/<username>. */
export default async (_req: Request, context: Context): Promise<Response> => {
  const retryAfter = await checkRateLimit([
    { key: `profile:ip:${context.ip}`, limit: 120, windowSeconds: 60 },
  ])
  if (retryAfter) return tooManyRequests(retryAfter)

  const rows = (await db()`
    SELECT users.username, trophy_cases.state
    FROM users LEFT JOIN trophy_cases ON trophy_cases.user_id = users.id
    WHERE users.username = ${normalizeUsername(context.params.username)}
  `) as ProfileRow[]
  if (!rows[0]) return errorResponse(404, 'No such manager.')

  return jsonResponse(rows[0], { headers: { 'Cache-Control': 'public, max-age=60' } })
}

export const config: Config = { path: '/api/profile/:username', method: 'GET' }
