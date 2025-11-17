/**
 * 🔍 APM (Application Performance Monitoring) Configuration
 * FASE 5: Monitoramento Avançado de Performance
 */

import { NextRequest } from 'next/server';

// Interfaces para métricas
export interface PerformanceMetrics {
  timestamp: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

export interface ErrorMetrics {
  timestamp: number;
  error: string;
  stack?: string;
  endpoint: string;
  method: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface BusinessMetrics {
  timestamp: number;
  event: string;
  userId?: string;
  projectId?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

// Configuração do APM
export class APMConfig {
  private static instance: APMConfig;
  private metrics: PerformanceMetrics[] = [];
  private errors: ErrorMetrics[] = [];
  private businessEvents: BusinessMetrics[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'production';

  static getInstance(): APMConfig {
    if (!APMConfig.instance) {
      APMConfig.instance = new APMConfig();
    }
    return APMConfig.instance;
  }

  // Configurar alertas
  private alertThresholds = {
    responseTime: 2000, // ms
    errorRate: 0.05, // 5%
    memoryUsage: 0.8, // 80%
    cpuUsage: 0.8, // 80%
  };

  // Capturar métricas de performance
  capturePerformance(req: NextRequest, responseTime: number, statusCode: number): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      endpoint: req.nextUrl.pathname,
      method: req.method,
      statusCode,
      responseTime,
      memoryUsage: process.memoryUsage(),
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.ip || req.headers.get('x-forwarded-for') || undefined,
    };

    this.metrics.push(metric);
    this.checkAlerts(metric);
    this.cleanupOldMetrics();
  }

  // Capturar erros
  captureError(error: Error, req?: NextRequest, severity: ErrorMetrics['severity'] = 'medium'): void {
    if (!this.isEnabled) return;

    const errorMetric: ErrorMetrics = {
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      endpoint: req?.nextUrl.pathname || 'unknown',
      method: req?.method || 'unknown',
      severity,
    };

    this.errors.push(errorMetric);
    this.sendAlert(errorMetric);
    this.cleanupOldErrors();
  }

  // Capturar eventos de negócio
  captureBusinessEvent(event: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const businessMetric: BusinessMetrics = {
      timestamp: Date.now(),
      event,
      metadata,
    };

    this.businessEvents.push(businessMetric);
  }

  // Verificar alertas de performance
  private checkAlerts(metric: PerformanceMetrics): void {
    // Alerta de tempo de resposta
    if (metric.responseTime > this.alertThresholds.responseTime) {
      this.sendAlert({
        type: 'performance',
        message: `Slow response time: ${metric.responseTime}ms on ${metric.endpoint}`,
        severity: 'medium',
        metric,
      });
    }

    // Alerta de uso de memória
    const memoryUsagePercent = metric.memoryUsage.heapUsed / metric.memoryUsage.heapTotal;
    if (memoryUsagePercent > this.alertThresholds.memoryUsage) {
      this.sendAlert({
        type: 'memory',
        message: `High memory usage: ${(memoryUsagePercent * 100).toFixed(2)}%`,
        severity: 'high',
        metric,
      });
    }
  }

  // Enviar alertas
  private async sendAlert(alert: any): Promise<void> {
    try {
      // Integração com Slack, Discord, ou email
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Alert: ${alert.message}`,
            attachments: [{
              color: alert.severity === 'critical' ? 'danger' : 'warning',
              fields: [
                { title: 'Type', value: alert.type, short: true },
                { title: 'Severity', value: alert.severity, short: true },
                { title: 'Timestamp', value: new Date().toISOString(), short: true },
              ],
            }],
          }),
        });
      }

      // Log para console em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚨 APM Alert:', alert);
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  // Obter estatísticas
  getStats(): {
    performance: any;
    errors: any;
    business: any;
  } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < oneHour);
    const recentErrors = this.errors.filter(e => now - e.timestamp < oneHour);

    return {
      performance: {
        totalRequests: recentMetrics.length,
        averageResponseTime: recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length || 0,
        errorRate: recentErrors.length / recentMetrics.length || 0,
        slowestEndpoints: this.getSlowestEndpoints(recentMetrics),
        statusCodes: this.getStatusCodeDistribution(recentMetrics),
      },
      errors: {
        total: recentErrors.length,
        bySeverity: this.getErrorsBySeverity(recentErrors),
        byEndpoint: this.getErrorsByEndpoint(recentErrors),
      },
      business: {
        events: this.businessEvents.filter(e => now - e.timestamp < oneHour),
      },
    };
  }

  // Helpers para estatísticas
  private getSlowestEndpoints(metrics: PerformanceMetrics[]): Array<{ endpoint: string; avgTime: number }> {
    const endpointTimes: Record<string, number[]> = {};
    
    metrics.forEach(m => {
      if (!endpointTimes[m.endpoint]) {
        endpointTimes[m.endpoint] = [];
      }
      endpointTimes[m.endpoint].push(m.responseTime);
    });

    return Object.entries(endpointTimes)
      .map(([endpoint, times]) => ({
        endpoint,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
  }

  private getStatusCodeDistribution(metrics: PerformanceMetrics[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    metrics.forEach(m => {
      const code = m.statusCode.toString();
      distribution[code] = (distribution[code] || 0) + 1;
    });
    return distribution;
  }

  private getErrorsBySeverity(errors: ErrorMetrics[]): Record<string, number> {
    const bySeverity: Record<string, number> = {};
    errors.forEach(e => {
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    });
    return bySeverity;
  }

  private getErrorsByEndpoint(errors: ErrorMetrics[]): Record<string, number> {
    const byEndpoint: Record<string, number> = {};
    errors.forEach(e => {
      byEndpoint[e.endpoint] = (byEndpoint[e.endpoint] || 0) + 1;
    });
    return byEndpoint;
  }

  // Limpeza de dados antigos
  private cleanupOldMetrics(): void {
    const oneDay = 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - oneDay;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  private cleanupOldErrors(): void {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - oneWeek;
    this.errors = this.errors.filter(e => e.timestamp > cutoff);
  }

  // Middleware para Next.js
  static middleware() {
    return async (req: NextRequest) => {
      const start = Date.now();
      const apm = APMConfig.getInstance();

      try {
        // Continuar com a requisição
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });

        const responseTime = Date.now() - start;
        apm.capturePerformance(req, responseTime, response.status);

        return response;
      } catch (error) {
        const responseTime = Date.now() - start;
        apm.captureError(error as Error, req, 'high');
        apm.capturePerformance(req, responseTime, 500);
        throw error;
      }
    };
  }
}

// Exportar instância singleton
export const apm = APMConfig.getInstance();

// Configuração de logging centralizado
export class CentralizedLogger {
  private static instance: CentralizedLogger;
  
  static getInstance(): CentralizedLogger {
    if (!CentralizedLogger.instance) {
      CentralizedLogger.instance = new CentralizedLogger();
    }
    return CentralizedLogger.instance;
  }

  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      service: 'estudio-ia-videos',
      environment: process.env.NODE_ENV,
    };

    // Console log
    console[level](JSON.stringify(logEntry));

    // Enviar para serviço de logging (ex: Datadog, LogRocket, etc.)
    if (process.env.LOGGING_ENDPOINT) {
      this.sendToLoggingService(logEntry);
    }
  }

  private async sendToLoggingService(logEntry: any): Promise<void> {
    try {
      await fetch(process.env.LOGGING_ENDPOINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to send log to service:', error);
    }
  }
}

export const logger = CentralizedLogger.getInstance();