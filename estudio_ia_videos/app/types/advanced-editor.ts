/**
 * 🎬 Advanced Video Editor Types
 * Comprehensive type definitions for the Motionity-style video editor
 */

// Core Timeline Types
export interface TimelineProject {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
  timeline: TimelineState;
  tracks: TimelineTrack[];
  elements: TimelineElement[];
  metadata: ProjectMetadata;
}

export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
  duration: number;
  sampleRate: number;
  quality: QualityPreset;
  codec: VideoCodec;
  colorSpace: ColorSpace;
  background: BackgroundSettings;
}

export interface TimelineState {
  currentTime: number;
  zoom: number;
  isPlaying: boolean;
  loop: boolean;
  selectedElements: string[];
  clipboardElements: TimelineElement[];
  history: HistoryState[];
  historyIndex: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  visible: boolean;
  locked: boolean;
  muted?: boolean;
  solo?: boolean;
  height: number;
  color: string;
  elements: TimelineElement[];
  effects: TrackEffect[];
}

export interface TimelineElement {
  id: string;
  type: ElementType;
  name: string;
  startTime: number;
  duration: number;
  layer: number;
  trackId: string;
  visible: boolean;
  locked: boolean;
  selected: boolean;
  opacity: number;
  transform: Transform;
  properties: ElementProperties;
  animations: AnimationSet;
  effects: ElementEffect[];
  metadata: ElementMetadata;
}

// Animation System Types
export interface AnimationSet {
  [propertyPath: string]: AnimationTrack;
}

export interface AnimationTrack {
  id: string;
  property: string;
  type: PropertyType;
  keyframes: Keyframe[];
  defaultValue: unknown;
  enabled: boolean;
  color: string;
  interpolation: InterpolationType;
  extrapolation: ExtrapolationType;
}

export interface Keyframe {
  id: string;
  time: number;
  value: unknown;
  easing: EasingType;
  interpolation: InterpolationType;
  tangentMode: TangentMode;
  inTangent?: Vector2;
  outTangent?: Vector2;
  selected?: boolean;
  locked?: boolean;
}

// Transform and Spatial Types
export interface Transform {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  anchor: Vector3;
  skew: Vector2;
  perspective: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

// Element Properties
export interface ElementProperties {
  // Text Properties
  text?: TextProperties;
  
  // Media Properties
  media?: MediaProperties;
  
  // Shape Properties
  shape?: ShapeProperties;
  
  // Audio Properties
  audio?: AudioProperties;
  
  // Avatar Properties
  avatar?: AvatarProperties;
  
