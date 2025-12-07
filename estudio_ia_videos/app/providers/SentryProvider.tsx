'use client';

import { useEffect } from 'react';
import { initSentry } from '@/lib/monitoring/sentry.client';

/**
 * Provider para inicializar Sentry no cliente
 */
export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSentry();
  }, []);

  return <>{children}</>;
}
