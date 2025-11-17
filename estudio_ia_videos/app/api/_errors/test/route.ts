import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    throw new Error('Sentry test error: manual trigger')
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ ok: false, message: 'Error captured to Sentry' }, { status: 500 })
  }
}
