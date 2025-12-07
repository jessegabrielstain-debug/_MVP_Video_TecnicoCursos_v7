import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// --- Types ---

export interface TimelineElement {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'shape' | 'avatar';
  name: string;
  startTime: number;
  duration: number;
  content: string | null;
  properties: {
    volume?: number;
    opacity?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    scale?: number;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    avatarId?: string;
    emotion?: string;
    emotionIntensity?: number;
    gesture?: string;
    gestureIntensity?: number;
    [key: string]: any;
  };
  keyframes?: Keyframe[];
  locked: boolean;
  visible: boolean;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'composite' | 'avatar';
  elements: TimelineElement[];
  height: number;
  color: string;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  volume: number;
  collapsed: boolean;
}

export interface Keyframe {
  id: string;
  time: number;
  property: string;
  value: any;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface TimelineProject {
  id: string;
  name: string;
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  tracks: TimelineTrack[];
  currentTime: number;
  zoom: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
}

interface TimelineState extends TimelineProject {
  // Actions
  setProject: (project: TimelineProject) => void;
  setPlayhead: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setZoom: (zoom: number) => void;
  
  // Track Actions
  addTrack: (track: TimelineTrack) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  
  // Element Actions
  addElement: (trackId: string, element: TimelineElement) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<TimelineElement>) => void;
  moveElement: (elementId: string, targetTrackId: string, newStartTime: number) => void;
  
  // Selection
  selectedElementIds: string[];
  selectElement: (elementId: string, multi?: boolean) => void;
  clearSelection: () => void;
}

// --- Store ---

export const useTimelineStore = create<TimelineState>()(
  immer((set) => ({
    // Initial State
    id: 'new-project',
    name: 'Untitled Project',
    duration: 60,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    tracks: [],
    currentTime: 0,
    zoom: 1,
    isPlaying: false,
    volume: 1,
    muted: false,
    selectedElementIds: [],

    // Actions
    setProject: (project) => set((state) => {
      Object.assign(state, project);
    }),

    setPlayhead: (time) => set((state) => {
      state.currentTime = Math.max(0, Math.min(time, state.duration));
    }),

    setIsPlaying: (isPlaying) => set((state) => {
      state.isPlaying = isPlaying;
    }),

    setZoom: (zoom) => set((state) => {
      state.zoom = Math.max(0.1, Math.min(3, zoom));
    }),

    // Track Actions
    addTrack: (track) => set((state) => {
      state.tracks.push(track as any); // Cast to avoid deep type issues with immer
    }),

    removeTrack: (trackId) => set((state) => {
      state.tracks = state.tracks.filter(t => t.id !== trackId);
    }),

    updateTrack: (trackId, updates) => set((state) => {
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        Object.assign(track, updates);
      }
    }),

    // Element Actions
    addElement: (trackId, element) => set((state) => {
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.elements.push(element as any);
      }
    }),

    removeElement: (elementId) => set((state) => {
      state.tracks.forEach(track => {
        track.elements = track.elements.filter(e => e.id !== elementId);
      });
      state.selectedElementIds = state.selectedElementIds.filter(id => id !== elementId);
    }),

    updateElement: (elementId, updates) => set((state) => {
      for (const track of state.tracks) {
        const element = track.elements.find(e => e.id === elementId);
        if (element) {
          Object.assign(element, updates);
          break;
        }
      }
    }),

    moveElement: (elementId, targetTrackId, newStartTime) => set((state) => {
      let element: TimelineElement | undefined;
      // Find and remove from source track
      for (const track of state.tracks) {
        const index = track.elements.findIndex(e => e.id === elementId);
        if (index !== -1) {
          element = track.elements[index];
          track.elements.splice(index, 1);
          break;
        }
      }

      // Add to target track
      if (element) {
        const targetTrack = state.tracks.find(t => t.id === targetTrackId);
        if (targetTrack) {
          element.startTime = Math.max(0, newStartTime);
          targetTrack.elements.push(element as any);
        }
      }
    }),

    // Selection
    selectElement: (elementId, multi = false) => set((state) => {
      if (multi) {
        if (state.selectedElementIds.includes(elementId)) {
          state.selectedElementIds = state.selectedElementIds.filter(id => id !== elementId);
        } else {
          state.selectedElementIds.push(elementId);
        }
      } else {
        state.selectedElementIds = [elementId];
      }
    }),

    clearSelection: () => set((state) => {
      state.selectedElementIds = [];
    }),
  }))
);
