/**
 * Tree Shaking Utilities
 * Utilitários para remoção de dead code e otimização de bundle
 */

import { logger } from '../logger';

/**
 * Configurações para tree shaking
 */
export interface TreeShakingConfig {
  /** Analisa imports não utilizados */
  analyzeUnusedImports: boolean;
  /** Analisa código morto */
  analyzeDeadCode: boolean;
  /** Gera relatório detalhado */
  generateReport: boolean;
  /** Exclui padrões de análise */
  excludePatterns: string[];
}

/**
 * Resultado da análise de tree shaking
 */
export interface TreeShakingAnalysis {
  unusedImports: Array<{
    file: string;
    imports: string[];
    estimatedSavings: number; // em KB
  }>;
  deadCode: Array<{
    file: string;
    functions: string[];
    variables: string[];
    estimatedSavings: number; // em KB
  }>;
  totalPotentialSavings: number; // em KB
  recommendations: string[];
}

/**
 * Configuração padrão
 */
export const DEFAULT_TREE_SHAKING_CONFIG: TreeShakingConfig = {
  analyzeUnusedImports: true,
  analyzeDeadCode: true,
  generateReport: true,
  excludePatterns: [
    'node_modules',
    '__tests__',
    '.test.',
    '.spec.',
    'coverage',
    'dist',
    'build'
  ]
};

/**
 * Marca função como side-effect free para tree shaking
 */
export const PURE = /*#__PURE__*/ (() => {
  return function<T>(target: T): T {
    return target;
  };
})();

/**
 * Decorator para marcar funções como puras
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic function type required for decorator pattern
export function pure<T extends (...args: unknown[]) => unknown>(fn: T): T {
  // Adiciona comentário para bundlers (property específica usada por Webpack/Rollup)
  (fn as T & { __PURE__: boolean }).__PURE__ = true;
  return fn;
}

/**
 * Wrapper para imports condicionais (elimina código não usado)
 */
export const conditionalImport = {
  /**
   * Importa módulo apenas se condição for verdadeira
   */
  if: <T>(condition: boolean, importFn: () => Promise<T>): Promise<T | null> => {
    if (condition) {
      return importFn();
    }
    return Promise.resolve(null);
  },

  /**
   * Importa módulo apenas em desenvolvimento
   */
  dev: <T>(importFn: () => Promise<T>): Promise<T | null> => {
    return conditionalImport.if(process.env.NODE_ENV === 'development', importFn);
  },

  /**
   * Importa módulo apenas em produção
   */
  prod: <T>(importFn: () => Promise<T>): Promise<T | null> => {
    return conditionalImport.if(process.env.NODE_ENV === 'production', importFn);
  },

  /**
   * Importa módulo apenas no browser
   */
  browser: <T>(importFn: () => Promise<T>): Promise<T | null> => {
    return conditionalImport.if(typeof window !== 'undefined', importFn);
  },

  /**
   * Importa módulo apenas no servidor
   */
  server: <T>(importFn: () => Promise<T>): Promise<T | null> => {
    return conditionalImport.if(typeof window === 'undefined', importFn);
  }
};

/**
 * Utilitários para dead code elimination
 */
