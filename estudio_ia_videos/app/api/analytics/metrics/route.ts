
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/analytics/metrics
 * Retorna métricas agregadas para dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '30d'; // 7d, 30d, 90d

    // Calcular data inicial baseado no período
    const now = new Date();
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Queries paralelas para melhor performance
    const [
      totalUploads,
      totalRenders,
      totalDownloads,
      renderJobs,
      recentProjects,
      eventsByDay
    ] = await Promise.all([
      // Total de uploads
      prisma.analyticsEvent.count({
        where: {
          userId,
          eventType: 'pptx_upload',
          createdAt: { gte: startDate }
        }
      }),

      // Total de renders completos
      prisma.analyticsEvent.count({
        where: {
          userId,
          eventType: 'render_complete',
          createdAt: { gte: startDate }
        }
      }),

      // Total de downloads
      prisma.analyticsEvent.count({
        where: {
          userId,
          eventType: 'video_download',
          createdAt: { gte: startDate }
        }
      }),

      // Status dos render jobs
      prisma.renderJob.groupBy({
        by: ['status'],
        where: {
          project: { userId },
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      }),

      // Projetos recentes
      prisma.project.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true
        }
      }),

      // Eventos por dia (para gráfico)
      (prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          event_type as category,
          COUNT(*) as count
        FROM analytics_events
        WHERE user_id = ${userId}::uuid
          AND created_at >= ${startDate}
        GROUP BY DATE(created_at), event_type
        ORDER BY date DESC
      ` as Promise<Array<{ date: Date; category: string; count: bigint }>>)
    ]);

    // Calcular taxa de conversão
    const conversionRate = totalUploads > 0 
      ? ((totalRenders / totalUploads) * 100).toFixed(1)
      : '0';

    // Calcular tempo médio de render
    // Como duration está dentro de eventData (JSONB), não podemos usar aggregate diretamente de forma simples
    // Vamos buscar os eventos e calcular na aplicação ou usar raw query
    // Usando raw query para performance
    const avgRenderTimeResult = (await prisma.$queryRaw`
      SELECT AVG(CAST(event_data->>'duration' AS FLOAT)) as avg_duration
      FROM analytics_events
      WHERE user_id = ${userId}::uuid
        AND event_type = 'render_complete'
        AND created_at >= ${startDate}
        AND event_data->>'duration' IS NOT NULL
    ` as Array<{ avg_duration: number | null }>);

    const avgDuration = avgRenderTimeResult[0]?.avg_duration || 0;

    return NextResponse.json({
      period,
      metrics: {
        totalUploads,
        totalRenders,
        totalDownloads,
        conversionRate: parseFloat(conversionRate),
        avgRenderTime: avgDuration 
          ? Math.round(avgDuration / 1000) // ms para segundos
          : null
      },
      renderJobs: renderJobs.map((item) => ({
        status: item.status || 'unknown',
        count: item._count.id
      })),
      recentProjects,
      eventsByDay: eventsByDay.map(e => ({
        ...e,
        count: Number(e.count) // Serializar bigint para JSON
      }))
    });

  } catch (error) {
    console.error('[Analytics Metrics] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

