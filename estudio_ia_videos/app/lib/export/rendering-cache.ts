
import { ExportSettings } from '../../types/export.types';
import * as crypto from 'crypto';

export interface CacheStats {
  entries: number;
  totalSize: number;
  totalSizeMB: number;
  hits: number;
  misses: number;
  oldestEntry?: Date | null;
  newestEntry?: Date | null;
}

export class RenderingCache {
  private cache: Map<string, string> = new Map();
  private hits = 0;
  private misses = 0;

  async get(key: string): Promise<string | null> {
    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key) || null;
    }
    this.misses++;
    return null;
  }

  async set(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
  }

  generateKey(settings: ExportSettings): string {
    return this.hashObject(settings as unknown as Record<string, unknown>);
  }

  hashObject(obj: Record<string, unknown>): string {
    const stableString = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('md5').update(stableString).digest('hex');
  }

  getStats(): CacheStats {
    const size = this.cache.size * 1024; // Mock size
    return {
      entries: this.cache.size,
      totalSize: size,
      totalSizeMB: size / (1024 * 1024),
      hits: this.hits,
      misses: this.misses,
      oldestEntry: this.cache.size > 0 ? new Date() : null,
      newestEntry: this.cache.size > 0 ? new Date() : null
    };
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}
