/** Roomy for a whole career's wins, small enough that nobody stores a novel. */
const MAX_BODY_BYTES = 1_000_000

export const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
  Response.json(body, init)

export const errorResponse = (
  status: number,
  message: string,
  headers: Record<string, string> = {},
): Response => Response.json({ error: message }, { status, headers })

export const tooManyRequests = (retryAfterSeconds: number): Response =>
  errorResponse(429, 'Too many attempts. Try again later.', {
    'Retry-After': String(retryAfterSeconds),
  })

/**
 * Parses a JSON body, or returns undefined. Requiring the JSON content type also keeps
 * cross-site HTML forms out: they cannot send it without a CORS preflight.
 */
export const readJson = async (req: Request): Promise<unknown> => {
  if (!req.headers.get('content-type')?.includes('application/json')) return undefined
  const text = await req.text()
  if (text.length > MAX_BODY_BYTES) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}
