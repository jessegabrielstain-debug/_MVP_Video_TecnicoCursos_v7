/**
 * Sistema de Monitoring e Error Tracking
 * 
 * Integra Sentry para error tracking, métricas de performance,
 * e monitoramento de saúde da aplicação
 */

import * as Sentry from '@sentry/nextjs';

// ==========================================
// CONFIGURAÇÃO DO SENTRY
// ==========================================

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

/**
 * Inicializar Sentry para tracking de erros
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN não configurado. Error tracking desativado.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,

    // Performance monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Profiles
    profilesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Filtrar erros conhecidos
    beforeSend(event, hint) {
      // Ignorar erros de rede conhecidos
      const error = hint.originalException as Error;
      if (error?.message?.includes('NetworkError')) {
        return null;
      }

      // Ignorar erros de extensões de browser
      if (error?.stack?.includes('chrome-extension://')) {
        return null;
      }

      return event;
    },

    // Configurar contexto padrão
    initialScope: {
      tags: {
        environment: ENVIRONMENT,
      },
    },
  });

  console.log(`Sentry inicializado (${ENVIRONMENT})`);
}

// ==========================================
// TRACKING DE ERROS
// ==========================================

/**
 * Capturar exceção com contexto
 */
export function captureException(
  error: Error,
  context?: {
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: {
      id: string;
      email?: string;
      username?: string;
    };
  }
) {
  Sentry.withScope((scope) => {
    if (context?.level) {
      scope.setLevel(context.level);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.user) {
      scope.setUser(context.user);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capturar mensagem customizada
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, unknown>
) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message);
  });
}

// ==========================================
// CONTEXTO DE USUÁRIO
// ==========================================

/**
 * Definir usuário atual para tracking
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  Sentry.setUser(user);
}

/**
 * Limpar usuário (logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

// ==========================================
// PERFORMANCE MONITORING
// ==========================================

/**
 * Iniciar transação de performance
 */
export function startTransaction(
  name: string,
  op: string,
  data?: Record<string, unknown>
) {
  const transaction = Sentry.startTransaction({
    name,
    op,
    data,
  });

  return transaction;
}

/**
 * Tracker de tempo de operação
 */
export class PerformanceTracker {
  private startTime: number;
  private operation: string;
  private metadata: Record<string, unknown>;

  constructor(operation: string, metadata?: Record<string, unknown>) {
    this.startTime = Date.now();
    this.operation = operation;
    this.metadata = metadata || {};
  }

  /**
   * Finalizar tracking e enviar métrica
   */
  finish(additionalData?: Record<string, unknown>) {
    const duration = Date.now() - this.startTime;

    // Enviar para Sentry
    Sentry.addBreadcrumb({
      category: 'performance',
      message: this.operation,
      level: 'info',
      data: {
        ...this.metadata,
        ...additionalData,
        duration,
      },
    });

    // Retornar duração
    return duration;
  }

