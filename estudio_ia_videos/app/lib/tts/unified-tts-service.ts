/**
 * Unified TTS Service
 * Serviço unificado de Text-to-Speech com múltiplos providers e fallbacks automáticos
 * 
 * Estratégia de Fallback:
 * 1. ElevenLabs (primary) - Melhor qualidade
 * 2. Azure Speech (fallback 1) - Alta qualidade, boa cobertura
 * 3. Google Cloud TTS (fallback 2) - Boa qualidade, ampla cobertura
 * 4. Edge-TTS (fallback final) - Gratuito, sem API key
 */

import { logger } from '@/lib/logger';
import { generateTTSAudio as generateElevenLabsAudio } from '@/lib/services/tts/elevenlabs-service';
import { AzureTTSProvider } from '@/lib/tts/providers/azure';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec);

export interface UnifiedTTSOptions {
  text: string;
  voiceId?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  format?: 'mp3' | 'wav' | 'ogg';
  provider?: 'auto' | 'elevenlabs' | 'azure' | 'google' | 'edge';
}

export interface UnifiedTTSResult {
  audioBuffer: Buffer;
  duration: number;
  format: string;
  provider: string;
  fromCache: boolean;
}

// Cache em memória para evitar regerações
const audioCache = new Map<string, UnifiedTTSResult>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias

// Instância singleton do Azure TTS Provider
let azureProvider: AzureTTSProvider | null = null;

function getAzureProvider(): AzureTTSProvider | null {
  if (azureProvider) return azureProvider;
  
  const subscriptionKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  
  if (!subscriptionKey || !region) {
    logger.warn('Azure Speech credentials não configuradas', { component: 'UnifiedTTSService' });
    return null;
  }
  
  azureProvider = new AzureTTSProvider({ subscriptionKey, region });
  return azureProvider;
}

/**
 * Gera áudio usando ElevenLabs
 */
async function generateWithElevenLabs(options: UnifiedTTSOptions): Promise<UnifiedTTSResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key não configurada');
  }

  logger.info('🎙️ Gerando TTS com ElevenLabs...', { 
    component: 'UnifiedTTSService',
    textLength: options.text.length,
    voiceId: options.voiceId 
  });

  const voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel (padrão)
  const modelId = 'eleven_multilingual_v2';

  const audioBuffer = await generateElevenLabsAudio(options.text, voiceId, modelId);
  
  // Estimar duração (aproximadamente 150 palavras por minuto)
  const wordCount = options.text.split(/\s+/).length;
  const estimatedDuration = Math.max(1, (wordCount / 150) * 60);

  return {
    audioBuffer,
    duration: estimatedDuration,
    format: options.format || 'mp3',
    provider: 'elevenlabs',
    fromCache: false
  };
}

/**
 * Gera áudio usando Azure Speech Services
 */
async function generateWithAzure(options: UnifiedTTSOptions): Promise<UnifiedTTSResult> {
  const provider = getAzureProvider();
  
  if (!provider) {
    throw new Error('Azure Speech provider não configurado');
  }

  logger.info('🎙️ Gerando TTS com Azure Speech...', { 
    component: 'UnifiedTTSService',
    textLength: options.text.length,
    voiceId: options.voiceId 
  });

  const voiceId = options.voiceId || 'pt-BR-FranciscaNeural';
  
  try {
    const audioBuffer = await provider.textToSpeech(options.text, voiceId, {
      speed: options.speed,
      pitch: options.pitch
    });
    
    // Estimar duração
    const wordCount = options.text.split(/\s+/).length;
    const speed = options.speed || 1.0;
    const estimatedDuration = Math.max(1, (wordCount / (150 * speed)) * 60);

    return {
      audioBuffer,
      duration: estimatedDuration,
      format: options.format || 'mp3',
      provider: 'azure',
      fromCache: false
    };
  } catch (error) {
    logger.error('Erro ao gerar TTS com Azure', error instanceof Error ? error : new Error(String(error)), { 
      component: 'UnifiedTTSService' 
    });
    throw error;
  }
}

/**
 * Gera áudio usando Google Cloud TTS
 */
async function generateWithGoogle(options: UnifiedTTSOptions): Promise<UnifiedTTSResult> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google TTS API key não configurada');
  }

  logger.info('🎙️ Gerando TTS com Google Cloud TTS...', { 
    component: 'UnifiedTTSService',
    textLength: options.text.length,
    voiceId: options.voiceId 
  });

  const language = options.language || 'pt-BR';
  const voiceName = options.voiceId || 'pt-BR-Standard-A';
  const audioEncoding = options.format === 'wav' ? 'LINEAR16' : 'MP3';

  const payload = {
    input: { text: options.text },
    voice: {
      languageCode: language,
      name: voiceName,
      ssmlGender: 'FEMALE' as const
    },
    audioConfig: {
      audioEncoding,
      speakingRate: options.speed || 1.0,
      pitch: options.pitch || 0.0
    }
  };

  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google TTS API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const audioBuffer = Buffer.from(result.audioContent, 'base64');
    
    // Estimar duração
    const wordCount = options.text.split(/\s+/).length;
    const speed = options.speed || 1.0;
    const estimatedDuration = Math.max(1, (wordCount / (150 * speed)) * 60);

    return {
      audioBuffer,
      duration: estimatedDuration,
      format: options.format || 'mp3',
      provider: 'google',
      fromCache: false
    };
  } catch (error) {
    logger.error('Erro ao gerar TTS com Google', error instanceof Error ? error : new Error(String(error)), { 
      component: 'UnifiedTTSService' 
    });
    throw error;
  }
}

