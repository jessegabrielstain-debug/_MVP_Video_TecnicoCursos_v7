import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

export interface CacheOptions {
  cacheDir?: string;
  maxSize?: number; // bytes
  maxEntries?: number;
  ttl?: number; // seconds
  cleanupInterval?: number; // milliseconds
}

export interface CacheEntry {
  key: string;
  inputHash: string;
  settingsHash: string;
  outputPath: string;
  metadata: {
    duration?: number;
    fileSize: number;
    resolution?: string;
    format?: string;
    [key: string]: unknown;
  };
  created: Date;
  lastAccessed: Date;
  expiresAt?: Date;
  accessCount: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  totalSize: number;
  entriesCount: number;
  hitRate: number;
  missRate: number;
}

export class RenderingCache extends EventEmitter {
  private cacheDir: string;
  private maxSize: number;
  private maxEntries: number;
  private ttl: number;
  private cleanupInterval: number;
  private entries: Map<string, CacheEntry>;
  private stats: { hits: number; misses: number };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    super();
    this.cacheDir = options.cacheDir || path.join(process.cwd(), 'tmp', 'cache');
    this.maxSize = options.maxSize || 1024 * 1024 * 1024; // 1GB default
    this.maxEntries = options.maxEntries || 100;
    this.ttl = options.ttl || 24 * 60 * 60; // 24 hours default
    this.cleanupInterval = options.cleanupInterval || 60 * 60 * 1000; // 1 hour default
    
    this.entries = new Map();
    this.stats = { hits: 0, misses: 0 };

    this.init();
  }

  private async init() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      await this.loadMetadata();
      this.startCleanupTimer();
    } catch (error) {
      logger.error('Failed to initialize cache', error instanceof Error ? error : new Error(String(error)), { component: 'Cache' });
    }
  }

  private startCleanupTimer() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  async generateCacheKey(inputPath: string, settings: Record<string, unknown>): Promise<{ key: string; inputHash: string; settingsHash: string }> {
    const inputHash = crypto.createHash('md5').update(inputPath).digest('hex');
    const settingsHash = crypto.createHash('md5').update(JSON.stringify(settings)).digest('hex');
    const key = `${inputHash}_${settingsHash}`;
    return { key, inputHash, settingsHash };
  }

  async get(key: string): Promise<CacheEntry | null> {
    const entry = this.entries.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Verify file exists
    try {
      await fs.access(entry.outputPath);
    } catch {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.lastAccessed = new Date();
    entry.accessCount++;
    this.stats.hits++;
    
    // Persist metadata update (async)
    this.saveMetadata().catch(err => logger.error('Failed to save metadata', err instanceof Error ? err : new Error(String(err)), { component: 'Cache' }));

    return entry;
  }

  async set(key: string, outputPath: string, metadata: CacheEntry['metadata'], inputHash: string, settingsHash: string): Promise<void> {
    // Check limits before adding
    await this.enforceLimits(metadata.fileSize || 0);

    const entry: CacheEntry = {
      key,
      inputHash,
      settingsHash,
      outputPath,
      metadata,
      created: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      expiresAt: new Date(Date.now() + this.ttl * 1000)
    };

    this.entries.set(key, entry);
    await this.saveMetadata();
  }

  async delete(key: string): Promise<void> {
    const entry = this.entries.get(key);
    if (entry) {
      try {
        // Cleanup intencional: Ignora erro se arquivo não existir (já foi deletado)
        await fs.unlink(entry.outputPath).catch(() => {});
      } catch (e) {
        // ignore
      }
      this.entries.delete(key);
      await this.saveMetadata();
    }
  }

  async clear(): Promise<void> {
    for (const key of this.entries.keys()) {
      await this.delete(key);
    }
    this.entries.clear();
    this.stats = { hits: 0, misses: 0 };
    await this.saveMetadata();
  }

  private async enforceLimits(newEntrySize: number) {
    // 1. Enforce max entries
    if (this.entries.size >= this.maxEntries) {
      await this.evictLRU();
    }

    // 2. Enforce max size
    let currentSize = this.getTotalSize();
    while (currentSize + newEntrySize > this.maxSize && this.entries.size > 0) {
      await this.evictLRU();
      currentSize = this.getTotalSize();
    }
  }

  private async evictLRU() {
    if (this.entries.size === 0) return;

    let lruKey: string | null = null;
    let lruDate: Date | null = null;

    for (const [key, entry] of this.entries.entries()) {
      if (!lruDate || entry.lastAccessed < lruDate) {
        lruDate = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      await this.delete(lruKey);
    }
  }

  private getTotalSize(): number {
    let size = 0;
    for (const entry of this.entries.values()) {
      size += entry.metadata.fileSize || 0;
    }
    return size;
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        await this.delete(key);
      }
    }
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      totalSize: this.getTotalSize(),
      entriesCount: this.entries.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      missRate: total > 0 ? (this.stats.misses / total) * 100 : 0
    };
  }

  private async loadMetadata() {
    const metadataPath = path.join(this.cacheDir, 'metadata.json');
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      const entries = JSON.parse(data);
      this.entries.clear();
      for (const entry of entries) {
        // Revive dates
        entry.created = new Date(entry.created);
        entry.lastAccessed = new Date(entry.lastAccessed);
        if (entry.expiresAt) entry.expiresAt = new Date(entry.expiresAt);
        this.entries.set(entry.key, entry);
      }
    } catch (error) {
      // Ignore error if file doesn't exist
    }
  }

  private async saveMetadata() {
    const metadataPath = path.join(this.cacheDir, 'metadata.json');
    const entries = Array.from(this.entries.values());
    try {
      await fs.writeFile(metadataPath, JSON.stringify(entries, null, 2));
    } catch (error) {
      logger.error('Failed to save cache metadata', error instanceof Error ? error : new Error(String(error)), { component: 'Cache' });
    }
  }

  async destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    await this.clear();
    try {
        await fs.rm(this.cacheDir, { recursive: true, force: true });
    } catch (e) {
        // ignore
    }
  }
}
