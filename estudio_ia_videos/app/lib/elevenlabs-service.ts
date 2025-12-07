import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface ElevenLabsOptions {
  apiKey?: string;
  voiceId?: string;
  model?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface ElevenLabsVoice {
  id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  settings?: VoiceSettings;
  language?: string;
  gender?: string;
  accent?: string;
}

export interface TTSRequest {
  text: string;
  voiceId?: string;
  voice_id?: string;
  modelId?: string;
  model_id?: string;
  voice_settings?: VoiceSettings;
}

export interface UserInfo {
  subscription: {
    tier: string;
    character_count: number;
    character_limit: number;
    can_extend_character_limit: boolean;
    allowed_to_extend_character_limit: boolean;
    next_character_count_reset_unix: number;
    voice_limit: number;
    max_voice_add_edits: number;
    voice_add_edit_counter: number;
    professional_voice_limit: number;
    can_use_instant_voice_cloning: boolean;
    can_use_professional_voice_cloning: boolean;
    currency: string;
    status: string;
    billing_period: string;
  };
  is_new_user: boolean;
  xi_api_key_preview: string;
  can_use_delayed_payment_methods: boolean;
  is_onboarding_completed: boolean;
  first_name?: string;
}

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private apiKey: string;
  private supabase;

  constructor(options: ElevenLabsOptions = {}) {
    this.apiKey = options.apiKey || process.env.ELEVENLABS_API_KEY || '';
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  async generateSpeech(request: TTSRequest): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API Key not configured');
    }

    const voiceId = request.voiceId || request.voice_id || '21m00Tcm4TlvDq8ikWAM'; // Default voice
    const modelId = request.modelId || request.model_id || 'eleven_multilingual_v2';
    const voiceSettings = request.voice_settings || {
      stability: 0.5,
      similarity_boost: 0.75,
    };

    // 1. Check Cache (Supabase Storage)
    const hash = crypto.createHash('md5').update(`${voiceId}-${request.text}-${JSON.stringify(voiceSettings)}`).digest('hex');
    const fileName = `tts/${hash}.mp3`;

    const { data: existingFile } = await this.supabase.storage
      .from('assets')
      .download(fileName);

    if (existingFile) {
      console.log(`🎤 TTS Cache Hit: ${fileName}`);
      return await existingFile.arrayBuffer();
    }

    // 2. Call ElevenLabs API
    console.log(`🎤 Generating TTS for: "${request.text.substring(0, 20)}..."`);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: modelId,
        voice_settings: voiceSettings
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API Error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();

    // 3. Save to Cache
    const { error: uploadError } = await this.supabase.storage
      .from('assets')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.warn('⚠️ Failed to cache TTS audio:', uploadError.message);
    }

    return audioBuffer;
  }

  async listVoices(): Promise<any[]> {
    if (!this.apiKey) return [];

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.voices;
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    const voices = await this.listVoices();
    return voices.map((v: { voice_id: string; name: string; category: string; description: string; labels: Record<string, string>; preview_url: string }) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
      description: v.description,
      labels: v.labels,
      preview_url: v.preview_url,
      settings: v.settings,
      language: v.labels?.language || 'unknown',
      gender: v.labels?.gender || 'unknown',
      accent: v.labels?.accent || 'unknown',
    }));
  }

  async getUserInfo(): Promise<UserInfo | null> {
    if (!this.apiKey) return null;

    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }
    return await response.json();
  }

  async cloneVoice(name: string, description: string, files: File[]): Promise<any> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API Key not configured');
    }

    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}

export const elevenLabsService = new ElevenLabsService();
export default ElevenLabsService;
