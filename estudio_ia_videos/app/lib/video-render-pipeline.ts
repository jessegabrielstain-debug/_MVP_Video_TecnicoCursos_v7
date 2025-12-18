/**
 * Video Render Pipeline
 * Pipeline completo de renderização de vídeo
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import path from 'path';
import fs from 'fs/promises';
import { jobManager } from './render/job-manager';
import { elevenLabsService } from './elevenlabs-service';
import { spawn } from 'child_process';
import os from 'os';
import { avatarEngine } from './avatar-engine';
import { HeyGenAvatarOptions } from './engines/heygen-avatar-engine';
import { Timeline } from './types/timeline-types';

export interface PipelineStage {
  name: string;
  execute: () => Promise<void>;
}

export interface RenderPipelineOptions {
  projectId: string;
  jobId: string;
  outputFormat?: 'mp4' | 'webm';
  quality?: 'low' | 'medium' | 'high';
  resolution?: '720p' | '1080p' | '4k';
  test?: boolean;
}

interface AudioConfig {
  voiceId?: string;
  [key: string]: unknown;
}

interface DatabaseSlide {
  id: string;
  project_id: string;
  order_index: number;
  title: string | null;
  content: string | null;
  duration: number;
  background_color: string | null;
  background_image: string | null;
  avatar_config: Record<string, unknown>;
  audio_config: AudioConfig;
  created_at: string;
  updated_at: string;
}

// ========================================
// Pipeline Settings Types
// ========================================
export interface PipelineSettings {
  outputDir?: string;
  tempDir?: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  maxConcurrency?: number;
  webhookUrl?: string;
  cleanupOnComplete?: boolean;
}

export class VideoRenderPipeline {
  private supabase: SupabaseClient;
  private settings: PipelineSettings;

  constructor(settings?: PipelineSettings) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.settings = settings || {};
  }
  
  async prepareAssets(slides: DatabaseSlide[]): Promise<{ ready: boolean }> {
    logger.info('📥 Preparando assets (imagens, fontes, etc.)', { slidesCount: slides.length, service: 'VideoRenderPipeline' });
    
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'assets-'));
    const downloadedAssets: string[] = [];

    try {
      // 1. Download imagens de background dos slides
      for (const slide of slides) {
        if (slide.background_image) {
          try {
            const imagePath = await this.downloadAsset(slide.background_image, tempDir, 'image');
            if (imagePath) {
              downloadedAssets.push(imagePath);
              logger.debug('Imagem de background baixada', { slideId: slide.id, imagePath, service: 'VideoRenderPipeline' });
            }
          } catch (error) {
            logger.warn('Erro ao baixar imagem de background', { slideId: slide.id, error, service: 'VideoRenderPipeline' });
            // Continuar mesmo se uma imagem falhar
          }
        }
      }

      // 2. Download fontes (se necessário)
      // Por enquanto, usamos fontes do sistema, mas podemos baixar fontes customizadas aqui
      // const fontsDir = path.join(tempDir, 'fonts');
      // await fs.mkdir(fontsDir, { recursive: true });
      // TODO: Implementar download de fontes se necessário

      logger.info('✅ Assets preparados com sucesso', { assetsCount: downloadedAssets.length, service: 'VideoRenderPipeline' });
      
      return { ready: true };
    } catch (error) {
      logger.error('Erro ao preparar assets', error instanceof Error ? error : new Error(String(error)), { service: 'VideoRenderPipeline' });
      // Limpar assets baixados em caso de erro
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.warn('Erro ao limpar assets temporários', { error: cleanupError, service: 'VideoRenderPipeline' });
      }
      throw error;
    }
  }

  private async downloadAsset(url: string, destDir: string, type: 'image' | 'font' | 'audio' | 'video'): Promise<string | null> {
    try {
      // Verificar se é URL do Supabase Storage
      if (url.includes('supabase.co') || url.includes('storage.googleapis.com') || url.startsWith('http')) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const ext = this.getExtensionFromUrl(url) || (type === 'image' ? '.jpg' : '.bin');
        const filePath = path.join(destDir, `${fileName}${ext}`);
        
        await fs.writeFile(filePath, Buffer.from(buffer));
        return filePath;
      }

      // Se for caminho local ou S3 key, usar S3StorageService
      const { S3StorageService } = await import('./s3-storage');
      const downloadResult = await S3StorageService.downloadFile(url);
      
      if (downloadResult.success && downloadResult.buffer) {
        const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const ext = this.getExtensionFromUrl(url) || (type === 'image' ? '.jpg' : '.bin');
        const filePath = path.join(destDir, `${fileName}${ext}`);
        
        await fs.writeFile(filePath, downloadResult.buffer);
        return filePath;
      }

      return null;
    } catch (error) {
      logger.error('Erro ao baixar asset', error instanceof Error ? error : new Error(String(error)), { url, type, service: 'VideoRenderPipeline' });
      return null;
    }
  }

  private getExtensionFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)(\?|$)/);
      return match ? `.${match[1]}` : null;
    } catch {
      // Se não for URL válida, tentar extrair extensão do path
      const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
      return match ? `.${match[1]}` : null;
    }
  }

  async renderSlides(slides: DatabaseSlide[], timeline: Timeline): Promise<string[]> {
    logger.info('🎬 Renderizando slides', { slidesCount: slides.length, service: 'VideoRenderPipeline' });
    
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'render-slides-'));
    const renderedVideos: string[] = [];

    try {
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const outputPath = path.join(tempDir, `slide_${i}.mp4`);
        
        logger.debug('Renderizando slide', { slideIndex: i + 1, totalSlides: slides.length, slideId: slide.id, service: 'VideoRenderPipeline' });

        // Usar createSlideVideo que já está implementado
        await this.createSlideVideo(slide, '', outputPath);
        
        renderedVideos.push(outputPath);
      }

      logger.info('✅ Todos os slides renderizados', { slidesCount: renderedVideos.length, service: 'VideoRenderPipeline' });
      return renderedVideos;
    } catch (error) {
      logger.error('Erro ao renderizar slides', error instanceof Error ? error : new Error(String(error)), { service: 'VideoRenderPipeline' });
      // Limpar vídeos renderizados em caso de erro parcial
      for (const videoPath of renderedVideos) {
        try {
          await fs.unlink(videoPath).catch(() => {});
        } catch {
          // Ignorar erros de limpeza
        }
      }
      throw error;
    }
  }

  async composeTimeline(renderedSlides: string[], timeline: Timeline): Promise<{ composed: boolean; duration: number; outputPath: string }> {
    logger.info('🔗 Compondo timeline (concatenando vídeos)', { slidesCount: renderedSlides.length, duration: timeline.duration, service: 'VideoRenderPipeline' });
    
    if (renderedSlides.length === 0) {
      throw new Error('Nenhum slide renderizado para compor');
    }

    const tempDir = path.dirname(renderedSlides[0]);
    const outputPath = path.join(tempDir, 'composed_timeline.mp4');

    try {
      // Usar concatVideos que já está implementado
      await this.concatVideos(renderedSlides, outputPath);

      // Verificar se arquivo foi criado
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error('Vídeo composto está vazio');
      }

      // Calcular duração total (soma das durações dos slides ou usar timeline.duration)
      const totalDuration = timeline.duration || renderedSlides.length * 5; // Fallback: 5s por slide

      logger.info('✅ Timeline composta com sucesso', { outputPath, fileSize: stats.size, duration: totalDuration, service: 'VideoRenderPipeline' });
      
      return { 
        composed: true, 
        duration: totalDuration,
        outputPath 
      };
    } catch (error) {
      logger.error('Erro ao compor timeline', error instanceof Error ? error : new Error(String(error)), { service: 'VideoRenderPipeline' });
      throw error;
    }
  }

  async encodeVideo(composedVideoPath: string, settings: RenderPipelineOptions): Promise<string> {
    logger.info('🎞️ Codificando vídeo final', { inputPath: composedVideoPath, settings, service: 'VideoRenderPipeline' });
    
    const outputFormat = settings.outputFormat || 'mp4';
    const quality = settings.quality || 'high';
    const resolution = settings.resolution || '1080p';
    
    // Mapear resolução para dimensões
    const resolutionMap: Record<string, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 },
    };
    
    const { width, height } = resolutionMap[resolution] || resolutionMap['1080p'];
    
    // Mapear qualidade para bitrate
    const bitrateMap: Record<string, string> = {
      low: '2000k',
      medium: '5000k',
      high: '8000k',
      ultra: '12000k',
    };
    
    const videoBitrate = bitrateMap[quality] || bitrateMap['high'];
    const audioBitrate = '192k';
    
    const outputDir = path.dirname(composedVideoPath);
    const outputPath = path.join(outputDir, `encoded_${Date.now()}.${outputFormat}`);

    try {
      const codec = outputFormat === 'webm' ? 'libvpx-vp9' : 'libx264';
      const audioCodec = outputFormat === 'webm' ? 'libopus' : 'aac';
      
      const args = [
        '-y',
        '-i', composedVideoPath,
        '-c:v', codec,
        '-c:a', audioCodec,
        '-b:v', videoBitrate,
        '-b:a', audioBitrate,
        '-s', `${width}x${height}`,
        '-preset', 'medium', // Balance entre velocidade e qualidade
        '-crf', quality === 'ultra' ? '18' : quality === 'high' ? '23' : quality === 'medium' ? '28' : '32',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', // Otimização para streaming
        outputPath
      ];

      await this.runFFmpeg(args);

      // Verificar se arquivo foi criado
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error('Vídeo codificado está vazio');
      }

      logger.info('✅ Vídeo codificado com sucesso', { 
        outputPath, 
        fileSize: stats.size, 
        format: outputFormat,
        resolution,
        quality,
        service: 'VideoRenderPipeline' 
      });

      return outputPath;
    } catch (error) {
      logger.error('Erro ao codificar vídeo', error instanceof Error ? error : new Error(String(error)), { service: 'VideoRenderPipeline' });
      throw error;
    }
  }

  async execute(options: RenderPipelineOptions): Promise<string> {
    logger.info('Starting render pipeline', { projectId: options.projectId, jobId: options.jobId, service: 'VideoRenderPipeline' });
    const { projectId, jobId } = options;

    try {
      await jobManager.startJob(jobId);

      // 1. Fetch Project & Slides
      await jobManager.updateProgress(jobId, 5);
      const { data: slides, error: slidesError } = await this.supabase
        .from('slides')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (slidesError || !slides || slides.length === 0) {
        throw new Error('No slides found for project');
      }

      const typedSlides = slides as DatabaseSlide[];
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'render-'));
      const slideVideos: string[] = [];

      // 2. Process Each Slide
      for (let i = 0; i < typedSlides.length; i++) {
        const slide = typedSlides[i];
        const progress = 10 + Math.round((i / typedSlides.length) * 60); // 10% to 70%
        await jobManager.updateProgress(jobId, progress);

        logger.debug('Processing slide', { slideIndex: i + 1, totalSlides: typedSlides.length, service: 'VideoRenderPipeline' });

        const videoPath = path.join(tempDir, `slide_${i}.mp4`);

        // Check for HeyGen Avatar
        if (slide.avatar_config?.engine === 'heygen') {
          logger.info('Slide uses HeyGen avatar, initiating cloud render', { slideIndex: i, service: 'VideoRenderPipeline' });
          await this.processHeyGenSlide(slide, videoPath, options.test);
        } else {
          // 2a. Generate Audio (TTS)
          let audioPath = '';
          if (slide.content) {
            const audioBuffer = await elevenLabsService.generateSpeech({
              text: slide.content,
              voiceId: slide.audio_config?.voiceId || '21m00Tcm4TlvDq8ikWAM', // Default voice
            });
            audioPath = path.join(tempDir, `slide_${i}_audio.mp3`);
            await fs.writeFile(audioPath, Buffer.from(audioBuffer));
          }

          // 2b. Generate Video Segment (Image + Audio)
          // For MVP, we'll create a simple video from background color/image and audio
          await this.createSlideVideo(slide, audioPath, videoPath);
        }
        
        slideVideos.push(videoPath);
      }

      // 3. Concatenate Videos
      await jobManager.updateProgress(jobId, 80);
      const finalVideoPath = path.join(tempDir, 'final_output.mp4');
      await this.concatVideos(slideVideos, finalVideoPath);

      // 4. Upload to Storage
      await jobManager.updateProgress(jobId, 90);
      const fileBuffer = await fs.readFile(finalVideoPath);
      const fileName = `projects/${projectId}/${Date.now()}_final.mp4`;
      
      const { error: uploadError } = await this.supabase.storage
        .from('videos')
        .upload(fileName, fileBuffer, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = this.supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // 5. Cleanup & Complete
      await fs.rm(tempDir, { recursive: true, force: true });
      await jobManager.completeJob(jobId, publicUrl);

      return publicUrl;

    } catch (error) {
      logger.error('Pipeline error', error instanceof Error ? error : new Error(String(error)), { projectId: options.projectId, jobId: options.jobId, service: 'VideoRenderPipeline' });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await jobManager.failJob(jobId, errorMessage);
      throw error;
    }
  }

  private async createSlideVideo(slide: DatabaseSlide, audioPath: string, outputPath: string): Promise<void> {
    logger.info('🎬 Criando vídeo do slide', { slideId: slide.id, hasAudio: !!audioPath, component: 'VideoRenderPipeline' });
    
    const duration = slide.duration || 5;
    const bgColor = slide.background_color || 'black';
    
    // Se temos imagem de background, usar ela; senão usar cor sólida
    let hasBackgroundImage = false;
    let backgroundImagePath: string | null = null;
    
    if (slide.background_image) {
      try {
        // Tentar baixar imagem de background
        const tempDir = path.dirname(outputPath);
        backgroundImagePath = await this.downloadAsset(slide.background_image, tempDir, 'image');
        if (backgroundImagePath) {
          hasBackgroundImage = true;
          logger.debug('Imagem de background baixada', { slideId: slide.id, imagePath: backgroundImagePath, component: 'VideoRenderPipeline' });
        }
      } catch (error) {
        logger.warn('Erro ao baixar imagem de background, usando cor sólida', { slideId: slide.id, error, component: 'VideoRenderPipeline' });
      }
    }

    const args = ['-y'];

    // Input de vídeo (imagem ou cor sólida)
    if (hasBackgroundImage && backgroundImagePath) {
      // Usar imagem como background
      args.push('-loop', '1', '-i', backgroundImagePath);
      // Escalar para 1280x720 se necessário
      args.push('-vf', `scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS`);
    } else {
      // Usar cor sólida
      args.push('-f', 'lavfi', '-i', `color=c=${bgColor}:s=1280x720:d=${duration}`);
    }

    // Input de áudio (se existir)
    if (audioPath && (await fs.access(audioPath).then(() => true).catch(() => false))) {
      args.push('-i', audioPath);
      
      // Mapear vídeo e áudio
      if (hasBackgroundImage) {
        args.push('-map', '0:v', '-map', '1:a');
      } else {
        args.push('-map', '0:v', '-map', '1:a');
      }
      
      // Usar duração do áudio se disponível
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of json "${audioPath}"`);
        const probeData = JSON.parse(stdout);
        if (probeData.format?.duration) {
          const audioDuration = parseFloat(probeData.format.duration);
          args.push('-t', String(audioDuration));
        }
      } catch {
        // Se não conseguir obter duração, usar shortest
        args.push('-shortest');
      }
    } else {
      // Sem áudio, usar duração fixa
      args.push('-t', String(duration));
    }

    // Adicionar overlay de texto se houver título
    if (slide.title) {
      const currentFilters = args.filter(arg => arg === '-vf' || arg.startsWith('scale=') || arg.startsWith('pad=') || arg.startsWith('setpts='));
      const hasVideoFilter = currentFilters.length > 0;
      
      const textFilter = `drawtext=text='${slide.title.replace(/'/g, "\\'")}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.5:boxborderw=5`;
      
      if (hasVideoFilter) {
        // Adicionar ao filtro existente
        const filterIndex = args.indexOf('-vf');
        if (filterIndex !== -1) {
          args[filterIndex + 1] = `${args[filterIndex + 1]},${textFilter}`;
        }
      } else {
        args.push('-vf', textFilter);
      }
    }

    // Codec e formato
    args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '23');
    
    // Se não há áudio, adicionar stream de áudio silencioso
    if (!audioPath) {
      args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-c:a', 'aac', '-shortest');
    }

    args.push(outputPath);

    await this.runFFmpeg(args);
    
    logger.info('✅ Vídeo do slide criado', { slideId: slide.id, outputPath, component: 'VideoRenderPipeline' });
  }

  private async processHeyGenSlide(slide: DatabaseSlide, outputPath: string, isTest: boolean = false): Promise<void> {
    try {
      const config = slide.avatar_config as unknown as HeyGenAvatarOptions;
      
      // Initiate Render
      const result = await avatarEngine.render({
        engine: 'heygen',
        duration: slide.duration,
        config: {
          avatarId: config.avatarId,
          text: slide.content || ' ',
          quality: config.quality || 'high',
          background: slide.background_color || '#00FF00', // Green screen default if not specified
          voiceId: config.voiceId, // Pass voiceId if available
          test: isTest
        }
      });

      if (result.type !== 'video' || !result.jobId) {
        throw new Error('Failed to initiate HeyGen render');
      }

      // Poll for completion
      let videoUrl = '';
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes (5s interval)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const status = await avatarEngine.checkHeyGenStatus(result.jobId);
        
        if (status.status === 'completed' && status.videoUrl) {
          videoUrl = status.videoUrl;
          break;
        } else if (status.status === 'failed') {
          throw new Error('HeyGen render failed');
        }
        
        attempts++;
        logger.debug('Polling HeyGen job', { jobId: result.jobId, status: status.status, attempts, maxAttempts, service: 'VideoRenderPipeline' });
      }

      if (!videoUrl) {
        throw new Error('HeyGen render timed out');
      }

      // Download Video
      logger.info('Downloading HeyGen video', { videoUrl, service: 'VideoRenderPipeline' });
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
      
      const buffer = await response.arrayBuffer();
      await fs.writeFile(outputPath, Buffer.from(buffer));
      logger.info(`[Pipeline] HeyGen video saved to ${outputPath}`, { component: 'VideoRenderPipeline' });

    } catch (error) {
      logger.error('[Pipeline] Error processing HeyGen slide', error instanceof Error ? error : new Error(String(error)), { component: 'VideoRenderPipeline' });
      throw error;
    }
  }

  private async concatVideos(videoPaths: string[], outputPath: string): Promise<void> {
    // Create list file
    const listPath = path.join(path.dirname(outputPath), 'list.txt');
    const fileContent = videoPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    await fs.writeFile(listPath, fileContent);

    const args = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c', 'copy',
      outputPath
    ];

    await this.runFFmpeg(args);
  }

  private runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });

      ffmpeg.on('error', (err) => reject(err));
      
      // Optional: Log stderr for debug
      // ffmpeg.stderr.on('data', d => logger.info(d.toString(), { component: 'VideoRenderPipeline' }));
    });
  }
  
  async validatePipeline(): Promise<boolean> {
    return true;
  }
}

export const videoRenderPipeline = new VideoRenderPipeline();
