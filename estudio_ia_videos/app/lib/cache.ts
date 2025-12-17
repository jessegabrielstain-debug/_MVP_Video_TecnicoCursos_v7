/**
 * In-Memory Cache with TTL Support
 * 
 * Provides a simple caching layer with automatic expiration.
 * Use for caching expensive computations, API responses, or DB queries.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  expirations: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    expirations: 0,
  }
  private cleanupInterval: ReturnType<typeof setInterval> | null = null
  private defaultTTL: number

  constructor(options: { defaultTTL?: number; cleanupIntervalMs?: number } = {}) {
    this.defaultTTL = options.defaultTTL ?? 60_000 // 1 minute default
    
    // Start cleanup interval
    const cleanupMs = options.cleanupIntervalMs ?? 30_000 // 30s
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupMs)
    
    // Prevent interval from keeping Node.js alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      this.stats.misses++
      return undefined
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.expirations++
      this.stats.misses++
      return undefined
    }
    
    this.stats.hits++
    return entry.value
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL
    const now = Date.now()
    
    this.cache.set(key, {
      value,
      createdAt: now,
      expiresAt: now + ttl,
    })
    
    this.stats.sets++
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.deletes++
    }
    return deleted
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.expirations++
      return false
    }
    
    return true
  }

  /**
   * Get or set pattern - returns cached value or computes and caches new value
   */
  async getOrSet<T>(
    key: string,
    factory: () => T | Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }
    
    const value = await factory()
    this.set(key, value, ttlMs)
    return value
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { size: number; hitRate: number } {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        this.stats.expirations++
        removed++
      }
    }
    
    return removed
  }

  /**
   * Get all keys (including potentially expired ones)
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Invalidate entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let removed = 0
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        this.stats.deletes++
        removed++
      }
    }
    return removed
  }

  /**
   * Stop cleanup interval (call on shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let cacheInstance: MemoryCache | null = null

export function getCache(): MemoryCache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache({
      defaultTTL: 60_000, // 1 minute
      cleanupIntervalMs: 30_000, // 30 seconds
    })
  }
  return cacheInstance
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Cache helper with namespace support
 */
export function createCacheNamespace(namespace: string) {
  const cache = getCache()
  
  return {
    get: <T>(key: string): T | undefined => cache.get<T>(`${namespace}:${key}`),
    set: <T>(key: string, value: T, ttlMs?: number): void => cache.set(`${namespace}:${key}`, value, ttlMs),
    delete: (key: string): boolean => cache.delete(`${namespace}:${key}`),
    has: (key: string): boolean => cache.has(`${namespace}:${key}`),
    getOrSet: <T>(key: string, factory: () => T | Promise<T>, ttlMs?: number): Promise<T> =>
      cache.getOrSet(`${namespace}:${key}`, factory, ttlMs),
    invalidateAll: (): number => cache.invalidatePattern(new RegExp(`^${namespace}:`)),
  }
}

// Pre-configured namespaces for common use cases
export const cacheNamespaces = {
  api: createCacheNamespace('api'),
  db: createCacheNamespace('db'),
  render: createCacheNamespace('render'),
  analytics: createCacheNamespace('analytics'),
  user: createCacheNamespace('user'),
}

// ============================================================================
// HTTP Caching Helpers
// ============================================================================

export interface CacheControlOptions {
  public?: boolean
  private?: boolean
  maxAge?: number
  sMaxAge?: number
  staleWhileRevalidate?: number
  staleIfError?: number
  noCache?: boolean
  noStore?: boolean
  mustRevalidate?: boolean
}

/**
 * Generate Cache-Control header value
 */
export function generateCacheControl(options: CacheControlOptions): string {
  const parts: string[] = []
  
  if (options.noStore) {
    return 'no-store'
  }
  
  if (options.noCache) {
    parts.push('no-cache')
  }
  
  if (options.public) {
    parts.push('public')
  } else if (options.private) {
    parts.push('private')
  }
  
  if (options.maxAge !== undefined) {
    parts.push(`max-age=${options.maxAge}`)
  }
  
  if (options.sMaxAge !== undefined) {
    parts.push(`s-maxage=${options.sMaxAge}`)
  }
  
  if (options.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${options.staleWhileRevalidate}`)
  }
  
  if (options.staleIfError !== undefined) {
    parts.push(`stale-if-error=${options.staleIfError}`)
  }
  
  if (options.mustRevalidate) {
    parts.push('must-revalidate')
  }
  
  return parts.join(', ')
}

// Common cache presets
export const cachePresets = {
  /** No caching - always fetch fresh */
  noCache: { noStore: true } as CacheControlOptions,
  
  /** Short cache for dynamic content (30 seconds) */
  short: { 
    public: true, 
    maxAge: 30, 
    staleWhileRevalidate: 60 
  } as CacheControlOptions,
  
  /** Medium cache for semi-static content (5 minutes) */
  medium: { 
    public: true, 
    maxAge: 300, 
    staleWhileRevalidate: 600 
  } as CacheControlOptions,
  
  /** Long cache for static content (1 hour) */
  long: { 
    public: true, 
    maxAge: 3600, 
    staleWhileRevalidate: 86400 
  } as CacheControlOptions,
  
  /** Immutable cache for versioned assets */
  immutable: { 
    public: true, 
    maxAge: 31536000, // 1 year
  } as CacheControlOptions,
  
  /** Private cache for user-specific data (1 minute) */
  private: { 
    private: true, 
    maxAge: 60, 
    mustRevalidate: true 
  } as CacheControlOptions,
}

export { MemoryCache }
