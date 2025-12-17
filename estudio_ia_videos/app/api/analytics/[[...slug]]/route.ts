/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANALYTICS API
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Endpoints para o Analytics & Metrics System
 * 
 * @endpoints
 * POST   /api/analytics/track         - Rastrear evento
 * POST   /api/analytics/track/batch   - Rastrear múltiplos eventos
 * GET    /api/analytics/events        - Obter eventos
 * GET    /api/analytics/metrics       - Obter métricas
 * POST   /api/analytics/funnel        - Criar funil de conversão
 * POST   /api/analytics/cohort        - Análise de cohort
 * POST   /api/analytics/abtest        - Criar teste A/B
 * GET    /api/analytics/abtest/:name  - Obter resultado de A/B test
 * GET    /api/analytics/usage         - Estatísticas de uso
 * GET    /api/analytics/performance   - Estatísticas de performance
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AnalyticsMetricsSystem,
  EventType,
  MetricCategory,
  AggregationPeriod,
} from '@/lib/analytics-metrics-system';
import { logger } from '@/lib/logger';

interface EventFilters {
  types?: EventType[];
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  limit?: number;
}

interface MetricFilters {
  names?: string[];
  categories?: MetricCategory[];
  period?: AggregationPeriod;
  startDate?: Date;
  endDate?: Date;
}

const analytics = AnalyticsMetricsSystem.getInstance();

// ═══════════════════════════════════════════════════════════════════════════
// POST - Rastrear evento
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Rastrear evento único
    if (pathname === '/api/analytics/track') {
      const body = await request.json();
      const { type, properties, metadata } = body;

      if (!type) {
        return NextResponse.json(
          { success: false, error: 'Tipo de evento é obrigatório' },
          { status: 400 }
        );
      }

      const event = await analytics.trackEvent(type, properties, metadata);

      return NextResponse.json({
        success: true,
        event: {
          id: event.id,
          type: event.type,
          userId: event.userId,
          timestamp: event.timestamp,
        },
      });
    }

    // Rastrear eventos em lote
    if (pathname === '/api/analytics/track/batch') {
      const body = await request.json();
      const { events } = body;

      if (!events || !Array.isArray(events)) {
        return NextResponse.json(
          { success: false, error: 'Lista de eventos é obrigatória' },
          { status: 400 }
        );
      }

      const trackedEvents = await analytics.trackEventsBatch(events);

      return NextResponse.json({
        success: true,
        count: trackedEvents.length,
        events: trackedEvents.map(e => ({
          id: e.id,
          type: e.type,
          userId: e.userId,
        })),
      });
    }

    // Criar funil de conversão
    if (pathname === '/api/analytics/funnel') {
      const body = await request.json();
      const { name, steps, startDate, endDate } = body;

      if (!name || !steps || !startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'Parâmetros obrigatórios: name, steps, startDate, endDate' },
          { status: 400 }
        );
      }

      const funnel = await analytics.createConversionFunnel(
        name,
        steps,
        new Date(startDate),
        new Date(endDate)
      );

      return NextResponse.json({
        success: true,
        funnel,
      });
    }

    // Análise de cohort
    if (pathname === '/api/analytics/cohort') {
      const body = await request.json();
      const { cohortPeriod, metric, startDate, endDate, periods } = body;

      if (!cohortPeriod || !metric || !startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'Parâmetros obrigatórios: cohortPeriod, metric, startDate, endDate' },
          { status: 400 }
        );
      }

      const analysis = await analytics.performCohortAnalysis(
        cohortPeriod,
        metric,
        new Date(startDate),
        new Date(endDate),
        periods
      );

      return NextResponse.json({
        success: true,
        analysis,
      });
    }

    // Criar teste A/B
    if (pathname === '/api/analytics/abtest') {
      const body = await request.json();
      const config = body;

      if (!config.name || !config.variants) {
        return NextResponse.json(
          { success: false, error: 'Parâmetros obrigatórios: name, variants' },
          { status: 400 }
        );
      }

      const test = await analytics.createABTest(config);

      return NextResponse.json({
        success: true,
        test,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Endpoint não encontrado' },
      { status: 404 }
    );

  } catch (error: unknown) {
    logger.error('Analytics API Error', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/[[...slug]]' });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET - Obter dados
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // Obter eventos
    if (pathname === '/api/analytics/events') {
      const filters: EventFilters = {};

      // Tipos de eventos
      const types = searchParams.get('types');
      if (types) {
        filters.types = types.split(',') as EventType[];
      }

      // Filtros de data
      const startDate = searchParams.get('startDate');
      if (startDate) {
        filters.startDate = new Date(startDate);
      }

      const endDate = searchParams.get('endDate');
      if (endDate) {
        filters.endDate = new Date(endDate);
      }

      // User ID
      const userId = searchParams.get('userId');
      if (userId) {
        filters.userId = userId;
      }

      // Limit
      const limit = searchParams.get('limit');
      if (limit) {
        filters.limit = parseInt(limit);
      }

      const events = await analytics.getEvents(filters);

      return NextResponse.json({
        success: true,
        count: events.length,
        events,
      });
    }

    // Obter métricas
    if (pathname === '/api/analytics/metrics') {
      const filters: MetricFilters = {};

      // Nomes de métricas
      const names = searchParams.get('names');
      if (names) {
        filters.names = names.split(',');
      }

      // Categorias
      const categories = searchParams.get('categories');
      if (categories) {
        filters.categories = categories.split(',') as MetricCategory[];
      }

      // Período
      const period = searchParams.get('period');
      if (period) {
        filters.period = period as AggregationPeriod;
      }

      // Datas
      const startDate = searchParams.get('startDate');
      if (startDate) {
        filters.startDate = new Date(startDate);
      }

      const endDate = searchParams.get('endDate');
      if (endDate) {
        filters.endDate = new Date(endDate);
      }

      const metrics = await analytics.getMetrics(filters);

      return NextResponse.json({
        success: true,
        count: metrics.length,
        metrics,
      });
    }

    // Estatísticas de uso
    if (pathname === '/api/analytics/usage') {
      const period = searchParams.get('period') as AggregationPeriod || AggregationPeriod.DAY;
      const startDate = new Date(searchParams.get('startDate') || Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(searchParams.get('endDate') || Date.now());

      const stats = await analytics.calculateUsageStats(period, startDate, endDate);

      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Estatísticas de performance
    if (pathname === '/api/analytics/performance') {
      const period = searchParams.get('period') as AggregationPeriod || AggregationPeriod.DAY;
      const startDate = new Date(searchParams.get('startDate') || Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(searchParams.get('endDate') || Date.now());

      const stats = await analytics.calculatePerformanceStats(period, startDate, endDate);

      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Resultado de teste A/B
    if (pathname.startsWith('/api/analytics/abtest/')) {
      const testName = pathname.split('/').pop();
      if (!testName) {
        return NextResponse.json(
          { success: false, error: 'Nome do teste é obrigatório' },
          { status: 400 }
        );
      }

      const result = await analytics.getABTestResults(testName);

      return NextResponse.json({
        success: true,
        result,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Endpoint não encontrado' },
      { status: 404 }
    );

  } catch (error: unknown) {
    logger.error('Analytics API Error', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/[[...slug]]' });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
