/**
 * 🎬 Advanced Keyframes Engine - Motionity-style Animation System
 * Professional keyframe management with easing and interpolation
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

// Advanced Keyframe Types
interface KeyframeValue {
  id: string;
  time: number;
  value: unknown;
  easing: EasingType;
  interpolation: InterpolationType;
  selected?: boolean;
  locked?: boolean;
}

interface AnimationTrack {
  id: string;
  property: string;
  type: PropertyType;
  keyframes: KeyframeValue[];
  defaultValue: unknown;
  enabled: boolean;
  color: string;
}

type EasingType = 
  | 'linear' 
  | 'ease-in' 
  | 'ease-out' 
  | 'ease-in-out' 
  | 'bounce' 
  | 'elastic' 
  | 'back' 
  | 'spring' 
  | 'custom';

type InterpolationType = 'discrete' | 'linear' | 'bezier' | 'spline';

type PropertyType = 
  | 'number' 
  | 'color' 
  | 'position' 
  | 'rotation' 
  | 'scale' 
  | 'opacity' 
  | 'text' 
  | 'path';

// Advanced Easing Functions
const ADVANCED_EASING = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - Math.pow(1 - t, 2),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  back: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  spring: (t: number) => {
    return 1 - Math.exp(-6 * t) * Math.cos(10 * t);
  },
  custom: (t: number) => t // Default to linear for custom
};

interface AdvancedKeyframesEngineProps {
  elementId: string;
  tracks: AnimationTrack[];
  duration: number;
  currentTime: number;
  onTracksChange: (tracks: AnimationTrack[]) => void;
  onTimeChange: (time: number) => void;
}

export function useAdvancedKeyframes() {
  const [tracks, setTracks] = useState<AnimationTrack[]>([]);
  const [selectedKeyframes, setSelectedKeyframes] = useState<string[]>([]);
  const [copiedKeyframes, setCopiedKeyframes] = useState<KeyframeValue[]>([]);

  // Calculate interpolated value at specific time
  const interpolateValue = useCallback((
    track: AnimationTrack, 
    time: number
  ): unknown => {
    if (track.keyframes.length === 0) {
      return track.defaultValue;
    }

    // Sort keyframes by time
    const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time);
    
    // Find surrounding keyframes
    let beforeKeyframe = sortedKeyframes[0];
    let afterKeyframe = sortedKeyframes[sortedKeyframes.length - 1];
    
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      if (time >= sortedKeyframes[i].time && time <= sortedKeyframes[i + 1].time) {
        beforeKeyframe = sortedKeyframes[i];
        afterKeyframe = sortedKeyframes[i + 1];
        break;
      }
    }

    // If time is before first keyframe
    if (time <= sortedKeyframes[0].time) {
      return sortedKeyframes[0].value;
    }

    // If time is after last keyframe
    if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
      return sortedKeyframes[sortedKeyframes.length - 1].value;
    }

    // Calculate interpolation progress
    const duration = afterKeyframe.time - beforeKeyframe.time;
    const progress = duration === 0 ? 0 : (time - beforeKeyframe.time) / duration;

    // Apply easing
    const easingFunction = ADVANCED_EASING[beforeKeyframe.easing] || ADVANCED_EASING.linear;
    const easedProgress = easingFunction(progress);

    // Interpolate based on type
    return interpolateByType(
      track.type,
      beforeKeyframe.value,
      afterKeyframe.value,
      easedProgress,
      beforeKeyframe.interpolation
    );
  }, []);

  // Type-specific interpolation
  const interpolateByType = useCallback((
    type: PropertyType,
    startValue: unknown,
    endValue: unknown,
    progress: number,
    interpolation: InterpolationType
  ): unknown => {
    switch (type) {
      case 'number':
      case 'opacity':
      case 'rotation':
      case 'scale':
        if (typeof startValue !== 'number' || typeof endValue !== 'number') {
          return startValue;
        }
        if (interpolation === 'discrete') {
          return progress < 1 ? startValue : endValue;
        }
        return startValue + (endValue - startValue) * progress;

      case 'position':
        if (isPositionValue(startValue) && isPositionValue(endValue)) {
          return {
            x: startValue.x + (endValue.x - startValue.x) * progress,
            y: startValue.y + (endValue.y - startValue.y) * progress
          };
        }
        return startValue;

      case 'color':
        if (typeof startValue !== 'string' || typeof endValue !== 'string') {
          return startValue;
        }
        if (interpolation === 'discrete') {
          return progress < 1 ? startValue : endValue;
        }
        return interpolateColor(startValue, endValue, progress);

      case 'text':
        if (typeof startValue !== 'string' || typeof endValue !== 'string') {
          return startValue;
        }
        return progress < 1 ? startValue : endValue;

      case 'path':
        if (typeof startValue !== 'string' || typeof endValue !== 'string') {
          return startValue;
        }
        // Path interpolation for SVG paths (simplified)
        return progress < 1 ? startValue : endValue;

      default:
        return startValue;
    }
  }, []);

  // Color interpolation (RGB)
  const interpolateColor = useCallback((startColor: string, endColor: string, progress: number): string => {
    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);
    
    if (!start || !end) return startColor;

    const r = Math.round(start.r + (end.r - start.r) * progress);
    const g = Math.round(start.g + (end.g - start.g) * progress);
    const b = Math.round(start.b + (end.b - start.b) * progress);

    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const isPositionValue = (value: unknown): value is { x: number; y: number } => {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const maybePosition = value as { x?: unknown; y?: unknown };
    return typeof maybePosition.x === 'number' && typeof maybePosition.y === 'number';
  };

  // Add keyframe to track
  const addKeyframe = useCallback((
    trackId: string, 
    time: number, 
    value?: unknown,
    easing: EasingType = 'ease-out'
  ) => {
    setTracks(prevTracks => 
      prevTracks.map(track => {
        if (track.id !== trackId) return track;

        // Check if keyframe already exists at this time
        const existingIndex = track.keyframes.findIndex(kf => Math.abs(kf.time - time) < 0.01);
        
        if (existingIndex >= 0) {
          // Update existing keyframe
          const updatedKeyframes = [...track.keyframes];
          updatedKeyframes[existingIndex] = {
            ...updatedKeyframes[existingIndex],
            value: value !== undefined ? value : updatedKeyframes[existingIndex].value,
            easing
          };
          return { ...track, keyframes: updatedKeyframes };
        } else {
          // Add new keyframe
          const newKeyframe: KeyframeValue = {
            id: `kf-${Date.now()}-${Math.random()}`,
            time,
            value: value !== undefined ? value : interpolateValue(track, time),
            easing,
            interpolation: 'bezier'
          };

          return {
            ...track,
            keyframes: [...track.keyframes, newKeyframe].sort((a, b) => a.time - b.time)
          };
        }
      })
    );
  }, [interpolateValue]);

  // Remove keyframe
  const removeKeyframe = useCallback((trackId: string, keyframeId: string) => {
    setTracks(prevTracks =>
      prevTracks.map(track => {
        if (track.id !== trackId) return track;
        return {
          ...track,
          keyframes: track.keyframes.filter(kf => kf.id !== keyframeId)
        };
      })
    );
  }, []);

  // Update keyframe
  const updateKeyframe = useCallback((
    trackId: string, 
    keyframeId: string, 
    updates: Partial<KeyframeValue>
  ) => {
    setTracks(prevTracks =>
      prevTracks.map(track => {
        if (track.id !== trackId) return track;
        return {
          ...track,
          keyframes: track.keyframes.map(kf => 
            kf.id === keyframeId ? { ...kf, ...updates } : kf
          )
        };
      })
    );
  }, []);

  // Copy keyframes
  const copyKeyframes = useCallback((keyframeIds: string[]) => {
    const keyframesToCopy: KeyframeValue[] = [];
    
    tracks.forEach(track => {
      track.keyframes.forEach(kf => {
        if (keyframeIds.includes(kf.id)) {
          keyframesToCopy.push({ ...kf });
        }
      });
    });

    setCopiedKeyframes(keyframesToCopy);
  }, [tracks]);

  // Paste keyframes
  const pasteKeyframes = useCallback((trackId: string, targetTime: number) => {
    if (copiedKeyframes.length === 0) return;

    const earliestTime = Math.min(...copiedKeyframes.map(kf => kf.time));
    const timeOffset = targetTime - earliestTime;

    copiedKeyframes.forEach(copiedKf => {
      const newTime = copiedKf.time + timeOffset;
      addKeyframe(trackId, newTime, copiedKf.value, copiedKf.easing);
    });
  }, [copiedKeyframes, addKeyframe]);

  // Get all values at specific time
  const getValuesAtTime = useCallback((time: number) => {
    const values: Record<string, unknown> = {};
    
    tracks.forEach(track => {
      values[track.property] = interpolateValue(track, time);
    });

    return values;
  }, [tracks, interpolateValue]);

  // Create animation track
  const createTrack = useCallback((
    property: string,
    type: PropertyType,
    defaultValue: unknown,
    color: string = '#3b82f6'
  ): AnimationTrack => {
    return {
      id: `track-${Date.now()}-${Math.random()}`,
      property,
      type,
      keyframes: [],
      defaultValue,
      enabled: true,
      color
    };
  }, []);

  // Optimize keyframes (remove redundant ones)
  const optimizeTrack = useCallback((trackId: string) => {
    setTracks(prevTracks =>
      prevTracks.map(track => {
        if (track.id !== trackId) return track;

        const optimizedKeyframes = track.keyframes.filter((kf, index, array) => {
          if (index === 0 || index === array.length - 1) return true;
          
          const prev = array[index - 1];
          const next = array[index + 1];
          
          // Keep keyframe if it's not on the interpolation line
          const interpolatedValue = interpolateByType(
            track.type,
            prev.value,
            next.value,
            (kf.time - prev.time) / (next.time - prev.time),
            'linear'
          );

          if (typeof interpolatedValue !== 'number' || typeof kf.value !== 'number') {
            return true;
          }

          return Math.abs(interpolatedValue - kf.value) > 0.001;
        });

        return { ...track, keyframes: optimizedKeyframes };
      })
    );
  }, [interpolateByType]);

  return {
    tracks,
    setTracks,
    selectedKeyframes,
    setSelectedKeyframes,
    interpolateValue,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    copyKeyframes,
    pasteKeyframes,
    getValuesAtTime,
    createTrack,
    optimizeTrack,
    ADVANCED_EASING
  };
}

// Export animation data
export function exportAnimation(tracks: AnimationTrack[]): string {
  return JSON.stringify({
    version: '1.0',
    tracks: tracks.map(track => ({
      property: track.property,
      type: track.type,
      keyframes: track.keyframes.map(kf => ({
        time: kf.time,
        value: kf.value,
        easing: kf.easing,
        interpolation: kf.interpolation
      }))
    }))
  }, null, 2);
}

// Import animation data
interface SerializedKeyframe {
  time: number;
  value: unknown;
  easing?: EasingType;
  interpolation?: InterpolationType;
}

interface SerializedTrack {
  property: string;
  type: PropertyType;
  keyframes: SerializedKeyframe[];
  defaultValue?: unknown;
  enabled?: boolean;
  color?: string;
}

interface SerializedAnimationData {
  version?: string;
  tracks: SerializedTrack[];
}

const isSerializedKeyframe = (value: unknown): value is SerializedKeyframe => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const keyframe = value as Record<string, unknown>;
  return typeof keyframe.time === 'number';
};

const isSerializedTrack = (value: unknown): value is SerializedTrack => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const track = value as Record<string, unknown>;
  if (typeof track.property !== 'string') {
    return false;
  }

  if (typeof track.type !== 'string') {
    return false;
  }

  if (!Array.isArray(track.keyframes) || !track.keyframes.every(isSerializedKeyframe)) {
    return false;
  }

  return true;
};

const isSerializedAnimationData = (value: unknown): value is SerializedAnimationData => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;
  return Array.isArray(data.tracks) && data.tracks.every(isSerializedTrack);
};

export function importAnimation(jsonData: string): AnimationTrack[] {
  try {
    const data = JSON.parse(jsonData);
    if (!isSerializedAnimationData(data)) {
      return [];
    }

    return data.tracks.map((trackData) => ({
      id: `track-${Date.now()}-${Math.random()}`,
      property: trackData.property,
      type: trackData.type,
      keyframes: trackData.keyframes.map((kfData) => ({
        id: `kf-${Date.now()}-${Math.random()}`,
        time: kfData.time,
        value: kfData.value,
        easing: kfData.easing || 'ease-out',
        interpolation: kfData.interpolation || 'bezier'
      })),
      defaultValue: trackData.defaultValue ?? trackData.keyframes[0]?.value ?? null,
      enabled: trackData.enabled ?? true,
      color: trackData.color ?? '#3b82f6'
    }));
  } catch (error) {
    console.error('Failed to import animation:', error);
    return [];
  }
}

export default useAdvancedKeyframes;