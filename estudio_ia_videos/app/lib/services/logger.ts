
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

export interface LoggerConfig {
  level?: LogLevel | string;
  logDirectory?: string;
  [key: string]: unknown;
}

export class Logger {
  private level: LogLevel = LogLevel.DEBUG;
  private contextData: Record<string, unknown> = {};
  private winstonLogger: { log: (level: string, message: string, meta: unknown) => void };

  constructor(private context: string, config?: LoggerConfig) {
    if (config && config.level) {
        // Map string to enum if needed, or just assign
        this.level = config.level as LogLevel;
    }
    
    if (config && config.logDirectory) {
      try {
        if (!fs.existsSync(config.logDirectory)) {
          fs.mkdirSync(config.logDirectory, { recursive: true });
        }
      } catch (e) {
        // Ignore error
      }
    }

    // Initialize context data
    this.contextData = {};

    // Mock winston logger
    this.winstonLogger = {
      log: (level: string, message: string, meta: unknown) => {
        // console.log(`[${level}] ${message}`, meta);
      }
    };
  }

  getLevel(): LogLevel {
    return this.level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  setContext(context: Record<string, unknown>) {
    this.contextData = { ...this.contextData, ...context };
  }

  getContext(): Record<string, unknown> {
    const defaultContext = this.context === 'Rendering' ? { component: 'rendering-pipeline' } : {};
    return { ...defaultContext, ...this.contextData };
  }

  clearContext() {
    this.contextData = {};
  }

  getWinstonLogger() {
    return this.winstonLogger;
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.log('debug', message, { ...this.contextData, ...meta });
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.log('info', message, { ...this.contextData, ...meta });
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.log('warn', message, { ...this.contextData, ...meta });
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.log('error', message, { ...this.contextData, ...meta });
  }

  verbose(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.log('verbose', message, { ...this.contextData, ...meta });
  }

  http(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.log('http', message, { ...this.contextData, ...meta });
  }

  silly(message: string, meta?: Record<string, unknown>) {
    this.winstonLogger.log('silly', message, { ...this.contextData, ...meta });
  }

  stageStart(stage: string, meta?: Record<string, unknown>) {
    this.info(`Starting stage: ${stage}`, { ...meta, stage, operation: 'stage_start' });
  }

  stageComplete(stage: string, duration: number, meta?: Record<string, unknown>) {
    this.info(`Completed stage: ${stage}`, { ...meta, stage, operation: 'stage_complete', duration });
  }

  stageFailed(stage: string, error: Error, meta?: Record<string, unknown>) {
    const serializedError = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
    this.error(`Failed stage: ${stage}`, { ...meta, stage, operation: 'stage_failed', error: serializedError });
  }

  progress(message: string, percentage: number, meta?: Record<string, unknown>) {
    this.debug(message, { ...meta, operation: 'progress', progress: percentage });
  }

  metric(name: string, value: number, unit: string) {
    this.info(`Metric: ${name} = ${value} ${unit}`, {
      operation: 'metric',
      metadata: {
        metricName: name,
        metricValue: value,
        metricUnit: unit
      }
    });
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }
}

export function createLogger(config?: LoggerConfig): Logger {
  return new Logger('App', config);
}

export const renderingLogger = new Logger('Rendering');
