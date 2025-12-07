/**
 * Avatar Engine
 * Orquestrador de rendering de avatares (escolhe engine apropriado)
 */

import { UE5AvatarEngine, UE5AvatarOptions } from './engines/ue5-avatar-engine';
import { LocalAvatarRenderer, AvatarConfig } from './local-avatar-renderer';
import { HeyGenAvatarEngine, HeyGenAvatarOptions } from './engines/heygen-avatar-engine';
import { LipSyncFrame, audio2FaceService } from './services/audio2face-service';
import { avatarRegistry, AvatarDefinition } from './avatars/avatar-registry';

export type { LipSyncFrame };

export interface Avatar3DModel extends AvatarDefinition {
  modelUrl?: string;
  lipSyncAccuracy?: number;
  ageRange?: string;
}

export type AvatarEngineType = 'ue5' | 'local' | 'heygen' | 'auto';

export interface RenderRequest {
  engine?: AvatarEngineType;
  duration: number;
  config: Partial<UE5AvatarOptions> & Partial<AvatarConfig> & Partial<HeyGenAvatarOptions>;
}

export type AvatarRenderResult = 
  | { type: 'frames', frames: Buffer[] }
  | { type: 'video', jobId: string, status: string, url?: string };

export interface ThreeMesh {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
}

export class AvatarEngine {
  private static instance: AvatarEngine;
  private ue5 = new UE5AvatarEngine();
  private local = new LocalAvatarRenderer();
  private heygen = new HeyGenAvatarEngine();
  
  static getInstance(): AvatarEngine {
    if (!AvatarEngine.instance) {
      AvatarEngine.instance = new AvatarEngine();
    }
    return AvatarEngine.instance;
  }
  
  getAllAvatars() {
    return avatarRegistry.getAll();
  }

  getAvatar(id: string): Avatar3DModel | undefined {
    const avatar = avatarRegistry.getById(id);
    if (!avatar) return undefined;
    
    const metadata = (avatar.metadata as Record<string, unknown>) || {};
    return {
      ...avatar,
      modelUrl: metadata.modelUrl as string | undefined,
      lipSyncAccuracy: (metadata.lipSyncAccuracy as number) || 95,
      ageRange: metadata.age_range as string | undefined
    };
  }
  
  async render(request: RenderRequest): Promise<AvatarRenderResult> {
    const engine = await this.selectEngine(request.engine);
    
    switch (engine) {
      case 'heygen':
        const heyGenResult = await this.heygen.render(request.config as HeyGenAvatarOptions);
        return { 
          type: 'video', 
          jobId: heyGenResult.jobId, 
          status: heyGenResult.status, 
          url: heyGenResult.videoUrl 
        };

      case 'ue5':
        const ue5Result = await this.ue5.render(request.config as UE5AvatarOptions, request.duration);
        return { type: 'frames', frames: ue5Result.frames };
        
      case 'local':
      default:
        const fps = 30;
        const totalFrames = Math.floor(request.duration * fps);
        const frames = await this.local.renderSequence(request.config as AvatarConfig, totalFrames);
        return { type: 'frames', frames };
    }
  }
  
  private async selectEngine(preferred?: AvatarEngineType): Promise<AvatarEngineType> {
    if (preferred === 'heygen') return 'heygen';

    if (preferred === 'ue5') {
      const available = await this.ue5.isAvailable();
      return available ? 'ue5' : 'local';
    }
    
    if (preferred === 'local') return 'local';
    
    // Auto: tenta UE5, fallback para local
    const ue5Available = await this.ue5.isAvailable();
    return ue5Available ? 'ue5' : 'local';
  }

  async checkHeyGenStatus(jobId: string) {
    return this.heygen.checkStatus(jobId);
  }

  async generateLipSyncFrames(text: string, audioUrl: string, duration: number): Promise<LipSyncFrame[]> {
    try {
      // Create a session
      const sessionId = await audio2FaceService.createSession();
      
      // Fetch audio
      let audioBuffer: Buffer;
      if (audioUrl.startsWith('http')) {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
      } else {
        // Fallback for local paths or data URIs if needed, or keep mock for testing if URL is invalid
        console.warn('Invalid audio URL for lip sync, using mock data:', audioUrl);
        audioBuffer = Buffer.from('mock-audio-data');
      }

      const result = await audio2FaceService.processAudio(sessionId, audioBuffer, {
        audioLengthMs: duration * 1000,
        includeMetrics: true
      });

      await audio2FaceService.destroySession(sessionId);

      if (result.success) {
        return result.lipSyncData;
      } else {
        // TypeScript narrowing should work here, but if not, we cast
        const errorMsg = 'error' in result ? result.error : 'Unknown error';
        console.error('LipSync generation failed:', errorMsg);
        return this.generateFallbackFrames(duration);
      }
    } catch (error) {
      console.error('Error generating lip sync frames:', error);
      return this.generateFallbackFrames(duration);
    }
  }

