/**
 * Tests for DataLoader module
 * 
 * @group unit
 * @group data
 */

import {
  DataLoader,
  DataLoaderRegistry,
  createDataLoader,
  batchResolve,
  resolveRelation,
  defaultCacheKeyFn,
} from '../../../lib/data/dataloader';

// Mock logger
jest.mock('../../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock custom-metrics
jest.mock('../../../lib/observability/custom-metrics', () => ({
  recordDbQuery: jest.fn(),
}));

describe('DataLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic loading', () => {
    it('should load a single item', async () => {
      const batchFn = jest.fn().mockResolvedValue(['value1']);
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      const result = await loader.load('key1');

      expect(result).toBe('value1');
      expect(batchFn).toHaveBeenCalledWith(['key1']);
    });

    it('should batch multiple loads in same tick', async () => {
      const batchFn = jest.fn().mockResolvedValue(['value1', 'value2', 'value3']);
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      const [r1, r2, r3] = await Promise.all([
        loader.load('key1'),
        loader.load('key2'),
        loader.load('key3'),
      ]);

      expect(r1).toBe('value1');
      expect(r2).toBe('value2');
      expect(r3).toBe('value3');
      expect(batchFn).toHaveBeenCalledTimes(1);
      expect(batchFn).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    it('should handle loadMany', async () => {
      const batchFn = jest.fn().mockResolvedValue(['a', 'b', 'c']);
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      const results = await loader.loadMany(['k1', 'k2', 'k3']);

      expect(results).toEqual(['a', 'b', 'c']);
      expect(batchFn).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in batch function', async () => {
      const batchFn = jest.fn().mockRejectedValue(new Error('Batch failed'));
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      await expect(loader.load('key1')).rejects.toThrow('Batch failed');
    });

    it('should handle individual errors in results', async () => {
      const error = new Error('Item error');
      const batchFn = jest.fn().mockResolvedValue(['value1', error, 'value3']);
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      const results = await loader.loadMany(['k1', 'k2', 'k3']);

      expect(results[0]).toBe('value1');
      expect(results[1]).toBeInstanceOf(Error);
      expect((results[1] as Error).message).toBe('Item error');
      expect(results[2]).toBe('value3');
    });

    it('should reject all if batch returns wrong length', async () => {
      const batchFn = jest.fn().mockResolvedValue(['value1']); // Only 1 value for 3 keys
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      await expect(
        Promise.all([
          loader.load('k1'),
          loader.load('k2'),
          loader.load('k3'),
        ])
      ).rejects.toThrow('must return array of same length');
    });
  });

  describe('caching', () => {
    it('should cache results by default', async () => {
      const batchFn = jest.fn()
        .mockResolvedValueOnce(['value1'])
        .mockResolvedValueOnce(['value2']);
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      const r1 = await loader.load('key1');
      const r2 = await loader.load('key1');

      expect(r1).toBe('value1');
      expect(r2).toBe('value1');
      expect(batchFn).toHaveBeenCalledTimes(1);
    });

    it('should allow disabling cache', async () => {
      const batchFn = jest.fn()
        .mockResolvedValueOnce(['value1'])
        .mockResolvedValueOnce(['value2']);
      const loader = createDataLoader<string, string>(batchFn, { 
        name: 'test',
        cache: false 
      });

      // First load
      const r1 = await loader.load('key1');
      expect(r1).toBe('value1');
      
      // Need to wait for next tick for a new batch
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Second load - should call batch again
      const r2 = await loader.load('key1');
      expect(r2).toBe('value2');
      expect(batchFn).toHaveBeenCalledTimes(2);
    });

    it('should clear specific key from cache', async () => {
      const batchFn = jest.fn()
        .mockResolvedValueOnce(['value1'])
        .mockResolvedValueOnce(['value2']);
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      const r1 = await loader.load('key1');
      expect(r1).toBe('value1');
      
      loader.clear('key1');
      
      // Need to wait for next tick
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const r2 = await loader.load('key1');
      expect(r2).toBe('value2');
      expect(batchFn).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      const batchFn = jest.fn()
        .mockResolvedValueOnce(['v1', 'v2'])
        .mockResolvedValueOnce(['v3', 'v4']);
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      await Promise.all([loader.load('k1'), loader.load('k2')]);
      loader.clearAll();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await Promise.all([loader.load('k1'), loader.load('k2')]);
      expect(batchFn).toHaveBeenCalledTimes(2);
    });

    it('should prime cache', async () => {
      const batchFn = jest.fn();
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      loader.prime('key1', 'primed-value');
      const result = await loader.load('key1');

      expect(result).toBe('primed-value');
      expect(batchFn).not.toHaveBeenCalled();
    });

    it('should not override existing cache when priming', async () => {
      const batchFn = jest.fn().mockResolvedValue(['original']);
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      const r1 = await loader.load('key1');
      loader.prime('key1', 'should-be-ignored');
      const r2 = await loader.load('key1');

      expect(r1).toBe('original');
      expect(r2).toBe('original');
    });
  });

  describe('batch size limits', () => {
    it('should dispatch when maxBatchSize is reached', async () => {
      const batchFn = jest.fn()
        .mockImplementation((keys: readonly string[]) => 
          Promise.resolve(keys.map(k => `value-${k}`))
        );
      const loader = createDataLoader<string, string>(batchFn, { 
        name: 'test',
        maxBatchSize: 2 
      });

      const [r1, r2, r3, r4] = await Promise.all([
        loader.load('k1'),
        loader.load('k2'),
        loader.load('k3'),
        loader.load('k4'),
      ]);

      expect(r1).toBe('value-k1');
      expect(r2).toBe('value-k2');
      expect(r3).toBe('value-k3');
      expect(r4).toBe('value-k4');
      // Should have made 2 batches of 2
      expect(batchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('custom cache key', () => {
    it('should use custom cache key function', async () => {
      const batchFn = jest.fn()
        .mockResolvedValue([{ id: 1, name: 'User' }]);
      
      interface Key {
        id: number;
        type: string;
      }
      
      const loader = createDataLoader<Key, object>(batchFn, { 
        name: 'test',
        cacheKeyFn: (key) => `${key.type}:${key.id}`
      });

      const r1 = await loader.load({ id: 1, type: 'user' });
      const r2 = await loader.load({ id: 1, type: 'user' });

      expect(r1).toEqual({ id: 1, name: 'User' });
      expect(r2).toEqual({ id: 1, name: 'User' });
      expect(batchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('statistics', () => {
    it('should track load statistics', async () => {
      const batchFn = jest.fn()
        .mockImplementation((keys: readonly string[]) => 
          Promise.resolve(keys.map(k => `v-${k}`))
        );
      const loader = createDataLoader<string, string>(batchFn, { name: 'test-stats' });

      await Promise.all([
        loader.load('k1'),
        loader.load('k2'),
        loader.load('k1'), // Cache hit
      ]);

      const stats = loader.getStats();

      expect(stats.name).toBe('test-stats');
      expect(stats.totalLoads).toBe(2); // k1 and k2 (k1 second time is cache hit)
      expect(stats.batchCount).toBe(1);
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(2);
      expect(stats.avgBatchSize).toBe(2);
    });

    it('should reset statistics', async () => {
      const batchFn = jest.fn().mockResolvedValue(['v1']);
      const loader = createDataLoader<string, string>(batchFn, { name: 'test' });

      await loader.load('k1');
      loader.resetStats();
      
      const stats = loader.getStats();
      expect(stats.totalLoads).toBe(0);
      expect(stats.batchCount).toBe(0);
    });
  });
});

describe('DataLoaderRegistry', () => {
  it('should create and retrieve loaders', () => {
    const registry = DataLoaderRegistry.create();
    
    const loader1 = registry.getOrCreate('users', () => 
      createDataLoader<string, object>(async (keys) => keys.map(() => ({})), { name: 'users' })
    );
    
    const loader2 = registry.getOrCreate('users', () => 
      createDataLoader<string, object>(async (keys) => keys.map(() => ({})), { name: 'users2' })
    );

    // Should return same instance
    expect(loader1).toBe(loader2);
  });

  it('should remove loaders', () => {
    const registry = DataLoaderRegistry.create();
    
    registry.getOrCreate('test', () => 
      createDataLoader<string, string>(async () => [], { name: 'test' })
    );
    
    const removed = registry.remove('test');
    expect(removed).toBe(true);
    
    const removedAgain = registry.remove('test');
    expect(removedAgain).toBe(false);
  });

  it('should clear all loaders', () => {
    const registry = DataLoaderRegistry.create();
    
    registry.getOrCreate('a', () => 
      createDataLoader<string, string>(async () => [], { name: 'a' })
    );
    registry.getOrCreate('b', () => 
      createDataLoader<string, string>(async () => [], { name: 'b' })
    );
    
    registry.clear();
    
    // After clear, new loader should be created
    let newLoaderCreated = false;
    registry.getOrCreate('a', () => {
      newLoaderCreated = true;
      return createDataLoader<string, string>(async () => [], { name: 'a' });
    });
    
    expect(newLoaderCreated).toBe(true);
  });

  it('should get all stats', async () => {
    const registry = DataLoaderRegistry.create();
    
    registry.getOrCreate('loader1', () => 
      createDataLoader<string, string>(async (keys) => keys.map(() => 'v'), { name: 'loader1' })
    );
    registry.getOrCreate('loader2', () => 
      createDataLoader<string, string>(async (keys) => keys.map(() => 'v'), { name: 'loader2' })
    );
    
    const stats = registry.getAllStats();
    expect(stats).toHaveLength(2);
    expect(stats[0].name).toBe('loader1');
    expect(stats[1].name).toBe('loader2');
  });
});

describe('defaultCacheKeyFn', () => {
  it('should handle primitives', () => {
    expect(defaultCacheKeyFn('string')).toBe('string');
    expect(defaultCacheKeyFn(123)).toBe('123');
    expect(defaultCacheKeyFn(true)).toBe('true');
  });

  it('should handle null and undefined', () => {
    expect(defaultCacheKeyFn(null)).toBe('null');
    expect(defaultCacheKeyFn(undefined)).toBe('undefined');
  });

  it('should handle objects', () => {
    expect(defaultCacheKeyFn({ id: 1 })).toBe('{"id":1}');
    expect(defaultCacheKeyFn({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
  });
});

describe('batchResolve', () => {
  it('should resolve batch of related items', async () => {
    interface Item {
      id: string;
      userId: string;
    }
    interface User {
      id: string;
      name: string;
    }

    const items: Item[] = [
      { id: '1', userId: 'u1' },
      { id: '2', userId: 'u2' },
      { id: '3', userId: 'u1' }, // Same user
    ];

    const userLoader = createDataLoader<string, User>(
      async (ids) => ids.map(id => ({ id, name: `User ${id}` })),
      { name: 'users' }
    );

    const userMap = await batchResolve(items, item => item.userId, userLoader);

    expect(userMap.size).toBe(2); // Only 2 unique users
    expect(userMap.get('u1')).toEqual({ id: 'u1', name: 'User u1' });
    expect(userMap.get('u2')).toEqual({ id: 'u2', name: 'User u2' });
  });
});

describe('resolveRelation', () => {
  it('should resolve and set relations on items', async () => {
    interface Item {
      id: string;
      authorId: string;
      author?: { id: string; name: string } | null;
    }

    const items: Item[] = [
      { id: '1', authorId: 'a1' },
      { id: '2', authorId: 'a2' },
    ];

    const authorLoader = createDataLoader<string, { id: string; name: string }>(
      async (ids) => ids.map(id => ({ id, name: `Author ${id}` })),
      { name: 'authors' }
    );

    const result = await resolveRelation(
      items,
      item => item.authorId,
      authorLoader,
      (item, author) => { item.author = author; }
    );

    expect(result[0].author).toEqual({ id: 'a1', name: 'Author a1' });
    expect(result[1].author).toEqual({ id: 'a2', name: 'Author a2' });
  });

  it('should handle null relations', async () => {
    interface Item {
      id: string;
      categoryId: string;
      category?: { id: string; name: string } | null;
    }

    const items: Item[] = [
      { id: '1', categoryId: 'c1' },
      { id: '2', categoryId: 'c999' }, // Non-existent
    ];

    const categoryLoader = createDataLoader<string, { id: string; name: string } | null>(
      async (ids) => ids.map(id => id === 'c1' ? { id, name: 'Category 1' } : null),
      { name: 'categories' }
    );

    await resolveRelation(
      items,
      item => item.categoryId,
      categoryLoader,
      (item, category) => { item.category = category; }
    );

    expect(items[0].category).toEqual({ id: 'c1', name: 'Category 1' });
    expect(items[1].category).toBeNull();
  });
});
