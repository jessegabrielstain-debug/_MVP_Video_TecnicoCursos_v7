/**
 * Sentry Server Configuration
 * Inicialização do Sentry para monitoramento de erros no lado do servidor
 * 
 * @module sentry.server
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

let sentryInitialized = false;

/**
 * Inicializa o Sentry no servidor
 */
export function initSentry() {
  if (sentryInitialized) {
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('⚠️ SENTRY_DSN não configurado - monitoramento desabilitado');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      
      // Configuração de traces
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
      
      // Integrations
      integrations: [
        Sentry.httpIntegration(),
      ],
      
      // Filtragem de eventos
      beforeSend(event, hint) {
        // Adicionar contexto customizado
        event.tags = {
          ...event.tags,
          component: 'server',
        };
        
        return event;
      },
      
      // Ignorar erros conhecidos
      ignoreErrors: [
        'ECONNREFUSED',
        'ENOTFOUND',
      ],
    });
    
    sentryInitialized = true;
    console.log('✅ Sentry server inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Sentry server:', error);
  }
}

/**
 * Captura exceção manualmente
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!sentryInitialized) {
    console.error('Sentry não inicializado:', error);
    return;
  }
  
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Captura mensagem customizada
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!sentryInitialized) {
    console.log(`[${level}] ${message}`);
    return;
  }
  
  Sentry.captureMessage(message, level);
}

/**
 * Define contexto do usuário
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  if (!sentryInitialized) return;
  
  Sentry.setUser(user);
}

/**
 * Limpa contexto do usuário
 */
export function clearUser() {
  if (!sentryInitialized) return;
  
  Sentry.setUser(null);
}

/**
 * Wrapper para capturar erros em funções async
 */
export function withSentry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, context);
      throw error;
    }
  }) as T;
}
