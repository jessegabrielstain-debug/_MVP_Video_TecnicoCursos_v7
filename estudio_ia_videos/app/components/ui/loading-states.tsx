'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// =============================================================================
// SPINNER - Indicador de loading circular
// =============================================================================

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'secondary' | 'white'
  className?: string
}

const spinnerSizes = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[2.5px]',
  xl: 'h-12 w-12 border-3',
}

const spinnerVariants = {
  default: 'border-slate-200 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-300',
  primary: 'border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400',
  secondary: 'border-slate-200 dark:border-slate-800 border-t-slate-500 dark:border-t-slate-400',
  white: 'border-white/30 border-t-white',
}

export function Spinner({ size = 'md', variant = 'default', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        spinnerSizes[size],
        spinnerVariants[variant],
        className
      )}
      role="status"
      aria-label="Carregando"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  )
}

// =============================================================================
// PAGE LOADING - Loading de página inteira
// =============================================================================

interface PageLoadingProps {
  message?: string
  submessage?: string
}

export function PageLoading({ message = 'Carregando...', submessage }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <Spinner size="xl" variant="primary" className="mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-700 dark:text-slate-200">{message}</p>
        {submessage && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{submessage}</p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// INLINE LOADING - Loading inline (para botões, etc)
// =============================================================================

interface InlineLoadingProps {
  text?: string
  size?: SpinnerProps['size']
  className?: string
}

export function InlineLoading({ text = 'Carregando...', size = 'sm', className }: InlineLoadingProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Spinner size={size} />
      <span>{text}</span>
    </span>
  )
}

// =============================================================================
// SKELETON - Placeholder animado para conteúdo
// =============================================================================

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'rounded'
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-700',
        variantClasses[variant],
        className
      )}
    />
  )
}

// =============================================================================
// SKELETON CARD - Card com skeleton
// =============================================================================

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded" />
        <Skeleton className="h-8 w-16 rounded" />
      </div>
    </div>
  )
}

// =============================================================================
// SKELETON TABLE - Tabela com skeleton
// =============================================================================

interface SkeletonTableProps {
  rows?: number
  columns?: number
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
        >
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn('h-4 flex-1', colIndex === 0 && 'w-1/4 flex-none')}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// SKELETON LIST - Lista com skeleton
// =============================================================================

interface SkeletonListProps {
  items?: number
  showAvatar?: boolean
}

export function SkeletonList({ items = 3, showAvatar = false }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && <Skeleton variant="circular" className="h-10 w-10 flex-none" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// LOADING OVERLAY - Overlay com loading
// =============================================================================

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  blur?: boolean
  children: React.ReactNode
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Processando...', 
  blur = true,
  children 
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-50',
            blur && 'backdrop-blur-sm'
          )}
        >
          <div className="text-center">
            <Spinner size="lg" variant="primary" className="mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// BUTTON LOADING - Estado de loading para botões
// =============================================================================

interface ButtonLoadingProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}

export function ButtonLoading({ isLoading, loadingText, children }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2">
        <Spinner size="sm" variant="white" />
        {loadingText && <span>{loadingText}</span>}
      </span>
    )
  }
  return <>{children}</>
}

// =============================================================================
// PROGRESS BAR - Barra de progresso
// =============================================================================

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  animated?: boolean
  className?: string
}

const progressSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const progressVariants = {
  default: 'bg-blue-600 dark:bg-blue-500',
  success: 'bg-green-600 dark:bg-green-500',
  warning: 'bg-yellow-500 dark:bg-yellow-400',
  error: 'bg-red-600 dark:bg-red-500',
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  variant = 'default',
  animated = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden',
          progressSizes[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            progressVariants[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 text-right">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  )
}

// =============================================================================
// EMPTY STATE - Estado vazio
// =============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