  private generateFallbackFrames(duration: number): LipSyncFrame[] {
    const fps = 30;
    const frames: LipSyncFrame[] = [];
    const totalFrames = Math.floor(duration * fps);
    
    for (let i = 0; i < totalFrames; i++) {
      frames.push({
        timestampMs: (i / fps) * 1000,
        phoneme: 'X',
        intensity: Math.random() * 0.5 + 0.2
      });
    }
    return frames;
  }

  getLipSyncFrameAtTime(frames: LipSyncFrame[], time: number): LipSyncFrame | undefined {
    if (!frames || frames.length === 0) return undefined;
    const timeMs = time; // time is already in ms from useLipSync
    // Find closest frame
    return frames.reduce((prev, curr) => {
      return (Math.abs(curr.timestampMs - timeMs) < Math.abs(prev.timestampMs - timeMs) ? curr : prev);
    });
  }

  applyBlendShapes(mesh: ThreeMesh, frame: LipSyncFrame, emotion?: string, emotionIntensity: number = 1.0) {
    if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    // 1. Reset all relevant morph targets first (optional, but good for safety)
    // This might be too heavy for every frame, so we rely on overwriting.

    // 2. Apply Lip Sync
    const map: Record<string, number | undefined> = {
      jawOpen: frame.jawOpen,
      mouthClose: frame.mouthClose,
      mouthFunnel: frame.mouthFunnel,
      mouthPucker: frame.mouthPucker,
      mouthLeft: frame.mouthLeft,
      mouthRight: frame.mouthRight,
      mouthRollLower: frame.mouthRollLower,
      tongueOut: frame.tongueOut,
      mouthSmile: frame.mouthSmile,
      mouthShrugUpper: frame.mouthShrugUpper
    };

    Object.entries(map).forEach(([name, value]) => {
      if (value !== undefined) {
        const index = mesh.morphTargetDictionary[name];
        if (index !== undefined) {
          mesh.morphTargetInfluences[index] = value;
        }
      }
    });
    
    // 3. Apply Emotion Overlay
    if (emotion && emotion !== 'neutral') {
      this.applyEmotion(mesh, emotion, emotionIntensity);
    }
  }

  private applyEmotion(mesh: ThreeMesh, emotion: string, intensity: number) {
    // Standard ARKit blend shapes for basic emotions
    const emotionMap: Record<string, Record<string, number>> = {
      happy: {
        mouthSmileLeft: 0.7,
        mouthSmileRight: 0.7,
        cheekSquintLeft: 0.5,
        cheekSquintRight: 0.5,
        eyeSquintLeft: 0.3,
        eyeSquintRight: 0.3
      },
      sad: {
        mouthFrownLeft: 0.7,
        mouthFrownRight: 0.7,
        browInnerUp: 0.8,
        eyeSquintLeft: 0.2,
        eyeSquintRight: 0.2
      },
      angry: {
        browDownLeft: 0.9,
        browDownRight: 0.9,
        mouthFrownLeft: 0.5,
        mouthFrownRight: 0.5,
        noseSneerLeft: 0.7,
        noseSneerRight: 0.7
      },
      surprised: {
        browOuterUpLeft: 0.8,
        browOuterUpRight: 0.8,
        eyeWideLeft: 0.6,
        eyeWideRight: 0.6,
        jawOpen: 0.2 // Slight mouth opening
      },
      fear: {
        browInnerUp: 0.8,
        browOuterUpLeft: 0.3,
        browOuterUpRight: 0.3,
        eyeWideLeft: 0.7,
        eyeWideRight: 0.7,
        mouthStretchLeft: 0.4,
        mouthStretchRight: 0.4
      }
    };

    const shapes = emotionMap[emotion];
    if (shapes) {
      Object.entries(shapes).forEach(([shapeName, targetValue]) => {
        const index = mesh.morphTargetDictionary[shapeName];
        if (index !== undefined) {
          // We add to existing value or overwrite? 
          // Usually for emotions we want to blend on top.
          // If lip sync uses the same shape (e.g. jawOpen in surprise), we need to be careful.
          // Simple approach: Max(existing, new) or weighted average.
          // Let's use a simple addition with clamping for now, or just overwrite if not set by lip sync.
          
          const existing = mesh.morphTargetInfluences[index];
          // Blend: existing (from lip sync) + emotion * intensity
          // For smiles, lip sync might set mouthSmile. We want to enhance it.
          mesh.morphTargetInfluences[index] = Math.min(1.0, existing + (targetValue * intensity));
        }
      });
    }
  }
}

export const avatarEngine = new AvatarEngine();
