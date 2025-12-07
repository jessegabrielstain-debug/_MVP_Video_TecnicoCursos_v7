/**
 * ElevenLabs TTS Provider
 * 
 * Implementation of Text-to-Speech using ElevenLabs API
 */

export interface ElevenLabsConfig {
  apiKey: string;
  modelId?: string;
  baseUrl?: string;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface TTSResult {
  audio: Buffer;
  characters: number;
  format: string;
}

export interface Voice {
  voiceId: string;
  name: string;
  description?: string;
  previewUrl?: string;
  category?: string;
}

export interface SubscriptionInfo {
  used: number;
  limit: number;
  remaining: number;
}

export interface LongTTSResult {
  audioChunks: Buffer[];
  totalCharacters: number;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description?: string;
  preview_url?: string;
  category?: string;
  [key: string]: unknown;
}

export class ElevenLabsProvider {
  private apiKey: string;
  private modelId: string;
  private baseUrl: string;

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
    this.modelId = config.modelId || 'eleven_multilingual_v2';
    this.baseUrl = config.baseUrl || 'https://api.elevenlabs.io/v1';
  }

  async textToSpeech(request: TTSRequest): Promise<TTSResult> {
    const url = `${this.baseUrl}/text-to-speech/${request.voiceId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: request.modelId || this.modelId,
        voice_settings: {
          stability: request.stability ?? 0.5,
          similarity_boost: request.similarityBoost ?? 0.75,
          style: request.style ?? 0,
          use_speaker_boost: request.useSpeakerBoost ?? true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`ElevenLabs API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      audio: buffer,
      characters: request.text.length,
      format: 'mp3',
    };
  }

  async getVoices(): Promise<Voice[]> {
    const url = `${this.baseUrl}/voices`;
    
    const response = await fetch(url, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    
    return data.voices.map((v: ElevenLabsVoice) => ({
      voiceId: v.voice_id,
      name: v.name,
      description: v.description,
      previewUrl: v.preview_url,
      category: v.category,
    }));
  }

  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    const url = `${this.baseUrl}/user/subscription`;
    
    const response = await fetch(url, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription info: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      used: data.character_count,
      limit: data.character_limit,
      remaining: data.character_limit - data.character_count,
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/user`;
      const response = await fetch(url, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async textToSpeechLong(request: TTSRequest, chunkSize: number = 5000): Promise<LongTTSResult> {
    const chunks = this.splitTextIntoChunks(request.text, chunkSize);
    const audioChunks: Buffer[] = [];
    let totalCharacters = 0;

    for (const chunk of chunks) {
      const result = await this.textToSpeech({
        ...request,
        text: chunk,
      });
      audioChunks.push(result.audio);
      totalCharacters += result.characters;
    }

    return {
      audioChunks,
      totalCharacters,
    };
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let currentChunk = '';
    
    // Split by sentences first
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        
        // If sentence itself is too long, split by comma or space
        if (sentence.length > maxLength) {
          let remaining = sentence;
          while (remaining.length > 0) {
            let splitIndex = remaining.lastIndexOf(' ', maxLength);
            if (splitIndex === -1) splitIndex = maxLength; // Force split if no space
            
            chunks.push(remaining.substring(0, splitIndex).trim());
            remaining = remaining.substring(splitIndex).trim();
          }
          currentChunk = '';
        } else {
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());

    return chunks;
  }
}
