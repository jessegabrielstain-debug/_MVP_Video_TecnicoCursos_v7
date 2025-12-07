import { aiVideoAnalysis } from './ai-video-analysis-system';

export interface SlideData {
  id: string;
  content: string;
  notes?: string;
  duration?: number;
  title?: string;
  imageUrl?: string;
}

export interface VideoConfig {
  resolution: '720p' | '1080p' | '4k';
  fps: number;
  format: 'mp4' | 'webm';
  voiceModel?: string;
  avatarStyle?: string;
  background?: string;
}

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  resolution: '1080p',
  fps: 30,
  format: 'mp4',
  voiceModel: 'pt-BR-AntonioNeural',
  avatarStyle: 'default',
  background: '#ffffff'
};

export class AIServices {
  static async analyzeVideo(path: string) {
    return aiVideoAnalysis.analyze(path);
  }
}
