import { ElevenLabsClient } from "elevenlabs";
import { logger } from '@/lib/logger';
import { createClient } from "@supabase/supabase-js";
import { trackUsage } from '@/lib/analytics/usage-tracker';
import { withCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { withRetry } from '@/lib/error-handling';

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!elevenLabsApiKey) {
  logger.warn("A chave da API da ElevenLabs (ELEVENLABS_API_KEY) não está configurada. O serviço de TTS não funcionará.", { component: 'ElevenlabsService' });
}

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn("Credenciais do Supabase não configuradas. Upload de áudio não funcionará.", { component: 'ElevenlabsService' });
}

const elevenlabs = new ElevenLabsClient({
  apiKey: elevenLabsApiKey,
});

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  description?: string;
  preview_url?: string;
  settings?: unknown;
}

interface ElevenLabsGenerateOptions {
  voice: string;
  model_id: string;
  text: string;
}

interface ElevenLabsClientWithGenerate {
  generate(options: ElevenLabsGenerateOptions): Promise<NodeJS.ReadableStream>;
}

/**
 * Gera áudio a partir de um texto usando a API da ElevenLabs.
 *
 * @param text O texto a ser convertido em áudio.
 * @param voiceId O ID da voz a ser usada. Padrão: '21m00Tcm4TlvDq8ikWAM' (Rachel).
 * @param modelId O ID do modelo a ser usado.
 * @returns Um Buffer com os dados do áudio em MP3.
 * @throws Lança um erro se a geração de áudio falhar.
 */
export async function generateTTSAudio(
  text: string,
  voiceId: string = '21m00Tcm4TlvDq8ikWAM',
  modelId: string = 'eleven_multilingual_v2'
): Promise<Buffer> {
  if (!elevenLabsApiKey) {
    throw new Error("A API da ElevenLabs não está configurada.");
  }

  return withCircuitBreaker(
    'elevenlabs-generate',
    async () => {
      logger.info("Iniciando geração de áudio TTS com ElevenLabs.", { component: 'ElevenlabsService', voiceId, modelId, textLength: text.length });

      // Retry logic with exponential backoff
      let attempts = 0;
      const maxAttempts = 3;
      let audioStream: NodeJS.ReadableStream | null = null;

      while (attempts < maxAttempts) {
        try {
          audioStream = await (elevenlabs as unknown as ElevenLabsClientWithGenerate).generate({
            voice: voiceId,
            model_id: modelId,
            text,
          });
          break; // Success
        } catch (err) {
          attempts++;
          logger.warn(`Tentativa ${attempts} falhou.`, { component: 'ElevenlabsService', error: err });
          if (attempts >= maxAttempts) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts))); // 2s, 4s, 8s
        }
      }

      if (!audioStream) throw new Error("Falha ao obter stream de áudio após tentativas.");

      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk as Buffer);
      }

      const audioBuffer = Buffer.concat(chunks);
      logger.info("Áudio TTS gerado com sucesso.", { component: 'ElevenlabsService', audioSize: audioBuffer.length });

      // Track usage
      await trackUsage('tts_generated', null, {
        provider: 'elevenlabs',
        details: {
          textLength: text.length,
          voiceId,
          modelId
        }
      });

      return audioBuffer;
    },
    {
      failureThreshold: 5,
      timeout: 60000,
      name: 'elevenlabs-generate',
    },
    () => {
      throw new Error("Serviço ElevenLabs temporariamente indisponível. Tente novamente em alguns instantes.");
    }
  ).catch((error) => {
    logger.error("Falha ao gerar áudio TTS com ElevenLabs.", error as Error, { component: 'ElevenLabsService' });
    throw error;
  });
}

/**
 * Gera áudio TTS e faz upload para o Supabase Storage.
 *
 * @param text O texto a ser convertido em áudio.
 * @param fileName Nome do arquivo a ser salvo (ex: 'slide-1-audio.mp3').
 * @param voiceId O ID da voz a ser usada.
 * @param modelId O ID do modelo a ser usado.
 * @returns URL pública do áudio no Storage.
 */
