/**
 * Cache Manager
 * Gerenciador de cache in-memory e persistente
 */

export interface CacheOptions {
  ttl?: number; // Time to live em segundos
  maxSize?: number;
}

export interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 300; // 5 minutos
  private maxSize = 1000;
  
  constructor(options?: CacheOptions) {
    if (options?.ttl) this.defaultTTL = options.ttl;
    if (options?.maxSize) this.maxSize = options.maxSize;
  }
  
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL) * 1000;
    
    this.cache.set(key, { value, expiresAt });
    
    // Limpar cache se exceder tamanho máximo
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Verificar expiração
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
  
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }
}

export const cacheManager = new CacheManager();
