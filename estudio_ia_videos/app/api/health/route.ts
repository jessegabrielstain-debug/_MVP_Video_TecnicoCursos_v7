/**
 * GET /api/health
 * 
 * Public healthcheck endpoint for monitoring.
 * Returns 200 OK if all checks pass, 503 Service Unavailable if any check fails.
 * 
 * Used by:
 * - Vercel health checks
 * - UptimeRobot external monitoring
 * - Playwright smoke tests
 * - Load balancers
 */

import { NextResponse } from 'next/server'
import { getSupabaseForRequest } from '~/lib/services/supabase-server'
import { createRedisClient } from '~/lib/services/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CheckStatus = 'ok' | 'warning' | 'error'

interface Check {
  status: CheckStatus
  latency_ms?: number
  message?: string
  waiting?: number
  active?: number
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  checks: {
    database: Check
    redis: Check
    queue: Check
  }
}

async function checkDatabase(): Promise<Check> {
  const start = Date.now()
  try {
    const supabase = getSupabaseForRequest(new Request('http://localhost'))
    const { error } = await supabase.from('render_jobs').select('id').limit(1).single()
    const latency_ms = Date.now() - start
    
    // PGRST116 = no rows found (acceptable for healthcheck)
    if (error && error.code !== 'PGRST116') {
      return { status: 'error', message: error.message, latency_ms }
    }
    
    return { status: 'ok', latency_ms }
  } catch (err) {
    return { 
      status: 'error', 
      message: (err as Error).message, 
      latency_ms: Date.now() - start 
    }
  }
}

async function checkRedis(): Promise<Check> {
  const start = Date.now()
  try {
    const redis = createRedisClient()
    await redis.set('healthcheck', Date.now().toString(), 'EX', 10)
    const latency_ms = Date.now() - start
    return { status: 'ok', latency_ms }
  } catch (err) {
    return { 
      status: 'error', 
      message: (err as Error).message, 
      latency_ms: Date.now() - start 
    }
  }
}

async function checkQueue(): Promise<Check> {
  try {
    // TODO: Integrar com BullMQ quando disponível
    // const queue = getQueue('render')
    // const waiting = await queue.getWaitingCount()
    // const active = await queue.getActiveCount()
    // if (waiting > 100) {
    //   return { status: 'warning', waiting, active, message: 'Queue backed up' }
    // }
    // return { status: 'ok', waiting, active }
    
    return { status: 'ok', waiting: 0, active: 0 }
  } catch (err) {
    return { status: 'error', message: (err as Error).message }
  }
}


export async function GET() {
  const timestamp = new Date().toISOString()
  
  const [database, redis, queue] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkQueue()
  ])

  const checks = { database, redis, queue }
  const hasError = Object.values(checks).some(c => c.status === 'error')
  const status = hasError ? 'unhealthy' : 'healthy'
  const httpStatus = hasError ? 503 : 200

  const response: HealthResponse = { status, timestamp, checks }

  return NextResponse.json(response, { 
    status: httpStatus,
    headers: { 
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json'
    }
  })
}

