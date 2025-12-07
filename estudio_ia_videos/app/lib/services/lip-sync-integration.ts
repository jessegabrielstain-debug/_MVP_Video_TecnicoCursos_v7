/**
 * Integração de Lip Sync com Avatar
 * 
 * @module lip-sync-integration
 * @description Sincroniza áudio TTS com avatares animados usando D-ID
 */

import { didService } from '@/lib/services/avatar/did-service';
import { generateTTSAudio } from '@/lib/services/tts/elevenlabs-service';
import { logger } from '@/lib/services/logger-service';
import { createClient } from '@supabase/supabase-js';
import { trackUsage } from '@/lib/analytics/usage-tracker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface LipSyncOptions {
  text: string;
  avatarImageUrl: string;
  voiceId?: string;
  modelId?: string;
  videoQuality?: 'low' | 'medium' | 'high';
  outputFileName?: string;
}

export interface LipSyncResult {
  videoUrl: string;
  audioUrl: string;
  duration: number;
  status: 'completed' | 'failed';
  talkId?: string;
}

/**
 * Gera vídeo de avatar com lip sync sincronizado ao áudio TTS
 * 
 * Fluxo:
 * 1. Gera áudio TTS com ElevenLabs
 * 2. Faz upload do áudio para Supabase Storage
 * 3. Cria talking head video com D-ID usando o áudio
 * 4. Aguarda processamento do D-ID
 * 5. Faz download e upload do vídeo final para Supabase
 */
export async function generateLipSyncVideo(options: LipSyncOptions): Promise<LipSyncResult> {
  if (!supabase) {
    throw new Error("Supabase não está configurado.");
  }

  try {
    logger.info('LipSyncIntegration', 'Iniciando geração de vídeo com lip sync.', { options });

    // 1. Gera áudio TTS
    logger.info('LipSyncIntegration', 'Gerando áudio TTS...');
    const audioBuffer = await generateTTSAudio(
      options.text, 
      options.voiceId,
      options.modelId
    );

    // 2. Upload do áudio para Storage
    const audioFileName = options.outputFileName 
      ? `${options.outputFileName}-audio.mp3` 
      : `lip-sync-${Date.now()}-audio.mp3`;
    
    const audioPath = `audio/lip-sync/${audioFileName}`;
    
    logger.info('LipSyncIntegration', 'Fazendo upload de áudio para Storage...', { audioPath });
    const { data: audioData, error: audioError } = await supabase.storage
      .from('assets')
      .upload(audioPath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (audioError) {
      logger.error('LipSyncIntegration', 'Falha ao fazer upload de áudio.', audioError as Error);
      throw audioError;
    }

    const { data: publicAudioData } = supabase.storage
      .from('assets')
      .getPublicUrl(audioPath);

    const audioUrl = publicAudioData.publicUrl;
    logger.info('LipSyncIntegration', 'Áudio enviado com sucesso.', { audioUrl });

    // 3. Cria talking head com D-ID
    logger.info('LipSyncIntegration', 'Criando talking head com D-ID...');
    
    // didService.createTalk já aguarda o processamento e retorna a URL do vídeo
    const dIdVideoUrl = await didService.createTalk({
      sourceUrl: options.avatarImageUrl,
      audioUrl: audioUrl,
      driver: 'bank://lively', // Driver de animação
      config: {
        stitch: true, // Combina múltiplos segmentos
        fluent: true, // Animação mais fluida
      }
    });

    logger.info('LipSyncIntegration', 'Vídeo processado com sucesso pelo D-ID.', { videoUrl: dIdVideoUrl });

    // 5. Download do vídeo do D-ID e upload para Supabase
    const videoResponse = await fetch(dIdVideoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Falha ao baixar vídeo do D-ID: ${videoResponse.status}`);
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    
    const videoFileName = options.outputFileName 
      ? `${options.outputFileName}.mp4` 
      : `lip-sync-${Date.now()}.mp4`;
    
    const videoPath = `videos/lip-sync/${videoFileName}`;
    
    logger.info('LipSyncIntegration', 'Fazendo upload de vídeo para Storage...', { videoPath });
    const { data: videoData, error: videoError } = await supabase.storage
      .from('videos')
      .upload(videoPath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (videoError) {
      logger.error('LipSyncIntegration', 'Falha ao fazer upload de vídeo.', videoError as Error);
      throw videoError;
    }

    const { data: publicVideoData } = supabase.storage
      .from('videos')
      .getPublicUrl(videoPath);

    const finalVideoUrl = publicVideoData.publicUrl;
    logger.info('LipSyncIntegration', 'Vídeo com lip sync finalizado.', { finalVideoUrl });

    // Track usage
    await trackUsage('lip_sync_generated', null, {
      provider: 'd-id',
      // resourceId não disponível facilmente aqui pois createTalk retorna string
      details: {
        // duration não disponível facilmente aqui
        videoUrl: finalVideoUrl,
        audioUrl: audioUrl
      }
    });

    return {
      videoUrl: finalVideoUrl,
      audioUrl: audioUrl,
      duration: 0, // Duration perdida na abstração atual
      status: 'completed',
      talkId: 'unknown' // ID perdido na abstração atual
    };

  } catch (error) {
    logger.error('LipSyncIntegration', 'Falha ao gerar vídeo com lip sync.', error as Error, { options });
    
    return {
      videoUrl: '',
      audioUrl: '',
      duration: 0,
      status: 'failed'
    };
  }
}

/**
 * Gera múltiplos vídeos de lip sync em lote (um por slide)
 */
export async function generateBatchLipSyncVideos(
  slides: Array<{ text: string; avatarImageUrl: string; id: string }>
): Promise<LipSyncResult[]> {
  logger.info('LipSyncIntegration', 'Iniciando geração em lote de vídeos com lip sync.', { slideCount: slides.length });

  const results: LipSyncResult[] = [];

  for (const slide of slides) {
    try {
      const result = await generateLipSyncVideo({
        text: slide.text,
        avatarImageUrl: slide.avatarImageUrl,
        outputFileName: `slide-${slide.id}`
      });
      results.push(result);
    } catch (error) {
      logger.error('LipSyncIntegration', 'Falha ao gerar lip sync para slide.', error as Error, { slideId: slide.id });
      results.push({
        videoUrl: '',
        audioUrl: '',
        duration: 0,
        status: 'failed'
      });
    }
  }

  const successCount = results.filter(r => r.status === 'completed').length;
  logger.info('LipSyncIntegration', 'Geração em lote concluída.', { total: slides.length, success: successCount });

  return results;
}

/**
 * Valida se os recursos necessários estão disponíveis
 */
export async function validateLipSyncResources(): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (!supabase) {
    errors.push("Supabase não está configurado.");
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    errors.push("ElevenLabs API key não está configurada.");
  }

  if (!process.env.DID_API_KEY) {
    errors.push("D-ID API key não está configurada.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
