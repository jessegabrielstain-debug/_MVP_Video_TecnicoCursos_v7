
/**
 * 🔍 Sistema de Logging Production-Ready
 * Logging estruturado com Winston para produção
 */

import winston from 'winston'
import path from 'path'

// Configurar transports baseado no ambiente
const transports: winston.transport[] = []

// Console transport para desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
        })
      )
    })
  )
}

// File transports para produção
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || './logs'
  
  // Error log
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  )
  
  // Combined log
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  )
  
  // Console em produção (estruturado)
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  )
}

// Criar logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'estudio-ia-videos',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports,
  // Não sair em caso de erro
  exitOnError: false
})

// Sistema de métricas em tempo real
class MetricsCollector {
  private static instance: MetricsCollector
  private metrics: Map<string, any> = new Map()
  
  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }
  
  // Incrementar contador
  increment(metric: string, value: number = 1, tags?: Record<string, string>) {
    const key = `${metric}:counter`
    const current = this.metrics.get(key) || 0
    this.metrics.set(key, current + value)
    
    logger.info('Metric incremented', {
      metric,
      value,
      newTotal: current + value,
      tags
    })
  }
  
  // Set gauge (valor atual)
  gauge(metric: string, value: number, tags?: Record<string, string>) {
    const key = `${metric}:gauge`
    this.metrics.set(key, value)
    
    logger.info('Gauge updated', {
      metric,
      value,
      tags
    })
  }
  
  // Timing (duração de operações)
  timing(metric: string, duration: number, tags?: Record<string, string>) {
    const key = `${metric}:timing`
    const current = this.metrics.get(key) || []
    current.push({ timestamp: new Date().toISOString(), duration })
    
    // Manter apenas últimas 100 medições
    if (current.length > 100) {
      current.shift()
    }
    
    this.metrics.set(key, current)
    
    logger.info('Timing recorded', {
      metric,
      duration,
      tags
    })
  }
  
  // Obter todas as métricas
  getAllMetrics() {
    const result: Record<string, unknown> = {}
    
    for (const [key, value] of this.metrics.entries()) {
      const [metric, type] = key.split(':')
      
      if (!result[metric]) {
        result[metric] = {}
      }
      
      if (type === 'timing' && Array.isArray(value)) {
        result[metric][type] = {
          count: value.length,
          avg: value.reduce((sum, item) => sum + item.duration, 0) / value.length,
          min: Math.min(...value.map(item => item.duration)),
          max: Math.max(...value.map(item => item.duration)),
          recent: value.slice(-10)
        }
      } else {
        result[metric][type] = value
      }
    }
    
    return result
  }
}

// Middleware de logging para Next.js
export function createLoggerMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now()
    const requestId = Math.random().toString(36).substring(2, 15)
    
    // Adicionar requestId ao request
    req.requestId = requestId
    
    // Log da requisição
    logger.info('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    })
    
    // Override do res.end para capturar resposta
    const originalEnd = res.end
    res.end = function(chunk: any, encoding: any) {
      const duration = Date.now() - start
      const statusCode = res.statusCode
      
      logger.info('Request completed', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode,
        duration,
        timestamp: new Date().toISOString()
      })
      
      // Coletar métricas
      const metrics = MetricsCollector.getInstance()
      metrics.increment('http_requests_total', 1, {
        method: req.method,
        status: statusCode.toString()
      })
      metrics.timing('http_request_duration', duration, {
        method: req.method,
        status: statusCode.toString()
      })
      
      // Chamar método original
      originalEnd.call(res, chunk, encoding)
    }
    
    if (next) next()
  }
}

// Sistema de alertas
class AlertSystem {
  private static instance: AlertSystem
  private alerts: Array<{
    id: string
    level: 'info' | 'warning' | 'error' | 'critical'
    message: string
    timestamp: Date
    resolved: boolean
  }> = []
  
