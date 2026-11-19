import { cookies } from 'next/headers'
import { csrfCookie } from '@/lib/security'

export async function CsrfField() {
  const token = (await cookies()).get(csrfCookie())?.value
  return <input type="hidden" name="csrf_token" value={token ?? ''} />
}
