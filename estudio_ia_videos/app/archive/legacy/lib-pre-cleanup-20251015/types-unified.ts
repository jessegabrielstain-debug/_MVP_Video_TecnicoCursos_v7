
/**
 * 🔗 Types Unified - Compatibilidade entre parsers
 * Interface unificada para compatibilidade entre enhanced-parser e real-parser
 */

// Tipos base compatíveis
export interface UnifiedElement {
  id: string
  type: 'text' | 'image' | 'video' | 'shape' | 'audio' | 'chart' | 'table' | 'link' | 'group' | 'smartart'
  content: string | null
  style: {
    position?: { x: number; y: number; width: number; height: number }
    fontSize?: number
    fontFamily?: string
    color?: string
    backgroundColor?: string
    opacity?: number
    rotation?: number
  }
  // Compatibilidade com enhanced-parser
  x?: number
  y?: number
  width?: number
  height?: number
  properties?: any
  zIndex?: number
  locked?: boolean
  visible?: boolean
  // Compatibilidade com real-parser
  animations?: Array<{
    type: string
    duration: number
    delay: number
    easing: string
  }>
  metadata?: Record<string, unknown>
}

export interface UnifiedSlide {
  id: string
  index: number
  title: string
  layout: string
  elements: UnifiedElement[]
  duration: number
  background?: {
    type?: 'color' | 'image' | 'gradient'
    value?: string
    color?: string
    image?: string
  }
  notes?: string
  transition?: {
    type: string
    duration: number
  }
  // Compatibilidade com enhanced-parser
  content?: string[]
  animations?: Array<{
    elementId: string
    type: string
    startTime: number
    duration: number
    parameters: Record<string, unknown>
  }>
  transitions?: Array<{
    type: string
    duration: number
    delay: number
  }>
}

export interface UnifiedAssets {
  images: Array<{
    id: string
    name: string
    path?: string
    url?: string
    thumbnail?: string
    size?: number
    type?: string
    base64?: string
    s3Key?: string
  }>
  videos: Array<{
    id: string
    name: string
    path?: string
    url?: string
    thumbnail?: string
    duration?: number
    format?: string
    s3Key?: string
  }>
  audio: Array<{
    id: string
    name: string
    path?: string
    url?: string
    duration: number
    format?: string
    s3Key?: string
  }>
  fonts?: Array<{
    id: string
    name: string
    family: string
    url?: string
    weight?: string
    style?: string
  }>
}

export interface UnifiedMetadata {
  title: string
  author?: string
  subject?: string
  created?: string
  modified?: string
  totalSlides: number
  slideSize?: { width: number; height: number }
  dimensions?: { width: number; height: number }
  version?: string
  application?: string
  language?: string
  theme?: string
  // Compatibilidade com enhanced-parser
  description?: string
  keywords?: string[]
  category?: string
}

export interface UnifiedTimeline {
  totalDuration: number
  scenes: Array<{
    slideId: string
    startTime: number
    duration: number
  }>
}

export interface UnifiedCompliance {
  nrType?: string
  score: number
  recommendations: string[]
  checklist: Array<{
    item: string
    status: 'passed' | 'failed' | 'warning'
    message: string
  }>
}

export interface UnifiedParseResult {
  slides: UnifiedSlide[]
  assets: UnifiedAssets
  metadata: UnifiedMetadata
  timeline: UnifiedTimeline
  compliance?: UnifiedCompliance
}

// Funções de conversão para compatibilidade

