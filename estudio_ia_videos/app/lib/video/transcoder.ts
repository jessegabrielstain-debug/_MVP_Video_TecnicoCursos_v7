import { EventEmitter } from 'events';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

export enum VideoFormat {
  MP4 = 'mp4',
  WEBM = 'webm',
  AVI = 'avi'
}

export enum VideoCodec {
  H264 = 'libx264',
  H265 = 'libx265',
  VP9 = 'libvpx-vp9'
}

export enum AudioCodec {
  AAC = 'aac',
  MP3 = 'libmp3lame',
  OPUS = 'libopus'
}

export enum VideoPreset {
  ULTRAFAST = 'ultrafast',
  FAST = 'fast',
  MEDIUM = 'medium',
  SLOW = 'slow'
}

export interface Resolution {
  width: number;
  height: number;
  bitrate: number; // kbps
  name: string;
}

export const STANDARD_RESOLUTIONS: Record<string, Resolution> = {
  '4K': { width: 3840, height: 2160, bitrate: 15000, name: '4K' },
  '1080p': { width: 1920, height: 1080, bitrate: 5000, name: '1080p' },
  '720p': { width: 1280, height: 720, bitrate: 2500, name: '720p' },
  '480p': { width: 854, height: 480, bitrate: 1000, name: '480p' }
};

export interface TranscodeOptions {
  format?: VideoFormat;
  videoCodec?: VideoCodec;
  audioCodec?: AudioCodec;
  preset?: VideoPreset;
  resolution?: Resolution;
  fps?: number;
  bitrate?: string;
  optimizeForWeb?: boolean;
}

export interface TranscodeResult {
  success: boolean;
  outputPath: string;
  format: VideoFormat;
  resolution?: Resolution;
}

export interface MultiResolutionResult {
  resolutions: TranscodeResult[];
  hlsPlaylist?: string;
  dashManifest?: string;
}

export default class VideoTranscoder extends EventEmitter {
  private activeTranscodes: Map<string, ffmpeg.FfmpegCommand> = new Map();

  constructor() {
    super();
  }

  async transcode(inputPath: string, outputPath: string, options: TranscodeOptions = {}): Promise<TranscodeResult> {
    const transcodeId = path.basename(outputPath);
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath);
      
      // Store command for cancellation
      this.activeTranscodes.set(transcodeId, command);

      // Format
      if (options.format) {
        command.format(options.format);
      }

      // Video Codec
      if (options.videoCodec) {
        command.videoCodec(options.videoCodec);
      }

      // Audio Codec
      if (options.audioCodec) {
        command.audioCodec(options.audioCodec);
      }

      // Preset
      if (options.preset) {
        command.addOption('-preset', options.preset);
      }

      // Resolution
      if (options.resolution) {
        command.size(`${options.resolution.width}x${options.resolution.height}`);
      }

      // FPS
      if (options.fps) {
        command.fps(options.fps);
      }

      // Web Optimization
      if (options.optimizeForWeb) {
        command.addOption('-movflags', '+faststart');
      }

      command.output(outputPath);

      command.on('progress', (progress) => {
        this.emit('progress', { id: transcodeId, percent: progress.percent });
      });

      command.on('end', () => {
        this.activeTranscodes.delete(transcodeId);
        this.emit('complete', { id: transcodeId, outputPath });
        resolve({
          success: true,
          outputPath,
          format: options.format || VideoFormat.MP4,
          resolution: options.resolution
        });
      });

      command.on('error', (err) => {
        this.activeTranscodes.delete(transcodeId);
        // Only reject if not manually cancelled (which we can't easily distinguish here without more state, 
        // but for now let's assume error is error)
        if (!err.message.includes('SIGKILL')) {
             this.emit('error', err);
             reject(new Error('Transcode failed: ' + err.message));
        } else {
             reject(new Error('Transcode cancelled'));
        }
      });

      command.run();
    });
  }

  async transcodeMultiResolution(
    inputPath: string, 
    outputDir: string, 
    resolutions: Resolution[], 
    options: { generateHLS?: boolean; generateDASH?: boolean } = {}
  ): Promise<MultiResolutionResult> {
    const results: TranscodeResult[] = [];

    // Ensure output directory exists
    try {
        await fs.mkdir(outputDir, { recursive: true });
    } catch (e) {
        // ignore if exists
    }

    for (const res of resolutions) {
      const outputPath = path.join(outputDir, `video_${res.name}.mp4`);
      const result = await this.transcode(inputPath, outputPath, {
        resolution: res,
        videoCodec: VideoCodec.H264,
        audioCodec: AudioCodec.AAC,
        preset: VideoPreset.FAST
      });
      results.push(result);
      this.emit('resolution:complete', { resolution: res.name, path: outputPath });
    }

    // HLS/DASH generation would be separate commands usually, 
    // but for this stub/implementation we can just return paths if requested
    // In a real implementation, we'd run ffmpeg to generate playlists.
    
    let hlsPlaylist: string | undefined;
    let dashManifest: string | undefined;

    if (options.generateHLS) {
        hlsPlaylist = path.join(outputDir, 'playlist.m3u8');
        // Mock generation
        await fs.writeFile(hlsPlaylist, '#EXTM3U');
    }

    if (options.generateDASH) {
        dashManifest = path.join(outputDir, 'manifest.mpd');
        // Mock generation
        await fs.writeFile(dashManifest, '<MPD>');
    }

    return {
      resolutions: results,
      hlsPlaylist,
      dashManifest
    };
  }

  getActiveTranscodes(): string[] {
    return Array.from(this.activeTranscodes.keys());
  }

  async cancelTranscode(id: string): Promise<boolean> {
    const command = this.activeTranscodes.get(id);
    if (command) {
      command.kill('SIGKILL');
      this.activeTranscodes.delete(id);
      return true;
    }
    return false;
  }
}

export async function transcodeForNR(inputPath: string, outputPath: string): Promise<void> {
  const transcoder = new VideoTranscoder();
  await transcoder.transcode(inputPath, outputPath, {
    videoCodec: VideoCodec.H264,
    audioCodec: AudioCodec.AAC,
    preset: VideoPreset.MEDIUM
  });
}

export async function createAdaptiveStream(inputPath: string, outputDir: string): Promise<MultiResolutionResult> {
  const transcoder = new VideoTranscoder();
  return transcoder.transcodeMultiResolution(
    inputPath, 
    outputDir, 
    [STANDARD_RESOLUTIONS['1080p'], STANDARD_RESOLUTIONS['720p']], 
    { generateHLS: true }
  );
}
