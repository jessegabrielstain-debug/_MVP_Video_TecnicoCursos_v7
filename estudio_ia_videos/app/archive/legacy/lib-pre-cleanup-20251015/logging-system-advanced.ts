/**
 * Sistema de Logs Estruturados Avançado
 * 
 * Features:
 * - Logs estruturados em JSON
 * - Múltiplos níveis (trace, debug, info, warn, error, fatal)
 * - Contexto e metadata
 * - Correlation IDs para rastreamento
 * - Múltiplos transportes (Console, File, Redis, S3)
 * - Rotação automática de arquivos
 * - Filtros e busca
 * - Alertas em tempo real
 * - Performance tracking
 * - Integração com monitoring
 * 
 * @module LoggingSystem
 */

import { promises as fs, createWriteStream, WriteStream } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Redis } from 'ioredis';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { monitoringSystem } from './monitoring-system-real';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string; // Contexto da aplicação (auth, render, upload, etc)
  correlationId?: string; // ID para rastrear operação completa
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  user?: {
    id: string;
    email?: string;
  };
  request?: {
    method: string;
    url: string;
    ip?: string;
    userAgent?: string;
  };
  performance?: {
    duration: number; // ms
    memory: number; // bytes
  };
}

export interface LogFilter {
  level?: LogLevel | LogLevel[];
  context?: string;
  correlationId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
}

export interface LogTransport {
  name: string;
  enabled: boolean;
  minLevel: LogLevel;
  write: (entry: LogEntry) => Promise<void>;
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byContext: Record<string, number>;
  errors: number;
  warnings: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};

const LOG_COLORS: Record<LogLevel, string> = {
  trace: '\x1b[90m',    // Gray
  debug: '\x1b[36m',    // Cyan
  info: '\x1b[32m',     // Green
  warn: '\x1b[33m',     // Yellow
  error: '\x1b[31m',    // Red
  fatal: '\x1b[35m'     // Magenta
};

const RESET_COLOR = '\x1b[0m';

// ============================================================================
// LOGGING SYSTEM CLASS
// ============================================================================

