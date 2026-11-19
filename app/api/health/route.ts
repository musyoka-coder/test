import { configured, db } from '@/lib/db'

export async function GET() {
  let ready = false
  if (configured()) {
    try {
      const client = await db()
      const { error } = await client
        .from('packages')
        .select('months')
        .limit(1)
        .abortSignal(AbortSignal.timeout(2500))
      ready = !error
    } catch {
      ready = false
    }
  }
  return Response.json(
    { status: ready ? 'ok' : 'degraded' },
    {
      status: ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
