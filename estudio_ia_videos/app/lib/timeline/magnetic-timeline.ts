import { TimelineTrack, TimelineClip, TimelineState } from '@/types/timeline';

export interface MagneticTimelineConfig {
  autoRipple: boolean;
  gapClosing: boolean;
  snapToBeat: boolean;
  snapThreshold: number; // milliseconds
  rippleDelay: number; // milliseconds
}

export interface MagneticEvent {
  type: 'clip_moved' | 'clip_deleted' | 'clip_added' | 'gap_detected' | 'ripple_completed';
  clipId: string;
  trackId: string;
  position: number;
  affectedClips?: string[];
}

export class MagneticTimelineEngine {
  private config: MagneticTimelineConfig;
  private state: TimelineState;
  private eventHandlers: Map<string, (event: MagneticEvent) => void>;

  constructor(config: MagneticTimelineConfig) {
    this.config = config;
    this.eventHandlers = new Map();
    this.state = {
      tracks: [],
      clips: [],
      duration: 0,
      magneticZones: []
    };
  }

  setConfig(config: Partial<MagneticTimelineConfig>) {
    this.config = { ...this.config, ...config };
  }

  setState(state: TimelineState) {
    this.state = state;
  }

  on(event: string, handler: (event: MagneticEvent) => void) {
    this.eventHandlers.set(event, handler);
  }

  off(event: string) {
    this.eventHandlers.delete(event);
  }

  private emit(event: MagneticEvent) {
    const handler = this.eventHandlers.get(event.type);
    if (handler) {
      handler(event);
    }
  }

  /**
   * Move clip with magnetic snapping and auto-ripple
   */
  moveClip(clipId: string, newPosition: number, trackId?: string): TimelineState {
    const clip = this.state.clips.find(c => c.id === clipId);
    if (!clip) return this.state;

    const originalTrack = this.state.tracks.find(t => 
      t.clips.some(c => c.id === clipId)
    );
    if (!originalTrack) return this.state;

    // Find magnetic snap points
    const snapPosition = this.findMagneticSnapPoint(newPosition, clip);
    const finalPosition = Math.abs(newPosition - snapPosition) < this.config.snapThreshold 
      ? snapPosition 
      : newPosition;

    // Check if we need to change tracks
    const targetTrack = trackId 
      ? this.state.tracks.find(t => t.id === trackId) || originalTrack
      : originalTrack;

    // Remove clip from original track
    const updatedOriginalTrack = {
      ...originalTrack,
      clips: originalTrack.clips.filter(c => c.id !== clipId)
    };

    // Update clip position
    const updatedClip = {
      ...clip,
      startTime: finalPosition,
      trackId: targetTrack.id
    };

    // Add to target track (maintaining order)
    const updatedTargetTrack = {
      ...targetTrack,
      clips: [...targetTrack.clips, updatedClip].sort((a, b) => a.startTime - b.startTime)
    };

    // Apply auto-ripple if enabled
    let finalState = {
      ...this.state,
      tracks: this.state.tracks.map(t => {
        if (t.id === originalTrack.id) return updatedOriginalTrack;
        if (t.id === targetTrack.id) return updatedTargetTrack;
        return t;
      }),
      clips: this.state.clips.map(c => c.id === clipId ? updatedClip : c)
    };

    if (this.config.autoRipple) {
      finalState = this.applyRippleEffect(finalState, clipId, finalPosition);
    }

    // Apply gap closing if enabled
    if (this.config.gapClosing) {
      finalState = this.closeGaps(finalState);
    }

    this.state = finalState;

    this.emit({
      type: 'clip_moved',
      clipId,
      trackId: targetTrack.id,
      position: finalPosition
    });

    return finalState;
  }

  /**
   * Delete clip with auto-ripple
   */
  deleteClip(clipId: string): TimelineState {
    const clip = this.state.clips.find(c => c.id === clipId);
    if (!clip) return this.state;

    const track = this.state.tracks.find(t => 
      t.clips.some(c => c.id === clipId)
    );
    if (!track) return this.state;

    // Remove clip
    let updatedState = {
      ...this.state,
      tracks: this.state.tracks.map(t => ({
        ...t,
        clips: t.clips.filter(c => c.id !== clipId)
      })),
      clips: this.state.clips.filter(c => c.id !== clipId)
    };

    // Apply ripple effect
    if (this.config.autoRipple) {
      updatedState = this.applyRippleEffect(updatedState, clipId, clip.startTime, true);
    }

    this.state = updatedState;

    this.emit({
      type: 'clip_deleted',
      clipId,
      trackId: track.id,
      position: clip.startTime
    });

    return updatedState;
  }

