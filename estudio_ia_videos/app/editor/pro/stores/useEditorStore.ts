import { create } from 'zustand';

export interface CanvasElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  src?: string;
  text?: string;
  fill?: string;
  zIndex: number;
  // Timeline related properties
  startTime: number;
  duration: number;
  trackId: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  isMuted?: boolean;
  isHidden?: boolean;
}

interface EditorState {
  // Canvas State
  elements: CanvasElement[];
  selectedId: string | null;
  
  // Timeline State
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number; // Total project duration
  isPlaying: boolean;
  zoom: number; // Pixels per second
  
  // Subtitles State
  subtitles: SubtitleItem[];
  
  // Runtime Registry for Audio Mixing
  activeVideoElements: Map<string, HTMLVideoElement>;

  // Actions
  addElement: (element: Omit<CanvasElement, 'startTime' | 'duration' | 'trackId'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  selectElement: (id: string | null) => void;
  removeElement: (id: string) => void;
  
  // Timeline Actions
  addTrack: (track: TimelineTrack) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setZoom: (zoom: number) => void;

  // Subtitle Actions
  addSubtitle: (subtitle: SubtitleItem) => void;
  updateSubtitle: (id: string, updates: Partial<SubtitleItem>) => void;
  deleteSubtitle: (id: string) => void;

  // Registry Actions
  registerVideoElement: (id: string, element: HTMLVideoElement) => void;
  unregisterVideoElement: (id: string) => void;
}

export interface SubtitleItem {
  id: string;
  text: string;
  startTime: number; // ms
  endTime: number; // ms
  style?: {
      fontSize: number;
      fontFamily: string;
      fill: string;
      align: string;
      y?: number; // Normalized Y position (0-1)
  }
}

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  selectedId: null,
  
  tracks: [
    { id: 'track-1', name: 'Video 1', type: 'video' },
    { id: 'track-2', name: 'Audio 1', type: 'audio' }
  ],
  currentTime: 0,
  duration: 30000, 
  isPlaying: false,
  zoom: 100, 
  
  subtitles: [],
  activeVideoElements: new Map(),

  addElement: (element) => {
      const trackId = 'track-1';
      set((state) => ({ 
          elements: [...state.elements, {
              ...element,
              startTime: state.currentTime,
              duration: 5000, 
              trackId
          }] 
      }));
  },

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })),

  selectElement: (id) => set({ selectedId: id }),
  
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
  
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  setZoom: (zoom) => set({ zoom }),

  addSubtitle: (subtitle) => set((state) => ({ subtitles: [...state.subtitles, subtitle] })),
  
  updateSubtitle: (id, updates) => set((state) => ({
      subtitles: state.subtitles.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  deleteSubtitle: (id) => set((state) => ({
      subtitles: state.subtitles.filter(s => s.id !== id)
  })),

  registerVideoElement: (id, element) => {
      const map = get().activeVideoElements;
      map.set(id, element);
      // We don't trigger a re-render for this map update to avoid playing havoc, 
      // but we need to ensure the map is updated. 
      // Zustand shallow compare might ignore it if we don't clone.
      // But map is mutable.
      // Let's just mutate it in place effectively as it's a ref-like storage.
  },

  unregisterVideoElement: (id) => {
      const map = get().activeVideoElements;
      map.delete(id);
  }
}));
