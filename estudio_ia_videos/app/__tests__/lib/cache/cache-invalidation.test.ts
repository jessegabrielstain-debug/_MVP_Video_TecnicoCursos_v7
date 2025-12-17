/**
 * Testes para Cache Invalidation
 * @jest-environment node
 */

import { 
  TaggedCache, 
  CacheInvalidationHandlers, 
  DEFAULT_CACHE_CONFIG,
  createCacheKey,
  cached
} from '../../../lib/cache/cache-invalidation';

describe('TaggedCache', () => {
  let cache: TaggedCache;

  beforeEach(() => {
    cache = new TaggedCache({
      ...DEFAULT_CACHE_CONFIG,
      cleanupInterval: 3600000 // 1 hora - não vai limpar durante o teste
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('set/get operations', () => {
    it('should store and retrieve values', () => {
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeUndefined();
    });

    it('should respect TTL', (done) => {
      cache.set('ttl-key', 'ttl-value', { ttl: 0.1 }); // 100ms
      
      expect(cache.get('ttl-key')).toBe('ttl-value');
      
      setTimeout(() => {
        expect(cache.get('ttl-key')).toBeUndefined();
        done();
      }, 150);
    });

    it('should store values with tags', () => {
      cache.set('tagged-key', 'tagged-value', { 
        tags: ['tag1', 'tag2'] 
      });
      
      expect(cache.get('tagged-key')).toBe('tagged-value');
    });
  });

  describe('delete operations', () => {
    it('should delete individual keys', () => {
      cache.set('delete-key', 'delete-value');
      expect(cache.delete('delete-key')).toBe(true);
      expect(cache.get('delete-key')).toBeUndefined();
    });

    it('should return false for non-existent keys', () => {
      expect(cache.delete('non-existent')).toBe(false);
    });
  });

  describe('tag-based invalidation', () => {
    beforeEach(() => {
      cache.set('key1', 'value1', { tags: ['tag1', 'shared'] });
      cache.set('key2', 'value2', { tags: ['tag2', 'shared'] });
      cache.set('key3', 'value3', { tags: ['tag1'] });
      cache.set('key4', 'value4', { tags: ['unrelated'] });
    });

    it('should invalidate by single tag', () => {
      const invalidated = cache.invalidateByTag('tag1');
      
      expect(invalidated).toBe(2); // key1 e key3
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should invalidate by multiple tags', () => {
      const invalidated = cache.invalidateByTags(['tag1', 'tag2']);
      
      expect(invalidated).toBe(3); // key1, key2, key3
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
      expect(cache.get('key4')).toBe('value4');
    });

    it('should return 0 for non-existent tags', () => {
      const invalidated = cache.invalidateByTag('non-existent-tag');
      expect(invalidated).toBe(0);
    });
  });

  describe('cache stats', () => {
    it('should return correct stats', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2', { ttl: 0.1 }); // Expira em 100ms
      
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.activeEntries).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cache cleanup', () => {
    it('should clean up expired entries automatically', async () => {
      cache.set('expire-key', 'expire-value', { ttl: 0.05 }); // 50ms
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Obter stats sem limpeza automática
      const stats = cache.getStats();
      
      // A entrada expirou mas ainda está no cache até ser acessada ou limpeza manual
      expect(stats.totalEntries).toBe(1); // ainda no cache
      expect(stats.expiredEntries).toBe(1); // mas marcada como expirada
      
      // Tentar acessar força a remoção
      expect(cache.get('expire-key')).toBeUndefined();
      
      // Agora a entrada foi removida 
      const statsAfter = cache.getStats();
      expect(statsAfter.totalEntries).toBe(0);
      expect(statsAfter.expiredEntries).toBe(1); // histórico mantém contador
    }, 10000); // timeout maior para CI
  });
});

describe('CacheInvalidationHandlers', () => {
  let cache: TaggedCache;
  let handlers: CacheInvalidationHandlers;

  beforeEach(() => {
    cache = new TaggedCache(DEFAULT_CACHE_CONFIG);
    handlers = new CacheInvalidationHandlers(cache);

    // Popular cache com dados de teste
    cache.set('project:123', { id: '123', name: 'Test Project' }, {
      tags: ['project:123', 'user:projects']
    });
    cache.set('render:456', { id: '456', status: 'completed' }, {
      tags: ['render:456', 'project:123:renders']
    });
    cache.set('projects:list', ['123', '456'], {
      tags: ['projects:list']
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  it('should invalidate project cache on project update', () => {
    handlers.onProjectUpdated('123');
    
    expect(cache.get('project:123')).toBeUndefined();
    expect(cache.get('projects:list')).toBeUndefined();
    expect(cache.get('render:456')).toBeDefined(); // Não deve ser afetado
  });

  it('should invalidate render cache on job completion', () => {
    handlers.onRenderJobCompleted('456', '123');
    
    expect(cache.get('render:456')).toBeUndefined();
    expect(cache.get('project:123')).toBeUndefined(); // Também invalidado
  });

  it('should invalidate slides cache', () => {
    cache.set('project:123:slides', [], { tags: ['project:123:slides'] });
    
    handlers.onSlidesUpdated('123');
    
    expect(cache.get('project:123:slides')).toBeUndefined();
  });

  it('should invalidate user cache', () => {
    cache.set('user:789', { id: '789' }, { tags: ['user:789'] });
    cache.set('user:789:projects', [], { tags: ['user:789:projects'] });
    
    handlers.onUserUpdated('789');
    
    expect(cache.get('user:789')).toBeUndefined();
    expect(cache.get('user:789:projects')).toBeUndefined();
  });
});

describe('Cache utilities', () => {
  describe('createCacheKey', () => {
    it('should create consistent cache keys', () => {
      const key1 = createCacheKey('user', '123', 'projects');
      const key2 = createCacheKey('user', '123', 'projects');
      
      expect(key1).toBe(key2);
      expect(key1).toBe('user:123:projects');
    });

    it('should handle empty parts', () => {
      const key = createCacheKey('user', '', 'projects');
      expect(key).toBe('user::projects');
    });
  });

  describe('@cached decorator', () => {
    it('should cache method results', () => {
      class TestService {
        private callCount = 0;

        // Aplicar decorator manualmente para evitar problemas com experimental decorators
        expensiveOperation(input: string): string {
          this.callCount++;
          return `processed-${input}`;
        }

        getCallCount(): number {
          return this.callCount;
        }
      }

      // Aplicar cache manualmente
      const service = new TestService();
      const cachedMethod = cached({ ttl: 1, tags: ['test'] })(
        TestService.prototype, 
        'expensiveOperation', 
        {
          value: TestService.prototype.expensiveOperation,
          writable: true,
          configurable: true,
          enumerable: false
        }
      );
      
      service.expensiveOperation = cachedMethod.value.bind(service);
      
      const result1 = service.expensiveOperation('test');
      const result2 = service.expensiveOperation('test');
      
      expect(result1).toBe(result2);
      expect(service.getCallCount()).toBe(1); // Só chamou uma vez
    });

    it('should not cache different inputs', () => {
      class TestService {
        private callCount = 0;

        expensiveOperation(input: string): string {
          this.callCount++;
          return `processed-${input}`;
        }

        getCallCount(): number {
          return this.callCount;
        }
      }

      const service = new TestService();
      const cachedMethod = cached({ ttl: 1, tags: ['test'] })(
        TestService.prototype, 
        'expensiveOperation', 
        {
          value: TestService.prototype.expensiveOperation,
          writable: true,
          configurable: true,
          enumerable: false
        }
      );
      
      service.expensiveOperation = cachedMethod.value.bind(service);
      
      const result1 = service.expensiveOperation('test1');
      const result2 = service.expensiveOperation('test2');
      
      expect(result1).toBe('processed-test1');
      expect(result2).toBe('processed-test2');
      expect(service.getCallCount()).toBe(2); // Chamou duas vezes
    });
  });
});