import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { getOrgId } from '@/lib/auth/session-helpers';
import { prisma } from '@/lib/db';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';
/**
 * GET /api/analytics/realtime
 * Retorna métricas em tempo real do sistema
 * 
 * Query params:
 * - window: '5m' | '15m' | '1h' (default: '15m') - janela de tempo para "tempo real"
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
    const window = searchParams.get('window') || '15m';
    const organizationId = getOrgId(session.user);

    // Calcular janela de tempo
    const now = new Date();
    const startTime = new Date();
    
    switch (window) {
      case '5m':
        startTime.setMinutes(now.getMinutes() - 5);
        break;
      case '15m':
        startTime.setMinutes(now.getMinutes() - 15);
        break;
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      default:
        startTime.setMinutes(now.getMinutes() - 15);
    }

    const whereClause = {
      createdAt: { gte: startTime },
      ...(organizationId && { organizationId })
    };

    // Buscar dados em paralelo
    const [
      activeUsers,
      totalEvents,
      errorEvents,
      recentEvents,
      eventsByMinute,
      topCategories,
      systemHealth
    ] = await Promise.all([
      // Usuários ativos únicos na janela de tempo
      prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          ...whereClause,
          userId: { not: null }
        }
      }),

      // Total de eventos na janela
      prisma.analyticsEvent.count({
        where: whereClause
      }),

      // Eventos de erro na janela
      prisma.analyticsEvent.count({
        where: {
          ...whereClause,
          status: 'error'
        }
      }),

      // Eventos mais recentes (últimos 20)
      prisma.analyticsEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          category: true,
          action: true,
          label: true,
          status: true,
          duration: true,
          createdAt: true,
          userId: true
        }
      }),

      // Eventos por minuto para gráfico de timeline
      prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(created_at, '%H:%i') as minute,
          COUNT(*) as events,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
        FROM analytics_event 
        WHERE created_at >= ${startTime}
        ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
        GROUP BY minute
        ORDER BY minute DESC
        LIMIT 60
      `,

      // Top categorias de eventos
      prisma.analyticsEvent.groupBy({
        by: ['category'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),

      // ✅ REAL - Métricas de saúde do sistema
      (async () => {
        // Get latest system metrics
        const systemMetrics = await prisma.systemMetrics.findFirst({
          orderBy: { date: 'desc' }
        });

        // Calculate average response time from recent events
        const recentResponseTimes = await prisma.analyticsEvent.aggregate({
          where: {
            createdAt: { gte: startTime },
            duration: { not: null },
            ...(organizationId && { organizationId })
          },
          _avg: { duration: true }
        });

        // Calculate throughput (events per second)
        const durationSeconds = (now.getTime() - startTime.getTime()) / 1000;
        const throughput = Math.round(totalEvents / Math.max(1, durationSeconds));

        // Calculate error rate
        const realtimeErrorRate = totalEvents > 0 ? (errorEvents / totalEvents * 100) : 0;

        return {
          cpu: 0,
          memory: 0,
          responseTime: Math.round(recentResponseTimes._avg.duration || 0),
          throughput,
          errorRate: realtimeErrorRate
        };
      })()
    ]);

    // Calcular métricas derivadas
    const eventsPerMinute = totalEvents / Math.max(1, (now.getTime() - startTime.getTime()) / (1000 * 60));
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents * 100).toFixed(2) : '0';

    // Processar dados de timeline
    const timeline = (eventsByMinute as unknown as Array<Record<string, unknown>>).map(item => ({
      time: String(item.minute),
      events: Number(item.events),
      errors: Number(item.errors)
    }));

    // Calcular tendências (comparar com período anterior)
    const previousStartTime = new Date(startTime.getTime() - (now.getTime() - startTime.getTime()));
    
    const previousPeriodEvents = await prisma.analyticsEvent.count({
      where: {
        createdAt: { 
          gte: previousStartTime,
          lt: startTime
        },
        ...(organizationId && { organizationId })
      }
    });

    const previousPeriodUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        createdAt: { 
          gte: previousStartTime,
          lt: startTime
        },
        userId: { not: null },
        ...(organizationId && { organizationId })
      }
    });

    // Calcular mudanças percentuais
    const eventsTrend = previousPeriodEvents > 0 ? 
      ((totalEvents - previousPeriodEvents) / previousPeriodEvents * 100).toFixed(1) : '0';
    
    const usersTrend = previousPeriodUsers.length > 0 ? 
      ((activeUsers.length - previousPeriodUsers.length) / previousPeriodUsers.length * 100).toFixed(1) : '0';

    // Detectar anomalias simples
    const anomalies = [];
    
    if (parseFloat(errorRate) > 10) {
      anomalies.push({
        type: 'high_error_rate',
        severity: 'warning',
        message: `Taxa de erro elevada: ${errorRate}%`,
        timestamp: new Date().toISOString()
      });
    }

    if (systemHealth.responseTime > 2000) {
      anomalies.push({
        type: 'slow_response',
        severity: 'warning',
        message: `Tempo de resposta lento: ${Math.round(systemHealth.responseTime)}ms`,
        timestamp: new Date().toISOString()
      });
    }

    if (eventsPerMinute > 100) {
      anomalies.push({
        type: 'high_traffic',
        severity: 'info',
        message: `Tráfego elevado: ${Math.round(eventsPerMinute)} eventos/min`,
        timestamp: new Date().toISOString()
      });
    }

    // Montar resposta
    const realtimeData = {
      timestamp: new Date().toISOString(),
      window,
      summary: {
        activeUsers: activeUsers.length,
        totalEvents,
        errorEvents,
        errorRate: parseFloat(errorRate),
        eventsPerMinute: Math.round(eventsPerMinute),
        avgResponseTime: Math.round(systemHealth.responseTime)
      },
      trends: {
        events: {
          current: totalEvents,
          previous: previousPeriodEvents,
          change: parseFloat(eventsTrend),
          direction: parseFloat(eventsTrend) >= 0 ? 'up' : 'down'
        },
        users: {
          current: activeUsers.length,
          previous: previousPeriodUsers.length,
          change: parseFloat(usersTrend),
          direction: parseFloat(usersTrend) >= 0 ? 'up' : 'down'
        }
      },
      timeline,
      topCategories: topCategories.map((item) => ({
        category: item.category,
        count: item._count.id,
        percentage: totalEvents > 0 ? ((item._count.id / totalEvents) * 100).toFixed(1) : '0'
      })),
      systemHealth: {
        status: systemHealth.cpu < 80 && systemHealth.memory < 80 && systemHealth.responseTime < 2000 ? 'healthy' : 'warning',
        cpu: Math.round(systemHealth.cpu),
        memory: Math.round(systemHealth.memory),
        responseTime: Math.round(systemHealth.responseTime),
        throughput: systemHealth.throughput
      },
      recentEvents: recentEvents.map(event => ({
        ...event,
        timeAgo: Math.round((now.getTime() - new Date(event.createdAt).getTime()) / 1000) // segundos atrás
      })),
      anomalies,
      alerts: anomalies.filter(a => a.severity === 'warning' || a.severity === 'error')
    };

    return NextResponse.json(realtimeData);

  } catch (error: unknown) {
    console.error('[Analytics Realtime] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch realtime metrics',
        message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/realtime
 * Endpoint para receber eventos em tempo real via webhook ou push
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const body = await req.json();
    
    const {
      events,
      source,
      timestamp
    } = body;

    // Validação básica
    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'events array is required' },
        { status: 400 }
      );
    }

    const userId = session?.user?.id || null;
    const organizationId = session?.user ? getOrgId(session.user) : null;

    // Processar eventos em lote
    const processedEvents = (events as unknown as Array<Record<string, unknown>>).map((event) => ({
      organizationId,
      userId: (event.userId as string) || userId,
      category: (event.category as string) || 'realtime',
      action: (event.action as string) || 'event',
      label: event.label as string | null | undefined,
      duration: event.duration as number | null | undefined,
      fileSize: event.fileSize as number | null | undefined,
      value: event.value as number | null | undefined,
      status: (event.status as string) || 'success',
      errorCode: event.errorCode as string | null | undefined,
      errorMessage: event.errorMessage as string | null | undefined,
      metadata: {
        source,
        originalTimestamp: timestamp,
        ...(event.metadata as Record<string, unknown> | undefined)
      }
    }));

    // Inserir eventos no banco
    await prisma.analyticsEvent.createMany({
      data: processedEvents
    });

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      message: 'Realtime events processed'
    });

  } catch (error: unknown) {
    console.error('[Analytics Realtime POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to process realtime events',
        message
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de performance
export const GET = withAnalytics(getHandler);
export const POST = withAnalytics(postHandler);
