/** Public profiles live at /u/<username>; the pattern matches what registration allows. */
const PROFILE_PATH = /^\/u\/([A-Za-z0-9_-]{3,24})\/?$/

export const profileFromPath = (path: string): string | null =>
  PROFILE_PATH.exec(path)?.[1]?.toLowerCase() ?? null

export const profilePath = (username: string): string => `/u/${username}`
