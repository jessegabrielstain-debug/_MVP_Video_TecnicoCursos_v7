/**
 * Sentry Client Configuration
 * Inicialização do Sentry para monitoramento de erros no lado do cliente
 * 
 * @module sentry.client
 */

'use client';

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';

let sentryInitialized = false;

/**
 * Inicializa o Sentry no cliente
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
      tracePropagationTargets: ['localhost', /^https:\/\/[^/]*\.vercel\.app/],
      
      // Configuração de replays de sessão
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Filtragem de eventos
      beforeSend(event, hint) {
        // Ignorar erros conhecidos/esperados
        if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop')) {
          return null;
        }
        
        // Adicionar contexto customizado
        event.tags = {
          ...event.tags,
          component: 'client',
        };
        
        return event;
      },
      
      // Ignorar erros de extensões do navegador
      ignoreErrors: [
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        'ChunkLoadError',
      ],
    });
    
    sentryInitialized = true;
    console.log('✅ Sentry client inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Sentry client:', error);
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
