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
      // Use edge-tts (free, no key required) via CLI
      // Command: edge-tts --text "Hello" --write-media hello.mp3 --voice pt-BR-AntonioNeural
      
      // Note: edge-tts doesn't support speed/pitch directly in CLI flags easily without SSML, 
      // but for MVP we stick to basic text.
      // If speed is needed, we might need to use --rate="+10%" etc.
      
      let rateArg = '';
      if (speed !== 1.0) {
        const ratePercent = Math.round((speed - 1.0) * 100);
        const sign = ratePercent >= 0 ? '+' : '';
        rateArg = `--rate="${sign}${ratePercent}%"`;
      }

      const command = `edge-tts --text "${text.replace(/"/g, '\\"')}" --write-media "${filePath}" --voice ${voice} ${rateArg}`;
      
      logger.info(`[TTS] Executing: ${command}`, { component: 'EnhancedTtsService' });
      await execPromise(command);

      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        
        // Estimate duration
        const wordCount = text.split(' ').length;
        const estimatedDuration = Math.max(1, wordCount / (2.5 * speed));

        // Cleanup
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

        return {
          audioBuffer: buffer,
          duration: estimatedDuration,
          format,
        };
      } else {
        throw new Error('TTS output file not found');
      }

    } catch (error) {
      logger.error('[TTS] Error using edge-tts:', error instanceof Error ? error : new Error(String(error)), { component: 'EnhancedTtsService' });
      logger.warn('[TTS] Falling back to mock buffer due to error.', { component: 'EnhancedTtsService' });
      
      // Fallback to mock if edge-tts fails (e.g. not installed)
      return {
        audioBuffer: Buffer.from('mock-audio-data'),
        duration: text.length / 10,
        format,
      };
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
