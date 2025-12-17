
/**
 * 🎬 useTimelineReal Hook - REAL (não mock)
 * Hook para manipulação de timeline multi-track
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import type { Timeline, Track, Clip, TimelineManipulation, TimelineConfig } from '@/lib/types/timeline-types';
import { DEFAULT_TIMELINE_CONFIG } from '@/lib/types/timeline-types';

interface UseTimelineRealProps {
  projectId: string;
  initialTimeline?: Partial<Timeline>;
  config?: Partial<TimelineConfig>;
  onUpdate?: (timeline: Timeline) => void;
}

export function useTimelineReal({
  projectId,
  initialTimeline,
  config: userConfig,
  onUpdate,
}: UseTimelineRealProps) {
  const config = { ...DEFAULT_TIMELINE_CONFIG, ...userConfig };
  
  // Estado da timeline
  const [timeline, setTimeline] = useState<Timeline>({
    id: uuidv4(),
    projectId,
    tracks: [],
    duration: 60,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    currentTime: 0,
    playing: false,
    loop: false,
    zoom: 1,
    scrollPosition: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...initialTimeline,
  });
  
  // Refs para controle de reprodução
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  
  // ============= TRACKS =============
  
  const addTrack = useCallback((trackData: Omit<Track, 'id' | 'clips'>) => {
    const newTrack: Track = {
      id: uuidv4(),
      clips: [],
      height: config.defaultTrackHeight,
      ...trackData,
    };
    
    setTimeline((prev: Timeline) => {
      const updated = {
        ...prev,
        tracks: [...prev.tracks, newTrack],
        updatedAt: new Date(),
      };
      onUpdate?.(updated);
      return updated;
    });
    
    return newTrack;
  }, [config.defaultTrackHeight, onUpdate]);
  
  const removeTrack = useCallback((trackId: string) => {
    setTimeline((prev: Timeline) => {
      const updated = {
        ...prev,
        tracks: prev.tracks.filter((t: Track) => t.id !== trackId),
        updatedAt: new Date(),
      };
      onUpdate?.(updated);
      return updated;
    });
  }, [onUpdate]);
  
  const updateTrack = useCallback((trackId: string, data: Partial<Track>) => {
    setTimeline((prev: Timeline) => {
      const updated = {
        ...prev,
        tracks: prev.tracks.map((t: Track) => 
          t.id === trackId ? { ...t, ...data } : t
        ),
        updatedAt: new Date(),
      };
      onUpdate?.(updated);
      return updated;
    });
  }, [onUpdate]);
  
  const reorderTracks = useCallback((trackIds: string[]) => {
    setTimeline((prev: Timeline) => {
      const tracksMap = new Map(prev.tracks.map((t: Track) => [t.id, t]));
      const reordered = trackIds.map(id => tracksMap.get(id)!).filter(Boolean);
      
      const updated = {
        ...prev,
        tracks: reordered,
        updatedAt: new Date(),
      };
      onUpdate?.(updated);
      return updated;
    });
  }, [onUpdate]);
  
  // ============= CLIPS =============
  
  const addClip = useCallback((trackId: string, clipData: Omit<Clip, 'id' | 'trackId'>) => {
    const newClip = {
      id: uuidv4(),
      trackId,
      volume: 100,
      opacity: 100,
      locked: false,
      hidden: false,
      ...clipData,
    } as Clip;
    
    setTimeline((prev: Timeline) => {
      const updated = {
        ...prev,
        tracks: prev.tracks.map((t: Track) => 
          t.id === trackId 
            ? { ...t, clips: [...t.clips, newClip] }
            : t
        ),
        updatedAt: new Date(),
      };
      onUpdate?.(updated);
      return updated;
    });
    
    return newClip;
  }, [onUpdate]);
  
  const removeClip = useCallback((clipId: string) => {
    setTimeline((prev: Timeline) => {
      const updated = {
        ...prev,
        tracks: prev.tracks.map((t: Track) => ({
          ...t,
          clips: t.clips.filter((c: Clip) => c.id !== clipId),
        })),
        updatedAt: new Date(),
      };
      onUpdate?.(updated);
      return updated;
    });
  }, [onUpdate]);
  
  const updateClip = useCallback((clipId: string, data: Partial<Clip>) => {
    setTimeline((prev: Timeline) => {
      const updated = {
        ...prev,
        tracks: prev.tracks.map((t: Track) => ({
          ...t,
          clips: t.clips.map((c: Clip) => 
            c.id === clipId ? { ...c, ...data } : c
          ),
        })),
        updatedAt: new Date(),
      };
      onUpdate?.(updated);
      return updated;
    });
  }, [onUpdate]);
  
  const moveClip = useCallback((clipId: string, newTrackId: string, newStartTime: number) => {
    setTimeline((prev: Timeline) => {
      // Encontrar o clip
      let clipToMove: Clip | undefined;
      
      const tracksWithoutClip = prev.tracks.map((t: Track) => ({
        ...t,
        clips: t.clips.filter((c: Clip) => {
          if (c.id === clipId) {
            clipToMove = c;
            return false;
          }
          return true;
        }),
      }));
      
      if (!clipToMove) return prev;
      
      // Snap to grid se habilitado
      const startTime = config.snapToGrid
        ? Math.round(newStartTime / config.gridSize) * config.gridSize
        : newStartTime;
      
      // Adicionar à nova track
      const updated = {
        ...prev,
        tracks: tracksWithoutClip.map((t: Track) => 
          t.id === newTrackId
            ? {
                ...t,
                clips: [...t.clips, { ...clipToMove!, trackId: newTrackId, startTime }],
              }
            : t
        ),
        updatedAt: new Date(),
      };
      
      onUpdate?.(updated);
      return updated;
    });
  }, [config.snapToGrid, config.gridSize, onUpdate]);
  
  const splitClip = useCallback((clipId: string, splitTime: number): [Clip, Clip] | null => {
    let result: [Clip, Clip] | null = null;
    
    setTimeline((prev: Timeline) => {
      const track = prev.tracks.find((t: Track) => t.clips.some((c: Clip) => c.id === clipId));
      const clip = track?.clips.find((c: Clip) => c.id === clipId);
      
      if (!clip || !track) return prev;
      
      const relativeTime = splitTime - clip.startTime;
      if (relativeTime <= 0 || relativeTime >= clip.duration) return prev;
      
      // Criar dois novos clips
      const clip1: Clip = {
        ...clip,
        id: uuidv4(),
        duration: relativeTime,
      };
      
      const clip2: Clip = {
        ...clip,
        id: uuidv4(),
        startTime: splitTime,
        duration: clip.duration - relativeTime,
      };
      
      result = [clip1, clip2];
      
      const updated = {
        ...prev,
        tracks: prev.tracks.map((t: Track) => 
          t.id === track.id
            ? {
                ...t,
                clips: t.clips.flatMap((c: Clip) => 
                  c.id === clipId ? [clip1, clip2] : [c]
                ),
              }
            : t
        ),
        updatedAt: new Date(),
      };
      
      onUpdate?.(updated);
      return updated;
    });
    
    return result;
  }, [onUpdate]);
  
  const duplicateClip = useCallback((clipId: string): Clip | null => {
    let result: Clip | null = null;
    
    setTimeline((prev: Timeline) => {
      const track = prev.tracks.find((t: Track) => t.clips.some((c: Clip) => c.id === clipId));
      const clip = track?.clips.find((c: Clip) => c.id === clipId);
      
      if (!clip || !track) return prev;
      
      const newClip: Clip = {
        ...clip,
        id: uuidv4(),
        startTime: clip.startTime + clip.duration,
      };
      
      result = newClip;
      
      const updated = {
        ...prev,
        tracks: prev.tracks.map((t: Track) => 
          t.id === track.id
            ? { ...t, clips: [...t.clips, newClip] }
            : t
        ),
        updatedAt: new Date(),
      };
      
      onUpdate?.(updated);
      return updated;
    });
    
    return result;
  }, [onUpdate]);
  
  // ============= PLAYBACK =============
  
  const play = useCallback(() => {
    setTimeline((prev: Timeline) => ({ ...prev, playing: true }));
    
    const animate = () => {
      const now = performance.now();
      const delta = (now - lastUpdateTimeRef.current) / 1000;
      lastUpdateTimeRef.current = now;
      
      setTimeline((prev: Timeline) => {
        const newTime = prev.currentTime + delta;
        
        if (newTime >= prev.duration) {
          if (prev.loop) {
            return { ...prev, currentTime: 0 };
          } else {
            return { ...prev, currentTime: prev.duration, playing: false };
          }
        }
        
        return { ...prev, currentTime: newTime };
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);
  
  const pause = useCallback(() => {
    setTimeline((prev: Timeline) => ({ ...prev, playing: false }));
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);
  
  const stop = useCallback(() => {
    setTimeline((prev: Timeline) => ({ ...prev, playing: false, currentTime: 0 }));
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);
  
  const seek = useCallback((time: number) => {
    setTimeline((prev: Timeline) => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.duration)),
    }));
    
    // Sincronizar com o vídeo se existir
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);
  
  // ============= ZOOM =============
  
  const zoomIn = useCallback(() => {
    setTimeline((prev: Timeline) => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.5, 10),
    }));
  }, []);
  
  const zoomOut = useCallback(() => {
    setTimeline((prev: Timeline) => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.5, 0.1),
    }));
  }, []);
  
  const setZoom = useCallback((zoom: number) => {
    setTimeline((prev: Timeline) => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(zoom, 10)),
    }));
  }, []);
  
  // ============= PERSISTÊNCIA =============
  
  const save = useCallback(async () => {
    try {
      const response = await fetch(`/api/timeline/${projectId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timeline),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save timeline');
      }
      
      logger.debug('Timeline saved successfully', { projectId, component: 'useTimelineReal' });
    } catch (error) {
      logger.error('Error saving timeline', error as Error, { projectId, component: 'useTimelineReal' });
      throw error;
    }
  }, [projectId, timeline]);
  
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/timeline/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load timeline');
      }
      
      const data = await response.json();
      setTimeline(data);
      
      logger.debug('Timeline loaded successfully', { projectId, component: 'useTimelineReal' });
    } catch (error) {
      logger.error('Error loading timeline', error as Error, { projectId, component: 'useTimelineReal' });
      throw error;
    }
  }, [projectId]);
  
  // Sincronizar com vídeo quando houver mudança de tempo
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - timeline.currentTime) > 0.1) {
      videoRef.current.currentTime = timeline.currentTime;
    }
  }, [timeline.currentTime]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Interface de manipulação
  const manipulation: TimelineManipulation = {
    addTrack,
    removeTrack,
    updateTrack,
    reorderTracks,
    addClip,
    removeClip,
    updateClip,
    moveClip,
    splitClip,
    duplicateClip,
    play,
    pause,
    stop,
    seek,
    zoomIn,
    zoomOut,
    setZoom,
    save,
    load,
  };
  
  return {
    timeline,
    manipulation,
    videoRef,
    config,
  };
}
