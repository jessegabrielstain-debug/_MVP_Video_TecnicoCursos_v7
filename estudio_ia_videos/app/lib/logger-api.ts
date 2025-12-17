/**
 * 📝 API Logger - Request-scoped logging for API routes
 * Provides request context, timing, and structured logging for production
 */

import { logger, Logger } from './logger'
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'

// Request context type
export interface RequestContext {
  requestId: string
  method: string
  path: string
  ip?: string
  userAgent?: string
  userId?: string
  startTime: number
}

// Performance metrics
export interface PerformanceMetrics {
  duration: number
  dbQueries?: number
  cacheHits?: number
  cacheMisses?: number
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Extract client IP from request
 */
function getClientIP(request?: NextRequest): string | undefined {
  if (!request) return undefined
  
  // Check various headers for real IP behind proxies
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP
  
  return undefined
}

/**
 * Create API Logger with request context
 */
export function createApiLogger(request?: NextRequest, namespace?: string): APILogger {
  const context: RequestContext = {
    requestId: generateRequestId(),
    method: request?.method || 'UNKNOWN',
    path: request?.nextUrl?.pathname || 'unknown',
    ip: getClientIP(request),
    userAgent: request?.headers.get('user-agent') || undefined,
    startTime: Date.now(),
  }
  
  return new APILogger(context, namespace)
}

/**
 * API Logger class with request context
 */
export class APILogger {
  private context: RequestContext
  private baseLogger: Logger
  private dbQueryCount = 0
  private cacheHits = 0
  private cacheMisses = 0

  constructor(context: RequestContext, namespace?: string) {
    this.context = context
    this.baseLogger = new Logger(namespace || 'api')
  }

  /**
   * Set user ID after authentication
   */
  setUserId(userId: string): void {
    this.context.userId = userId
  }

  /**
   * Track database query
   */
  trackDbQuery(): void {
    this.dbQueryCount++
  }

  /**
   * Track cache hit
   */
  trackCacheHit(): void {
    this.cacheHits++
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(): void {
    this.cacheMisses++
  }

  /**
   * Get current context
   */
  getContext(): RequestContext {
    return { ...this.context }
  }

  /**
   * Get request ID for response headers
   */
  getRequestId(): string {
    return this.context.requestId
  }

  /**
   * Calculate elapsed time
   */
  private getElapsed(): number {
    return Date.now() - this.context.startTime
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      duration: this.getElapsed(),
      dbQueries: this.dbQueryCount,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
    }
  }

  /**
   * Log with full context
   */
  private logWithContext(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    extra?: Record<string, unknown>,
    error?: Error
  ): void {
    const fullContext = {
      requestId: this.context.requestId,
      method: this.context.method,
      path: this.context.path,
      userId: this.context.userId,
      elapsed: this.getElapsed(),
      ...extra,
    }

    switch (level) {
      case 'debug':
        this.baseLogger.debug(message, fullContext)
        break
      case 'info':
        this.baseLogger.info(message, fullContext)
        break
      case 'warn':
        this.baseLogger.warn(message, fullContext)
        break
      case 'error':
        this.baseLogger.error(message, error, fullContext)
        break
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logWithContext('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logWithContext('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logWithContext('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.logWithContext('error', message, context, error)
  }

  /**
   * Log request start (call at beginning of route)
   */
  logRequestStart(): void {
    this.info('Request started', {
      ip: this.context.ip,
      userAgent: this.context.userAgent,
    })
  }

  /**
   * Log request completion (call before returning response)
   */
  logRequestComplete(statusCode: number, extra?: Record<string, unknown>): void {
    const metrics = this.getMetrics()
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    
    this.logWithContext(level, 'Request completed', {
      statusCode,
      ...metrics,
      ...extra,
    })
  }

  /**
   * Log error with request context
   */
  logError(message: string, error: Error, extra?: Record<string, unknown>): void {
    this.error(message, error, {
      errorType: error.name,
      errorMessage: error.message,
      ...extra,
    })
  }
}

/**
 * Create response headers with request ID and timing
 */
export function createResponseHeaders(apiLogger: APILogger): Record<string, string> {
  const metrics = apiLogger.getMetrics()
  
  return {
    'X-Request-ID': apiLogger.getRequestId(),
    'X-Response-Time': `${metrics.duration}ms`,
    ...(metrics.dbQueries ? { 'X-DB-Queries': String(metrics.dbQueries) } : {}),
  }
}

/**
 * Middleware helper for Next.js API routes
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const log = createApiLogger(request, 'my-route')
 *   log.logRequestStart()
 *   
 *   try {
 *     // ... route logic
 *     log.logRequestComplete(200)
 *     return NextResponse.json(data, { headers: createResponseHeaders(log) })
 *   } catch (error) {
 *     log.logError('Failed', error as Error)
 *     log.logRequestComplete(500)
 *     return NextResponse.json({ error: 'Internal error' }, { status: 500 })
 *   }
 * }
 * ```
 */
export const apiLogger = {
  create: createApiLogger,
  headers: createResponseHeaders,
}

export default apiLogger
