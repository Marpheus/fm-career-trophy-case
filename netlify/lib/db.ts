import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let client: NeonQueryFunction<false, false> | null = null

/** Lazily connects, so a missing DATABASE_URL fails the request rather than the deploy. */
export const db = (): NeonQueryFunction<false, false> => {
  if (client) return client
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  client = neon(url)
  return client
}
