import type { Config, Context } from '@netlify/functions'
import { db } from '../lib/db'
import { parseCredentials } from '../lib/credentials'
import { errorResponse, readJson, tooManyRequests } from '../lib/http'
import { hashPassword } from '../lib/password'
import { checkRateLimit } from '../lib/rate-limit'
import { signIn } from '../lib/session'

export default async (req: Request, context: Context): Promise<Response> => {
  const retryAfter = await checkRateLimit([
    { key: `register:ip:${context.ip}`, limit: 5, windowSeconds: 60 * 60 },
  ])
  if (retryAfter) return tooManyRequests(retryAfter)

  const credentials = parseCredentials(await readJson(req))
  if ('error' in credentials) return errorResponse(400, credentials.error)

  const passwordHash = await hashPassword(credentials.password)
  const rows = (await db()`
    INSERT INTO users (username, password_hash)
    VALUES (${credentials.username}, ${passwordHash})
    ON CONFLICT (username) DO NOTHING
    RETURNING id, username
  `) as { id: string; username: string }[]
  if (!rows[0]) return errorResponse(409, 'That username is taken.')

  return signIn(rows[0])
}

export const config: Config = { path: '/api/register', method: 'POST' }
