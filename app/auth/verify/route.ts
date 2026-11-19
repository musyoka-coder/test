import { NextRequest, NextResponse } from 'next/server'
import { appOrigin } from '@/lib/security'
import { configured, db } from '@/lib/db'
import { selection } from '@/lib/site'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams
  const code = query.get('code')
  if (code && configured()) {
    const s = await db()
    const { data, error } = await s.auth.exchangeCodeForSession(code)
    if (!error) {
      if (query.get('mode') === 'reset')
        return NextResponse.redirect(
          new URL('/account?mode=reset', appOrigin()),
        )
      const choice = selection(
        query.get('months') ?? data.user.user_metadata.booking_months,
        query.get('cabin') ?? data.user.user_metadata.booking_cabin,
      )
      return NextResponse.redirect(
        new URL(choice.size ? '/book?' + choice : '/dashboard', appOrigin()),
      )
    }
  }
  return NextResponse.redirect(
    new URL(
      '/account?error=Link+expired+or+opened+in+a+different+browser.+Sign+in+or+request+a+new+link.',
      appOrigin(),
    ),
  )
}
