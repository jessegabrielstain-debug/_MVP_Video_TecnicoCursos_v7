/**
 * Cache Manager Tests
 * 
 * Testes completos para o sistema de cache inteligente
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  CacheManager,
  getCache,
  resetCache,
  Cacheable
} from '@/lib/cache/cache-manager';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({
      useRedis: false,
      maxMemoryItems: 100,
      defaultTTL: 60
    });
  });

  afterEach(async () => {
    await cache.clear();
    await cache.close();
  });

  describe('Constructor', () => {
    it('should create cache with default config', () => {
      const defaultCache = new CacheManager();
      expect(defaultCache).toBeInstanceOf(CacheManager);
    });

    it('should create cache with custom config', () => {
      expect(cache).toBeInstanceOf(CacheManager);
    });
  });

  describe('set() and get()', () => {
    it('should store and retrieve value', async () => {
      await cache.set('test-key', { data: 'test-value' });
      const value = await cache.get('test-key');

      expect(value).toEqual({ data: 'test-value' });
    });

    it('should return null for non-existent key', async () => {
      const value = await cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should handle different data types', async () => {
      await cache.set('string', 'test');
      await cache.set('number', 123);
      await cache.set('boolean', true);
      await cache.set('array', [1, 2, 3]);
      await cache.set('object', { a: 1, b: 2 });

      expect(await cache.get('string')).toBe('test');
      expect(await cache.get('number')).toBe(123);
      expect(await cache.get('boolean')).toBe(true);
      expect(await cache.get('array')).toEqual([1, 2, 3]);
      expect(await cache.get('object')).toEqual({ a: 1, b: 2 });
    });

    it('should respect TTL', async () => {
      await cache.set('test-ttl', 'value', { ttl: 1 }); // 1 segundo

      const value1 = await cache.get('test-ttl');
      expect(value1).toBe('value');

      // Aguardar TTL expirar
      await new Promise(resolve => setTimeout(resolve, 1100));

      const value2 = await cache.get('test-ttl');
      expect(value2).toBeNull();
    });

    it('should compress large values', async () => {
      const largeValue = 'x'.repeat(2000);
      await cache.set('large', largeValue, { compress: true });

      const retrieved = await cache.get('large');
      expect(retrieved).toBe(largeValue);
    });
  });

  describe('has()', () => {
    it('should return true for existing key', async () => {
      await cache.set('test', 'value');
      const exists = await cache.has('test');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const exists = await cache.has('non-existent');
      expect(exists).toBe(false);
    });

    it('should return false for expired key', async () => {
      await cache.set('test', 'value', { ttl: 1 });
      
      await new Promise(resolve => setTimeout(resolve, 1100));

      const exists = await cache.has('test');
      expect(exists).toBe(false);
    });
  });

  describe('delete()', () => {
    it('should delete existing key', async () => {
      await cache.set('test', 'value');
      const deleted = await cache.delete('test');

      expect(deleted).toBe(true);

      const value = await cache.get('test');
      expect(value).toBeNull();
    });

    it('should return false for non-existent key', async () => {
      const deleted = await cache.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('getOrSet()', () => {
    it('should get cached value if exists', async () => {
      await cache.set('test', 'cached-value');

      const factory = jest.fn().mockResolvedValue('new-value');
      const value = await cache.getOrSet('test', factory);

      expect(value).toBe('cached-value');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory if value not cached', async () => {
      const factory = jest.fn().mockResolvedValue('new-value');
      const value = await cache.getOrSet('test', factory);

      expect(value).toBe('new-value');
      expect(factory).toHaveBeenCalledTimes(1);

      // Verify value was cached
      const cached = await cache.get('test');
      expect(cached).toBe('new-value');
    });

    it('should handle factory errors', async () => {
      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

      await expect(cache.getOrSet('test', factory)).rejects.toThrow('Factory error');
    });
  });

  describe('Tag-based invalidation', () => {
    it('should invalidate by tag', async () => {
      await cache.set('item1', 'value1', { tags: ['group1'] });
      await cache.set('item2', 'value2', { tags: ['group1'] });
      await cache.set('item3', 'value3', { tags: ['group2'] });

      const deleted = await cache.invalidateByTag('group1');
      expect(deleted).toBe(2);

      expect(await cache.get('item1')).toBeNull();
      expect(await cache.get('item2')).toBeNull();
      expect(await cache.get('item3')).toBe('value3');
    });

    it('should handle multiple tags', async () => {
      await cache.set('item', 'value', { tags: ['tag1', 'tag2'] });

      const deleted1 = await cache.invalidateByTag('tag1');
      expect(deleted1).toBe(1);
      expect(await cache.get('item')).toBeNull();
    });
  });

  describe('clear()', () => {
    it('should clear all cache', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      await cache.clear();

      const stats = cache.getStats();
      expect(stats.itemCount).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('should return cache statistics', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.get('key1'); // hit
      await cache.get('key1'); // hit
      await cache.get('non-existent'); // miss

      const stats = cache.getStats();

      expect(stats.itemCount).toBe(2);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.sets).toBe(2);
      expect(stats.hitRate).toBeCloseTo(0.666, 2);
    });

    it('should track total size', async () => {
      await cache.set('small', 'x');
      await cache.set('medium', 'x'.repeat(100));
      await cache.set('large', 'x'.repeat(1000));

      const stats = cache.getStats();
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });

  describe('Memory management', () => {
    it('should evict old items when limit reached', async () => {
      const smallCache = new CacheManager({
        maxMemoryItems: 3
      });

      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      await smallCache.set('key3', 'value3');
      
      // Acessar key1 para torná-la mais recente
      await smallCache.get('key1');

      // Adicionar key4 deve evitar key2 (menos recentemente acessada)
      await smallCache.set('key4', 'value4');

      const stats = smallCache.getStats();
      expect(stats.itemCount).toBeLessThanOrEqual(3);

      await smallCache.close();
    });
  });

  describe('Compression', () => {
    it('should compress large values automatically', async () => {
      const largeValue = 'x'.repeat(2000);
      await cache.set('large', largeValue);

      const stats = cache.getStats();
      expect(stats.compressionSavings).toBeGreaterThan(0);
    });

    it('should not compress small values', async () => {
      await cache.set('small', 'test');

      const stats = cache.getStats();
      expect(stats.compressionSavings).toBe(0);
    });
  });

  describe('Singleton', () => {
    afterEach(async () => {
      await resetCache();
    });

    it('should return same instance', () => {
      const cache1 = getCache();
      const cache2 = getCache();

      expect(cache1).toBe(cache2);
    });

    it('should reset singleton', async () => {
      const cache1 = getCache();
      await resetCache();
      const cache2 = getCache();

      expect(cache1).not.toBe(cache2);
    });
  });

  describe('Decorator', () => {
    class TestClass {
      callCount = 0;

      @Cacheable({ ttl: 60 })
      async expensiveOperation(id: string): Promise<string> {
        this.callCount++;
        return `result-${id}`;
      }
    }

    it('should cache method results', async () => {
      const instance = new TestClass();

      const result1 = await instance.expensiveOperation('123');
      const result2 = await instance.expensiveOperation('123');

      expect(result1).toBe('result-123');
      expect(result2).toBe('result-123');
      expect(instance.callCount).toBe(1); // Should only call once
    });

    it('should cache different arguments separately', async () => {
      const instance = new TestClass();

      const result1 = await instance.expensiveOperation('123');
      const result2 = await instance.expensiveOperation('456');

      expect(result1).toBe('result-123');
      expect(result2).toBe('result-456');
      expect(instance.callCount).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should handle serialization errors', async () => {
      const circular: any = {};
      circular.self = circular;

      await expect(cache.set('circular', circular)).rejects.toThrow();
    });

    it('should return null on get errors', async () => {
      // Simular erro interno
      const brokenCache = new CacheManager();
      
      // @ts-ignore - forçar erro
      brokenCache.memoryCache = null;

      const value = await brokenCache.get('test');
      expect(value).toBeNull();
    });
  });
});
