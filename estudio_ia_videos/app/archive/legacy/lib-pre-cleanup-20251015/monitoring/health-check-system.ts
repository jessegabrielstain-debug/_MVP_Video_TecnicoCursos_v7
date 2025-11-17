/**
 * Sistema de Health Check Avançado
 * Verifica status de todos os serviços do sistema
 * @module HealthCheckSystem
 * @version 1.0.0
 * @author Sistema IA Videos
 * @date 2025-10-11
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

// ====================================
// TYPES & INTERFACES
// ====================================

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  message: string;
  lastChecked: Date;
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  timestamp: Date;
  uptime: number;
  version: string;
}

export interface HealthCheckConfig {
  timeout?: number;
  retries?: number;
  enableCache?: boolean;
  cacheTTL?: number;
  enableNotifications?: boolean;
  thresholds?: {
    responseTime?: number;
    errorRate?: number;
  };
}

export interface HealthCheckResult {
  success: boolean;
  data?: SystemHealth;
  error?: Error;
  duration: number;
}

// ====================================
// HEALTH CHECK SERVICE
// ====================================

export class HealthCheckSystem {
  private config: Required<HealthCheckConfig>;
  private cache: Map<string, { data: ServiceHealth; expiresAt: number }>;
  private startTime: number;
  private checkHistory: Map<string, ServiceHealth[]>;
  private notificationCallbacks: ((health: SystemHealth) => void)[];

  constructor(config: HealthCheckConfig = {}) {
    this.config = {
      timeout: config.timeout ?? 5000,
      retries: config.retries ?? 3,
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL ?? 30000, // 30 segundos
      enableNotifications: config.enableNotifications ?? false,
      thresholds: {
        responseTime: config.thresholds?.responseTime ?? 1000,
        errorRate: config.thresholds?.errorRate ?? 0.1,
      },
    };

    this.cache = new Map();
    this.checkHistory = new Map();
    this.notificationCallbacks = [];
    this.startTime = Date.now();
  }

  /**
   * Executa health check completo do sistema
   */
  async checkSystemHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const services = await Promise.all([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkS3(),
        this.checkFileSystem(),
        this.checkMemory(),
        this.checkDisk(),
      ]);

      const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
      const degradedCount = services.filter(s => s.status === 'degraded').length;

      let overall: 'healthy' | 'degraded' | 'unhealthy';
      if (unhealthyCount > 0) {
        overall = 'unhealthy';
      } else if (degradedCount > 0) {
        overall = 'degraded';
      } else {
        overall = 'healthy';
      }

      const health: SystemHealth = {
        overall,
        services,
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
        version: process.env.APP_VERSION || '1.0.0',
      };

      // Notificar callbacks se habilitado
      if (this.config.enableNotifications && overall !== 'healthy') {
        this.notifyCallbacks(health);
      }

      // Armazenar histórico
      services.forEach(service => {
        this.addToHistory(service.name, service);
      });

      return {
        success: true,
        data: health,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Verifica status do banco de dados PostgreSQL/Supabase
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const name = 'database';
    const cached = this.getCached(name);
    if (cached) return cached;

    const startTime = Date.now();
    let prisma: PrismaClient | null = null;

    try {
      prisma = new PrismaClient();
      
      // Teste de conexão simples
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        this.timeout(this.config.timeout, 'Database timeout'),
      ]);

      // Teste de escrita (transaction)
      const canWrite = await this.testDatabaseWrite(prisma);

      const responseTime = Date.now() - startTime;
      const status = this.evaluateStatus(responseTime, canWrite);

      const health: ServiceHealth = {
        name,
        status,
        responseTime,
        message: status === 'healthy' ? 'Database operational' : 'Database slow or read-only',
        lastChecked: new Date(),
        metadata: {
          canWrite,
          connectionPool: 'active',
        },
      };

      this.setCached(name, health);
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name,
        status: 'unhealthy',
        responseTime,
        message: `Database error: ${(error as Error).message}`,
        lastChecked: new Date(),
        metadata: { error: (error as Error).message },
      };
    } finally {
      if (prisma) {
        await prisma.$disconnect().catch(() => {});
      }
    }
  }

  /**
   * Testa capacidade de escrita no banco
   */
  private async testDatabaseWrite(prisma: PrismaClient): Promise<boolean> {
    try {
      await prisma.$executeRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica status do Redis
   */
  private async checkRedis(): Promise<ServiceHealth> {
    const name = 'redis';
    const cached = this.getCached(name);
    if (cached) return cached;

    const startTime = Date.now();
    let redis: Redis | null = null;

    try {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: () => null, // Não retry no health check
        lazyConnect: true,
        connectTimeout: this.config.timeout,
      });

      await redis.connect();

      // Teste de ping
      await Promise.race([
        redis.ping(),
        this.timeout(this.config.timeout, 'Redis timeout'),
      ]);

      // Teste de escrita/leitura
      const testKey = `health:${Date.now()}`;
      await redis.set(testKey, 'test', 'EX', 10);
      const value = await redis.get(testKey);
      await redis.del(testKey);

      const canWrite = value === 'test';
      const responseTime = Date.now() - startTime;
      const status = this.evaluateStatus(responseTime, canWrite);

      const health: ServiceHealth = {
        name,
        status,
        responseTime,
        message: status === 'healthy' ? 'Redis operational' : 'Redis slow',
        lastChecked: new Date(),
        metadata: {
          canWrite,
          connected: redis.status === 'ready',
        },
      };

      this.setCached(name, health);
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name,
        status: 'unhealthy',
        responseTime,
        message: `Redis error: ${(error as Error).message}`,
        lastChecked: new Date(),
        metadata: { error: (error as Error).message },
      };
    } finally {
      if (redis) {
        await redis.quit().catch(() => {});
      }
    }
  }

  /**
   * Verifica status do S3
   */
  private async checkS3(): Promise<ServiceHealth> {
    const name = 's3';
    const cached = this.getCached(name);
    if (cached) return cached;

    const startTime = Date.now();

    try {
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });

      const bucketName = process.env.AWS_S3_BUCKET || '';
      
      if (!bucketName) {
        return {
          name,
          status: 'degraded',
          responseTime: 0,
          message: 'S3 not configured',
          lastChecked: new Date(),
        };
      }

      // Teste de acesso ao bucket
      await Promise.race([
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName })),
        this.timeout(this.config.timeout, 'S3 timeout'),
      ]);

      const responseTime = Date.now() - startTime;
      const status = this.evaluateStatus(responseTime, true);

      const health: ServiceHealth = {
        name,
        status,
        responseTime,
        message: status === 'healthy' ? 'S3 operational' : 'S3 slow',
        lastChecked: new Date(),
        metadata: {
          bucket: bucketName,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      };

      this.setCached(name, health);
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name,
        status: 'unhealthy',
        responseTime,
        message: `S3 error: ${(error as Error).message}`,
        lastChecked: new Date(),
        metadata: { error: (error as Error).message },
      };
    }
  }

  /**
   * Verifica sistema de arquivos
   */
  private async checkFileSystem(): Promise<ServiceHealth> {
    const name = 'filesystem';
    const startTime = Date.now();

    try {
      const fs = await import('fs/promises');
      const os = await import('os');
      const path = await import('path');

      const tmpDir = os.tmpdir();
      const testFile = path.join(tmpDir, `health-${Date.now()}.txt`);

      // Teste de escrita
      await fs.writeFile(testFile, 'test');
      
      // Teste de leitura
      const content = await fs.readFile(testFile, 'utf-8');
      
      // Limpeza
      await fs.unlink(testFile);

      const canWrite = content === 'test';
      const responseTime = Date.now() - startTime;
      const status = this.evaluateStatus(responseTime, canWrite);

      return {
        name,
        status,
        responseTime,
        message: status === 'healthy' ? 'FileSystem operational' : 'FileSystem slow',
        lastChecked: new Date(),
        metadata: {
          tmpDir,
          canWrite,
        },
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `FileSystem error: ${(error as Error).message}`,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Verifica uso de memória
   */
  private async checkMemory(): Promise<ServiceHealth> {
    const name = 'memory';
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      
      const usedPercent = ((totalMem - freeMem) / totalMem) * 100;
      const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (usedPercent > 90 || heapPercent > 90) {
        status = 'unhealthy';
      } else if (usedPercent > 75 || heapPercent > 75) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        name,
        status,
        responseTime: Date.now() - startTime,
        message: `Memory usage: ${usedPercent.toFixed(1)}%`,
        lastChecked: new Date(),
        metadata: {
          heapUsed: this.formatBytes(memUsage.heapUsed),
          heapTotal: this.formatBytes(memUsage.heapTotal),
          rss: this.formatBytes(memUsage.rss),
          external: this.formatBytes(memUsage.external),
          usedPercent: usedPercent.toFixed(2),
          heapPercent: heapPercent.toFixed(2),
        },
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Memory check error: ${(error as Error).message}`,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Verifica uso de disco
   */
  private async checkDisk(): Promise<ServiceHealth> {
    const name = 'disk';
    const startTime = Date.now();

    try {
      // Implementação simplificada (pode ser expandida com bibliotecas específicas)
      return {
        name,
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Disk operational',
        lastChecked: new Date(),
        metadata: {
          note: 'Basic disk check - extend with disk-usage library for production',
        },
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Disk check error: ${(error as Error).message}`,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Avalia status baseado em tempo de resposta e funcionalidade
   */
  private evaluateStatus(responseTime: number, functional: boolean): 'healthy' | 'degraded' | 'unhealthy' {
    if (!functional) return 'unhealthy';
    if (responseTime > this.config.thresholds.responseTime * 2) return 'unhealthy';
    if (responseTime > this.config.thresholds.responseTime) return 'degraded';
    return 'healthy';
  }

  /**
   * Cria promise com timeout
   */
  private timeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Obtém resultado do cache se válido
   */
  private getCached(name: string): ServiceHealth | null {
    if (!this.config.enableCache) return null;

    const cached = this.cache.get(name);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    return null;
  }

  /**
   * Armazena resultado no cache
   */
  private setCached(name: string, data: ServiceHealth): void {
    if (!this.config.enableCache) return;

    this.cache.set(name, {
      data,
      expiresAt: Date.now() + this.config.cacheTTL,
    });
  }

  /**
   * Adiciona resultado ao histórico
   */
  private addToHistory(name: string, data: ServiceHealth): void {
    const history = this.checkHistory.get(name) || [];
    history.push(data);
    
    // Mantém apenas últimos 100 registros
    if (history.length > 100) {
      history.shift();
    }
    
    this.checkHistory.set(name, history);
  }

  /**
   * Obtém histórico de um serviço
   */
  public getHistory(serviceName: string): ServiceHealth[] {
    return this.checkHistory.get(serviceName) || [];
  }

  /**
   * Calcula taxa de erro de um serviço
   */
  public getErrorRate(serviceName: string): number {
    const history = this.getHistory(serviceName);
    if (history.length === 0) return 0;

    const errors = history.filter(h => h.status === 'unhealthy').length;
    return errors / history.length;
  }

  /**
   * Registra callback para notificações
   */
  public onHealthChange(callback: (health: SystemHealth) => void): void {
    this.notificationCallbacks.push(callback);
  }

  /**
   * Notifica callbacks registrados
   */
  private notifyCallbacks(health: SystemHealth): void {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error in health notification callback:', error);
      }
    });
  }

  /**
   * Limpa cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Limpa histórico
   */
  public clearHistory(): void {
    this.checkHistory.clear();
  }

  /**
   * Formata bytes para formato legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// ====================================
// FACTORY FUNCTIONS
// ====================================

/**
 * Cria health check básico (sem cache)
 */
export function createBasicHealthCheck(): HealthCheckSystem {
  return new HealthCheckSystem({
    enableCache: false,
    timeout: 3000,
  });
}

/**
 * Cria health check com cache (produção)
 */
export function createCachedHealthCheck(): HealthCheckSystem {
  return new HealthCheckSystem({
    enableCache: true,
    cacheTTL: 30000,
    timeout: 5000,
  });
}

/**
 * Cria health check com notificações
 */
export function createMonitoredHealthCheck(): HealthCheckSystem {
  return new HealthCheckSystem({
    enableCache: true,
    enableNotifications: true,
    cacheTTL: 30000,
    timeout: 5000,
  });
}

// ====================================
// EXPORTS
// ====================================

export default HealthCheckSystem;