  static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem()
    }
    return AlertSystem.instance
  }
  
  // Criar alerta
  alert(level: 'info' | 'warning' | 'error' | 'critical', message: string, metadata?: any) {
    const alert = {
      id: Math.random().toString(36).substring(2, 15),
      level,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    }
    
    this.alerts.push(alert)
    
    // Log do alerta
    logger[level === 'critical' ? 'error' : level]('Alert created', alert)
    
    // Enviar notificação se crítico
    if (level === 'critical') {
      this.sendCriticalNotification(alert)
    }
    
    // Limpar alertas antigos (manter últimos 1000)
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000)
    }
    
    return alert.id
  }
  
  // Resolver alerta
  resolve(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      logger.info('Alert resolved', { alertId, message: alert.message })
    }
  }
  
  // Obter alertas ativos
  getActiveAlerts() {
    return this.alerts.filter(a => !a.resolved)
  }
  
  // Obter todos os alertas
  getAllAlerts() {
    return this.alerts
  }
  
  // Enviar notificação crítica
  private async sendCriticalNotification(alert: any) {
    try {
      // Implementar webhook ou email aqui
      logger.error('CRITICAL ALERT', alert)
      
      // Exemplo de webhook (comentado)
      /*
      if (process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      }
      */
    } catch (error) {
      logger.error('Failed to send critical notification', error)
    }
  }
}

// Exportar instâncias
export const productionLogger = logger
export const metricsCollector = MetricsCollector.getInstance()
export const alertSystem = AlertSystem.getInstance()

// Função para log estruturado
export function logEvent(
  level: 'debug' | 'info' | 'warn' | 'error',
  event: string,
  data?: any,
  requestId?: string
) {
  logger[level](event, {
    ...data,
    requestId,
    timestamp: new Date().toISOString()
  })
}

// Monitor de performance
export function performanceMonitor<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: any[]) => {
    const start = Date.now()
    const requestId = (args[0] as any)?.requestId
    
    try {
      logEvent('debug', `${operationName} started`, { args: args.length }, requestId)
      
      const result = fn(...args)
      
      // Se for Promise
      if (result && typeof result.then === 'function') {
        return result
          .then((data: any) => {
            const duration = Date.now() - start
            logEvent('info', `${operationName} completed`, { duration, success: true }, requestId)
            metricsCollector.timing(operationName, duration)
            return data
          })
          .catch((error: any) => {
            const duration = Date.now() - start
            logEvent('error', `${operationName} failed`, { duration, error: error.message }, requestId)
            metricsCollector.increment(`${operationName}_errors`)
            throw error
          })
      }
      
      // Se for síncrono
      const duration = Date.now() - start
      logEvent('info', `${operationName} completed`, { duration, success: true }, requestId)
      metricsCollector.timing(operationName, duration)
      return result
      
    } catch (error: any) {
      const duration = Date.now() - start
      logEvent('error', `${operationName} failed`, { duration, error: error.message }, requestId)
      metricsCollector.increment(`${operationName}_errors`)
      throw error
    }
  }) as T
}

// Sistema de Health Check
export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map()
  
  // Registrar health check
  register(name: string, check: () => Promise<boolean>) {
    this.checks.set(name, check)
  }
  
  // Executar todos os checks
  async runAll(): Promise<{
    healthy: boolean
    checks: Record<string, { healthy: boolean; error?: string; duration: number }>
  }> {
    const results: Record<string, { healthy: boolean; error?: string; duration: number }> = {}
    let overallHealthy = true
    
    for (const [name, check] of this.checks.entries()) {
      const start = Date.now()
      try {
        const healthy = await Promise.race([
          check(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ])
        
        results[name] = {
          healthy,
          duration: Date.now() - start
        }
        
        if (!healthy) overallHealthy = false
        
      } catch (error: any) {
        results[name] = {
          healthy: false,
          error: error.message,
          duration: Date.now() - start
        }
        overallHealthy = false
      }
    }
    
    return {
      healthy: overallHealthy,
      checks: results
    }
  }
}

export const healthChecker = new HealthChecker()

// Registrar health checks básicos
healthChecker.register('database', async () => {
  // Implementar check de database
  return true
})

healthChecker.register('memory', async () => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024
  return used < 1024 // < 1GB
})

healthChecker.register('disk', async () => {
  // Implementar check de disk space
  return true
})

export default productionLogger
