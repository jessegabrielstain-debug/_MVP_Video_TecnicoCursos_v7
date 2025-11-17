import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // noop: init handled by sentry.*.config.ts files
  }
}
