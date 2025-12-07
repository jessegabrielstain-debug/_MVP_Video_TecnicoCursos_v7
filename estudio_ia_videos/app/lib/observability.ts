import * as Sentry from '@sentry/nextjs'

let initialized = false

export function initObservability() {
  if (initialized) return
  const dsn = process.env.SENTRY_DSN || ''
  if (!dsn) return
  Sentry.init({ dsn, tracesSampleRate: 0.1 })
  initialized = true
}

export function captureError(error: unknown) {
  try {
    initObservability()
    Sentry.captureException(error)
  } catch {}
}

