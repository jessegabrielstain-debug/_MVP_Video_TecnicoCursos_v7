export interface EditorElement {
  id: string;
  name: string;
  layerId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'shape' | 'avatar';
  position: {
    x: number;
    y: number;
    z: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  properties: Record<string, unknown>;
  animations: ElementAnimation[];
}

export interface TextElement extends EditorElement {
  type: 'text';
  properties: {
    content: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    color: string;
    backgroundColor?: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
    letterSpacing: number;
    textShadow?: string;
    borderRadius?: number;
    padding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

export interface ImageElement extends EditorElement {
  type: 'image';
  properties: {
    src: string;
    alt: string;
    fit: 'cover' | 'contain' | 'fill' | 'scale-down';
    borderRadius?: number;
    filter?: string;
    shadow?: string;
  };
}

export interface VideoElement extends EditorElement {
  type: 'video';
  properties: {
    src: string;
    poster?: string;
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    controls: boolean;
    startTime: number;
    endTime: number;
    volume: number;
  };
}

export interface AudioElement extends EditorElement {
  type: 'audio';
  properties: {
    src: string;
    autoplay: boolean;
    loop: boolean;
    volume: number;
    startTime: number;
    endTime: number;
    fadeIn: number;
    fadeOut: number;
  };
}

export interface ShapeElement extends EditorElement {
  type: 'shape';
  properties: {
    shape: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'line' | 'arrow';
    fill: string;
    stroke: string;
    strokeWidth: number;
    borderRadius?: number;
    points?: number[]; // Para polígonos
  };
}

export interface AvatarElement extends EditorElement {
  type: 'avatar';
  properties: {
    avatarId: string;
    pose: string;
    expression: string;
    clothing: string;
    background: string;
    lighting: string;
    animation: string;
    speech?: {
      text: string;
      voice: string;
      speed: number;
      pitch: number;
    };
  };
}

export interface ElementAnimation {
  id: string;
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'scale' | 'rotate' | 'bounce' | 'custom';
  duration: number;
  delay: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
  direction?: 'left' | 'right' | 'up' | 'down';
  repeat: number;
  yoyo: boolean;
  properties: Record<string, unknown>;
}

export interface EditorLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  expanded: boolean;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';
  elements: string[]; // IDs dos elementos
}

export interface EditorTimeline {
  duration: number;
  currentTime: number;
  playing: boolean;
  loop: boolean;
  keyframes: Keyframe[];
  markers: TimelineMarker[];
}

export interface Keyframe {
  id: string;
  time: number;
  elementId: string;
  properties: Record<string, unknown>;
  easing: string;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
  type: 'marker' | 'chapter' | 'cue';
}

export interface EditorState {
  elements: EditorElement[];
  layers: EditorLayer[];
  timeline: EditorTimeline;
  selectedElements: string[];
  clipboard: EditorElement[];
  history: EditorHistoryEntry[];
  historyIndex: number;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
    zoom: number;
    pan: { x: number; y: number };
  };
  tools: {
    activeTool: 'select' | 'text' | 'shape' | 'image' | 'video' | 'audio' | 'avatar';
    brush: {
      size: number;
      color: string;
      opacity: number;
    };
  };
  preview: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    showGrid: boolean;
    showRulers: boolean;
    showGuides: boolean;
  };
}

export interface EditorHistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  data: Record<string, unknown>;
  description: string;
}

export interface EditorSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  magneticGuides: boolean;
  defaultDuration: number;
  defaultTransition: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  shortcuts: Record<string, string>;
}

export interface EditorProject {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  version: string;
  state: EditorState;
  settings: EditorSettings;
  metadata: {
    duration: number;
    resolution: { width: number; height: number };
    frameRate: number;
    format: string;
    size: number;
    tags: string[];
  };
}

export interface DragDropItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  preview?: string;
}

export interface DropZone {
  id: string;
  accepts: string[];
  position: { x: number; y: number; width: number; height: number };
  active: boolean;
  highlight: boolean;
}

export interface EditorTool {
  id: string;
  name: string;
  icon: string;
  shortcut?: string;
  category: 'basic' | 'media' | 'shapes' | 'text' | 'effects';
  description: string;
  properties?: Record<string, unknown>;
}

export interface EditorPanel {
  id: string;
  title: string;
  icon: string;
  position: 'left' | 'right' | 'bottom';
  width?: number;
  height?: number;
  visible: boolean;
  collapsible: boolean;
  resizable: boolean;
  content: React.ComponentType<Record<string, unknown>>;
}

export interface EditorCommand {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category: string;
  execute: (state: EditorState, ...args: unknown[]) => EditorState;
  canExecute?: (state: EditorState) => boolean;
  icon?: string;
}

export interface EditorPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  tools?: EditorTool[];
  panels?: EditorPanel[];
  commands?: EditorCommand[];
  hooks?: {
    onElementCreate?: (element: EditorElement) => EditorElement;
    onElementUpdate?: (element: EditorElement) => EditorElement;
    onElementDelete?: (element: EditorElement) => void;
    onExport?: (project: EditorProject) => EditorProject;
  };
}