/**
 * Gera áudio usando Edge-TTS (gratuito, sem API key)
 */
async function generateWithEdgeTTS(options: UnifiedTTSOptions): Promise<UnifiedTTSResult> {
  logger.info('🎙️ Gerando TTS com Edge-TTS (fallback gratuito)...', { 
    component: 'UnifiedTTSService',
    textLength: options.text.length 
  });

  const tempDir = path.join(process.cwd(), 'tmp', 'tts');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const fileName = `${uuidv4()}.${options.format || 'mp3'}`;
  const filePath = path.join(tempDir, fileName);

  const voice = options.voiceId || 'pt-BR-AntonioNeural';
  const escapedText = options.text.replace(/"/g, '\\"');
  
  let rateArg = '';
  if (options.speed && options.speed !== 1.0) {
    const ratePercent = Math.round((options.speed - 1.0) * 100);
    const sign = ratePercent >= 0 ? '+' : '';
    rateArg = `--rate="${sign}${ratePercent}%"`;
  }

  const command = `edge-tts --text "${escapedText}" --write-media "${filePath}" --voice ${voice} ${rateArg}`;

  try {
    await execPromise(command);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Edge-TTS não gerou arquivo de saída');
    }

    const audioBuffer = fs.readFileSync(filePath);
    
    // Limpar arquivo temporário
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // Ignorar erro de limpeza
    }

    // Estimar duração
    const wordCount = options.text.split(/\s+/).length;
    const speed = options.speed || 1.0;
    const estimatedDuration = Math.max(1, (wordCount / (2.5 * speed)));

    return {
      audioBuffer,
      duration: estimatedDuration,
      format: options.format || 'mp3',
      provider: 'edge',
      fromCache: false
    };
  } catch (error) {
    logger.error('Erro ao gerar TTS com Edge-TTS', error instanceof Error ? error : new Error(String(error)), { 
      component: 'UnifiedTTSService' 
    });
    throw error;
  }
}

/**
 * Gera chave de cache baseada nas opções
 */
function getCacheKey(options: UnifiedTTSOptions): string {
  return `${options.provider || 'auto'}:${options.voiceId || 'default'}:${options.language || 'pt-BR'}:${options.speed || 1.0}:${options.text}`;
}

/**
 * Serviço unificado de TTS com fallbacks automáticos
 */
export class UnifiedTTSService {
  /**
   * Gera áudio TTS usando o provider especificado ou fallback automático
   */
  async synthesize(options: UnifiedTTSOptions): Promise<UnifiedTTSResult> {
    // Verificar cache primeiro
    const cacheKey = getCacheKey(options);
    const cached = audioCache.get(cacheKey);
    
    if (cached) {
      logger.info('✅ TTS retornado do cache', { 
        component: 'UnifiedTTSService',
        provider: cached.provider 
      });
      return { ...cached, fromCache: true };
    }

    const provider = options.provider || 'auto';
    const providers: Array<'elevenlabs' | 'azure' | 'google' | 'edge'> = 
      provider === 'auto' 
        ? ['elevenlabs', 'azure', 'google', 'edge']
        : [provider as 'elevenlabs' | 'azure' | 'google' | 'edge'];

    let lastError: Error | null = null;

    for (const currentProvider of providers) {
      try {
        let result: UnifiedTTSResult;

        switch (currentProvider) {
          case 'elevenlabs':
            result = await generateWithElevenLabs(options);
            break;
          case 'azure':
            result = await generateWithAzure(options);
            break;
          case 'google':
            result = await generateWithGoogle(options);
            break;
          case 'edge':
            result = await generateWithEdgeTTS(options);
            break;
          default:
            throw new Error(`Provider desconhecido: ${currentProvider}`);
        }

        // Armazenar no cache
        audioCache.set(cacheKey, result);

        logger.info(`✅ TTS gerado com sucesso usando ${result.provider}`, { 
          component: 'UnifiedTTSService',
          provider: result.provider,
          duration: result.duration 
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`⚠️ Falha ao gerar TTS com ${currentProvider}, tentando próximo provider...`, { 
          component: 'UnifiedTTSService',
          provider: currentProvider,
          error: lastError.message 
        });

        // Se não é o último provider, continuar para o próximo
        if (currentProvider !== providers[providers.length - 1]) {
          continue;
        }
      }
    }

    // Se chegou aqui, todos os providers falharam
    logger.error('❌ Todos os providers TTS falharam', lastError!, { 
      component: 'UnifiedTTSService' 
    });
    throw new Error(`Falha ao gerar TTS: todos os providers falharam. Último erro: ${lastError?.message}`);
  }

  /**
   * Limpa o cache de áudio
   */
  clearCache(): void {
    audioCache.clear();
    logger.info('🗑️ Cache de TTS limpo', { component: 'UnifiedTTSService' });
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: audioCache.size,
      maxSize: 1000 // Limite máximo de itens no cache
    };
  }
}

// Exportar instância singleton
export const unifiedTTSService = new UnifiedTTSService();
