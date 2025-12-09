/**
 * Hybrid Cloud Rendering - Proxy Generator
 * Generates lightweight proxies for browser editing while server renders high quality
 */

import { logger } from '@/lib/logger';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface ProxyConfig {
  resolution: '360p' | '480p' | '720p';
  bitrate: string;
  codec: 'h264' | 'h265';
  format: 'mp4' | 'webm';
}

export interface ProxyMetadata {
  originalPath: string;
  proxyPath: string;
  resolution: string;
  bitrate: string;
  fileSize: number;
  duration: number;
  createdAt: Date;
  hash: string;
}

export class ProxyGenerator {
  private proxyCache: Map<string, ProxyMetadata> = new Map();
  
  private readonly defaultConfigs: Record<string, ProxyConfig> = {
    '360p': {
      resolution: '360p',
      bitrate: '500k',
      codec: 'h264',
      format: 'mp4'
    },
    '480p': {
      resolution: '480p', 
      bitrate: '800k',
      codec: 'h264',
      format: 'mp4'
    },
    '720p': {
      resolution: '720p',
      bitrate: '1500k',
      codec: 'h264',
      format: 'mp4'
    }
  };

  /**
   * Generate proxy for video file
   */
  async generateProxy(
    inputPath: string,
    outputDir: string,
    config: ProxyConfig = this.defaultConfigs['720p']
  ): Promise<ProxyMetadata> {
    const fileHash = await this.generateFileHash(inputPath);
    const proxyFileName = `proxy_${fileHash}_${config.resolution}.${config.format}`;
    const proxyPath = path.join(outputDir, proxyFileName);

    // Check if proxy already exists
    if (this.proxyCache.has(fileHash)) {
      const cached = this.proxyCache.get(fileHash)!;
      try {
        await fs.access(cached.proxyPath);
        return cached;
      } catch {
        // Proxy file doesn't exist, regenerate
        this.proxyCache.delete(fileHash);
      }
    }

    // Generate new proxy
    const metadata = await this.createProxy(inputPath, proxyPath, config);
    
    // Store in cache
    this.proxyCache.set(fileHash, metadata);
    
    return metadata;
  }

  /**
   * Create proxy file using FFmpeg
   */
  private async createProxy(
    inputPath: string,
    outputPath: string,
    config: ProxyConfig
  ): Promise<ProxyMetadata> {
    return new Promise((resolve, reject) => {
      const resolutionMap = {
        '360p': '640x360',
        '480p': '854x480',
        '720p': '1280x720'
      };

      ffmpeg(inputPath)
        .videoCodec(config.codec)
        .size(resolutionMap[config.resolution])
        .videoBitrate(config.bitrate)
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputFormat(config.format)
        .on('start', (commandLine) => {
          logger.info('[ProxyGenerator] FFmpeg command', { component: 'ProxyGenerator', commandLine });
        })
        .on('progress', (progress) => {
          logger.info(`[ProxyGenerator] Progress: ${progress.percent}%`, { component: 'ProxyGenerator' });
        })
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            const videoInfo = await this.getVideoInfo(outputPath);
            
            const metadata: ProxyMetadata = {
              originalPath: inputPath,
              proxyPath: outputPath,
              resolution: config.resolution,
              bitrate: config.bitrate,
              fileSize: stats.size,
              duration: videoInfo.duration,
              createdAt: new Date(),
              hash: await this.generateFileHash(inputPath)
            };
            
            resolve(metadata);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          logger.error('[ProxyGenerator] FFmpeg error', error instanceof Error ? error : new Error(String(error)), { component: 'ProxyGenerator' });
          reject(error);
        })
        .save(outputPath);
    });
  }

  /**
   * Get video information
   */
  private async getVideoInfo(filePath: string): Promise<{ duration: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          duration: metadata.format.duration || 0
        });
      });
    });
  }

  /**
   * Generate file hash for cache key
   */
  private async generateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Get proxy for file (generate if needed)
   */
  async getOrCreateProxy(
    inputPath: string,
    outputDir: string,
    config?: ProxyConfig
  ): Promise<ProxyMetadata> {
    const fileHash = await this.generateFileHash(inputPath);
    
    if (this.proxyCache.has(fileHash)) {
      const cached = this.proxyCache.get(fileHash)!;
      try {
        await fs.access(cached.proxyPath);
        return cached;
      } catch {
        this.proxyCache.delete(fileHash);
      }
    }

    return this.generateProxy(inputPath, outputDir, config);
  }

  /**
   * Clean up old proxies
   */
  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const now = new Date();
    const toDelete: string[] = [];

    for (const [hash, metadata] of this.proxyCache.entries()) {
      if (now.getTime() - metadata.createdAt.getTime() > maxAge) {
        toDelete.push(hash);
      }
    }

    for (const hash of toDelete) {
      const metadata = this.proxyCache.get(hash);
      if (metadata) {
        try {
          await fs.unlink(metadata.proxyPath);
          this.proxyCache.delete(hash);
        } catch (error) {
          logger.error('[ProxyGenerator] Failed to delete proxy', error instanceof Error ? error : new Error(String(error)), { component: 'ProxyGenerator' });
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; totalSize: number } {
    let totalSize = 0;
    for (const metadata of this.proxyCache.values()) {
      totalSize += metadata.fileSize;
    }

    return {
      total: this.proxyCache.size,
      totalSize
    };
  }
}