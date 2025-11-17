
/**
 * 🔗 Types Unified v2.0 - Compatibilidade Expandida
 * Interface unificada aprimorada com suporte completo para elementos editáveis
 */

// Converter resultado do parser real para formato unificado
export function convertRealToUnified(realResult: any): UnifiedParseResult {
  const statistics = {
    totalElements: realResult.slides.reduce((acc: number, slide: any) => acc + slide.elements.length, 0),
    elementsByType: realResult.slides.reduce((acc: Record<string, number>, slide: any) => {
      slide.elements.forEach((element: any) => {
        acc[element.type] = (acc[element.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
    totalAssets: realResult.assets.images.length + realResult.assets.videos.length + realResult.assets.audio.length,
    estimatedFileSize: 0,
    processingTime: Date.now(),
    editableElements: realResult.slides.reduce((acc: number, slide: any) => 
      acc + slide.elements.filter((el: any) => el.type !== 'image').length, 0)
  };

  const processing = {
    parserId: 'pptx-real-parser-v2',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    warnings: [],
    errors: []
  };

  return {
    slides: realResult.slides.map((slide: any) => ({
      id: slide.id,
      index: slide.index,
      title: slide.title,
      layout: slide.layout,
      elements: slide.elements.map((element: any) => ({
        id: element.id,
        type: element.type,
        content: element.content,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex || 1,
        visible: true,
        locked: false,
        style: {
          position: {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
          },
          ...element.style
        },
        animations: element.animations || [],
        properties: element.properties || {}
      })),
      duration: slide.duration,
      background: slide.background,
      notes: slide.notes
    })),
    metadata: {
      title: realResult.metadata.title,
      author: realResult.metadata.author,
      created: realResult.metadata.created,
      totalSlides: realResult.metadata.totalSlides,
      slideSize: realResult.metadata.slideSize
    },
    assets: realResult.assets,
    timeline: realResult.timeline,
    compliance: realResult.compliance,
    statistics,
    processing
  }
}

// Tipos base expandidos
export interface UnifiedElement {
  id: string
  type: 'text' | 'image' | 'video' | 'shape' | 'audio' | 'chart' | 'table' | 'textbox' | 'group'
  content: string | null
  
  // Posição direta (compatibilidade)
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  
  // Estado do elemento
  visible: boolean
  locked: boolean
  selected?: boolean
  
  // Estilo unificado
  style: {
    position: { x: number; y: number; width: number; height: number }
    fontSize?: number
    fontFamily?: string
    color?: string
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    opacity?: number
    rotation?: number
    textAlign?: 'left' | 'center' | 'right'
    fontWeight?: 'normal' | 'bold'
    fontStyle?: 'normal' | 'italic'
  }
  
  // Animações e keyframes
  animations: Array<{
    id: string
    type: 'fadeIn' | 'slideIn' | 'zoom' | 'rotate' | 'bounce' | 'custom'
    duration: number
    delay: number
    easing: string
    keyframes?: Array<{
      time: number
      property: string
      value: any
      easing?: string
    }>
  }>
  
  // Propriedades específicas por tipo
  properties: {
    // Para shapes
    shape?: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'star' | 'custom'
    fillColor?: string
    strokeColor?: string
    strokeWidth?: number
    
    // Para imagens
    src?: string
    alt?: string
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down'
    
    // Para textos
    placeholder?: string
    editable?: boolean
    
    // Para links
    href?: string
    target?: '_blank' | '_self'
    
    // Para vídeos
    autoplay?: boolean
    controls?: boolean
    loop?: boolean
    muted?: boolean
    
    // Dados personalizados
    metadata?: Record<string, unknown>
  }
}

export interface UnifiedSlide {
  id: string
  index: number
  title: string
  layout: string
  elements: UnifiedElement[]
  duration: number
  
  // Background expandido
  background?: {
    type: 'color' | 'image' | 'gradient' | 'video'
    value: string
    opacity?: number
    blur?: number
  }
  
  // Transições
  transition?: {
    type: 'fade' | 'slide' | 'zoom' | 'flip' | 'cube' | 'none'
    duration: number
    easing?: string
    direction?: 'left' | 'right' | 'up' | 'down'
  }
  
  // Notas do apresentador
  notes?: string
  
  // Configurações avançadas
  settings?: {
    autoAdvance?: boolean
    advanceTime?: number
    clickToAdvance?: boolean
    showInTimeline?: boolean
  }
}

export interface UnifiedAssets {
  images: Array<{
    id: string
    name: string
    base64?: string
    url?: string
    thumbnail?: string
    size?: number
    type: string
    dimensions?: { width: number; height: number }
    s3Key?: string
  }>
  
  videos: Array<{
    id: string
    name: string
    url?: string
    thumbnail?: string
    duration: number
    format: string
    size?: number
    dimensions?: { width: number; height: number }
    s3Key?: string
  }>
  
  audio: Array<{
    id: string
    name: string
    url?: string
    duration: number
    format: string
    size?: number
    bitrate?: number
    s3Key?: string
  }>
  
  fonts?: Array<{
    id: string
    name: string
    family: string
    url?: string
    weight: string
    style: string
  }>
}

export interface UnifiedMetadata {
  title: string
  description?: string
  author?: string
  subject?: string
  keywords?: string[]
  created?: string
  modified?: string
  totalSlides: number
  slideSize: { width: number; height: number }
  version?: string
  application?: string
  language?: string
  theme?: string
  category?: string
}

export interface UnifiedTimeline {
  totalDuration: number
  scenes: Array<{
    slideId: string
    slideIndex: number
    startTime: number
    duration: number
    elements?: Array<{
      elementId: string
      startTime: number
      duration: number
      track: number
      animations: Array<{
        type: string
        startTime: number
        duration: number
        properties: Record<string, unknown>
      }>
    }>
  }>
  
  // Trilhas de timeline
  tracks?: Array<{
    id: string
    type: 'scene' | 'audio' | 'effects' | 'text' | 'video'
    name: string
    color: string
    height: number
    visible: boolean
    locked: boolean
    muted?: boolean
    volume?: number
  }>
}

export interface UnifiedCompliance {
  nrType: string
  score: number
  maxScore?: number
  recommendations: Array<{
    id: string
    type: 'error' | 'warning' | 'suggestion'
    title: string
    description: string
    element?: string
    slide?: string
    autoFix?: boolean
  }>
  
  checklist?: Array<{
    id: string
    category: string
    item: string
    status: 'passed' | 'failed' | 'warning' | 'not_applicable'
    message: string
    requirement?: boolean
  }>
  
  analysis?: {
    contentCoverage: number
    visualQuality: number
    accessibility: number
    engagement: number
    compliance: number
  }
}

export interface UnifiedParseResult {
  slides: UnifiedSlide[]
  metadata: UnifiedMetadata
  assets: UnifiedAssets
  timeline: UnifiedTimeline
  compliance?: UnifiedCompliance
  
  // Estatísticas gerais
  statistics: {
    totalElements: number
    elementsByType: Record<string, number>
    totalAssets: number
    estimatedFileSize: number
    processingTime?: number
    editableElements: number
  }
  
  // Informações de processamento
  processing: {
    parserId: string
    version: string
    timestamp: string
    warnings: string[]
    errors: string[]
  }
}

// Tipos para o editor
export interface EditorConfig {
  canvas: {
    width: number
    height: number
    zoom: number
    showGrid: boolean
    gridSize: number
    showRulers: boolean
    snapToGrid: boolean
    snapDistance: number
  }
  
  timeline: {
    pixelsPerSecond: number
    trackHeight: number
    visibleTracks: number
    showKeyframes: boolean
    snapToKeyframes: boolean
  }
  
  export: {
    format: 'mp4' | 'webm' | 'gif'
    quality: 'low' | 'medium' | 'high' | 'ultra'
    fps: number
    bitrate: string
    resolution: { width: number; height: number }
  }
}

export interface EditorState {
  currentSlide: number
  selectedElements: string[]
  clipboard: UnifiedElement[]
  history: {
    past: UnifiedSlide[][]
    future: UnifiedSlide[][]
    maxSteps: number
  }
  
  playback: {
    isPlaying: boolean
    currentTime: number
    playbackRate: number
    loop: boolean
  }
  
  tools: {
    activeTool: 'select' | 'text' | 'shape' | 'image' | 'video' | 'draw' | 'crop'
    brush: {
      size: number
      color: string
      opacity: number
    }
  }

  canvas?: {
    width: number
    height: number
    zoom: number
    showGrid: boolean
    gridSize: number
    showRulers: boolean
    snapToGrid: boolean
    snapDistance: number
  }
}

// Eventos do editor
export interface EditorEvent {
  type: 'element_select' | 'element_update' | 'slide_change' | 'timeline_update' | 'export_start' | 'export_complete'
  data: any
  timestamp: number
}

export type EditorEventHandler = (event: EditorEvent) => void

// Declarações globais para testes
declare global {
  interface Window {
    testData?: {
      slides: UnifiedSlide[]
    }
  }
}
