import { NextResponse } from 'next/server'
import { renderPrometheus, getMetricsJson } from '@/lib/metrics'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/metrics
 * 
 * Returns application metrics in Prometheus format or JSON
 * 
 * Query params:
 * - format: 'prometheus' (default) | 'json'
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'prometheus'
  
  // Basic auth check for metrics endpoint (optional)
  const authHeader = request.headers.get('authorization')
  const metricsToken = process.env.METRICS_TOKEN
  
  if (metricsToken && authHeader !== `Bearer ${metricsToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  if (format === 'json') {
    return NextResponse.json(getMetricsJson(), {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }
  
  // Default: Prometheus format
  return new NextResponse(renderPrometheus(), {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

