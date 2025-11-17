import React from 'react';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

type AsyncBoundaryProps<T> = {
  promise: Promise<T>;
  children: (data: T) => React.ReactNode;
  loadingLabel?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
};

export function AsyncBoundary<T>({
  promise,
  children,
  loadingLabel,
  errorTitle,
  errorMessage,
  onRetry,
}: AsyncBoundaryProps<T>) {
  const [state, setState] = React.useState<'pending' | 'fulfilled' | 'rejected'>('pending');
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    let mounted = true;
    promise
      .then(d => {
        if (mounted) {
          setData(d);
          setState('fulfilled');
        }
      })
      .catch(e => {
        if (mounted) {
          setError(e);
          setState('rejected');
        }
      });
    return () => {
      mounted = false;
    };
  }, [promise]);

  if (state === 'pending') return <LoadingState label={loadingLabel} />;
  if (state === 'rejected') return <ErrorState title={errorTitle} message={errorMessage} onRetry={onRetry} />;
  return <>{data && children(data)}</>;
}