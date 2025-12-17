/**
 * DataLoader - Batch Loading & Request Deduplication
 * 
 * Implementação otimizada para batching de queries ao Supabase.
 * Baseado no padrão DataLoader do Facebook, otimizado para Next.js.
 * 
 * Features:
 * - Batching automático de requests dentro do mesmo tick
 * - Deduplicação de requests idênticos
 * - Cache in-memory por request
 * - Métricas de performance integradas
 * 
 * @example
 * ```ts
 * const userLoader = createDataLoader<string, User>(
 *   async (ids) => {
 *     const { data } = await supabase
 *       .from('users')
 *       .select('*')
 *       .in('id', ids);
 *     return ids.map(id => data?.find(u => u.id === id) ?? null);
 *   }
 * );
 * 
 * // Estas chamadas serão batched em uma única query
 * const [user1, user2, user3] = await Promise.all([
 *   userLoader.load('id1'),
 *   userLoader.load('id2'),
 *   userLoader.load('id3'),
 * ]);
 * ```
 */

import { logger } from '../logger';
import { recordDbQuery } from '../observability/custom-metrics';

// =============================================================================
// Types
// =============================================================================

export interface DataLoaderOptions<K, V> {
  /** Função que carrega um batch de items */
  batchLoadFn: BatchLoadFn<K, V>;
  /** Máximo de items por batch (default: 100) */
  maxBatchSize?: number;
  /** Função para gerar cache key (default: JSON.stringify) */
  cacheKeyFn?: (key: K) => string;
  /** Habilitar cache (default: true) */
  cache?: boolean;
  /** Nome do loader para métricas */
  name?: string;
  /** Timeout para batch em ms (default: 0 - próximo tick) */
  batchScheduleMs?: number;
}

export type BatchLoadFn<K, V> = (keys: readonly K[]) => Promise<(V | Error)[]>;

interface PendingRequest<V> {
  resolve: (value: V | PromiseLike<V>) => void;
  reject: (reason: unknown) => void;
}

interface BatchQueue<K, V> {
  keys: K[];
  callbacks: PendingRequest<V>[];
  hasDispatched: boolean;
}

export interface DataLoaderStats {
  name: string;
  totalLoads: number;
  batchCount: number;
  cacheHits: number;
  cacheMisses: number;
  avgBatchSize: number;
  maxBatchSize: number;
  totalLoadTime: number;
  avgLoadTime: number;
  errors: number;
}

// =============================================================================
// DataLoader Implementation
// =============================================================================

export class DataLoader<K, V> {
  private readonly batchLoadFn: BatchLoadFn<K, V>;
  private readonly maxBatchSize: number;
  private readonly cacheKeyFn: (key: K) => string;
  private readonly cacheEnabled: boolean;
  private readonly name: string;
  private readonly batchScheduleMs: number;
  
  private cache: Map<string, Promise<V>> = new Map();
  private queue: BatchQueue<K, V> | null = null;
  
  // Stats
  private stats: DataLoaderStats;
  
  constructor(options: DataLoaderOptions<K, V>) {
    this.batchLoadFn = options.batchLoadFn;
    this.maxBatchSize = options.maxBatchSize ?? 100;
    this.cacheKeyFn = options.cacheKeyFn ?? defaultCacheKeyFn;
    this.cacheEnabled = options.cache ?? true;
    this.name = options.name ?? 'anonymous';
    this.batchScheduleMs = options.batchScheduleMs ?? 0;
    
    this.stats = {
      name: this.name,
      totalLoads: 0,
      batchCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgBatchSize: 0,
      maxBatchSize: 0,
      totalLoadTime: 0,
      avgLoadTime: 0,
      errors: 0,
    };
  }
  
  /**
   * Carrega um único item pelo key.
   * Requests dentro do mesmo tick serão batched automaticamente.
   */
  async load(key: K): Promise<V> {
    const cacheKey = this.cacheKeyFn(key);
    
    // Check cache
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
      this.stats.cacheMisses++;
    }
    
    this.stats.totalLoads++;
    
    // Create promise and add to queue
    const promise = new Promise<V>((resolve, reject) => {
      // Get or create queue
      const queue = this.getOrCreateQueue();
      queue.keys.push(key);
      queue.callbacks.push({ resolve, reject });
      
      // Check if we should dispatch immediately due to batch size
      if (queue.keys.length >= this.maxBatchSize) {
        this.dispatchQueue();
      }
    });
    
    // Cache the promise (not the result)
    if (this.cacheEnabled) {
      this.cache.set(cacheKey, promise);
    }
    
