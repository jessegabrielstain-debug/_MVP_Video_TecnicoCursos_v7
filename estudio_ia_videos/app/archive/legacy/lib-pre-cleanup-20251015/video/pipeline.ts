/**
 * 🎬 VIDEO PROCESSING PIPELINE - SPRINT 56
 * Sistema completo de processamento de vídeo com todos os módulos integrados
 * 
 * Integra todos os módulos para processamento completo de vídeos:
 * - Validação (Sprint 54)
 * - Análise de áudio (Sprint 54)
 * - Transcodificação (Sprint 55)
 * - Geração de thumbnails (Sprint 55)
 * - Aplicação de watermarks (Sprint 55)
 * - Embedding de legendas (Sprint 55)
 * - Fila de processamento
 * - Cache inteligente
 * 
 * @version 2.0.0 - Sprint 56
 * @updated 2025-10-09
 */

import { VideoValidator } from './validator';
import { AudioAnalyzer } from '../audio/analyzer';
import { VideoProcessingQueue, QueuePriority, JobStatus } from './queue-manager';
import { CacheManager } from '../cache/cache-manager';
import { VideoTranscoder, TranscodeOptions } from './transcoder';
import { ThumbnailGenerator, ThumbnailOptions } from './thumbnail-generator';
import { WatermarkProcessor, WatermarkConfig, WatermarkType } from './watermark-processor';
import { SubtitleEmbedder, EmbedOptions } from './subtitle-embedder';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

// ==================== TYPES ====================

export interface PipelineConfig {
  // Módulos existentes
  validator?: VideoValidator;
  audioAnalyzer?: AudioAnalyzer;
  queue?: VideoProcessingQueue;
  cache?: CacheManager;
  
  // Novos módulos Sprint 55
  transcoder?: VideoTranscoder;
  thumbnailGenerator?: ThumbnailGenerator;
  watermarkProcessor?: WatermarkProcessor;
  subtitleEmbedder?: SubtitleEmbedder;
  
  // Flags de habilitação
  enableCache?: boolean;
  enableAudioAnalysis?: boolean;
  enableValidation?: boolean;
  enableTranscoding?: boolean;
  enableThumbnails?: boolean;
  enableWatermarks?: boolean;
  enableSubtitles?: boolean;
}

