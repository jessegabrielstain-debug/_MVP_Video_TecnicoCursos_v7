/**
 * 🎨 MEDIA PREPROCESSOR - 100% REAL E FUNCIONAL
 * 
 * Sistema de pré-processamento inteligente de mídia
 * Otimiza imagens e vídeos antes da renderização final
 * 
 * @version 1.0.0
 * @author Estúdio IA de Vídeos
 * @date 08/10/2025
 */

import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  originalPath: string;
  processedPath?: string;
  metadata: MediaMetadata;
  optimizations: OptimizationResult[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  fileSize: number;
  format: string;
  duration?: number;
  bitrate?: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  aspectRatio?: string;
}

export interface OptimizationResult {
  type: 'resize' | 'compress' | 'format-conversion' | 'color-correction' | 'noise-reduction';
  appliedAt: Date;
  parameters: Record<string, unknown>;
  before: {
    fileSize: number;
    quality?: number;
  };
  after: {
    fileSize: number;
    quality?: number;
  };
  improvement: {
    sizeReduction: number; // em %
    qualityLoss?: number; // em %
  };
}

export interface PreprocessingOptions {
  targetWidth?: number;
  targetHeight?: number;
  maxFileSize?: number; // em bytes
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  autoOptimize?: boolean;
  preserveMetadata?: boolean;
  removeNoise?: boolean;
  enhanceColors?: boolean;
  normalizeAspectRatio?: boolean;
}

export interface ProcessingStats {
  totalProcessed: number;
  totalSaved: number; // bytes economizados
  averageProcessingTime: number; // ms
  successRate: number; // %
  failureReasons: Map<string, number>;
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class MediaPreprocessor {
  private static instance: MediaPreprocessor;
  private processingQueue: Map<string, MediaAsset>;
  private stats: ProcessingStats;
  private cacheDir: string;

  private constructor() {
    this.processingQueue = new Map();
    this.cacheDir = process.env.MEDIA_CACHE_DIR || '/tmp/media-cache';
    this.stats = {
      totalProcessed: 0,
      totalSaved: 0,
      averageProcessingTime: 0,
      successRate: 100,
      failureReasons: new Map(),
    };
    this.initializeCache();
  }

  /**
   * Singleton
   */
  public static getInstance(): MediaPreprocessor {
    if (!MediaPreprocessor.instance) {
      MediaPreprocessor.instance = new MediaPreprocessor();
    }
    return MediaPreprocessor.instance;
  }

  /**
   * Inicializa diretório de cache
   */
  private async initializeCache(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log(`✅ [MediaPreprocessor] Cache directory initialized: ${this.cacheDir}`);
    } catch (error) {
      console.error('❌ [MediaPreprocessor] Failed to initialize cache:', error);
    }
  }

