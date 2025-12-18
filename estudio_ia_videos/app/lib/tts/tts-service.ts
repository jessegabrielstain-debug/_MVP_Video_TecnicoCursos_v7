/**
 * TTS Service - Text-to-Speech with fallback
 * Implementação funcional com validação e fallback
 */

import { randomUUID } from 'crypto';

export type TTSAudioFormat = 'mp3' | 'wav' | 'ogg';

export interface TTSOptions {
  text: string;
  voiceId?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  language?: string;
  emotion?: 'neutral' | 'energetic' | 'calm' | 'happy' | 'sad';
  format?: TTSAudioFormat;
  metadata?: Record<string, unknown>;
}

export interface TTSResult {
  fileUrl: string;
  duration: number;
  voiceId: string;
  format?: string;
}

export const synthesizeToFile = async (options: TTSOptions): Promise<TTSResult> => {
  if (!options.text || typeof options.text !== 'string' || options.text.trim().length === 0) {
    throw new Error('Text is required and must be a string');
  }

  // Usar serviço unificado de TTS com fallbacks automáticos
  const { unifiedTTSService } = await import('../tts/unified-tts-service');
  const { createClient } = await import('@supabase/supabase-js');
  
  const result = await unifiedTTSService.synthesize({
    text: options.text,
    voiceId: options.voiceId,
    format: options.format || 'mp3',
    provider: 'auto' // Usa fallback automático
  });

  // Upload para Supabase Storage ou retornar como data URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let fileUrl: string;
  
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const fileName = `${randomUUID()}.${result.format}`;
      const filePath = `tts/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, result.audioBuffer, {
          contentType: `audio/${result.format}`,
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);
      
      fileUrl = publicUrlData.publicUrl;
    } catch (storageError) {
      // Fallback para data URL se storage falhar
      const audioBase64 = result.audioBuffer.toString('base64');
      fileUrl = `data:audio/${result.format};base64,${audioBase64}`;
    }
  } else {
    // Usar data URL se Supabase não estiver configurado
    const audioBase64 = result.audioBuffer.toString('base64');
    fileUrl = `data:audio/${result.format};base64,${audioBase64}`;
  }

  return {
    fileUrl,
    duration: Math.round(result.duration),
    voiceId: options.voiceId || 'default',
    format: result.format,
  };
};

export const listVoices = async (): Promise<Array<{ id: string; name: string; language: string }>> => {
  // Retorna lista de vozes disponíveis
  return [
    { id: 'pt-BR-Neural2-A', name: 'Brazilian Portuguese Female', language: 'pt-BR' },
    { id: 'pt-BR-Neural2-B', name: 'Brazilian Portuguese Male', language: 'pt-BR' },
    { id: 'en-US-Neural2-A', name: 'US English Female', language: 'en-US' },
    { id: 'en-US-Neural2-C', name: 'US English Male', language: 'en-US' },
  ];
};

export const TTSService = {
  synthesize: synthesizeToFile,
  listVoices,
};
