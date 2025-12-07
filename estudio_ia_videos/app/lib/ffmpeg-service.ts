export interface RenderSettings {
  resolution: '720p' | '1080p' | '1440p';
  format: 'mp4' | 'mov' | 'webm';
  quality: 'draft' | 'standard' | 'high' | 'premium';
  fps: number;
  codec: 'h264' | 'h265' | 'vp9' | 'prores';
  bitrate: string;
  audioEnabled: boolean;
  audioBitrate: string;
  hardwareAcceleration: boolean;
  preset: string;
  // Dimensões derivadas da resolução (opcional - calculado automaticamente)
  width?: number;
  height?: number;
  audioCodec?: string;
}

// Helper para obter dimensões da resolução
export function getResolutionDimensions(resolution: RenderSettings['resolution']): { width: number; height: number } {
  const dimensions: Record<string, { width: number; height: number }> = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '1440p': { width: 2560, height: 1440 },
  };
  return dimensions[resolution] || dimensions['1080p'];
}

export interface RenderProgress {
  percent: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  timeElapsed: number;
  timeRemaining: number;
  stage: string;
}

export interface FFmpegOptions {
  input: string;
  output: string;
  format?: string;
  codec?: string;
}

export interface MediaInfo {
  duration: number;
  width: number;
  height: number;
}

export class FFmpegService {
  private progressCallback: ((progress: RenderProgress) => void) | null = null;

  async initialize(): Promise<void> {
    console.log('FFmpeg initialized');
  }

  setProgressCallback(callback: (progress: RenderProgress) => void): void {
    this.progressCallback = callback;
  }

  async convert(options: FFmpegOptions): Promise<void> {
    console.log('FFmpeg conversion:', options);
    // Implementação real via fluent-ffmpeg
  }

  async getInfo(filePath: string): Promise<MediaInfo> {
    return { duration: 0, width: 1920, height: 1080 };
  }

  async renderVideo(
    frames: Blob[],
    audio: Blob | null,
    settings: RenderSettings,
    duration: number
  ): Promise<ArrayBuffer> {
    console.log('FFmpeg renderVideo:', { framesCount: frames.length, hasAudio: !!audio, duration });
    
    // Placeholder - retorna um buffer vazio
    // Implementação real usaria ffmpeg.wasm para processar os frames
    const dims = getResolutionDimensions(settings.resolution);
    console.log(`Rendering at ${dims.width}x${dims.height}`);
    
    return new ArrayBuffer(0);
  }
}

export const ffmpegService = new FFmpegService();
