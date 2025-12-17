/**
 * 🛡️ Centralized Error Handling System
 * Production-grade error handling, categorization, and recovery
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'
import { APILogger } from './logger-api'

// Error categories for better tracking and handling
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  FFMPEG = 'ffmpeg',
  STORAGE = 'storage',
  RESOURCE = 'resource',
  INTERNAL = 'internal',
  UNKNOWN = 'unknown',
}

// Map categories to HTTP status codes
const categoryToStatus: Record<ErrorCategory, number> = {
  [ErrorCategory.VALIDATION]: 400,
  [ErrorCategory.AUTHENTICATION]: 401,
  [ErrorCategory.AUTHORIZATION]: 403,
  [ErrorCategory.NOT_FOUND]: 404,
  [ErrorCategory.CONFLICT]: 409,
  [ErrorCategory.RATE_LIMIT]: 429,
  [ErrorCategory.EXTERNAL_SERVICE]: 502,
  [ErrorCategory.DATABASE]: 500,
  [ErrorCategory.NETWORK]: 503,
  [ErrorCategory.TIMEOUT]: 504,
  [ErrorCategory.FFMPEG]: 500,
  [ErrorCategory.STORAGE]: 500,
  [ErrorCategory.RESOURCE]: 507,
  [ErrorCategory.INTERNAL]: 500,
  [ErrorCategory.UNKNOWN]: 500,
}

// User-friendly messages by category
const categoryMessages: Record<ErrorCategory, string> = {
  [ErrorCategory.VALIDATION]: 'Dados inválidos na requisição',
  [ErrorCategory.AUTHENTICATION]: 'Autenticação necessária',
  [ErrorCategory.AUTHORIZATION]: 'Sem permissão para esta ação',
  [ErrorCategory.NOT_FOUND]: 'Recurso não encontrado',
  [ErrorCategory.CONFLICT]: 'Conflito com estado atual',
  [ErrorCategory.RATE_LIMIT]: 'Muitas requisições, tente novamente em breve',
  [ErrorCategory.EXTERNAL_SERVICE]: 'Serviço externo indisponível',
  [ErrorCategory.DATABASE]: 'Erro ao acessar o banco de dados',
  [ErrorCategory.NETWORK]: 'Erro de conexão de rede',
  [ErrorCategory.TIMEOUT]: 'A operação demorou muito',
  [ErrorCategory.FFMPEG]: 'Erro no processamento de vídeo',
  [ErrorCategory.STORAGE]: 'Erro no armazenamento de arquivos',
  [ErrorCategory.RESOURCE]: 'Recursos insuficientes',
  [ErrorCategory.INTERNAL]: 'Erro interno do servidor',
  [ErrorCategory.UNKNOWN]: 'Erro desconhecido',
}

// Custom application error
export class AppError extends Error {
  public readonly category: ErrorCategory
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    context?: Record<string, unknown>,
    isOperational = true
  ) {
    super(message)
    this.name = 'AppError'
    this.category = category
    this.statusCode = categoryToStatus[category]
    this.isOperational = isOperational
    this.context = context

    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      statusCode: this.statusCode,
      context: this.context,
    }
  }
}

// Specialized errors
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCategory.VALIDATION, context)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Autenticação necessária', context?: Record<string, unknown>) {
    super(message, ErrorCategory.AUTHENTICATION, context)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Sem permissão para esta ação', context?: Record<string, unknown>) {
    super(message, ErrorCategory.AUTHORIZATION, context)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso', context?: Record<string, unknown>) {
    super(`${resource} não encontrado`, ErrorCategory.NOT_FOUND, context)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCategory.CONFLICT, context)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number, context?: Record<string, unknown>) {
    super('Muitas requisições', ErrorCategory.RATE_LIMIT, { retryAfter, ...context })
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error, context?: Record<string, unknown>) {
    super(`Erro no serviço ${service}`, ErrorCategory.EXTERNAL_SERVICE, {
      service,
      originalMessage: originalError?.message,
      ...context,
    })
    this.name = 'ExternalServiceError'
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, originalError?: Error, context?: Record<string, unknown>) {
    super(`Erro de banco de dados: ${operation}`, ErrorCategory.DATABASE, {
      operation,
      originalMessage: originalError?.message,
      ...context,
    })
    this.name = 'DatabaseError'
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeout: number, context?: Record<string, unknown>) {
    super(`Timeout em ${operation} após ${timeout}ms`, ErrorCategory.TIMEOUT, {
      operation,
      timeout,
      ...context,
    })
    this.name = 'TimeoutError'
  }
}

/**
 * Categorize an unknown error
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof AppError) {
    return error.category
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  // Pattern matching for common error types
  if (message.includes('timeout') || message.includes('timed out')) {
    return ErrorCategory.TIMEOUT
  }
  if (message.includes('ffmpeg') || message.includes('encoding') || message.includes('codec')) {
    return ErrorCategory.FFMPEG
  }
  if (message.includes('network') || message.includes('econnrefused') || message.includes('fetch')) {
    return ErrorCategory.NETWORK
  }
  if (message.includes('storage') || message.includes('bucket') || message.includes('upload')) {
    return ErrorCategory.STORAGE
  }
  if (message.includes('database') || message.includes('prisma') || message.includes('supabase') || message.includes('query')) {
    return ErrorCategory.DATABASE
  }
  if (message.includes('auth') || message.includes('token') || message.includes('jwt')) {
    return ErrorCategory.AUTHENTICATION
  }
  if (message.includes('permission') || message.includes('forbidden') || message.includes('access denied')) {
    return ErrorCategory.AUTHORIZATION
  }
  if (message.includes('not found') || message.includes('404')) {
    return ErrorCategory.NOT_FOUND
  }
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return ErrorCategory.VALIDATION
  }
  if (message.includes('memory') || message.includes('heap') || message.includes('resource')) {
    return ErrorCategory.RESOURCE
  }

  return ErrorCategory.UNKNOWN
}

/**
 * Normalize any error to a consistent format
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  const category = categorizeError(error)
  const message = error instanceof Error ? error.message : String(error)
  
  return new AppError(message, category, {
    originalError: error instanceof Error ? error.name : typeof error,
  })
}

/**
 * Get user-safe error message (no internal details)
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof AppError && error.isOperational) {
    return error.message
  }

  const category = categorizeError(error)
  return categoryMessages[category]
}

/**
 * Create API error response
 */