  /**
   * Marcar checkpoint
   */
  checkpoint(name: string) {
    const elapsed = Date.now() - this.startTime;

    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${this.operation} - ${name}`,
      level: 'debug',
      data: {
        elapsed,
      },
    });

    return elapsed;
  }
}

// ==========================================
// MÉTRICAS DE PERFORMANCE
// ==========================================

/**
 * Tracker de métricas de API
 */
export const apiMetrics = {
  /**
   * Registrar tempo de resposta de API
   */
  recordResponseTime: (
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ) => {
    Sentry.addBreadcrumb({
      category: 'api',
      message: `${method} ${path}`,
      level: statusCode >= 400 ? 'warning' : 'info',
      data: {
        method,
        path,
        statusCode,
        duration,
      },
    });

    // Alertar se requisição muito lenta (>5s)
    if (duration > 5000) {
      captureMessage(
        `API lenta detectada: ${method} ${path}`,
        'warning',
        {
          method,
          path,
          duration,
        }
      );
    }
  },

  /**
   * Registrar erro de API
   */
  recordError: (
    method: string,
    path: string,
    statusCode: number,
    error: Error
  ) => {
    captureException(error, {
      level: 'error',
      tags: {
        api_method: method,
        api_path: path,
        status_code: statusCode.toString(),
      },
      extra: {
        method,
        path,
        statusCode,
      },
    });
  },
};

/**
 * Tracker de métricas de upload
 */
export const uploadMetrics = {
  /**
   * Registrar upload bem-sucedido
   */
  recordSuccess: (
    userId: string,
    fileName: string,
    fileSize: number,
    duration: number
  ) => {
    Sentry.addBreadcrumb({
      category: 'upload',
      message: 'Upload concluído',
      level: 'info',
      data: {
        userId,
        fileName,
        fileSize,
        duration,
        speed: fileSize / duration, // bytes/ms
      },
    });
  },

  /**
   * Registrar falha de upload
   */
  recordFailure: (
    userId: string,
    fileName: string,
    error: Error,
    reason: string
  ) => {
    captureException(error, {
      level: 'error',
      tags: {
        upload_status: 'failed',
        failure_reason: reason,
      },
      extra: {
        userId,
        fileName,
      },
    });
  },
};

/**
 * Tracker de métricas de TTS
 */
export const ttsMetrics = {
  /**
   * Registrar geração bem-sucedida
   */
  recordSuccess: (
    userId: string,
    provider: string,
    textLength: number,
    audioLength: number,
    duration: number
  ) => {
    Sentry.addBreadcrumb({
      category: 'tts',
      message: 'TTS gerado',
      level: 'info',
      data: {
        userId,
        provider,
        textLength,
        audioLength,
        duration,
      },
    });
  },

  /**
   * Registrar fallback de provider
   */
  recordFallback: (
    projectId: string,
    fromProvider: string,
    toProvider: string,
    reason: string
  ) => {
    captureMessage(
      `Fallback TTS: ${fromProvider} → ${toProvider}`,
      'warning',
      {
        projectId,
        fromProvider,
        toProvider,
        reason,
      }
    );
  },

  /**
   * Registrar falha
   */
  recordFailure: (
    userId: string,
    provider: string,
    error: Error
  ) => {
    captureException(error, {
      level: 'error',
      tags: {
        tts_provider: provider,
      },
      extra: {
        userId,
      },
    });
  },
};

/**
 * Tracker de métricas de renderização
 */
export const renderMetrics = {
  /**
   * Registrar renderização bem-sucedida
   */
  recordSuccess: (
    userId: string,
    projectId: string,
    config: {
      resolution: string;
      quality: string;
      format: string;
    },
    duration: number,
    outputSize: number
  ) => {
    Sentry.addBreadcrumb({
      category: 'render',
      message: 'Renderização concluída',
      level: 'info',
      data: {
        userId,
        projectId,
        ...config,
        duration,
        outputSize,
      },
    });
  },

  /**
   * Registrar falha
   */
  recordFailure: (
    userId: string,
    projectId: string,
    error: Error,
    stage: string
  ) => {
    captureException(error, {
      level: 'error',
      tags: {
        render_stage: stage,
      },
      extra: {
        userId,
        projectId,
      },
    });
  },

  /**
   * Registrar tempo de fila
   */
  recordQueueTime: (jobId: string, queueTime: number) => {
    Sentry.addBreadcrumb({
      category: 'render',
      message: 'Job removido da fila',
      level: queueTime > 60000 ? 'warning' : 'info',
      data: {
        jobId,
        queueTime,
      },
    });

    // Alertar se tempo de fila muito longo (>5 min)
    if (queueTime > 300000) {
      captureMessage(
        'Tempo de fila de renderização muito longo',
        'warning',
        {
          jobId,
          queueTime,
        }
      );
    }
  },
};

// ==========================================
// SAÚDE DA APLICAÇÃO
// ==========================================

/**
 * Healthcheck da aplicação
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    storage: boolean;
    queue: boolean;
    tts: boolean;
  };
  timestamp: string;
}> {
  const checks = {
    database: true,
    storage: true,
    queue: true,
    tts: true,
  };

  try {
    // Verificar database (exemplo)
    // await supabase.from('users').select('id').limit(1);
  } catch (error) {
    checks.database = false;
    captureException(error as Error, {
      level: 'error',
      tags: { healthcheck: 'database' },
    });
  }

  try {
    // Verificar storage (exemplo)
    // await supabase.storage.listBuckets();
  } catch (error) {
    checks.storage = false;
    captureException(error as Error, {
      level: 'error',
      tags: { healthcheck: 'storage' },
    });
  }

  const failedChecks = Object.values(checks).filter((v) => !v).length;

  const status =
    failedChecks === 0 ? 'healthy' : failedChecks <= 1 ? 'degraded' : 'unhealthy';

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Monitorar uso de recursos
 */
export function monitorResources() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as any).memory;

    if (memory) {
      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.jsHeapSizeLimit;
      const percentUsed = (usedMemory / totalMemory) * 100;

      Sentry.addBreadcrumb({
        category: 'resources',
        message: 'Uso de memória',
        level: percentUsed > 90 ? 'warning' : 'info',
        data: {
          usedMemory,
          totalMemory,
          percentUsed: percentUsed.toFixed(2),
        },
      });

      // Alertar se uso de memória muito alto
      if (percentUsed > 95) {
        captureMessage(
          'Uso de memória crítico',
          'warning',
          {
            usedMemory,
            totalMemory,
            percentUsed,
          }
        );
      }
    }
  }
}

// ==========================================
// ALERTAS AUTOMÁTICOS
// ==========================================

/**
 * Configurar alertas para falhas críticas
 */
export function setupCriticalAlerts() {
  // Monitorar taxa de erros
  let errorCount = 0;
  const ERROR_THRESHOLD = 10; // 10 erros em 5 minutos
  const TIME_WINDOW = 5 * 60 * 1000; // 5 minutos

  setInterval(() => {
    if (errorCount > ERROR_THRESHOLD) {
      captureMessage(
        `Taxa de erro elevada: ${errorCount} erros em 5 minutos`,
        'fatal',
        {
          errorCount,
          threshold: ERROR_THRESHOLD,
        }
      );
    }

    // Resetar contador
    errorCount = 0;
  }, TIME_WINDOW);

  // Interceptar erros globais
  if (typeof window !== 'undefined') {
    window.addEventListener('error', () => {
      errorCount++;
    });

    window.addEventListener('unhandledrejection', () => {
      errorCount++;
    });
  }
}

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {
  init: initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  startTransaction,
  PerformanceTracker,
  metrics: {
    api: apiMetrics,
    upload: uploadMetrics,
    tts: ttsMetrics,
    render: renderMetrics,
  },
  healthCheck,
  monitorResources,
  setupCriticalAlerts,
};
