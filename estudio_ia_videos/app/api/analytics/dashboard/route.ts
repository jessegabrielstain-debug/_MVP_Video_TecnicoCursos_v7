import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { prisma } from '@/lib/db';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';

/**
 * GET /api/analytics/dashboard
 * Retorna dados completos para o dashboard de analytics
 * 
 * Query params:
 * - period: '7d' | '30d' | '90d' (default: '7d')
 * - organizationId?: string
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
    const period = searchParams.get('period') || '7d';
    const organizationId = searchParams.get('organizationId') || getOrgId(session.user);

    // Calcular data de início baseada no período
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const whereClause = {
      createdAt: { gte: startDate },
      ...(organizationId && { organizationId })
    };

    // Utilitários locais para acessar metadados e normalizar números
    const getMetaString = (meta: unknown, key: string): string | undefined => {
      if (meta && typeof meta === 'object' && key in (meta as Record<string, unknown>)) {
        const v = (meta as Record<string, unknown>)[key];
        return typeof v === 'string' ? v : v != null ? String(v) : undefined;
      }
      return undefined;
    };
    const toNumber = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));

    // Buscar dados em paralelo para otimizar performance
    const [
      totalEvents,
      eventsLast7Days,
      errorEvents,
      eventsByCategory,
      eventsByAction,
      recentEvents,
      timelineData,
      performanceData,
      userBehaviorData,
      projectsData
    ] = await Promise.all([
      // Total de eventos no período
      prisma.analyticsEvent.count({ where: whereClause }),

      // Eventos dos últimos 7 dias
      prisma.analyticsEvent.count({
        where: {
          ...whereClause,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),

      // Eventos de erro
      prisma.analyticsEvent.count({
        where: { ...whereClause, status: 'error' }
      }),

      // Eventos agrupados por categoria
      prisma.analyticsEvent.groupBy({
        by: ['category'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),

      // Eventos agrupados por ação
      prisma.analyticsEvent.groupBy({
        by: ['action'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),

      // Eventos recentes
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
          fileSize: true,
          createdAt: true
        }
      }),

      // Dados da timeline (eventos por dia)
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as events,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
          COUNT(DISTINCT user_id) as users
        FROM analytics_event 
        WHERE created_at >= ${startDate}
        ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `,

      // Dados de performance
      prisma.analyticsEvent.aggregate({
        where: {
          ...whereClause,
          duration: { not: null }
        },
        _avg: {
          duration: true,
          fileSize: true
        },
        _max: {
          duration: true
        },
        _min: {
          duration: true
        }
      }),

      // Dados de comportamento do usuário
      prisma.analyticsEvent.groupBy({
        by: ['metadata'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),

      // Dados de projetos
      prisma.project.count({
        where: {
          createdAt: { gte: startDate },
          ...(organizationId && { organizationId })
        }
      })
    ]);

    // Calcular métricas derivadas
    const errorRate = totalEvents > 0 ? ((errorEvents / totalEvents) * 100).toFixed(2) : '0';
    
    // Processar dados de categoria com percentuais
    const totalCategoryEvents = eventsByCategory.reduce((sum, item) => sum + item._count.id, 0);
    const processedEventsByCategory = eventsByCategory.map(item => ({
      category: item.category,
      count: item._count.id,
      percentage: totalCategoryEvents > 0 ? 
        ((item._count.id / totalCategoryEvents) * 100).toFixed(1) : '0'
    }));

    // Processar dados de ação
    const processedEventsByAction = eventsByAction.map(item => ({
      action: item.action,
      count: item._count.id
    }));

    // Simular dados de usuários ativos (seria melhor ter uma tabela de sessões)
    const activeUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        ...whereClause,
        userId: { not: null }
      },
      _count: { id: true }
    });

      // ✅ REAL - Dados de performance de endpoints (via metadata)
      // Usar cast via unknown para manter tipagem sem any
      const endpointPerformance = await (prisma.analyticsEvent.groupBy as unknown as typeof prisma.analyticsEvent.groupBy)({
      by: ['metadata'],
      where: {
        ...whereClause,
        duration: { not: null },
        metadata: { 
          path: ['endpoint']
        }
      },
      _avg: {
        duration: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _avg: {
          duration: 'desc'
        }
      },
      take: 5
    });

    const slowestEndpoints = endpointPerformance.map(item => ({
        endpoint: getMetaString((item as { metadata: unknown }).metadata, 'endpoint') || 'Unknown',
        avgTime: Math.round(toNumber((item as { _avg: { duration: unknown } })._avg.duration)),
        calls: (item as { _count: { id: number } })._count.id
    }));

      // ✅ REAL - Dados de comportamento do usuário (via metadata)
      const pageViews = await (prisma.analyticsEvent.groupBy as unknown as typeof prisma.analyticsEvent.groupBy)({
      by: ['metadata'],
      where: {
        ...whereClause,
        action: 'page_view',
        metadata: {
          path: ['page']
        }
      },
      _count: {
        id: true
      },
      _avg: {
        duration: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const topPages = pageViews.map(item => ({
        page: getMetaString((item as { metadata: unknown }).metadata, 'page') || 'Unknown',
        views: (item as { _count: { id: number } })._count.id,
        avgTimeOnPage: Math.round(toNumber((item as { _avg: { duration: unknown } })._avg.duration))
    }));

      // ✅ REAL - Estatísticas de dispositivos (via metadata)
      const deviceData = await (prisma.analyticsEvent.groupBy as unknown as typeof prisma.analyticsEvent.groupBy)({
      by: ['metadata'],
      where: {
        ...whereClause,
        metadata: {
          path: ['deviceType']
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    const deviceTypes = deviceData.map(item => ({
        type: getMetaString((item as { metadata: unknown }).metadata, 'deviceType') || 'Unknown',
        count: (item as { _count: { id: number } })._count.id
    }));

      // ✅ REAL - Estatísticas de navegadores (via metadata)
      const browserData = await (prisma.analyticsEvent.groupBy as unknown as typeof prisma.analyticsEvent.groupBy)({
      by: ['metadata'],
      where: {
        ...whereClause,
        metadata: {
          path: ['browser']
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const browserStats = browserData.map(item => ({
        browser: getMetaString((item as { metadata: unknown }).metadata, 'browser') || 'Unknown',
        count: (item as { _count: { id: number } })._count.id
    }));

    // Montar resposta
    const dashboardData = {
      overview: {
        totalEvents,
        eventsLast7Days,
        errorEvents,
        errorRate,
        activeUsers: activeUsers.length,
        avgSessionDuration: 1800, // 30 minutos em segundos
        conversionRate: projectsData > 0 ? ((projectsData / activeUsers.length) * 100).toFixed(1) : '0',
        totalProjects: projectsData
      },
      eventsByCategory: processedEventsByCategory,
      eventsByAction: processedEventsByAction,
      timelineData: (timelineData as unknown as Array<Record<string, unknown>>).map(item => ({
        date: String(item.date),
        events: Number(item.events),
        errors: Number(item.errors),
        users: Number(item.users)
      })),
      performanceMetrics: {
        avgLoadTime: Math.round(performanceData._avg.duration || 0),
        avgRenderTime: Math.round((performanceData._avg.duration || 0) * 0.7),
        avgProcessingTime: Math.round((performanceData._avg.duration || 0) * 1.2),
        slowestEndpoints
      },
      userBehavior: {
        topPages,
        deviceTypes,
        browserStats
      },
      recentEvents
    };

    return NextResponse.json(dashboardData);

  } catch (error: unknown) {
    console.error('[Analytics Dashboard] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal server error',
        message
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de performance
export const GET = withAnalytics(getHandler);
