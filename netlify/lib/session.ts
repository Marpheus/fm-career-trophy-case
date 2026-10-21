import { createHash, randomBytes } from 'node:crypto'
import type { Context } from '@netlify/functions'
import { db } from './db'
import { jsonResponse } from './http'

export interface SessionUser {
  readonly id: string
  readonly username: string
}

// Distinctive name: on a shared host like localhost, another app's 'session' cookie would clash.
const COOKIE_NAME = 'trophy_case_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

// Built by hand rather than with context.cookies, to be certain of HttpOnly and Secure.
const sessionCookie = (token: string, maxAge: number): string =>
  `${COOKIE_NAME}=${token}; Path=/api; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`

export const currentUser = async (context: Context): Promise<SessionUser | null> => {
  const token = context.cookies.get(COOKIE_NAME)
  if (!token) return null
  const rows = (await db()`
    SELECT users.id, users.username
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ${hashToken(token)} AND sessions.expires_at > now()
  `) as SessionUser[]
  return rows[0] ?? null
}

/** Opens a session and answers with the signed-in user plus its cookie. */
export const signIn = async (user: SessionUser): Promise<Response> => {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000)
  await db()`DELETE FROM sessions WHERE user_id = ${user.id} AND expires_at <= now()`
  await db()`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${user.id}, ${expiresAt})
  `
  return jsonResponse(
    { username: user.username },
    { headers: { 'Set-Cookie': sessionCookie(token, MAX_AGE_SECONDS) } },
  )
}

export const signOut = async (context: Context): Promise<Response> => {
  const token = context.cookies.get(COOKIE_NAME)
  if (token) await db()`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`
  return jsonResponse({ username: null }, { headers: { 'Set-Cookie': sessionCookie('', 0) } })
}
