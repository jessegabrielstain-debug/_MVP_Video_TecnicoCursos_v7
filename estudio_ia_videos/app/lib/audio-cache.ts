/**
 * Audio Cache
 * Sistema de cache para áudio TTS
 */

export interface CachedAudio {
  id: string;
  key: string;
  buffer: Buffer;
  format: string;
  duration: number;
  size: number;
  cachedAt: Date;
}

export class AudioCache {
  private cache: Map<string, CachedAudio> = new Map();
  private maxSize = 512 * 1024 * 1024; // 512MB
  private currentSize = 0;
  
  set(key: string, buffer: Buffer, format: string, duration: number): void {
    // Limpar cache se necessário
    while (this.currentSize + buffer.length > this.maxSize && this.cache.size > 0) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.delete(oldestKey);
    }
    
    const cached: CachedAudio = {
      id: crypto.randomUUID(),
      key,
      buffer,
      format,
      duration,
      size: buffer.length,
      cachedAt: new Date(),
    };
    
    this.cache.set(key, cached);
    this.currentSize += buffer.length;
  }
  
  get(key: string): CachedAudio | null {
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
  
  getStats(): { items: number; size: number; maxSize: number; totalDuration: number } {
    const totalDuration = Array.from(this.cache.values())
      .reduce((sum, audio) => sum + audio.duration, 0);
    
    return {
      items: this.cache.size,
      size: this.currentSize,
      maxSize: this.maxSize,
      totalDuration,
    };
  }
}

export const audioCache = new AudioCache();
