
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import util from 'util';
import { logger } from '@/lib/logger';

const execPromise = util.promisify(exec);

interface SynthesizeOptions {
  text: string;
  voiceId?: string;
  format?: 'mp3' | 'wav';
}

interface SynthesizeResult {
  fileUrl: string;
  duration: number;
  filePath: string;
}

// Ensure audio directory exists
const AUDIO_DIR = path.join(process.cwd(), 'public', 'tts-audio');
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

export async function synthesizeToFile(options: SynthesizeOptions): Promise<SynthesizeResult> {
  logger.info(`Synthesizing text: "${options.text}"`, { component: 'TtsServiceReal' });
  
  const fileName = `${uuidv4()}.mp3`;
  const filePath = path.join(AUDIO_DIR, fileName);
  const publicUrl = `/tts-audio/${fileName}`;

  try {
      // Usar serviço unificado de TTS com fallbacks automáticos
      const { unifiedTTSService } = await import('./tts/unified-tts-service');
      
      const result = await unifiedTTSService.synthesize({
        text: options.text,
        voiceId: options.voiceId,
        format: options.format || 'mp3',
        provider: 'auto' // Usa fallback automático
      });

      // Salvar arquivo no diretório público
      fs.writeFileSync(filePath, result.audioBuffer);
      
      logger.info(`✅ TTS gerado com sucesso usando ${result.provider}`, { 
        component: 'TtsServiceReal',
        provider: result.provider,
        duration: result.duration 
      });

      return {
        fileUrl: publicUrl,
        duration: result.duration,
        filePath: filePath
      };

  } catch (error) {
      logger.error('❌ Falha ao gerar TTS com todos os providers', error instanceof Error ? error : new Error(String(error)), { 
        component: 'TtsServiceReal' 
      });
      
      // Em caso de falha total, lançar erro em vez de retornar mock
      throw new Error(`Falha ao gerar TTS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function listVoices() {
  return [
    { id: 'pt-BR-AntonioNeural', name: 'Antonio (Neural)', gender: 'male', language: 'pt-BR' },
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Neural)', gender: 'female', language: 'pt-BR' },
    { id: 'en-US-ChristopherNeural', name: 'Christopher (Neural)', gender: 'male', language: 'en-US' },
    { id: 'en-US-JennyNeural', name: 'Jenny (Neural)', gender: 'female', language: 'en-US' },
  ];
}
