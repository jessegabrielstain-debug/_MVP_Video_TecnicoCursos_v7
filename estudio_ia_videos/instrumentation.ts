/**
 * Next.js Instrumentation
 * Inicialização de serviços antes do servidor iniciar
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Inicializar Sentry no servidor
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSentry } = await import('./app/lib/monitoring/sentry.server');
    initSentry();
  }
  
  // Inicializar Sentry no Edge Runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initSentry } = await import('./app/lib/monitoring/sentry.server');
    initSentry();
  }
}
