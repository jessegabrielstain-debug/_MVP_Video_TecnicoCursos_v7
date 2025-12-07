/**
 * 🎛️ MONITORING DASHBOARD API
 * Endpoint para dashboard de monitoramento
 */

import { NextRequest, NextResponse } from "next/server"
import { metrics } from "@/lib/monitoring/metrics"
import { logger } from "@/lib/monitoring/logger"
import { redisOptimized } from "@/lib/cache/redis-optimized"

export async function GET(request: NextRequest) {
  try {
    const systemMetrics = metrics.getSystemMetrics()
    const redisStats = await redisOptimized.getStats()
    const redisHealth = await redisOptimized.healthCheck()
    const summary = metrics.getSummary()

    const healthChecks = {
      redis: {
        status: redisHealth.healthy ? "healthy" : "unhealthy",
        score: redisHealth.healthy ? 100 : 0,
        latency: redisHealth.latency || 0
      },
      memory: {
        status: systemMetrics.memory.percentage < 80 ? "healthy" : "warning",
        score: Math.max(0, 100 - systemMetrics.memory.percentage),
        usage: systemMetrics.memory.percentage
      }
    }

    const overallScore = Math.round((healthChecks.redis.score + healthChecks.memory.score) / 2)
    const overallStatus = overallScore >= 80 ? "healthy" : overallScore >= 60 ? "warning" : "critical"

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: overallStatus,
      score: overallScore,
      health: healthChecks,
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      }
    })

  } catch (error) {
    logger.error("Dashboard generation failed", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: "error",
      score: 0,
      error: "Failed to generate dashboard data"
    }, { status: 500 })
  }
}
