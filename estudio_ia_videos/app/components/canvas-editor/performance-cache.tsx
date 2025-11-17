
/**
 * ⚡ PERFORMANCE CACHE COMPONENT
 * Sistema de cache inteligente para otimizar performance do Canvas Editor
 */

'use client'

import React, { useMemo, useCallback, useRef } from 'react'

interface CacheItem {
  key: string
  data: unknown
  timestamp: number
  hitCount: number
}

interface PerformanceCacheConfig {
  maxSize: number
  ttl: number // Time to live in milliseconds
  enableMetrics: boolean
}

const DEFAULT_CONFIG: PerformanceCacheConfig = {
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes
  enableMetrics: true
}

export class PerformanceCache {
  private cache = new Map<string, CacheItem>()
  private config: PerformanceCacheConfig
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0
  }

  constructor(config: Partial<PerformanceCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  get(key: string): unknown {
    const item = this.cache.get(key)
    
    if (!item) {
      this.metrics.misses++
      return undefined
    }
    
    // Check TTL
    if (Date.now() - item.timestamp > this.config.ttl) {
      this.cache.delete(key)
      this.metrics.misses++
      return undefined
    }
    
    item.hitCount++
    this.metrics.hits++
    return item.data
  }

  set(key: string, data: unknown): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.findOldestKey()
      if (oldestKey) {
        this.cache.delete(oldestKey)
        this.metrics.evictions++
      }
    }

    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      hitCount: 0
    })
    
    this.metrics.sets++
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    // Check TTL
    if (Date.now() - item.timestamp > this.config.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.metrics = { hits: 0, misses: 0, sets: 0, evictions: 0 }
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses
    return {
      ...this.metrics,
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0,
      size: this.cache.size,
      maxSize: this.config.maxSize
    }
  }

  private findOldestKey(): string | undefined {
    let oldestKey: string | undefined
    let oldestTime = Date.now()
    
    for (const [key, item] of this.cache) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }
    
    return oldestKey
  }
}

// Global cache instance
let globalCache: PerformanceCache | null = null

export function useCanvasCache(config?: Partial<PerformanceCacheConfig>) {
  const cacheRef = useRef<PerformanceCache>()
  
  if (!cacheRef.current) {
    if (!globalCache) {
      globalCache = new PerformanceCache(config)
    }
    cacheRef.current = globalCache
  }

  const memoizedCache = useMemo(() => cacheRef.current!, [])

  const cacheGet = useCallback((key: string) => {
    return memoizedCache.get(key)
  }, [memoizedCache])

  const cacheSet = useCallback((key: string, data: unknown) => {
    memoizedCache.set(key, data)
  }, [memoizedCache])

  const cacheHas = useCallback((key: string) => {
    return memoizedCache.has(key)
  }, [memoizedCache])

  const getMetrics = useCallback(() => {
    return memoizedCache.getMetrics()
  }, [memoizedCache])

  const clearCache = useCallback(() => {
    memoizedCache.clear()
  }, [memoizedCache])

  return {
    get: cacheGet,
    set: cacheSet,
    has: cacheHas,
    delete: memoizedCache.delete.bind(memoizedCache),
    clear: clearCache,
    getMetrics,
    cache: memoizedCache
  }
}

// Canvas-specific cache hooks
export function useMemoizedCanvas(key: string, computeFn: () => unknown, deps: unknown[]) {
  const cache = useCanvasCache()
  
  return useMemo(() => {
    const cacheKey = `canvas_${key}_${JSON.stringify(deps)}`
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }
    
    const result = computeFn()
    cache.set(cacheKey, result)
    return result
  }, [key, cache, ...deps])
}

export function useThrottledCanvasUpdate(fn: Function, delay: number = 16) {
  const lastCall = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: unknown[]) => {
    const now = Date.now()
    
    if (now - lastCall.current >= delay) {
      lastCall.current = now
      fn(...args)
    } else {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now()
        fn(...args)
      }, delay)
    }
  }, [fn, delay])
}

// Performance monitoring component
export function PerformanceCacheMonitor() {
  const cache = useCanvasCache()
  const [metrics, setMetrics] = React.useState(cache.getMetrics())
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(cache.getMetrics())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [cache])

  if (!cache.getMetrics().sets) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono z-50">
      <div className="mb-2 font-semibold">🚀 Performance Cache</div>
      <div className="space-y-1">
        <div>Hit Rate: {metrics.hitRate.toFixed(1)}%</div>
        <div>Hits: {metrics.hits} | Misses: {metrics.misses}</div>
        <div>Size: {metrics.size}/{metrics.maxSize}</div>
        <div>Sets: {metrics.sets} | Evictions: {metrics.evictions}</div>
      </div>
    </div>
  )
}

export default PerformanceCache
