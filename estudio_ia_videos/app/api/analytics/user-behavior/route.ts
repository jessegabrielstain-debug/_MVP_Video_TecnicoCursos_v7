import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Utilitários locais para normalização
const toNumber = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));

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
    const period = searchParams.get('period') || '7d';
    const metric = searchParams.get('metric') || 'all';
    const targetUserId = searchParams.get('userId');
    
    // Calculate start date
    const startDate = new Date();
    switch (period) {
      case '24h': startDate.setHours(startDate.getHours() - 24); break;
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate.setDate(startDate.getDate() - 90); break;
      default: startDate.setDate(startDate.getDate() - 7);
    }

    const behaviorData: Record<string, unknown> = {};

    // Engagement Metrics
    if (metric === 'engagement' || metric === 'all') {
      // Session Data
      const sessionData = await prisma.$queryRaw`
        SELECT 
          user_id,
          DATE(created_at) as date,
          MIN(created_at) as session_start,
          MAX(created_at) as session_end,
          COUNT(*) as events,
          EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as session_duration
        FROM analytics_events 
        WHERE created_at >= ${startDate}
        AND user_id IS NOT NULL
        ${targetUserId ? Prisma.sql`AND user_id = ${targetUserId}::uuid` : Prisma.sql``}
        GROUP BY user_id, DATE(created_at)
        HAVING EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) > 0
      ` as any[];

      // Page Views (Top 10)
      const pageViews = await prisma.$queryRaw`
        SELECT 
          event_data->>'label' as page,
          COUNT(*) as views
        FROM analytics_events
        WHERE created_at >= ${startDate}
        AND event_type = 'page_view'
        AND event_data->>'label' IS NOT NULL
        ${targetUserId ? Prisma.sql`AND user_id = ${targetUserId}::uuid` : Prisma.sql``}
        GROUP BY event_data->>'label'
        ORDER BY views DESC
        LIMIT 10
      ` as any[];

      // Interactions
      const interactions = await prisma.$queryRaw`
        SELECT 
          event_data->>'action' as action,
          COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= ${startDate}
        AND event_type IN ('click', 'scroll', 'form', 'download')
        ${targetUserId ? Prisma.sql`AND user_id = ${targetUserId}::uuid` : Prisma.sql``}
        GROUP BY event_data->>'action'
        ORDER BY count DESC
      ` as any[];

      const sessionRows = sessionData;
      const avgSessionDuration = sessionRows.reduce((sum, s) => sum + toNumber(s.session_duration), 0) / Math.max(1, sessionRows.length);
      const avgEventsPerSession = sessionRows.reduce((sum, s) => sum + toNumber(s.events), 0) / Math.max(1, sessionRows.length);

      behaviorData.engagement = {
        avgSessionDuration: Math.round(avgSessionDuration),
        avgEventsPerSession: Math.round(avgEventsPerSession),
        totalSessions: sessionRows.length,
        uniqueUsers: new Set(sessionRows.map(s => s.user_id)).size,
        pageViews: pageViews,
        interactions: interactions
      };
    }

    // Navigation Metrics
    if (metric === 'navigation' || metric === 'all') {
      // Navigation Flow
      const navigationFlow = await prisma.$queryRaw`
        SELECT 
          prev.event_data->>'label' as from_page,
          curr.event_data->>'label' as to_page,
          COUNT(*) as transitions
        FROM analytics_events prev
        JOIN analytics_events curr ON (
          curr.user_id = prev.user_id 
          AND curr.created_at > prev.created_at
          AND curr.created_at <= (prev.created_at + interval '30 minutes')
        )
        WHERE prev.created_at >= ${startDate}
        AND prev.event_type = 'page_view'
        AND curr.event_type = 'page_view'
        AND prev.event_data->>'label' IS NOT NULL
        AND curr.event_data->>'label' IS NOT NULL
        ${targetUserId ? Prisma.sql`AND prev.user_id = ${targetUserId}::uuid` : Prisma.sql``}
        GROUP BY prev.event_data->>'label', curr.event_data->>'label'
        ORDER BY transitions DESC
        LIMIT 20
      ` as any[];

      // Entry Pages
      const entryPages = await prisma.$queryRaw`
        SELECT 
          page,
          COUNT(*) as entries
        FROM (
          SELECT 
            user_id,
            event_data->>'label' as page,
            ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at) as rn
          FROM analytics_events
          WHERE created_at >= ${startDate}
          AND event_type = 'page_view'
          AND event_data->>'label' IS NOT NULL
          ${targetUserId ? Prisma.sql`AND user_id = ${targetUserId}::uuid` : Prisma.sql``}
        ) first_pages
        WHERE rn = 1
        GROUP BY page
        ORDER BY entries DESC
        LIMIT 10
      ` as any[];

      // Exit Pages
      const exitPages = await prisma.$queryRaw`
        SELECT 
          page,
          COUNT(*) as exits
        FROM (
          SELECT 
            user_id,
            event_data->>'label' as page,
            ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at DESC) as rn
          FROM analytics_events
          WHERE created_at >= ${startDate}
          AND event_type = 'page_view'
          AND event_data->>'label' IS NOT NULL
          ${targetUserId ? Prisma.sql`AND user_id = ${targetUserId}::uuid` : Prisma.sql``}
        ) last_pages
        WHERE rn = 1
        GROUP BY page
        ORDER BY exits DESC
        LIMIT 10
      ` as any[];

      behaviorData.navigation = {
        flow: navigationFlow,
        entryPages: entryPages,
        exitPages: exitPages
      };
    }

    // Conversion Metrics
    if (metric === 'conversion' || metric === 'all') {
      const funnelSteps = [
        { step: 'visit', type: 'page_view', action: null },
        { step: 'signup', type: 'auth', action: 'signup' },
        { step: 'project_create', type: 'project', action: 'create' },
        { step: 'content_upload', type: 'pptx', action: 'upload' },
        { step: 'video_render', type: 'render', action: 'start' }
      ];

      const funnelData = await Promise.all(
        funnelSteps.map(async (step) => {
          const where: Prisma.AnalyticsEventWhereInput = {
            createdAt: { gte: startDate },
            eventType: step.type,
            ...(targetUserId && { userId: targetUserId })
          };
          
          if (step.action) {
            where.eventData = {
              path: ['action'],
              equals: step.action
            };
          }

          const count = await prisma.analyticsEvent.count({ where });
          
          // For unique users, we need to use groupBy or distinct
          const uniqueUsers = await prisma.analyticsEvent.groupBy({
            by: ['userId'],
            where: {
              ...where,
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

      // Calculate rates
      const conversionRates = funnelData.map((current, index) => {
        if (index === 0) return { ...current, conversionRate: 100 };
        const previous = funnelData[index - 1];
        const rate = previous.users > 0 ? ((current.users / previous.users) * 100).toFixed(1) : '0';
        return { ...current, conversionRate: parseFloat(rate) };
      });

      behaviorData.conversion = {
        funnel: conversionRates,
        totalConversions: funnelData[funnelData.length - 1]?.users || 0,
        overallConversionRate: funnelData[0]?.users > 0 ? 
          ((funnelData[funnelData.length - 1]?.users || 0) / funnelData[0].users * 100).toFixed(2) : '0'
      };
    }

    // Retention Metrics
    if (metric === 'retention' || metric === 'all') {
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
            (DATE(created_at) - MIN(DATE(created_at)) OVER (PARTITION BY user_id)) as days_since_first
          FROM analytics_events
          WHERE created_at >= ${startDate}
          AND user_id IS NOT NULL
          ${targetUserId ? Prisma.sql`AND user_id = ${targetUserId}::uuid` : Prisma.sql``}
          GROUP BY user_id, DATE(created_at)
        ) user_visits
        GROUP BY DATE(first_visit)
        ORDER BY cohort_date DESC
        LIMIT 30
      ` as any[];

      const activeUsers = await prisma.$queryRaw`
        SELECT 'daily' as period, COUNT(DISTINCT user_id) as count FROM analytics_events WHERE created_at >= NOW() - interval '1 day' AND user_id IS NOT NULL
        UNION ALL
        SELECT 'weekly' as period, COUNT(DISTINCT user_id) as count FROM analytics_events WHERE created_at >= NOW() - interval '7 days' AND user_id IS NOT NULL
        UNION ALL
        SELECT 'monthly' as period, COUNT(DISTINCT user_id) as count FROM analytics_events WHERE created_at >= NOW() - interval '30 days' AND user_id IS NOT NULL
      ` as any[];

      behaviorData.retention = {
        cohorts: retentionData,
        activeUsers: activeUsers
      };
    }

    // Demographics (from User Agent in eventData)
    if (metric === 'all') {
      // We can't easily group by JSON field in Prisma without raw query.
      // Let's fetch user agents via raw query
      const userAgents = await prisma.$queryRaw`
        SELECT 
          event_data->>'userAgent' as ua,
          COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= ${startDate}
        AND event_data->>'userAgent' IS NOT NULL
        ${targetUserId ? Prisma.sql`AND user_id = ${targetUserId}::uuid` : Prisma.sql``}
        GROUP BY event_data->>'userAgent'
        ORDER BY count DESC
        LIMIT 100
      ` as any[];

      const devices = { desktop: 0, mobile: 0, tablet: 0 };
      const browsers = new Map();
      const os = new Map();

      (userAgents).forEach((item: any) => {
        const ua = item.ua.toLowerCase();
        const count = Number(item.count);

        if (ua.includes('mobile')) devices.mobile += count;
        else if (ua.includes('tablet')) devices.tablet += count;
        else devices.desktop += count;

        let browser = 'Other';
        if (ua.includes('chrome')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari')) browser = 'Safari';
        else if (ua.includes('edge')) browser = 'Edge';
        browsers.set(browser, (browsers.get(browser) || 0) + count);

        let operatingSystem = 'Other';
        if (ua.includes('windows')) operatingSystem = 'Windows';
        else if (ua.includes('mac')) operatingSystem = 'macOS';
        else if (ua.includes('linux')) operatingSystem = 'Linux';
        else if (ua.includes('android')) operatingSystem = 'Android';
        else if (ua.includes('ios')) operatingSystem = 'iOS';
        os.set(operatingSystem, (os.get(operatingSystem) || 0) + count);
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
    return NextResponse.json(
      { error: 'Failed to fetch user behavior metrics', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

async function postHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    const userId = session?.user?.id || null;

    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: 'user_behavior', // or use eventType from body if it maps to valid types
        eventData: {
          action: eventType, // Store original eventType as action
          label: page,
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

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('[Analytics User Behavior POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record user behavior event' },
      { status: 500 }
    );
  }
}

export { getHandler as GET, postHandler as POST };
