export async function reportFailure(
  operation: string,
  error: { code?: string },
) {
  const code =
    error.code && /^[a-zA-Z0-9_]{1,80}$/.test(error.code)
      ? error.code
      : 'unknown'
  console.error(JSON.stringify({ event: 'operation_failed', operation, code }))
  if (process.env.SENTRY_DSN) {
    const { captureMessage } = await import('@sentry/nextjs')
    captureMessage('Operation failed', {
      level: 'error',
      tags: { operation, code },
    })
  }
}
