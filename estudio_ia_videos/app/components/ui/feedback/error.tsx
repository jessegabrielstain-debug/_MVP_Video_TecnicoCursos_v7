/**
 * Error Component - Componente de feedback de erro
 * 
 * Variantes: default, destructive, warning
 * Com opções de retry e detalhes técnicos
 * 
 * @module components/ui/feedback/error
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const errorVariants = cva(
  'rounded-lg border p-4 flex flex-col gap-3',
  {
    variants: {
      variant: {
        default: 'bg-background border-destructive/50 text-destructive',
        destructive: 'bg-destructive/10 border-destructive text-destructive',
        warning: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500/50 text-yellow-900 dark:text-yellow-200',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ErrorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorVariants> {
  title?: string;
  message: string;
  error?: Error;
  onRetry?: () => void;
  showDetails?: boolean;
  fullScreen?: boolean;
}

export function ErrorDisplay({
  className,
  variant = 'default',
  size = 'md',
  title,
  message,
  error,
  onRetry,
  showDetails = false,
  fullScreen = false,
  ...props
}: ErrorProps) {
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const Icon = variant === 'warning' ? AlertTriangle : 
               variant === 'destructive' ? XCircle : AlertCircle;

  const content = (
    <div
      role="alert"
      className={cn(
        errorVariants({ variant, size }),
        fullScreen && 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50',
        fullScreen && 'max-w-lg mx-auto',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 space-y-2">
          {title && (
            <h3 className="font-semibold">{title}</h3>
          )}
          
          <p className="text-sm leading-relaxed">{message}</p>

          {error && showDetails && (
            <details
              className="mt-2"
              open={detailsOpen}
              onToggle={(e) => setDetailsOpen(e.currentTarget.open)}
            >
              <summary className="cursor-pointer text-xs font-medium hover:underline">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 text-xs bg-muted/50 p-2 rounded overflow-auto max-h-40">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return content;
}

// Componentes auxiliares
export function ErrorPage({
  title = 'Erro',
  message = 'Ocorreu um erro ao carregar esta página.',
  error,
  onRetry,
}: {
  title?: string;
  message?: string;
  error?: Error;
  onRetry?: () => void;
}) {
  return (
    <ErrorDisplay
      variant="destructive"
      size="lg"
      title={title}
      message={message}
      error={error}
      onRetry={onRetry}
      showDetails={process.env.NODE_ENV === 'development'}
      fullScreen
    />
  );
}

export function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <ErrorPage
      title="Algo deu errado"
      message="Desculpe, ocorreu um erro inesperado. Por favor, tente novamente."
      error={error}
      onRetry={resetErrorBoundary}
    />
  );
}

export function ErrorInline({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <ErrorDisplay
      variant="warning"
      size="sm"
      message={message}
      className={cn('mt-2', className)}
    />
  );
}

ErrorDisplay.displayName = 'ErrorDisplay';
