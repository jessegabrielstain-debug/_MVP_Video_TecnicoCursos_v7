/**
 * Avatar Client Logic
 * Lógica de manipulação de avatar segura para execução no Browser (sem dependências de node/fs)
 */

import { LipSyncFrame } from './services/audio2face-service';
import { avatarRegistry, AvatarDefinition } from './avatars/avatar-registry';

export type { LipSyncFrame };

export interface Avatar3DModel extends AvatarDefinition {
  modelUrl?: string;
  lipSyncAccuracy?: number;
  ageRange?: string;
}

export interface ThreeMesh {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
}

export class AvatarClientHelper {
  
  static getAvatar(id: string): Avatar3DModel | undefined {
    const avatar = avatarRegistry.getById(id);
    if (!avatar) return undefined;
    
    const metadata = avatar.metadata as Record<string, unknown>;
    return {
      ...avatar,
      modelUrl: metadata.modelUrl as string,
      lipSyncAccuracy: (metadata.lipSyncAccuracy as number) || 95,
      ageRange: metadata.age_range as string
    };
  }
  
  static getLipSyncFrameAtTime(frames: LipSyncFrame[], time: number): LipSyncFrame | undefined {
    if (!frames || frames.length === 0) return undefined;
    const timeMs = time; // time is already in ms from useLipSync
    // Find closest frame
    return frames.reduce((prev, curr) => {
      return (Math.abs(curr.timestampMs - timeMs) < Math.abs(prev.timestampMs - timeMs) ? curr : prev);
    });
  }

  static generateFallbackFrames(duration: number): LipSyncFrame[] {
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

  static applyBlendShapes(mesh: ThreeMesh, frame: LipSyncFrame, emotion?: string, emotionIntensity: number = 1.0) {
    if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    // Apply Lip Sync
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
    
    // Apply Emotion Overlay
    if (emotion && emotion !== 'neutral') {
      AvatarClientHelper.applyEmotion(mesh, emotion, emotionIntensity);
    }
  }

  private static applyEmotion(mesh: ThreeMesh, emotion: string, intensity: number) {
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
        jawOpen: 0.2
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
          const existing = mesh.morphTargetInfluences[index];
          mesh.morphTargetInfluences[index] = Math.min(1.0, existing + (targetValue * intensity));
        }
      });
    }
  }
}
