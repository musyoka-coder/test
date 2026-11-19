import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import {
  appOrigin,
  contentPolicy,
  csrfCookie,
  randomToken,
} from '@/lib/security'

export async function proxy(request: NextRequest) {
  const nonce = randomToken()
  const policy = contentPolicy(nonce, process.env.NODE_ENV === 'development')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Content-Security-Policy', policy)
  const cookieName = csrfCookie()
  const newToken =
    request.method === 'GET' && !request.cookies.has(cookieName)
      ? randomToken()
      : null
  if (newToken) request.cookies.set(cookieName, newToken)

  function nextResponse() {
    requestHeaders.set('cookie', request.cookies.toString())
    return NextResponse.next({ request: { headers: requestHeaders } })
  }
  let response = nextResponse()
  const privatePages = ['/account', '/book', '/dashboard', '/admin']
  const path = request.nextUrl.pathname
  const hasSession = request.cookies
    .getAll()
    .some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))
  if (
    request.method === 'GET' &&
    !hasSession &&
    ['/dashboard', '/admin'].includes(path)
  ) {
    response = NextResponse.redirect(new URL('/account', appOrigin()))
  } else if (
    hasSession &&
    privatePages.includes(path) &&
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_PUBLISHABLE_KEY
  ) {
    const client = createServerClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (items) => {
            for (const { name, value } of items)
              request.cookies.set(name, value)
            response = nextResponse()
            for (const { name, value, options } of items)
              response.cookies.set(name, value, options)
          },
        },
      },
    )
    await client.auth.getUser()
  }
  response.headers.set('Content-Security-Policy', policy)
  response.headers.set('Cache-Control', 'private, no-store')
  if (newToken)
    response.cookies.set(cookieName, newToken, {
      httpOnly: true,
      secure: cookieName.startsWith('__Host-'),
      sameSite: 'lax',
      path: '/',
    })
  return response
}

export const config = { matcher: ['/((?!_next/|favicon.ico).*)'] }
