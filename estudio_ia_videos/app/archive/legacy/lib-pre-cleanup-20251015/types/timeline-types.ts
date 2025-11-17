/**
 * Advanced Timeline Types for Video Editor
 * Based on Motionity architecture with React integration and PPTX/Avatar support
 */

// ====================== ENHANCED CORE TIMELINE TYPES ======================

export type TimelineElementType = 
  | 'video' 
  | 'audio' 
  | 'text' 
  | 'image' 
  | 'shape' 
  | 'transition' 
  | 'effect'
  | 'avatar-3d'
  | 'pptx-slide';

export interface TimelineKeyframe {
  id: string
  time: number // timestamp in milliseconds for precision
  timestamp: number // alias for compatibility
  property: string // e.g., 'opacity', 'scale', 'position.x'
  value: any
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'bezier'
  interpolation?: 'linear' | 'bezier' | 'step'
  bezierPoints?: [number, number, number, number] // for custom bezier curves
}

export interface TimelineProperty {
  id: string
  name: string
  type: 'number' | 'color' | 'text' | 'boolean' | 'vector2' | 'vector3' | 'transform'
  keyframes: TimelineKeyframe[]
  defaultValue: any
  animatable: boolean
}

export interface TimelineElement {
  id: string
  type: TimelineElementType
  name: string
  layerId: string
  startTime: number
  duration: number
  endTime: number
  
  // Transform properties
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  
  // Element-specific properties
  properties: TimelineProperty[]
  
  // Metadata
  locked: boolean
  visible: boolean
  muted?: boolean
  color?: string
  thumbnail?: string
  
  // Source data
  sourceUrl?: string
  sourceType?: string
  metadata?: Record<string, unknown>
}

export interface TimelineLayer {
  id: string
  name: string
  type: 'video' | 'audio' | 'overlay' | 'subtitle' | '3d-scene'
  elements: TimelineElement[]
  locked: boolean
  visible: boolean
  height: number
  color: string
  order: number
  parentId?: string // para layers hierárquicas
  folded?: boolean // para UI
}

export interface TimelineMarker {
  id: string
  time: number
  name: string
  color: string
  type: 'chapter' | 'bookmark' | 'cut-point' | 'review'
  notes?: string
}

export interface TimelineTrack {
  id: string
  name: string
  layers: TimelineLayer[]
  type: 'main' | 'audio' | 'subtitle' | 'effect' | 'overlay'
  locked: boolean
  solo?: boolean
  muted?: boolean
}

// ====================== TIMELINE PROJECT ======================

export interface TimelineProject {
  id: string
  name: string
  duration: number // duração total em milissegundos
  fps: number // framerate
  framerate: number // alias for compatibility
  resolution: {
    width: number
    height: number
  }
  
  // Playback control
  currentTime: number
  zoomLevel: number
  selectedElementIds: string[]
  clipboardElements: TimelineElement[]
  
  // Timeline composition
  layers: TimelineLayer[]
  tracks?: TimelineTrack[]
  markers?: TimelineMarker[]
  
  // Timeline state
  isPlaying?: boolean
  loop?: boolean
  volume?: number
  
  // Canvas/Preview settings
  zoom?: number
  scrollX?: number
  previewQuality?: 'draft' | 'preview' | 'full'
  
  // Project metadata
  createdAt?: Date
  updatedAt?: Date
  version?: string
  thumbnail?: string
  
  // Settings
  settings?: {
    backgroundColor: string
    audioSampleRate: number
    videoBitrate: number
    audioBitrate: number
  }
  
  // History
  history?: {
    past: any[]
    present: TimelineProject
    future: any[]
  }
  
  // Collaboration
  collaborators?: TimelineCollaborator[]
  permissions?: TimelinePermissions
}

// ====================== CANVAS & PREVIEW ======================

export interface CanvasViewport {
  width: number
  height: number
  zoom: number
  offsetX: number
  offsetY: number
  grid: boolean
  guides: boolean
  safeArea: boolean
}

export interface PreviewSettings {
  quality: 'draft' | 'preview' | 'full'
  framerate: number
  renderRegion?: {
    start: number
    end: number
  }
  realtime: boolean
}

// ====================== DRAG & DROP ======================

export interface DragData {
  type: 'element' | 'layer' | 'asset' | 'keyframe'
  sourceId: string
  sourceType: string
  data: any
  thumbnail?: string
}

export interface DropTarget {
  type: 'timeline' | 'layer' | 'canvas' | 'trash'
  layerId?: string
  time?: number
  position?: { x: number; y: number }
}

// ====================== PPTX INTEGRATION ======================

export interface PPTXTimelineSlide extends TimelineElement {
  type: 'pptx-slide'
  slideNumber: number
  slideTitle: string
  slideContent: string
  animations: PPTXAnimation[]
  narration?: {
    text: string
    voiceId: string
    audioUrl: string
    duration: number
  }
  transitions: {
    in: PPTXTransition
    out: PPTXTransition
  }
}

export interface PPTXAnimation {
  id: string
  type: 'fade-in' | 'slide-in' | 'zoom' | 'rotate' | 'custom'
  startTime: number
  duration: number
  target: string // CSS selector ou element ID
  properties: Record<string, unknown>
  easing: string
}

export interface PPTXTransition {
  type: 'fade' | 'slide' | 'zoom' | 'flip' | 'none'
  duration: number
  direction?: 'left' | 'right' | 'up' | 'down'
  easing: string
}

// ====================== 3D AVATAR INTEGRATION ======================