    return promise;
  }
  
  /**
   * Carrega múltiplos items.
   * Mais eficiente que múltiplas chamadas a load().
   */
  async loadMany(keys: readonly K[]): Promise<(V | Error)[]> {
    return Promise.all(
      keys.map(key => 
        this.load(key).catch(error => 
          error instanceof Error ? error : new Error(String(error))
        )
      )
    );
  }
  
  /**
   * Remove um item do cache.
   */
  clear(key: K): this {
    const cacheKey = this.cacheKeyFn(key);
    this.cache.delete(cacheKey);
    return this;
  }
  
  /**
   * Limpa todo o cache.
   */
  clearAll(): this {
    this.cache.clear();
    return this;
  }
  
  /**
   * Prime o cache com um valor conhecido.
   */
  prime(key: K, value: V): this {
    const cacheKey = this.cacheKeyFn(key);
    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, Promise.resolve(value));
    }
    return this;
  }
  
  /**
   * Retorna estatísticas do loader.
   */
  getStats(): DataLoaderStats {
    return { ...this.stats };
  }
  
  /**
   * Reseta estatísticas.
   */
  resetStats(): this {
    this.stats = {
      name: this.name,
      totalLoads: 0,
      batchCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgBatchSize: 0,
      maxBatchSize: 0,
      totalLoadTime: 0,
      avgLoadTime: 0,
      errors: 0,
    };
    return this;
  }
  
  private getOrCreateQueue(): BatchQueue<K, V> {
    if (!this.queue) {
      this.queue = {
        keys: [],
        callbacks: [],
        hasDispatched: false,
      };
      
      // Schedule dispatch
      this.scheduleDispatch();
    }
    return this.queue;
  }
  
  private scheduleDispatch(): void {
    if (this.batchScheduleMs > 0) {
      setTimeout(() => this.dispatchQueue(), this.batchScheduleMs);
    } else {
      // Use setImmediate for Node.js or queueMicrotask for browsers
      if (typeof setImmediate !== 'undefined') {
        setImmediate(() => this.dispatchQueue());
      } else {
        queueMicrotask(() => this.dispatchQueue());
      }
    }
  }
  
  private dispatchQueue(): void {
    const queue = this.queue;
    if (!queue || queue.hasDispatched) return;
    
    queue.hasDispatched = true;
    this.queue = null;
    
    const { keys, callbacks } = queue;
    if (keys.length === 0) return;
    
    this.stats.batchCount++;
    this.stats.maxBatchSize = Math.max(this.stats.maxBatchSize, keys.length);
    this.stats.avgBatchSize = 
      (this.stats.avgBatchSize * (this.stats.batchCount - 1) + keys.length) / 
      this.stats.batchCount;
    
    const startTime = performance.now();
    
    // Execute batch load
    this.batchLoadFn(keys)
      .then(values => {
        const duration = performance.now() - startTime;
        this.stats.totalLoadTime += duration;
        this.stats.avgLoadTime = this.stats.totalLoadTime / this.stats.batchCount;
        
        // Record metrics
        recordDbQuery('batch_load', this.name, duration);
        
        logger.debug(`[DataLoader:${this.name}] Batch loaded ${keys.length} items in ${duration.toFixed(2)}ms`);
        
        // Validate response length
        if (values.length !== keys.length) {
          const error = new Error(
            `DataLoader batch function must return array of same length as keys. ` +
            `Got ${values.length} values for ${keys.length} keys.`
          );
          callbacks.forEach(cb => cb.reject(error));
          return;
        }
        
        // Resolve each callback
        for (let i = 0; i < callbacks.length; i++) {
          const value = values[i];
          if (value instanceof Error) {
            this.stats.errors++;
            callbacks[i].reject(value);
          } else {
            callbacks[i].resolve(value);
          }
        }
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        this.stats.totalLoadTime += duration;
        this.stats.avgLoadTime = this.stats.totalLoadTime / this.stats.batchCount;
        this.stats.errors += keys.length;
        
        recordDbQuery('batch_load_error', this.name, duration);
        
        logger.error(`[DataLoader:${this.name}] Batch load failed`, error instanceof Error ? error : new Error(String(error)));
        
        // Reject all callbacks
        callbacks.forEach(cb => cb.reject(error));
      });
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Cria um novo DataLoader com opções simplificadas.
 */
export function createDataLoader<K, V>(
  batchLoadFn: BatchLoadFn<K, V>,
  options?: Omit<DataLoaderOptions<K, V>, 'batchLoadFn'>
): DataLoader<K, V> {
  return new DataLoader({ batchLoadFn, ...options });
}

/**
 * Default cache key function - handles primitives and objects
 */
function defaultCacheKeyFn<K>(key: K): string {
  if (key === null) return 'null';
  if (key === undefined) return 'undefined';
  if (typeof key === 'object') return JSON.stringify(key);
  return String(key);
}

// =============================================================================
// Request-Scoped DataLoader Registry
// =============================================================================

/**
 * Registry para gerenciar DataLoaders por request.
 * Em Next.js, cada request deve ter sua própria instância.
 */
export class DataLoaderRegistry {
  private loaders: Map<string, DataLoader<unknown, unknown>> = new Map();
  private static instance: DataLoaderRegistry | null = null;
  
  private constructor() {}
  
  /**
   * Get singleton instance (for server-side use).
   * WARNING: Em produção, use request-scoped instances via getOrCreate.
   */
  static getInstance(): DataLoaderRegistry {
    if (!DataLoaderRegistry.instance) {
      DataLoaderRegistry.instance = new DataLoaderRegistry();
    }
    return DataLoaderRegistry.instance;
  }
  
  /**
   * Cria uma nova registry para um request específico.
   */
  static create(): DataLoaderRegistry {
    return new DataLoaderRegistry();
  }
  
  /**
   * Registra ou retorna um DataLoader existente.
   */
  getOrCreate<K, V>(
    name: string,
    factory: () => DataLoader<K, V>
  ): DataLoader<K, V> {
    let loader = this.loaders.get(name);
    if (!loader) {
      loader = factory() as DataLoader<unknown, unknown>;
      this.loaders.set(name, loader);
    }
    return loader as DataLoader<K, V>;
  }
  
  /**
   * Remove um loader da registry.
   */
  remove(name: string): boolean {
    return this.loaders.delete(name);
  }
  
  /**
   * Limpa todos os loaders.
   */
  clear(): void {
    this.loaders.clear();
  }
  
  /**
   * Retorna estatísticas de todos os loaders.
   */
  getAllStats(): DataLoaderStats[] {
    return Array.from(this.loaders.values()).map(loader => loader.getStats());
  }
  
  /**
   * Limpa cache de todos os loaders.
   */
  clearAllCaches(): void {
    this.loaders.forEach(loader => loader.clearAll());
  }
}

// =============================================================================
// Pre-built Loaders for Common Entities
// =============================================================================

import { createClient } from '@supabase/supabase-js';

/**
 * Tipo para resultado de batch load nullable.
 */
export type NullableResult<T> = T | null;

/**
 * Cria um loader genérico para qualquer tabela do Supabase.
 */
export function createSupabaseLoader<T extends Record<string, unknown>>(
  table: string,
  idColumn: string = 'id',
  options?: {
    select?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
  }
): DataLoader<string, NullableResult<T>> {
  const url = options?.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = options?.supabaseKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  
  const supabase = createClient(url, key);
  const selectColumns = options?.select ?? '*';
  
  return createDataLoader<string, NullableResult<T>>(
    async (ids) => {
      const { data, error } = await supabase
        .from(table)
        .select(selectColumns)
        .in(idColumn, ids as string[]);
      
      if (error) {
        logger.error(`[SupabaseLoader:${table}] Query failed`, error);
        // Return null for all items on error (not Error objects due to type constraint)
        return ids.map(() => null);
      }
      
      // Map results back to original order
      const dataMap = new Map((data as unknown as T[]).map(item => [item[idColumn], item]));
      return ids.map(id => dataMap.get(id) as T ?? null);
    },
    { name: `supabase:${table}` }
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Agrupa items por uma chave e carrega dados relacionados.
 * Útil para resolver relacionamentos N+1.
 */
export async function batchResolve<T, K, R>(
  items: T[],
  keyExtractor: (item: T) => K,
  loader: DataLoader<K, R>
): Promise<Map<K, R>> {
  const keys = [...new Set(items.map(keyExtractor))];
  const results = await loader.loadMany(keys);
  
  const map = new Map<K, R>();
  for (let i = 0; i < keys.length; i++) {
    const result = results[i];
    if (!(result instanceof Error)) {
      map.set(keys[i], result);
    }
  }
  
  return map;
}

/**
 * Resolve relacionamentos para uma lista de items.
 */
export async function resolveRelation<T, K, R>(
  items: T[],
  keyExtractor: (item: T) => K,
  loader: DataLoader<K, R>,
  setter: (item: T, related: R | null) => void
): Promise<T[]> {
  const relationMap = await batchResolve(items, keyExtractor, loader);
  
  for (const item of items) {
    const key = keyExtractor(item);
    const related = relationMap.get(key) ?? null;
    setter(item, related);
  }
  
  return items;
}

// =============================================================================
// Exports
// =============================================================================

export { defaultCacheKeyFn };
