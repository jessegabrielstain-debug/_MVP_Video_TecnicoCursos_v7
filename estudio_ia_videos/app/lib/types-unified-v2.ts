/**
 * Types Unified V2
 * Tipos unificados para todo o sistema (v2)
 */

// Slide types
export interface Slide {
  id: string;
  order: number;
  title: string;
  content: string;
  notes?: string;
  duration?: number;
}

// Render types
export interface RenderJob {
  id: string;
  projectId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputPath?: string;
  error?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'viewer';
}

// Project types
export interface Project {
  id: string;
  userId: string;
  title: string;
  slides: Slide[];
  createdAt: Date;
  updatedAt: Date;
}

// Analytics types
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Storage types
export interface StorageObject {
  key: string;
  bucket: string;
  url: string;
  size: number;
  contentType: string;
}

// Conversion helpers
interface RealSlideElement {
  type: string;
  [key: string]: unknown;
}

interface RealSlide {
  elements?: RealSlideElement[];
  [key: string]: unknown;
}

interface RealProjectData {
  id?: string;
  userId?: string;
  title?: string;
  slides?: RealSlide[];
  timeline?: { totalDuration?: number; [key: string]: unknown };
  author?: string;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  assets?: { images?: unknown[]; [key: string]: unknown };
  [key: string]: unknown;
}

export const convertRealToUnified = (realData: Record<string, unknown>): Project => {
  return {
    id: (realData.id as string) || crypto.randomUUID(),
    userId: (realData.userId as string) || '',
    title: (realData.title as string) || 'Untitled',
    slides: (realData.slides as Slide[]) || [],
    createdAt: new Date((realData.createdAt as string | number | Date) || Date.now()),
    updatedAt: new Date((realData.updatedAt as string | number | Date) || Date.now()),
  };
};

export const convertRealToUnifiedParseResult = (realData: RealProjectData): UnifiedParseResult => {
  return {
    slides: (realData.slides as unknown as UnifiedSlide[]) || [],
    metadata: {
      title: realData.title || 'Untitled',
      slideCount: realData.slides?.length || 0,
      duration: realData.timeline?.totalDuration || 0,
      author: realData.author || 'Unknown',
      createdAt: realData.createdAt ? new Date(realData.createdAt).toISOString() : new Date().toISOString(),
    },
    statistics: {
      totalElements: realData.slides?.reduce((acc: number, s: RealSlide) => acc + (s.elements?.length || 0), 0) || 0,
      editableElements: realData.slides?.reduce((acc: number, s: RealSlide) => acc + (s.elements?.filter((e: RealSlideElement) => e.type !== 'image').length || 0), 0) || 0,
      elementsByType: {},
    },
    timeline: {
      totalDuration: realData.timeline?.totalDuration || 0,
      scenes: [],
      ...(realData.timeline || {})
    },
    assets: {
      ...realData.assets,
      images: realData.assets?.images || []
    },
  };
};

// Unified V2 Types
export interface UnifiedElement {
  id: string;
  type: string;
  content: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  style: {
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    [key: string]: unknown;
  };
  animations: unknown[];
  properties: Record<string, unknown>;
}

export interface UnifiedSlide {
  id: string;
  index: number;
  title?: string;
  elements: UnifiedElement[];
  layout?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface UnifiedParseResult {
  slides: UnifiedSlide[];
  metadata: {
    title: string;
    slideCount: number;
    duration?: number;
    author?: string;
    createdAt?: string;
    [key: string]: unknown;
  };
  statistics: {
    totalElements: number;
    editableElements: number;
    elementsByType: Record<string, number>;
  };
  timeline: UnifiedTimeline;
  assets: {
    images: unknown[];
    [key: string]: unknown;
  };
  compliance?: {
    score: number;
    nrType?: string[];
    [key: string]: unknown;
  };
}

export interface UnifiedTimelineScene {
  slideId: string;
  startTime: number;
  duration: number;
}

export interface UnifiedTimeline {
  totalDuration: number;
  scenes: UnifiedTimelineScene[];
  [key: string]: unknown;
}

export interface EditorState {
  currentSlide: number;
  selectedElements: string[];
  clipboard: UnifiedElement[];
  history: {
    past: unknown[];
    future: unknown[];
    maxSteps: number;
  };
  playback: {
    isPlaying: boolean;
    currentTime: number;
    playbackRate: number;
    loop: boolean;
  };
  tools: {
    activeTool: string;
    brush: {
      size: number;
      color: string;
      opacity: number;
    };
  };
  canvas: EditorConfig['canvas'];
}

export interface EditorConfig {
  canvas: {
    width: number;
    height: number;
    zoom: number;
    showGrid: boolean;
    gridSize: number;
    showRulers: boolean;
    snapToGrid: boolean;
    snapDistance: number;
    pan: { x: number; y: number };
    backgroundColor: string;
  };
  timeline: {
    pixelsPerSecond: number;
    trackHeight: number;
    visibleTracks: number;
    showKeyframes: boolean;
    snapToKeyframes: boolean;
  };
  export: {
    format: string;
    quality: string;
    fps: number;
    bitrate: string;
    resolution: { width: number; height: number };
  };
}

export interface EditorEvent {
  type: string;
  data: unknown;
  timestamp: number;
}
