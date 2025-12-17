/**
 * Performance optimization utilities for dynamic imports and lazy loading
 * Eliminates chunk bloat by loading components on-demand
 */
import { lazy, ComponentType } from 'react';
import { logger } from '@/lib/logger';

// Cache for loaded components
const componentCache = new Map<string, ComponentType<any>>();

/**
 * Creates a dynamic import with retry mechanism and error handling
 */
export function createDynamicImport<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string,
  retryAttempts: number = 3,
  retryDelayMs: number = 1000
): ComponentType<T> {
  // Check cache first
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName)!;
  }

  const lazyComponent = lazy(() => {
    return retryImport(importFn, retryAttempts, retryDelayMs, componentName);
  });

  componentCache.set(componentName, lazyComponent);
  return lazyComponent;
}

/**
 * Retry import with exponential backoff
 */
async function retryImport<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  maxRetries: number,
  delayMs: number,
  componentName: string,
  attempt: number = 1
): Promise<{ default: ComponentType<T> }> {
  try {
    const result = await importFn();
    
    if (attempt > 1) {
      logger.info(`Dynamic import succeeded on attempt ${attempt}`, {
        component: componentName,
        attempt,
        totalAttempts: maxRetries
      });
    }
    
    return result;
  } catch (error) {
    if (attempt >= maxRetries) {
      logger.error(`Dynamic import failed after ${maxRetries} attempts`, error, {
        component: componentName,
        maxRetries
      });
      throw error;
    }

    const backoffDelay = delayMs * Math.pow(2, attempt - 1);
    
    logger.warn(`Dynamic import failed, retrying in ${backoffDelay}ms`, {
      component: componentName,
      attempt,
      maxRetries,
      error: (error as Error).message
    });

    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    return retryImport(importFn, maxRetries, delayMs, componentName, attempt + 1);
  }
}

/**
 * Preload a component without rendering
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>,
  componentName: string
): void {
  if (!componentCache.has(componentName)) {
    importFn()
      .then(() => {
        logger.debug(`Component preloaded successfully: ${componentName}`);
      })
      .catch((error) => {
        logger.warn(`Failed to preload component: ${componentName}`, {
          error: (error as Error).message
        });
      });
  }
}

/**
 * Utility to create commonly used dynamic imports
 * Reduces initial bundle size by splitting heavy components
 */
export const dynamicComponents = {
  // Editor components (heavy)
  CanvasEditor: () => createDynamicImport(
    () => import('@/components/editor/canvas-editor'),
    'CanvasEditor'
  ),
  
  TimelineEditor: () => createDynamicImport(
    () => import('@/components/timeline/timeline-editor'),
    'TimelineEditor'
  ),
  
  // Render components
  RenderQueue: () => createDynamicImport(
    () => import('@/components/render/render-queue'),
    'RenderQueue'
  ),
  
  // Analytics (charts/visualizations)
  Analytics: () => createDynamicImport(
    () => import('@/components/analytics/analytics-dashboard'),
    'Analytics'
  ),
  
  // Admin/settings components
  ComplianceDashboard: () => createDynamicImport(
    () => import('@/components/compliance/dashboard'),
    'ComplianceDashboard'
  ),
  
  UserSettings: () => createDynamicImport(
    () => import('@/components/settings/user-settings'),
    'UserSettings'
  )
};

/**
 * Batch preload components for better UX
 */
export function preloadCriticalComponents(): void {
  // Preload commonly used components after initial page load
  setTimeout(() => {
    preloadComponent(
      () => import('@/components/editor/canvas-editor'),
      'CanvasEditor'
    );
    
    preloadComponent(
      () => import('@/components/timeline/timeline-editor'),
      'TimelineEditor'
    );
  }, 2000); // Wait 2s after page load
}

/**
 * Clear component cache (useful for testing)
 */
export function clearComponentCache(): void {
  componentCache.clear();
}

/**
 * Get cache status for monitoring
 */
export function getComponentCacheStats() {
  return {
    totalCached: componentCache.size,
    cachedComponents: Array.from(componentCache.keys())
  };
}

/**
 * Progressive loading strategy
 * Load components based on user interaction patterns
 */
export function initializeProgressiveLoading(): void {
  // Intersection Observer for viewport-based loading
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const componentName = element.dataset.dynamicComponent;
          
          if (componentName && dynamicComponents[componentName as keyof typeof dynamicComponents]) {
            // Preload component when it comes into view
            const componentFactory = dynamicComponents[componentName as keyof typeof dynamicComponents];
            if (componentFactory) {
              componentFactory();
              observer.unobserve(element);
            }
          }
        }
      });
    }, {
      rootMargin: '50px' // Preload 50px before component enters viewport
    });
    
    // Observe elements with data-dynamic-component attribute
    document.querySelectorAll('[data-dynamic-component]').forEach((el) => {
      observer.observe(el);
    });
  }
}

export default {
  createDynamicImport,
  preloadComponent,
  dynamicComponents,
  preloadCriticalComponents,
  clearComponentCache,
  getComponentCacheStats,
  initializeProgressiveLoading
};