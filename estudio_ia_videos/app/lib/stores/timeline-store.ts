import { create } from 'zustand';
import { logger } from '@/lib/logger';
import { DragData, TimelineSelection, TimelineProject, TimelineElement } from '../types/timeline-types';

// ========================================
// Collaborator Types
// ========================================
export interface Collaborator {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  color?: string;
  role: 'owner' | 'editor' | 'viewer';
  cursor?: CursorPosition;
  lastActive: Date;
}

export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
  timestamp: number;
}

// ========================================
// Render Job Types
// ========================================
export interface RenderJob {
  id: string;
  projectId: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  settings?: Record<string, unknown>;
}

// ========================================
// Element Update Types
// ========================================
export interface ElementUpdate {
  name?: string;
  start?: number;
  duration?: number;
  properties?: Record<string, unknown>;
  data?: Record<string, unknown>;
  visible?: boolean;
  locked?: boolean;
  muted?: boolean;
}

export interface TimelineState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  zoom: number;
  volume: number;
  canUndo: boolean;
  canRedo: boolean;
  project: TimelineProject | null;
  selection: TimelineSelection;
  dragData: DragData | null;
  scrollX: number;
  pixelsPerSecond: number;
  collaborators: Collaborator[];
  isDragging: boolean;
  beatMarkers: number[];
  continuousFlowEnabled: boolean;
}

export interface TimelineStore extends TimelineState {
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  play: () => void;
  pause: () => void;
  setZoom: (zoom: number) => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  stop: () => void;
  undo: () => void;
  redo: () => void;
  zoomToFit: () => void;
  saveProject: () => void;
  addRenderJob: (job: RenderJob) => void;
  selectElement: (id: string, multi?: boolean) => void;
  selectLayer: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  startDrag: (data: DragData) => void;
  endDrag: () => void;
  setScrollX: (scroll: number) => void;
  setPixelsPerSecond: (pps: number) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  removeCollaborator: (id: string) => void;
  loadProject: (project: TimelineProject) => void;
  addElement: (element: TimelineElement) => void;
  moveElement: (elementId: string, newLayerId: string, newTime: number) => void;
  updateElement: (elementId: string, updates: ElementUpdate) => void;
  setBeatMarkers: (markers: number[]) => void;
  enableContinuousFlow: (enabled: boolean) => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  zoom: 1,
  volume: 1,
  canUndo: false,
  canRedo: false,
  project: null,
  selection: { elementIds: [], layerIds: [], startTime: 0, endTime: 0 },
  dragData: null,
  scrollX: 0,
  pixelsPerSecond: 50,
  collaborators: [],
  isDragging: false,
   beatMarkers: [],
   continuousFlowEnabled: false,
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setZoom: (zoom) => set({ zoom }),
  setVolume: (volume) => set({ volume }),
  seekTo: (time) => set({ currentTime: time }),
  stop: () => set({ isPlaying: false, currentTime: 0 }),
  undo: () => logger.warn('Undo not implemented', { component: 'TimelineStore' }),
  redo: () => logger.warn('Redo not implemented', { component: 'TimelineStore' }),
  zoomToFit: () => set({ zoom: 1 }),
  saveProject: () => logger.warn('Save project not implemented', { component: 'TimelineStore' }),
  addRenderJob: (job) => logger.info('Add render job', { component: 'TimelineStore', job }),
  selectElement: (id, multi) => set((state) => ({
    selection: {
      ...state.selection,
      elementIds: multi ? [...state.selection.elementIds, id] : [id]
    }
  })),
  selectLayer: (id, multi) => set((state) => ({
    selection: {
      ...state.selection,
      layerIds: multi ? [...state.selection.layerIds, id] : [id]
    }
  })),
  clearSelection: () => set({ selection: { elementIds: [], layerIds: [], startTime: 0, endTime: 0 } }),
  startDrag: (data) => set({ dragData: data, isDragging: true }),
  endDrag: () => set({ dragData: null, isDragging: false }),
  setScrollX: (scroll) => set({ scrollX: scroll }),
  setPixelsPerSecond: (pps) => set({ pixelsPerSecond: pps }),
  addCollaborator: (collaborator) => set((state) => ({
    collaborators: [...state.collaborators, collaborator]
  })),
  removeCollaborator: (id) => set((state) => ({
    collaborators: state.collaborators.filter(c => c.id !== id)
  })),
  loadProject: (project) => set({ project }),
  addElement: (element) => logger.warn('Add element not implemented', { component: 'TimelineStore', element }),
  moveElement: (elementId, newLayerId, newTime) => logger.warn('Move element not implemented', { component: 'TimelineStore', elementId, newLayerId, newTime }),
  updateElement: (elementId, updates) => logger.warn('Update element not implemented', { component: 'TimelineStore', elementId, updates }),
   setBeatMarkers: (markers) => set({ beatMarkers: markers }),
   enableContinuousFlow: (enabled) => set({ continuousFlowEnabled: enabled }),
}));
