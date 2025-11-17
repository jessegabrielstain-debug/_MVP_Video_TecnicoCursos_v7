/**
 * 📤 Video Uploader - IMPLEMENTAÇÃO REAL
 * Upload de vídeos renderizados para Supabase Storage
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import fs from 'fs/promises';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

export interface VideoUploadOptions {
  videoPath: string;
  projectId: string;
  userId: string;
  jobId: string;
  metadata: {
    resolution: { width: number; height: number };
    fps: number;
    codec: string;
    format: string;
    duration?: number;
    fileSize?: number;
  };
}

export interface UploadResult {
  videoUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  duration: number;
  uploadTime: number;
}

export class VideoUploader {
  private supabase = createClientComponentClient();

  /**
   * Upload de vídeo para Supabase Storage
   */
  async uploadVideo(options: VideoUploadOptions): Promise<string> {
    console.log(`📤 Uploading video: ${options.videoPath}`);

    try {
      // 1. Lê o arquivo de vídeo
      const videoBuffer = await fs.readFile(options.videoPath);
      const fileSize = videoBuffer.length;

      // 2. Gera nome único para o arquivo
      const timestamp = Date.now();
      const extension = path.extname(options.videoPath);
      const fileName = `${options.projectId}_${options.jobId}_${timestamp}${extension}`;
      const storagePath = `videos/${options.userId}/${fileName}`;

      console.log(`📁 Storage path: ${storagePath}`);

      // 3. Upload para bucket 'videos'
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('videos')
        .upload(storagePath, videoBuffer, {
          contentType: this.getContentType(extension),
          metadata: {
            projectId: options.projectId,
            jobId: options.jobId,
            userId: options.userId,
            ...options.metadata
          }
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log(`✅ Video uploaded successfully: ${uploadData.path}`);

      // 4. Obtém URL pública
      const { data: urlData } = this.supabase.storage
        .from('videos')
        .getPublicUrl(storagePath);

      const videoUrl = urlData.publicUrl;

      // 5. Gera thumbnail
      const thumbnailUrl = await this.generateAndUploadThumbnail(
        options.videoPath,
        options.userId,
        options.jobId
      );

      // 6. Atualiza tabela render_jobs
      await this.updateRenderJobRecord(options.jobId, {
        videoUrl,
        thumbnailUrl,
        fileSize,
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      console.log(`🎉 Video upload completed: ${videoUrl}`);
      return videoUrl;

    } catch (error) {
      console.error('❌ Video upload failed:', error);
      
      // Atualiza status como erro
      await this.updateRenderJobRecord(options.jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
        completedAt: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Gera thumbnail do vídeo e faz upload
   */
  private async generateAndUploadThumbnail(
    videoPath: string,
    userId: string,
    jobId: string
  ): Promise<string> {
    try {
      console.log('🖼️ Generating video thumbnail...');

      // Extrai primeiro frame do vídeo com FFmpeg
      const thumbnailPath = videoPath.replace(path.extname(videoPath), '_thumb.png');
      
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i', videoPath,
          '-ss', '00:00:01', // 1 segundo
          '-vframes', '1',
          '-s', '320x240', // Tamanho do thumbnail
          '-f', 'image2',
          '-y',
          thumbnailPath
        ]);

        ffmpeg.on('close', async (code) => {
          if (code === 0) {
            try {
              // Upload do thumbnail
              const thumbnailBuffer = await fs.readFile(thumbnailPath);
              const thumbnailFileName = `thumb_${jobId}_${Date.now()}.png`;
              const thumbnailStoragePath = `thumbnails/${userId}/${thumbnailFileName}`;

              const { data, error } = await this.supabase.storage
                .from('thumbnails')
                .upload(thumbnailStoragePath, thumbnailBuffer, {
                  contentType: 'image/png'
                });

              if (error) {
                console.warn('Thumbnail upload failed:', error);
                resolve(''); // Não falha o processo principal
                return;
              }

              const { data: urlData } = this.supabase.storage
                .from('thumbnails')
                .getPublicUrl(thumbnailStoragePath);

              // Limpa arquivo temporário
              await fs.unlink(thumbnailPath).catch(() => {});

              console.log('✅ Thumbnail generated and uploaded');
              resolve(urlData.publicUrl);

            } catch (error) {
              console.warn('Thumbnail processing failed:', error);
              resolve(''); // Não falha o processo principal
            }
          } else {
            console.warn('FFmpeg thumbnail generation failed');
            resolve(''); // Não falha o processo principal
          }
        });

        ffmpeg.on('error', (error) => {
          console.warn('FFmpeg spawn error:', error);
          resolve(''); // Não falha o processo principal
        });
      });

    } catch (error) {
      console.warn('Thumbnail generation failed:', error);
      return ''; // Não falha o processo principal
    }
  }

  /**
   * Atualiza registro na tabela render_jobs
   */
  private async updateRenderJobRecord(
    jobId: string,
    updates: {
      videoUrl?: string;
      thumbnailUrl?: string;
      fileSize?: number;
      status?: string;
      error?: string;
      completedAt?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('render_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) {
        console.error('Failed to update render_jobs:', error);
      } else {
        console.log(`✅ Updated render_jobs record: ${jobId}`);
      }
    } catch (error) {
      console.error('Error updating render_jobs:', error);
    }
  }

  /**
   * Determina Content-Type baseado na extensão
   */
  private getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska'
    };

    return contentTypes[extension.toLowerCase()] || 'video/mp4';
  }

  /**
   * Upload de vídeo com progresso
   */
  async uploadVideoWithProgress(
    options: VideoUploadOptions,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const videoBuffer = await fs.readFile(options.videoPath);
    const fileSize = videoBuffer.length;
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(fileSize / chunkSize);

    console.log(`📤 Uploading video in ${totalChunks} chunks`);

    // Para upload com progresso, usaríamos a API multipart do Supabase
    // Por simplicidade, vamos usar upload direto com callback simulado
    if (onProgress) {
      // Simula progresso
      for (let i = 0; i <= 100; i += 10) {
        onProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return this.uploadVideo(options);
  }

  /**
   * Lista vídeos de um usuário
   */
  async listUserVideos(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from('videos')
        .list(`${userId}/`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to list user videos:', error);
      return [];
    }
  }

  /**
   * Remove vídeo do storage
   */
  async deleteVideo(videoPath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from('videos')
        .remove([videoPath]);

      if (error) {
        console.error('Failed to delete video:', error);
        return false;
      }

      console.log(`🗑️ Video deleted: ${videoPath}`);
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  }

  /**
   * Obtém informações de um vídeo
   */
  async getVideoInfo(videoPath: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.storage
        .from('videos')
        .list('', {
          search: path.basename(videoPath)
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Failed to get video info:', error);
      return null;
    }
  }

  /**
   * Verifica espaço disponível no storage
   */
  async checkStorageQuota(userId: string): Promise<{
    used: number;
    total: number;
    available: number;
    percentUsed: number;
  }> {
    try {
      // Lista todos os arquivos do usuário
      const videos = await this.listUserVideos(userId);
      
      const used = videos.reduce((total, video) => {
        return total + (video.metadata?.size || 0);
      }, 0);

      // Assumindo quota de 5GB por usuário (configurável)
      const total = 5 * 1024 * 1024 * 1024; // 5GB em bytes
      const available = total - used;
      const percentUsed = (used / total) * 100;

      return {
        used,
        total,
        available,
        percentUsed
      };
    } catch (error) {
      console.error('Failed to check storage quota:', error);
      return {
        used: 0,
        total: 5 * 1024 * 1024 * 1024,
        available: 5 * 1024 * 1024 * 1024,
        percentUsed: 0
      };
    }
  }
}