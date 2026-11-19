import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { configured, db } from '@/lib/db'
import { csrfCookie, tokensMatch } from '@/lib/security'

export function result(path: string, message: string, good = false): never {
  const url = new URL(path, 'https://internal.invalid')
  url.searchParams.set(good ? 'notice' : 'error', message)
  redirect(url.pathname + url.search)
}

export async function client(path: string, form: FormData) {
  const cookie = (await cookies()).get(csrfCookie())?.value
  if (!tokensMatch(cookie, form.get('csrf_token'))) {
    result(path, 'Your form session expired. Reload the page and try again.')
  }
  if (!configured())
    result(path, 'The booking service is offline. Try again later.')
  return db()
}

export const fields = (form: FormData) => Object.fromEntries(form)