  /**
   * Find magnetic snap points
   */
  private findMagneticSnapPoint(position: number, movingClip: TimelineClip): number {
    const snapPoints: number[] = [];
    
    // Add timeline start (0)
    snapPoints.push(0);
    
    // Add clip boundaries from all tracks
    this.state.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (clip.id === movingClip.id) return; // Skip moving clip
        
        // Start and end of other clips
        snapPoints.push(clip.startTime);
        snapPoints.push(clip.startTime + clip.duration);
        
        // Add magnetic zones if configured
        if (this.config.snapToBeat && this.state.magneticZones) {
          this.state.magneticZones.forEach(zone => {
            if (zone.trackId === track.id) {
              snapPoints.push(zone.position);
            }
          });
        }
      });
    });

    // Find closest snap point
    let closestSnap = position;
    let minDistance = this.config.snapThreshold;

    snapPoints.forEach(snapPoint => {
      const distance = Math.abs(position - snapPoint);
      if (distance < minDistance) {
        minDistance = distance;
        closestSnap = snapPoint;
      }
    });

    return closestSnap;
  }

  /**
   * Apply ripple effect to fill gaps or make space
   */
  private applyRippleEffect(
    state: TimelineState, 
    triggerClipId: string, 
    position: number, 
    isDeletion: boolean = false
  ): TimelineState {
    const affectedClips: string[] = [];
    
    const updatedTracks = state.tracks.map(track => {
      const clipsAfterPosition = track.clips.filter(clip => 
        clip.startTime > position && clip.id !== triggerClipId
      );

      if (clipsAfterPosition.length === 0) return track;

      const updatedClips = track.clips.map(clip => {
        if (clip.startTime <= position || clip.id === triggerClipId) {
          return clip;
        }

        // Calculate ripple offset
        let offset = 0;
        if (isDeletion) {
          // Move clips left to fill gap
          const triggerClip = state.clips.find(c => c.id === triggerClipId);
          if (triggerClip) {
            offset = -triggerClip.duration;
          }
        } else {
          // Move clips right to make space (if needed)
          const positionConflict = this.checkPositionConflicts(clip, track.clips);
          if (positionConflict) {
            offset = this.config.rippleDelay;
          }
        }

        if (offset !== 0) {
          affectedClips.push(clip.id);
          return {
            ...clip,
            startTime: clip.startTime + offset
          };
        }

        return clip;
      });

      return {
        ...track,
        clips: updatedClips.sort((a, b) => a.startTime - b.startTime)
      };
    });

    const updatedClips = state.clips.map(clip => {
      const updatedTrackClip = updatedTracks
        .flatMap(t => t.clips)
        .find(c => c.id === clip.id);
      return updatedTrackClip || clip;
    });

    this.emit({
      type: 'ripple_completed',
      clipId: triggerClipId,
      trackId: '',
      position,
      affectedClips
    });

    return {
      ...state,
      tracks: updatedTracks,
      clips: updatedClips
    };
  }

  /**
   * Check for position conflicts between clips
   */
  private checkPositionConflicts(clip: TimelineClip, allClips: TimelineClip[]): boolean {
    return allClips.some(otherClip => 
      otherClip.id !== clip.id &&
      this.clipsOverlap(clip, otherClip)
    );
  }

  /**
   * Check if two clips overlap
   */
  private clipsOverlap(clip1: TimelineClip, clip2: TimelineClip): boolean {
    const clip1End = clip1.startTime + clip1.duration;
    const clip2End = clip2.startTime + clip2.duration;
    
    return (clip1.startTime < clip2End && clip1End > clip2.startTime);
  }

  /**
   * Close gaps between clips
   */
  private closeGaps(state: TimelineState): TimelineState {
    const updatedTracks = state.tracks.map(track => {
      const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime);
      const updatedClips = sortedClips.map((clip, index) => {
        if (index === 0) return clip; // First clip stays at position 0

        const previousClip = sortedClips[index - 1];
        const previousEnd = previousClip.startTime + previousClip.duration;
        const gap = clip.startTime - previousEnd;

        // If there's a gap, move clip to close it
        if (gap > 0 && gap < 1000) { // Only close small gaps (< 1 second)
          return {
            ...clip,
            startTime: previousEnd
          };
        }

        return clip;
      });

      return {
        ...track,
        clips: updatedClips
      };
    });

    const updatedClips = state.clips.map(clip => {
      const updatedTrackClip = updatedTracks
        .flatMap(t => t.clips)
        .find(c => c.id === clip.id);
      return updatedTrackClip || clip;
    });

    return {
      ...state,
      tracks: updatedTracks,
      clips: updatedClips
    };
  }

  /**
   * Add magnetic zones for beat-based snapping
   */
  addMagneticZone(trackId: string, position: number, type: 'beat' | 'marker' = 'beat'): TimelineState {
    const zone = {
      id: `zone_${Date.now()}`,
      trackId,
      position,
      type
    };

    this.state = {
      ...this.state,
      magneticZones: [...this.state.magneticZones, zone]
    };

    return this.state;
  }

  /**
   * Remove magnetic zone
   */
  removeMagneticZone(zoneId: string): TimelineState {
    this.state = {
      ...this.state,
      magneticZones: this.state.magneticZones.filter(z => z.id !== zoneId)
    };

    return this.state;
  }

  /**
   * Get current state
   */
  getState(): TimelineState {
    return this.state;
  }

  /**
   * Get configuration
   */
  getConfig(): MagneticTimelineConfig {
    return this.config;
  }
}