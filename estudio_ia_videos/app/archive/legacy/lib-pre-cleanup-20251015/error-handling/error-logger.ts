
/**
 * 📝 SISTEMA DE LOG DE ERROS AVANÇADO
 * Sistema centralizado para captura, processamento e envio de logs de erro
 */

export interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: Error;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  stack?: string;
  handled: boolean;
}

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: any; // Permite propriedades adicionais
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private sessionId: string;
  private logs: ErrorLog[] = [];
  private maxLogs = 1000;
  private apiEndpoint = '/api/errors/log';
  private isOnline = true;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeOnlineStatus();
    this.setupGlobalErrorHandlers();
    this.startPeriodicFlush();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeOnlineStatus(): void {
    if (typeof window === 'undefined') return; // Skip no servidor
    
    this.isOnline = navigator.onLine;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushLogs(); // Enviar logs pendentes quando voltar online
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return; // Skip no servidor
    
    // Capturar erros JavaScript não tratados
    window.addEventListener('error', (event) => {
      this.logError({
        message: `Global Error: ${event.message}`,
        error: new Error(event.message),
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          source: 'window.error'
        },
        handled: false
      });
    });

    // Capturar promises rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        context: {
          source: 'unhandledrejection'
        },
        handled: false
      });
    });

    // Capturar erros de recursos (imagens, scripts, etc.)
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        this.logError({
          message: `Resource Error: ${(event.target as any).src || (event.target as any).href}`,
          context: {
            tagName: (event.target as any).tagName,
            src: (event.target as any).src,
            href: (event.target as any).href,
            source: 'resource.error'
          },
          handled: false
        });
      }
    }, true);
  }

  private startPeriodicFlush(): void {
    if (typeof window === 'undefined') return; // Skip no servidor
    
    // Flush logs a cada 30 segundos se estiver online
    setInterval(() => {
      if (this.isOnline && this.logs.length > 0) {
        this.flushLogs();
      }
    }, 30000);

    // Flush antes de fechar a página
    window.addEventListener('beforeunload', () => {
      this.flushLogs();
    });
  }

  private createLog(
    level: ErrorLog['level'],
    message: string,
    error?: Error,
    context?: ErrorContext,
    handled = true
  ): ErrorLog {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      error,
      context,
      userId: context?.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      stack: error?.stack,
      handled
    };
  }

  private addLog(log: ErrorLog): void {
    this.logs.push(log);

    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = log.level === 'error' ? 'error' : 
                           log.level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${log.level.toUpperCase()}]`, log.message, log.context, log.error);
    }

    // Auto-flush para erros críticos
    if (log.level === 'error' && !log.handled) {
      setTimeout(() => this.flushLogs(), 1000);
    }
  }

  logError(params: {
    message: string;
    error?: Error;
    context?: ErrorContext;
    handled?: boolean;
  }): void {
    const log = this.createLog('error', params.message, params.error, params.context, params.handled);
    this.addLog(log);
  }

  logWarning(message: string, context?: ErrorContext): void {
    const log = this.createLog('warn', message, undefined, context);
    this.addLog(log);
  }

  logInfo(message: string, context?: ErrorContext): void {
    const log = this.createLog('info', message, undefined, context);
    this.addLog(log);
  }

  logDebug(message: string, context?: ErrorContext): void {
    if (process.env.NODE_ENV === 'development') {
      const log = this.createLog('debug', message, undefined, context);
      this.addLog(log);
    }
  }

  async flushLogs(): Promise<void> {
    if (this.logs.length === 0 || !this.isOnline) {
      return;
    }

    const logsToSend = [...this.logs];
    this.logs = [];

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
      });

      if (!response.ok) {
        // Se falhou, recoloca os logs na fila
        this.logs.unshift(...logsToSend);
        throw new Error(`Failed to send logs: ${response.status}`);
      }
    } catch (error) {
      // Recoloca os logs na fila em caso de erro
      this.logs.unshift(...logsToSend);
      console.error('Failed to flush logs:', error);
    }
  }

  // Métodos para análise local
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: ErrorLog[];
    sessionInfo: {
      sessionId: string;
      duration: number;
      url: string;
    };
  } {
    const errorLogs = this.logs.filter(log => log.level === 'error');
    const errorsByType: Record<string, number> = {};
    
    errorLogs.forEach(log => {
      const type = log.context?.component || 'Unknown';
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    });

    return {
      totalErrors: errorLogs.length,
      errorsByType,
      recentErrors: errorLogs.slice(-10),
      sessionInfo: {
        sessionId: this.sessionId,
        duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
        url: window.location.href
      }
    };
  }
}

// Singleton export (lazy para evitar instanciação no servidor)
export const errorLogger = typeof window !== 'undefined' ? ErrorLogger.getInstance() : null as any;

// Helper functions para uso fácil
export const logError = (message: string, error?: Error, context?: ErrorContext) => {
  if (errorLogger) errorLogger.logError({ message, error, context });
};

export const logWarning = (message: string, context?: ErrorContext) => {
  if (errorLogger) errorLogger.logWarning(message, context);
};

export const logInfo = (message: string, context?: ErrorContext) => {
  if (errorLogger) errorLogger.logInfo(message, context);
};

export const logDebug = (message: string, context?: ErrorContext) => {
  if (errorLogger) errorLogger.logDebug(message, context);
};
