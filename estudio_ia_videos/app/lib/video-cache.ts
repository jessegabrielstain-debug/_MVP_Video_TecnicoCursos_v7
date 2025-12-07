import crypto from 'crypto';

/**
 * Video Cache
 * Sistema de cache para vídeos renderizados
 */

export interface CachedVideo {
  id: string;
  key: string;
  buffer: Buffer;
  format: string;
  size: number;
  cachedAt: Date;
}

export class VideoCache {
  private cache: Map<string, CachedVideo> = new Map();
  private maxSize = 1024 * 1024 * 1024; // 1GB
  private currentSize = 0;
  
  set(key: string, buffer: Buffer, format: string): void {
    // Limpar cache se necessário
    while (this.currentSize + buffer.length > this.maxSize && this.cache.size > 0) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.delete(oldestKey);
    }
    
    const cached: CachedVideo = {
      id: crypto.randomUUID(),
      key,
      buffer,
      format,
      size: buffer.length,
      cachedAt: new Date(),
    };
    
    this.cache.set(key, cached);
    this.currentSize += buffer.length;
  }
  
  get(key: string): CachedVideo | null {
    return this.cache.get(key) || null;
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  delete(key: string): boolean {
    const cached = this.cache.get(key);
    if (cached) {
      this.currentSize -= cached.size;
      return this.cache.delete(key);
    }
    return false;
  }
  
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }
  
  getStats(): { items: number; size: number; maxSize: number } {
    return {
      items: this.cache.size,
      size: this.currentSize,
      maxSize: this.maxSize,
    };
  }
}

export const videoCache = new VideoCache();
