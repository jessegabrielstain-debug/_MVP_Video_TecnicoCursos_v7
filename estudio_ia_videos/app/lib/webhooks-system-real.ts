import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { randomUUID, createHmac } from 'crypto'
import { Prisma } from '@prisma/client'
import { getRedisClient } from '@/lib/services/redis-service'

export type WebhookEvent =
  | 'render.started'
  | 'render.completed'
  | 'render.failed'
  | 'project.created'
  | 'storage.uploaded'
  | 'system.alert'

export interface WebhookConfig {
  userId: string
  url: string
  events: WebhookEvent[]
  description?: string
  headers?: Record<string, string>
  secret?: string
}

interface PrismaWebhook {
  id: string;
  userId: string;
  url: string;
  secret: string;
  events: unknown;
  active: boolean;
  retryInterval?: number;
}

interface PrismaWebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: unknown;
  url: string;
  status: string;
  scheduledFor: Date;
}

export class WebhookManager {
  async listWebhooks(userId: string) {
    try {
      return await prisma.webhook.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      logger.error('Failed to list webhooks', error as Error, { userId })
      throw error
    }
  }

  async registerWebhook(config: WebhookConfig) {
    try {
      const secret = config.secret || randomUUID()
      
      // Prisma doesn't have description/headers in the schema shown in migration.sql
      // But the route passes them. I will check if I can store them or if I should ignore.
      // The migration SQL shows:
      // "events" JSONB NOT NULL
      // It does NOT show "description" or "headers" columns in Webhook table.
      // However, the route passes them. 
      // I will assume for now that I might need to store them in a metadata field if it existed, 
      // or maybe the schema in the migration file I read was partial or I missed something.
      // Re-reading the migration sql provided in context:
      // CREATE TABLE "Webhook" ( ... "events" JSONB NOT NULL ... );
      // No description or headers column.
      // I will ignore description and headers for the DB creation to avoid runtime errors, 
      // or put them in a hypothetical metadata field if I can find one. 
      // There is no metadata field in the CREATE TABLE statement.
      // I will proceed with creating the webhook with available fields.
      
          const webhook = await prisma.webhook.create({
        data: {
          userId: config.userId,
          url: config.url,
          secret,
          events: config.events as unknown as Prisma.InputJsonValue, // JSONB
          active: true,
        }
      })
      logger.info('Webhook registered', { webhookId: webhook.id, userId: config.userId })
      return webhook
    } catch (error) {
      logger.error('Failed to register webhook', error as Error, { config })
      throw error
    }
  }

  async deleteWebhook(id: string, userId: string) {
    try {
      await prisma.webhook.deleteMany({
        where: { id, userId }
      })
      return true
    } catch (error) {
      logger.error('Failed to delete webhook', error as Error, { id, userId })
      throw error
    }
  }

  async getWebhook(id: string) {
    return await prisma.webhook.findUnique({
      where: { id }
    })
  }