export interface VideoProcessingRequest {
  id: string;
  inputPath: string;
  outputPath?: string;
  priority?: QueuePriority;
  options?: {
    // Opções originais
    validate?: boolean;
    analyzeAudio?: boolean;
    normalize?: boolean;
    removeSilence?: boolean;
    
    // Novas opções Sprint 55
    transcode?: boolean | TranscodeOptions;
    thumbnails?: boolean | ThumbnailOptions;
    watermarks?: WatermarkConfig[];
    subtitles?: boolean | EmbedOptions;
    
    // Opções avançadas
    multiResolution?: boolean;
    resolutions?: Array<'4k' | '1080p' | '720p' | '480p' | '360p'>;
    generateHLS?: boolean;
    generateDASH?: boolean;
    generateSprite?: boolean;
    generateStoryboard?: boolean;
    generateTranscription?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ProcessingResult {
  success: boolean;
  requestId: string;
  
  // Resultados existentes
  validation?: {
    valid: boolean;
    quality: string;
    errors: string[];
    warnings: string[];
  };
  audioAnalysis?: {
    quality: string;
    score: number;
    recommendations: string[];
  };
  
  // Novos resultados Sprint 55
  transcoding?: {
    success: boolean;
    outputs: string[];
    format: string;
    resolution: string;
    duration: number;
  };
  thumbnails?: {
    success: boolean;
    files: string[];
    sprite?: string;
    storyboard?: string;
    count: number;
  };
  watermarks?: {
    success: boolean;
    output: string;
    applied: number;
  };
  subtitles?: {
    success: boolean;
    output: string;
    format: string;
    mode: string;
    languages?: string[];
  };
  
  // Saída final
  output?: {
    path: string;
    size: number;
    duration: number;
    thumbnails?: string[];
    sprite?: string;
    hls?: string;
    dash?: string;
  };
  
  error?: string;
  processingTime: number;
  steps: Array<{
    name: string;
    duration: number;
    success: boolean;
    error?: string;
  }>;
}

export interface PipelineEvents {
  'request:received': (request: VideoProcessingRequest) => void;
  'validation:started': (requestId: string) => void;
  'validation:completed': (requestId: string, result: any) => void;
  'audio:analyzing': (requestId: string) => void;
  'audio:analyzed': (requestId: string, result: any) => void;
  'processing:started': (requestId: string) => void;
  'processing:completed': (requestId: string, result: ProcessingResult) => void;
  'processing:failed': (requestId: string, error: Error) => void;
  'pipeline:idle': () => void;
}

// ==================== PIPELINE CLASS ====================

export class VideoProcessingPipeline extends EventEmitter {
  private validator: VideoValidator;
  private audioAnalyzer: AudioAnalyzer;
  private queue: VideoProcessingQueue;
  private cache: CacheManager;
  
  // Novos módulos Sprint 55
  private transcoder: VideoTranscoder;
  private thumbnailGenerator: ThumbnailGenerator;
  private watermarkProcessor: WatermarkProcessor;
  private subtitleEmbedder: SubtitleEmbedder;
  
  private config: PipelineConfig;
  private results: Map<string, ProcessingResult>;

  constructor(config?: PipelineConfig) {
    super();

    // Inicializar módulos existentes
    this.validator = config?.validator ?? new VideoValidator();
    this.audioAnalyzer = config?.audioAnalyzer ?? new AudioAnalyzer();
    this.queue = config?.queue ?? new VideoProcessingQueue();
    this.cache = config?.cache ?? new CacheManager();
    
    // Inicializar novos módulos Sprint 55
    this.transcoder = config?.transcoder ?? new VideoTranscoder();
    this.thumbnailGenerator = config?.thumbnailGenerator ?? new ThumbnailGenerator();
    this.watermarkProcessor = config?.watermarkProcessor ?? new WatermarkProcessor();
    this.subtitleEmbedder = config?.subtitleEmbedder ?? new SubtitleEmbedder();

    this.config = {
      validator: this.validator,
      audioAnalyzer: this.audioAnalyzer,
      queue: this.queue,
      cache: this.cache,
      transcoder: this.transcoder,
      thumbnailGenerator: this.thumbnailGenerator,
      watermarkProcessor: this.watermarkProcessor,
      subtitleEmbedder: this.subtitleEmbedder,
      enableCache: config?.enableCache ?? true,
      enableAudioAnalysis: config?.enableAudioAnalysis ?? true,
      enableValidation: config?.enableValidation ?? true,
      enableTranscoding: config?.enableTranscoding ?? false,
      enableThumbnails: config?.enableThumbnails ?? false,
      enableWatermarks: config?.enableWatermarks ?? false,
      enableSubtitles: config?.enableSubtitles ?? false
    };

    this.results = new Map();

    this.setupQueueProcessors();
    this.setupEventHandlers();
    this.setupModuleEventHandlers();
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Processa um vídeo
   */
  async processVideo(request: VideoProcessingRequest): Promise<string> {
    this.emit('request:received', request);

    // Adicionar à fila
    const jobId = await this.queue.addJob(
      'process-video',
      request,
      {
        priority: request.priority ?? QueuePriority.NORMAL,
        metadata: { requestId: request.id, ...request.metadata }
      }
    );

    return jobId;
  }

  /**
   * Processa múltiplos vídeos em batch
   */
  async processBatch(requests: VideoProcessingRequest[]): Promise<string[]> {
    const jobIds: string[] = [];

    for (const request of requests) {
      const jobId = await this.processVideo(request);
      jobIds.push(jobId);
    }

    return jobIds;
  }

  /**
   * Obtém resultado de processamento
   */
  getResult(requestId: string): ProcessingResult | undefined {
    return this.results.get(requestId);
  }

  /**
   * Aguarda conclusão de processamento
   */
  async waitForCompletion(requestId: string, timeout?: number): Promise<ProcessingResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = timeout ? setTimeout(() => {
        reject(new Error('Timeout waiting for completion'));
      }, timeout) : null;

      const checkResult = () => {
        const result = this.results.get(requestId);
        if (result) {
          if (timeoutId) clearTimeout(timeoutId);
          resolve(result);
        } else {
          setTimeout(checkResult, 100);
        }
      };

      checkResult();
    });
  }

