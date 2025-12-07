/**
 * Logger Service - Centralized logging with multiple transports
 * Sistema de logging centralizado com suporte a console, arquivo e Sentry
 */

import { captureException as sentryCaptureException } from '../monitoring/sentry.server';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class LoggerService {
  private minLevel: LogLevel = 'info';
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Define nível mínimo de log
   */
  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }

  /**
   * Verifica se deve logar no nível atual
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Formata entrada de log
   */
  private formatLogEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formatted += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }
    
    if (error) {
      formatted += `\n  Error: ${error.message}`;
      if (error.stack) {
        formatted += `\n  Stack: ${error.stack}`;
      }
    }
    
    return formatted;
  }

  /**
   * Cria entrada de log
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }

  /**
   * Loga no console
   */
  private logToConsole(entry: LogEntry) {
    const formatted = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  /**
   * Envia para Sentry (apenas errors)
   */
  private logToSentry(entry: LogEntry) {
    if (entry.level === 'error' && entry.error) {
      sentryCaptureException(entry.error, entry.context);
    }
  }

  /**
   * Log genérico
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, context, error);
    
    // Console (sempre)
    this.logToConsole(entry);
    
    // Sentry (apenas erros em produção)
    if (!this.isDevelopment && entry.level === 'error') {
      this.logToSentry(entry);
    }
  }

  /**
   * Log debug
   */
  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  /**
   * Log info
   */
  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  /**
   * Log warning
   */
  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  /**
   * Log error
   */
  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }

  /**
   * Log específico para API routes
   */
  apiLog(
    method: string,
    path: string,
    statusCode: number,
    duration?: number,
    context?: Record<string, unknown>
  ) {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.log(level, `${method} ${path} - ${statusCode}`, {
      ...context,
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  /**
   * Log específico para jobs BullMQ
   */
  jobLog(
    jobId: string,
    queueName: string,
    event: 'started' | 'progress' | 'completed' | 'failed',
    context?: Record<string, unknown>
  ) {
    const level: LogLevel = event === 'failed' ? 'error' : 'info';
    
    this.log(level, `Job ${event}: ${jobId}`, {
      ...context,
      jobId,
      queueName,
      event,
    });
  }

  /**
   * Log específico para render
   */
  renderLog(
    projectId: string,
    stage: string,
    progress: number,
    context?: Record<string, unknown>
  ) {
    this.info(`Render [${projectId}] - ${stage} (${progress}%)`, {
      ...context,
      projectId,
      stage,
      progress,
    });
  }
}

// Singleton instance
export const logger = new LoggerService();

// Configurar nível baseado em env
if (process.env.LOG_LEVEL) {
  logger.setMinLevel(process.env.LOG_LEVEL as LogLevel);
}
