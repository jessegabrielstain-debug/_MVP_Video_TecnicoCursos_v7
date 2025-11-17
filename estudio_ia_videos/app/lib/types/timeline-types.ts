export type TimelineElementType = 'video' | 'audio' | 'image' | 'text' | 'pptx-slide' | 'shape' | 'effect' | 'transition' | 'avatar';

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
  duration: number;
  source: string;
  layer: number;
  layerId?: string;
  properties?: Record<string, unknown>;
  keyframes?: TimelineKeyframe[];
  data?: TimelineElementData;
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

export interface TimelineProject {
  id: string;
  name: string;
  duration: number;
  layers: TimelineLayer[];
  audioTracks?: TimelineAudioTrack[];
  currentTime: number;
  zoomLevel: number;
  resolution: { width: number; height: number };
  fps: number;
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