export function convertEnhancedToUnified(enhancedResult: any): UnifiedParseResult {
  return {
    slides: enhancedResult.slides?.map((slide: any, index: number) => ({
      id: slide.id || `slide-${index}`,
      index: slide.index ?? index,
      title: slide.title || `Slide ${index + 1}`,
      layout: slide.layout || 'blank',
      elements: slide.elements?.map((element: any) => ({
        id: element.id,
        type: element.type,
        content: element.properties?.text || element.content || null,
        style: {
          position: {
            x: element.x || 0,
            y: element.y || 0,
            width: element.width || 100,
            height: element.height || 50
          },
          fontSize: element.properties?.fontSize || 16,
          fontFamily: element.properties?.fontFamily || 'Arial',
          color: element.properties?.color || '#000000',
          backgroundColor: element.properties?.fill,
          opacity: element.opacity || 1,
          rotation: element.rotation || 0
        },
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        properties: element.properties
      })) || [],
      duration: slide.duration ?? 15,
      background: slide.background,
      notes: slide.notes,
      transition: slide.transition,
      content: slide.content
    })) || [],
    
    assets: {
      images: enhancedResult.assets?.images || [],
      videos: enhancedResult.assets?.videos || [],
      audio: enhancedResult.assets?.audio || [],
      fonts: enhancedResult.assets?.fonts || []
    },
    
    metadata: {
      title: enhancedResult.metadata?.title || 'Apresentação sem título',
      author: enhancedResult.metadata?.author,
      subject: enhancedResult.metadata?.subject,
      created: enhancedResult.metadata?.created,
      modified: enhancedResult.metadata?.modified,
      totalSlides: enhancedResult.metadata?.totalSlides || 0,
      slideSize: enhancedResult.metadata?.slideSize,
      dimensions: enhancedResult.metadata?.dimensions || enhancedResult.metadata?.slideSize,
      version: enhancedResult.metadata?.version,
      application: enhancedResult.metadata?.application,
      language: enhancedResult.metadata?.language,
      theme: enhancedResult.metadata?.theme,
      description: enhancedResult.metadata?.description,
      keywords: enhancedResult.metadata?.keywords,
      category: enhancedResult.metadata?.category
    },
    
    timeline: {
      totalDuration: enhancedResult.timeline?.totalDuration || 0,
      scenes: enhancedResult.timeline?.scenes || []
    },
    
    compliance: enhancedResult.compliance
  }
}

export function convertRealToUnified(realResult: any): UnifiedParseResult {
  return {
    slides: realResult.slides?.map((slide: any) => ({
      id: slide.id,
      index: slide.index,
      title: slide.title,
      layout: slide.layout || 'blank',
      elements: slide.elements?.map((element: any) => ({
        id: element.id,
        type: element.type,
        content: element.content,
        style: element.style || {},
        animations: element.animations,
        metadata: element.metadata,
        // Compatibilidade reversa
        x: element.style?.position?.x || 0,
        y: element.style?.position?.y || 0,
        width: element.style?.position?.width || 100,
        height: element.style?.position?.height || 50,
        properties: {
          text: element.content,
          fontSize: element.style?.fontSize,
          fontFamily: element.style?.fontFamily,
          color: element.style?.color,
          fill: element.style?.backgroundColor
        }
      })) || [],
      duration: slide.duration ?? 15,
      background: slide.background,
      notes: slide.notes,
      transition: slide.transition
    })) || [],
    
    assets: realResult.assets || { images: [], videos: [], audio: [], fonts: [] },
    metadata: realResult.metadata || { title: 'Apresentação', totalSlides: 0 },
    timeline: realResult.timeline || { totalDuration: 0, scenes: [] },
    compliance: realResult.compliance
  }
}

// Tipos para o Editor (compatibilidade)
export type PPTXSlide = UnifiedSlide
export type PPTXElement = UnifiedElement
export type PPTXParseResult = UnifiedParseResult
export type PPTXAssets = UnifiedAssets
export type PPTXMetadata = UnifiedMetadata

// Re-exportar para compatibilidade com imports existentes
export type {
  UnifiedSlide as PPTXSlideReal,
  UnifiedElement as PPTXSlideElement,
  UnifiedParseResult as PPTXParseResultReal,
  UnifiedAssets as PPTXAssetsReal,
  UnifiedMetadata as PPTXMetadataReal
}
