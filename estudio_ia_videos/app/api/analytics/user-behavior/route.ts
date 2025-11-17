import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { prisma } from '@/lib/db';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';

// Utilitários locais para normalização
const toNumber = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
/**
 * GET /api/analytics/user-behavior
 * Retorna métricas detalhadas de comportamento do usuário
 * 
 * Query params:
 * - period: '24h' | '7d' | '30d' | '90d' (default: '7d')
 * - metric: 'engagement' | 'navigation' | 'conversion' | 'retention' | 'all' (default: 'all')
 * - userId?: string (filtrar por usuário específico)
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
    const metric = searchParams.get('metric') || 'all';
    const targetUserId = searchParams.get('userId');
    const organizationId = getOrgId(session.user);

    // Calcular data de início baseada no período
    const startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
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
      ...(organizationId && { organizationId }),
      ...(targetUserId && { userId: targetUserId })
    };

    const behaviorData: Record<string, unknown> = {};

    // Métricas de engajamento
    if (metric === 'engagement' || metric === 'all') {
      // Tempo médio de sessão por usuário
      const sessionData = await prisma.$queryRaw`
        SELECT 
          user_id,
          DATE(created_at) as date,
          MIN(created_at) as session_start,
          MAX(created_at) as session_end,
          COUNT(*) as events,
          TIMESTAMPDIFF(SECOND, MIN(created_at), MAX(created_at)) as session_duration
        FROM analytics_event 
        WHERE created_at >= ${startDate}
        AND user_id IS NOT NULL
        ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
        ${targetUserId ? prisma.$queryRaw`AND user_id = ${targetUserId}` : prisma.$queryRaw``}
        GROUP BY user_id, DATE(created_at)
        HAVING session_duration > 0
      `;

      // Páginas mais visitadas
      const pageViews = await prisma.analyticsEvent.groupBy({
        by: ['label'],
        where: {
          ...whereClause,
          category: 'page_view',
          label: { not: null }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      // Eventos de interação
      const interactions = await prisma.analyticsEvent.groupBy({
        by: ['action'],
        where: {
          ...whereClause,
          category: { in: ['click', 'scroll', 'form', 'download'] }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      });

      // Calcular métricas de engajamento
      const sessionRows = sessionData as unknown as Array<Record<string, unknown>>;
      const avgSessionDuration = sessionRows.reduce((sum, session) => 
        sum + toNumber(session.session_duration), 0) / Math.max(1, sessionRows.length);

      const avgEventsPerSession = sessionRows.reduce((sum, session) => 
        sum + toNumber(session.events), 0) / Math.max(1, sessionRows.length);

      behaviorData.engagement = {
        avgSessionDuration: Math.round(avgSessionDuration),
        avgEventsPerSession: Math.round(avgEventsPerSession),
        totalSessions: sessionRows.length,
        uniqueUsers: new Set(sessionRows.map(s => String(s.user_id))).size,
        pageViews: (pageViews as unknown as Array<{ label: string | null; _count: { id: number } }>).map(item => ({
          page: item.label,
          views: item._count.id
        })),
        interactions: (interactions as unknown as Array<{ action: string | null; _count: { id: number } }>).map(item => ({
          action: item.action,
          count: item._count.id
        }))
      };
    }

    // Métricas de navegação
    if (metric === 'navigation' || metric === 'all') {
      // Fluxo de navegação (páginas mais comuns após cada página)
      const navigationFlow = await prisma.$queryRaw`
        SELECT 
          prev.label as from_page,
          curr.label as to_page,
          COUNT(*) as transitions
        FROM analytics_event prev
        JOIN analytics_event curr ON (
          curr.user_id = prev.user_id 
          AND curr.created_at > prev.created_at
          AND curr.created_at <= DATE_ADD(prev.created_at, INTERVAL 30 MINUTE)
        )
        WHERE prev.created_at >= ${startDate}
        AND prev.category = 'page_view'
        AND curr.category = 'page_view'
        AND prev.label IS NOT NULL
        AND curr.label IS NOT NULL
        ${organizationId ? prisma.$queryRaw`AND prev.organization_id = ${organizationId}` : prisma.$queryRaw``}
        GROUP BY prev.label, curr.label
        ORDER BY transitions DESC
        LIMIT 20
      `;

      // Páginas de entrada e saída
      const entryPages = await prisma.$queryRaw`
        SELECT 
          label as page,
          COUNT(*) as entries
        FROM (
          SELECT 
            user_id,
            label,
            ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at) as rn
          FROM analytics_event
          WHERE created_at >= ${startDate}
          AND category = 'page_view'
          AND label IS NOT NULL
          ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
        ) first_pages
        WHERE rn = 1
        GROUP BY label
        ORDER BY entries DESC
        LIMIT 10
      `;

      const exitPages = await prisma.$queryRaw`
        SELECT 
          label as page,
          COUNT(*) as exits
        FROM (
          SELECT 
            user_id,
            label,
            ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at DESC) as rn
          FROM analytics_event
          WHERE created_at >= ${startDate}
          AND category = 'page_view'
          AND label IS NOT NULL
          ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
        ) last_pages
        WHERE rn = 1
        GROUP BY label
        ORDER BY exits DESC
        LIMIT 10
      `;

      behaviorData.navigation = {
        flow: navigationFlow,
        entryPages: entryPages,
        exitPages: exitPages
      };
    }

    // Métricas de conversão
    if (metric === 'conversion' || metric === 'all') {
      // Funil de conversão
      const funnelSteps = [
        { step: 'visit', category: 'page_view', action: null },
        { step: 'signup', category: 'auth', action: 'signup' },
        { step: 'project_create', category: 'project', action: 'create' },
        { step: 'content_upload', category: 'pptx', action: 'upload' },
        { step: 'video_render', category: 'render', action: 'start' }
      ];

      const funnelData = await Promise.all(
        funnelSteps.map(async (step) => {
          const count = await prisma.analyticsEvent.count({
            where: {
              ...whereClause,
              category: step.category,
              ...(step.action && { action: step.action })
            }
          });

          const uniqueUsers = await prisma.analyticsEvent.groupBy({
            by: ['userId'],
            where: {
              ...whereClause,
              category: step.category,
              ...(step.action && { action: step.action }),
              userId: { not: null }
            }
          });

          return {
            step: step.step,
            events: count,
            users: uniqueUsers.length
          };
        })
      );

      // Calcular taxas de conversão
      const conversionRates = funnelData.map((current, index) => {
        if (index === 0) return { ...current, conversionRate: 100 };
        
        const previous = funnelData[index - 1];
        const rate = previous.users > 0 ? 
          ((current.users / previous.users) * 100).toFixed(1) : '0';
        
        return { ...current, conversionRate: parseFloat(rate) };
      });

      behaviorData.conversion = {
        funnel: conversionRates,
        totalConversions: funnelData[funnelData.length - 1]?.users || 0,
        overallConversionRate: funnelData[0]?.users > 0 ? 
          ((funnelData[funnelData.length - 1]?.users || 0) / funnelData[0].users * 100).toFixed(2) : '0'
      };
    }

    // Métricas de retenção
    if (metric === 'retention' || metric === 'all') {
      // Usuários que retornaram em diferentes períodos
      const retentionData = await prisma.$queryRaw`
        SELECT 
          DATE(first_visit) as cohort_date,
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT CASE WHEN days_since_first = 1 THEN user_id END) as day_1,
          COUNT(DISTINCT CASE WHEN days_since_first = 7 THEN user_id END) as day_7,
          COUNT(DISTINCT CASE WHEN days_since_first = 30 THEN user_id END) as day_30
        FROM (
          SELECT 
            user_id,
            MIN(DATE(created_at)) as first_visit,
            DATEDIFF(DATE(created_at), MIN(DATE(created_at)) OVER (PARTITION BY user_id)) as days_since_first
          FROM analytics_event
          WHERE created_at >= ${startDate}
          AND user_id IS NOT NULL
          ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
          GROUP BY user_id, DATE(created_at)
        ) user_visits
        GROUP BY DATE(first_visit)
        ORDER BY cohort_date DESC
        LIMIT 30
      `;

      // Usuários ativos por período
      const activeUsers = await prisma.$queryRaw`
        SELECT 
          'daily' as period,
          COUNT(DISTINCT user_id) as count
        FROM analytics_event
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        AND user_id IS NOT NULL
        ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
        
        UNION ALL
        
        SELECT 
          'weekly' as period,
          COUNT(DISTINCT user_id) as count
        FROM analytics_event
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND user_id IS NOT NULL
        ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
        
        UNION ALL
        
        SELECT 
          'monthly' as period,
          COUNT(DISTINCT user_id) as count
        FROM analytics_event
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND user_id IS NOT NULL
        ${organizationId ? prisma.$queryRaw`AND organization_id = ${organizationId}` : prisma.$queryRaw``}
      `;

      behaviorData.retention = {
        cohorts: retentionData,
        activeUsers: activeUsers
      };
    }

    // Dados demográficos e tecnológicos
    if (metric === 'all') {
      const deviceData = await prisma.analyticsEvent.groupBy({
        by: ['metadata'],
        where: whereClause,
        _count: { id: true },
        // Prisma requires orderBy when using take/skip with groupBy
        orderBy: { _count: { id: 'desc' } },
        take: 100
      });

      // Extrair informações de dispositivo dos metadados
      const devices = { desktop: 0, mobile: 0, tablet: 0 };
      const browsers = new Map();
      const os = new Map();

      (deviceData as unknown as Array<{ metadata: unknown; _count: { id: number } }>).forEach((item) => {
        const metadata = item.metadata;
        const uaRaw = (metadata && typeof metadata === 'object' && 'userAgent' in (metadata as Record<string, unknown>)
          ? (metadata as Record<string, unknown>).userAgent
          : undefined);
        if (typeof uaRaw === 'string' && uaRaw.length > 0) {
          const ua = uaRaw.toLowerCase();
          
          // Detectar tipo de dispositivo
          if (ua.includes('mobile')) devices.mobile += item._count.id;
          else if (ua.includes('tablet')) devices.tablet += item._count.id;
          else devices.desktop += item._count.id;
          
          // Detectar navegador
          let browser = 'Other';
          if (ua.includes('chrome')) browser = 'Chrome';
          else if (ua.includes('firefox')) browser = 'Firefox';
          else if (ua.includes('safari')) browser = 'Safari';
          else if (ua.includes('edge')) browser = 'Edge';
          
          browsers.set(browser, (browsers.get(browser) || 0) + item._count.id);
          
          // Detectar OS
          let operatingSystem = 'Other';
          if (ua.includes('windows')) operatingSystem = 'Windows';
          else if (ua.includes('mac')) operatingSystem = 'macOS';
          else if (ua.includes('linux')) operatingSystem = 'Linux';
          else if (ua.includes('android')) operatingSystem = 'Android';
          else if (ua.includes('ios')) operatingSystem = 'iOS';
          
          os.set(operatingSystem, (os.get(operatingSystem) || 0) + item._count.id);
        }
      });

      behaviorData.demographics = {
        devices: Object.entries(devices).map(([type, count]) => ({ type, count })),
        browsers: Array.from(browsers.entries()).map(([browser, count]) => ({ browser, count })),
        operatingSystems: Array.from(os.entries()).map(([os, count]) => ({ os, count }))
      };
    }

    return NextResponse.json({
      period,
      metric,
      userId: targetUserId,
      generatedAt: new Date().toISOString(),
      ...behaviorData
    });

  } catch (error: unknown) {
    console.error('[Analytics User Behavior] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to fetch user behavior metrics',
        message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/user-behavior
 * Registra eventos de comportamento do usuário
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const body = await req.json();
    
    const {
      eventType,
      page,
      element,
      value,
      coordinates,
      scrollDepth,
      timeOnPage,
      sessionId,
      metadata
    } = body;

    // Validação básica
    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    const userId = session?.user?.id || null;
    const organizationId = (session?.user ? getOrgId(session.user) : undefined) || null;

    // Registrar evento de comportamento
      await prisma.analyticsEvent.create({
        data: {
          organizationId,
          userId,
          category: 'user_behavior',
          action: eventType,
          label: page,
          metadata: {
            value,
            element,
            coordinates,
            scrollDepth,
            timeOnPage,
            sessionId,
          userAgent: req.headers.get('user-agent'),
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          referer: req.headers.get('referer'),
          ...metadata
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User behavior event recorded'
    });

  } catch (error: unknown) {
    console.error('[Analytics User Behavior POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to record user behavior event',
        message
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de performance
export const GET = withAnalytics(getHandler);
export const POST = withAnalytics(postHandler);
