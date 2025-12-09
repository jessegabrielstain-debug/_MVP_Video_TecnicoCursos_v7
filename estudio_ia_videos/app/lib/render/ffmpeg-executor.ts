/**
 * 🎬 FFmpeg Executor - IMPLEMENTAÇÃO REAL COMPLETA
 * Execução real de comandos FFmpeg para renderização de vídeo
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

export interface FFmpegOptions {
  inputFramesPattern?: string; // ex: "frame_%04d.png"
  inputFramesDir?: string;
  audioPath?: string;
  outputPath: string;
  fps?: number;
  width?: number;
  height?: number;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  bitrate?: string;
  audioBitrate?: string;
  audioSampleRate?: number;
  metadata?: Record<string, string>;
}

export interface FFmpegProgress {
  frame: number;
  fps: number;
  totalFrames: number;
  timeSeconds: number;
  progress: number; // 0-100
  speed: number;
  bitrate: string;
  size: string;
}

export interface FFmpegResult {
  success: boolean;
  outputPath: string;
  duration: number;
  fileSize: number;
  error?: string;
  stats?: {
    totalFrames: number;
    averageFps: number;
    totalTime: number;
  };
}

export class FFmpegExecutor {
  private ffmpegPath: string;
  private isWindows: boolean;

  constructor(ffmpegPath: string = 'ffmpeg') {
    this.ffmpegPath = ffmpegPath;
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Renderiza vídeo a partir de frames individuais
   */
  async renderFromFrames(
    options: FFmpegOptions,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<FFmpegResult> {
    const startTime = Date.now();

    try {
      // Validar inputs
      if (!options.inputFramesDir) {
        throw new Error('inputFramesDir é obrigatório');
      }

      await this.validateInputs(options);

      // Construir comando FFmpeg
      const args = await this.buildFFmpegCommand(options);

      logger.info(`🎬 Executando FFmpeg: ${this.ffmpegPath} ${args.join(' ')}`, { component: 'FFmpegExecutor' });

      // Executar FFmpeg
      const result = await this.executeFFmpeg(args, options, onProgress);

      // Obter estatísticas do arquivo gerado
      const stats = await fs.stat(options.outputPath);
      const duration = (Date.now() - startTime) / 1000;

      return {
        success: true,
        outputPath: options.outputPath,
        duration,
        fileSize: stats.size,
        stats: result.stats,
      };

    } catch (error) {
      logger.error('❌ Erro ao renderizar vídeo:', error instanceof Error ? error : new Error(String(error)), { component: 'FFmpegExecutor' });
      return {
        success: false,
        outputPath: options.outputPath,
        duration: (Date.now() - startTime) / 1000,
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Constrói argumentos do comando FFmpeg
   */
  private async buildFFmpegCommand(options: FFmpegOptions): Promise<string[]> {
    const args: string[] = [];

    // Input de frames
    const framesPattern = options.inputFramesPattern || 'frame_%04d.png';
    const inputPath = path.join(options.inputFramesDir!, framesPattern);

    args.push('-framerate', String(options.fps || 30));
    args.push('-i', inputPath);

    // Input de áudio (se existir)
    if (options.audioPath) {
      const audioExists = await fs.access(options.audioPath).then(() => true).catch(() => false);
      if (audioExists) {
        args.push('-i', options.audioPath);
        args.push('-c:a', 'aac');
        args.push('-b:a', options.audioBitrate || '192k');
        args.push('-ar', String(options.audioSampleRate || 48000));
      }
    }

    // Codec de vídeo
    const codec = options.codec || 'h264';
    switch (codec) {
      case 'h264':
        args.push('-c:v', 'libx264');
        break;
      case 'h265':
        args.push('-c:v', 'libx265');
        break;
      case 'vp8':
        args.push('-c:v', 'libvpx');
        break;
      case 'vp9':
        args.push('-c:v', 'libvpx-vp9');
        break;
      default:
        throw new Error(`Codec não suportado: ${codec}`);
    }

    // Preset e qualidade
    const preset = options.preset || 'medium';
    args.push('-preset', preset);

    // CRF (quality) - menor = melhor qualidade
    const qualityMap = {
      low: '28',
      medium: '23',
      high: '18',
      ultra: '15',
    };
    const crf = qualityMap[options.quality || 'medium'];
    args.push('-crf', crf);

    // Pixel format
    args.push('-pix_fmt', 'yuv420p');

    // Resolução (se especificada)
    if (options.width && options.height) {
      args.push('-s', `${options.width}x${options.height}`);
    }

    // Bitrate (se especificado)
    if (options.bitrate) {
      args.push('-b:v', options.bitrate);
    }

    // Metadata
    if (options.metadata) {
      for (const [key, value] of Object.entries(options.metadata)) {
        args.push('-metadata', `${key}=${value}`);
      }
    }

    // Flags de otimização
    args.push('-movflags', '+faststart'); // Para streaming
    args.push('-threads', '0'); // Usar todos os cores

    // Output
    args.push('-y'); // Sobrescrever arquivo existente
    args.push(options.outputPath);

    return args;
  }

  /**
   * Executa FFmpeg e captura progresso REAL
   */
  private executeFFmpeg(
    args: string[],
    options: FFmpegOptions,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<{ stats?: FFmpegResult['stats'] }> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args);

      let stderrData = '';
      let totalFrames = 0;
      let currentFrame = 0;

      // Calcular total de frames esperados
      if (options.inputFramesDir) {
        this.countFrames(options.inputFramesDir).then(count => {
          totalFrames = count;
        });
      }

      ffmpeg.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderrData += output;

        // Parse de progresso
        // Exemplo: "frame= 120 fps= 30 q=28.0 size=    1024kB time=00:00:04.00 bitrate=2097.2kbits/s speed=1.5x"
        const frameMatch = output.match(/frame=\s*(\d+)/);
        const fpsMatch = output.match(/fps=\s*([\d.]+)/);
        const timeMatch = output.match(/time=(\d+):(\d+):([\d.]+)/);
        const speedMatch = output.match(/speed=\s*([\d.]+)x/);
        const bitrateMatch = output.match(/bitrate=\s*([\d.]+\s*\w+)/);
        const sizeMatch = output.match(/size=\s*([\d.]+\s*\w+)/);

        if (frameMatch) {
          currentFrame = parseInt(frameMatch[1]);

          const progressData: FFmpegProgress = {
            frame: currentFrame,
            fps: fpsMatch ? parseFloat(fpsMatch[1]) : 0,
            totalFrames: totalFrames || currentFrame * 2, // Estimativa se não soubermos
            timeSeconds: 0,
            progress: totalFrames ? Math.min((currentFrame / totalFrames) * 100, 100) : 0,
            speed: speedMatch ? parseFloat(speedMatch[1]) : 1,
            bitrate: bitrateMatch ? bitrateMatch[1] : '0kbits/s',
            size: sizeMatch ? sizeMatch[1] : '0kB',
          };

          // Parse time
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const seconds = parseFloat(timeMatch[3]);
            progressData.timeSeconds = hours * 3600 + minutes * 60 + seconds;
          }

          if (onProgress) {
            onProgress(progressData);
          }

          // Log a cada 10 frames
          if (currentFrame % 10 === 0) {
            logger.info(`Frame ${currentFrame}/${totalFrames} (${progressData.progress.toFixed(1)}%) - ${progressData.fps.toFixed(1)} fps`, { component: 'FFmpegExecutor' });
          }
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          logger.info('FFmpeg concluído com sucesso', { component: 'FFmpegExecutor' });
          resolve({
            stats: {
              totalFrames: currentFrame,
              averageFps: options.fps || 30,
              totalTime: currentFrame / (options.fps || 30),
            },
          });
        } else {
          logger.error(`FFmpeg falhou com código: ${code}`, new Error(`Exit code ${code}`), { component: 'FFmpegExecutor' });
          logger.error('FFmpeg Stderr', new Error(stderrData), { component: 'FFmpegExecutor' });
          reject(new Error(`FFmpeg falhou com código ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        logger.error('Erro ao executar FFmpeg', error instanceof Error ? error : new Error(String(error)), { component: 'FFmpegExecutor' });
        reject(error);
      });
    });
  }

  /**
   * Valida inputs antes de executar
   */
  private async validateInputs(options: FFmpegOptions): Promise<void> {
    // Verificar se diretório de frames existe
    if (options.inputFramesDir) {
      try {
        await fs.access(options.inputFramesDir);
      } catch {
        throw new Error(`Diretório de frames não existe: ${options.inputFramesDir}`);
      }

      // Verificar se há frames
      const files = await fs.readdir(options.inputFramesDir);
      const frameFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));
      if (frameFiles.length === 0) {
        throw new Error(`Nenhum frame encontrado em: ${options.inputFramesDir}`);
      }
    }

    // Verificar se diretório de output existe
    const outputDir = path.dirname(options.outputPath);
    try {
      await fs.access(outputDir);
    } catch {
      await fs.mkdir(outputDir, { recursive: true });
    }
  }

  /**
   * Conta número de frames no diretório
   */
  private async countFrames(framesDir: string): Promise<number> {
    try {
      const files = await fs.readdir(framesDir);
      return files.filter(f => /\.(png|jpg|jpeg)$/i.test(f)).length;
    } catch {
      return 0;
    }
  }

  /**
   * Verifica se FFmpeg está instalado
   */
  static async checkInstallation(ffmpegPath: string = 'ffmpeg'): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn(ffmpegPath, ['-version']);

      ffmpeg.on('close', (code) => {
        resolve(code === 0);
      });

      ffmpeg.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Obtém versão do FFmpeg instalado
   */
  static async getVersion(ffmpegPath: string = 'ffmpeg'): Promise<string | null> {
    return new Promise((resolve) => {
      const ffmpeg = spawn(ffmpegPath, ['-version']);
      let output = '';

      ffmpeg.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          const match = output.match(/ffmpeg version ([^\s]+)/);
          resolve(match ? match[1] : null);
        } else {
          resolve(null);
        }
      });

      ffmpeg.on('error', () => {
        resolve(null);
      });
    });
  }
}

export default FFmpegExecutor;
