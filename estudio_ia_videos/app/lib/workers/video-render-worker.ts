/**
 * 🎬 Video Render Worker - IMPLEMENTAÇÃO REAL
 * Worker completo para renderização de vídeos com FFmpeg
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';
import { FFmpegExecutor, FFmpegOptions } from '@/lib/render/ffmpeg-executor';
import { VideoUploader } from '@/lib/storage/video-uploader';
import type { PPTXSlideData } from '@/lib/render/frame-generator';

const execAsync = promisify(exec);

export interface RenderJobData {
  id: string;
  projectId: string;
  userId: string;
  slides: PPTXSlideData[];
  config: {
    resolution: { width: number; height: number };
    fps: number;
    quality: 'low' | 'medium' | 'high' | 'ultra';
    codec: 'h264' | 'h265' | 'vp9';
    format: 'mp4' | 'mov' | 'webm';
    audioEnabled: boolean;
    transitionsEnabled: boolean;
  };
  audioTracks?: {
    slideIndex: number;
    audioUrl: string;
    duration: number;
  }[];
}

export interface RenderProgress {
  jobId: string;
  stage: 'preparing' | 'frames' | 'audio' | 'encoding' | 'upload' | 'complete' | 'error';
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  fps?: number;
  timeRemaining?: number;
  message: string;
  error?: string;
}

export class VideoRenderWorker extends EventEmitter {
  private isProcessing = false;
  private currentJobId: string | null = null;
  private ffmpegExecutor: FFmpegExecutor;
  private videoUploader: VideoUploader;
  private tempDir: string;

  constructor() {
    super();
    this.ffmpegExecutor = new FFmpegExecutor();
    this.videoUploader = new VideoUploader();
    this.tempDir = path.join(process.cwd(), 'temp', 'render');
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Processa um job de renderização completo
   */
  async processRenderJob(jobData: RenderJobData): Promise<string> {
    if (this.isProcessing) {
      throw new Error('Worker is already processing a job');
    }

    this.isProcessing = true;
    this.currentJobId = jobData.id;

    try {
      console.log(`🎬 Starting render job: ${jobData.id}`);
      
      // 1. Preparar diretórios e arquivos
      await this.emitProgress({
        jobId: jobData.id,
        stage: 'preparing',
        progress: 5,
        message: 'Preparando arquivos...'
      });

      const jobDir = path.join(this.tempDir, jobData.id);
      await fs.mkdir(jobDir, { recursive: true });

      // 2. Gerar frames dos slides
      await this.emitProgress({
        jobId: jobData.id,
        stage: 'frames',
        progress: 15,
        message: 'Gerando frames dos slides...'
      });

      const framesDir = path.join(jobDir, 'frames');
      const totalFrames = await this.generateFrames(jobData, framesDir);

      // 3. Processar áudio (se habilitado)
      let audioPath: string | null = null;
      if (jobData.config.audioEnabled && jobData.audioTracks?.length) {
        await this.emitProgress({
          jobId: jobData.id,
          stage: 'audio',
          progress: 40,
          message: 'Processando áudio...'
        });

        audioPath = await this.processAudio(jobData, jobDir);
      }

      // 4. Renderizar vídeo com FFmpeg
      await this.emitProgress({
        jobId: jobData.id,
        stage: 'encoding',
        progress: 60,
        message: 'Encodando vídeo...'
      });

      const outputPath = path.join(jobDir, `output.${jobData.config.format}`);
      await this.renderVideo(jobData, framesDir, audioPath, outputPath, totalFrames);

      // 5. Upload para storage
      await this.emitProgress({
        jobId: jobData.id,
        stage: 'upload',
        progress: 90,
        message: 'Fazendo upload...'
      });

      const videoUrl = await this.uploadVideo(jobData, outputPath);

      // 6. Cleanup
      await this.cleanup(jobDir);

      await this.emitProgress({
        jobId: jobData.id,
        stage: 'complete',
        progress: 100,
        message: 'Renderização concluída!'
      });

      console.log(`✅ Render job completed: ${jobData.id}`);
      return videoUrl;

    } catch (error) {
      console.error(`❌ Render job failed: ${jobData.id}`, error);
      
      await this.emitProgress({
        jobId: jobData.id,
        stage: 'error',
        progress: 0,
        message: 'Erro na renderização',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    } finally {
      this.isProcessing = false;
      this.currentJobId = null;
    }
  }

  /**
   * Gera frames individuais dos slides
   */
  private async generateFrames(jobData: RenderJobData, framesDir: string): Promise<number> {
    await fs.mkdir(framesDir, { recursive: true });

    const frameGenerator = await import('@/lib/render/frame-generator');
    const totalFrames = await frameGenerator.generateFramesFromSlides(
      jobData.slides,
      framesDir,
      {
        resolution: jobData.config.resolution,
        fps: jobData.config.fps,
        transitionsEnabled: jobData.config.transitionsEnabled,
        onProgress: (progress) => {
          this.emitProgress({
            jobId: jobData.id,
            stage: 'frames',
            progress: 15 + (progress * 0.25), // 15-40%
            message: `Gerando frames... ${Math.round(progress)}%`
          });
        }
      }
    );

    return totalFrames;
  }

  /**
   * Processa e sincroniza áudio
   */
  private async processAudio(jobData: RenderJobData, jobDir: string): Promise<string> {
    if (!jobData.audioTracks?.length) {
      throw new Error('No audio tracks provided');
    }

    const audioDir = path.join(jobDir, 'audio');
    await fs.mkdir(audioDir, { recursive: true });

    // Download e processa cada track de áudio
    const audioFiles: string[] = [];
    for (let i = 0; i < jobData.audioTracks.length; i++) {
      const track = jobData.audioTracks[i];
      const audioFile = path.join(audioDir, `slide_${track.slideIndex}.wav`);
      
      // Download do áudio (assumindo que audioUrl é uma URL válida)
      await this.downloadAudio(track.audioUrl, audioFile);
      audioFiles.push(audioFile);
    }

    // Concatena todos os áudios em um arquivo final
    const finalAudioPath = path.join(jobDir, 'final_audio.wav');
    await this.concatenateAudio(audioFiles, finalAudioPath);

    return finalAudioPath;
  }

  /**
   * Download de arquivo de áudio
   */
  private async downloadAudio(url: string, outputPath: string): Promise<void> {
    if (url.startsWith('http')) {
      // Download via HTTP
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      await fs.writeFile(outputPath, Buffer.from(buffer));
    } else {
      // Assume que é um caminho local ou Supabase Storage
      throw new Error('Local audio files not supported yet');
    }
  }

  /**
   * Concatena múltiplos arquivos de áudio
   */
  private async concatenateAudio(audioFiles: string[], outputPath: string): Promise<void> {
    if (audioFiles.length === 1) {
      await fs.copyFile(audioFiles[0], outputPath);
      return;
    }

    // Cria um arquivo de lista para FFmpeg
    const listFile = outputPath.replace('.wav', '.txt');
    const listContent = audioFiles.map(file => `file '${file}'`).join('\n');
    await fs.writeFile(listFile, listContent);

    // Concatena com FFmpeg
    const command = [
      'ffmpeg',
      '-f', 'concat',
      '-safe', '0',
      '-i', listFile,
      '-c', 'copy',
      outputPath,
      '-y'
    ].join(' ');

    await execAsync(command);
    await fs.unlink(listFile); // Remove arquivo temporário
  }

  /**
   * Renderiza vídeo final com FFmpeg
   */
  private async renderVideo(
    jobData: RenderJobData,
    framesDir: string,
    audioPath: string | null,
    outputPath: string,
    totalFrames: number
  ): Promise<void> {
    await this.ffmpegExecutor.renderFromFrames({
      inputFramesDir: framesDir,
      inputFramesPattern: 'frame_%06d.png', // FrameGenerator (function) uses 6 digits
      audioPath: audioPath || undefined,
      outputPath,
      fps: jobData.config.fps,
      width: jobData.config.resolution.width,
      height: jobData.config.resolution.height,
      codec: jobData.config.codec === 'h264' ? 'h264' : jobData.config.codec === 'h265' ? 'h265' : 'vp9',
      quality: jobData.config.quality,
      format: jobData.config.format
    } as FFmpegOptions, (progress) => {
      this.emitProgress({
        jobId: jobData.id,
        stage: 'encoding',
        progress: 60 + (progress.progress * 0.3), // 60-90%
        currentFrame: progress.frame,
        totalFrames,
        fps: progress.fps,
        message: `Encodando vídeo... ${Math.round(progress.progress)}%`
      });
    });
  }

  /**
   * Upload do vídeo para storage
   */
  private async uploadVideo(jobData: RenderJobData, videoPath: string): Promise<string> {
    const videoUrl = await this.videoUploader.uploadVideo({
      videoPath,
      projectId: jobData.projectId,
      userId: jobData.userId,
      jobId: jobData.id,
      metadata: {
        resolution: jobData.config.resolution,
        fps: jobData.config.fps,
        codec: jobData.config.codec,
        format: jobData.config.format
      }
    });

    return videoUrl;
  }

  /**
   * Cleanup de arquivos temporários
   */
  private async cleanup(jobDir: string): Promise<void> {
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
      console.log(`🧹 Cleaned up temp directory: ${jobDir}`);
    } catch (error) {
      console.error('Failed to cleanup temp directory:', error);
    }
  }

  /**
   * Emite progresso do job
   */
  private async emitProgress(progress: RenderProgress): Promise<void> {
    this.emit('progress', progress);
    
    // Também persiste no banco via API
    try {
      await fetch('/api/render/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });
    } catch (error) {
      console.error('Failed to persist progress:', error);
    }
  }

  /**
   * Cancela job atual
   */
  async cancelCurrentJob(): Promise<void> {
    if (!this.isProcessing || !this.currentJobId) {
      return;
    }

    console.log(`⏹️ Cancelling job: ${this.currentJobId}`);
    
    // Kill processos FFmpeg se estiverem rodando
    await (this.ffmpegExecutor as unknown as { killAllProcesses: () => Promise<void> }).killAllProcesses();

    // Cleanup
    const jobDir = path.join(this.tempDir, this.currentJobId);
    await this.cleanup(jobDir);

    this.isProcessing = false;
    this.currentJobId = null;

    this.emit('cancelled');
  }

  /**
   * Status do worker
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      currentJobId: this.currentJobId,
      tempDir: this.tempDir
    };
  }
}

// Singleton instance
let workerInstance: VideoRenderWorker | null = null;

export const getVideoRenderWorker = (): VideoRenderWorker => {
  if (!workerInstance) {
    workerInstance = new VideoRenderWorker();
  }
  return workerInstance;
};