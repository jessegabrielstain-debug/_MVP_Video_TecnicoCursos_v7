import * as Sentry from '@sentry/nextjs'
import { logger } from './logger'

let initialized = false

export function initObservability() {
  if (initialized) return
  
  const dsn = process.env.SENTRY_DSN || ''
  if (!dsn) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Sentry DSN not configured, skipping initialization', { component: 'observability' })
    }
    return
  }
  
  try {
    Sentry.init({ 
      dsn, 
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version,
    })
    initialized = true
    logger.info('Sentry initialized successfully', { component: 'observability' })
  } catch (error) {
    // Log but don't crash - observability is nice-to-have, not critical
    logger.warn('Failed to initialize Sentry', { 
      component: 'observability',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  try {
    initObservability()
    
    if (initialized) {
      Sentry.captureException(error, {
        extra: context,
      })
    }
    
    // Always log locally as fallback
    logger.error(
      'Error captured',
      error instanceof Error ? error : new Error(String(error)),
      { component: 'observability', ...context }
    )
  } catch (captureErr) {
    // Last resort fallback - use console to avoid infinite loop
    console.error('[observability] Failed to capture error:', captureErr)
    console.error('[observability] Original error:', error)
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) {
  try {
    initObservability()
    
    if (initialized) {
      Sentry.captureMessage(message, {
        level,
        extra: context,
      })
    }
  } catch (err) {
    logger.warn('Failed to capture message to Sentry', {
      component: 'observability',
      originalMessage: message,
      error: err instanceof Error ? err.message : String(err)
    })
  }
}

export function setUserContext(userId: string, email?: string) {
  try {
    if (initialized) {
      Sentry.setUser({ id: userId, email })
    }
  } catch (error) {
    logger.debug('Failed to set user context in Sentry', {
      component: 'observability',
      userId,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

export function clearUserContext() {
  try {
    if (initialized) {
      Sentry.setUser(null)
    }
  } catch (error) {
    logger.debug('Failed to clear user context in Sentry', {
      component: 'observability',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

export function startTransaction(name: string, op: string) {
  try {
    if (initialized) {
      return Sentry.startSpan({ name, op }, () => {})
    }
  } catch (error) {
    logger.debug('Failed to start Sentry transaction', {
      component: 'observability',
      name,
      op,
      error: error instanceof Error ? error.message : String(error)
    })
  }
  return undefined
}

export const observability = {
  init: initObservability,
  captureError,
  captureMessage,
  setUser: setUserContext,
  clearUser: clearUserContext,
  startTransaction,
}

export default observability