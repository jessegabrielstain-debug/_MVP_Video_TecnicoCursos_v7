/**
 * Enhanced TTS Service
 * Serviço de Text-to-Speech com múltiplos providers
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import util from 'util';
import { logger } from '@/lib/logger';

const execPromise = util.promisify(exec);

export interface TTSOptions {
  text: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  format?: 'mp3' | 'wav' | 'ogg';
}

export interface TTSResult {
  audioBuffer: Buffer;
  duration: number;
  format: string;
}

export class EnhancedTTSService {
  async synthesize(options: TTSOptions): Promise<TTSResult> {
    const { text, voice = 'pt-BR-AntonioNeural', speed = 1.0, format = 'mp3' } = options;
    
    logger.info(`[TTS] Synthesizing: "${text}" (voice: ${voice}, speed: ${speed})`, { component: 'EnhancedTtsService' });

    const tempDir = path.join(process.cwd(), 'tmp', 'tts');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `${uuidv4()}.${format}`;
    const filePath = path.join(tempDir, fileName);

    try {
      // Usar serviço unificado de TTS com fallbacks automáticos
      const { unifiedTTSService } = await import('./tts/unified-tts-service');
      
      const result = await unifiedTTSService.synthesize({
        text,
        voiceId: voice,
        format,
        speed,
        pitch,
        provider: 'auto' // Usa fallback automático: ElevenLabs → Azure → Google → Edge-TTS
      });

      logger.info(`✅ TTS gerado com sucesso usando ${result.provider}`, { 
        component: 'EnhancedTtsService',
        provider: result.provider,
        duration: result.duration 
      });

      return {
        audioBuffer: result.audioBuffer,
        duration: result.duration,
        format: result.format,
      };

    } catch (error) {
      logger.error('[TTS] Erro ao gerar TTS com todos os providers', error instanceof Error ? error : new Error(String(error)), { 
        component: 'EnhancedTtsService' 
      });
      
      // Em caso de falha total, lançar erro em vez de retornar mock
      throw new Error(`Falha ao gerar TTS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  async synthesizeBatch(items: TTSOptions[]): Promise<TTSResult[]> {
    return Promise.all(items.map(item => this.synthesize(item)));
  }
  
  listVoices(): string[] {
    return [
      'pt-BR-AntonioNeural', 
      'pt-BR-FranciscaNeural', 
      'en-US-ChristopherNeural', 
      'en-US-JennyNeural'
    ];
  }
}

export const ttsService = new EnhancedTTSService();
