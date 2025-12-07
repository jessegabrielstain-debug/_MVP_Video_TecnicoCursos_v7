export interface SlideTransition {
  type: string;
  duration: number;
}

export interface Slide {
  id: string;
  slideNumber: number;
  title: string;
  content: string;
  notes?: string;
  duration: number;
  transition: SlideTransition;
  images?: string[];
  layout?: string;
  textBoxes?: Record<string, unknown>[];
  animations?: Record<string, unknown>[];
  backgroundType?: string;
  backgroundColor?: string;
  shapes?: Record<string, unknown>[];
}

export interface ParsedPPTXMetadata {
  title: string;
  author: string;
  subject?: string;
  slideCount: number;
}

export interface ParsedPPTXData {
  metadata: ParsedPPTXMetadata;
  slides: Partial<Slide>[];
}

export interface ProcessingOptions {
  defaultDuration?: number;
  transition?: SlideTransition;
  extractImages?: boolean;
  extractNotes?: boolean;
  extractFormatting?: boolean;
  generateThumbnails?: boolean;
}

export type ProgressStage =
  | 'initializing'
  | 'parsing'
  | 'processing-slides'
  | 'finalizing';

export interface ProgressUpdate {
  stage: ProgressStage;
  progress: number;
  currentStep?: string;
  currentSlide?: number;
  totalSlides?: number;
}

export type ProgressCallback = (update: ProgressUpdate) => void;
