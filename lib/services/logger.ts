/**
 * Logger Service - Serviço centralizado de logging estruturado
 * 
 * Responsabilidades:
 * - Logging estruturado em formato JSON Lines
 * - Níveis de log (debug, info, warn, error)
 * - Contexto rico com metadata
 * - Integração futura com Sentry
 * 
 * @module lib/services/logger
 */

import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  jobId?: string;
  projectId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  environment: string;
  service: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDirectory: string;
  serviceName: string;
}

class LoggerService {
  private config: LoggerConfig;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    this.config = {
      minLevel: (process.env.LOG_LEVEL as LogLevel) || 'info',
      enableConsole: process.env.LOG_CONSOLE !== 'false',
      enableFile: process.env.LOG_FILE === 'true',
      logDirectory: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
      serviceName: process.env.SERVICE_NAME || 'mvp-video',
    };

    // Cria diretório de logs se necessário
    if (this.config.enableFile) {
      this.ensureLogDirectory();
    }
  }

  /**
   * Garante que o diretório de logs existe
   */
  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.config.logDirectory)) {
        fs.mkdirSync(this.config.logDirectory, { recursive: true });
      }
    } catch (error) {
      console.error('[Logger] Erro ao criar diretório de logs:', error);
    }
  }

  /**
   * Verifica se o nível de log deve ser processado
   */
  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.minLevel];
  }

  /**
   * Cria entrada de log estruturada
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV || 'development',
      service: this.config.serviceName,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as NodeJS.ErrnoException).code,
      };
    }

    return entry;
  }

  /**
   * Escreve log no console
   */
  private writeToConsole(entry: LogEntry): void {
    const colorMap: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };

    const reset = '\x1b[0m';
    const color = colorMap[entry.level];

    console.log(
      `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`,
      entry.context ? entry.context : '',
      entry.error ? `\nError: ${entry.error.message}` : ''
    );
  }

  /**
   * Escreve log em arquivo (JSON Lines)
   */
  private writeToFile(entry: LogEntry): void {
    try {
      const logFile = path.join(
        this.config.logDirectory,
        `${entry.level}-${new Date().toISOString().split('T')[0]}.jsonl`
      );

      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
    } catch (error) {
      console.error('[Logger] Erro ao escrever em arquivo:', error);
    }
  }

  /**
   * Método interno de log
   */
  private log(
    level: LogLevel,
    message: string,
    contextOrError?: LogContext | Error,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // Determina contexto e erro
    let context: LogContext | undefined;
    let errorObj: Error | undefined;

    if (contextOrError instanceof Error) {
      errorObj = contextOrError;
    } else {
      context = contextOrError;
      errorObj = error;
    }

    const entry = this.createLogEntry(level, message, context, errorObj);

    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    if (this.config.enableFile) {
      this.writeToFile(entry);
    }

    // TODO: Integrar com Sentry para erros críticos
    if (level === 'error' && process.env.SENTRY_DSN) {
      // await Sentry.captureException(errorObj || new Error(message), { contexts: { custom: context } });
    }
  }

  /**
   * Log de debug
   */
  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log de informação
   */
  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log de aviso
   */
  public warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log de erro (com integração Sentry)
   */
  public error(message: string, errorOrContext?: Error | LogContext, error?: Error): void {
    this.log('error', message, errorOrContext, error);
    
    // Enviar para Sentry se configurado (apenas server-side)
    if (typeof window === 'undefined' && process.env.SENTRY_DSN) {
      try {
        import('@sentry/nextjs').then((Sentry) => {
          const actualError = error || (errorOrContext instanceof Error ? errorOrContext : undefined);
          const context = errorOrContext instanceof Error ? undefined : errorOrContext;
          
          if (actualError) {
            Sentry.captureException(actualError, {
              level: 'error',
              extra: context,
              tags: {
                service: this.config.serviceName,
                component: (context?.component as string) || 'unknown',
              },
            });
          } else {
            Sentry.captureMessage(message, {
              level: 'error',
              extra: context,
              tags: {
                service: this.config.serviceName,
                component: (context?.component as string) || 'unknown',
              },
            });
          }
        }).catch(() => {
          // Falha silenciosa na integração Sentry
        });
      } catch {
        // Falha silenciosa
      }
    }
  }

  /**
   * Cria logger com contexto fixo (útil para request scoping)
   */
  public withContext(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        this.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        this.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        this.warn(message, { ...baseContext, ...context }),
      error: (message: string, errorOrContext?: Error | LogContext, error?: Error) => {
        if (errorOrContext instanceof Error) {
          this.error(message, { ...baseContext }, errorOrContext);
        } else {
          this.error(message, { ...baseContext, ...errorOrContext }, error);
        }
      },
    };
  }

  /**
   * Utilitário para medir tempo de execução
   */
  public timer(label: string, context?: LogContext) {
    const start = Date.now();

    return {
      end: (additionalContext?: LogContext) => {
        const duration = Date.now() - start;
        this.info(`${label} concluído`, {
          ...context,
          ...additionalContext,
          durationMs: duration,
        });
      },
    };
  }

  /**
   * Obtém configuração atual
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Atualiza nível mínimo de log
   */
  public setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
    this.info('Nível de log atualizado', { newLevel: level });
  }
}

// Singleton instance
export const logger = new LoggerService();

// Re-exporta tipos úteis
export type { LogLevel, LogContext, LogEntry };
