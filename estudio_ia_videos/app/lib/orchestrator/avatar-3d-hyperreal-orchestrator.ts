export interface OrchestratorPayload {
  job_id: string;
  primary_image_url: string;
  input_images: string[];
  create_avatar: boolean;
  avatar_name: string;
  target_style: 'photorealistic' | 'stylized';
  locale: string;
  audio: {
    mode: string;
    tts: {
      voice_name: string;
      ssml: string;
    }
  };
  script_text_or_ssml: string;
  lip_sync_mode: string;
  emotion: {
    type: string;
    intensity: string;
  };
  motion_profile: {
    blink_rate: number;
    microexpressions: boolean;
  };
  render: {
    checkpoints: Record<string, unknown>[];
    await_approval_on: string[];
    resolution: string;
    fps: number;
  };
  mesh: {
    texture_resolution: string;
  };
  phoneme_align_accuracy: string;
  smoothing_frames: number;
  consent_confirmed: boolean;
  prefer_reuse_of_existing_modules: boolean;
  // Legacy fields support
  avatarId?: string;
  text?: string;
  voiceSettings?: Record<string, unknown>;
  videoOptions?: Record<string, unknown>;
  proFeatures?: Record<string, unknown>;
}

export interface CheckpointStatus {
  stage: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'awaiting_approval';
  progress_percentage: number;
  logs: string[];
  artifact_urls: string[];
  // Legacy
  id?: string;
  name?: string;
  progress?: number;
}

export interface ModuleCatalogEntry {
  module_name: string;
  status: string;
  readiness_score: number;
  capabilities: string[];
  api_endpoints: string[];
  integration_notes: string[];
  // Legacy
  id?: string;
  name?: string;
  description?: string;
  version?: string;
}

export interface OrchestratorResponse {
  job_id: string;
  job_status: string;
  checkpoints: CheckpointStatus[];
  artifact_urls: string[];
  metadata: {
    quality_metrics?: {
      lip_sync_accuracy: number;
      facial_expression_score: number;
      texture_fidelity: number;
    };
    // Legacy
    ttsData?: Record<string, unknown>;
  };
  modules_catalog: ModuleCatalogEntry[];
  // Legacy
  jobId?: string;
  status?: string;
  result?: Record<string, unknown>;
  error?: string;
}

class Avatar3DHyperOrchestrator {
  async process(payload: OrchestratorPayload): Promise<OrchestratorResponse> {
    console.log('Avatar3DHyperOrchestrator processing:', payload);
    return {
      job_id: payload.job_id || `job_${Date.now()}`,
      job_status: 'completed',
      checkpoints: [],
      artifact_urls: [],
      metadata: {},
      modules_catalog: [],
      // Legacy return structure for compatibility
      jobId: payload.job_id || `job_${Date.now()}`,
      status: 'completed',
      result: {
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        audioUrl: 'https://example.com/audio.mp3',
        duration: 10000,
        metadata: {
          ttsData: {
            phonemes: [],
            lipSyncAccuracy: 100,
            voice: 'default'
          }
        }
      }
    };
  }
}

export const avatar3DHyperOrchestrator = new Avatar3DHyperOrchestrator();
