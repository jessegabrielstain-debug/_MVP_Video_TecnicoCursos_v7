/**
 * 📄 Tipos para Sistema PPTX
 * Definições completas para processamento de apresentações
 */

export interface PPTXSlide {
  id: string;
  slideNumber: number;
  title?: string;
  content: PPTXElement[];
  notes?: string;
  background?: PPTXBackground;
  layout: PPTXLayout;
  metadata: PPTXSlideMetadata;
}

export interface PPTXElement {
  id: string;
  type: PPTXElementType;
  content: string | PPTXMedia;
  position: PPTXPosition;
  style: PPTXElementStyle;
  animations?: PPTXAnimation[];
}

export type PPTXElementType = 
  | 'text' 
  | 'image' 
  | 'shape' 
  | 'chart' 
  | 'table'
  | 'video'
  | 'audio'
  | 'placeholder';

export interface PPTXPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
}

export interface PPTXElementStyle {
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  opacity?: number;
  rotation?: number;
  border?: PPTXBorder;
  shadow?: PPTXShadow;
}

export interface PPTXBorder {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface PPTXShadow {
  type: 'outer' | 'inner';
  blur: number;
  angle: number;
  distance: number;
  color: string;
  opacity: number;
}

export interface PPTXBackground {
  type: 'solid' | 'gradient' | 'image' | 'pattern';
  color?: string;
  gradient?: PPTXGradient;
  image?: PPTXMedia;
}

export interface PPTXGradient {
  type: 'linear' | 'radial';
  angle?: number;
  stops: Array<{
    position: number;
    color: string;
  }>;
}

export interface PPTXMedia {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  filename: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // Para vídeo/áudio
  thumbnailUrl?: string;
}

export interface PPTXAnimation {
  id: string;
  type: PPTXAnimationType;
  trigger: 'click' | 'auto' | 'afterPrevious';
  duration: number;
  delay?: number;
  easing?: string;
  properties: Record<string, unknown>;
}

export type PPTXAnimationType = 
  | 'fadeIn' 
  | 'fadeOut' 
  | 'slideIn' 
  | 'slideOut'
  | 'zoom' 
  | 'rotate' 
  | 'bounce'
  | 'typewriter'
  | 'wipe'
  | 'blinds';

export interface PPTXLayout {
  name: string;
  type: 'title' | 'content' | 'twoContent' | 'comparison' | 'blank' | 'custom';
  placeholders: PPTXPlaceholder[];
}

export interface PPTXPlaceholder {
  id: string;
  type: 'title' | 'subtitle' | 'body' | 'image' | 'chart' | 'table';
  position: PPTXPosition;
  defaultText?: string;
}

export interface PPTXSlideMetadata {
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  keywords?: string[];
  hidden?: boolean;
  locked?: boolean;
  transitionType?: PPTXTransitionType;
  transitionDuration?: number;
}

export type PPTXTransitionType = 
  | 'none' 
  | 'fade' 
  | 'push' 
  | 'cover' 
  | 'uncover'
  | 'split' 
  | 'wipe' 
  | 'dissolve'
  | 'random';

// Documento PPTX completo
export interface PPTXDocument {
  id: string;
  filename: string;
  title: string;
  author: string;
  slides: PPTXSlide[];
  masterSlides: PPTXMasterSlide[];
  metadata: PPTXDocumentMetadata;
  settings: PPTXDocumentSettings;
}

export interface PPTXMasterSlide {
  id: string;
  name: string;
  layouts: PPTXLayout[];
  theme: PPTXTheme;
}

export interface PPTXTheme {
  name: string;
  colorScheme: PPTXColorScheme;
  fontScheme: PPTXFontScheme;
  effects?: PPTXEffectScheme;
}

export interface PPTXColorScheme {
  name: string;
  colors: {
    background1: string;
    background2: string;
    text1: string;
    text2: string;
    accent1: string;
    accent2: string;
    accent3: string;
    accent4: string;
    accent5: string;
    accent6: string;
    hyperlink: string;
    followedHyperlink: string;
  };
}

export interface PPTXFontScheme {
  name: string;
  majorFont: string;
  minorFont: string;
}

export interface PPTXEffectScheme {
  name: string;
  effects: Record<string, unknown>;
}

export interface PPTXDocumentMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  slideCount: number;
  fileSize: number;
  checksum: string;
  language?: string;
  subject?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface PPTXDocumentSettings {
  slideSize: PPTXSlideSize;
  orientation: 'landscape' | 'portrait';
  startSlide: number;
  defaultTransition?: PPTXTransitionType;
  showSlideNumbers?: boolean;
  showNotes?: boolean;
  password?: string;
  readOnly?: boolean;
}

export interface PPTXSlideSize {
  width: number;
  height: number;
  units: 'inches' | 'cm' | 'mm' | 'points' | 'pixels';
}

// Tipos para processamento e conversão
export interface PPTXProcessingJob {
  id: string;
  documentId: string;
  type: PPTXJobType;
  status: PPTXJobStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: PPTXJobResult;
  settings: PPTXProcessingSettings;
}

export type PPTXJobType = 
  | 'parse' 
  | 'generate' 
  | 'convert' 
  | 'preview' 
  | 'merge'
  | 'export'
  | 'validate';

export type PPTXJobStatus = 
  | 'queued' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface PPTXJobResult {
  outputUrl?: string;
  thumbnails?: string[];
  metadata?: Record<string, unknown>;
  warnings?: string[];
  stats?: PPTXProcessingStats;
}

export interface PPTXProcessingSettings {
  outputFormat?: 'pptx' | 'pdf' | 'html' | 'images' | 'video';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  includeNotes?: boolean;
  includeAnimations?: boolean;
  embedFonts?: boolean;
  optimizeImages?: boolean;
  generateThumbnails?: boolean;
  watermark?: PPTXWatermark;
}

export interface PPTXWatermark {
  type: 'text' | 'image';
  content: string;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
  opacity: number;
  size?: number;
}

export interface PPTXProcessingStats {
  slideCount: number;
  elementCount: number;
  imageCount: number;
  animationCount: number;
  processingTime: number;
  outputSize: number;
  compressionRatio?: number;
}

// Templates e automação
export interface PPTXTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  masterSlides: PPTXMasterSlide[];
  sampleSlides: PPTXSlide[];
  variables: PPTXTemplateVariable[];
  rules: PPTXTemplateRule[];
  metadata: PPTXTemplateMetadata;
}

