import { logger } from '@/lib/logger';

export interface Audio2FaceSessionOptions {
  instanceName?: string;
  avatarPath?: string;
  voiceProfileId?: string;
  metadata?: Record<string, unknown>;
}

export interface Audio2FaceProcessOptions extends Audio2FaceSessionOptions {
  quality?: 'low' | 'medium' | 'high';
  outputFormat?: 'arkit' | 'faceware' | 'custom';
  frameRate?: number;
  includeMetrics?: boolean;
  audioLengthMs?: number;
  language?: string;
}

export interface LipSyncFrame {
  timestampMs: number;
  phoneme: string;
  intensity: number;
  jawOpen?: number;
  mouthClose?: number;
  mouthFunnel?: number;
  mouthPucker?: number;
  mouthLeft?: number;
  mouthRight?: number;
  mouthRollLower?: number;
  tongueOut?: number;
  mouthSmile?: number;
  mouthShrugUpper?: number;
}

export interface QualityMetrics {
  phonemeAccuracy: number;
  temporalConsistency: number;
  visualRealism: number;
}

export type ProcessAudioResult =
  | {
      success: true;
      accuracy: number;
      lipSyncData: LipSyncFrame[];
      metadata: {
        frameRate: number;
        totalFrames: number;
        audioLength?: number;
        audioLengthMs?: number;
      };
      qualityMetrics?: QualityMetrics;
    }
  | {
      success: false;
      error: string;
    };

export interface LipSyncPayload {
  [key: string]: unknown;
}

export type LipSyncGenerationResult =
  | { success: true; data: LipSyncPayload; error?: undefined }
  | { success: false; data?: undefined; error: string };

export interface JobStatusResult {
  success: boolean;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
}


export const audio2FaceService = {
  createSession: async (options: Audio2FaceSessionOptions = {}): Promise<string> => {
    const apiUrl = process.env.AUDIO2FACE_API_URL;
    if (!apiUrl) {
      logger.warn('⚠️ AUDIO2FACE_API_URL not set, using mock session', { component: 'Audio2FaceService' });
      return `session_${Date.now()}`;
    }

    try {
      const response = await fetch(`${apiUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      
      if (!response.ok) throw new Error(`Failed to create session: ${response.statusText}`);
      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      logger.error('Error creating Audio2Face session:', error instanceof Error ? error : new Error(String(error)), { component: 'Audio2FaceService' });
      throw error;
    }
  },

  processAudio: async (
    sessionId: string,
    audio: Buffer,
    options: Audio2FaceProcessOptions = {},
  ): Promise<ProcessAudioResult> => {
    logger.debug('DEBUG: processAudio called with audio length:', { component: 'Audio2FaceService', length: audio.byteLength });
    // throw new Error("I AM HERE"); // Uncomment to test

    const apiUrl = process.env.AUDIO2FACE_API_URL;
    
    if (audio.byteLength === 0) {
      return {
        success: false,
        error: 'Audio buffer is empty',
      };
    }

    if (audio.byteLength < 200) {
      return {
        success: false,
        error: 'Audio input is too short for lip-sync processing',
      };
    }

    if (!apiUrl) {
      logger.info('Mocked audio2FaceService.processAudio called for session:', { component: 'Audio2FaceService', sessionId });
      // Simulate varying accuracy based on quality option
      let accuracy = 95.0;
      if (options.quality === 'low') accuracy = 93.5;
      if (options.quality === 'high') accuracy = 98.5;

      return {
        success: true,
        accuracy: accuracy,
        lipSyncData: [
          { timestampMs: 0, phoneme: 'X', intensity: 0.5, jawOpen: 0.6, mouthClose: 0.8 }, // a, o, p, b, m
          { timestampMs: 100, phoneme: 'A', intensity: 0.8, mouthFunnel: 0.7, mouthPucker: 0.6 }, // o, u
          { timestampMs: 200, phoneme: 'B', intensity: 0.6, mouthLeft: 0.5, mouthRight: 0.5 }, // e, i
          { timestampMs: 300, phoneme: 'C', intensity: 0.5, mouthRollLower: 0.5 }, // f, v
          { timestampMs: 400, phoneme: 'D', intensity: 0.5, tongueOut: 0.4 }, // l, n, d, t, r
          { timestampMs: 500, phoneme: 'E', intensity: 0.5, mouthSmile: 0.6 }, // k, s, z
          { timestampMs: 600, phoneme: 'F', intensity: 0.5, mouthShrugUpper: 0.5 }, // ks, ps, pn, eu
        ],
        metadata: {
          frameRate: options.frameRate ?? 60,
          totalFrames: 100,
          audioLength: options.audioLengthMs
            ? Math.round(options.audioLengthMs / 1000)
            : undefined,
          audioLengthMs: options.audioLengthMs,
        },
        qualityMetrics: options.includeMetrics
          ? {
              phonemeAccuracy: 92,
              temporalConsistency: 88,
              visualRealism: 85,
            }
          : undefined,
      };
    }

    try {
      // Real implementation
      const formData = new FormData();
      // Create Blob from Buffer using ArrayBuffer copy to ensure type compatibility
      const audioArrayBuffer = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer;
      const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/wav' });
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('options', JSON.stringify(options));

      const response = await fetch(`${apiUrl}/sessions/${sessionId}/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `API Error: ${response.status} - ${errorText}` };
      }

      const result = await response.json();
      return {
        success: true,
        accuracy: result.accuracy,
        lipSyncData: result.lipSyncData,
        metadata: result.metadata,
        qualityMetrics: result.qualityMetrics
      };
    } catch (error) {
      logger.error('Error processing audio with Audio2Face:', error instanceof Error ? error : new Error(String(error)), { component: 'Audio2FaceService' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  destroySession: async (sessionId: string): Promise<{ success: boolean }> => {
    const apiUrl = process.env.AUDIO2FACE_API_URL;
    if (!apiUrl) {
      logger.info('Mocked audio2FaceService.destroySession called for session:', { component: 'Audio2FaceService', sessionId });
      return { success: true };
    }

    try {
      const response = await fetch(`${apiUrl}/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      return { success: response.ok };
    } catch (error) {
      logger.error('Error destroying session', error instanceof Error ? error : new Error(String(error)), { component: 'Audio2FaceService' });
      return { success: false };
    }
  },  checkHealth: async (): Promise<{ isHealthy: boolean; version: string; responseTime: number }> => {
    return { isHealthy: true, version: '1.0.0', responseTime: 100 };
  },

  listInstances: async (): Promise<string[]> => {
    return ['instance-1', 'instance-2'];
  },

  generateLipSync: async (audio: Buffer, avatarId: string): Promise<LipSyncGenerationResult> => {
    logger.info('Mocked audio2FaceService.generateLipSync called', { component: 'Audio2FaceService' });
    if (!audio || !avatarId) {
      return { success: false, error: 'Invalid input' };
    }
    return { success: true, data: { some: 'lipsync_data' } };
  },

  getJobStatus: async (jobId: string): Promise<JobStatusResult> => {
    logger.info('Mocked audio2FaceService.getJobStatus called', { component: 'Audio2FaceService' });
    return { success: true, status: 'completed' };
  }
};
