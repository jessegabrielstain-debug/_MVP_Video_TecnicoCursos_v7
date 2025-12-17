/**
 * Cache Invalidation Strategy
 * Estratégia de invalidação de cache via webhooks e eventos
 */

import { logger } from '../logger';

export type CacheKey = string;
export type CacheTag = string;

export interface CacheInvalidationConfig {
  /** TTL padrão em segundos */
  defaultTTL: number;
  /** Máximo de entradas no cache */
  maxEntries: number;
  /** Intervalo de limpeza em ms */
  cleanupInterval: number;
}

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  tags: Set<CacheTag>;
  lastAccessed: number;
}

/**
 * Cache com suporte a invalidação por tags
 */
export class TaggedCache {
  private cache = new Map<CacheKey, CacheEntry>();
  private tagIndex = new Map<CacheTag, Set<CacheKey>>();
  private cleanupTimer?: NodeJS.Timeout;
  private expiredEntriesCount = 0;

  constructor(private config: CacheInvalidationConfig) {
    this.startCleanup();
  }

  /**
   * Armazena um valor com tags associadas
   */
  set<T>(
    key: CacheKey, 
    value: T, 
    options: {
      ttl?: number;
      tags?: CacheTag[];
    } = {}
  ): void {
    const { ttl = this.config.defaultTTL, tags = [] } = options;
    const now = Date.now();
    const expiresAt = now + (ttl * 1000);

    // Remove entrada anterior se existir
    this.delete(key);

    // Cria nova entrada
    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      tags: new Set(tags),
      lastAccessed: now
    };

    this.cache.set(key, entry);

    // Indexa por tags
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }

    logger.debug('Cache entry set', {
      component: 'TaggedCache',
      key,
      ttl,
      tags,
      expiresAt: new Date(expiresAt).toISOString()
    });
  }

  /**
   * Recupera um valor do cache
   */
  get<T>(key: CacheKey): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    
    // Verifica expiração
    if (now > entry.expiresAt) {
      this.expiredEntriesCount++; // Conta a entrada expirada
      this.delete(key);
      return undefined;
    }

    // Atualiza último acesso
    entry.lastAccessed = now;

    logger.debug('Cache hit', {
      component: 'TaggedCache',
      key,
      expiresIn: Math.round((entry.expiresAt - now) / 1000)
    });

    return entry.value as T;
  }

  /**
   * Remove uma entrada específica
   */
  delete(key: CacheKey): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Remove das tags
    for (const tag of entry.tags) {
      const keySet = this.tagIndex.get(tag);
      if (keySet) {
        keySet.delete(key);
        if (keySet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }

    this.cache.delete(key);

    logger.debug('Cache entry deleted', {
      component: 'TaggedCache',
      key
    });

    return true;
  }

  /**
   * Invalida todas as entradas com uma tag específica
   */
  invalidateByTag(tag: CacheTag): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) {
      return 0;
    }

    let invalidatedCount = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        invalidatedCount++;
      }
    }

    logger.info('Cache invalidated by tag', {
      component: 'TaggedCache',
      tag,
      invalidatedCount
    });

    return invalidatedCount;
  }

  /**
   * Invalida múltiplas tags
   */
  invalidateByTags(tags: CacheTag[]): number {
    let totalInvalidated = 0;
    for (const tag of tags) {
      totalInvalidated += this.invalidateByTag(tag);
    }
    return totalInvalidated;
  }

  /**
   * Limpa entradas expiradas automaticamente (periodicidade)
   */
  private cleanup(): void {
    const cleanedCount = this.forceCleanup();

    // Remove entradas menos acessadas se cache está muito grande
    if (this.cache.size > this.config.maxEntries) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = entries.slice(0, entries.length - this.config.maxEntries);
      for (const [key] of toRemove) {
        this.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Cache cleanup completed', {
        component: 'TaggedCache',
        cleanedCount,
        remainingEntries: this.cache.size
      });
    }
  }

  /**
   * Inicia timer de limpeza
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Para timer de limpeza
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Estatísticas do cache
   */
  getStats() {
    const now = Date.now();
    let currentExpiredCount = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        currentExpiredCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: this.expiredEntriesCount + currentExpiredCount, // Total histórico + atuais
      activeEntries: this.cache.size - currentExpiredCount,
      totalTags: this.tagIndex.size
    };
  }

  /**
   * Força limpeza manual de entradas expiradas
   */
  forceCleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.expiredEntriesCount++; // Conta a entrada expirada
        this.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

