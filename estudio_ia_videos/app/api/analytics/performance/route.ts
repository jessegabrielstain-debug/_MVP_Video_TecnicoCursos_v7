import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { getOrgId } from '@/lib/auth/session-helpers';
import { prisma } from '@/lib/db';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';
/**
 * GET /api/analytics/performance
 * Retorna métricas detalhadas de performance do sistema
 * 
 * Query params:
 * - period: '1h' | '24h' | '7d' | '30d' (default: '24h')
 * - metric: 'response_time' | 'throughput' | 'errors' | 'all' (default: 'all')
 * - endpoint?: string (filtrar por endpoint específico)
 */
async function getHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
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

    const whereClause = {
      createdAt: { gte: startDate },
      duration: { not: null },
      ...(organizationId && { organizationId }),
      ...(endpoint && { 
        metadata: {
          // Prisma JSON filter: path to 'path' and string_contains endpoint
          path: ['path'],
          string_contains: endpoint
        }
      })
    };

    const performanceData: Record<string, unknown> = {};

    // Métricas de tempo de resposta
    if (metric === 'response_time' || metric === 'all') {
      const responseTimeStats = await prisma.analyticsEvent.aggregate({
        where: whereClause,
        _avg: { duration: true },
        _max: { duration: true },
        _min: { duration: true },
        _count: { duration: true }
      });

      // Distribuição de tempos de resposta
      const responseTimeDistribution = await prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN duration < 100 THEN '0-100ms'
            WHEN duration < 500 THEN '100-500ms'
            WHEN duration < 1000 THEN '500ms-1s'
            WHEN duration < 2000 THEN '1-2s'
            WHEN duration < 5000 THEN '2-5s'
            ELSE '5s+'
          END as range,
          COUNT(*) as count
        FROM analytics_event 
        WHERE created_at >= ${startDate} 
        AND duration IS NOT NULL
        ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
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
      const endpointPerformance = await prisma.analyticsEvent.groupBy({
        by: ['category', 'action'],
        where: whereClause,
        _avg: { duration: true },
        _count: { duration: true },
        orderBy: { _avg: { duration: 'desc' } },
        take: 10
      });

      performanceData.responseTime = {
        stats: {
          avg: Math.round(responseTimeStats._avg.duration || 0),
          max: responseTimeStats._max.duration || 0,
          min: responseTimeStats._min.duration || 0,
          count: responseTimeStats._count.duration || 0
        },
        distribution: responseTimeDistribution,
        byEndpoint: endpointPerformance.map((item) => ({
          endpoint: `${item.category}/${item.action}`,
          avgTime: Math.round(item._avg.duration || 0),
          requests: item._count.duration
        }))
      };
    }

    // Métricas de throughput (requisições por minuto)
    if (metric === 'throughput' || metric === 'all') {
      const throughputData = await prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:00') as minute,
          COUNT(*) as requests
        FROM analytics_event 
        WHERE created_at >= ${startDate}
        ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
        GROUP BY minute
        ORDER BY minute DESC
        LIMIT 60
      `;

      const avgThroughput = await prisma.analyticsEvent.count({
        where: whereClause
      });

      const minutesInPeriod = Math.max(1, (Date.now() - startDate.getTime()) / (1000 * 60));

      performanceData.throughput = {
        avgRequestsPerMinute: Math.round(avgThroughput / minutesInPeriod),
        timeline: throughputData,
        totalRequests: avgThroughput
      };
    }

    // Métricas de erro
    if (metric === 'errors' || metric === 'all') {
      const errorStats = await prisma.analyticsEvent.groupBy({
        by: ['status'],
        where: {
          ...whereClause,
          status: { in: ['error', 'warning'] }
        },
        _count: { id: true }
      });

      const errorsByCategory = await prisma.analyticsEvent.groupBy({
        by: ['category', 'errorCode'],
        where: {
          ...whereClause,
          status: 'error',
          errorCode: { not: null }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      const totalRequests = await prisma.analyticsEvent.count({
        where: {
          createdAt: { gte: startDate },
          ...(organizationId && { organizationId })
        }
      });

      const totalErrors = errorStats.reduce((sum, item) => sum + item._count.id, 0);

      performanceData.errors = {
        errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0',
        totalErrors,
        byStatus: errorStats.map((item) => ({
          status: item.status,
          count: item._count.id
        })),
        byCategory: errorsByCategory.map((item) => ({
          category: item.category,
          errorCode: item.errorCode,
          count: item._count.id
        }))
      };
    }

    // ✅ REAL - System metrics (from SystemMetrics table)
    if (metric === 'all') {
      const latestSystemMetrics = await prisma.systemMetrics.findFirst({
        orderBy: { date: 'desc' }
      });

      // Queue size from render jobs
      const queueSize = await prisma.renderJob.count({
        where: { status: 'pending' }
      });

      // Map available fields and provide sensible defaults (cpu/memory/disk/network are not stored in SystemMetrics schema)
      performanceData.system = {
        cpu: 0,
        memory: 0,
        disk: Number(latestSystemMetrics?.totalStorage || 0) > 0
          ? Math.min(100, Math.round(Number(latestSystemMetrics.videoStorage || 0) / Number(latestSystemMetrics.totalStorage || 1) * 100))
          : 0,
        network: {
          inbound: 0,
          outbound: 0
        },
        activeConnections: latestSystemMetrics?.activeUsers || 0,
        queueSize: latestSystemMetrics?.processingQueue ?? queueSize
      };
    }

    // ✅ REAL - Métricas de cache (from analytics_event metadata)
    if (metric === 'all') {
      const cacheEvents = await prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: startDate },
          category: 'cache',
          ...(organizationId && { organizationId })
        },
        select: {
          action: true,
          metadata: true
        }
      });

      const totalHits = cacheEvents.filter(e => e.action === 'hit').length;
      const totalMisses = cacheEvents.filter(e => e.action === 'miss').length;
      const evictions = cacheEvents.filter(e => e.action === 'eviction').length;
      const total = totalHits + totalMisses;

      const hitRate = total > 0 ? ((totalHits / total) * 100).toFixed(1) : '0';
      const missRate = total > 0 ? ((totalMisses / total) * 100).toFixed(1) : '0';

      // Get cache size from latest cache event metadata
      const latestCacheEvent = cacheEvents.find(e => {
        const meta = e.metadata as unknown as Record<string, unknown> | null;
        return !!(meta && 'cacheSize' in meta);
      });
      const cacheSize = latestCacheEvent ? Number((latestCacheEvent.metadata as unknown as Record<string, unknown>).cacheSize ?? 0) : 0;

      performanceData.cache = {
        hitRate,
        missRate,
        totalHits,
        totalMisses,
        evictions,
        size: Math.round(cacheSize / (1024 * 1024)) // Convert to MB
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
    console.error('[Analytics Performance] Error:', error);
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
    const session = await getServerSession(authConfig);
    
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
        organizationId,
        userId,
        category: 'performance',
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
    });

    return NextResponse.json({
      success: true,
      message: 'Performance metric recorded'
    });

  } catch (error: unknown) {
    console.error('[Analytics Performance POST] Error:', error);
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
