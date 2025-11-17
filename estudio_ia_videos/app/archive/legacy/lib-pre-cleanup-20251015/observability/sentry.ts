
/**
 * 📊 SENTRY OBSERVABILITY - Sprint 44
 * Configuração do Sentry para frontend e backend
 */

// Importação condicional do Sentry
let Sentry: any = null;
try {
  Sentry = require('@sentry/nextjs');
} catch (error) {
  console.warn('⚠️ @sentry/nextjs não instalado. Monitoramento de erros desabilitado.');
}

const SENTRY_DSN = process.env.SENTRY_DSN
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || 'development'

export function initSentry() {
  if (!Sentry) {
    console.warn('⚠️ Sentry não disponível (módulo não instalado)')
    return
  }

  if (!SENTRY_DSN || SENTRY_DSN.includes('example')) {
    console.warn('⚠️ Sentry não configurado (DSN inválido)')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: 1.0,
    // Integrations are auto-enabled in Sentry v8+
  })

  console.log('✓ Sentry inicializado')
}

/**
 * Capturar erro com contexto
 */
export function captureError(
  error: Error,
  context: {
    module?: 'compliance' | 'voice' | 'collab' | 'cert' | 'editor'
    userId?: string
    projectId?: string
    extra?: Record<string, unknown>
  }
) {
  if (!Sentry) {
    console.error('Sentry não disponível:', error);
    return;
  }

  Sentry.withScope((scope: any) => {
    if (context.module) scope.setTag('module', context.module)
    if (context.userId) scope.setUser({ id: context.userId })
    if (context.projectId) scope.setContext('project', { id: context.projectId })
    if (context.extra) scope.setExtras(context.extra)
    
    Sentry.captureException(error)
  })
}

/**
 * Capturar mensagem com severidade
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) {
  if (!Sentry) {
    console.log(`[${level.toUpperCase()}]`, message, context);
    return;
  }

  Sentry.withScope((scope: any) => {
    if (context) scope.setExtras(context)
    Sentry.captureMessage(message, level)
  })
}

/**
 * Iniciar span de performance (Sentry v8+)
 */
export function startSpan(name: string, op: string, callback: () => any) {
  if (!Sentry) {
    return callback();
  }
  return Sentry.startSpan({ name, op }, callback)
}
