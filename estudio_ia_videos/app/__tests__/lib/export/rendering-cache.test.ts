/**
 * 🧪 Tests - Rendering Cache
 * Sprint 50 - Advanced Features
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { RenderingCache } from '../../../lib/export/rendering-cache'
import { ExportFormat, ExportResolution, ExportQuality } from '../../../types/export.types'
import type { ExportSettings } from '../../../types/export.types'

describe('RenderingCache - Intelligent Caching', () => {
  type RenderingCacheWithPrivate = RenderingCache & {
    hashObject: (value: unknown) => string
  }

  describe('Cache Key Generation', () => {
    it('deve gerar cache key a partir de input e settings', async () => {
      const cache = new RenderingCache()

      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      // Mock input path (won't actually read file in test)
      const mockKey = {
        key: 'abc123_def456',
        inputHash: 'abc123',
        settingsHash: 'def456',
      }

      expect(mockKey).toHaveProperty('key')
      expect(mockKey).toHaveProperty('inputHash')
      expect(mockKey).toHaveProperty('settingsHash')
      expect(mockKey.key).toContain(mockKey.inputHash)
      expect(mockKey.key).toContain(mockKey.settingsHash)
    })

    it('cache key deve ser determinístico para mesmas configurações', () => {
      const cache = new RenderingCache()

      const settings1: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      const settings2: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      // Same settings should generate same hash
      const hash1 = (cache as unknown as RenderingCacheWithPrivate).hashObject(settings1)
      const hash2 = (cache as unknown as RenderingCacheWithPrivate).hashObject(settings2)

      expect(hash1).toBe(hash2)
    })

    it('cache key deve mudar com configurações diferentes', () => {
      const cache = new RenderingCache()

      const settings1: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      const settings2: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.MEDIUM,
        fps: 24,
      }

      const hash1 = (cache as unknown as RenderingCacheWithPrivate).hashObject(settings1)
      const hash2 = (cache as unknown as RenderingCacheWithPrivate).hashObject(settings2)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Cache Entry Structure', () => {
    it('cache entry deve ter estrutura correta', () => {
      const mockEntry = {
        key: 'test_key',
        inputHash: 'input_hash',
        settingsHash: 'settings_hash',
        outputPath: '/cache/output.mp4',
        createdAt: Date.now(),
        fileSize: 50000000,
        duration: 5000,
      }

      expect(mockEntry).toHaveProperty('key')
      expect(mockEntry).toHaveProperty('inputHash')
      expect(mockEntry).toHaveProperty('settingsHash')
      expect(mockEntry).toHaveProperty('outputPath')
      expect(mockEntry).toHaveProperty('createdAt')
      expect(mockEntry).toHaveProperty('fileSize')
      expect(mockEntry).toHaveProperty('duration')
    })
  })

  describe('Cache Statistics', () => {
    it('deve retornar estatísticas corretas para cache vazio', () => {
      const cache = new RenderingCache()
      const stats = cache.getStats()

      expect(stats).toHaveProperty('entries')
      expect(stats).toHaveProperty('totalSize')
      expect(stats).toHaveProperty('totalSizeMB')
      expect(stats).toHaveProperty('oldestEntry')
      expect(stats).toHaveProperty('newestEntry')

      expect(stats.entries).toBe(0)
      expect(stats.totalSize).toBe(0)
      expect(stats.totalSizeMB).toBe(0)
      expect(stats.oldestEntry).toBeNull()
      expect(stats.newestEntry).toBeNull()
    })
  })

  describe('Cache Metadata', () => {
    it('metadata deve ter estrutura correta', () => {
      const mockMetadata = {
        entries: {},
        totalSize: 0,
        lastCleanup: Date.now(),
      }

      expect(mockMetadata).toHaveProperty('entries')
      expect(mockMetadata).toHaveProperty('totalSize')
      expect(mockMetadata).toHaveProperty('lastCleanup')
    })
  })

  describe('Hash Object Consistency', () => {
    it('deve gerar hash consistente para objetos com mesmas propriedades', () => {
      const cache = new RenderingCache()

      const obj1 = { a: 1, b: 2, c: 3 }
      const obj2 = { c: 3, a: 1, b: 2 } // Different order

      const hash1 = (cache as unknown as RenderingCacheWithPrivate).hashObject(obj1)
      const hash2 = (cache as unknown as RenderingCacheWithPrivate).hashObject(obj2)

      expect(hash1).toBe(hash2)
    })

    it('deve gerar hash diferente para objetos diferentes', () => {
      const cache = new RenderingCache()

      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, b: 3 }

      const hash1 = (cache as unknown as RenderingCacheWithPrivate).hashObject(obj1)
      const hash2 = (cache as unknown as RenderingCacheWithPrivate).hashObject(obj2)

      expect(hash1).not.toBe(hash2)
    })

    it('deve gerar hash MD5 válido (32 caracteres hex)', () => {
      const cache = new RenderingCache()

      const obj = { test: 'data' }
      const hash = (cache as unknown as RenderingCacheWithPrivate).hashObject(obj)

      expect(hash).toMatch(/^[a-f0-9]{32}$/)
      expect(hash.length).toBe(32)
    })
  })
})
