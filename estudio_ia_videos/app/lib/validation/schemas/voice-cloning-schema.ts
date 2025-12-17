/**
 * Voice Cloning Validation Schemas
 * 
 * Schemas para validação de operações de clonagem de voz
 * 
 * @module lib/validation/schemas/voice-cloning-schema
 */

import { z } from 'zod';

// =====================================
// Voice Provider Schema
// =====================================

export const VoiceProviderSchema = z.enum(['elevenlabs', 'azure', 'playht', 'custom']);

export type VoiceProvider = z.infer<typeof VoiceProviderSchema>;

// =====================================
// Voice Cloning Request Schemas
// =====================================

/**
 * Voice sample file constraints
 */
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'audio/x-m4a',
] as const;

const MAX_SAMPLE_SIZE_MB = 10;
const MIN_SAMPLE_DURATION_SECONDS = 30;
const MAX_SAMPLE_DURATION_SECONDS = 600; // 10 minutes

/**
 * Voice clone creation request
 */
export const VoiceCloneCreateSchema = z.object({
  name: z.string()
    .min(1, 'Nome da voz é obrigatório')
    .max(100, 'Nome muito longo (máx 100 caracteres)')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nome só pode conter letras, números, espaços, hífens e underscores'),
  
  description: z.string()
    .max(500, 'Descrição muito longa (máx 500 caracteres)')
    .optional(),
  
  provider: VoiceProviderSchema.default('elevenlabs'),
  
  // Sample files info (actual files handled separately via FormData)
  samples: z.array(z.object({
    filename: z.string(),
    mimeType: z.enum(ALLOWED_AUDIO_TYPES as unknown as [string, ...string[]]),
    sizeBytes: z.number().max(MAX_SAMPLE_SIZE_MB * 1024 * 1024, `Arquivo muito grande (máx ${MAX_SAMPLE_SIZE_MB}MB)`),
    durationSeconds: z.number()
      .min(MIN_SAMPLE_DURATION_SECONDS, `Amostra muito curta (mín ${MIN_SAMPLE_DURATION_SECONDS}s)`)
      .max(MAX_SAMPLE_DURATION_SECONDS, `Amostra muito longa (máx ${MAX_SAMPLE_DURATION_SECONDS / 60}min)`),
  })).min(1, 'Pelo menos uma amostra de áudio é necessária')
    .max(25, 'Máximo de 25 amostras permitidas')
    .optional(),
  
  // Voice characteristics (ElevenLabs specific)
  settings: z.object({
    stability: z.number().min(0).max(1).default(0.5),
    similarity_boost: z.number().min(0).max(1).default(0.75),
    style: z.number().min(0).max(1).default(0),
    use_speaker_boost: z.boolean().default(true),
  }).optional(),
  
  // Labeling
  labels: z.record(z.string()).optional(),
  
  // Project association
  projectId: z.string().uuid().optional(),
});

export type VoiceCloneCreate = z.infer<typeof VoiceCloneCreateSchema>;

/**
 * Voice clone update request
 */
export const VoiceCloneUpdateSchema = z.object({
  voiceId: z.string().min(1, 'Voice ID é obrigatório'),
  name: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\-_]+$/)
    .optional(),
  description: z.string().max(500).optional(),
  settings: z.object({
    stability: z.number().min(0).max(1).optional(),
    similarity_boost: z.number().min(0).max(1).optional(),
    style: z.number().min(0).max(1).optional(),
    use_speaker_boost: z.boolean().optional(),
  }).optional(),
  labels: z.record(z.string()).optional(),
});

export type VoiceCloneUpdate = z.infer<typeof VoiceCloneUpdateSchema>;

// =====================================
// Voice Generation Schemas
// =====================================

/**
 * Voice generation request (TTS with cloned voice)
 */
