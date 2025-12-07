import { NextResponse } from 'next/server'
import { renderPrometheus } from '@/lib/metrics'

export async function GET() {
  const body = renderPrometheus()
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; version=0.0.4' } })
}

