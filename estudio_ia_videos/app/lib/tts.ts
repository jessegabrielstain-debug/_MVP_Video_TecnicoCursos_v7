/**
 * TTS Pipeline - Implementação Real
 * Usa serviço unificado com múltiplos providers e fallbacks automáticos
 */
import { unifiedTTSService } from './tts/unified-tts-service';
import { logger } from './logger';
import { getRedisClient } from './services/redis-service';

export interface TTSRequest {
  text: string;
  voice: string;
  language?: string;
  speed?: number; // 1.0 normal
  provider?: 'auto' | 'elevenlabs' | 'azure' | 'google' | 'edge';
}

export interface TTSResult {
  id: string;
  durationMs: number;
  audioUrl: string;
  transcript: string;
  metadata: Record<string, unknown>;
}

/**
 * Gera TTS usando o serviço unificado com fallbacks automáticos
 */
export async function generateTTS(req: TTSRequest): Promise<TTSResult> {
  logger.info('🎙️ Gerando TTS via pipeline unificado...', { 
    component: 'TTS Pipeline',
    textLength: req.text.length,
    voice: req.voice,
    provider: req.provider || 'auto'
  });

  try {
    // Gerar áudio usando serviço unificado
    const result = await unifiedTTSService.synthesize({
      text: req.text,
      voiceId: req.voice,
      language: req.language || 'pt-BR',
      speed: req.speed || 1.0,
      format: 'mp3',
      provider: req.provider || 'auto'
    });

    // Upload para storage (S3 ou Supabase Storage)
    // Por enquanto, retornamos como data URL
    const audioBase64 = result.audioBuffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    // Cachear URL no Redis para acesso rápido
    try {
      const redis = getRedisClient();
      const cacheKey = `tts:${req.text.substring(0, 50)}:${req.voice}`;
      await redis.setex(cacheKey, 3600, audioUrl); // Cache de 1 hora
    } catch (redisError) {
      // Redis não disponível, continuar sem cache
      logger.info('Redis não disponível para cache de TTS', { component: 'TTS Pipeline' });
    }

    const words = req.text.split(/\s+/).filter(Boolean);
    const durationMs = Math.round(result.duration * 1000);

    logger.info(`✅ TTS gerado com sucesso`, { 
      component: 'TTS Pipeline',
      provider: result.provider,
      duration: result.duration,
      fromCache: result.fromCache
    });

    return {
      id: `tts_${Date.now()}`,
      durationMs,
      audioUrl,
      transcript: req.text,
      metadata: {
        voice: req.voice,
        language: req.language || 'pt-BR',
        speed: req.speed || 1.0,
        words: words.length,
        provider: result.provider,
        fromCache: result.fromCache,
        format: result.format
      }
    };
  } catch (error) {
    logger.error('❌ Erro ao gerar TTS', error instanceof Error ? error : new Error(String(error)), { 
      component: 'TTS Pipeline' 
    });
    throw error;
  }
}
