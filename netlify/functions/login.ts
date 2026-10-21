import type { Config, Context } from '@netlify/functions'
import { db } from '../lib/db'
import { normalizeUsername } from '../lib/credentials'
import { errorResponse, readJson, tooManyRequests } from '../lib/http'
import { verifyAgainstDecoy, verifyPassword } from '../lib/password'
import { checkRateLimit } from '../lib/rate-limit'
import { signIn } from '../lib/session'

const WINDOW_SECONDS = 15 * 60

interface UserRow {
  readonly id: string
  readonly username: string
  readonly password_hash: string
}

const findUser = async (username: string): Promise<UserRow | null> => {
  if (!username) return null
  const rows = (await db()`
    SELECT id, username, password_hash FROM users WHERE username = ${username}
  `) as UserRow[]
  return rows[0] ?? null
}

export default async (req: Request, context: Context): Promise<Response> => {
  const body = await readJson(req)
  const fields = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const username = normalizeUsername(fields.username)
  const password = typeof fields.password === 'string' ? fields.password : ''

  // Per IP stops one client trying many accounts; per username stops many IPs guessing one.
  const retryAfter = await checkRateLimit([
    { key: `login:ip:${context.ip}`, limit: 20, windowSeconds: WINDOW_SECONDS },
    { key: `login:user:${username}`, limit: 10, windowSeconds: WINDOW_SECONDS },
  ])
  if (retryAfter) return tooManyRequests(retryAfter)

  const user = await findUser(username)
  const isValid = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyAgainstDecoy(password)
  if (!user || !isValid) return errorResponse(401, 'Wrong username or password.')

  return signIn(user)
}

export const config: Config = { path: '/api/login', method: 'POST' }
