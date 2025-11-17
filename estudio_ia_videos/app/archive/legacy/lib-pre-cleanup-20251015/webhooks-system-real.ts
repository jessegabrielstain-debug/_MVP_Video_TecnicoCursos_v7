/**
 * 🔗 WEBHOOKS SYSTEM - Sistema Completo de Webhooks
 * 
 * Sistema de webhooks para notificar sistemas externos sobre eventos.
 * Suporta retry automático, validação de assinatura e múltiplos eventos.
 * 
 * Funcionalidades:
 * - Registro de webhooks por evento
 * - Validação de assinatura HMAC
 * - Retry automático com backoff exponencial
 * - Circuit breaker para endpoints falhando
 * - Rate limiting por endpoint
 * - Logs detalhados de entregas
 * - Filtros de eventos
 * 
 * @version 1.0.0
 * @author Estúdio IA Videos
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { auditLogger, logger } from './audit-logging-real'
import { rateLimiter } from './rate-limiter-real'
import { redis } from './redis-real'

const prisma = new PrismaClient()

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type WebhookEvent =
  // Render events
  | 'render.started'
  | 'render.progress'
  | 'render.completed'
  | 'render.failed'
  | 'render.cancelled'
  
  // Project events
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.shared'
  | 'project.exported'
  
  // User events
  | 'user.registered'
  | 'user.updated'
  | 'user.deleted'
  | 'user.quota_exceeded'
  
  // Storage events
  | 'storage.uploaded'
  | 'storage.deleted'
  | 'storage.quota_warning'
  
  // Notification events
  | 'notification.sent'
  | 'notification.read'
  
  // System events
  | 'system.maintenance'
  | 'system.alert'
  | 'system.error'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
  metadata?: {
    userId?: string
    projectId?: string
    requestId?: string
    [key: string]: any
  }
}

export interface WebhookEndpoint {
  id: string
  url: string
  secret: string
  events: WebhookEvent[]
  active: boolean
  headers?: Record<string, string>
  retryConfig?: {
    maxRetries: number
    backoffMultiplier: number
    initialDelay: number
  }
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: WebhookPayload
  status: 'pending' | 'success' | 'failed' | 'retrying'
  attempts: number
  lastAttempt?: Date
  nextRetry?: Date
  response?: {
    status: number
    body: string
    headers: Record<string, string>
  }
  error?: string
}

interface CircuitBreakerState {
  failures: number
  lastFailure: Date
  state: 'closed' | 'open' | 'half-open'
  nextRetry: Date
}

// ============================================================================
// WEBHOOK MANAGER
// ============================================================================

export class WebhookManager {
  private static instance: WebhookManager
  private circuitBreakers = new Map<string, CircuitBreakerState>()
  
  // Configuração do circuit breaker
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5 // falhas consecutivas
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minuto
  private readonly CIRCUIT_BREAKER_HALF_OPEN_REQUESTS = 1
  
  // Configuração de retry
  private readonly DEFAULT_MAX_RETRIES = 3
  private readonly DEFAULT_BACKOFF_MULTIPLIER = 2
  private readonly DEFAULT_INITIAL_DELAY = 1000 // 1 segundo

  private constructor() {
    this.startDeliveryWorker()
  }

  public static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager()
    }
    return WebhookManager.instance
  }

  /**
   * Registra um novo webhook endpoint
   */
  async registerWebhook(data: {
    userId: string
    url: string
    events: WebhookEvent[]
    description?: string
    headers?: Record<string, string>
  }): Promise<WebhookEndpoint> {
    try {
      // Validar URL
      const url = new URL(data.url)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('URL deve usar protocolo HTTP ou HTTPS')
      }

      // Gerar secret
      const secret = this.generateSecret()

      // Criar webhook
      const webhook = await prisma.webhook.create({
        data: {
          userId: data.userId,
          url: data.url,
          secret,
          events: data.events,
          description: data.description,
          headers: data.headers || {},
          active: true,
        },
      })

      await auditLogger.log({
        action: 'webhook.registered',
        userId: data.userId,
        metadata: {
          webhookId: webhook.id,
          url: data.url,
          events: data.events,
        },
      })

      logger.info('Webhook registered', {
        webhookId: webhook.id,
        userId: data.userId,
        events: data.events,
      })

      return {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.events as WebhookEvent[],
        active: webhook.active,
        headers: webhook.headers as Record<string, string>,
      }
    } catch (error) {
      logger.error('Failed to register webhook', { error })
      throw error
    }
  }

  /**
   * Atualiza um webhook existente
   */
  async updateWebhook(
    webhookId: string,
    userId: string,
    updates: {
      url?: string
      events?: WebhookEvent[]
      active?: boolean
      headers?: Record<string, string>
    }
  ): Promise<WebhookEndpoint> {
    try {
      // Verificar propriedade
      const existing = await prisma.webhook.findFirst({
        where: { id: webhookId, userId },
      })

      if (!existing) {
        throw new Error('Webhook não encontrado')
      }

      // Atualizar
      const webhook = await prisma.webhook.update({
        where: { id: webhookId },
        data: updates,
      })

      await auditLogger.log({
        action: 'webhook.updated',
        userId,
        metadata: { webhookId, updates },
      })

      return {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.events as WebhookEvent[],
        active: webhook.active,
        headers: webhook.headers as Record<string, string>,
      }
    } catch (error) {
      logger.error('Failed to update webhook', { error, webhookId })
      throw error
    }
  }

  /**
   * Remove um webhook
   */
  async deleteWebhook(webhookId: string, userId: string): Promise<void> {
    try {
      await prisma.webhook.deleteMany({
        where: { id: webhookId, userId },
      })

      await auditLogger.log({
        action: 'webhook.deleted',
        userId,
        metadata: { webhookId },
      })

      logger.info('Webhook deleted', { webhookId, userId })
    } catch (error) {
      logger.error('Failed to delete webhook', { error, webhookId })
      throw error
    }
  }

  /**
   * Lista webhooks de um usuário
   */
  async listWebhooks(userId: string): Promise<WebhookEndpoint[]> {
    const webhooks = await prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return webhooks.map(w => ({
      id: w.id,
      url: w.url,
      secret: w.secret,
      events: w.events as WebhookEvent[],
      active: w.active,
      headers: w.headers as Record<string, string>,
    }))
  }

  /**
   * Dispara um evento de webhook
   */
  async trigger(event: WebhookEvent, data: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<void> {
    try {
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        metadata: {
          ...metadata,
          requestId: crypto.randomBytes(16).toString('hex'),
        },
      }

      // Buscar webhooks interessados neste evento
      const webhooks = await prisma.webhook.findMany({
        where: {
          active: true,
          events: {
            has: event,
          },
        },
      })

      logger.info(`Triggering webhook event: ${event}`, {
        event,
        webhooksCount: webhooks.length,
      })

      // Criar deliveries
      const deliveries = await Promise.all(
        webhooks.map(webhook =>
          prisma.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              event,
              payload,
              status: 'pending',
              attempts: 0,
            },
          })
        )
      )

      // Processar deliveries assincronamente
      for (const delivery of deliveries) {
        this.processDelivery(delivery.id).catch(err =>
          logger.error('Failed to process delivery', { error: err, deliveryId: delivery.id })
        )
      }
    } catch (error) {
      logger.error('Failed to trigger webhook', { error, event })
      throw error
    }
  }

  /**
   * Processa uma entrega de webhook
   */
  private async processDelivery(deliveryId: string): Promise<void> {
    try {
      const delivery = await prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
        include: { webhook: true },
      })

      if (!delivery || !delivery.webhook.active) {
        return
      }

      const { webhook } = delivery

      // Verificar circuit breaker
      if (this.isCircuitOpen(webhook.id)) {
        logger.warn('Circuit breaker is open', { webhookId: webhook.id })
        await this.scheduleRetry(deliveryId, delivery.attempts)
        return
      }

      // Verificar rate limit
      const rateLimitKey = `webhook:${webhook.id}`
      const allowed = await rateLimiter.checkLimit(rateLimitKey, {
        maxRequests: 100,
        windowMs: 60000, // 100 requests por minuto
      })

      if (!allowed) {
        logger.warn('Webhook rate limited', { webhookId: webhook.id })
        await this.scheduleRetry(deliveryId, delivery.attempts)
        return
      }

      // Preparar requisição
      const payload = delivery.payload as WebhookPayload
      const signature = this.generateSignature(payload, webhook.secret)

      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Delivery': deliveryId,
        'X-Webhook-Timestamp': payload.timestamp,
        'User-Agent': 'EstudioIAVideos-Webhooks/1.0',
        ...webhook.headers,
      }

      // Enviar webhook
      const startTime = Date.now()
      
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000), // 30s timeout
        })

        const duration = Date.now() - startTime
        const responseBody = await response.text()

        if (response.ok) {
          // Sucesso
          await prisma.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
              status: 'success',
              attempts: delivery.attempts + 1,
              lastAttempt: new Date(),
              response: {
                status: response.status,
                body: responseBody.substring(0, 1000), // Limitar tamanho
                headers: Object.fromEntries(response.headers.entries()),
              },
            },
          })

          this.resetCircuitBreaker(webhook.id)

          logger.info('Webhook delivered successfully', {
            webhookId: webhook.id,
            deliveryId,
            duration,
            status: response.status,
          })
        } else {
          throw new Error(`HTTP ${response.status}: ${responseBody}`)
        }
      } catch (error) {
        // Falha
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'failed',
            attempts: delivery.attempts + 1,
            lastAttempt: new Date(),
            error: errorMessage.substring(0, 500),
          },
        })

        this.recordCircuitBreakerFailure(webhook.id)

        // Agendar retry se ainda houver tentativas
        const maxRetries = webhook.retryConfig?.maxRetries || this.DEFAULT_MAX_RETRIES
        
        if (delivery.attempts < maxRetries) {
          await this.scheduleRetry(deliveryId, delivery.attempts)
          
          await prisma.webhookDelivery.update({
            where: { id: deliveryId },
            data: { status: 'retrying' },
          })

          logger.warn('Webhook delivery failed, will retry', {
            webhookId: webhook.id,
            deliveryId,
            attempt: delivery.attempts + 1,
            maxRetries,
            error: errorMessage,
          })
        } else {
          logger.error('Webhook delivery failed permanently', {
            webhookId: webhook.id,
            deliveryId,
            attempts: delivery.attempts + 1,
            error: errorMessage,
          })
        }
      }
    } catch (error) {
      logger.error('Failed to process webhook delivery', { error, deliveryId })
    }
  }

  /**
   * Agenda um retry com backoff exponencial
   */
  private async scheduleRetry(deliveryId: string, currentAttempt: number): Promise<void> {
    const delay = this.calculateRetryDelay(currentAttempt)
    const nextRetry = new Date(Date.now() + delay)

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: { nextRetry },
    })

    // Agendar processamento
    setTimeout(() => {
      this.processDelivery(deliveryId).catch(err =>
        logger.error('Retry failed', { error: err, deliveryId })
      )
    }, delay)
  }

  /**
   * Calcula delay para retry com backoff exponencial
   */
  private calculateRetryDelay(attempt: number): number {
    const backoff = this.DEFAULT_BACKOFF_MULTIPLIER
    const baseDelay = this.DEFAULT_INITIAL_DELAY
    
    // Backoff exponencial: baseDelay * (backoff ^ attempt)
    // Exemplo: 1s, 2s, 4s, 8s, 16s...
    const delay = baseDelay * Math.pow(backoff, attempt)
    
    // Adicionar jitter (±20%) para evitar thundering herd
    const jitter = delay * 0.2 * (Math.random() - 0.5)
    
    return Math.min(delay + jitter, 300000) // Max 5 minutos
  }

  /**
   * Gera assinatura HMAC para validação
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(JSON.stringify(payload))
    return hmac.digest('hex')
  }

  /**
   * Valida assinatura de um webhook
   */
  public validateSignature(payload: WebhookPayload, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  /**
   * Gera um secret aleatório
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Circuit breaker - verifica se está aberto
   */
  private isCircuitOpen(webhookId: string): boolean {
    const state = this.circuitBreakers.get(webhookId)
    
    if (!state) {
      return false
    }

    if (state.state === 'open') {
      // Verificar se é hora de tentar half-open
      if (Date.now() >= state.nextRetry.getTime()) {
        state.state = 'half-open'
        return false
      }
      return true
    }

    return false
  }

  /**
   * Registra falha no circuit breaker
   */
  private recordCircuitBreakerFailure(webhookId: string): void {
    const state = this.circuitBreakers.get(webhookId) || {
      failures: 0,
      lastFailure: new Date(),
      state: 'closed' as const,
      nextRetry: new Date(),
    }

    state.failures++
    state.lastFailure = new Date()

    if (state.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      state.state = 'open'
      state.nextRetry = new Date(Date.now() + this.CIRCUIT_BREAKER_TIMEOUT)
      
      logger.warn('Circuit breaker opened', {
        webhookId,
        failures: state.failures,
        nextRetry: state.nextRetry,
      })
    }

    this.circuitBreakers.set(webhookId, state)
  }

  /**
   * Reseta circuit breaker após sucesso
   */
  private resetCircuitBreaker(webhookId: string): void {
    const state = this.circuitBreakers.get(webhookId)
    
    if (state && state.state === 'half-open') {
      logger.info('Circuit breaker closed', { webhookId })
    }

    this.circuitBreakers.delete(webhookId)
  }

  /**
   * Worker para processar deliveries pendentes
   */
  private startDeliveryWorker(): void {
    setInterval(async () => {
      try {
        const pendingDeliveries = await prisma.webhookDelivery.findMany({
          where: {
            status: 'retrying',
            nextRetry: {
              lte: new Date(),
            },
          },
          take: 10,
        })

        for (const delivery of pendingDeliveries) {
          this.processDelivery(delivery.id).catch(err =>
            logger.error('Worker failed to process delivery', {
              error: err,
              deliveryId: delivery.id,
            })
          )
        }
      } catch (error) {
        logger.error('Delivery worker error', { error })
      }
    }, 10000) // A cada 10 segundos
  }

  /**
   * Obtém estatísticas de um webhook
   */
  async getWebhookStats(webhookId: string, userId: string): Promise<{
    totalDeliveries: number
    successRate: number
    avgResponseTime: number
    lastDelivery?: Date
    recentFailures: number
  }> {
    // Verificar propriedade
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, userId },
    })

    if (!webhook) {
      throw new Error('Webhook não encontrado')
    }

    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const totalDeliveries = deliveries.length
    const successful = deliveries.filter(d => d.status === 'success').length
    const successRate = totalDeliveries > 0 ? (successful / totalDeliveries) * 100 : 0

    const recentFailures = deliveries
      .filter(d => d.createdAt > new Date(Date.now() - 3600000)) // última hora
      .filter(d => d.status === 'failed').length

    // Calcular tempo médio de resposta a partir dos logs
    const avgResponseTime = await this.calculateAverageResponseTime(webhookId)

    return {
      totalDeliveries,
      successRate,
      avgResponseTime,
      lastDelivery: deliveries[0]?.createdAt,
      recentFailures,
    }
  }

  /**
   * Calcula o tempo médio de resposta para um webhook
   */
  private async calculateAverageResponseTime(webhookId: string): Promise<number> {
    try {
      // Buscar logs de delivery das últimas 24 horas
      const oneDayAgo = new Date(Date.now() - 24 * 3600000)
      
      const deliveries = await prisma.webhookDelivery.findMany({
        where: {
          webhookId,
          createdAt: { gte: oneDayAgo },
          status: 'delivered', // Apenas entregas bem-sucedidas
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

      // Armazenar métrica no Redis para cache
      const cacheKey = `webhook:${webhookId}:avg_response_time`
      await redis.setex(cacheKey, 300, avgTime.toString()) // Cache de 5 minutos

      return avgTime
    } catch (error) {
      console.error('[WebhookManager] Erro ao calcular avgResponseTime:', error)
      
      // Tentar recuperar do cache
      const cacheKey = `webhook:${webhookId}:avg_response_time`
      const cached = await redis.get(cacheKey)
      
      return cached ? parseInt(cached) : 0
    }
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const webhookManager = WebhookManager.getInstance()

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper para disparar eventos de webhook comuns
 */
export const triggerWebhook = {
  // Render events
  renderStarted: (data: { renderJobId: string; projectId: string; userId: string }) =>
    webhookManager.trigger('render.started', data, { userId: data.userId }),

  renderProgress: (data: { renderJobId: string; progress: number; userId: string }) =>
    webhookManager.trigger('render.progress', data, { userId: data.userId }),

  renderCompleted: (data: { renderJobId: string; outputUrl: string; userId: string }) =>
    webhookManager.trigger('render.completed', data, { userId: data.userId }),

  renderFailed: (data: { renderJobId: string; error: string; userId: string }) =>
    webhookManager.trigger('render.failed', data, { userId: data.userId }),

  // Project events
  projectCreated: (data: { projectId: string; name: string; userId: string }) =>
    webhookManager.trigger('project.created', data, { userId: data.userId }),

  projectExported: (data: { projectId: string; format: string; url: string; userId: string }) =>
    webhookManager.trigger('project.exported', data, { userId: data.userId }),

  // Storage events
  storageUploaded: (data: { fileKey: string; size: number; userId: string }) =>
    webhookManager.trigger('storage.uploaded', data, { userId: data.userId }),

  // System events
  systemAlert: (data: { level: string; message: string }) =>
    webhookManager.trigger('system.alert', data),
}
