/**
 * 🚀 SISTEMA DE MONITORAMENTO PARA PRODUÇÃO - FASE 5
 * Monitoramento avançado com APM, alertas e métricas
 */

import { getProductionConfig } from '../config/production-config'

export interface SystemMetrics {
  timestamp: Date
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    used: number
    total: number
    percentage: number
    heap: {
      used: number
      total: number
    }
  }
  redis: {
    isHealthy: boolean
    latency: number
    commands: number
    errors: number
    memoryUsage: number
  }
  http: {
    activeConnections: number
    requestsPerSecond: number
    averageResponseTime: number
    errorRate: number
  }
  database: {
    activeConnections: number
    queryTime: number
    slowQueries: number
  }
  storage: {
    diskUsage: number
    uploadRate: number
    downloadRate: number
  }
}

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  resolved: boolean
  metadata?: Record<string, unknown>
}

export interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  lastCheck: Date
  details?: Record<string, unknown>
}

/**
 * Classe principal do sistema de monitoramento
 */
export class ProductionMonitoring {
  private metrics: SystemMetrics[] = []
  private alerts: Alert[] = []
  private healthChecks: Map<string, HealthCheck> = new Map()
  private metricsInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private alertHandlers: ((alert: Alert) => void)[] = []
  private config = getProductionConfig()

  constructor() {
    this.startMonitoring()
  }

  /**
   * Inicia o monitoramento
   */
  private startMonitoring(): void {
    // Coletar métricas a cada 30 segundos
    this.metricsInterval = setInterval(() => {
      this.collectMetrics()
    }, 30000)

    // Health checks a cada 60 segundos
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, 60000)

    // Primeira coleta imediata
    this.collectMetrics()
    this.performHealthChecks()

