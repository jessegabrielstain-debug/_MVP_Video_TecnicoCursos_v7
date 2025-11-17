import React from 'react';

type LoadingStateProps = {
  label?: string;
  description?: string;
  fullscreen?: boolean;
};

export function LoadingState({ label = 'Carregando...', description, fullscreen }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-2 py-6 text-center" aria-busy="true" data-testid="loading-state">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-neutral-300 border-t-primary" />
      <p className="font-medium text-sm text-neutral-700">{label}</p>
      {description && <p className="text-xs text-neutral-500 max-w-md">{description}</p>}
    </div>
  );
  if (fullscreen) {
    return <div className="flex items-center justify-center min-h-[40vh]">{content}</div>;
  }
  return content;
}