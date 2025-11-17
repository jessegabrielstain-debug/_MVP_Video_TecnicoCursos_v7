
'use client';

/**
* 🔧 SPRINT 39 - PWA Provider
* Provider para inicializar PWA, offline sync e push notifications
*/

import { useEffect, useMemo, useState } from 'react';
import { pwaManager } from '@/lib/pwa/pwa-manager';
import { PublicOnboarding } from '@/components/onboarding/public-onboarding';
import { ProductTour, editorTourSteps } from '@/components/tour/product-tour';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { createBrowserSupabaseClient } from '@/lib/services';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUser(data.user ?? null);
      } catch (error) {
        console.error('Erro ao carregar sessão do usuário:', error);
      }
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const initPWA = async () => {
      try {
        await pwaManager.initialize();
        setInitialized(true);

        // Se usuário logado, solicitar permissão de notificações
        if (user) {
          const hasPermission = await Notification.permission;

          if (hasPermission === 'default') {
            // Aguardar 3 segundos antes de solicitar
            setTimeout(async () => {
              await pwaManager.requestNotificationPermission();
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar PWA:', error);
      }
    };

    initPWA();
  }, [user]);

  return (
    <>
      {children}

      {/* Onboarding para novos usuários */}
      {user && <PublicOnboarding />}

      {/* Tour do editor */}
      {user && <ProductTour steps={editorTourSteps} />}

      {/* Indicador offline */}
      <OfflineIndicator />
    </>
  );
}