export async function generateAndUploadTTSAudio(
  text: string,
  fileName: string,
  voiceId?: string,
  modelId?: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase não está configurado.");
  }

  try {
    // Gera o áudio
    const audioBuffer = await generateTTSAudio(text, voiceId, modelId);

    // Upload para o bucket 'assets' com retry
    const filePath = `audio/tts/${fileName}`;
    
    const uploadResult = await withRetry(
      async () => {
        const result = await supabase.storage
          .from('assets')
          .upload(filePath, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true,
          });
        
        if (result.error) throw result.error;
        return result;
      },
      {
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        shouldRetry: (error) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return (
            errorMessage.includes('network') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('ECONNRESET')
          );
        },
      }
    ).catch((error) => {
      logger.error("Falha ao fazer upload de áudio para o Storage após retries.", error as Error, { component: 'ElevenLabsService' });
      throw error;
    });

    if (uploadResult.error) {
      logger.error("Falha ao fazer upload de áudio para o Storage.", uploadResult.error as Error, { component: 'ElevenLabsService' });
      throw uploadResult.error;
    }

    // Obtém URL pública
    const { data: publicUrlData } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    logger.info("Áudio TTS enviado com sucesso para o Storage.", { component: 'ElevenLabsService', publicUrl: publicUrlData.publicUrl });
    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error("Falha ao gerar e enviar áudio TTS.", error as Error, { component: 'ElevenLabsService' });
    throw error;
  }
}

/**
 * Clona uma voz a partir de amostras de áudio.
 *
 * @param name Nome da voz clonada.
 * @param audioFiles Array de Buffers ou arquivos de áudio (MP3/WAV).
 * @param description Descrição opcional da voz.
 * @returns ID da voz clonada.
 */
export async function cloneVoice(
  name: string,
  audioFiles: Buffer[],
  description?: string
): Promise<string> {
  if (!elevenLabsApiKey) {
    throw new Error("A API da ElevenLabs não está configurada.");
  }

  try {
    logger.info("Iniciando clonagem de voz.", { component: 'ElevenLabsService', name, filesCount: audioFiles.length });

    // A API da ElevenLabs requer FormData para upload
    const formData = new FormData();
    formData.append('name', name);
    if (description) {
      formData.append('description', description);
    }

    // Adiciona os arquivos de áudio
    audioFiles.forEach((buffer, index) => {
      const uint8Array = new Uint8Array(buffer);
      const blob = new Blob([uint8Array], { type: 'audio/mpeg' });
      formData.append('files', blob, `sample-${index}.mp3`);
    });

    // Faz a requisição direta à API (SDK pode não suportar todos os endpoints)
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Falha ao clonar voz.", new Error(errorText), { component: 'ElevenLabsService', status: response.status });
      throw new Error(`Falha ao clonar voz: ${response.status}`);
    }

    const result = await response.json();
    logger.info("Voz clonada com sucesso.", { component: 'ElevenLabsService', voiceId: result.voice_id });

    return result.voice_id;
  } catch (error) {
    logger.error("Falha ao clonar voz.", error as Error, { component: 'ElevenLabsService' });
    throw error;
  }
}

/**
 * Lista todas as vozes disponíveis (incluindo clonadas).
 *
 * @returns Array com informações das vozes.
 */
export async function listVoices(): Promise<ElevenLabsVoice[]> {
  if (!elevenLabsApiKey) {
    throw new Error("A API da ElevenLabs não está configurada.");
  }

  return withCircuitBreaker(
    'elevenlabs-list-voices',
    async () => {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': elevenLabsApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Falha ao listar vozes: ${response.status}`);
      }

      const result = await response.json();
      return result.voices as ElevenLabsVoice[];
    },
    {
      failureThreshold: 3,
      timeout: 30000,
      name: 'elevenlabs-list-voices',
    },
    () => {
      // Fallback: retorna array vazio se circuit breaker estiver aberto
      logger.warn("Circuit breaker aberto para listVoices, retornando array vazio", { component: 'ElevenLabsService' });
      return [];
    }
  ).catch((error) => {
    logger.error("Falha ao listar vozes.", error as Error, { component: 'ElevenLabsService' });
    throw error;
  });
}

/**
 * Deleta uma voz clonada.
 *
 * @param voiceId ID da voz a ser deletada.
 */
export async function deleteVoice(voiceId: string): Promise<void> {
  if (!elevenLabsApiKey) {
    throw new Error("A API da ElevenLabs não está configurada.");
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao deletar voz: ${response.status}`);
    }

    logger.info("Voz deletada com sucesso.", { component: 'ElevenLabsService', voiceId });
  } catch (error) {
    logger.error("Falha ao deletar voz.", error as Error, { component: 'ElevenLabsService', voiceId });
    throw error;
  }
}
