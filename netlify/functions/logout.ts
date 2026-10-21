import type { Config, Context } from '@netlify/functions'
import { signOut } from '../lib/session'

export default async (_req: Request, context: Context): Promise<Response> => signOut(context)

export const config: Config = { path: '/api/logout', method: 'POST' }
