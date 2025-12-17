/**
 * FASE 4 - ANALYTICS COMPLETO
 * Hook React para Analytics e Tracking de Comportamento
 * 
 * Funcionalidades:
 * - Tracking automático de page views
 * - Captura de eventos de interação
 * - Métricas de engagement
 * - Performance do frontend
 */

'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface UserInteractionEvent {
  type: 'click' | 'scroll' | 'hover' | 'focus' | 'input' | 'submit';
  element: string;
  position?: { x: number; y: number };
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PageMetrics {
  url: string;
  title: string;
  loadTime: number;
  timeOnPage: number;
  scrollDepth: number;
  interactions: UserInteractionEvent[];
  exitType: 'navigation' | 'close' | 'refresh' | 'unknown';
}

export function useAnalytics() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const pathname = usePathname();
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUserId(data.user?.id ?? null);
      } catch (error) {
        logger.error('[Analytics] Falha ao obter usuário', error as Error, { component: 'useAnalytics' });
      }
    };

    void loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);
  
  // Refs para tracking
  const pageStartTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const interactions = useRef<UserInteractionEvent[]>([]);
  const lastActivityTime = useRef<number>(Date.now());
  const isPageVisible = useRef<boolean>(true);

  /**
   * Envia evento para a API de analytics
   */
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: event.category,
          action: event.action,
          label: event.label,
          metadata: {
            ...event.metadata,
            sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
            timestamp: Date.now(),
          },
          duration: event.value,
        }),
      });

      if (!response.ok) {
        logger.warn('[Analytics] Failed to track event', { event, component: 'useAnalytics' });
      }
    } catch (error) {
      logger.error('[Analytics] Error tracking event', error as Error, { component: 'useAnalytics' });
    }
  }, [sessionId]);

  /**
   * Tracking de page view
   */
  const trackPageView = useCallback(async (url?: string) => {
    const currentUrl = url || window.location.href;
    const title = document.title;
    
    await trackEvent({
      category: 'page_view',
      action: 'view',
      label: currentUrl,
      metadata: {
        title,
        referrer: document.referrer,
        loadTime: performance.now(),
      },
    });
  }, [trackEvent]);

  /**
   * Tracking de interações do usuário
   */
  const trackInteraction = useCallback(async (interaction: UserInteractionEvent) => {
    interactions.current.push(interaction);
    lastActivityTime.current = Date.now();

    // Enviar interações importantes imediatamente
    if (['submit', 'error'].includes(interaction.type)) {
      await trackEvent({
        category: 'user_interaction',
        action: interaction.type,
        label: interaction.element,
        metadata: {
          position: interaction.position,
          ...interaction.metadata,
        },
      });
    }
  }, [trackEvent]);

  /**
   * Tracking de cliques
   */
  const trackClick = useCallback((element: string, position?: { x: number; y: number }, metadata?: Record<string, unknown>) => {
    trackInteraction({
      type: 'click',
      element,
      position,
      timestamp: Date.now(),
      metadata,
    });
  }, [trackInteraction]);

  /**
   * Tracking de scroll depth
   */
  const trackScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const scrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
    
    if (scrollDepth > maxScrollDepth.current) {
      maxScrollDepth.current = scrollDepth;
      
      // Tracking de milestones de scroll
      const milestones = [25, 50, 75, 90, 100];
      const milestone = milestones.find(m => scrollDepth >= m && maxScrollDepth.current < m);
      
      if (milestone) {
        trackEvent({
          category: 'engagement',
          action: 'scroll_depth',
          label: `${milestone}%`,
          value: milestone,
        });
      }
    }
  }, [trackEvent]);

  /**
   * Tracking de tempo na página
   */
  const trackTimeOnPage = useCallback(async () => {
    const timeOnPage = Date.now() - pageStartTime.current;
    
    await trackEvent({
      category: 'engagement',
      action: 'time_on_page',
      value: timeOnPage,
      metadata: {
        timeOnPageSeconds: Math.round(timeOnPage / 1000),
        maxScrollDepth: maxScrollDepth.current,
        interactionCount: interactions.current.length,
      },
    });
  }, [trackEvent]);

  /**
   * Tracking de performance da página
   */
  const trackPagePerformance = useCallback(async () => {
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      const firstPaint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint');
      
      const connectionType =
        typeof navigator !== 'undefined' && 'connection' in navigator
          ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType ?? null
          : null;

      await trackEvent({
        category: 'performance',
        action: 'page_load',
        value: loadTime,
        metadata: {
          loadTime,
          domContentLoaded,
          firstPaint: firstPaint ? firstPaint.startTime : null,
          connectionType,
        },
      });
    }
  }, [trackEvent]);

  /**
   * Tracking de erros JavaScript
   */
  const trackError = useCallback(async (error: Error, errorInfo?: unknown) => {
    await trackEvent({
      category: 'error',
      action: 'javascript_error',
      label: error.message,
      metadata: {
        stack: error.stack,
        errorInfo,
        url: window.location.href,
      },
    });
  }, [trackEvent]);

  /**
   * Tracking de features utilizadas
   */
  const trackFeatureUsage = useCallback(async (feature: string, action: string, metadata?: Record<string, unknown>) => {
    await trackEvent({
      category: 'feature_usage',
      action: `${feature}_${action}`,
      label: feature,
      metadata,
    });
  }, [trackEvent]);

  /**
   * Tracking de conversões
   */
  const trackConversion = useCallback(async (conversionType: string, value?: number, metadata?: Record<string, unknown>) => {
    await trackEvent({
      category: 'conversion',
      action: conversionType,
      value,
      metadata,
    });
  }, [trackEvent]);

  // Setup de event listeners
  useEffect(() => {
    // Page view tracking
    trackPageView();
    
    // Performance tracking após load
    if (document.readyState === 'complete') {
      trackPagePerformance();
    } else {
      window.addEventListener('load', trackPagePerformance);
    }

    // Scroll tracking
    const handleScroll = () => trackScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Click tracking automático
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const element = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : '';
      const className = target.className ? `.${target.className.split(' ').join('.')}` : '';
      const selector = `${element}${id}${className}`;
      
      trackClick(selector, { x: event.clientX, y: event.clientY });
    };
    document.addEventListener('click', handleClick);

    // Visibility change tracking
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
      
      if (document.hidden) {
        trackTimeOnPage();
      } else {
        pageStartTime.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Error tracking
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };
    window.addEventListener('error', handleError);

    // Unhandled promise rejection tracking
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error('Unhandled Promise Rejection'), {
        reason: event.reason,
      });
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('load', trackPagePerformance);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      
      // Track final time on page
      trackTimeOnPage();
    };
  }, [pathname, trackPageView, trackPagePerformance, trackScroll, trackClick, trackTimeOnPage, trackError]);

  // Track route changes
  useEffect(() => {
    pageStartTime.current = Date.now();
    maxScrollDepth.current = 0;
    interactions.current = [];
    
    trackPageView();
  }, [pathname, trackPageView]);

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackInteraction,
    trackError,
    trackFeatureUsage,
    trackConversion,
    sessionId,
    userId,
  };
}

/**
 * Hook para tracking de formulários
 */
export function useFormAnalytics(formName: string) {
  const { trackEvent } = useAnalytics();

  const trackFormStart = useCallback(() => {
    trackEvent({
      category: 'form_interaction',
      action: 'form_start',
      label: formName,
    });
  }, [trackEvent, formName]);

  const trackFormSubmit = useCallback((success: boolean, errors?: string[]) => {
    trackEvent({
      category: 'form_interaction',
      action: success ? 'form_submit_success' : 'form_submit_error',
      label: formName,
      metadata: { errors },
    });
  }, [trackEvent, formName]);

  const trackFieldInteraction = useCallback((fieldName: string, action: 'focus' | 'blur' | 'change') => {
    trackEvent({
      category: 'form_interaction',
      action: `field_${action}`,
      label: `${formName}.${fieldName}`,
    });
  }, [trackEvent, formName]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFieldInteraction,
  };
}