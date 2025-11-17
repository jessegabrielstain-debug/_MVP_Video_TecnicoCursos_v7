/**
 * Sistema de Monitoring e Health Checks Real-time
 * 
 * Features:
 * - Health checks completos (DB, Redis, S3, Workers)
 * - Métricas de performance (CPU, memória, latência)
 * - Alertas automáticos
 * - Dashboard de status
 * - Logs estruturados
 * 
 * @module MonitoringSystem
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    s3: HealthCheck;
    workers: HealthCheck;
    api: HealthCheck;
  };
  metrics: SystemMetrics;
  uptime: number;
}

export interface HealthCheck {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  message?: string;
  lastCheck: Date;
  errorCount?: number;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    total: number;
    perMinute: number;
    avgResponseTime: number;
    errorRate: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
  };
}

export interface MetricPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MONITORING SYSTEM CLASS
// ============================================================================

export class MonitoringSystem {
  private static instance: MonitoringSystem;
  private prisma: PrismaClient;
  private redis: Redis;
  private s3: S3Client;
  private startTime: Date;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private alerts: Alert[] = [];
  
  // Métricas em memória
  private requestMetrics: {
    total: number;
    errors: number;
    responseTimes: number[];
    lastMinute: number[];
  } = {
    total: 0,
    errors: 0,
    responseTimes: [],
    lastMinute: []
  };

  private cacheMetrics: {
    hits: number;
    misses: number;
    evictions: number;
  } = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  private constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
    
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.startTime = new Date();
    this.setupListeners();
  }

  public static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  /**
   * Executa health check completo de todos os serviços
   */
  public async getHealthStatus(): Promise<HealthStatus> {
    const [database, redis, s3, workers, api] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkS3(),
      this.checkWorkers(),
      this.checkAPI()
    ]);

    const checks = { database, redis, s3, workers, api };
    const overallStatus = this.determineOverallStatus(checks);
    const metrics = await this.collectMetrics();

    return {
      status: overallStatus,
      timestamp: new Date(),
      checks,
      metrics,
      uptime: Date.now() - this.startTime.getTime()
    };
  }

  /**
   * Check de saúde do database
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        message: 'Database connection healthy'
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
        errorCount: 1
      };
    }
  }

  /**
   * Check de saúde do Redis
   */
  private async checkRedis(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await this.redis.ping();
      
      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        message: 'Redis connection healthy'
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
        errorCount: 1
      };
    }
  }

  /**
   * Check de saúde do S3
   */
  private async checkS3(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const bucket = process.env.AWS_S3_BUCKET || 'default-bucket';
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
      
      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        message: 'S3 bucket accessible'
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
        errorCount: 1
      };
    }
  }

  /**
   * Check de saúde dos workers
   */
  private async checkWorkers(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Verifica jobs na fila
      const activeJobs = await this.redis.llen('bull:render-queue:active');
      const waitingJobs = await this.redis.llen('bull:render-queue:waiting');
      const failedJobs = await this.redis.llen('bull:render-queue:failed');

      const status = failedJobs > 10 ? 'degraded' : 'up';
      
      return {
        status,
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        message: `Active: ${activeJobs}, Waiting: ${waitingJobs}, Failed: ${failedJobs}`
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
        errorCount: 1
      };
    }
  }

  /**
   * Check de saúde da API
   */
  private async checkAPI(): Promise<HealthCheck> {
    const start = Date.now();
    const avgResponseTime = this.getAverageResponseTime();
    
    const status = avgResponseTime > 5000 ? 'degraded' : 'up';
    
    return {
      status,
      responseTime: Date.now() - start,
      lastCheck: new Date(),
      message: `Avg response time: ${avgResponseTime.toFixed(0)}ms`
    };
  }

  /**
   * Determina o status geral do sistema
   */
  private determineOverallStatus(
    checks: Record<string, HealthCheck>
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks).map(c => c.status);
    
    if (statuses.every(s => s === 'up')) return 'healthy';
    if (statuses.some(s => s === 'down')) return 'unhealthy';
    return 'degraded';
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  /**
   * Coleta todas as métricas do sistema
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    const [cpu, memory, database, cache] = await Promise.all([
      this.getCPUMetrics(),
      this.getMemoryMetrics(),
      this.getDatabaseMetrics(),
      this.getCacheMetrics()
    ]);

    const requests = this.getRequestMetrics();

    return {
      cpu,
      memory,
      requests,
      database,
      cache
    };
  }

  /**
   * Métricas de CPU
   */
  private async getCPUMetrics() {
    const os = await import('os');
    const cpus = os.cpus();
    const load = os.loadavg();
    
    // Calcula uso médio da CPU
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce((acc, cpu) => {
      return acc + Object.values(cpu.times).reduce((a, b) => a + b, 0);
    }, 0);
    
    const usage = 100 - (totalIdle / totalTick) * 100;

    return {
      usage,
      load
    };
  }

  /**
   * Métricas de memória
   */
  private async getMemoryMetrics() {
    const os = await import('os');
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = (used / total) * 100;

    return {
      used,
      total,
      percentage
    };
  }

  /**
   * Métricas de requisições
   */
  private getRequestMetrics() {
    const avgResponseTime = this.getAverageResponseTime();
    const errorRate = this.requestMetrics.total > 0
      ? (this.requestMetrics.errors / this.requestMetrics.total) * 100
      : 0;

    return {
      total: this.requestMetrics.total,
      perMinute: this.requestMetrics.lastMinute.length,
      avgResponseTime,
      errorRate
    };
  }

  /**
   * Métricas do database
   */
  private async getDatabaseMetrics() {
    try {
      // Query para obter estatísticas de conexões do PostgreSQL
      const stats = await this.prisma.$queryRaw<any[]>`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_queries
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      // Detectar slow queries usando pg_stat_statements
      const slowQueries = await this.detectSlowQueries();

      return {
        connections: stats[0]?.total_connections || 0,
        activeQueries: stats[0]?.active_queries || 0,
        slowQueries
      };
    } catch (error) {
      return {
        connections: 0,
        activeQueries: 0,
        slowQueries: 0
      };
    }
  }

  /**
   * Detecta queries lentas no PostgreSQL
   */
  private async detectSlowQueries(): Promise<number> {
    try {
      // Verificar se pg_stat_statements está habilitado
      const extensionCheck = await prisma.$queryRaw<any[]>`
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
      `;

      if (extensionCheck.length === 0) {
        // Tentar habilitar a extensão (requer privilégios de superusuário)
        try {
          await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`;
          console.log('[MonitoringSystem] ✅ Extensão pg_stat_statements habilitada');
        } catch (error) {
          console.warn('[MonitoringSystem] ⚠️ Não foi possível habilitar pg_stat_statements');
          return 0;
        }
      }

      // Buscar queries com tempo médio > 1000ms (1 segundo)
      const slowQueries = await prisma.$queryRaw<any[]>`
        SELECT 
          queryid,
          query,
          calls,
          mean_exec_time,
          max_exec_time,
          total_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `;

      // Armazenar queries lentas no Redis para análise
      if (slowQueries.length > 0) {
        const cacheKey = 'monitoring:slow_queries';
        const queriesData = slowQueries.map(q => ({
          queryId: q.queryid?.toString(),
          query: q.query?.substring(0, 200), // Limitar tamanho
          calls: q.calls,
          avgTime: Math.round(q.mean_exec_time),
          maxTime: Math.round(q.max_exec_time),
          totalTime: Math.round(q.total_exec_time),
          timestamp: new Date().toISOString(),
        }));

        await redis.setex(cacheKey, 3600, JSON.stringify(queriesData)); // Cache de 1 hora

        // Registrar alerta se houver muitas queries lentas
        if (slowQueries.length >= 5) {
          console.warn(`[MonitoringSystem] ⚠️ Detectadas ${slowQueries.length} queries lentas`);
          
          // Emitir alerta crítico
          this.emit('alert', {
            type: 'database',
            severity: 'warning',
            message: `${slowQueries.length} queries lentas detectadas (>1s)`,
            details: queriesData.slice(0, 3), // Top 3
            timestamp: new Date(),
          });
        }
      }

      return slowQueries.length;
    } catch (error) {
      console.error('[MonitoringSystem] Erro ao detectar slow queries:', error);
      return 0;
    }
  }

  /**
   * Métricas do cache
   */
  private async getCacheMetrics() {
    const total = this.cacheMetrics.hits + this.cacheMetrics.misses;
    const hitRate = total > 0 ? (this.cacheMetrics.hits / total) * 100 : 0;
    const missRate = total > 0 ? (this.cacheMetrics.misses / total) * 100 : 0;

    return {
      hitRate,
      missRate,
      evictions: this.cacheMetrics.evictions
    };
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Registra uma requisição HTTP
   */
  public trackRequest(responseTime: number, isError: boolean = false) {
    this.requestMetrics.total++;
    this.requestMetrics.responseTimes.push(responseTime);
    
    if (isError) {
      this.requestMetrics.errors++;
    }

    // Mantém apenas as últimas 1000 requisições
    if (this.requestMetrics.responseTimes.length > 1000) {
      this.requestMetrics.responseTimes.shift();
    }

    // Registra para cálculo de req/min
    const now = Date.now();
    this.requestMetrics.lastMinute.push(now);
    
    // Remove requisições com mais de 1 minuto
    this.requestMetrics.lastMinute = this.requestMetrics.lastMinute.filter(
      time => now - time < 60000
    );
  }

  /**
   * Registra um hit de cache
   */
  public trackCacheHit() {
    this.cacheMetrics.hits++;
  }

  /**
   * Registra um miss de cache
   */
  public trackCacheMiss() {
    this.cacheMetrics.misses++;
  }

  /**
   * Registra uma eviction de cache
   */
  public trackCacheEviction() {
    this.cacheMetrics.evictions++;
  }

  // ============================================================================
  // ALERTS
  // ============================================================================

  /**
   * Cria um novo alerta
   */
  public createAlert(
    severity: 'info' | 'warning' | 'critical',
    message: string,
    metadata?: Record<string, unknown>
  ): Alert {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };

    this.alerts.push(alert);

    // Mantém apenas os últimos 1000 alertas
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }

    // Log do alerta
    console.log(`[ALERT ${severity.toUpperCase()}] ${message}`, metadata);

    return alert;
  }

  /**
   * Resolve um alerta
   */
  public resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Obtém alertas ativos
   */
  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Obtém todos os alertas
   */
  public getAllAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }

  // ============================================================================
  // AUTO-MONITORING
  // ============================================================================

  /**
   * Inicia monitoramento automático
   */
  public startAutoMonitoring(intervalMs: number = 30000) {
    // Health checks a cada intervalo
    this.healthCheckInterval = setInterval(async () => {
      const status = await this.getHealthStatus();
      
      // Cria alertas baseado no status
      if (status.status === 'unhealthy') {
        this.createAlert(
          'critical',
          'System is unhealthy',
          { checks: status.checks }
        );
      } else if (status.status === 'degraded') {
        this.createAlert(
          'warning',
          'System is degraded',
          { checks: status.checks }
        );
      }

      // Alertas de métricas
      if (status.metrics.cpu.usage > 90) {
        this.createAlert('critical', `CPU usage at ${status.metrics.cpu.usage.toFixed(1)}%`);
      }

      if (status.metrics.memory.percentage > 90) {
        this.createAlert('critical', `Memory usage at ${status.metrics.memory.percentage.toFixed(1)}%`);
      }

      if (status.metrics.requests.errorRate > 10) {
        this.createAlert('warning', `Error rate at ${status.metrics.requests.errorRate.toFixed(1)}%`);
      }

      // Persiste métricas no Redis para histórico
      await this.persistMetrics(status);
    }, intervalMs);

    // Limpeza de métricas antigas a cada hora
    this.metricsInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
  }

  /**
   * Para monitoramento automático
   */
  public stopAutoMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }

  /**
   * Persiste métricas no Redis
   */
  private async persistMetrics(status: HealthStatus) {
    try {
      const key = `metrics:${new Date().toISOString().split('T')[0]}`;
      const entry = {
        timestamp: status.timestamp.toISOString(),
        status: status.status,
        metrics: status.metrics
      };

      await this.redis.lpush(key, JSON.stringify(entry));
      await this.redis.ltrim(key, 0, 2879); // Mantém 48h de métricas (a cada 1 min)
      await this.redis.expire(key, 172800); // Expira em 48h
    } catch (error) {
      console.error('Failed to persist metrics:', error);
    }
  }

  /**
   * Limpa métricas antigas da memória
   */
  private cleanupOldMetrics() {
    const oneHourAgo = Date.now() - 3600000;
    
    // Limpa response times antigos
    this.requestMetrics.responseTimes = this.requestMetrics.responseTimes.slice(-1000);
    
    // Limpa alertas resolvidos antigos
    this.alerts = this.alerts.filter(a => 
      !a.resolved || (a.resolvedAt && a.resolvedAt.getTime() > oneHourAgo)
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Calcula tempo médio de resposta
   */
  private getAverageResponseTime(): number {
    if (this.requestMetrics.responseTimes.length === 0) return 0;
    
    const sum = this.requestMetrics.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.requestMetrics.responseTimes.length;
  }

  /**
   * Setup de listeners para eventos
   */
  private setupListeners() {
    // Listener para erros do Redis
    this.redis.on('error', (error) => {
      this.createAlert('critical', 'Redis connection error', { error: error.message });
    });

    // Listener para reconnect do Redis
    this.redis.on('reconnecting', () => {
      this.createAlert('warning', 'Redis reconnecting');
    });
  }

  /**
   * Cleanup ao encerrar
   */
  public async cleanup() {
    this.stopAutoMonitoring();
    await this.prisma.$disconnect();
    await this.redis.quit();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const monitoringSystem = MonitoringSystem.getInstance();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Middleware para tracking de requisições
 */
export function trackingMiddleware() {
  return async (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - start;
      const isError = res.statusCode >= 400;
      
      monitoringSystem.trackRequest(responseTime, isError);
    });

    next();
  };
}

/**
 * Obtém status resumido do sistema
 */
export async function getSystemStatus() {
  return await monitoringSystem.getHealthStatus();
}

/**
 * Obtém métricas em tempo real
 */
export async function getRealTimeMetrics() {
  const status = await monitoringSystem.getHealthStatus();
  return status.metrics;
}