export function createErrorResponse(
  error: unknown,
  apiLogger?: APILogger,
  includeDetails = process.env.NODE_ENV === 'development'
): NextResponse {
  const normalized = normalizeError(error)
  const userMessage = getUserMessage(error)
  
  // Log the error
  if (apiLogger) {
    apiLogger.logError(normalized.message, normalized, normalized.context)
  } else {
    logger.error(normalized.message, normalized, normalized.context)
  }

  const responseBody: Record<string, unknown> = {
    success: false,
    error: userMessage,
    category: normalized.category,
    ...(apiLogger ? { requestId: apiLogger.getRequestId() } : {}),
    ...(includeDetails ? {
      details: normalized.message,
      context: normalized.context,
    } : {}),
  }

  return NextResponse.json(responseBody, {
    status: normalized.statusCode,
    headers: apiLogger ? {
      'X-Request-ID': apiLogger.getRequestId(),
    } : {},
  })
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  apiLogger?: APILogger
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (apiLogger) {
        const normalized = normalizeError(error)
        apiLogger.logError('Unhandled error', normalized)
      }
      throw error
    }
  }) as T
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Retry with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    delayMs?: number
    backoffMultiplier?: number
    shouldRetry?: (error: unknown) => boolean
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options

  let lastError: unknown
  let delay = delayMs

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error
      }

      logger.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
        error: error instanceof Error ? error.message : String(error),
        nextDelayMs: delay,
      })

      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= backoffMultiplier
    }
  }

  throw lastError
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  TimeoutError,
  categorizeError,
  normalizeError,
  getUserMessage,
  createErrorResponse,
  withErrorHandling,
  safeJsonParse,
  withRetry,
}