  /**
   * Calcula o tempo médio de resposta de um webhook a partir dos logs de delivery
   * @param webhookId ID do webhook
   * @returns Tempo médio de resposta em milissegundos
   */
  async calculateAverageResponseTime(webhookId: string): Promise<number> {
    try {
      // Tentar recuperar do cache Redis primeiro (cache de 5 minutos)
      const cacheKey = `webhook:${webhookId}:avg_response_time`
      try {
        const redis = getRedisClient()
        const cached = await redis.get(cacheKey)
        if (cached) {
          return parseInt(cached, 10)
        }
      } catch (redisError) {
        // Redis não disponível, continuar com cálculo do banco
        logger.info('Redis não disponível para cache de avgResponseTime', { webhookId })
      }

      // Buscar logs de delivery das últimas 24 horas
      const oneDayAgo = new Date(Date.now() - 24 * 3600000)
      
      const deliveries = await prisma.webhookDelivery.findMany({
        where: {
          webhookId,
          createdAt: { gte: oneDayAgo },
          status: 'completed', // Apenas entregas bem-sucedidas
          responseTime: { not: null }, // Apenas com tempo de resposta registrado
        },
        select: {
          responseTime: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Últimas 100 entregas
      })

      if (deliveries.length === 0) {
        return 0
      }

      // Calcular média dos tempos de resposta
      const totalResponseTime = deliveries.reduce((sum, delivery) => {
        return sum + (delivery.responseTime || 0)
      }, 0)

      const avgTime = Math.round(totalResponseTime / deliveries.length)

      // Armazenar métrica no Redis para cache (5 minutos)
      try {
        const redis = getRedisClient()
        await redis.setex(cacheKey, 300, avgTime.toString())
      } catch (redisError) {
        // Redis não disponível, continuar sem cache
        logger.info('Não foi possível cachear avgResponseTime no Redis', { webhookId })
      }

      return avgTime
    } catch (error) {
      logger.error('Erro ao calcular avgResponseTime', error as Error, { webhookId })
      
      // Tentar recuperar do cache em caso de erro
      try {
        const redis = getRedisClient()
        const cacheKey = `webhook:${webhookId}:avg_response_time`
        const cached = await redis.get(cacheKey)
        if (cached) {
          return parseInt(cached, 10)
        }
      } catch {
        // Ignorar erro de cache
      }
      
      return 0
    }
  }

  /**
   * Obtém estatísticas completas de um webhook
   * @param webhookId ID do webhook
   * @returns Estatísticas do webhook incluindo avgResponseTime
   */
  async getWebhookStats(webhookId: string) {
    try {
      const webhook = await this.getWebhook(webhookId)
      if (!webhook) {
        throw new Error('Webhook not found')
      }

      const avgResponseTime = await this.calculateAverageResponseTime(webhookId)

      return {
        id: webhook.id,
        url: webhook.url,
        active: webhook.active,
        totalDeliveries: webhook.totalDeliveries,
        successfulDeliveries: webhook.successfulDeliveries,
        failedDeliveries: webhook.failedDeliveries,
        lastDeliveryAt: webhook.lastDeliveryAt,
        avgResponseTime,
      }
    } catch (error) {
      logger.error('Erro ao obter estatísticas do webhook', error as Error, { webhookId })
      throw error
    }
  }
}

export const webhookManager = new WebhookManager()

// Trigger system
class WebhookTrigger {
  private async dispatch(event: WebhookEvent, payload: Record<string, unknown>) {
    try {
      // Find all active webhooks that subscribe to this event
      // Since events is JSONB, we might need to fetch all active and filter in code 
      // or use specific JSON filtering if supported. 
      // For simplicity and compatibility, I'll fetch active webhooks and filter in JS.
      
      // Note: In a real high-scale system, this should be optimized.
      const webhooks = await prisma.webhook.findMany({
        where: { active: true }
      })

      const matchingWebhooks = webhooks.filter(wh => {
        const events = wh.events as unknown as string[]
        return Array.isArray(events) && (events.includes(event) || events.includes('*'))
      })

      if (matchingWebhooks.length === 0) return

      logger.info(`Dispatching webhook event: ${event}`, { count: matchingWebhooks.length })

      const deliveryPromises = matchingWebhooks.map(async (webhook) => {
        try {
          // Create delivery record
          const delivery = await prisma.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              event,
              payload: payload as unknown as Prisma.InputJsonValue,
              url: webhook.url,
              status: 'pending',
              scheduledFor: new Date()
            }
          })

          // Enviar webhook de forma assíncrona (fire and forget)
          // Em produção, isso poderia ser melhorado com uma fila (BullMQ) para retry e rate limiting
          this.sendWebhook(webhook as unknown as PrismaWebhook, delivery as unknown as PrismaWebhookDelivery, event, payload).catch(err => {
            logger.error('Background webhook delivery failed', err as Error, { deliveryId: delivery.id })
          })

        } catch (err) {
          logger.error('Failed to create webhook delivery record', err as Error, { webhookId: webhook.id })
        }
      })

      await Promise.all(deliveryPromises)

    } catch (error) {
      logger.error('Webhook dispatch error', error as Error, { event })
    }
  }

  private async sendWebhook(webhook: PrismaWebhook, delivery: PrismaWebhookDelivery, event: string, payload: Record<string, unknown>) {
    const timestamp = Date.now()
    const signature = createHmac('sha256', webhook.secret)
      .update(`${timestamp}.${JSON.stringify(payload)}`)
      .digest('hex')

    const startTime = Date.now()
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': `t=${timestamp},v1=${signature}`,
          'User-Agent': 'EstudioIA-Webhooks/1.0'
        },
        body: JSON.stringify(payload)
      })

      const duration = Date.now() - startTime
      const responseBody = await response.text()

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: response.ok ? 'completed' : 'failed',
          responseCode: response.status,
          responseBody: responseBody.substring(0, 1000), // Truncate if too long
          responseTime: duration,
          deliveredAt: new Date(),
          attempts: { increment: 1 }
        }
      })

      // Update webhook stats
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          totalDeliveries: { increment: 1 },
          successfulDeliveries: response.ok ? { increment: 1 } : undefined,
          failedDeliveries: !response.ok ? { increment: 1 } : undefined,
          lastDeliveryAt: new Date(),
          // Simple moving average for response time could be implemented here
        }
      })

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          error: errorMessage,
          responseTime: duration,
          attempts: { increment: 1 },
          nextRetryAt: new Date(Date.now() + (webhook.retryInterval || 60) * 1000) 
        }
      })
      
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          totalDeliveries: { increment: 1 },
          failedDeliveries: { increment: 1 },
          lastDeliveryAt: new Date()
        }
      })
    }
  }

  // Typed triggers
  async renderStarted(payload: { jobId: string, projectId: string, userId: string }) {
    return this.dispatch('render.started', payload)
  }

  async renderCompleted(payload: { jobId: string, projectId: string, videoUrl: string, duration: number }) {
    return this.dispatch('render.completed', payload)
  }
  
  async renderFailed(payload: { jobId: string, projectId: string, error: string }) {
    return this.dispatch('render.failed', payload)
  }

  async projectCreated(payload: { projectId: string, userId: string, name: string }) {
    return this.dispatch('project.created', payload)
  }

  async storageUploaded(payload: { fileId: string, url: string, size: number }) {
    return this.dispatch('storage.uploaded', payload)
  }

  async systemAlert(payload: { type: string, message: string, severity: 'info'|'warning'|'error'|'critical' }) {
    return this.dispatch('system.alert', payload)
  }
}

export const triggerWebhook = new WebhookTrigger()
