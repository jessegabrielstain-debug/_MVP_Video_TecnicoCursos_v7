/**
 * AI Background Removal
 * Remove fundo de imagens e vídeos usando IA
 */

import { logger } from '@/lib/logger';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// ==============================================
// TIPOS
// ==============================================

export interface BackgroundRemovalOptions {
  inputPath: string;
  outputPath: string;
  type: 'image' | 'video';
  model?: 'u2net' | 'u2netp' | 'u2net_human_seg' | 'silueta';
  alphaMatting?: boolean;
  alphaMattingForegroundThreshold?: number;
  alphaMattingBackgroundThreshold?: number;
  replaceWith?: 'transparent' | 'color' | 'image' | 'blur';
  replacementColor?: string; // hex color
  replacementImage?: string; // path to image
  blurIntensity?: number; // 1-100
}

export interface BackgroundRemovalResult {
  success: boolean;
  outputPath?: string;
  maskPath?: string;
  processingTime?: number;
  error?: string;
}

// ==============================================
// BACKGROUND REMOVAL ENGINE
// ==============================================

export class BackgroundRemovalEngine {
  /**
   * Remove fundo de imagem
   */
  async removeImageBackground(options: BackgroundRemovalOptions): Promise<BackgroundRemovalResult> {
    const startTime = Date.now();

    try {
      logger.info('Removing image background', {
        component: 'BackgroundRemovalEngine',
        inputPath: options.inputPath
      });

      // Verificar se arquivo existe
      try {
        await fs.access(options.inputPath);
      } catch {
        return {
          success: false,
          error: `Input file not found: ${options.inputPath}`
        };
      }

      // Remover fundo usando rembg (Python library via CLI)
      // TODO: Instalar rembg: pip install rembg[gpu] ou rembg[cpu]
      
      const args = [
        'i', options.inputPath,
        'o', options.outputPath
      ];

      // Adicionar opções de modelo
      if (options.model) {
        args.push('-m', options.model);
      }

      // Alpha matting (melhor qualidade nas bordas)
      if (options.alphaMatting) {
        args.push('-a');
        if (options.alphaMattingForegroundThreshold) {
          args.push('-af', String(options.alphaMattingForegroundThreshold));
        }
        if (options.alphaMattingBackgroundThreshold) {
          args.push('-ab', String(options.alphaMattingBackgroundThreshold));
        }
      }

      await this.runRembg(args);

      // Processar substituição de fundo se especificado
      if (options.replaceWith && options.replaceWith !== 'transparent') {
        await this.replaceBackground(options);
      }

      const processingTime = Date.now() - startTime;

      logger.info('Background removed successfully', {
        component: 'BackgroundRemovalEngine',
        processingTime
      });

      return {
        success: true,
        outputPath: options.outputPath,
        processingTime
      };
    } catch (error) {
      logger.error('Background removal error', error instanceof Error ? error : new Error(String(error)), {
        component: 'BackgroundRemovalEngine'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Remove fundo de vídeo (frame por frame)
   */
  async removeVideoBackground(options: BackgroundRemovalOptions): Promise<BackgroundRemovalResult> {
    const startTime = Date.now();

    try {
      logger.info('Removing video background', {
        component: 'BackgroundRemovalEngine',
        inputPath: options.inputPath
      });

      // Criar diretório temporário
      const tempDir = path.join(os.tmpdir(), `bg-removal-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      const framesDir = path.join(tempDir, 'frames');
      const outputFramesDir = path.join(tempDir, 'output');
      await fs.mkdir(framesDir, { recursive: true });
      await fs.mkdir(outputFramesDir, { recursive: true });

      // 1. Extrair frames do vídeo
      await this.extractFrames(options.inputPath, framesDir);

      // 2. Processar cada frame
      const frameFiles = await fs.readdir(framesDir);
      let processedCount = 0;

      for (const frame of frameFiles) {
        const inputFrame = path.join(framesDir, frame);
        const outputFrame = path.join(outputFramesDir, frame);

        await this.removeImageBackground({
          ...options,
          inputPath: inputFrame,
          outputPath: outputFrame,
          type: 'image'
        });

        processedCount++;
        logger.debug(`Processed frame ${processedCount}/${frameFiles.length}`, {
          component: 'BackgroundRemovalEngine'
        });
      }

      // 3. Reconstruir vídeo a partir dos frames
      await this.reconstructVideo(outputFramesDir, options.inputPath, options.outputPath);

      // 4. Limpar arquivos temporários
      await fs.rm(tempDir, { recursive: true, force: true });

      const processingTime = Date.now() - startTime;

      logger.info('Video background removed successfully', {
        component: 'BackgroundRemovalEngine',
        framesProcessed: frameFiles.length,
        processingTime
      });

      return {
        success: true,
        outputPath: options.outputPath,
        processingTime
      };
    } catch (error) {
      logger.error('Video background removal error', error instanceof Error ? error : new Error(String(error)), {
        component: 'BackgroundRemovalEngine'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Executar rembg CLI
   */
  private runRembg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Tentar usar rembg instalado
      const rembg = spawn('rembg', args);

      let stderr = '';

      rembg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      rembg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`rembg failed with code ${code}: ${stderr}`));
        }
      });

      rembg.on('error', (error) => {
        // Se rembg não estiver instalado, sugerir instalação
        if (error.message.includes('ENOENT')) {
          reject(new Error('rembg not installed. Run: pip install rembg[gpu]'));
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Substituir fundo transparente por cor/imagem/blur
   */
  private async replaceBackground(options: BackgroundRemovalOptions): Promise<void> {
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

    if (options.replaceWith === 'color' && options.replacementColor) {
      // Substituir por cor sólida
      const args = [
        '-i', options.outputPath,
        '-vf', `colorkey=0x000000:0.3:0.2,format=rgba,background=${options.replacementColor}`,
        '-y',
        options.outputPath + '.tmp.png'
      ];
      
      await this.runFFmpeg(ffmpegPath, args);
      await fs.rename(options.outputPath + '.tmp.png', options.outputPath);
      
    } else if (options.replaceWith === 'image' && options.replacementImage) {
      // Substituir por imagem
      const args = [
        '-i', options.replacementImage,
        '-i', options.outputPath,
        '-filter_complex', '[0:v][1:v]overlay',
        '-y',
        options.outputPath + '.tmp.png'
      ];
      
      await this.runFFmpeg(ffmpegPath, args);
      await fs.rename(options.outputPath + '.tmp.png', options.outputPath);
      
    } else if (options.replaceWith === 'blur') {
      // Blur do fundo original
      const blurAmount = options.blurIntensity || 20;
      const args = [
        '-i', options.inputPath,
        '-i', options.outputPath,
        '-filter_complex', `[0:v]boxblur=${blurAmount}:${blurAmount}[bg];[bg][1:v]overlay`,
        '-y',
        options.outputPath + '.tmp.png'
      ];
      
      await this.runFFmpeg(ffmpegPath, args);
      await fs.rename(options.outputPath + '.tmp.png', options.outputPath);
    }
  }

  /**
   * Extrair frames de vídeo
   */
  private extractFrames(videoPath: string, outputDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
      const args = [
        '-i', videoPath,
        '-vf', 'fps=30', // 30 FPS
        path.join(outputDir, 'frame_%06d.png')
      ];

      const ffmpeg = spawn(ffmpegPath, args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg frame extraction failed with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Reconstruir vídeo a partir de frames
   */
  private reconstructVideo(framesDir: string, originalVideo: string, outputPath: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
      
      // Obter FPS do vídeo original
      const fps = 30; // TODO: Detectar FPS real do vídeo original

      const args = [
        '-framerate', String(fps),
        '-i', path.join(framesDir, 'frame_%06d.png'),
        '-i', originalVideo, // Para pegar áudio
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'copy', // Copiar áudio original
        '-shortest',
        '-y',
        outputPath
      ];

      const ffmpeg = spawn(ffmpegPath, args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg video reconstruction failed with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Executar FFmpeg
   */
  private runFFmpeg(ffmpegPath: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, args);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Gerar máscara do sujeito (útil para outros processos)
   */
  async generateMask(inputPath: string, outputPath: string): Promise<BackgroundRemovalResult> {
    try {
      // Gerar apenas a máscara (preto e branco)
      const args = [
        'i', inputPath,
        'o', outputPath,
        '-om' // Output mask only
      ];

      await this.runRembg(args);

      return {
        success: true,
        outputPath,
        maskPath: outputPath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton
export const backgroundRemovalEngine = new BackgroundRemovalEngine();
