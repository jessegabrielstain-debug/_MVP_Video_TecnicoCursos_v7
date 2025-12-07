import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './styles/mobile-first.css';
import Providers from './components/providers';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './components/theme/theme-provider';
import { InteractiveTutorial } from './components/tutorial/tutorial-simple';
import { EmergencyErrorBoundary } from './lib/advanced-analytics-emergency';
import PWAInstallPrompt from './components/pwa/pwa-install-prompt';

import ProductionProvider from './components/providers/production-provider';
import GlobalButtonFix from './components/ui/button-fix-global';
import { AuthProvider } from '@/hooks/use-auth';
import { Navbar } from './components/layout/navbar';

// Import do sistema de correções melhorado
// import './lib/emergency-fixes-improved';

// Inicializar Sentry se configurado
if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
      replaysSessionSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? '0'),
      replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? '1'),
      environment: process.env.NODE_ENV,
      enabled: true,
    });
  }).catch(() => {
    console.warn('Sentry initialization failed');
  });
}

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Estúdio IA de Vídeos',
  description: 'Crie vídeos profissionais com inteligência artificial para treinamentos em segurança do trabalho',
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <EmergencyErrorBoundary>
          <ThemeProvider
            defaultTheme="light"
          >
            <Providers>
              <ProductionProvider>
                <AuthProvider>
                  <div className="relative">
                    <Navbar />
                    {children}
                    <PWAInstallPrompt />
                    <InteractiveTutorial />
                    <GlobalButtonFix />
                  </div>
                </AuthProvider>
              </ProductionProvider>
            </Providers>
          </ThemeProvider>
        </EmergencyErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}

