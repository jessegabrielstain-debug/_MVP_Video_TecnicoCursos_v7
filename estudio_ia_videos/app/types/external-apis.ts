/**
 * 🎯 Tipos para APIs Externas - Sistema Profissional
 * 
 * Interfaces explícitas para serviços de terceiros (ElevenLabs, HeyGen, etc)
 * Substitui todos os `any` de APIs externas por contratos tipados
 * 
 * @module types/external-apis
 */

// ============================================
// 🎙️ ElevenLabs API Types
// ============================================

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: 'premade' | 'cloned' | 'professional' | 'generated';
  description?: string;
  labels?: Record<string, string>;
  settings?: ElevenLabsVoiceSettings;
  preview_url?: string;
  available_for_tiers?: string[];
  high_quality_base_model_ids?: string[];
}

export interface ElevenLabsCloneVoiceRequest {
  name: string;
  description?: string;
  files: File[];
  labels?: Record<string, string>;
}

export interface ElevenLabsCloneVoiceResponse {
  voice_id: string;
  name: string;
  status: 'created' | 'processing' | 'ready' | 'failed';
  message?: string;
}

export interface ElevenLabsGenerateVoiceRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: ElevenLabsVoiceSettings;
  output_format?: 'mp3_44100_128' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
}

export interface ElevenLabsAPIError {
  detail: {
    status: string;
    message: string;
  };
}

// ============================================
// 🎬 HeyGen API Types
// ============================================

export interface HeyGenVoice {
  voice_id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  preview_url?: string;
  accent?: string;
}

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  preview_video_url?: string;
  gender?: 'male' | 'female';
}

export interface HeyGenGenerateVideoRequest {
  video_inputs: Array<{
    character: {
      type: 'avatar';
      avatar_id: string;
      avatar_style?: 'normal' | 'circle';
    };
    voice: {
      type: 'text';
      input_text: string;
      voice_id: string;
    };
    background?: {
      type: 'color' | 'image' | 'video';
      url?: string;
      value?: string;
    };
  }>;
  dimension?: {
    width: number;
    height: number;
  };
  test?: boolean;
  title?: string;
}

export interface HeyGenGenerateVideoResponse {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
}

// ============================================
// 📄 PPTX Parser Types
// ============================================

export interface PPTXParseError {
  type: 'parsing' | 'validation' | 'extraction' | 'conversion';
  message: string;
  slideIndex?: number;
  elementId?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface PPTXSlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart' | 'table' | 'video' | 'audio';
  content?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  animation?: {
    type: string;
    duration?: number;
    delay?: number;
  };
}

export interface PPTXSlideData {
  slideIndex: number;
  slideId: string;
  layout: string;
  title?: string;
  notes?: string;
  elements: PPTXSlideElement[];
  backgroundImage?: string;
  backgroundColor?: string;
  transition?: {
    type: string;
    duration?: number;
  };
}

export interface PPTXMetadata {
  title: string;
  author?: string;
  company?: string;
  subject?: string;
  keywords?: string[];
  slideCount: number;
  createdAt?: string;
  modifiedAt?: string;
  lastModifiedBy?: string;
  version?: string;
}

export interface PPTXParseResult {
  metadata: PPTXMetadata;
  slides: PPTXSlideData[];
  errors: PPTXParseError[];
  warnings: PPTXParseError[];
  statistics: {
    totalSlides: number;
    totalElements: number;
    totalImages: number;
    totalTextBoxes: number;
    parseTimeMs: number;
  };
}

// ============================================
// 🎨 D-ID API Types (Avatar Generation)
// ============================================

export interface DIDTalkRequest {
  script: {
    type: 'text' | 'audio';
    input: string;
    provider?: {
      type: 'microsoft' | 'elevenlabs' | 'amazon';
      voice_id: string;
    };
  };
  source_url: string;
  config?: {
    stitch?: boolean;
    result_format?: 'mp4' | 'gif' | 'mov';
  };
}

export interface DIDTalkResponse {
  id: string;
  status: 'created' | 'started' | 'done' | 'error';
  result_url?: string;
  created_at: string;
  error?: {
    kind: string;
    description: string;
  };
}

// ============================================
// 📊 Video Analytics Types
// ============================================

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  format: string;
  size: number;
  hasAudio: boolean;
  audioCodec?: string;
  audioBitrate?: number;
  audioChannels?: number;
}

export interface VideoProcessingProgress {
  stage: 'preparing' | 'rendering' | 'encoding' | 'uploading' | 'completed';
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  estimatedTimeRemaining?: number;
  message?: string;
}

// ============================================
// 🔐 Authentication Types (External Providers)
// ============================================

export interface OAuthProvider {
  id: 'google' | 'github' | 'microsoft' | 'apple';
  name: string;
  clientId: string;
  redirectUri: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface ExternalUserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  provider: OAuthProvider['id'];
}

// ============================================
// 📦 Storage Provider Types (S3, Azure, etc)
// ============================================

export interface StorageUploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
  encryption?: 'AES256' | 'aws:kms';
}

export interface StorageUploadResult {
  url: string;
  key: string;
  bucket: string;
  etag?: string;
  versionId?: string;
  size: number;
}

export interface StorageDeleteResult {
  deleted: boolean;
  key: string;
  versionId?: string;
}

// ============================================
// 🎯 Webhook Payload Types
// ============================================

export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: string;
  data: T;
  signature?: string;
  delivery_id?: string;
}

export interface RenderJobWebhookData {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  video_url?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// 🧪 Type Guards & Utilities
// ============================================

/**
 * Type guard para validar resposta de erro da ElevenLabs
 */
export function isElevenLabsError(error: unknown): error is ElevenLabsAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error &&
    typeof (error as ElevenLabsAPIError).detail === 'object'
  );
}

/**
 * Type guard para validar metadata de vídeo
 */
export function isVideoMetadata(data: unknown): data is VideoMetadata {
  return (
    typeof data === 'object' &&
    data !== null &&
    'duration' in data &&
    'width' in data &&
    'height' in data &&
    typeof (data as VideoMetadata).duration === 'number'
  );
}

/**
 * Type guard para validar resultado de parse PPTX
 */
export function isPPTXParseResult(data: unknown): data is PPTXParseResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'metadata' in data &&
    'slides' in data &&
    Array.isArray((data as PPTXParseResult).slides)
  );
}
