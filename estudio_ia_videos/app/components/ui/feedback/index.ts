/**
 * Feedback Components - Exportação centralizada
 * 
 * Componentes padronizados de feedback para a aplicação
 * 
 * @module components/ui/feedback
 */

// Componentes existentes
export * from './LoadingState';
export * from './ErrorState';
export * from './EmptyState';
export * from './AsyncBoundary';

// Novos componentes padronizados (Fase 3)
export {
  Loading,
  LoadingPage,
  LoadingButton,
  LoadingSkeleton,
  type LoadingProps,
} from './loading';

export {
  ErrorDisplay,
  ErrorPage,
  ErrorBoundaryFallback,
  ErrorInline,
  type ErrorProps,
} from './error';

export {
  SuccessDisplay,
  SuccessToast,
  SuccessInline,
  SuccessPage,
  type SuccessProps,
} from './success';