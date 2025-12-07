export type TimelineElementType = 'video' | 'audio' | 'image' | 'text' | 'pptx-slide' | 'shape' | 'effect' | 'transition' | 'avatar' | 'avatar-3d';
export type TrackType = 'video' | 'audio' | 'text' | 'image' | 'avatar';

export interface TimelineKeyframe {
  id: string;
  timestamp: number;
  property: string;
  value: unknown;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export type TimelineElementData = Record<string, unknown>;

export interface TimelineElement {
  id: string;
  type: TimelineElementType;
  name?: string;
  start: number;
  startTime?: number;
  endTime?: number; // Add endTime
  duration: number;
  source: string;
  sourceUrl?: string;
  sourceType?: string;
  thumbnail?: string;
  layer: number;
  layerId?: string;
  properties?: {
    visible?: boolean;
    locked?: boolean;
    muted?: boolean;
    [key: string]: unknown;
  };
  keyframes?: TimelineKeyframe[];
  data?: {
    imageUrl?: string;
    slideData?: {
      backgroundImage?: string;
      [key: string]: unknown;
    };
    volume?: number;
    [key: string]: unknown;
  };
  metadata?: {
    hasError?: boolean;
    [key: string]: unknown;
  };
  visible?: boolean;
  locked?: boolean;
  muted?: boolean;
}

export interface TimelineLayer {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay' | 'subtitle' | 'effect';
  elements: TimelineElement[];
  visible: boolean;
  locked: boolean;
  isVisible?: boolean;
  isLocked?: boolean;
  height?: number;
  color?: string;
  parentId?: string;
  folded?: boolean;
}

export interface TimelineAudioClip {
  id: string;
  source: string;
  start: number;
  duration: number;
  volume?: number;
  muted?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TimelineAudioTrack {
  id: string;
  name: string;
  type: 'voiceover' | 'music' | 'sfx' | 'ambient' | 'effect';
  clips: TimelineAudioClip[];
  volume?: number;
  muted?: boolean;
  solo?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

export interface TimelineProject {
  id: string;
  name: string;
  duration: number;
  layers: TimelineLayer[];
  tracks?: TimelineTrack[];
  audioTracks?: TimelineAudioTrack[];
  currentTime: number;
  zoomLevel: number;
  resolution: { width: number; height: number };
  fps: number;
  framerate?: number;
  markers?: TimelineMarker[];
  isPlaying?: boolean;
  selectedElementIds?: string[];
  clipboardElements?: TimelineElement[];
  settings?: Record<string, unknown>;
  history?: {
    past: Array<Record<string, unknown>>;
    present: Record<string, unknown> | null;
    future: Array<Record<string, unknown>>;
  };
}

export interface TimelineSelection {
  elementIds: string[];
  layerIds: string[];
  startTime: number;
  endTime: number;
}

export type TimelineAction =
  | { type: 'ADD_ELEMENT'; element: TimelineElement; layerId: string }
  | { type: 'REMOVE_ELEMENT'; elementId: string }
  | { type: 'UPDATE_ELEMENT'; elementId: string; updates: Partial<TimelineElement> }
  | { type: 'MOVE_ELEMENT'; elementId: string; newStartTime: number; newLayerId?: string }
  | { type: 'RESIZE_ELEMENT'; elementId: string; newDuration: number }
  | { type: 'ADD_KEYFRAME'; elementId: string; keyframe: TimelineKeyframe }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_ZOOM_LEVEL'; zoomLevel: number }
  | { type: 'SET_SELECTION'; selection: TimelineSelection }
  | { type: 'ADD_LAYER'; layer: TimelineLayer }
  | { type: 'REMOVE_LAYER'; layerId: string }
  | { type: 'UPDATE_LAYER'; layerId: string; updates: Partial<TimelineLayer> }
  | { type: 'COPY_ELEMENTS'; elementIds: string[] }
  | { type: 'PASTE_ELEMENTS'; targetTime: number; targetLayerId: string };

// Legacy types for compatibility with use-timeline-real.ts
export interface Clip {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  name?: string;
  type?: TrackType;
  content?: {
    thumbnail?: string;
    [key: string]: unknown;
  };
  volume?: number;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  [key: string]: unknown;
}

export interface Track {
  id: string;
  clips: Clip[];
  height: number;
  name?: string;
  type?: string;
  [key: string]: unknown;
}

export interface Timeline {
  id: string;
  projectId: string;
  tracks: Track[];
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  currentTime: number;
  playing: boolean;
  loop: boolean;
  zoom: number;
  scrollPosition: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface TimelineConfig {
  defaultTrackHeight: number;
  snapToGrid: boolean;
  gridSize: number;
  pixelsPerSecond: number;
  [key: string]: unknown;
}

export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  defaultTrackHeight: 100,
  snapToGrid: true,
  gridSize: 1,
  pixelsPerSecond: 50,
};

export interface TimelineManipulation {
  addTrack: (trackData: Omit<Track, 'id' | 'clips'>) => Track;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, data: Partial<Track>) => void;
  reorderTracks: (trackIds: string[]) => void;
  addClip: (trackId: string, clipData: Omit<Clip, 'id' | 'trackId'>) => Clip;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, data: Partial<Clip>) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  splitClip: (clipId: string, splitTime: number) => [Clip, Clip] | null;
  duplicateClip: (clipId: string) => Clip | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (zoom: number) => void;
  save: () => Promise<void>;
  load: () => Promise<void>;
}

export interface DragData {
  type: 'element' | 'layer' | 'timeline';
  sourceId: string;
  sourceType?: string;
  data: Record<string, unknown>;
  thumbnail?: string;
  layerId?: string;
  time?: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: string;
  layers: TimelineLayer[];
  isCollapsed?: boolean;
  height?: number;
  color?: string;
  visible?: boolean;
  locked?: boolean;
}