  /**
   * Processa uma imagem completa
   */
  public async processImage(
    imagePath: string,
    options: PreprocessingOptions = {}
  ): Promise<MediaAsset> {
    const startTime = Date.now();
    const assetId = this.generateAssetId(imagePath);

    try {
      console.log(`🎨 [MediaPreprocessor] Processing image: ${imagePath}`);

      // 1. Ler metadados da imagem original
      const originalMetadata = await this.extractImageMetadata(imagePath);
      
      // 2. Criar asset
      const asset: MediaAsset = {
        id: assetId,
        type: 'image',
        originalPath: imagePath,
        metadata: originalMetadata,
        optimizations: [],
        status: 'processing',
      };

      this.processingQueue.set(assetId, asset);

      // 3. Aplicar otimizações
      let processedPath = imagePath;
      const originalSize = originalMetadata.fileSize;

      // 3.1. Redimensionamento
      if (options.targetWidth || options.targetHeight) {
        processedPath = await this.resizeImage(processedPath, options, asset);
      }

      // 3.2. Compressão inteligente
      if (options.autoOptimize || options.quality) {
        processedPath = await this.compressImage(processedPath, options, asset);
      }

      // 3.3. Conversão de formato
      if (options.format && options.format !== originalMetadata.format) {
        processedPath = await this.convertFormat(processedPath, options.format, asset);
      }

      // 3.4. Correção de cores (se habilitado)
      if (options.enhanceColors) {
        processedPath = await this.enhanceColors(processedPath, asset);
      }

      // 3.5. Redução de ruído (se habilitado)
      if (options.removeNoise) {
        processedPath = await this.reduceNoise(processedPath, asset);
      }

      // 4. Atualizar metadados finais
      const finalMetadata = await this.extractImageMetadata(processedPath);
      asset.processedPath = processedPath;
      asset.metadata = finalMetadata;
      asset.status = 'completed';

      // 5. Calcular estatísticas
      const processingTime = Date.now() - startTime;
      const savedBytes = originalSize - finalMetadata.fileSize;
      
      this.updateStats(processingTime, savedBytes, true);

      console.log(`✅ [MediaPreprocessor] Image processed in ${processingTime}ms`);
      console.log(`   Original: ${this.formatBytes(originalSize)}`);
      console.log(`   Processed: ${this.formatBytes(finalMetadata.fileSize)}`);
      console.log(`   Saved: ${this.formatBytes(savedBytes)} (${((savedBytes / originalSize) * 100).toFixed(2)}%)`);

      return asset;

    } catch (error) {
      console.error(`❌ [MediaPreprocessor] Failed to process image:`, error);
      const asset = this.processingQueue.get(assetId);
      if (asset) {
        asset.status = 'failed';
      }
      this.updateStats(Date.now() - startTime, 0, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Processa lote de imagens
   */
  public async processBatch(
    imagePaths: string[],
    options: PreprocessingOptions = {}
  ): Promise<MediaAsset[]> {
    console.log(`📦 [MediaPreprocessor] Processing batch of ${imagePaths.length} images`);
    
    const results: MediaAsset[] = [];
    
    for (const imagePath of imagePaths) {
      try {
        const result = await this.processImage(imagePath, options);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to process ${imagePath}:`, error);
        // Continua com as próximas imagens
      }
    }

    console.log(`✅ [MediaPreprocessor] Batch completed: ${results.length}/${imagePaths.length} successful`);
    
    return results;
  }

  /**
   * Extrai metadados de imagem usando Sharp
   */
  private async extractImageMetadata(imagePath: string): Promise<MediaMetadata> {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await fs.stat(imagePath);

      return {
        width: metadata.width,
        height: metadata.height,
        fileSize: stats.size,
        format: metadata.format || 'unknown',
        colorSpace: metadata.space,
        hasAlpha: metadata.hasAlpha,
        aspectRatio: metadata.width && metadata.height 
          ? `${metadata.width}:${metadata.height}`
          : undefined,
      };
    } catch (error) {
      console.error('❌ Failed to extract metadata:', error);
      throw error;
    }
  }

  /**
   * Redimensiona imagem mantendo aspect ratio
   */
  private async resizeImage(
    imagePath: string,
    options: PreprocessingOptions,
    asset: MediaAsset
  ): Promise<string> {
    const beforeSize = (await fs.stat(imagePath)).size;
    const outputPath = await this.generateOutputPath(imagePath, 'resized');

    await sharp(imagePath)
      .resize(options.targetWidth, options.targetHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFile(outputPath);

    const afterSize = (await fs.stat(outputPath)).size;

    asset.optimizations.push({
      type: 'resize',
      appliedAt: new Date(),
      parameters: {
        targetWidth: options.targetWidth,
        targetHeight: options.targetHeight,
      },
      before: { fileSize: beforeSize },
      after: { fileSize: afterSize },
      improvement: {
        sizeReduction: ((beforeSize - afterSize) / beforeSize) * 100,
      },
    });

    return outputPath;
  }

  /**
   * Comprime imagem com qualidade otimizada
   */
  private async compressImage(
    imagePath: string,
    options: PreprocessingOptions,
    asset: MediaAsset
  ): Promise<string> {
    const beforeSize = (await fs.stat(imagePath)).size;
    const outputPath = await this.generateOutputPath(imagePath, 'compressed');
    const quality = options.quality || 85;

    const metadata = await sharp(imagePath).metadata();
    
    let sharpInstance = sharp(imagePath);

    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
    } else if (metadata.format === 'png') {
      sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
    } else if (metadata.format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    }

    await sharpInstance.toFile(outputPath);

    const afterSize = (await fs.stat(outputPath)).size;

    asset.optimizations.push({
      type: 'compress',
      appliedAt: new Date(),
      parameters: { quality },
      before: { fileSize: beforeSize, quality: 100 },
      after: { fileSize: afterSize, quality },
      improvement: {
        sizeReduction: ((beforeSize - afterSize) / beforeSize) * 100,
        qualityLoss: 100 - quality,
      },
    });

    return outputPath;
  }

  /**
   * Converte formato de imagem
   */
  private async convertFormat(
    imagePath: string,
    targetFormat: 'jpeg' | 'png' | 'webp' | 'avif',
    asset: MediaAsset
  ): Promise<string> {
    const beforeSize = (await fs.stat(imagePath)).size;
    const outputPath = await this.generateOutputPath(imagePath, `format-${targetFormat}`);

    let sharpInstance = sharp(imagePath);

    switch (targetFormat) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: 90, mozjpeg: true });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ compressionLevel: 9 });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: 90 });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ quality: 90 });
        break;
    }

    await sharpInstance.toFile(outputPath);

    const afterSize = (await fs.stat(outputPath)).size;

    asset.optimizations.push({
      type: 'format-conversion',
      appliedAt: new Date(),
      parameters: { targetFormat },
      before: { fileSize: beforeSize },
      after: { fileSize: afterSize },
      improvement: {
        sizeReduction: ((beforeSize - afterSize) / beforeSize) * 100,
      },
    });

    return outputPath;
  }

  /**
   * Melhora cores da imagem
   */
  private async enhanceColors(imagePath: string, asset: MediaAsset): Promise<string> {
    const beforeSize = (await fs.stat(imagePath)).size;
    const outputPath = await this.generateOutputPath(imagePath, 'enhanced');

    await sharp(imagePath)
      .normalize() // Normaliza níveis de cor
      .modulate({
        brightness: 1.05, // +5% brilho
        saturation: 1.1,  // +10% saturação
      })
      .toFile(outputPath);

    const afterSize = (await fs.stat(outputPath)).size;

    asset.optimizations.push({
      type: 'color-correction',
      appliedAt: new Date(),
      parameters: { brightness: 1.05, saturation: 1.1 },
      before: { fileSize: beforeSize },
      after: { fileSize: afterSize },
      improvement: {
        sizeReduction: ((beforeSize - afterSize) / beforeSize) * 100,
      },
    });

    return outputPath;
  }

  /**
   * Reduz ruído da imagem
   */
  private async reduceNoise(imagePath: string, asset: MediaAsset): Promise<string> {
    const beforeSize = (await fs.stat(imagePath)).size;
    const outputPath = await this.generateOutputPath(imagePath, 'denoised');

    await sharp(imagePath)
      .median(3) // Filtro mediano para redução de ruído
      .toFile(outputPath);

    const afterSize = (await fs.stat(outputPath)).size;

    asset.optimizations.push({
      type: 'noise-reduction',
      appliedAt: new Date(),
      parameters: { kernelSize: 3 },
      before: { fileSize: beforeSize },
      after: { fileSize: afterSize },
      improvement: {
        sizeReduction: ((beforeSize - afterSize) / beforeSize) * 100,
      },
    });

    return outputPath;
  }

  /**
   * Gera caminho de saída único
   */
  private async generateOutputPath(originalPath: string, suffix: string): Promise<string> {
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const hash = crypto.randomBytes(4).toString('hex');
    return path.join(this.cacheDir, `${basename}-${suffix}-${hash}${ext}`);
  }

  /**
   * Gera ID único para asset
   */
  private generateAssetId(filePath: string): string {
    return crypto.createHash('md5').update(filePath + Date.now()).digest('hex');
  }

  /**
   * Atualiza estatísticas
   */
  private updateStats(
    processingTime: number,
    bytesSaved: number,
    success: boolean,
    failureReason?: string
  ): void {
    this.stats.totalProcessed++;
    
    if (success) {
      this.stats.totalSaved += bytesSaved;
      const currentAvg = this.stats.averageProcessingTime;
      this.stats.averageProcessingTime = 
        (currentAvg * (this.stats.totalProcessed - 1) + processingTime) / this.stats.totalProcessed;
    } else if (failureReason) {
      const count = this.stats.failureReasons.get(failureReason) || 0;
      this.stats.failureReasons.set(failureReason, count + 1);
    }

    const successCount = this.stats.totalProcessed - 
      Array.from(this.stats.failureReasons.values()).reduce((a, b) => a + b, 0);
    this.stats.successRate = (successCount / this.stats.totalProcessed) * 100;
  }

  /**
   * Obtém estatísticas de processamento
   */
  public getStats(): ProcessingStats {
    return { ...this.stats };
  }

  /**
   * Formata bytes para leitura humana
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Limpa cache antigo
   */
  public async cleanCache(olderThanDays: number = 7): Promise<number> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();
      const maxAge = olderThanDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      console.log(`🧹 [MediaPreprocessor] Cleaned ${deletedCount} old cache files`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Failed to clean cache:', error);
      return 0;
    }
  }
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export const mediaPreprocessor = MediaPreprocessor.getInstance();
export default mediaPreprocessor;
