/**
 * 📊 Sistema de Monitoramento e Logs V2
 * Monitoramento completo do pipeline TTS + Avatar
 * Logs detalhados, métricas de performance e alertas
 */

// Tipos de eventos
type EventType = 
  | 'tts_start' | 'tts_success' | 'tts_error'
  | 'lipsync_start' | 'lipsync_success' | 'lipsync_error'
  | 'render_start' | 'render_success' | 'render_error'
  | 'pipeline_start' | 'pipeline_success' | 'pipeline_error'
  | 'cache_hit' | 'cache_miss' | 'cache_error'
  | 'api_request' | 'api_response' | 'api_error'
  | 'system_warning' | 'system_error' | 'system_info'

// Níveis de log
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

// Interface para evento de log
interface LogEvent {
  id: string
  timestamp: Date
  level: LogLevel
  type: EventType
  message: string
  data?: Record<string, unknown>
  duration?: number
  userId?: string
  sessionId?: string
  jobId?: string
  requestId?: string
  metadata?: {
    userAgent?: string
    ip?: string
    endpoint?: string
    method?: string
    statusCode?: number
    responseTime?: number
    memoryUsage?: number
    cpuUsage?: number
    errorStack?: string
  }
}

// Interface para métricas de performance
interface PerformanceMetrics {
  timestamp: Date
  
  // Métricas de TTS
  tts: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    providerStats: Record<string, {
      requests: number
      successes: number
      failures: number
      avgTime: number
    }>
  }
  
  // Métricas de Lip-Sync
  lipSync: {
    totalJobs: number
    successfulJobs: number
    failedJobs: number
    averageProcessingTime: number
    averageQuality: number
  }
  
  // Métricas de Renderização
  rendering: {
    totalJobs: number
    successfulJobs: number
    failedJobs: number
    averageRenderTime: number
    averageFileSize: number
    qualityDistribution: Record<string, number>
  }
  
  // Métricas do Pipeline
  pipeline: {
    totalJobs: number
    completedJobs: number
    failedJobs: number
    queueLength: number
    averageTotalTime: number
    concurrentJobs: number
  }
  
  // Métricas de Sistema
  system: {
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
    activeConnections: number
    uptime: number
  }
  
  // Métricas de Cache
  cache: {
    hits: number
    misses: number
    hitRate: number
    size: number
    evictions: number
  }
}

// Interface para alerta
interface Alert {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'critical'
  title: string
  message: string
  category: 'performance' | 'error' | 'system' | 'security'
  data?: Record<string, unknown>
  resolved?: boolean
  resolvedAt?: Date
  actions?: string[]
}

// Configuração do monitoramento
interface MonitoringConfig {
  logLevel: LogLevel
  enableFileLogging: boolean
  enableConsoleLogging: boolean
  enableMetrics: boolean
  enableAlerts: boolean
  metricsInterval: number // ms
  logRetentionDays: number
  maxLogFileSize: number // bytes
  alertThresholds: {
    errorRate: number // %
    responseTime: number // ms
    memoryUsage: number // %
    cpuUsage: number // %
    queueLength: number
  }
}

// Configuração padrão
const DEFAULT_CONFIG: MonitoringConfig = {
  logLevel: 'info',
  enableFileLogging: true,
  enableConsoleLogging: true,
  enableMetrics: true,
  enableAlerts: true,
  metricsInterval: 60000, // 1 minuto
  logRetentionDays: 30,
  maxLogFileSize: 100 * 1024 * 1024, // 100MB
  alertThresholds: {
    errorRate: 5, // 5%
    responseTime: 10000, // 10 segundos
    memoryUsage: 80, // 80%
    cpuUsage: 80, // 80%
    queueLength: 50
  }
}

