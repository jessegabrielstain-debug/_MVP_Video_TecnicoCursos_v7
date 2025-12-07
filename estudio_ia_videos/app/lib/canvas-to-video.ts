import { RenderSettings } from './ffmpeg-service';

export interface VideoScene {
  id: string;
  name?: string;
  duration: number;
  elements: Record<string, unknown>[];
  frames?: unknown[];
  totalDuration?: number;
  audioTrack?: {
    url: string;
    offset: number;
    volume: number;
  };
}

export interface CanvasToVideoOptions {
  canvas: HTMLCanvasElement;
  fps?: number;
  duration?: number;
  format?: 'webm' | 'mp4';
}

export class CanvasToVideoConverter {
  private settings: RenderSettings | undefined;

  constructor(settings?: RenderSettings) {
    this.settings = settings;
  }

  async convert(options: CanvasToVideoOptions): Promise<Blob> {
    // Implementação futura com MediaRecorder ou FFmpeg
    return new Blob([], { type: 'video/webm' });
  }
}

export const canvasToVideo = new CanvasToVideoConverter();