  // Common Properties
  blendMode?: BlendMode;
  mask?: MaskProperties;
  motionBlur?: MotionBlurProperties;
}

export interface TextProperties {
  content: string;
  font: FontSettings;
  style: TextStyle;
  layout: TextLayout;
  animation: TextAnimationSettings;
}

export interface FontSettings {
  family: string;
  size: number;
  weight: number;
  style: FontStyle;
  variant: FontVariant;
  stretch: FontStretch;
}

export interface TextStyle {
  fill: ColorGradient;
  stroke: StrokeSettings;
  shadow: ShadowSettings;
  background: BackgroundSettings;
  outline: OutlineSettings;
}

export interface MediaProperties {
  source: MediaSource;
  crop: CropSettings;
  filters: MediaFilter[];
  playback: PlaybackSettings;
}

export interface ShapeProperties {
  type: ShapeType;
  path: PathData;
  fill: ColorGradient;
  stroke: StrokeSettings;
  shadow: ShadowSettings;
  cornerRadius: number[];
}

export interface AudioProperties {
  source: AudioSource;
  volume: number;
  pitch: number;
  speed: number;
  effects: AudioEffect[];
  visualization: AudioVisualizationSettings;
}

export interface AvatarProperties {
  model: AvatarModel;
  animation: AvatarAnimation;
  voice: VoiceSettings;
  expressions: ExpressionSettings;
  lighting: LightingSettings;
}

// Effects System
export interface ElementEffect {
  id: string;
  name: string;
  type: EffectType;
  enabled: boolean;
  parameters: EffectParameters;
  blendMode: BlendMode;
  opacity: number;
}

export interface TrackEffect {
  id: string;
  name: string;
  type: TrackEffectType;
  enabled: boolean;
  parameters: EffectParameters;
  wetDryMix: number;
}

export interface EffectParameters {
  [key: string]: unknown;
}

// Color and Styling
export interface ColorGradient {
  type: GradientType;
  colors: ColorStop[];
  angle?: number;
  center?: Vector2;
  radius?: number;
}

export interface ColorStop {
  color: Color;
  position: number;
  opacity: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface StrokeSettings {
  color: ColorGradient;
  width: number;
  style: StrokeStyle;
  cap: StrokeCap;
  join: StrokeJoin;
  dashArray?: number[];
  dashOffset?: number;
}

export interface ShadowSettings {
  color: Color;
  offset: Vector2;
  blur: number;
  spread: number;
  inset: boolean;
}

export interface BackgroundSettings {
  type: BackgroundType;
  color?: ColorGradient;
  image?: string;
  video?: string;
  opacity: number;
}

// Enums
export type QualityPreset = 'draft' | 'preview' | 'high' | 'ultra';
export type VideoCodec = 'h264' | 'h265' | 'vp9' | 'av1' | 'prores';
export type ColorSpace = 'srgb' | 'rec709' | 'rec2020' | 'p3';
export type TrackType = 'video' | 'audio' | 'subtitle' | 'effects' | 'adjustment';
export type ElementType = 'text' | 'image' | 'video' | 'audio' | 'shape' | 'avatar' | 'composition';

export type PropertyType = 
  | 'number' 
  | 'vector2' 
  | 'vector3' 
  | 'vector4' 
  | 'color' 
  | 'boolean' 
  | 'string' 
  | 'enum' 
  | 'path' 
  | 'gradient'
  | 'transform'
  | 'opacity'
  | 'rotation'
  | 'scale'
  | 'position';

export type EasingType = 
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'
  | 'back'
  | 'spring'
  | 'anticipate'
  | 'overshoot'
  | 'custom';

export type InterpolationType = 
  | 'discrete'
  | 'linear'
  | 'bezier'
  | 'spline'
  | 'ease'
  | 'hold';

export type ExtrapolationType = 
  | 'constant'
  | 'linear'
  | 'cycle'
  | 'cycle-offset'
  | 'ping-pong'
  | 'bounce';

export type TangentMode = 
  | 'auto'
  | 'smooth'
  | 'linear'
  | 'step'
  | 'broken';

export type BlendMode = 
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type ShapeType = 
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'polygon'
  | 'star'
  | 'path'
  | 'text-path';

export type FontStyle = 'normal' | 'italic' | 'oblique';
export type FontVariant = 'normal' | 'small-caps';
export type FontStretch = 'normal' | 'condensed' | 'expanded';

export type GradientType = 'linear' | 'radial' | 'conic' | 'diamond';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type StrokeCap = 'butt' | 'round' | 'square';
export type StrokeJoin = 'miter' | 'round' | 'bevel';
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video' | 'transparent';

export type EffectType = 
  | 'blur'
  | 'sharpen'
  | 'noise'
  | 'distortion'
  | 'color-correction'
  | 'glow'
  | 'shadow'
  | 'warp'
  | 'displacement'
  | 'particle'
  | 'light-leak'
  | 'vignette'
  | 'chromatic-aberration';

export type TrackEffectType = 
  | 'reverb'
  | 'delay'
  | 'chorus'
  | 'compressor'
  | 'eq'
  | 'distortion'
  | 'filter'
  | 'gate'
  | 'limiter';

// Additional Interfaces
export interface ProjectMetadata {
  author: string;
  description: string;
  tags: string[];
  thumbnail?: string;
  exportSettings: ExportSettings[];
}

export interface ElementMetadata {
  source?: string;
  originalDuration?: number;
  fileSize?: number;
  format?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface HistoryState {
  id: string;
  action: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface ExportSettings {
  name: string;
  format: string;
  resolution: Vector2;
  fps: number;
  quality: number;
  codec: string;
  bitrate?: number;
}

export interface MediaSource {
  url: string;
  type: 'image' | 'video';
  duration?: number;
  dimensions?: Vector2;
}

export interface AudioSource {
  url: string;
  duration: number;
  sampleRate: number;
  channels: number;
}

export interface PathData {
  commands: PathCommand[];
  closed: boolean;
}

export interface PathCommand {
  type: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';
  points: number[];
}

export interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlaybackSettings {
  speed: number;
  loop: boolean;
  reverse: boolean;
  startTime: number;
  endTime: number;
}

export interface MediaFilter {
  type: string;
  parameters: Record<string, unknown>;
}

export interface AudioEffect {
  type: string;
  parameters: Record<string, unknown>;
}

export interface AudioVisualizationSettings {
  type: 'waveform' | 'spectrum' | 'bars';
  sensitivity: number;
  smoothing: number;
  color: ColorGradient;
}

export interface AvatarModel {
  id: string;
  name: string;
  meshUrl: string;
  textureUrl: string;
  rigUrl: string;
}

export interface AvatarAnimation {
  type: 'idle' | 'talking' | 'gesture' | 'custom';
  data: Record<string, unknown>;
}

export interface VoiceSettings {
  voice: string;
  pitch: number;
  speed: number;
  volume: number;
}

export interface ExpressionSettings {
  happiness: number;
  sadness: number;
  anger: number;
  surprise: number;
  fear: number;
  disgust: number;
}

export interface LightingSettings {
  ambient: Color;
  directional: DirectionalLight[];
  point: PointLight[];
  spot: SpotLight[];
}

export interface DirectionalLight {
  color: Color;
  intensity: number;
  direction: Vector3;
}

export interface PointLight {
  color: Color;
  intensity: number;
  position: Vector3;
  range: number;
}

export interface SpotLight {
  color: Color;
  intensity: number;
  position: Vector3;
  direction: Vector3;
  angle: number;
  range: number;
}

export interface TextLayout {
  alignment: 'left' | 'center' | 'right' | 'justify';
  verticalAlignment: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface TextAnimationSettings {
  typewriter: boolean;
  typewriterSpeed: number;
  reveal: 'none' | 'fade' | 'slide' | 'scale' | 'rotate';
  revealDuration: number;
  characterAnimation: boolean;
}

export interface OutlineSettings {
  width: number;
  color: ColorGradient;
  style: StrokeStyle;
}

export interface MaskProperties {
  type: 'alpha' | 'luminance' | 'red' | 'green' | 'blue';
  source: string;
  invert: boolean;
  feather: number;
}

export interface MotionBlurProperties {
  enabled: boolean;
  samples: number;
  shutterAngle: number;
  adaptiveSampleLimit: number;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type KeyframeValue<T = unknown> = {
  time: number;
  value: T;
  easing?: EasingType;
  interpolation?: InterpolationType;
};

export type AnimationCurve<T = unknown> = KeyframeValue<T>[];