  /**
   * Obtém estatísticas do pipeline
   */
  getStats() {
    const queueStats = this.queue.getStats();
    const cacheStats = this.cache.getStats();

    return {
      queue: queueStats,
      cache: cacheStats,
      results: {
        total: this.results.size,
        successful: Array.from(this.results.values()).filter(r => r.success).length,
        failed: Array.from(this.results.values()).filter(r => !r.success).length
      }
    };
  }

  /**
   * Limpa resultados antigos
   */
  clearResults(olderThan?: Date): number {
    if (!olderThan) {
      const count = this.results.size;
      this.results.clear();
      return count;
    }

    let cleared = 0;
    // Implementar limpeza por data
    return cleared;
  }

  /**
   * Para o pipeline
   */
  async stop(): Promise<void> {
    this.queue.stop();
    await this.cache.close();
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Configura event handlers dos novos módulos
   */
  private setupModuleEventHandlers(): void {
    // Transcoder events
    this.transcoder.on('progress', (data) => {
      this.emit('transcoding:progress', data);
    });

    this.transcoder.on('complete', (data) => {
      this.emit('transcoding:complete', data);
    });

    // Thumbnail Generator events
    this.thumbnailGenerator.on('thumbnail:generated', (data) => {
      this.emit('thumbnail:generated', data);
    });

    this.thumbnailGenerator.on('generation:complete', (data) => {
      this.emit('thumbnails:complete', data);
    });

    // Watermark Processor events
    this.watermarkProcessor.on('processing:complete', (data) => {
      this.emit('watermark:complete', data);
    });

    // Subtitle Embedder events
    this.subtitleEmbedder.on('embedding:complete', (data) => {
      this.emit('subtitle:complete', data);
    });
  }

  private setupQueueProcessors(): void {
    this.queue.registerProcessor('process-video', async (job) => {
      const request = job.data as VideoProcessingRequest;
      const startTime = Date.now();

      const result: ProcessingResult = {
        success: true,
        requestId: request.id,
        processingTime: 0,
        steps: [] // Inicializar array de steps
      };

      try {
        this.emit('processing:started', request.id);

        // 1. Validação (se habilitada)
        if (this.config.enableValidation && request.options?.validate !== false) {
          this.emit('validation:started', request.id);
          
          const validationResult = await this.validateVideo(request.inputPath);
          result.validation = {
            valid: validationResult.valid,
            quality: validationResult.quality,
            errors: validationResult.errors,
            warnings: validationResult.warnings
          };

          this.emit('validation:completed', request.id, validationResult);

          if (!validationResult.valid) {
            result.success = false;
            result.error = 'Validation failed: ' + validationResult.errors.join(', ');
            return result;
          }
        }

        // 2. Análise de áudio (se habilitada)
        if (this.config.enableAudioAnalysis && request.options?.analyzeAudio !== false) {
          const stepStart = Date.now();
          this.emit('audio:analyzing', request.id);
          
          const audioResult = await this.analyzeAudio(request.inputPath);
          result.audioAnalysis = {
            quality: audioResult.overall,
            score: audioResult.score,
            recommendations: audioResult.recommendations
          };

          result.steps.push({
            name: 'audio-analysis',
            duration: Date.now() - stepStart,
            success: true
          });

          this.emit('audio:analyzed', request.id, audioResult);

          // 3. Normalizar áudio se necessário
          if (request.options?.normalize && audioResult.needsNormalization) {
            const normStart = Date.now();
            await this.normalizeAudio(request.inputPath, request.outputPath!);
            result.steps.push({
              name: 'audio-normalization',
              duration: Date.now() - normStart,
              success: true
            });
          }

          // 4. Remover silêncios se solicitado
          if (request.options?.removeSilence && audioResult.silences.length > 0) {
            const silenceStart = Date.now();
            await this.removeSilences(request.inputPath, request.outputPath!);
            result.steps.push({
              name: 'silence-removal',
              duration: Date.now() - silenceStart,
              success: true
            });
          }
        }

        // Caminho do vídeo processado (pode mudar a cada etapa)
        let processedVideoPath = request.inputPath;

        // 5. TRANSCODIFICAÇÃO (Sprint 55)
        if (this.config.enableTranscoding && request.options?.transcode) {
          const stepStart = Date.now();
          this.emit('transcoding:started', request.id);

          try {
            const transcodeOpts = typeof request.options.transcode === 'object' 
              ? request.options.transcode 
              : {};

            const outputDir = path.dirname(request.outputPath || request.inputPath);
            
            if (request.options.multiResolution) {
              // Multi-resolução
              const outputs = await this.transcoder.transcodeMultiResolution(
                processedVideoPath,
                outputDir,
                request.options.resolutions || ['1080p', '720p', '480p']
              );
              processedVideoPath = outputs[0]; // Usar maior resolução
              
              result.transcoding = {
                success: true,
                outputs,
                format: transcodeOpts.format || 'mp4',
                resolution: '1080p',
                duration: Date.now() - stepStart
              };
            } else if (request.options.generateHLS) {
              // HLS streaming
              const hlsPath = await this.transcoder.createAdaptiveStream(
                processedVideoPath,
                outputDir,
                'hls',
                request.options.resolutions || ['1080p', '720p', '480p']
              );
              
              result.transcoding = {
                success: true,
                outputs: [hlsPath],
                format: 'hls',
                resolution: 'adaptive',
                duration: Date.now() - stepStart
              };
              
              if (result.output) {
                result.output.hls = hlsPath;
              }
            } else if (request.options.generateDASH) {
              // DASH streaming
              const dashPath = await this.transcoder.createAdaptiveStream(
                processedVideoPath,
                outputDir,
                'dash',
                request.options.resolutions || ['1080p', '720p', '480p']
              );
              
              result.transcoding = {
                success: true,
                outputs: [dashPath],
                format: 'dash',
                resolution: 'adaptive',
                duration: Date.now() - stepStart
              };
              
              if (result.output) {
                result.output.dash = dashPath;
              }
            } else {
              // Transcodificação simples
              const outputPath = request.outputPath || 
                path.join(outputDir, `transcoded_${path.basename(processedVideoPath)}`);
              
              processedVideoPath = await this.transcoder.transcode(
                processedVideoPath,
                outputPath,
                transcodeOpts
              );
              
              result.transcoding = {
                success: true,
                outputs: [processedVideoPath],
                format: transcodeOpts.format || 'mp4',
                resolution: transcodeOpts.resolution ? 
                  `${transcodeOpts.resolution.width}x${transcodeOpts.resolution.height}` : 
                  'original',
                duration: Date.now() - stepStart
              };
            }

            result.steps.push({
              name: 'transcoding',
              duration: Date.now() - stepStart,
              success: true
            });

            this.emit('transcoding:completed', request.id, result.transcoding);

          } catch (error) {
            result.steps.push({
              name: 'transcoding',
              duration: Date.now() - stepStart,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
          }
        }

        // 6. THUMBNAILS (Sprint 55)
        if (this.config.enableThumbnails && request.options?.thumbnails) {
          const stepStart = Date.now();
          this.emit('thumbnails:started', request.id);

          try {
            const thumbnailOpts = typeof request.options.thumbnails === 'object' 
              ? request.options.thumbnails 
              : {};

            const outputDir = path.dirname(request.outputPath || request.inputPath);
            const thumbnailDir = path.join(outputDir, 'thumbnails');
            await fs.mkdir(thumbnailDir, { recursive: true });

            const thumbnailFiles: string[] = [];

            // Gerar thumbnails
            const thumbnails = await this.thumbnailGenerator.generate(
              processedVideoPath,
              thumbnailDir,
              thumbnailOpts
            );
            thumbnailFiles.push(...thumbnails);

            // Sprite sheet
            let spriteFile: string | undefined;
            if (request.options.generateSprite) {
              spriteFile = await this.thumbnailGenerator.generateSpriteSheet(
                processedVideoPath,
                path.join(thumbnailDir, 'sprite.jpg'),
                {
                  columns: 10,
                  rows: 10,
                  thumbnailSize: { width: 160, height: 90 },
                  interval: 1
                }
              );
              thumbnailFiles.push(spriteFile);
            }

            // Storyboard
            let storyboardFile: string | undefined;
            if (request.options.generateStoryboard) {
              storyboardFile = await this.thumbnailGenerator.generateStoryboard(
                processedVideoPath,
                thumbnailDir,
                { interval: 5, size: { width: 320, height: 180 } }
              );
              thumbnailFiles.push(storyboardFile);
            }

            result.thumbnails = {
              success: true,
              files: thumbnails,
              sprite: spriteFile,
              storyboard: storyboardFile,
              count: thumbnails.length
            };

            if (result.output) {
              result.output.thumbnails = thumbnails;
              result.output.sprite = spriteFile;
            }

            result.steps.push({
              name: 'thumbnails',
              duration: Date.now() - stepStart,
              success: true
            });

            this.emit('thumbnails:completed', request.id, result.thumbnails);

          } catch (error) {
            result.steps.push({
              name: 'thumbnails',
              duration: Date.now() - stepStart,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Não falhar o pipeline inteiro por falha em thumbnails
            console.error('Thumbnail generation failed:', error);
          }
        }

        // 7. WATERMARKS (Sprint 55)
        if (this.config.enableWatermarks && request.options?.watermarks?.length) {
          const stepStart = Date.now();
          this.emit('watermarks:started', request.id);

          try {
            const outputDir = path.dirname(request.outputPath || request.inputPath);
            const watermarkedPath = path.join(
              outputDir,
              `watermarked_${path.basename(processedVideoPath)}`
            );

            const output = await this.watermarkProcessor.process(
              processedVideoPath,
              watermarkedPath,
              request.options.watermarks
            );

            processedVideoPath = output; // Atualizar path

            result.watermarks = {
              success: true,
              output,
              applied: request.options.watermarks.length
            };

            result.steps.push({
              name: 'watermarks',
              duration: Date.now() - stepStart,
              success: true
            });

            this.emit('watermarks:completed', request.id, result.watermarks);

          } catch (error) {
            result.steps.push({
              name: 'watermarks',
              duration: Date.now() - stepStart,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
          }
        }

        // 8. SUBTITLES (Sprint 55)
        if (this.config.enableSubtitles && request.options?.subtitles) {
          const stepStart = Date.now();
          this.emit('subtitles:started', request.id);

          try {
            const subtitleOpts = typeof request.options.subtitles === 'object' 
              ? request.options.subtitles 
              : {};

            const outputDir = path.dirname(request.outputPath || request.inputPath);
            const subtitledPath = request.outputPath || 
              path.join(outputDir, `subtitled_${path.basename(processedVideoPath)}`);

            let subtitlePath = subtitleOpts.subtitlePath;

            // Gerar transcrição automática se solicitado
            if (request.options.generateTranscription && !subtitlePath) {
              const transcriptionPath = path.join(
                outputDir,
                'subtitles',
                `${path.basename(processedVideoPath, path.extname(processedVideoPath))}.srt`
              );
              await fs.mkdir(path.dirname(transcriptionPath), { recursive: true });
              
              subtitlePath = await this.subtitleEmbedder.transcribe(
                processedVideoPath,
                transcriptionPath,
                {
                  language: 'pt-BR',
                  format: 'srt'
                }
              );
            }

            if (subtitlePath) {
              const output = await this.subtitleEmbedder.embed(
                processedVideoPath,
                subtitledPath,
                subtitlePath,
                subtitleOpts
              );

              processedVideoPath = output; // Atualizar path

              result.subtitles = {
                success: true,
                output,
                format: subtitleOpts.format || 'srt',
                mode: subtitleOpts.mode || 'hardsub'
              };
            }

            result.steps.push({
              name: 'subtitles',
              duration: Date.now() - stepStart,
              success: true
            });

            this.emit('subtitles:completed', request.id, result.subtitles);

          } catch (error) {
            result.steps.push({
              name: 'subtitles',
              duration: Date.now() - stepStart,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Não falhar o pipeline inteiro por falha em legendas
            console.error('Subtitle processing failed:', error);
          }
        }

        // 9. Finalizar - atualizar saída com vídeo final processado
        if (processedVideoPath !== request.inputPath) {
          const stats = await fs.stat(processedVideoPath);
          
          result.output = {
            ...result.output,
            path: processedVideoPath,
            size: stats.size,
            duration: 0 // TODO: Obter duração do vídeo
          };
        } else {
          result.output = {
            path: request.outputPath ?? request.inputPath,
            size: 0,
            duration: 0
          };
        }

        result.processingTime = Date.now() - startTime;
        result.success = true;

        this.results.set(request.id, result);
        this.emit('processing:completed', request.id, result);

        return result;

      } catch (error) {
        result.success = false;
        result.error = error instanceof Error ? error.message : 'Unknown error';
        result.processingTime = Date.now() - startTime;

        this.results.set(request.id, result);
        this.emit('processing:failed', request.id, error as Error);

        throw error;
      }
    });
  }

  private setupEventHandlers(): void {
    this.queue.on('queue:drained', () => {
      this.emit('pipeline:idle');
    });
  }

  private async validateVideo(filePath: string) {
    const cacheKey = `validation:${filePath}`;

    if (this.config.enableCache) {
      return this.cache.getOrSet(
        cacheKey,
        () => this.validator.validate(filePath),
        { ttl: 3600, tags: ['validation'] }
      );
    }

    return this.validator.validate(filePath);
  }

  private async analyzeAudio(filePath: string) {
    const cacheKey = `audio:${filePath}`;

    if (this.config.enableCache) {
      return this.cache.getOrSet(
        cacheKey,
        () => this.audioAnalyzer.analyze(filePath),
        { ttl: 3600, tags: ['audio-analysis'] }
      );
    }

    return this.audioAnalyzer.analyze(filePath);
  }

  private async normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
    await this.audioAnalyzer.normalize(inputPath, outputPath);
  }

  private async removeSilences(inputPath: string, outputPath: string): Promise<void> {
    await this.audioAnalyzer.removeSilence(inputPath, outputPath);
  }
}

// ==================== FACTORY FUNCTION ====================

/**
 * Cria pipeline com configurações padrão para NR
 */
export function createNRPipeline(): VideoProcessingPipeline {
  const validator = new VideoValidator({
    maxDuration: 1200,
    minDuration: 180,
    requireAudio: true,
    nrCompliance: true
  });

  const audioAnalyzer = new AudioAnalyzer({
    silenceThreshold: -35,
    targetLUFS: -16,
    checkClipping: true
  });

  const queue = new VideoProcessingQueue({
    maxConcurrent: 3,
    maxRetries: 3
  });

  const cache = new CacheManager({
    defaultTTL: 3600,
    maxMemoryItems: 500
  });

  return new VideoProcessingPipeline({
    validator,
    audioAnalyzer,
    queue,
    cache,
    enableCache: true,
    enableAudioAnalysis: true,
    enableValidation: true
  });
}

export default VideoProcessingPipeline;
