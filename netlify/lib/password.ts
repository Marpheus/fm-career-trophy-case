import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

// OWASP's scrypt baseline: N=2^17, r=8, p=1. Needs ~128 MB, above Node's 32 MB default.
const PARAMS = { N: 2 ** 17, r: 8, p: 1 } as const
const KEY_LENGTH = 64
const MAX_MEMORY = 256 * 1024 * 1024

const derive = (password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { ...options, maxmem: MAX_MEMORY }, (error, key) =>
      error ? reject(error) : resolve(key),
    )
  })

/** Format: scrypt$N$r$p$salt$key, so the cost can be raised later without breaking logins. */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16)
  const key = await derive(password, salt, PARAMS)
  const { N, r, p } = PARAMS
  return ['scrypt', N, r, p, salt.toString('base64'), key.toString('base64')].join('$')
}

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [scheme, N, r, p, salt, key] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !key) return false
  const expected = Buffer.from(key, 'base64')
  if (expected.length !== KEY_LENGTH) return false
  const actual = await derive(password, Buffer.from(salt, 'base64'), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  })
  return timingSafeEqual(actual, expected)
}

// Verified against when the username does not exist, so a miss takes as long as a wrong
// password and response times do not reveal which usernames are registered.
let decoyHash: Promise<string> | null = null
export const verifyAgainstDecoy = async (password: string): Promise<false> => {
  decoyHash ??= hashPassword(randomBytes(16).toString('hex'))
  await verifyPassword(password, await decoyHash)
  return false
}
