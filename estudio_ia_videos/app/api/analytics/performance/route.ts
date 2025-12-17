import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/auth/session-helpers';
import { prisma } from '@/lib/db';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/analytics/performance
 * Retorna métricas detalhadas de performance do sistema
 */
async function getHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '24h';
    const metric = searchParams.get('metric') || 'all';
    const endpoint = searchParams.get('endpoint');
    const organizationId = getOrgId(session.user);

    // Calcular data de início baseada no período
    const startDate = new Date();
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }

    const performanceData: Record<string, unknown> = {};

    // Métricas de tempo de resposta
    if (metric === 'response_time' || metric === 'all') {
      const responseTimeStats = await prisma.$queryRaw<Array<{ avg: number, max: number, min: number, count: bigint }>>`
        SELECT 
          AVG(CAST(event_data->>'duration' AS FLOAT)) as avg,
          MAX(CAST(event_data->>'duration' AS FLOAT)) as max,
          MIN(CAST(event_data->>'duration' AS FLOAT)) as min,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= ${startDate}
        AND event_data->>'duration' IS NOT NULL
        ${endpoint ? Prisma.sql`AND event_data->'metadata'->>'endpoint' LIKE ${'%' + endpoint + '%'}` : Prisma.sql``}
      `;

      const stats = responseTimeStats[0] || { avg: 0, max: 0, min: 0, count: 0 };

      // Distribuição de tempos de resposta
      const responseTimeDistribution = await prisma.$queryRaw<Array<{ range: string, count: bigint }>>`
        SELECT 
          CASE 
            WHEN CAST(event_data->>'duration' AS FLOAT) < 100 THEN '0-100ms'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 500 THEN '100-500ms'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 1000 THEN '500ms-1s'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 2000 THEN '1-2s'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 5000 THEN '2-5s'
            ELSE '5s+'
          END as range,
          COUNT(*) as count
        FROM "AnalyticsEvent" 
        WHERE created_at >= ${startDate} 
        AND event_data->>'duration' IS NOT NULL
        ${endpoint ? Prisma.sql`AND event_data->'metadata'->>'endpoint' LIKE ${'%' + endpoint + '%'}` : Prisma.sql``}
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN '0-100ms' THEN 1
            WHEN '100-500ms' THEN 2
            WHEN '500ms-1s' THEN 3
            WHEN '1-2s' THEN 4
            WHEN '2-5s' THEN 5
            WHEN '5s+' THEN 6
          END
      `;

      // Tempos de resposta por endpoint
      const endpointPerformance = await prisma.$queryRaw<Array<{ endpoint: string, avg_time: number, requests: bigint }>>`
        SELECT 
          event_data->'metadata'->>'endpoint' as endpoint,
          AVG(CAST(event_data->>'duration' AS FLOAT)) as avg_time,
          COUNT(*) as requests
        FROM "AnalyticsEvent"
        WHERE created_at >= ${startDate}
        AND event_data->'metadata'->>'endpoint' IS NOT NULL
        AND event_data->>'duration' IS NOT NULL
        GROUP BY event_data->'metadata'->>'endpoint'
        ORDER BY avg_time DESC
        LIMIT 10
      `;

      performanceData.responseTime = {
        stats: {
          avg: Math.round(Number(stats.avg || 0)),
          max: Number(stats.max || 0),
          min: Number(stats.min || 0),
          count: Number(stats.count || 0)
        },
        distribution: responseTimeDistribution.map(item => ({ range: item.range, count: Number(item.count) })),
        byEndpoint: endpointPerformance.map((item) => ({
          endpoint: item.endpoint || 'Unknown',
          avgTime: Math.round(Number(item.avg_time || 0)),
          requests: Number(item.requests)
        }))
      };
    }

    // Métricas de throughput (requisições por minuto)
    if (metric === 'throughput' || metric === 'all') {
      const throughputData = await prisma.$queryRaw<Array<{ minute: string, requests: bigint }>>`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:00') as minute,
          COUNT(*) as requests
        FROM "AnalyticsEvent" 
        WHERE created_at >= ${startDate}
        GROUP BY minute
        ORDER BY minute DESC
        LIMIT 60
      `;

      const avgThroughput = await prisma.analyticsEvent.count({
        where: { createdAt: { gte: startDate } }
      });

      const minutesInPeriod = Math.max(1, (Date.now() - startDate.getTime()) / (1000 * 60));

      performanceData.throughput = {
        avgRequestsPerMinute: Math.round(avgThroughput / minutesInPeriod),
        timeline: throughputData.map(item => ({ minute: item.minute, requests: Number(item.requests) })),
        totalRequests: avgThroughput
      };
    }

    // Métricas de erro
    if (metric === 'errors' || metric === 'all') {
      const errorStats = await prisma.$queryRaw<Array<{ status: string, count: bigint }>>`
        SELECT 
          event_data->>'status' as status,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= ${startDate}
        AND event_data->>'status' IN ('error', 'warning')
        GROUP BY event_data->>'status'
      `;

      const errorsByCategory = await prisma.$queryRaw<Array<{ category: string, error_code: string, count: bigint }>>`
        SELECT 
          event_type as category,
          event_data->>'errorCode' as error_code,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= ${startDate}
        AND event_data->>'status' = 'error'
        GROUP BY event_type, event_data->>'errorCode'
        ORDER BY count DESC
        LIMIT 10
      `;

      const totalRequests = await prisma.analyticsEvent.count({
        where: {
          createdAt: { gte: startDate }
        }
      });

      const totalErrors = errorStats.reduce((sum, item) => sum + Number(item.count), 0);

      performanceData.errors = {
        errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0',
        totalErrors,
        byStatus: errorStats.map((item) => ({
          status: item.status || 'Unknown',
          count: Number(item.count)
        })),
        byCategory: errorsByCategory.map((item) => ({
          category: item.category || 'Unknown',
          errorCode: item.error_code || 'Unknown',
          count: Number(item.count)
        }))
      };
    }

    // ✅ REAL - System metrics (from RenderJob table as proxy)
    if (metric === 'all') {
      // Queue size from render jobs
      const queueSize = await prisma.renderJob.count({
        where: { status: 'queued' }
      });
      
      const processingCount = await prisma.renderJob.count({
        where: { status: 'processing' }
      });

      // Map available fields and provide sensible defaults
      performanceData.system = {
        cpu: 0, // Not available without system monitoring agent
        memory: 0,
        disk: 0,
        network: {
          inbound: 0,
          outbound: 0
        },
        activeConnections: 0,
        queueSize: queueSize + processingCount
      };
    }

    // ✅ REAL - Métricas de cache (from analytics_event metadata)
    if (metric === 'all') {
      const cacheStats = await prisma.$queryRaw<Array<{ action: string, count: bigint }>>`
        SELECT 
          event_data->>'action' as action,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= ${startDate}
        AND event_type = 'cache_event'
        GROUP BY event_data->>'action'
      `;

      const totalHits = Number(cacheStats.find(s => s.action === 'hit')?.count || 0);
      const totalMisses = Number(cacheStats.find(s => s.action === 'miss')?.count || 0);
      const evictions = Number(cacheStats.find(s => s.action === 'eviction')?.count || 0);
      const total = totalHits + totalMisses;

      const hitRate = total > 0 ? ((totalHits / total) * 100).toFixed(1) : '0';
      const missRate = total > 0 ? ((totalMisses / total) * 100).toFixed(1) : '0';

      performanceData.cache = {
        hitRate,
        missRate,
        totalHits,
        totalMisses,
        evictions,
        size: 0 // Cannot easily aggregate cache size from events without more complex query
      };
    }

    return NextResponse.json({
      period,
      metric,
      endpoint,
      generatedAt: new Date().toISOString(),
      ...performanceData
    });

  } catch (error: unknown) {
    logger.error('Failed to fetch performance metrics', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/performance' });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch performance metrics',
        message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/performance
 * Registra métricas de performance customizadas
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      endpoint,
      method,
      responseTime,
      statusCode,
      requestSize,
      responseSize,
      userAgent,
      ipAddress,
      metadata
    } = body;

    // Validação básica
    if (!endpoint || !responseTime) {
      return NextResponse.json(
        { error: 'endpoint and responseTime are required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const organizationId = getOrgId(session.user);

    // Registrar métrica de performance
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: 'performance_metric',
        eventData: {
          organizationId,
          action: 'api_call',
          label: endpoint,
          duration: responseTime,
          fileSize: requestSize,
          status: statusCode >= 400 ? 'error' : 'success',
          errorCode: statusCode >= 400 ? statusCode.toString() : null,
          metadata: {
            endpoint,
            method,
            statusCode,
            requestSize,
            responseSize,
            userAgent,
            ipAddress,
            ...metadata
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Performance metric recorded'
    });

  } catch (error: unknown) {
    logger.error('Failed to record performance metric', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/performance' });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to record performance metric',
        message
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de performance
export const GET = withAnalytics(getHandler);
export const POST = withAnalytics(postHandler);


