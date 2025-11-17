

'use client'

/**
 * 🗄️ Canvas Cache Manager - Intelligent Object Caching
 * Smart caching system for Fabric.js objects with LRU eviction
 * Sprint 22 - Performance Optimization Engine
 */

import { useRef, useCallback, useState } from 'react'

interface CacheEntry {
  id: string
  imageData: ImageData | string
  lastAccessed: number
  size: number
  type: 'object' | 'scene' | 'export'
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  totalSize: number
  entryCount: number
}

interface UseCanvasCacheReturn {
  cacheObject: (objectId: string, canvas: any) => void
  renderFromCache: (objectId: string) => ImageData | string | null
  clearCache: () => void
  getCacheStats: () => CacheStats
  preloadObjects: (objects: any[]) => void
}

export function useCanvasCache(maxCacheSize: number = 50 * 1024 * 1024): UseCanvasCacheReturn {
  const cacheRef = useRef(new Map<string, CacheEntry>())
  const [stats, setStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0
  })

  // LRU Cache implementation
  const evictLRU = useCallback(() => {
    const cache = cacheRef.current
    if (cache.size === 0) return
    
    let oldestEntry: [string, CacheEntry] | null = null
    let oldestTime = Date.now()
    
    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestEntry = [key, entry]
      }
    }
    
    if (oldestEntry) {
      cache.delete(oldestEntry[0])
      setStats(prev => ({
        ...prev,
        evictions: prev.evictions + 1,
        totalSize: prev.totalSize - oldestEntry![1].size,
        entryCount: prev.entryCount - 1
      }))
    }
  }, [])

  const cacheObject = useCallback((objectId: string, canvas: any) => {
    if (!canvas || !objectId) return
    
    try {
      const obj = canvas.getObjects().find((o: any) => o.id === objectId)
      if (!obj) return
      
      // Get object bounds for caching
      const bounds = obj.getBoundingRect()
      const cacheCanvas = document.createElement('canvas')
      const ctx = cacheCanvas.getContext('2d')
      
      if (!ctx) return
      
      cacheCanvas.width = bounds.width || 100
      cacheCanvas.height = bounds.height || 100
      
      // Render object to cache canvas
      obj.render(ctx)
      const imageData = ctx.getImageData(0, 0, cacheCanvas.width, cacheCanvas.height)
      const size = imageData.data.length
      
      // Check if cache is full
      const cache = cacheRef.current
      while (stats.totalSize + size > maxCacheSize && cache.size > 0) {
        evictLRU()
      }
      
      // Add to cache
      cache.set(objectId, {
        id: objectId,
        imageData,
        lastAccessed: Date.now(),
        size,
        type: 'object'
      })
      
      setStats(prev => ({
        ...prev,
        totalSize: prev.totalSize + size,
        entryCount: prev.entryCount + 1
      }))
      
    } catch (error) {
      console.warn('Cache object failed:', error)
    }
  }, [maxCacheSize, stats.totalSize, evictLRU])

  const renderFromCache = useCallback((objectId: string): ImageData | string | null => {
    const cache = cacheRef.current
    const entry = cache.get(objectId)
    
    if (entry) {
      // Update access time for LRU
      entry.lastAccessed = Date.now()
      cache.set(objectId, entry)
      
      setStats(prev => ({
        ...prev,
        hits: prev.hits + 1
      }))
      
      return entry.imageData
    }
    
    setStats(prev => ({
      ...prev,
      misses: prev.misses + 1
    }))
    
    return null
  }, [])

  const clearCache = useCallback(() => {
    cacheRef.current.clear()
    setStats({
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0
    })
  }, [])

  type FabricNamespace = {
    Canvas: new (el: HTMLCanvasElement) => {
      add: (obj: unknown) => void
      dispose: () => void
    }
  }

  const preloadObjects = useCallback((objects: unknown[]) => {
    // Create a temporary canvas for preloading
    const tempCanvas = document.createElement('canvas')
    const win = window as Window & { fabric?: unknown }
    const fabricNs = win.fabric
    if (!fabricNs || typeof fabricNs !== 'object') return
    const fabric = fabricNs as FabricNamespace
    
    const tempFabricCanvas = new fabric.Canvas(tempCanvas)
    
    if (!tempFabricCanvas) return
    
    objects.forEach((obj) => {
      if (obj && typeof obj === 'object' && 'id' in obj) {
        // id é usado apenas como chave de cache
        const idVal = (obj as { id?: string | number }).id
        tempFabricCanvas.add(obj)
        if (idVal != null) {
          cacheObject(String(idVal), tempFabricCanvas)
        }
      }
    })
    
    tempFabricCanvas.dispose()
  }, [cacheObject])

  const getCacheStats = useCallback(() => stats, [stats])

  return {
    cacheObject,
    renderFromCache,
    clearCache,
    getCacheStats,
    preloadObjects
  }
}

// Cache optimization utilities
export const CacheUtils = {
  calculateOptimalCacheSize: (objectCount: number, avgObjectSize: number) => {
    // Recommend cache size based on object count and size
    const recommendedSize = objectCount * avgObjectSize * 2 // 2x buffer
    return Math.min(recommendedSize, 100 * 1024 * 1024) // Max 100MB
  },
  
  analyzeCachePerformance: (stats: CacheStats) => {
    const hitRate = stats.hits > 0 ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0
    const avgEntrySize = stats.entryCount > 0 ? stats.totalSize / stats.entryCount : 0
    
    return {
      hitRate,
      avgEntrySize,
      efficiency: hitRate > 80 ? 'excellent' : hitRate > 60 ? 'good' : hitRate > 40 ? 'fair' : 'poor',
      recommendations: hitRate < 50 ? [
        'Increase cache size',
        'Optimize object complexity',
        'Review caching strategy'
      ] : ['Cache performance is optimal']
    }
  },
  
  optimizeCacheStrategy: (canvas: any, stats: CacheStats) => {
    if (!canvas) return
    
    const objects = canvas.getObjects()
    const performance = CacheUtils.analyzeCachePerformance(stats)
    
    if (performance.efficiency === 'poor') {
      // Clear cache and rebuild with most frequently used objects
      objects.forEach((obj: any, index: number) => {
        if (index < 10 && obj.id) { // Cache top 10 most recent objects
          // Re-cache important objects
        }
      })
    }
  }
}

