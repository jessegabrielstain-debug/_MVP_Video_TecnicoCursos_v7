/**
 * ErrorMessage Component
 * Componente de exibição de erros padronizado
 */

'use client';

import { AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  variant = 'error',
  details,
  onRetry,
  onDismiss,
  className,
}: ErrorMessageProps) {
  const variantStyles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      defaultTitle: 'Erro',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/10 dark:border-yellow-900/20 dark:text-yellow-400',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      defaultTitle: 'Atenção',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/10 dark:border-blue-900/20 dark:text-blue-400',
      icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
      defaultTitle: 'Informação',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        style.container,
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {style.icon}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h3 className="font-semibold">
                {title || style.defaultTitle}
              </h3>
              <p className="text-sm">
                {message}
              </p>
            </div>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Fechar mensagem"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {details && (
            <details className="text-xs opacity-70">
              <summary className="cursor-pointer hover:opacity-100">
                Ver detalhes
              </summary>
              <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded overflow-x-auto">
                {details}
              </pre>
            </details>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium underline hover:no-underline"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ErrorBoundary fallback component
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <ErrorMessage
        title="Algo deu errado"
        message="Ocorreu um erro inesperado ao carregar esta seção."
        details={error.message}
        onRetry={resetErrorBoundary}
        variant="error"
      />
    </div>
  );
}

/**
 * Inline error para uso em forms
 */
export function InlineError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-sm text-red-600 dark:text-red-400 flex items-center gap-1',
        className
      )}
      role="alert"
    >
      <AlertCircle className="w-4 h-4" />
      {message}
    </p>
  );
}
