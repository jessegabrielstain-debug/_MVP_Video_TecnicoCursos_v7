/**
 * Tests for app/lib/cache.ts
 */

import {
  MemoryCache,
  getCache,
  createCacheNamespace,
  generateCacheControl,
  cachePresets,
} from '../../../lib/cache'

describe('Cache Module', () => {
  describe('MemoryCache', () => {
    let cache: MemoryCache

    beforeEach(() => {
      cache = new MemoryCache({ defaultTTL: 1000, cleanupIntervalMs: 100000 })
    })

    afterEach(() => {
      cache.destroy()
    })

    describe('Basic Operations', () => {
      it('should set and get values', () => {
        cache.set('key1', 'value1')
        expect(cache.get('key1')).toBe('value1')
      })

      it('should return undefined for non-existent keys', () => {
        expect(cache.get('nonexistent')).toBeUndefined()
      })

      it('should delete values', () => {
        cache.set('key1', 'value1')
        expect(cache.delete('key1')).toBe(true)
        expect(cache.get('key1')).toBeUndefined()
      })

      it('should return false when deleting non-existent keys', () => {
        expect(cache.delete('nonexistent')).toBe(false)
      })

      it('should check if key exists', () => {
        cache.set('key1', 'value1')
        expect(cache.has('key1')).toBe(true)
        expect(cache.has('nonexistent')).toBe(false)
      })

      it('should clear all entries', () => {
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        cache.clear()
        expect(cache.get('key1')).toBeUndefined()
        expect(cache.get('key2')).toBeUndefined()
      })

      it('should list all keys', () => {
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        const keys = cache.keys()
        expect(keys).toContain('key1')
        expect(keys).toContain('key2')
      })
    })

    describe('TTL Behavior', () => {
      it('should expire values after TTL', async () => {
        const shortCache = new MemoryCache({ defaultTTL: 50 })
        shortCache.set('key1', 'value1')
        
        expect(shortCache.get('key1')).toBe('value1')
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        expect(shortCache.get('key1')).toBeUndefined()
        shortCache.destroy()
      })

      it('should use custom TTL when provided', async () => {
        cache.set('key1', 'value1', 50) // 50ms TTL
        
        expect(cache.get('key1')).toBe('value1')
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        expect(cache.get('key1')).toBeUndefined()
      })

      it('should not return expired values in has()', async () => {
        const shortCache = new MemoryCache({ defaultTTL: 50 })
        shortCache.set('key1', 'value1')
        
        expect(shortCache.has('key1')).toBe(true)
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        expect(shortCache.has('key1')).toBe(false)
        shortCache.destroy()
      })
    })

    describe('getOrSet', () => {
      it('should return cached value if exists', async () => {
        cache.set('key1', 'cached')
        
        const factoryCalled = jest.fn(() => 'new')
        const result = await cache.getOrSet('key1', factoryCalled)
        
        expect(result).toBe('cached')
        expect(factoryCalled).not.toHaveBeenCalled()
      })

      it('should call factory and cache if not exists', async () => {
        const factory = jest.fn(() => 'computed')
        const result = await cache.getOrSet('key1', factory)
        
        expect(result).toBe('computed')
        expect(factory).toHaveBeenCalledTimes(1)
        expect(cache.get('key1')).toBe('computed')
      })

      it('should handle async factories', async () => {
        const factory = async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return 'async-value'
        }
        
        const result = await cache.getOrSet('key1', factory)
        expect(result).toBe('async-value')
      })
    })

    describe('Statistics', () => {
      it('should track hits and misses', () => {
        cache.set('key1', 'value1')
        
        cache.get('key1') // hit
        cache.get('key1') // hit
        cache.get('nonexistent') // miss
        
        const stats = cache.getStats()
        expect(stats.hits).toBe(2)
        expect(stats.misses).toBe(1)
      })

      it('should calculate hit rate', () => {
        cache.set('key1', 'value1')
        
        cache.get('key1') // hit
        cache.get('key1') // hit
        cache.get('nonexistent') // miss
        cache.get('nonexistent') // miss
        
        const stats = cache.getStats()
        expect(stats.hitRate).toBe(0.5)
      })

      it('should track sets and deletes', () => {
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        cache.delete('key1')
        
        const stats = cache.getStats()
        expect(stats.sets).toBe(2)
        expect(stats.deletes).toBe(1)
      })
    })

    describe('Pattern Invalidation', () => {
      it('should invalidate entries matching pattern', () => {
        cache.set('user:1:profile', 'profile1')
        cache.set('user:1:settings', 'settings1')
        cache.set('user:2:profile', 'profile2')
        cache.set('other:data', 'data')
        
        const removed = cache.invalidatePattern(/^user:1:/)
        
        expect(removed).toBe(2)
        expect(cache.get('user:1:profile')).toBeUndefined()
        expect(cache.get('user:1:settings')).toBeUndefined()
        expect(cache.get('user:2:profile')).toBe('profile2')
        expect(cache.get('other:data')).toBe('data')
      })
    })

    describe('Cleanup', () => {
      it('should remove expired entries during cleanup', async () => {
        const shortCache = new MemoryCache({ defaultTTL: 50, cleanupIntervalMs: 1000000 })
        shortCache.set('key1', 'value1')
        shortCache.set('key2', 'value2', 500) // longer TTL
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const removed = shortCache.cleanup()
        
        expect(removed).toBe(1) // key1 expired
        expect(shortCache.get('key2')).toBe('value2') // key2 still valid
        shortCache.destroy()
      })
    })
  })

  describe('Singleton Cache', () => {
    it('should return same instance', () => {
      const cache1 = getCache()
      const cache2 = getCache()
      expect(cache1).toBe(cache2)
    })
  })

  describe('Cache Namespace', () => {
    it('should prefix keys with namespace', () => {
      const globalCache = getCache()
      globalCache.clear()
      
      const userCache = createCacheNamespace('user')
      userCache.set('profile', { name: 'Test' })
      
      expect(userCache.get('profile')).toEqual({ name: 'Test' })
      expect(globalCache.get<{ name: string }>('user:profile')).toEqual({ name: 'Test' })
    })

    it('should invalidate only namespace entries', () => {
      const globalCache = getCache()
      globalCache.clear()
      
      const userCache = createCacheNamespace('user')
      const apiCache = createCacheNamespace('api')
      
      userCache.set('data1', 'value1')
      userCache.set('data2', 'value2')
      apiCache.set('data3', 'value3')
      
      const removed = userCache.invalidateAll()
      
      expect(removed).toBe(2)
      expect(userCache.get('data1')).toBeUndefined()
      expect(apiCache.get('data3')).toBe('value3')
    })
  })

  describe('Cache Control Headers', () => {
    it('should generate no-store', () => {
      const header = generateCacheControl({ noStore: true })
      expect(header).toBe('no-store')
    })

    it('should generate public max-age', () => {
      const header = generateCacheControl({ public: true, maxAge: 3600 })
      expect(header).toBe('public, max-age=3600')
    })

    it('should generate stale-while-revalidate', () => {
      const header = generateCacheControl({ 
        public: true, 
        maxAge: 60, 
        staleWhileRevalidate: 300 
      })
      expect(header).toBe('public, max-age=60, stale-while-revalidate=300')
    })

    it('should generate private must-revalidate', () => {
      const header = generateCacheControl({ 
        private: true, 
        maxAge: 60, 
        mustRevalidate: true 
      })
      expect(header).toBe('private, max-age=60, must-revalidate')
    })
  })

  describe('Cache Presets', () => {
    it('should have noCache preset', () => {
      expect(generateCacheControl(cachePresets.noCache)).toBe('no-store')
    })

    it('should have short preset', () => {
      const header = generateCacheControl(cachePresets.short)
      expect(header).toContain('public')
      expect(header).toContain('max-age=30')
    })

    it('should have long preset', () => {
      const header = generateCacheControl(cachePresets.long)
      expect(header).toContain('max-age=3600')
    })

    it('should have private preset', () => {
      const header = generateCacheControl(cachePresets.private)
      expect(header).toContain('private')
      expect(header).toContain('must-revalidate')
    })
  })
})
