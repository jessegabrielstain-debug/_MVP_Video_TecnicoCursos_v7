/**
 * 📊 ANALYTICS STANDALONE - Versão sem dependências externas
 * 
 * Sistema de analytics que funciona sem Redis/Segment/Mixpanel
 * para garantir operação imediata
 * 
 * @version 1.0.0
 * @date 08/10/2025
 */

import { PrismaClient } from '@prisma/client';
import { getInMemoryCache } from './in-memory-cache';

const prisma = new PrismaClient();
const cache = getInMemoryCache();

// ============================================================================
// TIPOS
// ============================================================================

export interface AnalyticsEvent {
  userId: string;
  event: string;
  properties?: Record<string, unknown>;
  sessionId?: string;
  timestamp?: Date;
}

export interface UserMetrics {
  totalSessions: number;
  totalEvents: number;
  totalVideosCreated: number;
  totalRenderTime: number;
  averageSessionDuration: number;
  lastActive: Date;
  signupDate: Date;
  lifetimeValue: number;
}

export interface SystemMetrics {
  activeUsers: number;
  totalUsers: number;
  totalVideos: number;
  totalRenders: number;
  averageRenderTime: number;
  successRate: number;
  errorRate: number;
  uptime: number;
}

// ============================================================================
// ANALYTICS STANDALONE
// ============================================================================

class AnalyticsStandalone {
  private static instance: AnalyticsStandalone;

  private constructor() {
    console.log('✅ Analytics Standalone inicializado');
  }

  static getInstance(): AnalyticsStandalone {
    if (!AnalyticsStandalone.instance) {
      AnalyticsStandalone.instance = new AnalyticsStandalone();
    }
    return AnalyticsStandalone.instance;
  }

  /**
   * Rastrear evento
   */
  async track(event: AnalyticsEvent): Promise<void> {
    try {
      // Salvar no banco
      await prisma.analyticsEvent.create({
        data: {
          userId: event.userId,
          category: event.event.split('.')[0] || 'general',
          action: event.event.split('.')[1] || event.event,
          label: event.properties?.label as string || event.event,
          metadata: event.properties || {},
          sessionId: event.sessionId,
          status: 'success',
        }
      });

      console.log(`📊 Evento rastreado: ${event.event} (${event.userId})`);

    } catch (error) {
      console.error('❌ Erro ao rastrear evento:', error);
    }
  }

  /**
   * Obter métricas do usuário
   */
  async getUserMetrics(userId: string): Promise<UserMetrics | null> {
    try {
      const cacheKey = `metrics:user:${userId}`;
      const cached = await cache.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return null;

      // Contar relações
      const [sessionsCount, eventsCount, projectsCount] = await Promise.all([
        prisma.session.count({ where: { userId } }),
        prisma.analyticsEvent.count({ where: { userId } }),
        prisma.project.count({ where: { userId } })
      ]);

      // Calcular render time
      const renderJobs = await prisma.renderJob.findMany({
        where: { userId, status: 'completed' },
        select: { processingTime: true }
      });

      const totalRenderTime = renderJobs.reduce(
        (sum, job) => sum + (job.processingTime || 0), 
        0
      );

      const metrics: UserMetrics = {
        totalSessions: sessionsCount,
        totalEvents: eventsCount,
        totalVideosCreated: projectsCount,
        totalRenderTime,
        averageSessionDuration: 0,
        lastActive: user.updatedAt,
        signupDate: user.createdAt,
        lifetimeValue: 0
      };

      // Cache por 5 minutos
      await cache.setex(cacheKey, 300, JSON.stringify(metrics));

      return metrics;

    } catch (error) {
      console.error('❌ Erro ao obter métricas do usuário:', error);
      return null;
    }
  }

  /**
   * Obter métricas do sistema
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const cacheKey = 'metrics:system';
      const cached = await cache.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Buscar dados
      const [
        totalUsers,
        totalProjects,
        totalRenders,
        successfulRenders,
        failedRenders
      ] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.renderJob.count(),
        prisma.renderJob.count({ where: { status: 'completed' } }),
        prisma.renderJob.count({ where: { status: 'failed' } })
      ]);

      // Calcular tempo médio de renderização
      const completedJobs = await prisma.renderJob.findMany({
        where: { status: 'completed' },
        select: { processingTime: true }
      });

      const averageRenderTime = completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => sum + (job.processingTime || 0), 0) / completedJobs.length
        : 0;

      // Calcular taxas
      const successRate = totalRenders > 0 
        ? (successfulRenders / totalRenders) * 100 
        : 0;
      
      const errorRate = totalRenders > 0
        ? (failedRenders / totalRenders) * 100
        : 0;

      // Contar usuários ativos (últimas 24h)
      const activeUsers = await prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      const metrics: SystemMetrics = {
        activeUsers,
        totalUsers,
        totalVideos: totalProjects,
        totalRenders,
        averageRenderTime,
        successRate,
        errorRate,
        uptime: process.uptime()
      };

      // Cache por 1 minuto
      await cache.setex(cacheKey, 60, JSON.stringify(metrics));

      return metrics;

    } catch (error) {
      console.error('❌ Erro ao obter métricas do sistema:', error);
      return {
        activeUsers: 0,
        totalUsers: 0,
        totalVideos: 0,
        totalRenders: 0,
        averageRenderTime: 0,
        successRate: 0,
        errorRate: 0,
        uptime: process.uptime()
      };
    }
  }

  /**
   * Limpar cache (útil para testes)
   */
  async clearCache(): Promise<void> {
    const keys = await cache.keys('metrics:*');
    for (const key of keys) {
      await cache.del(key);
    }
    console.log('🧹 Cache limpo');
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const analytics = AnalyticsStandalone.getInstance();
export default analytics;
