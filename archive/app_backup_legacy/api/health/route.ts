// @ts-nocheck
// TODO: Backup - fix types
import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
