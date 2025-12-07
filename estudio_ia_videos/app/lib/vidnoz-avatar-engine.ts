
export interface HyperRealisticAvatar {
  id: string;
  name: string;
  style: string;
  quality: string;
  thumbnailUrl: string;
  previewVideoUrl: string;
  lipSyncAccuracy: number;
  facialExpressions: number;
  languages: string[];
  clothing: {
    id: string;
    style: string;
    color: string;
    type: string;
  }[];
  emotions: {
    id: string;
    name: string;
    intensity: string;
  }[];
  gestureSet: string[];
}

export interface AvatarRenderJob {
  id: string;
  status: 'pending' | 'processing' | 'rendering' | 'completed' | 'error';
  progress: number;
  outputUrl?: string;
  error?: string;
  estimatedTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvatarGenerationOptions {
  avatarId: string;
  text: string;
  voiceSettings: {
    speed: number;
    pitch: number;
    emotion: string;
    emphasis: string[];
  };
  visualSettings: {
    emotion: string;
    gesture: string;
    clothing: string;
    background: string;
    lighting: 'soft' | 'natural' | 'professional' | 'dramatic';
    cameraAngle?: string;
  };
  outputSettings: {
    resolution: 'HD' | '4K' | '8K';
    fps: 24 | 30 | 60;
    format: 'mp4' | 'webm' | 'mov';
    duration: number;
  };
  projectSettings?: Record<string, unknown>;
  customization?: Record<string, unknown>;
}

// Mock implementation for the engine if needed elsewhere
export const vidnozEngine = {
  getAvatars: async (): Promise<HyperRealisticAvatar[]> => {
    return [];
  },
  generateVideo: async (options: AvatarGenerationOptions): Promise<AvatarRenderJob> => {
    return {
      id: 'mock-job-id',
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
  getJobStatus: async (jobId: string): Promise<AvatarRenderJob> => {
    return {
      id: jobId,
      status: 'processing',
      progress: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
};