export const VoiceGenerateSchema = z.object({
  voiceId: z.string().min(1, 'Voice ID é obrigatório'),
  
  text: z.string()
    .min(1, 'Texto é obrigatório')
    .max(5000, 'Texto muito longo (máx 5000 caracteres)'),
  
  provider: VoiceProviderSchema.default('elevenlabs'),
  
  // Model selection
  model: z.enum([
    'eleven_multilingual_v2',
    'eleven_monolingual_v1',
    'eleven_turbo_v2',
  ]).default('eleven_multilingual_v2'),
  
  // Voice settings override
  settings: z.object({
    stability: z.number().min(0).max(1).optional(),
    similarity_boost: z.number().min(0).max(1).optional(),
    style: z.number().min(0).max(1).optional(),
    use_speaker_boost: z.boolean().optional(),
  }).optional(),
  
  // Output format
  outputFormat: z.enum([
    'mp3_22050_32',
    'mp3_44100_64',
    'mp3_44100_96',
    'mp3_44100_128',
    'mp3_44100_192',
    'pcm_16000',
    'pcm_22050',
    'pcm_24000',
    'pcm_44100',
    'ulaw_8000',
  ]).default('mp3_44100_128'),
  
  // Project association
  slideId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  
  // Webhook callback
  webhook: z.string().url().optional(),
});

export type VoiceGenerate = z.infer<typeof VoiceGenerateSchema>;

// =====================================
// Voice Listing & Query Schemas
// =====================================

export const VoiceListQuerySchema = z.object({
  provider: VoiceProviderSchema.optional(),
  category: z.enum(['cloned', 'premade', 'professional', 'all']).default('all'),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type VoiceListQuery = z.infer<typeof VoiceListQuerySchema>;

export const VoiceDetailParamsSchema = z.object({
  voiceId: z.string().min(1, 'Voice ID é obrigatório'),
});

export type VoiceDetailParams = z.infer<typeof VoiceDetailParamsSchema>;

// =====================================
// Voice Sample Schemas
// =====================================

/**
 * Add sample to existing voice
 */
export const VoiceSampleAddSchema = z.object({
  voiceId: z.string().min(1, 'Voice ID é obrigatório'),
  // Files handled via FormData
});

export type VoiceSampleAdd = z.infer<typeof VoiceSampleAddSchema>;

/**
 * Remove sample from voice
 */
export const VoiceSampleRemoveSchema = z.object({
  voiceId: z.string().min(1, 'Voice ID é obrigatório'),
  sampleId: z.string().min(1, 'Sample ID é obrigatório'),
});

export type VoiceSampleRemove = z.infer<typeof VoiceSampleRemoveSchema>;

// =====================================
// Voice Delete Schema
// =====================================

export const VoiceDeleteSchema = z.object({
  voiceId: z.string().min(1, 'Voice ID é obrigatório'),
  // Safety confirmation
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Confirmação é obrigatória para deletar' }),
  }),
});

export type VoiceDelete = z.infer<typeof VoiceDeleteSchema>;

// =====================================
// Voice Response Types
// =====================================

export const VoiceResponseSchema = z.object({
  voice_id: z.string(),
  name: z.string(),
  category: z.enum(['cloned', 'premade', 'professional']),
  description: z.string().nullable().optional(),
  samples: z.array(z.object({
    sample_id: z.string(),
    file_name: z.string(),
    mime_type: z.string(),
    size_bytes: z.number(),
    hash: z.string().optional(),
  })).optional(),
  settings: z.object({
    stability: z.number(),
    similarity_boost: z.number(),
    style: z.number().optional(),
    use_speaker_boost: z.boolean().optional(),
  }).optional(),
  labels: z.record(z.string()).optional(),
  preview_url: z.string().url().nullable().optional(),
  created_at: z.string().optional(),
});

export type VoiceResponse = z.infer<typeof VoiceResponseSchema>;

// =====================================
// Utility Functions
// =====================================

/**
 * Valida se o arquivo de áudio é válido
 */
export function isValidAudioFile(mimeType: string): boolean {
  return (ALLOWED_AUDIO_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Obtém extensão de arquivo permitida a partir do MIME type
 */
export function getAudioExtension(mimeType: string): string | null {
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'audio/m4a': 'm4a',
    'audio/x-m4a': 'm4a',
  };
  return map[mimeType] || null;
}
