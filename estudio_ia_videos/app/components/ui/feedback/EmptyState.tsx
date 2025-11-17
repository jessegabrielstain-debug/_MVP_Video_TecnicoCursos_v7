import React from 'react';

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
};

export function EmptyState({
  title = 'Nenhum registro encontrado',
  description = 'Adicione novos itens para começar.',
  icon = '📁',
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center" data-testid="empty-state">
      <div className="text-xl" aria-hidden>{icon}</div>
      <p className="font-medium text-sm text-neutral-800">{title}</p>
      {description && <p className="text-xs text-neutral-500 max-w-md">{description}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}