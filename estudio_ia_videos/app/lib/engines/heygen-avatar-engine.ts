import { heyGenService, HeyGenVideoRequest } from '../heygen-service';
import { logger } from '@/lib/logger';

export interface HeyGenAvatarOptions {
  avatarId: string;
  voiceId?: string; // If using HeyGen TTS
  audioUrl?: string; // If using external audio (e.g. ElevenLabs)
  text?: string; // If using HeyGen TTS
  background?: string;
  quality?: 'high' | 'medium' | 'low';
  test?: boolean; // If true, generates watermarked video without credit cost
}

export interface HeyGenRenderResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
}

export class HeyGenAvatarEngine {
  async render(options: HeyGenAvatarOptions): Promise<HeyGenRenderResult> {
    try {
      const request: HeyGenVideoRequest = {
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: options.avatarId,
              avatar_style: 'normal',
            },
            voice: options.audioUrl 
              ? {
                  type: 'audio',
                  audio_url: options.audioUrl,
                }
              : {
                  type: 'text',
                  input_text: options.text || 'Hello',
                  voice_id: options.voiceId || 'e0cc82c22f414c95b1f25696c732f058', // Default voice (Cassidy)
                },
            background: {
              type: 'color',
              value: options.background || '#00FF00', // Green screen default
            },
          },
        ],
        test: options.test ?? false, // Use option or default to false (production)
      };

      const jobId = await heyGenService.generateVideo(request);
      
      return {
        jobId,
        status: 'pending',
      };
    } catch (error) {
      logger.error('HeyGen Render Error', error as Error, { options, component: 'HeyGenAvatarEngine' });
      throw error;
    }
  }

  async checkStatus(jobId: string): Promise<HeyGenRenderResult> {
    const status = await heyGenService.checkStatus(jobId);
    return {
      jobId: status.video_id,
      status: status.status,
      videoUrl: status.video_url,
    };
  }
}

export const heyGenAvatarEngine = new HeyGenAvatarEngine();