/**
 * Cache invalidation handlers para diferentes tipos de eventos
 */
export class CacheInvalidationHandlers {
  constructor(private cache: TaggedCache) {}

  /**
   * Invalida cache quando projeto é atualizado
   */
  onProjectUpdated(projectId: string): void {
    this.cache.invalidateByTags([
      `project:${projectId}`,
      `user:projects`,
      'projects:list'
    ]);
  }

  /**
   * Invalida cache quando render job é completado
   */
  onRenderJobCompleted(jobId: string, projectId: string): void {
    this.cache.invalidateByTags([
      `render:${jobId}`,
      `project:${projectId}:renders`,
      `project:${projectId}`,
      'renders:active',
      'renders:list'
    ]);
  }

  /**
   * Invalida cache quando slides são atualizados
   */
  onSlidesUpdated(projectId: string): void {
    this.cache.invalidateByTags([
      `project:${projectId}:slides`,
      `project:${projectId}`,
      'slides:list'
    ]);
  }

  /**
   * Invalida cache quando template é atualizado
   */
  onTemplateUpdated(templateId: string): void {
    this.cache.invalidateByTags([
      `template:${templateId}`,
      'templates:list',
      'templates:featured'
    ]);
  }

  /**
   * Invalida cache quando usuário é atualizado
   */
  onUserUpdated(userId: string): void {
    this.cache.invalidateByTags([
      `user:${userId}`,
      `user:${userId}:projects`,
      `user:${userId}:settings`
    ]);
  }

  /**
   * Invalida cache quando configurações do sistema são atualizadas
   */
  onSystemConfigUpdated(): void {
    this.cache.invalidateByTags([
      'system:config',
      'system:templates',
      'system:settings'
    ]);
  }
}

/**
 * Configuração padrão do cache
 */
export const DEFAULT_CACHE_CONFIG: CacheInvalidationConfig = {
  defaultTTL: 300, // 5 minutos
  maxEntries: 10000,
  cleanupInterval: 60000 // 1 minuto
};

/**
 * Instância global do cache com tags
 */
export const globalTaggedCache = new TaggedCache(DEFAULT_CACHE_CONFIG);

/**
 * Instância global dos handlers de invalidação
 */
export const cacheInvalidationHandlers = new CacheInvalidationHandlers(globalTaggedCache);

/**
 * Helper para criar chaves de cache consistentes
 */
export const createCacheKey = (...parts: string[]): CacheKey => {
  return parts.join(':');
};

/**
 * Decorador para cachear resultados de funções
 */
export function cached<T extends (...args: any[]) => any>(
  options: {
    ttl?: number;
    tags?: CacheTag[];
    keyGenerator?: (...args: Parameters<T>) => CacheKey;
  } = {}
) {
  return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    // Se descriptor não for fornecido, cria um
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {
        value: target[propertyKey],
        writable: true,
        configurable: true,
        enumerable: false
      };
    }

    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error(`@cached can only be applied to methods, not ${typeof originalMethod}`);
    }

    descriptor.value = function(...args: Parameters<T>): ReturnType<T> {
      const { 
        ttl = DEFAULT_CACHE_CONFIG.defaultTTL,
        tags = [],
        keyGenerator = (...args) => createCacheKey(target.constructor.name, propertyKey, ...args.map(String))
      } = options;

      const cacheKey = keyGenerator(...args);
      
      // Tenta recuperar do cache
      const cached = globalTaggedCache.get<ReturnType<T>>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Executa função original
      const result = originalMethod.apply(this, args);

      // Armazena no cache
      globalTaggedCache.set(cacheKey, result, { ttl, tags });

      return result;
    };

    return descriptor;
  };
}