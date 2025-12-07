/**
 * Monitoring Logger
 * Logger estruturado para monitoramento
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  debug(message: string, meta?: Record<string, unknown>) {
    console.debug(`[${this.context}] ${message}`, meta);
  }
  
  info(message: string, meta?: Record<string, unknown>) {
    console.info(`[${this.context}] ${message}`, meta);
  }
  
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[${this.context}] ${message}`, meta);
  }
  
  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    console.error(`[${this.context}] ${message}`, error, meta);
  }

  security(message: string, meta?: Record<string, unknown>) {
    console.warn(`[SECURITY][${this.context}] ${message}`, meta);
  }

  apiRequest(method: string, path: string, duration: number, status: number) {
    this.info(`API Request: ${method} ${path}`, { duration, status });
  }
}

export const createLogger = (context: string) => new Logger(context);
export const log = createLogger('default');
export const logger = log;
