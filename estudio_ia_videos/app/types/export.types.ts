/**
 * Types e Interfaces para Export & Rendering System
 * Updated Sprint 49: Added advanced rendering options
 */

import type { SubtitleStyle } from './subtitle.types'
import type { WatermarkConfig } from './watermark.types'
import type { VideoFilterConfig } from '@/lib/export/video-filters-types'
import type { AudioEnhancementConfig } from '@/lib/export/audio-processor'

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ExportFormat {
  MP4 = 'mp4',
  WEBM = 'webm',
  MOV = 'mov',
}

export enum ExportResolution {
  HD_720 = '720p',
  FULL_HD_1080 = '1080p',
  UHD_4K = '4k',
}

export enum ExportQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
}

export interface ExportSettings {
  // Basic settings
  format: ExportFormat
  resolution: ExportResolution
  quality: ExportQuality
  fps?: number // Frames per second (default: 30)
  bitrate?: string // Video bitrate (e.g., '5000k')
  audioBitrate?: string // Audio bitrate (e.g., '192k')
  codec?: string // Video codec (e.g., 'h264', 'vp9')
  audioCodec?: string // Audio codec (e.g., 'aac', 'opus')
  
  // Legacy watermark flag (deprecated - use watermark object instead)
  includeWatermark?: boolean
  
  // Advanced settings (Sprint 48/49)
  watermark?: WatermarkConfig // Watermark configuration
  videoFilters?: VideoFilterConfig[] // Video filters
  audioEnhancements?: AudioEnhancementConfig[] // Audio enhancements
  subtitle?: {
    enabled: boolean
    source?: string
    format?: 'srt' | 'vtt' | 'ass'
    burnIn: boolean
    style?: SubtitleStyle
  }
}

export interface ExportJob {
  id: string
  userId: string
  projectId: string
  timelineId: string
  status: ExportStatus
  settings: ExportSettings
  progress: number // 0-100
  outputUrl?: string // URL do vídeo final
  outputPath?: string // Path local do arquivo
  fileSize?: number // Tamanho em bytes
  duration?: number // Duração em segundos
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  estimatedTimeRemaining?: number // Segundos estimados
}

export interface ExportProgress {
  jobId: string
  progress: number
  currentPhase: ExportPhase
  message: string
  estimatedTimeRemaining?: number
}

export enum ExportPhase {
  INITIALIZING = 'initializing',
  PROCESSING_VIDEO = 'processing_video',
  PROCESSING_AUDIO = 'processing_audio',
  MERGING = 'merging',
  ENCODING = 'encoding',
  FINALIZING = 'finalizing',
}

export interface TimelineLayerData {
  id: string
  start: number
  end: number
  type: string
  assetId?: string
  properties?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface TimelineTrackData {
  id: string
  type: string
  name?: string
  duration?: number
  layers: TimelineLayerData[]
  metadata?: Record<string, unknown>
}

export interface TimelineData {
  id?: string
  name?: string
  duration?: number
  fps?: number
  tracks?: TimelineTrackData[]
  settings?: Record<string, unknown>
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface RenderTask {
  jobId: string
  timelineData: TimelineData | null
  settings: ExportSettings
  userId: string
  projectId: string
}

export interface ExportQueueStatus {
  totalJobs: number
  pendingJobs: number
  processingJobs: number
  completedJobs: number
  failedJobs: number
}

// Configurações de resolução
export const RESOLUTION_CONFIGS = {
  [ExportResolution.HD_720]: {
    width: 1280,
    height: 720,
    bitrate: '2500k',
  },
  [ExportResolution.FULL_HD_1080]: {
    width: 1920,
    height: 1080,
    bitrate: '5000k',
  },
  [ExportResolution.UHD_4K]: {
    width: 3840,
    height: 2160,
    bitrate: '15000k',
  },
}

// Configurações de qualidade
export const QUALITY_CONFIGS = {
  [ExportQuality.LOW]: {
    crf: 28, // Constant Rate Factor (lower = better)
    preset: 'ultrafast',
  },
  [ExportQuality.MEDIUM]: {
    crf: 23,
    preset: 'medium',
  },
  [ExportQuality.HIGH]: {
    crf: 18,
    preset: 'slow',
  },
  [ExportQuality.ULTRA]: {
    crf: 15,
    preset: 'veryslow',
  },
}

// Configurações de codec por formato
export const CODEC_CONFIGS = {
  [ExportFormat.MP4]: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    container: 'mp4',
  },
  [ExportFormat.WEBM]: {
    videoCodec: 'libvpx-vp9',
    audioCodec: 'libopus',
    container: 'webm',
  },
  [ExportFormat.MOV]: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    container: 'mov',
  },
}
