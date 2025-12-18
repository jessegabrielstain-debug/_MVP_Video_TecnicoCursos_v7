/**
 * Multi-Format Exporter
 * Exporta vídeos em múltiplos formatos: MP4, WebM, GIF, HLS, DASH
 */

import { spawn } from 'child_process';
import { logger } from '@/lib/logger';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// ==============================================
// TIPOS
// ==============================================

export interface ExportFormat {
  format: 'mp4' | 'webm' | 'gif' | 'hls' | 'dash' | 'mov' | 'avi';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '360p' | '480p' | '720p' | '1080p' | '1440p' | '4k';
  fps?: number;
  bitrate?: string;
  codec?: string;
}

export interface ExportOptions extends ExportFormat {
  inputPath: string;
  outputPath: string;
  watermark?: {
    imagePath: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
  thumbnail?: {
    time: number; // segundos
    outputPath: string;
  };
  subtitles?: {
    path: string;
    language: string;
  };
}

export interface ExportResult {
  success: boolean;
  outputPath?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
  metadata?: {
    format: string;
    resolution: string;
    bitrate: string;
    codec: string;
  };
}

// ==============================================
// MULTI-FORMAT EXPORTER
// ==============================================

export class MultiFormatExporter {
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor() {
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    this.ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
  }

  /**
   * Exporta vídeo no formato especificado
   */
  async export(options: ExportOptions): Promise<ExportResult> {
    try {
      logger.info('Starting export', {
        component: 'MultiFormatExporter',
        format: options.format,
        quality: options.quality
      });

      // Validar arquivo de entrada
      try {
        await fs.access(options.inputPath);
      } catch {
        return {
          success: false,
          error: `Input file not found: ${options.inputPath}`
        };
      }

      // Exportar baseado no formato
      switch (options.format) {
        case 'mp4':
          return await this.exportMP4(options);
        case 'webm':
          return await this.exportWebM(options);
        case 'gif':
          return await this.exportGIF(options);
        case 'hls':
          return await this.exportHLS(options);
        case 'dash':
          return await this.exportDASH(options);
        case 'mov':
          return await this.exportMOV(options);
        case 'avi':
          return await this.exportAVI(options);
        default:
          return {
            success: false,
            error: `Unsupported format: ${options.format}`
          };
      }
    } catch (error) {
      logger.error('Export error', error instanceof Error ? error : new Error(String(error)), {
        component: 'MultiFormatExporter'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Exporta para MP4 (H.264)
   */
  private async exportMP4(options: ExportOptions): Promise<ExportResult> {
    const resolution = this.getResolution(options.resolution);
    const bitrate = options.bitrate || this.getBitrate(options.quality, options.resolution);

    const args = [
      '-i', options.inputPath,
      '-c:v', options.codec || 'libx264',
      '-preset', this.getPreset(options.quality),
      '-crf', this.getCRF(options.quality),
      '-vf', `scale=${resolution.width}:${resolution.height}`,
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart', // Streaming otimizado
      '-y',
      options.outputPath
    ];

    // Adicionar watermark se especificado
    if (options.watermark) {
      const watermarkFilter = this.buildWatermarkFilter(options.watermark);
      const scaleIndex = args.indexOf('-vf');
      args[scaleIndex + 1] = `${args[scaleIndex + 1]},${watermarkFilter}`;
    }

    // Adicionar FPS se especificado
    if (options.fps) {
      args.splice(args.length - 2, 0, '-r', String(options.fps));
    }

    return await this.runFFmpeg(args, options.outputPath);
  }

  /**
   * Exporta para WebM (VP9)
   */
  private async exportWebM(options: ExportOptions): Promise<ExportResult> {
    const resolution = this.getResolution(options.resolution);
    const bitrate = options.bitrate || this.getBitrate(options.quality, options.resolution);

    const args = [
      '-i', options.inputPath,
      '-c:v', 'libvpx-vp9',
      '-b:v', bitrate,
      '-vf', `scale=${resolution.width}:${resolution.height}`,
      '-c:a', 'libopus',
      '-b:a', '128k',
      '-deadline', 'good',
      '-cpu-used', '2',
      '-y',
      options.outputPath
    ];

    return await this.runFFmpeg(args, options.outputPath);
  }

  /**
   * Exporta para GIF animado
   */
  private async exportGIF(options: ExportOptions): Promise<ExportResult> {
    const resolution = this.getResolution(options.resolution);
    const fps = options.fps || 15; // GIFs geralmente usam FPS menor

    // Criar paleta otimizada primeiro
    const tempDir = os.tmpdir();
    const palettePath = path.join(tempDir, `palette_${Date.now()}.png`);

    // Gerar paleta
    const paletteArgs = [
      '-i', options.inputPath,
      '-vf', `fps=${fps},scale=${resolution.width}:${resolution.height}:flags=lanczos,palettegen=stats_mode=diff`,
      '-y',
      palettePath
    ];

    await this.runFFmpeg(paletteArgs, palettePath);

    // Gerar GIF usando a paleta
    const gifArgs = [
      '-i', options.inputPath,
      '-i', palettePath,
      '-filter_complex', `fps=${fps},scale=${resolution.width}:${resolution.height}:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
      '-y',
      options.outputPath
    ];

    const result = await this.runFFmpeg(gifArgs, options.outputPath);

    // Limpar paleta temporária
    try {
      await fs.unlink(palettePath);
    } catch (error) {
      logger.warn('Failed to clean up palette file', { palettePath });
    }

    return result;
  }

  /**
   * Exporta para HLS (HTTP Live Streaming)
   */
  private async exportHLS(options: ExportOptions): Promise<ExportResult> {
    const resolution = this.getResolution(options.resolution);
    const outputDir = path.dirname(options.outputPath);
    const playlistName = path.basename(options.outputPath, '.m3u8');

    const args = [
      '-i', options.inputPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-vf', `scale=${resolution.width}:${resolution.height}`,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-hls_time', '6', // Segmentos de 6 segundos
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(outputDir, `${playlistName}_%03d.ts`),
      '-y',
      options.outputPath
    ];

    return await this.runFFmpeg(args, options.outputPath);
  }

  /**
   * Exporta para DASH (Dynamic Adaptive Streaming)
   */
  private async exportDASH(options: ExportOptions): Promise<ExportResult> {
    const resolution = this.getResolution(options.resolution);
    const outputDir = path.dirname(options.outputPath);

    const args = [
      '-i', options.inputPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-vf', `scale=${resolution.width}:${resolution.height}`,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-f', 'dash',
      '-seg_duration', '6',
      '-use_template', '1',
      '-use_timeline', '1',
      '-init_seg_name', 'init-$RepresentationID$.m4s',
      '-media_seg_name', 'chunk-$RepresentationID$-$Number%05d$.m4s',
      '-y',
      options.outputPath
    ];

    return await this.runFFmpeg(args, options.outputPath);
  }

  /**
   * Exporta para MOV (QuickTime)
   */
  private async exportMOV(options: ExportOptions): Promise<ExportResult> {
    const resolution = this.getResolution(options.resolution);

    const args = [
      '-i', options.inputPath,
      '-c:v', 'libx264',
      '-preset', this.getPreset(options.quality),
      '-vf', `scale=${resolution.width}:${resolution.height}`,
      '-c:a', 'aac',
      '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      '-y',
      options.outputPath
    ];

    return await this.runFFmpeg(args, options.outputPath);
  }

  /**
   * Exporta para AVI
   */
  private async exportAVI(options: ExportOptions): Promise<ExportResult> {
    const resolution = this.getResolution(options.resolution);

    const args = [
      '-i', options.inputPath,
      '-c:v', 'mpeg4',
      '-q:v', this.getQualityValue(options.quality),
      '-vf', `scale=${resolution.width}:${resolution.height}`,
      '-c:a', 'mp3',
      '-b:a', '192k',
      '-y',
      options.outputPath
    ];

    return await this.runFFmpeg(args, options.outputPath);
  }

  /**
   * Executa FFmpeg com os argumentos fornecidos
   */
  private runFFmpeg(args: string[], outputPath: string): Promise<ExportResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const ffmpeg = spawn(this.ffmpegPath, args);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          try {
            const stats = await fs.stat(outputPath);
            const duration = Date.now() - startTime;

            resolve({
              success: true,
              outputPath,
              fileSize: stats.size,
              duration
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Output file not found'
            });
          }
        } else {
          logger.error('FFmpeg export failed', new Error(stderr), {
            component: 'MultiFormatExporter',
            exitCode: code
          });
          resolve({
            success: false,
            error: `FFmpeg exited with code ${code}`
          });
        }
      });

      ffmpeg.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  }

  /**
   * Constrói filtro de watermark
   */
  private buildWatermarkFilter(watermark: NonNullable<ExportOptions['watermark']>): string {
    const positions = {
      'top-left': 'overlay=10:10',
      'top-right': 'overlay=W-w-10:10',
      'bottom-left': 'overlay=10:H-h-10',
      'bottom-right': 'overlay=W-w-10:H-h-10',
      'center': 'overlay=(W-w)/2:(H-h)/2'
    };

    const opacity = watermark.opacity !== undefined ? `,format=rgba,colorchannelmixer=aa=${watermark.opacity}` : '';
    
    return `movie=${watermark.imagePath}${opacity}[wm];[in][wm]${positions[watermark.position]}[out]`;
  }

  /**
   * Obtém resolução em pixels
   */
  private getResolution(resolution: ExportOptions['resolution']): { width: number; height: number } {
    const resolutions = {
      '360p': { width: 640, height: 360 },
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '1440p': { width: 2560, height: 1440 },
      '4k': { width: 3840, height: 2160 }
    };
    return resolutions[resolution];
  }

  /**
   * Obtém preset do FFmpeg baseado na qualidade
   */
  private getPreset(quality: ExportOptions['quality']): string {
    const presets = {
      low: 'veryfast',
      medium: 'medium',
      high: 'slow',
      ultra: 'veryslow'
    };
    return presets[quality];
  }

  /**
   * Obtém CRF (Constant Rate Factor) baseado na qualidade
   */
  private getCRF(quality: ExportOptions['quality']): string {
    const crfs = {
      low: '28',
      medium: '23',
      high: '18',
      ultra: '15'
    };
    return crfs[quality];
  }

  /**
   * Obtém bitrate sugerido baseado em qualidade e resolução
   */
  private getBitrate(quality: ExportOptions['quality'], resolution: ExportOptions['resolution']): string {
    const bitrates: Record<string, Record<string, string>> = {
      low: { '360p': '500k', '480p': '750k', '720p': '1500k', '1080p': '3000k', '1440p': '6000k', '4k': '12000k' },
      medium: { '360p': '750k', '480p': '1000k', '720p': '2500k', '1080p': '5000k', '1440p': '10000k', '4k': '20000k' },
      high: { '360p': '1000k', '480p': '1500k', '720p': '4000k', '1080p': '8000k', '1440p': '16000k', '4k': '35000k' },
      ultra: { '360p': '1500k', '480p': '2500k', '720p': '6000k', '1080p': '12000k', '1440p': '24000k', '4k': '50000k' }
    };
    return bitrates[quality][resolution];
  }

  /**
   * Obtém valor de qualidade para codecs que usam -q:v
   */
  private getQualityValue(quality: ExportOptions['quality']): string {
    const values = {
      low: '10',
      medium: '5',
      high: '3',
      ultra: '2'
    };
    return values[quality];
  }
}

// Export singleton
export const multiFormatExporter = new MultiFormatExporter();
