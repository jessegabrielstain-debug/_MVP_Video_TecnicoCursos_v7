// Tipos específicos para substituir Record<string, any>
export interface EffectParameters {
  intensity?: number;
  duration?: number;
  color?: string;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  opacity?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface TimelineMetadata {
  source?: string;
  author?: string;
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface TimelineClip {
  id: string;
  name: string;
  startTime: number; // milliseconds
  duration: number; // milliseconds
  endTime: number; // milliseconds (calculated)
  trackId: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'transition';
  
  // Media properties
  mediaUrl?: string;
  thumbnailUrl?: string;
  
  // Transform properties
  transform?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
  };
  
  // Audio properties
  audio?: {
    volume: number;
    fadeIn: number;
    fadeOut: number;
    muted: boolean;
  };
  
  // Effects
  effects?: Array<{
    id: string;
    type: string;
    parameters: EffectParameters;
    enabled: boolean;
  }>;
  
  // Metadata
  metadata?: TimelineMetadata;
  
  // UI state
  selected?: boolean;
  locked?: boolean;
  collapsed?: boolean;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  clips: TimelineClip[];
  
  // Track properties
  muted?: boolean;
  locked?: boolean;
  visible?: boolean;
  volume?: number;
  
  // UI state
  collapsed?: boolean;
  color?: string;
}

export interface MagneticZone {
  id: string;
  trackId: string;
  position: number; // milliseconds
  type: 'beat' | 'marker' | 'cut' | 'transition';
  
  // Optional properties
  confidence?: number; // for beat detection
  intensity?: 'low' | 'medium' | 'high';
  name?: string;
  color?: string;
}

export interface TimelineState {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  duration: number; // milliseconds
  magneticZones?: MagneticZone[];
  
  // Playback state
  currentTime?: number;
  isPlaying?: boolean;
  playbackRate?: number;
  
  // Selection state
  selectedClips?: string[];
  selectedTracks?: string[];
  
  // Zoom and scroll
  zoomLevel?: number;
  scrollPosition?: number;
  
  // Magnetic timeline state
  magneticEnabled?: boolean;
  snapToBeats?: boolean;
  autoRippleEnabled?: boolean;
  gapClosingEnabled?: boolean;
  
  // Undo/redo
  history?: {
    past: TimelineState[];
    future: TimelineState[];
  };
  
  // Project metadata
  projectId?: string;
  userId?: string;
  lastSaved?: string;
  version?: number;
}

export interface TimelineOperation {
  id: string;
  type: 'move' | 'delete' | 'add' | 'trim' | 'split' | 'merge' | 'effect';
  clipIds: string[];
  trackIds: string[];
  parameters: OperationParameters;
  
  // For undo/redo
  previousState: TimelineState;
  newState: TimelineState;
  
  // Metadata
  timestamp: string;
  userId?: string;
  description?: string;
}

export interface TimelineExportOptions {
  format: 'json' | 'xml' | 'edl' | 'fcpxml' | 'aaf';
  includeMedia?: boolean;
  includeEffects?: boolean;
  includeTransitions?: boolean;
  quality?: 'draft' | 'preview' | 'final';
  
  // Specific formats
  edlOptions?: {
    frameRate: number;
    audioSampleRate: number;
    includeMarkers?: boolean;
  };
  
  fcpxmlOptions?: {
    version: string;
    includeMetadata?: boolean;
  };
}

export interface TimelineImportOptions {
  format: 'json' | 'xml' | 'edl' | 'fcpxml' | 'aaf';
  mergeMode?: 'replace' | 'append' | 'insert';
  
  // Media handling
  mediaMapping?: Record<string, string>; // oldPath -> newPath
  autoRelink?: boolean;
  
  // Validation
  validateClips?: boolean;
  fixOverlaps?: boolean;
  
  // Metadata
  preserveMarkers?: boolean;
  preserveEffects?: boolean;
}

export interface OperationParameters {
  position?: number;
  duration?: number;
  trackIndex?: number;
  offset?: number;
  trimStart?: number;
  trimEnd?: number;
  effectType?: string;
  effectConfig?: EffectParameters;
  [key: string]: string | number | EffectParameters | undefined;
}