export class MonitoringService {
  private static instance: MonitoringService
  private config: MonitoringConfig
  private logs: LogEvent[] = []
  private metrics: PerformanceMetrics[] = []
  private alerts: Alert[] = []
  private metricsInterval?: NodeJS.Timeout
  private currentMetrics: Partial<PerformanceMetrics> = {}
  
  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeMetrics()
    this.startMetricsCollection()
  }
  
  static getInstance(config?: Partial<MonitoringConfig>): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(config)
    }
    return MonitoringService.instance
  }
  
  // Inicializar métricas
  private initializeMetrics(): void {
    this.currentMetrics = {
      timestamp: new Date(),
      tts: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        providerStats: {}
      },
      lipSync: {
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        averageProcessingTime: 0,
        averageQuality: 0
      },
      rendering: {
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        averageRenderTime: 0,
        averageFileSize: 0,
        qualityDistribution: {}
      },
      pipeline: {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        queueLength: 0,
        averageTotalTime: 0,
        concurrentJobs: 0
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        activeConnections: 0,
        uptime: process.uptime()
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        evictions: 0
      }
    }
  }
  
  // Iniciar coleta de métricas
  private startMetricsCollection(): void {
    if (!this.config.enableMetrics) return
    
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics()
      this.saveMetricsSnapshot()
      this.checkAlertThresholds()
    }, this.config.metricsInterval)
  }
  
  // Coletar métricas do sistema
  private collectSystemMetrics(): void {
    try {
      const memUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()
      
      if (this.currentMetrics.system) {
        this.currentMetrics.system.memoryUsage = memUsage.heapUsed / memUsage.heapTotal * 100
        this.currentMetrics.system.uptime = process.uptime()
        // CPU usage seria calculado de forma mais complexa em produção
        this.currentMetrics.system.cpuUsage = Math.random() * 100 // Simulado
      }
    } catch (error) {
      this.log('error', 'system_error', 'Erro ao coletar métricas do sistema', { error })
    }
  }
  
  // Salvar snapshot das métricas
  private saveMetricsSnapshot(): void {
    if (this.currentMetrics.timestamp) {
      this.metrics.push({ ...this.currentMetrics } as PerformanceMetrics)
      
      // Limitar histórico de métricas (últimas 24 horas)
      const maxMetrics = (24 * 60 * 60 * 1000) / this.config.metricsInterval
      if (this.metrics.length > maxMetrics) {
        this.metrics = this.metrics.slice(-maxMetrics)
      }
    }
  }
  
  // Verificar thresholds de alerta
  private checkAlertThresholds(): void {
    if (!this.config.enableAlerts) return
    
    const { alertThresholds } = this.config
    const metrics = this.currentMetrics
    
    // Verificar taxa de erro
    if (metrics.tts && metrics.tts.totalRequests > 0) {
      const errorRate = (metrics.tts.failedRequests / metrics.tts.totalRequests) * 100
      if (errorRate > alertThresholds.errorRate) {
        this.createAlert('warning', 'performance', 'Alta taxa de erro em TTS', 
          `Taxa de erro: ${errorRate.toFixed(2)}%`, { errorRate, threshold: alertThresholds.errorRate })
      }
    }
    
    // Verificar tempo de resposta
    if (metrics.tts && metrics.tts.averageResponseTime > alertThresholds.responseTime) {
      this.createAlert('warning', 'performance', 'Tempo de resposta alto em TTS',
        `Tempo médio: ${metrics.tts.averageResponseTime}ms`, 
        { responseTime: metrics.tts.averageResponseTime, threshold: alertThresholds.responseTime })
    }
    
    // Verificar uso de memória
    if (metrics.system && metrics.system.memoryUsage > alertThresholds.memoryUsage) {
      this.createAlert('critical', 'system', 'Alto uso de memória',
        `Uso de memória: ${metrics.system.memoryUsage.toFixed(2)}%`,
        { memoryUsage: metrics.system.memoryUsage, threshold: alertThresholds.memoryUsage })
    }
    
    // Verificar tamanho da fila
    if (metrics.pipeline && metrics.pipeline.queueLength > alertThresholds.queueLength) {
      this.createAlert('warning', 'performance', 'Fila de jobs muito grande',
        `Tamanho da fila: ${metrics.pipeline.queueLength}`,
        { queueLength: metrics.pipeline.queueLength, threshold: alertThresholds.queueLength })
    }
  }
  
  // Criar alerta
  private createAlert(level: Alert['level'], category: Alert['category'], title: string, message: string, data?: Record<string, unknown>): void {
    const alert: Alert = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      title,
      message,
      category,
      data,
      resolved: false
    }
    
    this.alerts.push(alert)
    this.log(level === 'critical' ? 'critical' : 'warn', 'system_warning', `ALERTA: ${title}`, { alert })
    
    // Limitar número de alertas
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000)
    }
  }
  
  // Método principal de log
  log(level: LogLevel, type: EventType, message: string, data?: Record<string, unknown>, metadata?: LogEvent['metadata']): void {
    if (!this.shouldLog(level)) return
    
    const logEvent: LogEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      type,
      message,
      data,
      metadata
    }
    
    this.logs.push(logEvent)
    
    // Log no console se habilitado
    if (this.config.enableConsoleLogging) {
      this.logToConsole(logEvent)
    }
    
    // Log em arquivo se habilitado
    if (this.config.enableFileLogging) {
      this.logToFile(logEvent)
    }
    
    // Limitar logs em memória
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000)
    }
  }
  
  // Verificar se deve fazer log baseado no nível
  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'critical']
    const currentLevelIndex = levels.indexOf(this.config.logLevel)
    const eventLevelIndex = levels.indexOf(level)
    
    return eventLevelIndex >= currentLevelIndex
  }
  
  // Log no console
  private logToConsole(event: LogEvent): void {
    const timestamp = event.timestamp.toISOString()
    const prefix = `[${timestamp}] [${event.level.toUpperCase()}] [${event.type}]`
    
    switch (event.level) {
      case 'debug':
        console.debug(`${prefix} ${event.message}`, event.data || '')
        break
      case 'info':
        console.info(`${prefix} ${event.message}`, event.data || '')
        break
      case 'warn':
        console.warn(`${prefix} ${event.message}`, event.data || '')
        break
      case 'error':
      case 'critical':
        console.error(`${prefix} ${event.message}`, event.data || '')
        break
    }
  }
  
  // Log em arquivo (simulado)
  private logToFile(event: LogEvent): void {
    // Em produção, implementar escrita real em arquivo
    const logLine = JSON.stringify({
      ...event,
      timestamp: event.timestamp.toISOString()
    })
    
    // Simular escrita em arquivo
    console.log(`📝 LOG FILE: ${logLine}`)
  }
  
  // Métodos específicos para diferentes tipos de eventos
  
  // TTS Events
  logTTSStart(jobId: string, config: any): void {
    this.log('info', 'tts_start', `Iniciando TTS para job ${jobId}`, { jobId, config })
    this.updateTTSMetrics('start')
  }
  
  logTTSSuccess(jobId: string, duration: number, provider: string, quality: number): void {
    this.log('info', 'tts_success', `TTS concluído para job ${jobId}`, { 
      jobId, duration, provider, quality 
    })
    this.updateTTSMetrics('success', duration, provider)
  }
  
  logTTSError(jobId: string, error: any, provider: string): void {
    this.log('error', 'tts_error', `Erro no TTS para job ${jobId}`, { 
      jobId, error: error.message, provider, stack: error.stack 
    })
    this.updateTTSMetrics('error', 0, provider)
  }
  
  // Lip-Sync Events
  logLipSyncStart(jobId: string, config: any): void {
    this.log('info', 'lipsync_start', `Iniciando lip-sync para job ${jobId}`, { jobId, config })
    this.updateLipSyncMetrics('start')
  }
  
  logLipSyncSuccess(jobId: string, duration: number, quality: number): void {
    this.log('info', 'lipsync_success', `Lip-sync concluído para job ${jobId}`, { 
      jobId, duration, quality 
    })
    this.updateLipSyncMetrics('success', duration, quality)
  }
  
  logLipSyncError(jobId: string, error: any): void {
    this.log('error', 'lipsync_error', `Erro no lip-sync para job ${jobId}`, { 
      jobId, error: error.message, stack: error.stack 
    })
    this.updateLipSyncMetrics('error')
  }
  
  // Rendering Events
  logRenderStart(jobId: string, config: any): void {
    this.log('info', 'render_start', `Iniciando renderização para job ${jobId}`, { jobId, config })
    this.updateRenderingMetrics('start')
  }
  
  logRenderSuccess(jobId: string, duration: number, fileSize: number, quality: string): void {
    this.log('info', 'render_success', `Renderização concluída para job ${jobId}`, { 
      jobId, duration, fileSize, quality 
    })
    this.updateRenderingMetrics('success', duration, fileSize, quality)
  }
  
  logRenderError(jobId: string, error: any): void {
    this.log('error', 'render_error', `Erro na renderização para job ${jobId}`, { 
      jobId, error: error.message, stack: error.stack 
    })
    this.updateRenderingMetrics('error')
  }
  
  // Pipeline Events
  logPipelineStart(jobId: string, config: any): void {
    this.log('info', 'pipeline_start', `Iniciando pipeline para job ${jobId}`, { jobId, config })
    this.updatePipelineMetrics('start')
  }
  
  logPipelineSuccess(jobId: string, totalDuration: number): void {
    this.log('info', 'pipeline_success', `Pipeline concluído para job ${jobId}`, { 
      jobId, totalDuration 
    })
    this.updatePipelineMetrics('success', totalDuration)
  }
  
  logPipelineError(jobId: string, error: any, stage: string): void {
    this.log('error', 'pipeline_error', `Erro no pipeline para job ${jobId} na etapa ${stage}`, { 
      jobId, error: error.message, stage, stack: error.stack 
    })
    this.updatePipelineMetrics('error')
  }
  
  // Cache Events
  logCacheHit(key: string, type: string): void {
    this.log('debug', 'cache_hit', `Cache hit para ${type}`, { key, type })
    this.updateCacheMetrics('hit')
  }
  
  logCacheMiss(key: string, type: string): void {
    this.log('debug', 'cache_miss', `Cache miss para ${type}`, { key, type })
    this.updateCacheMetrics('miss')
  }
  
  // API Events
  logAPIRequest(method: string, endpoint: string, requestId: string, metadata?: any): void {
    this.log('info', 'api_request', `${method} ${endpoint}`, { 
      method, endpoint, requestId, ...metadata 
    })
  }
  
  logAPIResponse(method: string, endpoint: string, requestId: string, statusCode: number, responseTime: number): void {
    this.log('info', 'api_response', `${method} ${endpoint} - ${statusCode}`, { 
      method, endpoint, requestId, statusCode, responseTime 
    })
  }
  
  logAPIError(method: string, endpoint: string, requestId: string, error: any, statusCode: number): void {
    this.log('error', 'api_error', `${method} ${endpoint} - ${statusCode}`, { 
      method, endpoint, requestId, error: error.message, statusCode, stack: error.stack 
    })
  }
  
  // Atualizar métricas específicas
  private updateTTSMetrics(type: 'start' | 'success' | 'error', duration?: number, provider?: string): void {
    if (!this.currentMetrics.tts) return
    
    switch (type) {
      case 'start':
        this.currentMetrics.tts.totalRequests++
        break
      case 'success':
        this.currentMetrics.tts.successfulRequests++
        if (duration) {
          this.currentMetrics.tts.averageResponseTime = 
            (this.currentMetrics.tts.averageResponseTime * (this.currentMetrics.tts.successfulRequests - 1) + duration) / 
            this.currentMetrics.tts.successfulRequests
        }
        if (provider) {
          this.updateProviderStats(provider, 'success', duration)
        }
        break
      case 'error':
        this.currentMetrics.tts.failedRequests++
        if (provider) {
          this.updateProviderStats(provider, 'error')
        }
        break
    }
  }
  
  private updateProviderStats(provider: string, type: 'success' | 'error', duration?: number): void {
    if (!this.currentMetrics.tts?.providerStats[provider]) {
      this.currentMetrics.tts.providerStats[provider] = {
        requests: 0,
        successes: 0,
        failures: 0,
        avgTime: 0
      }
    }
    
    const stats = this.currentMetrics.tts.providerStats[provider]
    stats.requests++
    
    if (type === 'success') {
      stats.successes++
      if (duration) {
        stats.avgTime = (stats.avgTime * (stats.successes - 1) + duration) / stats.successes
      }
    } else {
      stats.failures++
    }
  }
  
  private updateLipSyncMetrics(type: 'start' | 'success' | 'error', duration?: number, quality?: number): void {
    if (!this.currentMetrics.lipSync) return
    
    switch (type) {
      case 'start':
        this.currentMetrics.lipSync.totalJobs++
        break
      case 'success':
        this.currentMetrics.lipSync.successfulJobs++
        if (duration) {
          this.currentMetrics.lipSync.averageProcessingTime = 
            (this.currentMetrics.lipSync.averageProcessingTime * (this.currentMetrics.lipSync.successfulJobs - 1) + duration) / 
            this.currentMetrics.lipSync.successfulJobs
        }
        if (quality) {
          this.currentMetrics.lipSync.averageQuality = 
            (this.currentMetrics.lipSync.averageQuality * (this.currentMetrics.lipSync.successfulJobs - 1) + quality) / 
            this.currentMetrics.lipSync.successfulJobs
        }
        break
      case 'error':
        this.currentMetrics.lipSync.failedJobs++
        break
    }
  }
  
  private updateRenderingMetrics(type: 'start' | 'success' | 'error', duration?: number, fileSize?: number, quality?: string): void {
    if (!this.currentMetrics.rendering) return
    
    switch (type) {
      case 'start':
        this.currentMetrics.rendering.totalJobs++
        break
      case 'success':
        this.currentMetrics.rendering.successfulJobs++
        if (duration) {
          this.currentMetrics.rendering.averageRenderTime = 
            (this.currentMetrics.rendering.averageRenderTime * (this.currentMetrics.rendering.successfulJobs - 1) + duration) / 
            this.currentMetrics.rendering.successfulJobs
        }
        if (fileSize) {
          this.currentMetrics.rendering.averageFileSize = 
            (this.currentMetrics.rendering.averageFileSize * (this.currentMetrics.rendering.successfulJobs - 1) + fileSize) / 
            this.currentMetrics.rendering.successfulJobs
        }
        if (quality) {
          this.currentMetrics.rendering.qualityDistribution[quality] = 
            (this.currentMetrics.rendering.qualityDistribution[quality] || 0) + 1
        }
        break
      case 'error':
        this.currentMetrics.rendering.failedJobs++
        break
    }
  }
  
  private updatePipelineMetrics(type: 'start' | 'success' | 'error', duration?: number): void {
    if (!this.currentMetrics.pipeline) return
    
    switch (type) {
      case 'start':
        this.currentMetrics.pipeline.totalJobs++
        this.currentMetrics.pipeline.concurrentJobs++
        break
      case 'success':
        this.currentMetrics.pipeline.completedJobs++
        this.currentMetrics.pipeline.concurrentJobs--
        if (duration) {
          this.currentMetrics.pipeline.averageTotalTime = 
            (this.currentMetrics.pipeline.averageTotalTime * (this.currentMetrics.pipeline.completedJobs - 1) + duration) / 
            this.currentMetrics.pipeline.completedJobs
        }
        break
      case 'error':
        this.currentMetrics.pipeline.failedJobs++
        this.currentMetrics.pipeline.concurrentJobs--
        break
    }
  }
  
  private updateCacheMetrics(type: 'hit' | 'miss'): void {
    if (!this.currentMetrics.cache) return
    
    if (type === 'hit') {
      this.currentMetrics.cache.hits++
    } else {
      this.currentMetrics.cache.misses++
    }
    
    const total = this.currentMetrics.cache.hits + this.currentMetrics.cache.misses
    this.currentMetrics.cache.hitRate = total > 0 ? (this.currentMetrics.cache.hits / total) * 100 : 0
  }
  
  // Métodos de consulta
  
  // Obter logs recentes
  getRecentLogs(limit: number = 100, level?: LogLevel, type?: EventType): LogEvent[] {
    let filteredLogs = this.logs
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }
    
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type)
    }
    
    return filteredLogs.slice(-limit).reverse()
  }
  
  // Obter métricas atuais
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.currentMetrics as PerformanceMetrics
  }
  
  // Obter histórico de métricas
  getMetricsHistory(hours: number = 24): PerformanceMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.metrics.filter(m => m.timestamp >= cutoff)
  }
  
  // Obter alertas ativos
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }
  
  // Obter todos os alertas
  getAllAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit).reverse()
  }
  
  // Resolver alerta
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      this.log('info', 'system_info', `Alerta resolvido: ${alert.title}`, { alertId })
      return true
    }
    return false
  }
  
  // Gerar relatório de saúde do sistema
  getHealthReport(): any {
    const metrics = this.getCurrentMetrics()
    const activeAlerts = this.getActiveAlerts()
    const recentErrors = this.getRecentLogs(50, 'error')
    
    return {
      timestamp: new Date(),
      status: this.calculateOverallHealth(),
      metrics,
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.level === 'critical').length,
        warnings: activeAlerts.filter(a => a.level === 'warning').length
      },
      errors: {
        recent: recentErrors.length,
        lastError: recentErrors[0]?.timestamp || null
      },
      uptime: process.uptime(),
      version: '2.0'
    }
  }
  
  // Calcular saúde geral do sistema
  private calculateOverallHealth(): 'healthy' | 'warning' | 'critical' {
    const activeAlerts = this.getActiveAlerts()
    const criticalAlerts = activeAlerts.filter(a => a.level === 'critical')
    const warningAlerts = activeAlerts.filter(a => a.level === 'warning')
    
    if (criticalAlerts.length > 0) return 'critical'
    if (warningAlerts.length > 3) return 'warning'
    
    const metrics = this.getCurrentMetrics()
    if (metrics?.system) {
      if (metrics.system.memoryUsage > 90 || metrics.system.cpuUsage > 90) return 'critical'
      if (metrics.system.memoryUsage > 70 || metrics.system.cpuUsage > 70) return 'warning'
    }
    
    return 'healthy'
  }
  
  // Gerar ID único
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Limpar dados antigos
  cleanup(): void {
    const cutoff = new Date(Date.now() - this.config.logRetentionDays * 24 * 60 * 60 * 1000)
    
    // Limpar logs antigos
    this.logs = this.logs.filter(log => log.timestamp >= cutoff)
    
    // Limpar alertas resolvidos antigos
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || (alert.resolvedAt && alert.resolvedAt >= cutoff)
    )
    
    this.log('info', 'system_info', 'Limpeza de dados antigos concluída')
  }
  
  // Parar monitoramento
  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = undefined
    }
    
    this.log('info', 'system_info', 'Serviço de monitoramento parado')
  }
  
  // Atualizar configuração
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.log('info', 'system_info', 'Configuração de monitoramento atualizada', { newConfig })
  }
}

export default MonitoringService