    console.log('📊 Sistema de monitoramento iniciado')
  }

  /**
   * Coleta métricas do sistema
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: await this.getCpuMetrics(),
        memory: this.getMemoryMetrics(),
        redis: await this.getRedisMetrics(),
        http: this.getHttpMetrics(),
        database: await this.getDatabaseMetrics(),
        storage: this.getStorageMetrics()
      }

      this.metrics.push(metrics)
      
      // Manter apenas últimas 1000 métricas (aprox. 8 horas)
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000)
      }

      // Verificar alertas
      this.checkAlerts(metrics)

    } catch (error) {
      console.error('❌ Erro ao coletar métricas:', error)
      this.createAlert('critical', 'Erro de Monitoramento', 
        `Falha ao coletar métricas: ${error.message}`)
    }
  }

  /**
   * Obtém métricas de CPU
   */
  private async getCpuMetrics(): Promise<SystemMetrics['cpu']> {
    const os = await import('os')
    
    return {
      usage: process.cpuUsage().user / 1000000, // Convertir para segundos
      loadAverage: os.loadavg()
    }
  }

  /**
   * Obtém métricas de memória
   */
  private getMemoryMetrics(): SystemMetrics['memory'] {
    const memUsage = process.memoryUsage()
    const os = require('os')
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    return {
      used: usedMem,
      total: totalMem,
      percentage: (usedMem / totalMem) * 100,
      heap: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal
      }
    }
  }

  /**
   * Obtém métricas do Redis
   */
  private async getRedisMetrics(): Promise<SystemMetrics['redis']> {
    try {
      // Importação dinâmica para evitar erro se Redis não estiver disponível
      const { getRedisService } = await import('../redis/redis-production-service')
      const redisService = getRedisService()
      const healthStatus = redisService.getHealthStatus()
      const metrics = redisService.getMetrics()

      return {
        isHealthy: healthStatus.isHealthy,
        latency: metrics.latency,
        commands: metrics.commands,
        errors: metrics.errors,
        memoryUsage: metrics.memoryUsage
      }
    } catch (error) {
      return {
        isHealthy: false,
        latency: 0,
        commands: 0,
        errors: 1,
        memoryUsage: 0
      }
    }
  }

  /**
   * Obtém métricas HTTP (simuladas)
   */
  private getHttpMetrics(): SystemMetrics['http'] {
    // Em produção, isso seria integrado com o servidor HTTP
    return {
      activeConnections: Math.floor(Math.random() * 100),
      requestsPerSecond: Math.floor(Math.random() * 50),
      averageResponseTime: Math.floor(Math.random() * 200) + 50,
      errorRate: Math.random() * 5
    }
  }

  /**
   * Obtém métricas do banco de dados (simuladas)
   */
  private async getDatabaseMetrics(): Promise<SystemMetrics['database']> {
    // Em produção, isso seria integrado com o pool de conexões
    return {
      activeConnections: Math.floor(Math.random() * 20),
      queryTime: Math.floor(Math.random() * 100) + 10,
      slowQueries: Math.floor(Math.random() * 5)
    }
  }

  /**
   * Obtém métricas de storage (simuladas)
   */
  private getStorageMetrics(): SystemMetrics['storage'] {
    return {
      diskUsage: Math.random() * 100,
      uploadRate: Math.random() * 1024 * 1024, // MB/s
      downloadRate: Math.random() * 1024 * 1024 // MB/s
    }
  }

  /**
   * Executa health checks
   */
  private async performHealthChecks(): Promise<void> {
    const services = [
      'redis',
      'database',
      'storage',
      'audio2face'
    ]

    for (const service of services) {
      try {
        const healthCheck = await this.checkServiceHealth(service)
        this.healthChecks.set(service, healthCheck)
      } catch (error) {
        console.error(`❌ Health check falhou para ${service}:`, error)
        this.healthChecks.set(service, {
          service,
          status: 'unhealthy',
          latency: 0,
          lastCheck: new Date(),
          details: { error: error.message }
        })
      }
    }
  }

  /**
   * Verifica saúde de um serviço específico
   */
  private async checkServiceHealth(service: string): Promise<HealthCheck> {
    const start = Date.now()
    let status: HealthCheck['status'] = 'healthy'
    let details: Record<string, unknown> = {}

    try {
      switch (service) {
        case 'redis':
          try {
            const { getRedisService } = await import('../redis/redis-production-service')
            const redisService = getRedisService()
            const redisHealth = redisService.getHealthStatus()
            status = redisHealth.isHealthy ? 'healthy' : 'unhealthy'
            details = { fallbackActive: redisHealth.fallbackActive }
          } catch (error) {
            status = 'unhealthy'
            details = { error: 'Redis service not available' }
          }
          break

        case 'database':
          // Simular check do banco
          status = 'healthy'
          break

        case 'storage':
          // Simular check do storage
          status = 'healthy'
          break

        case 'audio2face':
          // Simular check do Audio2Face
          status = Math.random() > 0.1 ? 'healthy' : 'degraded'
          break
      }
    } catch (error) {
      status = 'unhealthy'
      details.error = error.message
    }

    return {
      service,
      status,
      latency: Date.now() - start,
      lastCheck: new Date(),
      details
    }
  }

  /**
   * Verifica condições de alerta
   */
  private checkAlerts(metrics: SystemMetrics): void {
    // CPU alto
    if (metrics.cpu.usage > 80) {
      this.createAlert('warning', 'CPU Alto', 
        `Uso de CPU em ${metrics.cpu.usage.toFixed(1)}%`)
    }

    // Memória alta
    if (metrics.memory.percentage > 85) {
      this.createAlert('critical', 'Memória Alta', 
        `Uso de memória em ${metrics.memory.percentage.toFixed(1)}%`)
    }

    // Redis não saudável
    if (!metrics.redis.isHealthy) {
      this.createAlert('critical', 'Redis Indisponível', 
        'Serviço Redis não está respondendo')
    }

    // Taxa de erro HTTP alta
    if (metrics.http.errorRate > 10) {
      this.createAlert('warning', 'Taxa de Erro Alta', 
        `Taxa de erro HTTP em ${metrics.http.errorRate.toFixed(1)}%`)
    }

    // Tempo de resposta alto
    if (metrics.http.averageResponseTime > 1000) {
      this.createAlert('warning', 'Resposta Lenta', 
        `Tempo médio de resposta: ${metrics.http.averageResponseTime}ms`)
    }
  }

  /**
   * Cria um novo alerta
   */
  private createAlert(type: Alert['type'], title: string, message: string, metadata?: Record<string, unknown>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    }

    this.alerts.push(alert)
    
    // Manter apenas últimos 100 alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    // Notificar handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert)
      } catch (error) {
        console.error('❌ Erro ao processar handler de alerta:', error)
      }
    })

    console.log(`🚨 Alerta ${type}: ${title} - ${message}`)
  }

  /**
   * Adiciona handler de alerta
   */
  addAlertHandler(handler: (alert: Alert) => void): void {
    this.alertHandlers.push(handler)
  }

  /**
   * Obtém métricas atuais
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  /**
   * Obtém status de saúde de todos os serviços
   */
  getHealthStatus(): Map<string, HealthCheck> {
    return new Map(this.healthChecks)
  }

  /**
   * Obtém resumo do sistema
   */
  getSystemSummary(): {
    status: 'healthy' | 'degraded' | 'critical'
    activeAlerts: number
    healthyServices: number
    totalServices: number
    uptime: number
  } {
    const activeAlerts = this.getActiveAlerts()
    const criticalAlerts = activeAlerts.filter(a => a.type === 'critical').length
    const healthyServices = Array.from(this.healthChecks.values())
      .filter(hc => hc.status === 'healthy').length
    
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    if (criticalAlerts > 0) {
      status = 'critical'
    } else if (activeAlerts.length > 0) {
      status = 'degraded'
    }

    return {
      status,
      activeAlerts: activeAlerts.length,
      healthyServices,
      totalServices: this.healthChecks.size,
      uptime: Date.now() - (this.metrics[0]?.timestamp.getTime() || Date.now())
    }
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    console.log('📊 Sistema de monitoramento parado')
  }
}

/**
 * Instância singleton do monitoramento
 */
let monitoring: ProductionMonitoring | null = null

export function getMonitoring(): ProductionMonitoring {
  if (!monitoring) {
    monitoring = new ProductionMonitoring()
  }
  return monitoring
}

export default getMonitoring