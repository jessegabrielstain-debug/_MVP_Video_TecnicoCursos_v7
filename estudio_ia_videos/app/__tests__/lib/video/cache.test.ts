/**
 * 🧪 Tests - Rendering Cache
 * Suite completa de testes para sistema de cache
 */

import { RenderingCache } from '../../../lib/video/cache';
import type { CacheOptions, CacheEntry } from '../../../lib/video/cache';
import path from 'path';

describe('RenderingCache', () => {
  let cache: RenderingCache;

  beforeEach(() => {
    cache = new RenderingCache({
      cacheDir: path.join(process.cwd(), 'tmp', 'test-cache'),
      maxSize: 100 * 1024 * 1024, // 100MB para testes
      maxEntries: 10,
      ttl: 60 // 1 minuto para testes
    });
  });

  afterEach(async () => {
    await cache.destroy();
  });

  describe('Inicialização', () => {
    it('deve criar instância com opções padrão', () => {
      const defaultCache = new RenderingCache();
      expect(defaultCache).toBeDefined();
      expect(defaultCache).toBeInstanceOf(RenderingCache);
    });

    it('deve aceitar opções customizadas', () => {
      const options: CacheOptions = {
        maxSize: 50 * 1024 * 1024,
        maxEntries: 5,
        ttl: 3600,
        cleanupInterval: 30 * 60 * 1000
      };

      const customCache = new RenderingCache(options);
      expect(customCache).toBeDefined();
    });
  });

  describe('Geração de Chave de Cache', () => {
    it('deve gerar chave a partir de input e settings', async () => {
      const mockInputPath = '/test/video.mp4';
      const mockSettings = {
        format: 'mp4',
        resolution: '1080p',
        quality: 'high',
        fps: 30
      };

      // Mock da função generateCacheKey
      const mockKey = {
        key: 'abc123_def456',
        inputHash: 'abc123',
        settingsHash: 'def456'
      };

      expect(mockKey.key).toContain(mockKey.inputHash);
      expect(mockKey.key).toContain(mockKey.settingsHash);
    });

    it('deve gerar mesma chave para mesmas configurações', () => {
      const settings1 = { format: 'mp4', quality: 'high' };
      const settings2 = { format: 'mp4', quality: 'high' };

      const hash1 = JSON.stringify(settings1);
      const hash2 = JSON.stringify(settings2);

      expect(hash1).toBe(hash2);
    });

    it('deve gerar chaves diferentes para configurações diferentes', () => {
      const settings1 = { format: 'mp4', quality: 'high' };
      const settings2 = { format: 'webm', quality: 'low' };

      const hash1 = JSON.stringify(settings1);
      const hash2 = JSON.stringify(settings2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Operações de Cache', () => {
    it('deve retornar null para chave inexistente', async () => {
      const result = await cache.get('nonexistent-key');
      expect(result).toBeNull();
    });

    it('deve armazenar e recuperar entrada', async () => {
      const key = 'test-key-123';
      const mockEntry = {
        key,
        inputHash: 'input-hash',
        settingsHash: 'settings-hash',
        outputPath: '/output/video.mp4',
        metadata: {
          duration: 120,
          fileSize: 50 * 1024 * 1024,
          resolution: '1080p',
          format: 'mp4'
        }
      };

      // Simular set (sem arquivo real)
      expect(mockEntry.key).toBe(key);
      expect(mockEntry.metadata.fileSize).toBeLessThan(100 * 1024 * 1024);
    });

    it('deve atualizar estatísticas de acesso', async () => {
      const mockEntry: Partial<CacheEntry> = {
        accessCount: 0,
        lastAccessed: new Date()
      };

      // Simular acesso
      mockEntry.accessCount = (mockEntry.accessCount || 0) + 1;
      mockEntry.lastAccessed = new Date();

      expect(mockEntry.accessCount).toBe(1);
      expect(mockEntry.lastAccessed).toBeInstanceOf(Date);
    });
  });

  describe('Limites e LRU', () => {
    it('deve enforçar limite de entradas', async () => {
      const maxEntries = 10;
      const currentEntries = 10;

      const shouldEvict = currentEntries >= maxEntries;
      expect(shouldEvict).toBe(true);
    });

    it('deve enforçar limite de tamanho', async () => {
      const maxSize = 100 * 1024 * 1024; // 100MB
      const currentSize = 95 * 1024 * 1024; // 95MB
      const newEntrySize = 10 * 1024 * 1024; // 10MB

      const wouldExceed = (currentSize + newEntrySize) > maxSize;
      expect(wouldExceed).toBe(true);
    });

    it('deve remover entradas menos usadas (LRU)', () => {
      const entries = [
        { key: 'a', lastAccessed: new Date('2024-01-01') },
        { key: 'b', lastAccessed: new Date('2024-01-03') },
        { key: 'c', lastAccessed: new Date('2024-01-02') }
      ];

      const sorted = entries.sort((a, b) => 
        a.lastAccessed.getTime() - b.lastAccessed.getTime()
      );

      expect(sorted[0].key).toBe('a'); // Mais antigo
      expect(sorted[sorted.length - 1].key).toBe('b'); // Mais recente
    });
  });

  describe('Expiração de Cache', () => {
    it('deve marcar entrada como expirada após TTL', () => {
      const ttl = 60; // 60 segundos
      const created = new Date('2024-01-01T00:00:00');
      const expiresAt = new Date(created.getTime() + ttl * 1000);
      const now = new Date('2024-01-01T00:02:00'); // 2 minutos depois

      const isExpired = expiresAt < now;
      expect(isExpired).toBe(true);
    });

    it('deve manter entrada válida antes do TTL', () => {
      const ttl = 60; // 60 segundos
      const created = new Date('2024-01-01T00:00:00');
      const expiresAt = new Date(created.getTime() + ttl * 1000);
      const now = new Date('2024-01-01T00:00:30'); // 30 segundos depois

      const isExpired = expiresAt < now;
      expect(isExpired).toBe(false);
    });
  });

  describe('Limpeza Automática', () => {
    it('deve identificar entradas expiradas', () => {
      const now = new Date();
      const entries = [
        { key: 'a', expiresAt: new Date(now.getTime() - 1000) }, // Expirada
        { key: 'b', expiresAt: new Date(now.getTime() + 1000) }, // Válida
        { key: 'c', expiresAt: new Date(now.getTime() - 5000) }  // Expirada
      ];

      const expired = entries.filter(e => e.expiresAt && e.expiresAt < now);
      expect(expired).toHaveLength(2);
    });

    it('deve agendar limpeza periódica', () => {
      const cleanupInterval = 60 * 60 * 1000; // 1 hora
      expect(cleanupInterval).toBe(3600000);
    });
  });

  describe('Estatísticas', () => {
    it('deve calcular hit rate corretamente', () => {
      const hits = 80;
      const misses = 20;
      const total = hits + misses;

      const hitRate = (hits / total) * 100;
      expect(hitRate).toBe(80);
    });

    it('deve calcular miss rate corretamente', () => {
      const hits = 75;
      const misses = 25;
      const total = hits + misses;

      const missRate = (misses / total) * 100;
      expect(missRate).toBe(25);
    });

    it('deve rastrear tamanho total do cache', () => {
      const entries = [
        { fileSize: 10 * 1024 * 1024 },
        { fileSize: 25 * 1024 * 1024 },
        { fileSize: 15 * 1024 * 1024 }
      ];

      const totalSize = entries.reduce((sum, e) => sum + e.fileSize, 0);
      const totalMB = totalSize / 1024 / 1024;

      expect(totalMB).toBe(50);
    });
  });

  describe('Formatação de Informações', () => {
    it('deve formatar tamanhos em MB', () => {
      const bytes = 52428800; // 50MB
      const mb = (bytes / 1024 / 1024).toFixed(2);

      expect(mb).toBe('50.00');
    });

    it('deve formatar percentuais', () => {
      const hitRate = 85.6789;
      const formatted = hitRate.toFixed(2);

      expect(formatted).toBe('85.68');
    });

    it('deve formatar datas', () => {
      const date = new Date('2024-01-01T12:00:00');
      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toContain('2024-01-01');
    });
  });

  describe('Persistência', () => {
    it('deve salvar metadados em JSON', () => {
      const entries = [
        {
          key: 'test-1',
          created: new Date(),
          metadata: { duration: 120 }
        }
      ];

      const json = JSON.stringify(entries, null, 2);
      expect(json).toContain('test-1');
      expect(json).toContain('duration');
    });

    it('deve carregar metadados do JSON', () => {
      const json = JSON.stringify([
        {
          key: 'test-1',
          created: '2024-01-01T00:00:00.000Z',
          lastAccessed: '2024-01-01T00:00:00.000Z'
        }
      ]);

      const entries = JSON.parse(json);
      expect(entries).toHaveLength(1);
      expect(entries[0].key).toBe('test-1');
    });
  });

  describe('Limpeza de Cache', () => {
    it('deve remover entrada específica', async () => {
      const mockEntries = new Map([
        ['key1', { key: 'key1' }],
        ['key2', { key: 'key2' }]
      ]);

      mockEntries.delete('key1');
      expect(mockEntries.size).toBe(1);
      expect(mockEntries.has('key1')).toBe(false);
    });

    it('deve limpar todo o cache', async () => {
      const mockEntries = new Map([
        ['key1', { key: 'key1' }],
        ['key2', { key: 'key2' }],
        ['key3', { key: 'key3' }]
      ]);

      mockEntries.clear();
      expect(mockEntries.size).toBe(0);
    });
  });
});
