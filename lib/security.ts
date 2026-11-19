import { randomBytes, timingSafeEqual } from 'node:crypto'

export function appOrigin(
  env: Record<string, string | undefined> = process.env,
) {
  const deploymentHost =
    env.VERCEL_ENV === 'production'
      ? env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL
      : env.VERCEL_URL
  const url = new URL(
    env.APP_URL ||
      (deploymentHost ? 'https://' + deploymentHost : 'http://localhost:3000'),
  )
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Invalid application origin')
  }
  return url.origin
}

export function csrfCookie() {
  return appOrigin().startsWith('https:') ? '__Host-quiet-csrf' : 'quiet-csrf'
}

export const randomToken = () => randomBytes(32).toString('base64url')

export function tokensMatch(
  expected: string | undefined,
  submitted: FormDataEntryValue | null,
) {
  if (
    !expected ||
    typeof submitted !== 'string' ||
    !/^[\w-]{43}$/.test(expected) ||
    !/^[\w-]{43}$/.test(submitted)
  )
    return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(submitted))
}

export function contentPolicy(nonce: string, development: boolean) {
  return [
    "default-src 'self'",
    "script-src 'self' 'nonce-" +
      nonce +
      "' 'strict-dynamic'" +
      (development ? " 'unsafe-eval'" : ''),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://twendesasa.com",
    "font-src 'self' data:",
    "connect-src 'self'" + (development ? ' ws: wss:' : ''),
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}
