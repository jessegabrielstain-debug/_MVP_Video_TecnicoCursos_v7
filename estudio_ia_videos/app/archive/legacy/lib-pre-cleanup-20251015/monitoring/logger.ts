/**
 * 📊 STRUCTURED LOGGING SYSTEM
 * Sistema de logs estruturado para produção
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  userId?: string
  sessionId?: string
  requestId?: string
  metadata?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
  performance?: {
    duration: number
    memory: number
    cpu?: number
  }
}

export interface LoggerConfig {
  level: LogLevel
  service: string
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  remoteEndpoint?: string
}

class StructuredLogger {
  private static instance: StructuredLogger
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 1000

  private constructor() {
    this.config = {
      level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      service: process.env.SERVICE_NAME || 'estudio-ia-videos',
      enableConsole: true,
      enableFile: process.env.NODE_ENV === 'production',
      enableRemote: process.env.REMOTE_LOGGING === 'true',
      remoteEndpoint: process.env.REMOTE_LOG_ENDPOINT
    }

    // Flush logs periodically
    setInterval(() => this.flushLogs(), 30000)
  }

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger()
    }
    return StructuredLogger.instance
  }

  // 🔍 DEBUG
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata)
  }

  // ℹ️ INFO
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata)
  }

  // ⚠️ WARN
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata)
  }

  // ❌ ERROR
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined

    this.log(LogLevel.ERROR, message, metadata, errorData)
  }

  // 💀 FATAL
  fatal(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined

    this.log(LogLevel.FATAL, message, metadata, errorData)
  }

  // 📈 PERFORMANCE LOG
  performance(
    message: string, 
    duration: number, 
    metadata?: Record<string, unknown>
  ): void {
    const performance = {
      duration,
      memory: process.memoryUsage().heapUsed / 1024 / 1024 // MB
    }

    this.log(LogLevel.INFO, message, metadata, undefined, performance)
  }

  // 🎯 CORE LOG METHOD
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: { name: string; message: string; stack?: string },
    performance?: { duration: number; memory: number; cpu?: number }
  ): void {
    if (level < this.config.level) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.service,
      metadata,
      error,
      performance
    }

    // Add to buffer
    this.logBuffer.push(entry)
    
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }

    // Console output
    if (this.config.enableConsole) {
      this.outputToConsole(entry)
    }

    // Immediate flush for errors
    if (level >= LogLevel.ERROR) {
      this.flushLogs()
    }
  }

  // 🖥️ CONSOLE OUTPUT
  private outputToConsole(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
    const levelColors = ['\x1b[36m', '\x1b[32m', '\x1b[33m', '\x1b[31m', '\x1b[35m']
    const resetColor = '\x1b[0m'

    const color = levelColors[entry.level] || ''
    const levelName = levelNames[entry.level] || 'UNKNOWN'
    
    const prefix = `${color}[${entry.timestamp}] ${levelName}${resetColor}`
    const message = `${prefix} ${entry.message}`

    if (entry.metadata) {
      console.log(message, entry.metadata)
    } else {
      console.log(message)
    }

    if (entry.error) {
      console.error('Error details:', entry.error)
    }

    if (entry.performance) {
      console.log('Performance:', entry.performance)
    }
  }

  // 💾 FLUSH LOGS
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return

    const logsToFlush = [...this.logBuffer]
    this.logBuffer = []

    try {
      // File logging (if enabled)
      if (this.config.enableFile) {
        await this.writeToFile(logsToFlush)
      }

      // Remote logging (if enabled)
      if (this.config.enableRemote && this.config.remoteEndpoint) {
        await this.sendToRemote(logsToFlush)
      }
    } catch (error) {
      console.error('Failed to flush logs:', error)
      // Re-add logs to buffer if flush failed
      this.logBuffer.unshift(...logsToFlush)
    }
  }

  // 📁 WRITE TO FILE
  private async writeToFile(logs: LogEntry[]): Promise<void> {
    // Implementation would depend on file system access
    // For now, just log to console in production
    if (process.env.NODE_ENV === 'production') {
      logs.forEach(log => {
        console.log(JSON.stringify(log))
      })
    }
  }

  // 🌐 SEND TO REMOTE
  private async sendToRemote(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOG_API_KEY || ''}`
        },
        body: JSON.stringify({ logs })
      })
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error)
    }
  }

  // 📊 GET RECENT LOGS
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count)
  }

  // 🔧 UPDATE CONFIG
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// 🚀 EXPORT SINGLETON
export const logger = StructuredLogger.getInstance()

// 🎯 CONVENIENCE FUNCTIONS
export const log = {
  debug: (message: string, metadata?: Record<string, unknown>) => logger.debug(message, metadata),
  info: (message: string, metadata?: Record<string, unknown>) => logger.info(message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => logger.warn(message, metadata),
  error: (message: string, error?: Error, metadata?: Record<string, unknown>) => logger.error(message, error, metadata),
  fatal: (message: string, error?: Error, metadata?: Record<string, unknown>) => logger.fatal(message, error, metadata),
  performance: (message: string, duration: number, metadata?: Record<string, unknown>) => logger.performance(message, duration, metadata)
}

export default logger