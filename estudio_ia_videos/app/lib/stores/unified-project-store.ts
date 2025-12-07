import { create } from 'zustand';

export interface ProjectSlide {
  id: string;
  content: string;
  type: string;
  duration?: number;
  audioUrl?: string;
  title?: string;
  slideNumber?: number;
  animations?: unknown[];
  notes?: string;
  avatarConfig?: unknown;
  thumbnailUrl?: string;
  [key: string]: unknown;
}

export interface RenderConfig {
  resolution: string;
  fps: number;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  format: string;
  bitrate: number;
}

export interface TTSConfig {
  provider: string;
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  language?: string;
}

export interface Avatar3DConfig {
  id: string;
  name: string;
  model: string;
  gender: 'male' | 'female' | 'unisex';
  ethnicity: string;
  age: string;
  quality: 'standard' | 'premium' | 'cinematic' | 'hyperreal';
  customization?: {
    pose_style?: string;
    expression_intensity?: string;
    gesture_frequency?: string;
    eye_contact_level?: string;
    [key: string]: unknown;
  };
}

export interface UnifiedProject {
  id: string;
  name: string;
  type: 'video' | 'presentation' | 'interactive';
  slides: ProjectSlide[];
  currentSlideIndex: number;
  render?: RenderConfig;
  tts?: TTSConfig;
  avatar?: Avatar3DConfig;
  avatar3D?: boolean;
  duration?: number;
  metadata?: {
    embedCode?: string;
    [key: string]: unknown;
  };
  settings?: Record<string, unknown>;
  description?: string;
}

// ========================================
// Workflow Step Types
// ========================================
export type WorkflowStepType = 
  | 'upload'
  | 'process'
  | 'generate-tts'
  | 'generate-avatar'
  | 'render'
  | 'export'
  | 'publish';

export interface WorkflowStepData {
  stepType: WorkflowStepType;
  slideIds?: string[];
  config?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface UnifiedProjectStore {
  currentProject: UnifiedProject | null;
  isLoading: boolean;
  
  // Actions
  createProject: (data: Partial<UnifiedProject>) => Promise<void>;
  updateProject: (data: Partial<UnifiedProject>) => void;
  executeWorkflowStep: (step: WorkflowStepType, data: WorkflowStepData) => Promise<void>;
  saveProject: () => Promise<void>;
  
  // Legacy/Helper methods
  setProject: (project: UnifiedProject | null) => void;
  addSlide: (slide: ProjectSlide) => void;
  removeSlide: (index: number) => void;
  setCurrentSlide: (index: number) => void;
}

export const useUnifiedProjectStore = create<UnifiedProjectStore>((set, get) => ({
  currentProject: null,
  isLoading: false,

  createProject: async (data) => {
    set({ isLoading: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newProject: UnifiedProject = {
        id: crypto.randomUUID(),
        name: data.name || 'Untitled Project',
        type: data.type || 'video',
        slides: data.slides || [],
        currentSlideIndex: 0,
        ...data
      } as UnifiedProject;
      set({ currentProject: newProject });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: (data) => {
    set((state) => ({
      currentProject: state.currentProject ? { ...state.currentProject, ...data } : null
    }));
  },

  executeWorkflowStep: async (step: WorkflowStepType, data: WorkflowStepData) => {
    set({ isLoading: true });
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Executed step ${step} with data:`, data);
    } finally {
      set({ isLoading: false });
    }
  },

  saveProject: async () => {
    set({ isLoading: true });
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Project saved:', get().currentProject);
    } finally {
      set({ isLoading: false });
    }
  },

  setProject: (project) => set({ currentProject: project }),
  
  addSlide: (slide) => set((state) => {
    if (!state.currentProject) return state;
    return {
      currentProject: {
        ...state.currentProject,
        slides: [...state.currentProject.slides, slide]
      }
    };
  }),

  removeSlide: (index) => set((state) => {
    if (!state.currentProject) return state;
    return {
      currentProject: {
        ...state.currentProject,
        slides: state.currentProject.slides.filter((_, i) => i !== index)
      }
    };
  }),

  setCurrentSlide: (index) => set((state) => {
    if (!state.currentProject) return state;
    return {
      currentProject: {
        ...state.currentProject,
        currentSlideIndex: index
      }
    };
  })
}));
