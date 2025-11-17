import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingState, ErrorState, EmptyState, AsyncBoundary } from '../../components/ui/feedback';

describe('UI Feedback components', () => {
  test('LoadingState renders label', () => {
    render(<LoadingState label="Carregando dados" />);
    expect(screen.getByText('Carregando dados')).toBeInTheDocument();
  });
  test('ErrorState renders message and retry button', () => {
    const fn = jest.fn();
    render(<ErrorState title="Falha" message="Erro temporário" onRetry={fn} />);
    expect(screen.getByText('Falha')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  test('EmptyState renders description', () => {
    render(<EmptyState description="Nada aqui" />);
    expect(screen.getByText('Nada aqui')).toBeInTheDocument();
  });
  test('AsyncBoundary resolves promise', async () => {
    const p = Promise.resolve('ok');
    render(<AsyncBoundary promise={p}>{data => <div>{data}</div>}</AsyncBoundary>);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    const resolved = await screen.findByText('ok');
    expect(resolved).toBeInTheDocument();
  });
});