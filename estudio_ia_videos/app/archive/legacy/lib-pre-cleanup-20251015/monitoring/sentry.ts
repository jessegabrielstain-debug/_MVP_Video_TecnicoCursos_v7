
/**
 * 🔍 Sentry Error Tracking & Performance Monitoring
 * 
 * Configuração completa do Sentry para:
 * - Error tracking
 * - Performance monitoring
 * - User context
 * - Breadcrumbs
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
const ENV = process.env.NODE_ENV || 'development'
const RELEASE = process.env.VERCEL_GIT_COMMIT_SHA || 'local'

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('⚠️ Sentry DSN not configured')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,
    release: `estudio-ia-videos@${RELEASE}`,
    
    // Performance Monitoring
    tracesSampleRate: ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filtering
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Failed to fetch',
    ],
    
    beforeSend(event, hint) {
      // Não enviar erros de desenvolvimento
      if (ENV === 'development') {
        console.error('Sentry event (dev):', event, hint)
        return null
      }
      
      // Adicionar contexto adicional
      if (event.exception && hint.originalException) {
        const error = hint.originalException as Error
        event.extra = {
          ...event.extra,
          errorMessage: error.message,
          errorStack: error.stack,
        }
      }
      
      return event
    },
  })
  
  console.log('✅ Sentry initialized')
}

/**
 * Capturar erro com contexto
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (context) {
    Sentry.setContext('custom', context)
  }
  Sentry.captureException(error)
}

/**
 * Capturar mensagem
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level)
}

/**
 * Adicionar breadcrumb
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now(),
  })
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user)
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null)
}
