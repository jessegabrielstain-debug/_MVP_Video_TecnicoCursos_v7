/**
 * Success Component - Componente de feedback de sucesso
 * 
 * Variantes: default, subtle, celebration
 * Com opções de auto-dismiss e ações customizadas
 * 
 * @module components/ui/feedback/success
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle, Check, X } from 'lucide-react';

const successVariants = cva(
  'rounded-lg border p-4 flex items-start gap-3',
  {
    variants: {
      variant: {
        default: 'bg-green-50 dark:bg-green-900/10 border-green-500/50 text-green-900 dark:text-green-200',
        subtle: 'bg-background border-green-500/30 text-foreground',
        celebration: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-500 text-green-900 dark:text-green-200',
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

export interface SuccessProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof successVariants> {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  autoDismiss?: number; // Tempo em ms para auto-dismiss
}

export function SuccessDisplay({
  className,
  variant = 'default',
  size = 'md',
  title,
  message,
  action,
  dismissible = false,
  onDismiss,
  autoDismiss,
  ...props
}: SuccessProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoDismiss && autoDismiss > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoDismiss);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      role="status"
      className={cn(
        successVariants({ variant, size }),
        'animate-in fade-in-0 slide-in-from-top-2 duration-300',
        className
      )}
      {...props}
    >
      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      
      <div className="flex-1 space-y-2">
        {title && (
          <h3 className="font-semibold">{title}</h3>
        )}
        
        <p className="text-sm leading-relaxed">{message}</p>

        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          >
            {action.label}
          </button>
        )}
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className="ml-auto flex-shrink-0 rounded-md p-1.5 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Componentes auxiliares
export function SuccessToast({
  message,
  autoDismiss = 5000,
  onDismiss,
}: {
  message: string;
  autoDismiss?: number;
  onDismiss?: () => void;
}) {
  return (
    <SuccessDisplay
      variant="default"
      size="sm"
      message={message}
      dismissible
      autoDismiss={autoDismiss}
      onDismiss={onDismiss}
      className="fixed top-4 right-4 z-50 max-w-md shadow-lg"
    />
  );
}

export function SuccessInline({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-green-700 dark:text-green-400', className)}>
      <Check className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessPage({
  title = 'Sucesso!',
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <SuccessDisplay
        variant="celebration"
        size="lg"
        title={title}
        message={message}
        action={action}
        className="max-w-lg mx-auto shadow-2xl"
      />
    </div>
  );
}

SuccessDisplay.displayName = 'SuccessDisplay';
