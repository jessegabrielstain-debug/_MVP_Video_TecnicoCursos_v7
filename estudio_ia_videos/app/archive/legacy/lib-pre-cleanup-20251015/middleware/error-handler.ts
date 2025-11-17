/**
 * 🛡️ ENHANCED ERROR HANDLING MIDDLEWARE
 * Sistema robusto de tratamento de erros para APIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/logger'
import { metrics } from '@/lib/monitoring/metrics'

// 🎯 ERROR TYPES
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  REDIS = 'REDIS_ERROR'
}

// 🏗️ CUSTOM ERROR CLASS
export class APIError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'APIError'
    this.type = type
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    // Maintain proper stack trace
    Error.captureStackTrace(this, APIError)
  }
}

// 🎨 ERROR RESPONSE FORMATTER
interface ErrorResponse {
  success: false
  error: {
    type: string
    message: string
    code: string
    timestamp: string
    requestId?: string
    details?: any
  }
  meta?: {
    endpoint: string
    method: string
    userAgent?: string
  }
}

// 🔧 ERROR HANDLER FUNCTION
export function createErrorHandler() {
  return async function errorHandler(
    error: Error | APIError,
    request: NextRequest,
    context?: Record<string, unknown>
  ): Promise<NextResponse<ErrorResponse>> {
    
    // Generate request ID for tracking
    const requestId = crypto.randomUUID()
    
    // Determine error details
    let statusCode = 500
    let errorType = ErrorType.INTERNAL
    let isOperational = false
    let errorContext = context

    if (error instanceof APIError) {
      statusCode = error.statusCode
      errorType = error.type
      isOperational = error.isOperational
      errorContext = { ...context, ...error.context }
    } else {
      // Map common errors
      if (error.message.includes('timeout')) {
        errorType = ErrorType.TIMEOUT
        statusCode = 408
      } else if (error.message.includes('not found')) {
        errorType = ErrorType.NOT_FOUND
        statusCode = 404
      } else if (error.message.includes('unauthorized')) {
        errorType = ErrorType.AUTHENTICATION
        statusCode = 401
      } else if (error.message.includes('forbidden')) {
        errorType = ErrorType.AUTHORIZATION
        statusCode = 403
      } else if (error.message.includes('validation')) {
        errorType = ErrorType.VALIDATION
        statusCode = 400
      }
    }

    // Log error with context
    const logContext = {
      requestId,
      type: errorType,
      statusCode,
      isOperational,
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      ...errorContext
    }

    if (statusCode >= 500) {
      logger.error('API Error (5xx)', error, logContext)
      metrics.increment('api.errors.5xx')
    } else if (statusCode >= 400) {
      logger.warn('API Error (4xx)', logContext)
      metrics.increment('api.errors.4xx')
    }

    // Track error metrics
    metrics.increment('api.errors.total')
    metrics.increment(`api.errors.type.${errorType.toLowerCase()}`)

    // Create error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        type: errorType,
        message: isOperational ? error.message : 'Internal server error',
        code: `ERR_${errorType}`,
        timestamp: new Date().toISOString(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack,
            context: errorContext
          }
        })
      },
      meta: {
        endpoint: new URL(request.url).pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined
      }
    }

    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

// 🎯 SPECIFIC ERROR CREATORS
export const createValidationError = (message: string, details?: any) =>
  new APIError(message, ErrorType.VALIDATION, 400, true, { details })

export const createDatabaseError = (message: string, query?: string) =>
  new APIError(message, ErrorType.DATABASE, 500, true, { query })

export const createAuthenticationError = (message: string = 'Authentication required') =>
  new APIError(message, ErrorType.AUTHENTICATION, 401, true)

export const createAuthorizationError = (message: string = 'Insufficient permissions') =>
  new APIError(message, ErrorType.AUTHORIZATION, 403, true)

export const createNotFoundError = (resource: string) =>
  new APIError(`${resource} not found`, ErrorType.NOT_FOUND, 404, true, { resource })

export const createRateLimitError = (limit: number, window: string) =>
  new APIError('Rate limit exceeded', ErrorType.RATE_LIMIT, 429, true, { limit, window })

export const createTimeoutError = (operation: string, timeout: number) =>
  new APIError(`Operation timeout: ${operation}`, ErrorType.TIMEOUT, 408, true, { operation, timeout })

export const createRedisError = (message: string, operation?: string) =>
  new APIError(message, ErrorType.REDIS, 500, true, { operation })

// 🔄 ASYNC ERROR WRAPPER
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        throw error
      }
      
      // Wrap unknown errors
      throw new APIError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        ErrorType.INTERNAL,
        500,
        false,
        { originalError: error }
      )
    }
  }
}

// 🎪 API ROUTE WRAPPER
export function withErrorHandling<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const errorHandler = createErrorHandler()
    
    try {
      // Track request
      metrics.increment('api.requests.total')
      metrics.increment(`api.requests.method.${request.method.toLowerCase()}`)
      
      const startTime = Date.now()
      const response = await handler(request, ...args)
      const duration = Date.now() - startTime
      
      // Track response
      metrics.timer('api.response.duration', duration)
      metrics.increment(`api.responses.status.${response.status}`)
      
      if (response.status >= 200 && response.status < 300) {
        metrics.increment('api.responses.success')
      }
      
      return response
      
    } catch (error) {
      return errorHandler(error as Error, request)
    }
  }
}

// 🔍 ERROR ANALYSIS
export function analyzeError(error: Error): {
  type: ErrorType
  severity: 'low' | 'medium' | 'high' | 'critical'
  shouldRetry: boolean
  retryDelay?: number
} {
  if (error instanceof APIError) {
    const severity = error.statusCode >= 500 ? 'high' : 
                    error.statusCode >= 400 ? 'medium' : 'low'
    
    const shouldRetry = [
      ErrorType.TIMEOUT,
      ErrorType.DATABASE,
      ErrorType.EXTERNAL_API,
      ErrorType.REDIS
    ].includes(error.type) && error.statusCode >= 500
    
    return {
      type: error.type,
      severity,
      shouldRetry,
      retryDelay: shouldRetry ? Math.min(1000 * Math.pow(2, 3), 10000) : undefined
    }
  }
  
  return {
    type: ErrorType.INTERNAL,
    severity: 'critical',
    shouldRetry: false
  }
}

// 🚨 GLOBAL ERROR HANDLERS
export function setupGlobalErrorHandlers() {
  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal('Unhandled Promise Rejection', reason as Error, {
      promise: promise.toString()
    })
    metrics.increment('errors.unhandled_rejection')
  })

  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught Exception', error)
    metrics.increment('errors.uncaught_exception')
    
    // Graceful shutdown
    process.exit(1)
  })

  // Warning events
  process.on('warning', (warning) => {
    logger.warn('Process Warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    })
    metrics.increment('warnings.process')
  })
}

export default {
  APIError,
  createErrorHandler,
  withErrorHandling,
  asyncHandler,
  setupGlobalErrorHandlers,
  analyzeError,
}
