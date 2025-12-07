import { createClient } from '@supabase/supabase-js';

export interface HeyGenAvatar {
  avatar_id: string;
  name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
}

export interface HeyGenVideoRequest {
  video_inputs: {
    character: {
      type: 'avatar';
      avatar_id: string;
      avatar_style: string;
    };
    voice: {
      type: 'audio';
      audio_url: string; // URL of the audio file (e.g., from ElevenLabs)
    } | {
      type: 'text';
      input_text: string;
      voice_id: string; // HeyGen voice ID
    };
    background: {
      type: 'color' | 'image' | 'video';
      value: string; // Hex color or URL
    };
  }[];
  dimension?: {
    width: number;
    height: number;
  };
  test?: boolean; // If true, generates a watermarked preview (cheaper/free)
}

export interface HeyGenJobStatus {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

export class HeyGenService {
  private static instance: HeyGenService;
  private apiKey: string;
  private supabase;

  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY || '';
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  static getInstance(): HeyGenService {
    if (!HeyGenService.instance) {
      HeyGenService.instance = new HeyGenService();
    }
    return HeyGenService.instance;
  }

  private async request(endpoint: string, method: string = 'GET', body?: Record<string, unknown>) {
    if (!this.apiKey) {
      throw new Error('HeyGen API Key not configured');
    }

    const response = await fetch(`https://api.heygen.com/v2/${endpoint}`, {
      method,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HeyGen API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async listAvatars(): Promise<HeyGenAvatar[]> {
    try {
      const data = await this.request('avatars');
      return data.data.avatars.map((a: { avatar_id: string; name: string; gender: string; preview_image_url: string; preview_video_url: string }) => ({
        avatar_id: a.avatar_id,
        name: a.name,
        gender: a.gender,
        preview_image_url: a.preview_image_url,
        preview_video_url: a.preview_video_url,
      }));
    } catch (error) {
      console.error('Failed to list HeyGen avatars:', error);
      return [];
    }
  }

  async listVoices(): Promise<any[]> {
    try {
      const data = await this.request('voices');
      return data.data.voices;
    } catch (error) {
      console.error('Failed to list HeyGen voices:', error);
      return [];
    }
  }

  async generateVideo(request: HeyGenVideoRequest): Promise<string> {
    console.log('🎬 Starting HeyGen video generation...');
    
    const data = await this.request('video/generate', 'POST', request);
    
    if (!data.data || !data.data.video_id) {
      throw new Error('Failed to get video_id from HeyGen response');
    }

    return data.data.video_id;
  }

  async checkStatus(videoId: string): Promise<HeyGenJobStatus> {
    const data = await this.request(`video_status.get?video_id=${videoId}`);
    
    const status = data.data.status;
    const result: HeyGenJobStatus = {
      video_id: videoId,
      status: status === 'completed' ? 'completed' : 
              status === 'failed' ? 'failed' : 
              status === 'processing' ? 'processing' : 'pending',
    };

    if (status === 'completed') {
      result.video_url = data.data.video_url;
      result.thumbnail_url = data.data.thumbnail_url;
    } else if (status === 'failed') {
      result.error = data.data.error?.message || 'Unknown error';
    }

    return result;
  }

  async getQuota(): Promise<HeyGenQuota> {
    try {
      const data = await this.request('user/remaining_quota');
      return {
        remaining_quota: data.data.remaining_quota ?? 0,
        used_quota: data.data.used_quota ?? 0,
        quota_reset_date: data.data.quota_reset_date,
      };
    } catch (error) {
      console.error('Failed to get HeyGen quota:', error);
      return {
        remaining_quota: 0,
        used_quota: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export interface HeyGenQuota {
  remaining_quota: number;
  used_quota: number;
  quota_reset_date?: string;
  error?: string;
}

export const heyGenService = new HeyGenService();
