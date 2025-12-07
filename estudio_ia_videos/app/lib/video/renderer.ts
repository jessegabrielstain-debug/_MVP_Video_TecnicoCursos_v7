import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

export interface RenderProgress {
  percent: number;
  message: string;
  currentFile: string;
  totalFiles: number;
  estimatedTimeLeft: number;
}

export interface VideoInfo {
  duration: number;
  resolution: { width: number; height: number };
  format: string;
}

export async function validateFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      resolve({
        duration: metadata.format.duration || 0,
        resolution: {
          width: videoStream?.width || 0,
          height: videoStream?.height || 0
        },
        format: metadata.format.format_name || 'unknown'
      });
    });
  });
}

export async function renderVideo(
  inputPath: string, 
  outputPath: string, 
  options: { resolution?: string; quality?: string } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath)
      .output(outputPath);

    if (options.resolution) {
      // Map resolution string to size if needed, or pass directly if format is WxH
      // For now assume simple pass through or mapping
      if (options.resolution === '1080p') command.size('1920x1080');
      else if (options.resolution === '720p') command.size('1280x720');
      else if (options.resolution === '4k') command.size('3840x2160');
    }

    command.on('end', () => resolve());
    command.on('error', (err) => reject(err));
    
    command.run();
  });
}
