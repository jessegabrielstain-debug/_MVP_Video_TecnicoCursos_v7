/**
 * FASE 4 - ANALYTICS COMPLETO
 * Sistema de Coleta de Métricas em Tempo Real
 * 
 * Funcionalidades:
 * - Tracking de eventos em tempo real
 * - Métricas de performance do sistema
 * - Analytics de comportamento do usuário
 * - Coleta de dados de uso e engagement
 */

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';

export interface AnalyticsEventData {
  // Identificação
  category: string;
  action: string;
  label?: string;
  
  // Contexto
  projectId?: string;
  templateId?: string;
  provider?: string;
  
  // Métricas
  duration?: number; // milliseconds
  fileSize?: number; // bytes
  value?: number; // valor numérico genérico
  
  // Performance
  loadTime?: number;
  renderTime?: number;
  processingTime?: number;
  
  // Comportamento do usuário
  clickPosition?: { x: number; y: number };
  scrollDepth?: number; // percentage
  timeOnPage?: number; // seconds
  
  // Contexto técnico
  userAgent?: string;
  viewport?: { width: number; height: number };
  connectionType?: string;
  
  // Status e erros
  status?: 'success' | 'error' | 'warning' | 'info';
  errorCode?: string;
  errorMessage?: string;
  
  // Metadata flexível
  metadata?: Record<string, unknown>;
}

export interface UserBehaviorMetrics {
  sessionId: string;
  pageViews: number;
  totalTimeSpent: number;
  actionsPerformed: number;
  featuresUsed: string[];
  conversionEvents: string[];
}

export interface SystemPerformanceMetrics {
  timestamp: Date;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  activeConnections: number;
  queueSize: number;
  responseTime: number;
  errorRate: number;
}

export class RealTimeAnalyticsCollector {
  private static instance: RealTimeAnalyticsCollector;
  private eventBuffer: AnalyticsEventData[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.startBufferFlush();
  }

  public static getInstance(): RealTimeAnalyticsCollector {
    if (!RealTimeAnalyticsCollector.instance) {
      RealTimeAnalyticsCollector.instance = new RealTimeAnalyticsCollector();
    }
    return RealTimeAnalyticsCollector.instance;
  }

  /**
   * Coleta evento de analytics em tempo real
   */
  public async trackEvent(eventData: AnalyticsEventData, userId?: string, organizationId?: string): Promise<void> {
    try {
      const enrichedEvent = await this.enrichEventData(eventData, userId, organizationId);
      
      // Adicionar ao buffer para processamento em lote
      this.eventBuffer.push(enrichedEvent);
      
      // Flush imediato se buffer estiver cheio
      if (this.eventBuffer.length >= this.bufferSize) {
        await this.flushBuffer();
      }
      
      // Processar eventos críticos imediatamente
      if (this.isCriticalEvent(eventData)) {
        await this.processCriticalEvent(enrichedEvent);
      }
      
    } catch (error) {
      console.error('[Analytics] Error tracking event:', error);
      // Não falhar silenciosamente - analytics não deve quebrar o fluxo principal
    }
  }

  /**
   * Enriquece dados do evento com contexto adicional
   */
  private async enrichEventData(
    eventData: AnalyticsEventData, 
    userId?: string, 
    organizationId?: string
  ): Promise<AnalyticsEventData> {
    const enriched = {
      ...eventData,
      timestamp: new Date(),
      userId,
      organizationId,
    };

    // Adicionar métricas de performance se disponíveis
    if (typeof performance !== 'undefined') {
      enriched.metadata = {
        ...enriched.metadata,
        performanceNow: performance.now(),
        memoryUsage: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        } : undefined,
      };
    }

