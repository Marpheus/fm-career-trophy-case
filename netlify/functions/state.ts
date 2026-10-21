import type { Config, Context } from '@netlify/functions'
import { isPersistedState } from '../../src/persisted-state'
import type { PersistedState } from '../../src/types'
import { db } from '../lib/db'
import { errorResponse, jsonResponse, readJson, tooManyRequests } from '../lib/http'
import { checkRateLimit } from '../lib/rate-limit'
import { currentUser, type SessionUser } from '../lib/session'

interface TrophyCaseRow {
  readonly state: PersistedState | null
  readonly revision: number
}

const loadTrophyCase = async (userId: string): Promise<TrophyCaseRow> => {
  const rows = (await db()`
    SELECT state, revision FROM trophy_cases WHERE user_id = ${userId}
  `) as TrophyCaseRow[]
  return rows[0] ?? { state: null, revision: 0 }
}

const isRevision = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0

/**
 * Saves only if the client's revision is still current. Otherwise answers 409, and the client
 * reloads what is stored instead of overwriting another device's save.
 */
const handleSave = async (req: Request, user: SessionUser): Promise<Response> => {
  const retryAfter = await checkRateLimit([
    { key: `save:user:${user.id}`, limit: 60, windowSeconds: 60 },
  ])
  if (retryAfter) return tooManyRequests(retryAfter)

  const body = await readJson(req)
  const { state, revision } = (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >
  if (!isPersistedState(state) || !isRevision(revision)) {
    return errorResponse(400, 'That is not a trophy case.')
  }

  const rows = (await db()`
    INSERT INTO trophy_cases (user_id, state, revision)
    VALUES (${user.id}, ${JSON.stringify(state)}::jsonb, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      state = EXCLUDED.state,
      revision = trophy_cases.revision + 1,
      updated_at = now()
    WHERE trophy_cases.revision = ${revision}
    RETURNING revision
  `) as { revision: number }[]
  if (rows[0]) return jsonResponse({ revision: rows[0].revision })

  return errorResponse(409, 'Saved from another device in the meantime.')
}

export default async (req: Request, context: Context): Promise<Response> => {
  const user = await currentUser(context)
  if (!user) return errorResponse(401, 'Sign in first.')
  if (req.method === 'PUT') return handleSave(req, user)
  return jsonResponse(await loadTrophyCase(user.id))
}

export const config: Config = { path: '/api/state', method: ['GET', 'PUT'] }
