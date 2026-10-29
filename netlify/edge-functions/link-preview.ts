/**
 * Adds Open Graph tags to the page, so a shared link unfurls into a card on Discord, Reddit
 * or Slack. Crawlers do not run JavaScript, so this has to happen before the HTML leaves.
 *
 * Runs on Deno, which cannot resolve the app's extensionless imports - hence no imports at
 * all, and the profile's numbers come precomputed from the profile endpoint.
 */

interface EdgeContext {
  next(): Promise<Response>
}

interface Summary {
  readonly conquered: number
  readonly conquerable: number
  readonly clubTitles: number
  readonly internationalWon: number
  readonly internationalTotal: number
}

interface Preview {
  readonly title: string
  readonly description: string
}

const SITE_NAME = 'Trophy Case'
const DEFAULT_PREVIEW: Preview = {
  title: SITE_NAME,
  description: 'Football Manager world conquest tracker',
}

const PROFILE_PATH = /^\/u\/([A-Za-z0-9_-]{3,24})\/?$/

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const describe = (summary: Summary): string =>
  [
    `${summary.conquered}/${summary.conquerable} nations conquered`,
    `${summary.clubTitles} ${summary.clubTitles === 1 ? 'title' : 'titles'}`,
    `${summary.internationalWon}/${summary.internationalTotal} international`,
  ].join(' · ')

const profilePreview = async (username: string, url: URL): Promise<Preview> => {
  try {
    const response = await fetch(new URL(`/api/profile/${username}`, url))
    if (!response.ok) return DEFAULT_PREVIEW
    const profile = (await response.json()) as { username: string; summary: Summary }
    return { title: `${profile.username} · ${SITE_NAME}`, description: describe(profile.summary) }
  } catch {
    return DEFAULT_PREVIEW
  }
}

const metaTags = (preview: Preview, url: URL): string => {
  const title = escapeHtml(preview.title)
  const description = escapeHtml(preview.description)
  const image = new URL('/og.png', url).href
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${escapeHtml(url.href)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ')
}

export default async (request: Request, context: EdgeContext): Promise<Response> => {
  const response = await context.next()
  if (!response.headers.get('content-type')?.includes('text/html')) return response

  const url = new URL(request.url)
  const username = PROFILE_PATH.exec(url.pathname)?.[1]?.toLowerCase()
  const preview = username ? await profilePreview(username, url) : DEFAULT_PREVIEW

  const html = (await response.text())
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(preview.title)}</title>`)
    .replace('</head>', `  ${metaTags(preview, url)}\n  </head>`)

  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(html, { status: response.status, headers })
}

export const config = { path: ['/', '/u/*'] }
