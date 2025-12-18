/**
 * API v2: Advanced Analytics
 * Analytics avançado com métricas detalhadas
 */

import { NextResponse } from 'next/server';
import { advancedAnalyticsEngine } from '@/lib/analytics/advanced-analytics';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/services';

export const runtime = 'nodejs';

// GET /api/v2/analytics - Obter analytics
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseForRequest(req);
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'user';
    const id = searchParams.get('id');
    const period = searchParams.get('period') || '7d';

    // Parse period
    const periodObj = this.parsePeriod(period);

    let result;

    switch (type) {
      case 'video':
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Video ID required' },
            { status: 400 }
          );
        }
        result = await advancedAnalyticsEngine.getVideoAnalytics(id, periodObj);
        break;

      case 'user':
        const userId = id || user.id;
        result = await advancedAnalyticsEngine.getUserAnalytics(userId, periodObj);
        break;

      case 'system':
        // Apenas admins podem ver analytics do sistema
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        result = await advancedAnalyticsEngine.getSystemAnalytics(periodObj);
        break;

      case 'realtime':
        result = await advancedAnalyticsEngine.getRealtimeMetrics();
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Analytics API error', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/analytics'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/v2/analytics - Rastrear evento
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseForRequest(req);
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { eventType, eventData } = body;

    if (!eventType) {
      return NextResponse.json(
        { success: false, error: 'eventType is required' },
        { status: 400 }
      );
    }

    const result = await advancedAnalyticsEngine.trackEvent({
      userId: user?.id,
      eventType,
      eventData: eventData || {}
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Analytics tracking error', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/analytics'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper para parse de período
function parsePeriod(period: string): { start: Date; end: Date; granularity: 'hour' | 'day' | 'week' | 'month' } {
  const end = new Date();
  let start = new Date();
  let granularity: 'hour' | 'day' | 'week' | 'month' = 'day';

  if (period.endsWith('h')) {
    const hours = parseInt(period);
    start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    granularity = 'hour';
  } else if (period.endsWith('d')) {
    const days = parseInt(period);
    start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    granularity = 'day';
  } else if (period.endsWith('w')) {
    const weeks = parseInt(period);
    start = new Date(end.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
    granularity = 'week';
  } else if (period.endsWith('m')) {
    const months = parseInt(period);
    start = new Date(end.getTime() - months * 30 * 24 * 60 * 60 * 1000);
    granularity = 'month';
  }

  return { start, end, granularity };
}
