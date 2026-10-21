import type { Config, Context } from '@netlify/functions'
import { jsonResponse } from '../lib/http'
import { currentUser } from '../lib/session'

/** Signed-out is a normal answer here, not an error, so the page load stays quiet. */
export default async (_req: Request, context: Context): Promise<Response> => {
  const user = await currentUser(context)
  return jsonResponse({ username: user?.username ?? null })
}

export const config: Config = { path: '/api/me', method: 'GET' }
