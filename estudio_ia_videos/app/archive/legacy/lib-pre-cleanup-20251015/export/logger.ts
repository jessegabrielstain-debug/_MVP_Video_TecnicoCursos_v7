/**
 * 📝 Structured Logging System
 * Winston-based logger with file rotation and JSON formatting
 * Sprint 53 - Logging & E2E Tests
 */

import winston from 'winston'
import path from 'path'
import fs from 'fs'

/**
 * Log levels (Winston default)
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

/**
 * Log context for structured logging
 */
export interface LogContext {
  component?: string
  stage?: string
  operation?: string
  duration?: number
  progress?: number
  file?: string
  error?: any
  metadata?: Record<string, unknown>
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  logDirectory: string
  maxFileSize: number // in bytes
  maxFiles: number // number of rotated files to keep
  enableJson: boolean // JSON format for production
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  logDirectory: path.join(process.cwd(), 'logs'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  enableJson: process.env.NODE_ENV === 'production',
}

/**
 * Structured Logger
 */
export class Logger {
  private winstonLogger: winston.Logger
  private config: LoggerConfig
  private context: LogContext = {}

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Ensure log directory exists
    if (this.config.enableFile) {
      this.ensureLogDirectory()
    }

    // Create Winston logger
    this.winstonLogger = this.createLogger()
  }

  /**
   * Create Winston logger with transports
   */
  private createLogger(): winston.Logger {
    const transports: winston.transport[] = []

    // Console transport
    if (this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: this.config.enableJson
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : ''
                  return `${timestamp} [${level}]: ${message} ${metaStr}`
                })
              ),
        })
      )
    }

    // File transport (general logs)
    if (this.config.enableFile) {
      transports.push(
        new winston.transports.File({
          filename: path.join(this.config.logDirectory, 'combined.log'),
          maxsize: this.config.maxFileSize,
          maxFiles: this.config.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      )

      // Separate error log file
      transports.push(
        new winston.transports.File({
          filename: path.join(this.config.logDirectory, 'error.log'),
          level: 'error',
          maxsize: this.config.maxFileSize,
          maxFiles: this.config.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      )
    }

    return winston.createLogger({
      level: this.config.level,
      transports,
      exitOnError: false,
    })
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDirectory)) {
      fs.mkdirSync(this.config.logDirectory, { recursive: true })
    }
  }

  /**
   * Set persistent context for all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Clear persistent context
   */
  clearContext(): void {
    this.context = {}
  }

  /**
   * Get current context
   */
  getContext(): LogContext {
    return { ...this.context }
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log HTTP request/response
   */
  http(message: string, context?: LogContext): void {
    this.log(LogLevel.HTTP, message, context)
  }

  /**
   * Log verbose message
   */
  verbose(message: string, context?: LogContext): void {
    this.log(LogLevel.VERBOSE, message, context)
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log silly message (very verbose)
   */
  silly(message: string, context?: LogContext): void {
    this.log(LogLevel.SILLY, message, context)
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const mergedContext = { ...this.context, ...context }
    
    // Clean up undefined values
    const cleanContext = Object.fromEntries(
      Object.entries(mergedContext).filter(([_, v]) => v !== undefined)
    )

    this.winstonLogger.log(level, message, cleanContext)
  }

  /**
   * Log pipeline stage start
   */
  stageStart(stage: string, context?: LogContext): void {
    this.info(`Starting stage: ${stage}`, {
      ...context,
      stage,
      operation: 'stage_start',
    })
  }

  /**
   * Log pipeline stage completion
   */
  stageComplete(stage: string, duration: number, context?: LogContext): void {
    this.info(`Completed stage: ${stage}`, {
      ...context,
      stage,
      operation: 'stage_complete',
      duration,
    })
  }

  /**
   * Log pipeline stage failure
   */
  stageFailed(stage: string, error: any, context?: LogContext): void {
    this.error(`Failed stage: ${stage}`, {
      ...context,
      stage,
      operation: 'stage_failed',
      error: this.serializeError(error),
    })
  }

  /**
   * Log progress update
   */
  progress(message: string, progress: number, context?: LogContext): void {
    this.debug(message, {
      ...context,
      operation: 'progress',
      progress,
    })
  }

  /**
   * Log performance metric
   */
  metric(name: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Metric: ${name} = ${value} ${unit}`, {
      ...context,
      operation: 'metric',
      metadata: {
        metricName: name,
        metricValue: value,
        metricUnit: unit,
      },
    })
  }

  /**
   * Serialize error for logging
   */
  private serializeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }
    return String(error)
  }

  /**
   * Get Winston logger instance (for advanced use)
   */
  getWinstonLogger(): winston.Logger {
    return this.winstonLogger
  }

  /**
   * Update log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
    this.winstonLogger.level = level
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level
  }

  /**
   * Close logger and flush pending logs
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.winstonLogger.on('finish', resolve)
      this.winstonLogger.end()
    })
  }
}

/**
 * Create logger instance with default config
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config)
}

/**
 * Singleton logger instance for rendering pipeline
 */
export const renderingLogger = createLogger({
  enableConsole: true,
  enableFile: true,
  logDirectory: path.join(process.cwd(), 'logs', 'rendering'),
})

/**
 * Set component context for rendering logger
 */
renderingLogger.setContext({
  component: 'rendering-pipeline',
})
