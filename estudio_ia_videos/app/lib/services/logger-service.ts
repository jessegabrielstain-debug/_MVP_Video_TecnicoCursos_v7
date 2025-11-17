/**
 * Logger Service
 * Sistema centralizado de logging estruturado
 * Compatível com scripts/logger.ts (JSONL + rotação 10MB)
 */

import { writeFileSync, existsSync, mkdirSync, statSync, renameSync } from 'fs';
import { join } from 'path';

// =====================================
// Types
// =====================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

// =====================================
// Configuration
// =====================================

const LOG_DIR = process.env.LOG_DIR || join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'app.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// =====================================
// Logger Class
// =====================================

class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
  }

  private rotateLogIfNeeded(): void {
    if (!existsSync(LOG_FILE)) {
      return;
    }

    const stats = statSync(LOG_FILE);
    if (stats.size >= MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveName = join(LOG_DIR, `app-${timestamp}.log`);
      renameSync(LOG_FILE, archiveName);
    }
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Console output (colorido em desenvolvimento)
    if (!IS_PRODUCTION) {
      const colors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
        fatal: '\x1b[35m', // Magenta
      };
      const reset = '\x1b[0m';
      const color = colors[entry.level];
      
      console.log(
        `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} ${entry.context ? `[${entry.context}]` : ''} ${entry.message}`
      );
      
      if (entry.metadata) {
        console.log('  Metadata:', entry.metadata);
      }
      
      if (entry.error) {
        console.error('  Error:', entry.error);
      }
    }

    // File output (JSONL format)
    try {
      this.rotateLogIfNeeded();
      const line = JSON.stringify(entry) + '\n';
      writeFileSync(LOG_FILE, line, { flag: 'a' });
    } catch (err) {
      console.error('[Logger] Failed to write log:', err);
    }
  }

  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const errorCode = this.extractErrorCode(error);

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      metadata,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: errorCode,
          }
        : undefined,
    };
  }

  private extractErrorCode(error?: Error): string | number | undefined {
    if (!error) {
      return undefined;
    }

    const candidate = error as Partial<{ code: string | number }>;
    return typeof candidate.code === 'string' || typeof candidate.code === 'number'
      ? candidate.code
      : undefined;
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.writeLog(this.createEntry('debug', message, metadata));
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.writeLog(this.createEntry('info', message, metadata));
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.writeLog(this.createEntry('warn', message, metadata));
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.writeLog(this.createEntry('error', message, metadata, error));
  }

  fatal(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.writeLog(this.createEntry('fatal', message, metadata, error));
  }
}

// =====================================
// Singleton Instance
// =====================================

let defaultLogger: Logger | null = null;

/**
 * Obtém instância singleton do logger
 */
export function getLogger(context?: string): Logger {
  if (!context && !defaultLogger) {
    defaultLogger = new Logger();
  }

  return context ? new Logger(context) : defaultLogger!;
}

/**
 * Cria logger com contexto específico
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// =====================================
// Convenience Exports
// =====================================

export const logger = getLogger();

export default {
  getLogger,
  createLogger,
  logger,
};
