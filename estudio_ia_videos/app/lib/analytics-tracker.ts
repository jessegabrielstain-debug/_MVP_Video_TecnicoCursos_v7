import { Analytics } from './analytics';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface FunnelAnalysisParams {
  organizationId?: string;
  startDate: Date;
  endDate: Date;
}

export interface ProviderPerformanceParams {
  category: 'tts' | 'render';
  organizationId?: string;
  startDate: Date;
  endDate: Date;
}

export interface SummaryParams {
  organizationId?: string;
  startDate: Date;
  endDate: Date;
}

export interface FunnelData {
  funnel: Array<{ stage: string; count: number; dropoff: number }>;
}

export interface SummaryData {
  totalEvents: number;
  avgDuration: number;
  successRate: number;
}

export interface ProviderPerformance {
  provider: string;
  totalRequests: number;
  successRate: number;
  errorRate: number;
  avgLatency: number;
}

export class AnalyticsTracker {
  static track(event: string, properties?: Record<string, unknown>) {
    return Analytics.trackEvent(event, properties);
  }

  static trackError(error: Error, context?: Record<string, unknown>) {
    return Analytics.trackEvent('error', { message: error.message, stack: error.stack, ...context });
  }

  static async trackCollaboration(action: string, projectId: string, details?: Record<string, unknown>) {
    return Analytics.trackEvent('collaboration_action', { action, projectId, ...details });
  }

  static async getFunnelAnalysis(params: FunnelAnalysisParams): Promise<FunnelData> {
    try {
      const where: any = {
        createdAt: {
          gte: params.startDate,
          lte: params.endDate
        }
      };

      if (params.organizationId) {
        // Assumindo que organizationId está no metadata
        where.metadata = {
          path: ['organizationId'],
          equals: params.organizationId
        };
      }

      // Buscar eventos por estágio do funil
      const stages = ['upload', 'edit', 'tts', 'render', 'download'];
      const funnel = [];
      let previousCount = 0;

      for (const stage of stages) {
        const count = await prisma.analyticsEvent.count({
          where: {
            ...where,
            eventType: `funnel.${stage}`
          }
        });

        const dropoff = previousCount > 0 ? previousCount - count : 0;
        funnel.push({ stage, count, dropoff });
        previousCount = count;
      }

      return { funnel };
    } catch (error) {
      logger.error('Erro ao calcular funil', error instanceof Error ? error : new Error(String(error)), {
        component: 'AnalyticsTracker'
      });
      // Fallback para dados vazios em caso de erro
      const stages = ['upload', 'edit', 'tts', 'render', 'download'];
      return {
        funnel: stages.map(stage => ({ stage, count: 0, dropoff: 0 }))
      };
    }
  }

  static async getProviderPerformance(params: ProviderPerformanceParams): Promise<ProviderPerformance[]> {
    try {
      const where: any = {
        createdAt: {
          gte: params.startDate,
          lte: params.endDate
        },
        eventType: {
          startsWith: `${params.category}.`
        }
      };

      if (params.organizationId) {
        where.metadata = {
          path: ['organizationId'],
          equals: params.organizationId
        };
      }

      // Buscar eventos de performance por provider
      const events = await prisma.analyticsEvent.findMany({
        where,
        select: {
          eventType: true,
          eventData: true
        }
      });

      // Agrupar por provider
      const providerMap = new Map<string, { requests: number; successes: number; errors: number; latencies: number[] }>();

      events.forEach(event => {
        const provider = (event.eventData as any)?.provider || 'unknown';
        const status = (event.eventData as any)?.status || 'unknown';
        const latency = (event.eventData as any)?.latency || 0;

        if (!providerMap.has(provider)) {
          providerMap.set(provider, { requests: 0, successes: 0, errors: 0, latencies: [] });
        }

        const stats = providerMap.get(provider)!;
        stats.requests++;
        if (status === 'success' || status === 'completed') {
          stats.successes++;
        } else if (status === 'error' || status === 'failed') {
          stats.errors++;
        }
        if (latency > 0) {
          stats.latencies.push(latency);
        }
      });

      // Converter para formato ProviderPerformance
      const results: ProviderPerformance[] = Array.from(providerMap.entries()).map(([provider, stats]) => {
        const successRate = stats.requests > 0 ? (stats.successes / stats.requests) * 100 : 0;
        const errorRate = stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0;
        const avgLatency = stats.latencies.length > 0
          ? stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length
          : 0;

        return {
          provider,
          totalRequests: stats.requests,
          successRate: Math.round(successRate * 100) / 100,
          errorRate: Math.round(errorRate * 100) / 100,
          avgLatency: Math.round(avgLatency)
        };
      });

      return results.sort((a, b) => b.totalRequests - a.totalRequests);
    } catch (error) {
      logger.error('Erro ao calcular performance de providers', error instanceof Error ? error : new Error(String(error)), {
        component: 'AnalyticsTracker',
        category: params.category
      });
      return [];
    }
  }

  static async getSummary(params: SummaryParams): Promise<SummaryData> {
    try {
      const where: any = {
        createdAt: {
          gte: params.startDate,
          lte: params.endDate
        }
      };

      if (params.organizationId) {
        where.metadata = {
          path: ['organizationId'],
          equals: params.organizationId
        };
      }

      // Contar total de eventos
      const totalEvents = await prisma.analyticsEvent.count({ where });

      // Buscar eventos com duração
      const eventsWithDuration = await prisma.analyticsEvent.findMany({
        where: {
          ...where,
          eventData: {
            path: ['duration'],
            not: null
          }
        },
        select: {
          eventData: true
        }
      });

      // Calcular duração média
      const durations = eventsWithDuration
        .map(e => (e.eventData as any)?.duration)
        .filter((d): d is number => typeof d === 'number' && d > 0);

      const avgDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

      // Calcular taxa de sucesso (eventos de sucesso vs total)
      const successEvents = await prisma.analyticsEvent.count({
        where: {
          ...where,
          OR: [
            { eventType: { contains: '.success' } },
            { eventType: { contains: '.completed' } },
            { eventData: { path: ['status'], equals: 'success' } }
          ]
        }
      });

      const successRate = totalEvents > 0 ? (successEvents / totalEvents) * 100 : 0;

      return {
        totalEvents,
        avgDuration: Math.round(avgDuration),
        successRate: Math.round(successRate * 100) / 100
      };
    } catch (error) {
      logger.error('Erro ao calcular resumo', error instanceof Error ? error : new Error(String(error)), {
        component: 'AnalyticsTracker'
      });
      return {
        totalEvents: 0,
        avgDuration: 0,
        successRate: 0
      };
    }
  }
}
