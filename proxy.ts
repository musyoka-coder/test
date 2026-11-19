import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) return response
  if (!request.cookies.getAll().some(cookie => cookie.name.includes('-auth-token') && !cookie.name.endsWith('-code-verifier'))) return response
  const s = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        for (const {name,value} of items) request.cookies.set(name,value)
        response = NextResponse.next({ request })
        for (const {name,value,options} of items) response.cookies.set(name,value,options)
      }
    }
  })
  await s.auth.getUser()
  return response
}

export const config = { matcher: ['/account', '/book', '/dashboard', '/admin'] }
