import { useState, useRef, useCallback, useEffect } from 'react';

export interface Keyframe {
  id: string;
  time: number;
  objectId: string;
  properties: {
    x?: number;
    y?: number;
    opacity?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    [key: string]: unknown;
  };
  easing: string;
  duration: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: string;
  keyframes: Keyframe[];
  duration: number;
  locked: boolean;
  visible: boolean;
}

export function useKeyframeAnimation() {
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const animate = useCallback((time: number) => {
    if (startTimeRef.current === undefined) {
      startTimeRef.current = time;
    }
    
    const deltaTime = (time - startTimeRef.current) / 1000; // seconds
    const newTime = lastTimeRef.current + deltaTime;

    if (newTime >= duration) {
      setCurrentTime(duration);
      setIsPlaying(false);
      startTimeRef.current = undefined;
      lastTimeRef.current = 0;
      return;
    }

    setCurrentTime(newTime);
    requestRef.current = requestAnimationFrame(animate);
  }, [duration]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = undefined;
      lastTimeRef.current = currentTime;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, animate]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  }, [duration]);

  const addTrack = useCallback((track: TimelineTrack) => {
    setTracks(prev => [...prev, track]);
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const addKeyframe = useCallback((trackId: string, keyframe: Keyframe) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          keyframes: [...track.keyframes, keyframe].sort((a, b) => a.time - b.time)
        };
      }
      return track;
    }));
  }, []);

  const removeKeyframe = useCallback((trackId: string, keyframeId: string) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          keyframes: track.keyframes.filter(k => k.id !== keyframeId)
        };
      }
      return track;
    }));
  }, []);

  const updateKeyframe = useCallback((trackId: string, keyframeId: string, updates: Partial<Keyframe>) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          keyframes: track.keyframes.map(k => {
            if (k.id === keyframeId) {
              return { ...k, ...updates };
            }
            return k;
          }).sort((a, b) => a.time - b.time)
        };
      }
      return track;
    }));
  }, []);

  const exportData = useCallback(() => {
    return {
      tracks,
      duration,
      version: '1.0'
    };
  }, [tracks, duration]);

  const importData = useCallback((data: { tracks?: TimelineTrack[]; duration?: number }) => {
    if (data.tracks) setTracks(data.tracks);
    if (data.duration) setDuration(data.duration);
  }, []);

  const generatePreview = useCallback(async (): Promise<Blob> => {
    // Mock implementation for preview generation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(new Blob(['preview data'], { type: 'video/mp4' }));
      }, 1000);
    });
  }, []);

  return {
    system: {}, // Placeholder for internal system state if needed
    isPlaying,
    currentTime,
    duration,
    tracks,
    play,
    pause,
    stop,
    seekTo,
    addTrack,
    removeTrack,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    exportData,
    importData,
    generatePreview
  };
}