export interface PPTXTemplateVariable {
  name: string;
  type: 'text' | 'image' | 'number' | 'date' | 'boolean' | 'list';
  description: string;
  required: boolean;
  defaultValue?: string | number | boolean | string[];
  validation?: PPTXValidationRule;
}

export interface PPTXValidationRule {
  type: string;
  params: Record<string, unknown>;
  message: string;
}

export interface PPTXTemplateRule {
  id: string;
  condition: string;
  action: PPTXTemplateAction;
  priority: number;
}

export interface PPTXTemplateAction {
  type: 'show' | 'hide' | 'replace' | 'style' | 'animate';
  target: string;
  params: Record<string, unknown>;
}

export interface PPTXTemplateMetadata {
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  compatibility: string[];
  license: string;
  downloadCount: number;
  rating: number;
}

// Integração com sistema de vídeo
export interface PPTXToVideoSettings {
  slideTransition: {
    type: PPTXTransitionType;
    duration: number;
  };
  slideTiming: {
    auto: boolean;
    duration?: number; // segundos por slide
    customTimings?: number[]; // timing específico por slide
  };
  videoSettings: {
    resolution: {
      width: number;
      height: number;
    };
    fps: number;
    quality: string;
    format: string;
  };
  audio?: {
    enabled: boolean;
    narrationTrack?: string;
    backgroundMusic?: string;
    volume: number;
  };
  branding?: {
    logo?: PPTXMedia;
    watermark?: PPTXWatermark;
    intro?: PPTXSlide;
    outro?: PPTXSlide;
  };
}

export interface PPTXVideoPreview {
  id: string;
  pptxId: string;
  previewUrl: string;
  thumbnails: string[];
  duration: number;
  slideTimings: number[];
  generatedAt: Date;
  settings: PPTXToVideoSettings;
}