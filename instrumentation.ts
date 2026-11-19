import type { Instrumentation } from 'next'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    const { init } = await import('@sentry/nextjs')
    init({
      dsn: process.env.SENTRY_DSN,
      defaultIntegrations: false,
      tracesSampleRate: 0,
      beforeSend(event) {
        return {
          event_id: event.event_id,
          type: event.type,
          level: 'error',
          message: 'Quiet Reset server error',
          tags: {
            operation: event.tags?.operation ?? 'unhandled_request',
            code: event.tags?.code ?? 'unknown',
          },
        }
      },
    })
  }
}

export const onRequestError: Instrumentation.onRequestError = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    const { captureMessage } = await import('@sentry/nextjs')
    captureMessage('Unhandled request error', 'error')
  }
}
