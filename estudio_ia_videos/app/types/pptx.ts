export interface SlideContent {
  id: string
  text: string
  images: string[]
  notes?: string
}

export interface TimelineSlide {
  id: string
  slideNumber: number
  duration: number
  content?: SlideContent
  effects?: TimelineEffect[]
}

export interface TimelineEffect {
  type: 'fade' | 'slide' | 'zoom' | string
  duration: number
  delay?: number
}

export interface SceneMapping {
  slideId: string
  sceneId: string
  timestamp: number
  templateId?: string
  customizations?: Record<string, unknown>
}

export interface NarrationResult {
  audioUrl: string
  duration: number
  totalDuration?: number
  segments: NarrationSegment[]
}

export interface NarrationSegment {
  text: string
  start: number
  end: number
}

export interface PerformanceTemplate {
  id: string
  templateId: string
  name: string
  count: number
  usage: number
  avgDuration: number
  layout?: string
}

export interface VoiceUsage {
  voiceId: string
  usage: number
}

export interface ErrorBreakdown {
  error: string
  count: number
}

export interface PPTXImportResult {
  id?: string
  name?: string
  success?: boolean
  slides: SlideContent[] | number
  duration?: number
  status?: string
  createdAt?: string
  metadata?: Record<string, unknown>
}

export interface PPTXProcessingResult {
  success: boolean
  uploadId?: string
  processingTime?: number
  stages?: ProcessingStage[]
  slides?: SlideContent[]
  narration?: NarrationResult[]
  metadata?: Record<string, unknown>
}

export interface ProcessingStage {
  id: string
  name: string
  status: 'pending' | 'active' | 'completed' | 'error'
  progress: number
  duration?: number
}

export interface TTSConfig {
  voice?: string
  voiceId?: string
  speed: number
  pitch: number
  volume: number
  text?: string
  customText?: string
}

export interface TimelineItemContent {
  text?: string
  src?: string
  elements?: unknown[]
}

export interface KeyframeValue {
  x?: number
  y?: number
  scale?: number
  opacity?: number
  rotation?: number
}

export interface SlideLayout {
  type: string
  columns?: number
  rows?: number
}

export interface SlideMetadata {
  createdAt?: Date
  modifiedAt?: Date
  author?: string
}