export const deadCodeElimination = {
  /**
   * Remove console.log em produção
   */
  debugLog: (...args: any[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
    // Em produção, este código será completamente removido
  },

  /**
   * Executa código apenas em desenvolvimento
   */
  devOnly: <T>(fn: () => T): T | undefined => {
    if (process.env.NODE_ENV === 'development') {
      return fn();
    }
    return undefined;
  },

  /**
   * Executa código apenas em produção
   */
  prodOnly: <T>(fn: () => T): T | undefined => {
    if (process.env.NODE_ENV === 'production') {
      return fn();
    }
    return undefined;
  },

  /**
   * Assertion que é removida em produção
   */
  assert: (condition: boolean, message?: string): void => {
    if (process.env.NODE_ENV === 'development') {
      if (!condition) {
        throw new Error(message || 'Assertion failed');
      }
    }
  }
};

/**
 * Otimizações específicas para bibliotecas grandes
 */
export const libraryOptimizations = {
  /**
   * Importa apenas partes necessárias do Lodash
   */
  lodash: {
    // Em vez de: import _ from 'lodash'
    // Use: import { debounce } from 'lodash/debounce'
    get: () => import('lodash/get'),
    set: () => import('lodash/set'),
    debounce: () => import('lodash/debounce'),
    throttle: () => import('lodash/throttle'),
    merge: () => import('lodash/merge'),
    cloneDeep: () => import('lodash/cloneDeep')
  },

  /**
   * Importa apenas ícones necessários do Lucide
   */
  icons: {
    // Em vez de: import * as Icons from 'lucide-react'
    // Use funções específicas
    Play: () => import('lucide-react').then(mod => ({ Play: mod.Play })),
    Pause: () => import('lucide-react').then(mod => ({ Pause: mod.Pause })),
    Square: () => import('lucide-react').then(mod => ({ Square: mod.Square })), // Square usado como ícone de Stop
    Settings: () => import('lucide-react').then(mod => ({ Settings: mod.Settings })),
    Download: () => import('lucide-react').then(mod => ({ Download: mod.Download }))
  },

  /**
   * Importa apenas utilitários necessários do date-fns
   */
  dateFns: {
    format: () => import('date-fns/format'),
    parseISO: () => import('date-fns/parseISO'),
    isValid: () => import('date-fns/isValid'),
    addDays: () => import('date-fns/addDays'),
    subDays: () => import('date-fns/subDays')
  }
};

/**
 * Analisador de bundle size
 */
export const bundleAnalyzer = {
  /**
   * Registra tamanho de módulo importado
   */
  logImportSize: <T>(moduleName: string, modulePromise: Promise<T>): Promise<T> => {
    const startTime = performance.now();
    
    return modulePromise.then(module => {
      const loadTime = performance.now() - startTime;
      
      logger.debug('Module imported', {
        component: 'BundleAnalyzer',
        moduleName,
        loadTime: Math.round(loadTime),
        moduleSize: JSON.stringify(module).length // Aproximação
      });

      return module;
    });
  },

  /**
   * Mede performance de import dinâmico
   */
  measureDynamicImport: async <T>(
    moduleName: string,
    importFn: () => Promise<T>
  ): Promise<{ module: T; metrics: { loadTime: number; estimatedSize: number } }> => {
    const startTime = performance.now();
    
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;
      const estimatedSize = JSON.stringify(module).length;

      const metrics = { loadTime, estimatedSize };

      logger.info('Dynamic import measured', {
        component: 'BundleAnalyzer',
        moduleName,
        ...metrics
      });

      return { module, metrics };
    } catch (error) {
      const loadTime = performance.now() - startTime;
      
      logger.error('Dynamic import failed', error, {
        component: 'BundleAnalyzer',
        moduleName,
        loadTime
      });

      throw error;
    }
  }
};

/**
 * Helpers para code splitting por feature
 */
export const featureSplitting = {
  /**
   * Carrega feature apenas quando necessária
   */
  loadFeature: async <T>(
    featureName: string,
    importFn: () => Promise<{ default: T }>,
    fallback?: T
  ): Promise<T> => {
    try {
      const startTime = performance.now();
      const module = await importFn();
      const loadTime = performance.now() - startTime;

      logger.debug('Feature loaded', {
        component: 'FeatureSplitting',
        featureName,
        loadTime: Math.round(loadTime)
      });

      return module.default;
    } catch (error) {
      logger.error('Failed to load feature', error, {
        component: 'FeatureSplitting',
        featureName
      });

      if (fallback !== undefined) {
        logger.info('Using fallback for feature', {
          component: 'FeatureSplitting',
          featureName
        });
        return fallback;
      }

      throw error;
    }
  },

  /**
   * Pre-carrega features com base na navegação do usuário
   */
  preloadFeatures: (features: Array<{ name: string; importFn: () => Promise<any> }>) => {
    features.forEach(({ name, importFn }, index) => {
      // Preload com delay escalonado
      setTimeout(() => {
        importFn().catch(error => {
          logger.debug('Feature preload failed (non-critical)', {
            component: 'FeatureSplitting',
            featureName: name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        });
      }, index * 500); // 500ms entre cada preload
    });
  }
};

/**
 * Webpack/Next.js specific optimizations
 */
export const webpackOptimizations = {
  /**
   * Magic comments para chunk naming
   */
  namedChunk: (chunkName: string) => (importFn: () => Promise<any>) => {
    // O comment será preservado pelo bundler
    return import(
      /* webpackChunkName: "[chunkName]" */
      /* webpackPrefetch: true */
      importFn.toString()
    );
  },

  /**
   * Prefetch de recursos
   */
  prefetch: (importFn: () => Promise<any>) => {
    // Marca como prefetch para o webpack
    return import(
      /* webpackPrefetch: true */
      importFn.toString()
    );
  },

  /**
   * Preload de recursos críticos
   */
  preload: (importFn: () => Promise<any>) => {
    // Marca como preload para o webpack
    return import(
      /* webpackPreload: true */
      importFn.toString()
    );
  }
};