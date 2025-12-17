/**
 * 🏥 REDIS HEALTH CHECK API
 * Endpoint para monitorar saúde e métricas do Redis
 */

import { NextRequest, NextResponse } from "next/server"
import { redisOptimized } from "@/lib/cache/redis-optimized"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    // Health check
    const healthCheck = await redisOptimized.healthCheck()
    
    // Comprehensive stats
    const stats = await redisOptimized.getStats()

    // Response data
    const response = {
      timestamp: new Date().toISOString(),
      redis: {
        health: healthCheck,
        metrics: stats,
        status: healthCheck.healthy ? "healthy" : "unhealthy"
      }
    }

    return NextResponse.json(response, {
      status: healthCheck.healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json"
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Redis health check error", error instanceof Error ? error : new Error(errorMessage), { component: 'API: redis/health' })
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      redis: {
        health: { healthy: false, error: errorMessage },
        status: "error"
      }
    }, { 
      status: 500,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json"
      }
    })
  }
}
