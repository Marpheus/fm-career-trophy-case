export interface Credentials {
  readonly username: string
  readonly password: string
}

const USERNAME_PATTERN = /^[a-z0-9_-]{3,24}$/
const MIN_PASSWORD = 8
const MAX_PASSWORD = 128

export const normalizeUsername = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

/** Validates a sign-in or registration body; returns a user-facing message on failure. */
export const parseCredentials = (body: unknown): Credentials | { error: string } => {
  if (typeof body !== 'object' || body === null) return { error: 'Missing username or password.' }
  const { username, password } = body as Record<string, unknown>
  const name = normalizeUsername(username)
  if (!USERNAME_PATTERN.test(name)) {
    return { error: 'Username: 3–24 characters, letters, digits, - or _.' }
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    return { error: `Password needs at least ${MIN_PASSWORD} characters.` }
  }
  if (password.length > MAX_PASSWORD) {
    return { error: `Password can be at most ${MAX_PASSWORD} characters.` }
  }
  return { username: name, password }
}
