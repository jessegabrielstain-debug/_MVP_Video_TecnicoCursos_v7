/**
 * Loading Component - Componente de feedback de carregamento
 * 
 * Variantes: spinner, skeleton, dots, pulse
 * Tamanhos: sm, md, lg, xl
 * 
 * @module components/ui/feedback/loading
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const loadingVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        spinner: 'animate-spin rounded-full border-2 border-current border-t-transparent',
        dots: 'space-x-2',
        pulse: 'animate-pulse',
        skeleton: 'bg-muted rounded',
      },
      size: {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
      },
    },
    defaultVariants: {
      variant: 'spinner',
      size: 'md',
    },
  }
);

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  label?: string;
  fullScreen?: boolean;
}

const Dot = ({ className }: { className?: string }) => (
  <div className={cn('h-2 w-2 rounded-full bg-current animate-bounce', className)} />
);

export function Loading({
  className,
  variant = 'spinner',
  size = 'md',
  label,
  fullScreen = false,
  ...props
}: LoadingProps) {
  const content = (
    <div
      role="status"
      aria-label={label || 'Carregando...'}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
        className
      )}
      {...props}
    >
      {variant === 'dots' ? (
        <div className={cn(loadingVariants({ variant, size }))}>
          <Dot style={{ animationDelay: '0ms' }} />
          <Dot style={{ animationDelay: '150ms' }} />
          <Dot style={{ animationDelay: '300ms' }} />
        </div>
      ) : variant === 'skeleton' ? (
        <div className={cn(loadingVariants({ variant, size }), 'w-full')} />
      ) : (
        <div className={cn(loadingVariants({ variant, size }))} />
      )}

      {label && (
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      )}
    </div>
  );

  return content;
}

// Componentes auxiliares
export function LoadingPage({ message = 'Carregando página...' }: { message?: string }) {
  return <Loading variant="spinner" size="lg" label={message} fullScreen />;
}

export function LoadingButton({ className }: { className?: string }) {
  return (
    <Loading
      variant="spinner"
      size="sm"
      className={cn('mr-2', className)}
    />
  );
}

export function LoadingSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Loading
          key={i}
          variant="skeleton"
          size="md"
          className="h-4 w-full"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

Loading.displayName = 'Loading';
