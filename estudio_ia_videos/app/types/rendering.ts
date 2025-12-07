/**
 * Tipos compartilhados para render jobs e estatísticas
 * Centraliza enums e interfaces para tipagem estrita em todo o sistema de render
 * @module types/rendering
 */

// ============================================================================
// ENUMS E CONSTANTES
// ============================================================================

export const RENDER_JOB_STATUSES = [
  'pending',
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled'
] as const

export type RenderJobStatus = typeof RENDER_JOB_STATUSES[number]

/** Status que indicam que o job está ativo (não finalizado) */
export const ACTIVE_STATUSES: RenderJobStatus[] = ['pending', 'queued', 'processing']

/** Status que indicam que o job foi finalizado */
export const FINAL_STATUSES: RenderJobStatus[] = ['completed', 'failed', 'cancelled']

export const RENDER_FORMATS = ['mp4', 'webm', 'mov', 'gif'] as const
export type RenderFormat = typeof RENDER_FORMATS[number]

export const RENDER_RESOLUTIONS = ['720p', '1080p', '4k'] as const
export type RenderResolution = typeof RENDER_RESOLUTIONS[number]

export const RENDER_QUALITY_PRESETS = ['draft', 'standard', 'high', 'ultra'] as const
export type RenderQualityPreset = typeof RENDER_QUALITY_PRESETS[number]

// ============================================================================
// INTERFACES DE CONFIGURAÇÃO
// ============================================================================

export interface RenderSettings {
  format: RenderFormat
  resolution: RenderResolution
  quality: RenderQualityPreset
  fps: number
  codec?: string
  bitrate?: number
  audioBitrate?: number
  includeAudio: boolean
  includeSubtitles: boolean
  watermark?: {
    enabled: boolean
    text?: string
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    opacity?: number
  }
}

export interface ResourceUsage {
  cpu_usage?: number
  memory_usage?: number
  gpu_usage?: number
  storage_used?: number
}

// ============================================================================
// INTERFACES DE RENDER JOB
// ============================================================================

export interface RenderJobRecord {
  id: string
  user_id?: string
  project_id?: string
  status: RenderJobStatus
  progress: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  output_url: string | null
  render_settings?: RenderSettings
  resource_usage?: ResourceUsage
  metadata?: Record<string, unknown>
}

export interface RenderJobCreate {
  project_id: string
  render_settings: RenderSettings
  priority?: number
  metadata?: Record<string, unknown>
}

export interface RenderJobUpdate {
  status?: RenderJobStatus
  progress?: number
  error_message?: string | null
  output_url?: string | null
  started_at?: string
  completed_at?: string
  resource_usage?: ResourceUsage
}

// ============================================================================
// INTERFACES DE RESPOSTA API
// ============================================================================

export interface RenderJobResponse {
  success: boolean
  job?: RenderJobRecord
  error?: string
  message?: string
}

export interface RenderJobsListResponse {
  success: boolean
  jobs: RenderJobRecord[]
  total: number
  page: number
  pageSize: number
  error?: string
}

export interface RenderProgressResponse {
  success: boolean
  jobId: string
  status: RenderJobStatus
  progress: number
  estimatedTimeRemaining?: number
  currentStep?: string
  error?: string
}

// ============================================================================
// INTERFACES DE ESTATÍSTICAS
// ============================================================================

export interface RenderBasicStats {
  total_renders: number
  successful_renders: number
  failed_renders: number
  cancelled_renders: number
  avg_render_time: number
  total_render_time: number
  success_rate: number
}

export interface RenderQueueStats {
  current_queue_length: number
  processing_jobs: number
  avg_wait_time: number
  peak_queue_time: string
}

export interface RenderPerformanceMetrics {
  fastest_render: number
  slowest_render: number
  p50_render_time: number
  p90_render_time: number
  p95_render_time: number
  most_common_resolution: string
  most_common_format: string
  avg_cpu_usage?: number
  avg_memory_usage?: number
  avg_gpu_usage?: number
}

export interface RenderErrorCategory {
  category: string
  count: number
  sample_errors: string[]
}

export interface RenderStatsResponse {
  success: boolean
  metadata: {
    generated_at: string
    time_range: string
    row_count: number
    truncated: boolean
  }
  basic_stats: RenderBasicStats
  queue_stats: RenderQueueStats
  performance_metrics?: RenderPerformanceMetrics
  error_categories?: RenderErrorCategory[]
}

// ============================================================================
// HELPERS DE TIPO
// ============================================================================

/** Verifica se um status indica que o job está ativo */
export function isActiveStatus(status: RenderJobStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}

/** Verifica se um status indica que o job foi finalizado */
export function isFinalStatus(status: RenderJobStatus): boolean {
  return FINAL_STATUSES.includes(status)
}

/** Retorna configurações padrão de render */
export function getDefaultRenderSettings(): RenderSettings {
  return {
    format: 'mp4',
    resolution: '1080p',
    quality: 'standard',
    fps: 30,
    includeAudio: true,
    includeSubtitles: false
  }
}
