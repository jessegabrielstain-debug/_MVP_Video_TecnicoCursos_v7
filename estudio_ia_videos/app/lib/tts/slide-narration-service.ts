
export interface NarrationSegment {
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface SlideNarrationResult {
  slideId: string;
  slideNumber: number;
  audioUrl: string;
  totalDuration: number;
  cost: number;
  quality: {
    pronunciation_score: number;
  };
  segments: NarrationSegment[];
}

export interface BatchNarrationProgress {
  currentSlide: {
    number: number;
    title: string;
  };
  completedSlides: number;
  totalSlides: number;
  estimatedTimeRemaining: number;
  errors: string[];
}

export class SlideNarrationService {
  // Placeholder for service methods if needed
}
