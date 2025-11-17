import React from 'react';

type ErrorStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onRetry?: () => void;
  fullscreen?: boolean;
};

export function ErrorState({
  title = 'Ocorreu um erro',
  message = 'Tente novamente em alguns instantes.',
  actionLabel = 'Recarregar',
  onRetry,
  fullscreen,
}: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-3 py-6 text-center" role="alert" data-testid="error-state">
      <div className="text-red-600" aria-hidden>⚠️</div>
      <p className="font-semibold text-sm text-neutral-800">{title}</p>
      {message && <p className="text-xs text-neutral-600 max-w-md">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 rounded bg-red-600/90 hover:bg-red-600 text-white text-xs font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
  if (fullscreen) return <div className="flex items-center justify-center min-h-[40vh]">{content}</div>;
  return content;
}