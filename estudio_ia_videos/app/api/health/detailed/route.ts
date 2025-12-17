/**
 * 🩺 Detailed Health Check API - Professional system health monitoring
 * Demonstrates best practices for API route implementation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createApiLogger, createResponseHeaders } from '@/lib/logger-api'
import { createErrorResponse, DatabaseError, withRetry } from '@/lib/error-handling'
import { createClient } from '@supabase/supabase-js'

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  latencyMs: number
  details?: Record<string, unknown>
}

interface HealthResponse {
  success: boolean
  status: 'healthy' | 'unhealthy' | 'degraded'
  version: string
  environment: string
  timestamp: string
  checks: HealthCheckResult[]
  metrics: {
    totalLatencyMs: number
    healthyCount: number
    unhealthyCount: number
    degradedCount: number
  }
  system: {
    nodeVersion: string
    uptimeSeconds: number
    memoryUsageMB: number
  }
}

/**
 * Check Supabase database connectivity
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      service: 'database',
      status: 'unhealthy',
      latencyMs: 0,
      details: { error: 'Missing Supabase configuration' },
    }
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Simple query to check connectivity
    const { error } = await withRetry(
      async () => {
        const result = await supabase.rpc('get_service_status').single()
        if (result.error && !result.error.message.includes('does not exist')) {
          throw new DatabaseError('health check', result.error)
        }
        return result
      },
      { maxAttempts: 2, delayMs: 200 }
    ).catch(async () => {
      // Fallback: simple select
      return supabase.from('projects').select('id').limit(1)
    })

    const latency = Date.now() - start

    // Any error except "function not found" is a real error
    if (error && !error.message?.includes('does not exist') && !error.message?.includes('no rows')) {
      return {
        service: 'database',
        status: 'unhealthy',
        latencyMs: latency,
        details: { error: error.message },
      }
    }

    return {
      service: 'database',
      status: latency > 1000 ? 'degraded' : 'healthy',
      latencyMs: latency,
      details: {
        provider: 'supabase',
        slowQuery: latency > 500,
      },
    }
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Check storage availability
 */
async function checkStorage(): Promise<HealthCheckResult> {
  const start = Date.now()
  const provider = (process.env.STORAGE_PROVIDER || 'supabase').toLowerCase()

  try {
    if (provider === 'supabase' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        return {
          service: 'storage',
          status: 'unhealthy',
          latencyMs: Date.now() - start,
          details: { error: error.message, provider },
        }
      }

      return {
        service: 'storage',
        status: 'healthy',
        latencyMs: Date.now() - start,
        details: {
          provider,
          bucketsCount: data?.length || 0,
        },
      }
    }

    // For other providers or local
    return {
      service: 'storage',
      status: 'healthy',
      latencyMs: Date.now() - start,
      details: { provider },
    }
  } catch (error) {
    return {
      service: 'storage',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        provider,
      },
    }
  }
}

/**
 * Check TTS service availability
 */
async function checkTTS(): Promise<HealthCheckResult | null> {
  if (!process.env.ELEVENLABS_API_KEY && !process.env.AZURE_TTS_KEY) {
    return null // TTS not configured
  }

  const start = Date.now()

  try {
    if (process.env.ELEVENLABS_API_KEY) {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        signal: AbortSignal.timeout(5000),
      })

      return {
        service: 'tts-elevenlabs',
        status: response.ok ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - start,
        details: {
          statusCode: response.status,
        },
      }
    }

    return {
      service: 'tts',
      status: 'healthy',
      latencyMs: Date.now() - start,
      details: { provider: 'azure' },
    }
  } catch (error) {
    return {
      service: 'tts',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * GET /api/health/detailed
 * Returns comprehensive system health status
 */
export async function GET(request: NextRequest) {
  const log = createApiLogger(request, 'health-detailed')
  log.logRequestStart()

  try {
    // Run health checks in parallel
    const [dbCheck, storageCheck, ttsCheck] = await Promise.all([
      checkDatabase(),
      checkStorage(),
      checkTTS(),
    ])

    // Collect all results
    const checks: HealthCheckResult[] = [dbCheck, storageCheck]
    if (ttsCheck) checks.push(ttsCheck)

    // Calculate status counts
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length
    const degradedCount = checks.filter(c => c.status === 'degraded').length
    const healthyCount = checks.filter(c => c.status === 'healthy').length

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy'
    } else if (degradedCount > 0) {
      overallStatus = 'degraded'
    }

    // System metrics
    const memoryUsage = process.memoryUsage()

    const response: HealthResponse = {
      success: overallStatus !== 'unhealthy',
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      checks,
      metrics: {
        totalLatencyMs: checks.reduce((sum, c) => sum + c.latencyMs, 0),
        healthyCount,
        unhealthyCount,
        degradedCount,
      },
      system: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
    }

    const statusCode = overallStatus === 'unhealthy' ? 503 : 200

    log.logRequestComplete(statusCode, {
      overallStatus,
      checksCount: checks.length,
    })

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        ...createResponseHeaders(log),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    return createErrorResponse(error, log)
  }
}