    return enriched;
  }

  /**
   * Verifica se é um evento crítico que precisa ser processado imediatamente
   */
  private isCriticalEvent(eventData: AnalyticsEventData): boolean {
    const criticalCategories = ['error', 'security', 'payment', 'system'];
    const criticalActions = ['crash', 'timeout', 'unauthorized', 'payment_failed'];
    
    return criticalCategories.includes(eventData.category) || 
           criticalActions.includes(eventData.action) ||
           eventData.status === 'error';
  }

  /**
   * Processa eventos críticos imediatamente
   */
  private async processCriticalEvent(eventData: AnalyticsEventData): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          organizationId: eventData.organizationId,
          userId: eventData.userId,
          category: eventData.category,
          action: eventData.action,
          label: eventData.label,
          metadata: eventData.metadata || {},
          duration: eventData.duration,
          fileSize: eventData.fileSize,
          projectId: eventData.projectId,
          templateId: eventData.templateId,
          provider: eventData.provider,
          errorCode: eventData.errorCode,
          errorMessage: eventData.errorMessage,
          status: eventData.status || 'success',
        }
      });

      // Trigger alertas se necessário
      if (eventData.status === 'error') {
        await this.triggerErrorAlert(eventData);
      }
      
    } catch (error) {
      console.error('[Analytics] Error processing critical event:', error);
    }
  }

  /**
   * Inicia o timer para flush periódico do buffer
   */
  private startBufferFlush(): void {
    this.flushTimer = setInterval(async () => {
      if (this.eventBuffer.length > 0) {
        await this.flushBuffer();
      }
    }, this.flushInterval);
  }

  /**
   * Flush do buffer - salva eventos em lote no banco
   */
  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await prisma.analyticsEvent.createMany({
        data: eventsToFlush.map(event => ({
          organizationId: event.organizationId,
          userId: event.userId,
          category: event.category,
          action: event.action,
          label: event.label,
          metadata: event.metadata || {},
          duration: event.duration,
          fileSize: event.fileSize,
          projectId: event.projectId,
          templateId: event.templateId,
          provider: event.provider,
          errorCode: event.errorCode,
          errorMessage: event.errorMessage,
          status: event.status || 'success',
        })),
        skipDuplicates: true,
      });

      console.log(`[Analytics] Flushed ${eventsToFlush.length} events to database`);
      
    } catch (error) {
      console.error('[Analytics] Error flushing buffer:', error);
      // Re-adicionar eventos ao buffer em caso de erro
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  /**
   * Coleta métricas de comportamento do usuário
   */
  public async trackUserBehavior(metrics: UserBehaviorMetrics, userId: string): Promise<void> {
    await this.trackEvent({
      category: 'user_behavior',
      action: 'session_metrics',
      metadata: {
        sessionId: metrics.sessionId,
        pageViews: metrics.pageViews,
        totalTimeSpent: metrics.totalTimeSpent,
        actionsPerformed: metrics.actionsPerformed,
        featuresUsed: metrics.featuresUsed,
        conversionEvents: metrics.conversionEvents,
      }
    }, userId);
  }

  /**
   * Coleta métricas de performance do sistema
   */
  public async trackSystemPerformance(metrics: SystemPerformanceMetrics): Promise<void> {
    await this.trackEvent({
      category: 'system_performance',
      action: 'metrics_snapshot',
      metadata: {
        cpuUsage: metrics.cpuUsage,
        memoryUsage: metrics.memoryUsage,
        diskUsage: metrics.diskUsage,
        activeConnections: metrics.activeConnections,
        queueSize: metrics.queueSize,
        responseTime: metrics.responseTime,
        errorRate: metrics.errorRate,
      }
    });
  }

  /**
   * Trigger de alerta para eventos de erro
   */
  private async triggerErrorAlert(eventData: AnalyticsEventData): Promise<void> {
    // Implementar sistema de alertas
    console.warn('[Analytics] Error alert triggered:', {
      category: eventData.category,
      action: eventData.action,
      error: eventData.errorMessage,
      timestamp: new Date(),
    });
  }

  /**
   * Cleanup - para ser chamado quando a aplicação for encerrada
   */
  public async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushBuffer();
  }

  /**
   * Força o flush de todos os eventos em buffer
   */
  async forceFlush(): Promise<void> {
    if (this.eventBuffer.length > 0) {
      await this.flushBuffer();
    }
  }

  /**
   * Obtém estatísticas do usuário
   */
  async getUserStats(userId: string, organizationId?: string | null): Promise<any> {
    try {
      const whereClause = {
        userId,
        ...(organizationId && { organizationId })
      };

      // Estatísticas básicas
      const [totalEvents, byCategory, byAction, recentEvents, performanceStats] = await Promise.all([
        // Total de eventos
        prisma.analyticsEvent.count({
          where: whereClause
        }),

        // Agrupado por categoria
        prisma.analyticsEvent.groupBy({
          by: ['category'],
          where: whereClause,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } }
        }),

        // Agrupado por action
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
          take: 10,
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

        // Estatísticas de performance
        prisma.analyticsEvent.aggregate({
          where: {
            ...whereClause,
            duration: { not: null }
          },
          _avg: { duration: true },
          _max: { duration: true },
          _min: { duration: true }
        })
      ]);

      // Calcular métricas adicionais
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const eventsLast7Days = await prisma.analyticsEvent.count({
        where: {
          ...whereClause,
          createdAt: { gte: last7Days }
        }
      });

      const errorEvents = await prisma.analyticsEvent.count({
        where: {
          ...whereClause,
          status: 'error'
        }
      });

      return {
        totalEvents,
        eventsLast7Days,
        errorEvents,
        errorRate: totalEvents > 0 ? (errorEvents / totalEvents * 100).toFixed(2) : 0,
        byCategory: byCategory.map((item: any) => ({
          category: item.category,
          count: item._count.id
        })),
        byAction: byAction.map((item: any) => ({
          action: item.action,
          count: item._count.id
        })),
        recentEvents,
        performance: {
          avgDuration: performanceStats._avg.duration || 0,
          maxDuration: performanceStats._max.duration || 0,
          minDuration: performanceStats._min.duration || 0
        }
      };

    } catch (error) {
      console.error('[Analytics] Error getting user stats:', error);
      throw error;
    }
  }
}

// Instância singleton
export const analyticsCollector = RealTimeAnalyticsCollector.getInstance();

// Helper functions para uso fácil
export const trackEvent = (eventData: AnalyticsEventData, userId?: string, organizationId?: string) => {
  return analyticsCollector.trackEvent(eventData, userId, organizationId);
};

export const trackUserBehavior = (metrics: UserBehaviorMetrics, userId: string) => {
  return analyticsCollector.trackUserBehavior(metrics, userId);
};

export const trackSystemPerformance = (metrics: SystemPerformanceMetrics) => {
  return analyticsCollector.trackSystemPerformance(metrics);
};