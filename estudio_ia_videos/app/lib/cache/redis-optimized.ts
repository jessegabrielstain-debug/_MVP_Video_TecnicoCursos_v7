/**
 * Redis Optimized Cache
 * Cache otimizado usando Redis (ou fallback in-memory)
 */

export interface CacheEntry<T = unknown> {
  value: T;
  expiresAt?: number;
}

export class RedisOptimizedCache {
  private cache: Map<string, CacheEntry> = new Map();
  private connected = false;
  
  async connect(): Promise<boolean> {
    // Placeholder - conectar Redis real
    console.log('[Cache] Using in-memory fallback (Redis not configured)');
    this.connected = true;
    return true;
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    this.cache.set(key, { value, expiresAt });
  }
  
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  async del(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    if (!pattern) return allKeys;
    
    // Suporte básico para * wildcard
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(k => regex.test(k));
  }

  async getStats() {
    const now = Date.now();
    let expired = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expired += 1;
      }
    }

    return {
      connected: this.connected,
      keys: this.cache.size,
      expired,
    };
  }

  async healthCheck() {
    const started = Date.now();

    if (!this.connected) {
      await this.connect();
    }

    return {
      healthy: this.connected,
      latency: Date.now() - started,
      timestamp: new Date().toISOString(),
    };
  }
}

export const redisOptimized = new RedisOptimizedCache();