export class LoggingSystem {
  private static instance: LoggingSystem;
  private transports: Map<string, LogTransport> = new Map();
  private minLevel: LogLevel = 'info';
  private redis: Redis;
  private s3: S3Client;
  private fileStream?: WriteStream;
  private logDir: string;
  private currentLogFile?: string;
  private stats: LogStats = {
    total: 0,
    byLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, fatal: 0 },
    byContext: {},
    errors: 0,
    warnings: 0
  };

  private constructor() {
    this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.initializeTransports();
    this.ensureLogDirectory();
  }

  public static getInstance(): LoggingSystem {
    if (!LoggingSystem.instance) {
      LoggingSystem.instance = new LoggingSystem();
    }
    return LoggingSystem.instance;
  }

  // ============================================================================
  // TRANSPORT INITIALIZATION
  // ============================================================================

  /**
   * Inicializa transportes
   */
  private initializeTransports(): void {
    // Console Transport
    this.transports.set('console', {
      name: 'console',
      enabled: true,
      minLevel: this.minLevel,
      write: async (entry) => await this.writeToConsole(entry)
    });

    // File Transport
    this.transports.set('file', {
      name: 'file',
      enabled: process.env.LOG_FILE !== 'false',
      minLevel: 'info',
      write: async (entry) => await this.writeToFile(entry)
    });

    // Redis Transport (para logs recentes)
    this.transports.set('redis', {
      name: 'redis',
      enabled: true,
      minLevel: 'info',
      write: async (entry) => await this.writeToRedis(entry)
    });

    // S3 Transport (para arquivamento)
    this.transports.set('s3', {
      name: 's3',
      enabled: process.env.LOG_S3 === 'true',
      minLevel: 'error',
      write: async (entry) => await this.writeToS3(entry)
    });

    console.log('✅ Log transports inicializados');
  }

  // ============================================================================
  // LOGGING METHODS
  // ============================================================================

  /**
   * Log trace (menor nível)
   */
  public trace(message: string, metadata?: Record<string, unknown>, context?: string): void {
    this.log('trace', message, metadata, context);
  }

  /**
   * Log debug
   */
  public debug(message: string, metadata?: Record<string, unknown>, context?: string): void {
    this.log('debug', message, metadata, context);
  }

  /**
   * Log info
   */
  public info(message: string, metadata?: Record<string, unknown>, context?: string): void {
    this.log('info', message, metadata, context);
  }

  /**
   * Log warning
   */
  public warn(message: string, metadata?: Record<string, unknown>, context?: string): void {
    this.log('warn', message, metadata, context);
    this.stats.warnings++;
  }

  /**
   * Log error
   */
  public error(message: string, error?: Error, metadata?: Record<string, unknown>, context?: string): void {
    const entry: Partial<LogEntry> = { metadata, context };
    
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.log('error', message, entry.metadata, context, entry.error);
    this.stats.errors++;

    // Cria alerta crítico
    monitoringSystem.createAlert('critical', `Error: ${message}`, {
      error: error?.message,
      context
    });
  }

  /**
   * Log fatal (maior nível)
   */
  public fatal(message: string, error?: Error, metadata?: Record<string, unknown>, context?: string): void {
    const entry: Partial<LogEntry> = { metadata, context };
    
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.log('fatal', message, entry.metadata, context, entry.error);

    // Cria alerta crítico
    monitoringSystem.createAlert('critical', `FATAL: ${message}`, {
      error: error?.message,
      context
    });
  }

  /**
   * Log genérico
   */
  private async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    context?: string,
    error?: LogEntry['error']
  ): Promise<void> {
    // Verifica se deve logar
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      level,
      message,
      context,
      metadata,
      error
    };

    // Atualiza estatísticas
    this.updateStats(entry);

    // Escreve em todos os transports habilitados
    const promises: Promise<void>[] = [];

    for (const transport of this.transports.values()) {
      if (transport.enabled && LOG_LEVELS[level] >= LOG_LEVELS[transport.minLevel]) {
        promises.push(transport.write(entry).catch(err => {
          console.error(`Erro no transport ${transport.name}:`, err);
        }));
      }
    }

    await Promise.all(promises);
  }

  // ============================================================================
  // TRANSPORT WRITERS
  // ============================================================================

  /**
   * Escreve no console com cores
   */
  private async writeToConsole(entry: LogEntry): Promise<void> {
    const color = LOG_COLORS[entry.level];
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? `[${entry.context}]` : '';
    
    let output = `${color}${timestamp} ${level}${RESET_COLOR} ${context} ${entry.message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      output += `\n  ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  ${entry.error.stack}`;
      }
    }

    console.log(output);
  }

  /**
   * Escreve em arquivo
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    // Rotaciona arquivo se necessário
    await this.rotateLogFile();

    if (!this.fileStream) {
      return;
    }

    const line = JSON.stringify(entry) + '\n';
    
    return new Promise((resolve, reject) => {
      this.fileStream!.write(line, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Escreve no Redis (últimos logs)
   */
  private async writeToRedis(entry: LogEntry): Promise<void> {
    const key = `logs:recent`;
    
    await this.redis.lpush(key, JSON.stringify(entry));
    await this.redis.ltrim(key, 0, 999); // Mantém apenas últimos 1000
    await this.redis.expire(key, 86400); // 24 horas

    // Também salva por nível
    const levelKey = `logs:level:${entry.level}`;
    await this.redis.lpush(levelKey, JSON.stringify(entry));
    await this.redis.ltrim(levelKey, 0, 99);
    await this.redis.expire(levelKey, 86400);

    // E por contexto se houver
    if (entry.context) {
      const contextKey = `logs:context:${entry.context}`;
      await this.redis.lpush(contextKey, JSON.stringify(entry));
      await this.redis.ltrim(contextKey, 0, 99);
      await this.redis.expire(contextKey, 86400);
    }
  }

  /**
   * Escreve no S3 (arquivamento)
   */
  private async writeToS3(entry: LogEntry): Promise<void> {
    const bucket = process.env.AWS_S3_LOGS_BUCKET;
    if (!bucket) return;

    const date = entry.timestamp.toISOString().split('T')[0];
    const key = `logs/${date}/${entry.id}.json`;

    await this.s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(entry, null, 2),
      ContentType: 'application/json'
    }));
  }

  // ============================================================================
  // FILE ROTATION
  // ============================================================================

  /**
   * Rotaciona arquivo de log
   */
  private async rotateLogFile(): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const filename = `app-${date}.log`;
    const filepath = path.join(this.logDir, filename);

    // Se já é o arquivo atual, não faz nada
    if (this.currentLogFile === filepath) {
      return;
    }

    // Fecha stream anterior
    if (this.fileStream) {
      this.fileStream.end();
    }

    // Cria novo stream
    this.fileStream = createWriteStream(filepath, { flags: 'a' });
    this.currentLogFile = filepath;

    console.log(`📄 Log file rotacionado: ${filename}`);

    // Limpa logs antigos (mantém últimos 30 dias)
    await this.cleanOldLogFiles(30);
  }

  /**
   * Remove logs antigos
   */
  private async cleanOldLogFiles(daysToKeep: number): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.endsWith('.log')) continue;

        const filepath = path.join(this.logDir, file);
        const stats = await fs.stat(filepath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          await fs.unlink(filepath);
          console.log(`🗑️ Log antigo removido: ${file}`);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
    }
  }

  // ============================================================================
  // QUERYING & FILTERING
  // ============================================================================

  /**
   * Busca logs com filtros
   */
  public async searchLogs(filter: LogFilter): Promise<LogEntry[]> {
    const logs: LogEntry[] = [];

    // Busca no Redis (mais recentes)
    let redisLogs: string[] = [];

    if (filter.level) {
      const levels = Array.isArray(filter.level) ? filter.level : [filter.level];
      
      for (const level of levels) {
        const key = `logs:level:${level}`;
        const entries = await this.redis.lrange(key, 0, -1);
        redisLogs.push(...entries);
      }
    } else if (filter.context) {
      const key = `logs:context:${filter.context}`;
      redisLogs = await this.redis.lrange(key, 0, -1);
    } else {
      redisLogs = await this.redis.lrange('logs:recent', 0, -1);
    }

    // Parse logs
    for (const logStr of redisLogs) {
      try {
        const entry: LogEntry = JSON.parse(logStr);
        entry.timestamp = new Date(entry.timestamp);

        // Aplica filtros
        if (this.matchesFilter(entry, filter)) {
          logs.push(entry);
        }
      } catch (error) {
        console.error('Erro ao parsear log:', error);
      }
    }

    // Ordena por timestamp (mais recente primeiro)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Aplica limite
    if (filter.limit) {
      return logs.slice(0, filter.limit);
    }

    return logs;
  }

  /**
   * Verifica se log corresponde aos filtros
   */
  private matchesFilter(entry: LogEntry, filter: LogFilter): boolean {
    if (filter.level) {
      const levels = Array.isArray(filter.level) ? filter.level : [filter.level];
      if (!levels.includes(entry.level)) {
        return false;
      }
    }

    if (filter.context && entry.context !== filter.context) {
      return false;
    }

    if (filter.correlationId && entry.correlationId !== filter.correlationId) {
      return false;
    }

    if (filter.userId && entry.user?.id !== filter.userId) {
      return false;
    }

    if (filter.startDate && entry.timestamp < filter.startDate) {
      return false;
    }

    if (filter.endDate && entry.timestamp > filter.endDate) {
      return false;
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const messageMatch = entry.message.toLowerCase().includes(searchLower);
      const metadataMatch = JSON.stringify(entry.metadata || {}).toLowerCase().includes(searchLower);
      
      if (!messageMatch && !metadataMatch) {
        return false;
      }
    }

    return true;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Atualiza estatísticas
   */
  private updateStats(entry: LogEntry): void {
    this.stats.total++;
    this.stats.byLevel[entry.level]++;

    if (entry.context) {
      this.stats.byContext[entry.context] = (this.stats.byContext[entry.context] || 0) + 1;
    }
  }

  /**
   * Obtém estatísticas
   */
  public getStats(): LogStats {
    return { ...this.stats };
  }

  /**
   * Reseta estatísticas
   */
  public resetStats(): void {
    this.stats = {
      total: 0,
      byLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, fatal: 0 },
      byContext: {},
      errors: 0,
      warnings: 0
    };
  }

  // ============================================================================
  // CONTEXT & CORRELATION
  // ============================================================================

  /**
   * Cria logger com contexto
   */
  public createContextLogger(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }

  /**
   * Cria logger com correlation ID
   */
  public createCorrelatedLogger(correlationId?: string): CorrelatedLogger {
    return new CorrelatedLogger(this, correlationId || randomUUID());
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Garante que diretório de logs existe
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de logs:', error);
    }
  }

  /**
   * Habilita/desabilita transport
   */
  public setTransportEnabled(name: string, enabled: boolean): void {
    const transport = this.transports.get(name);
    if (transport) {
      transport.enabled = enabled;
      console.log(`${enabled ? '✅' : '⏸️'} Transport ${name} ${enabled ? 'habilitado' : 'desabilitado'}`);
    }
  }

  /**
   * Define nível mínimo
   */
  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
    console.log(`📊 Log level definido: ${level}`);
  }

  /**
   * Cleanup
   */
  public async cleanup(): Promise<void> {
    if (this.fileStream) {
      this.fileStream.end();
    }
    await this.redis.quit();
  }
}

// ============================================================================
// CONTEXT LOGGER
// ============================================================================

export class ContextLogger {
  constructor(
    private logger: LoggingSystem,
    private context: string
  ) {}

  trace(message: string, metadata?: Record<string, unknown>): void {
    this.logger.trace(message, metadata, this.context);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.logger.debug(message, metadata, this.context);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.logger.info(message, metadata, this.context);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.logger.warn(message, metadata, this.context);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.logger.error(message, error, metadata, this.context);
  }

  fatal(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.logger.fatal(message, error, metadata, this.context);
  }
}

// ============================================================================
// CORRELATED LOGGER
// ============================================================================

export class CorrelatedLogger {
  constructor(
    private logger: LoggingSystem,
    public readonly correlationId: string
  ) {}

  private addCorrelation(metadata?: Record<string, unknown>): Record<string, unknown> {
    return {
      ...metadata,
      correlationId: this.correlationId
    };
  }

  trace(message: string, metadata?: Record<string, unknown>, context?: string): void {
    this.logger.trace(message, this.addCorrelation(metadata), context);
  }

  debug(message: string, metadata?: Record<string, unknown>, context?: string): void {
    this.logger.debug(message, this.addCorrelation(metadata), context);
  }

  info(message: string, metadata?: Record<string, unknown>, context?: string): void {
    this.logger.info(message, this.addCorrelation(metadata), context);
  }

  warn(message: string, metadata?: Record<string, unknown>, context?: string): void {
    this.logger.warn(message, this.addCorrelation(metadata), context);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>, context?: string): void {
    this.logger.error(message, error, this.addCorrelation(metadata), context);
  }

  fatal(message: string, error?: Error, metadata?: Record<string, unknown>, context?: string): void {
    this.logger.fatal(message, error, this.addCorrelation(metadata), context);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const logger = LoggingSystem.getInstance();

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

/**
 * Decorator para tracking de performance
 */
export function LogPerformance(context?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const memBefore = process.memoryUsage().heapUsed;

      try {
        const result = await originalMethod.apply(this, args);
        
        const duration = Date.now() - start;
        const memAfter = process.memoryUsage().heapUsed;
        const memDelta = memAfter - memBefore;

        logger.debug(`${propertyKey} completed`, {
          duration: `${duration}ms`,
          memory: `${(memDelta / 1024 / 1024).toFixed(2)}MB`
        }, context || 'performance');

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        logger.error(
          `${propertyKey} failed after ${duration}ms`,
          error instanceof Error ? error : new Error(String(error)),
          {},
          context || 'performance'
        );

        throw error;
      }
    };

    return descriptor;
  };
}
