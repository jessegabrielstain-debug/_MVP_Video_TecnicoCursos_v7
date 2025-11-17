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
}

export interface ParsedPPTXMetadata {
  title: string;
  author: string;
  slideCount: number;
}

export interface ParsedPPTXData {
  metadata: ParsedPPTXMetadata;
  slides: Partial<Slide>[];
}

export interface ProcessingOptions {
  defaultDuration?: number;
  transition?: SlideTransition;
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