export interface Avatar3DElement extends TimelineElement {
  type: 'avatar-3d'
  avatarId: string
  modelUrl: string
  animationClips: Avatar3DClip[]
  lipSync?: {
    audioUrl: string
    visemes: Viseme[]
    accuracy: number
  }
  emotions: EmotionKeyframe[]
  lighting: LightingSetup
  camera: CameraSetup
}

export interface Avatar3DClip {
  id: string
  name: string
  startTime: number
  duration: number
  clipUrl: string
  loop: boolean
  blendWeight: number
}

export interface Viseme {
  time: number
  phoneme: string
  intensity: number
}

export interface EmotionKeyframe {
  time: number
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'fear'
  intensity: number
}

export interface LightingSetup {
  ambient: {
    color: string
    intensity: number
  }
  directional: {
    color: string
    intensity: number
    position: [number, number, number]
    target: [number, number, number]
  }
}

export interface CameraSetup {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  near: number
  far: number
}

// ====================== EFFECTS & FILTERS ======================

export interface TimelineEffect extends TimelineElement {
  type: 'effect'
  effectType: 'blur' | 'color-grade' | 'chromakey' | 'noise-reduction' | 'stabilization' | 'custom'
  parameters: EffectParameter[]
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light'
  intensity: number
}

export interface EffectParameter {
  name: string
  type: 'number' | 'color' | 'boolean' | 'select'
  value: any
  min?: number
  max?: number
  options?: string[]
  animatable: boolean
}

// ====================== COLLABORATION ======================

export interface TimelineCollaborator {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  isOnline: boolean
  cursor?: {
    time: number
    layerId?: string
    elementId?: string
  }
  lastActivity: Date
}

export interface TimelinePermissions {
  canEdit: boolean
  canComment: boolean
  canExport: boolean
  canInvite: boolean
  canDelete: boolean
}

export interface TimelineComment {
  id: string
  authorId: string
  time: number
  layerId?: string
  elementId?: string
  text: string
  resolved: boolean
  createdAt: Date
  replies?: TimelineComment[]
}

// ====================== EXPORT & RENDER ======================

export interface RenderSettings {
  format: 'mp4' | 'mov' | 'webm' | 'gif'
  resolution: {
    width: number
    height: number
  }
  framerate: number
  quality: 'draft' | 'good' | 'best'
  codec: 'h264' | 'h265' | 'vp9' | 'prores'
  bitrate?: number
  audio: {
    codec: 'aac' | 'mp3' | 'wav'
    bitrate: number
    sampleRate: number
  }
  range?: {
    start: number
    end: number
  }
  watermark?: {
    enabled: boolean
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity: number
    scale: number
  }
}

export interface RenderJob {
  id: string
  projectId: string
  settings: RenderSettings
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
  outputUrl?: string
  fileSize?: number
  duration?: number
}

// ====================== TEMPLATES ======================

export interface TimelineTemplate {
  id: string
  name: string
  description: string
  category: 'corporate' | 'education' | 'social' | 'marketing' | 'presentation'
  duration: number
  resolution: {
    width: number
    height: number
  }
  thumbnail: string
  previewUrl?: string
  
  // Template structure
  tracks: TimelineTrack[]
  placeholders: TemplatePlaceholder[]
  
  // Metadata
  createdBy: string
  createdAt: Date
  downloads: number
  rating: number
  tags: string[]
}

export interface TemplatePlaceholder {
  id: string
  type: 'text' | 'image' | 'video' | 'logo' | 'color'
  name: string
  description: string
  elementId: string // ID do elemento na timeline
  required: boolean
  defaultValue?: any
}

// ====================== UTILITIES ======================

export interface TimelineSelection {
  elements: string[]
  layers: string[]
  keyframes: string[]
  time?: number
}

export interface TimelineHistory {
  id: string
  action: string
  description: string
  timestamp: Date
  userId: string
  data: any
  canUndo: boolean
  canRedo: boolean
}

export interface TimelineSettings {
  snapToGrid: boolean
  snapToKeyframes: boolean
  snapToMarkers: boolean
  snapToElements: boolean
  gridSize: number
  timeFormat: 'seconds' | 'frames' | 'timecode'
  autoSave: boolean
  autoSaveInterval: number
  previewWhileDragging: boolean
  showWaveforms: boolean
  showThumbnails: boolean
}

// ====================== TIMELINE ACTIONS ======================

export type TimelineAction = 
  | { type: 'ADD_ELEMENT'; layerId: string; element: TimelineElement }
  | { type: 'REMOVE_ELEMENT'; elementId: string }
  | { type: 'UPDATE_ELEMENT'; elementId: string; updates: Partial<TimelineElement> }
  | { type: 'MOVE_ELEMENT'; elementId: string; newPosition: { layerId: string; startTime: number } }
  | { type: 'DUPLICATE_ELEMENT'; elementId: string }
  | { type: 'ADD_LAYER'; layer: TimelineLayer }
  | { type: 'REMOVE_LAYER'; layerId: string }
  | { type: 'UPDATE_LAYER'; layerId: string; updates: Partial<TimelineLayer> }
  | { type: 'REORDER_LAYERS'; layerIds: string[] }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_SELECTION'; elementIds: string[] }
  | { type: 'ADD_TO_SELECTION'; elementIds: string[] }
  | { type: 'REMOVE_FROM_SELECTION'; elementIds: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'COPY_ELEMENTS'; elementIds: string[] }
  | { type: 'PASTE_ELEMENTS'; layerId: string; time: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; layerId: string }
  | { type: 'TOGGLE_LAYER_LOCK'; layerId: string };

// ====================== MAIN TIMELINE INTERFACE ======================

export interface Timeline {
  project: TimelineProject
  selection: TimelineSelection
  history: TimelineHistory[]
  settings: TimelineSettings
  canvas: CanvasViewport
  preview: PreviewSettings
}