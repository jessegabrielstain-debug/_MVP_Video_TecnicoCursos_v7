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
    logger.debug('Preparing assets', { slidesCount: slides.length, service: 'VideoRenderPipeline' });
    // TODO: Download images, fonts, etc.
    return { ready: true };
  }

  async renderSlides(slides: DatabaseSlide[], timeline: Timeline): Promise<string[]> {
    logger.debug('Rendering slides', { slidesCount: slides.length, service: 'VideoRenderPipeline' });
    // TODO: Implement actual slide rendering logic here or reuse createSlideVideo
    // For now, return mock paths
    return slides.map((_, i) => `slide_${i}.mp4`);
  }

  async composeTimeline(renderedSlides: string[], timeline: Timeline): Promise<{ composed: boolean; duration: number }> {
    logger.debug('Composing timeline', { slidesCount: renderedSlides.length, duration: timeline.duration, service: 'VideoRenderPipeline' });
    // TODO: Implement concatenation
    return { composed: true, duration: timeline.duration };
  }

  async encodeVideo(composedVideo: unknown, settings: RenderPipelineOptions): Promise<string> {
    logger.debug('Encoding video', { settings, service: 'VideoRenderPipeline' });
    // TODO: Implement encoding
    return `/tmp/output_${Date.now()}.mp4`;
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
    // Simple FFmpeg command to create video from text/color + audio
    // If audio exists, duration is audio duration. Else default 5s.
    
    const duration = slide.duration || 5;
    const bgColor = slide.background_color || 'black';
    
    // If we have audio, we use it. If not, we generate silent video.
    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=${bgColor}:s=1280x720:d=${duration}`,
    ];

    if (audioPath) {
      // If audio exists, we need to ensure video matches audio duration roughly or use shortest/longest
      // For simplicity, we'll just add audio.
      // Note: -i color duration is fixed above. Ideally we probe audio duration.
      // Let's assume for MVP we just use the audio input.
      args.push('-i', audioPath);
      // Map video from 0:v and audio from 1:a
      args.push('-map', '0:v', '-map', '1:a');
      // Shortest to stop if audio is shorter (or longer)
      args.push('-shortest');
    }

    // Add text overlay (requires fontconfig usually, might fail on minimal envs without fonts)
    // We'll skip complex text overlay for this MVP step to ensure stability, 
    // or use a simple drawtext if we are sure ffmpeg has support.
    // args.push('-vf', `drawtext=text='${slide.title}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2`);

    args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p');
    args.push(outputPath);

    await this.runFFmpeg(args);
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
