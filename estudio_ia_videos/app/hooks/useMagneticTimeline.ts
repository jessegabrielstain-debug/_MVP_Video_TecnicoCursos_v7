import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { MagneticTimelineEngine, MagneticTimelineConfig, MagneticEvent } from '@/lib/timeline/magnetic-timeline';
import { BeatDetectorService, BeatDetectionConfig } from '@/lib/timeline/beat-detector';
import { TimelineState, TimelineClip } from '@/types/timeline';
import { useToast } from '@/hooks/use-toast';

export interface UseMagneticTimelineProps {
  initialState: TimelineState;
  config?: Partial<MagneticTimelineConfig>;
  beatDetectionConfig?: Partial<BeatDetectionConfig>;
  onBeatDetected?: (beats: any[]) => void;
  onRippleCompleted?: (affectedClips: string[]) => void;
}

export interface UseMagneticTimelineReturn {
  state: TimelineState;
  config: MagneticTimelineConfig;
  isProcessing: boolean;
  beats: any[];
  isBeatDetectionActive: boolean;
  
  // Actions
  moveClip: (clipId: string, position: number, trackId?: string) => Promise<void>;
  deleteClip: (clipId: string) => Promise<void>;
  updateConfig: (config: Partial<MagneticTimelineConfig>) => void;
  toggleAutoRipple: () => void;
  toggleGapClosing: () => void;
  toggleSnapToBeat: () => void;
  detectBeats: (audioFile: string) => Promise<void>;
  addMagneticZone: (trackId: string, position: number) => void;
  removeMagneticZone: (zoneId: string) => void;
  
  // State helpers
  getClipAtPosition: (position: number, trackId?: string) => TimelineClip | null;
  getSnapPoints: () => number[];
  getGaps: () => Array<{ start: number; end: number; duration: number; trackId: string }>;
}

export const useMagneticTimeline = ({
  initialState,
  config: initialConfig = {},
  beatDetectionConfig: initialBeatConfig = {},
  onBeatDetected,
  onRippleCompleted
}: UseMagneticTimelineProps): UseMagneticTimelineReturn => {
  const [state, setState] = useState<TimelineState>(initialState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [beats, setBeats] = useState<any[]>([]);
  const [isBeatDetectionActive, setIsBeatDetectionActive] = useState(false);
  
  const engineRef = useRef<MagneticTimelineEngine>();
  const beatDetectorRef = useRef<BeatDetectorService>();
  const { toast } = useToast();

  // Initialize engine and beat detector
  useEffect(() => {
    const defaultConfig: MagneticTimelineConfig = {
      autoRipple: true,
      gapClosing: true,
      snapToBeat: false,
      snapThreshold: 50, // 50ms
      rippleDelay: 100, // 100ms
      ...initialConfig
    };

    const defaultBeatConfig: BeatDetectionConfig = {
      sensitivity: 0.5,
      minConfidence: 0.3,
      maxBeatsPerMinute: 180,
      minBeatsPerMinute: 60,
      ...initialBeatConfig
    };

    engineRef.current = new MagneticTimelineEngine(defaultConfig);
    beatDetectorRef.current = new BeatDetectorService(defaultBeatConfig);

    engineRef.current.setState(initialState);

    // Set up event handlers
    engineRef.current.on('clip_moved', (event: MagneticEvent) => {
      logger.debug('Clip moved', { event, component: 'useMagneticTimeline' });
    });

    engineRef.current.on('clip_deleted', (event: MagneticEvent) => {
      logger.debug('Clip deleted', { event, component: 'useMagneticTimeline' });
    });

    engineRef.current.on('ripple_completed', (event: MagneticEvent) => {
      if (event.affectedClips && onRippleCompleted) {
        onRippleCompleted(event.affectedClips);
      }
      toast({
        title: 'Timeline Updated',
        description: `Ripple effect applied to ${event.affectedClips?.length || 0} clips`,
        duration: 2000
      });
    });

    engineRef.current.on('gap_detected', (event: MagneticEvent) => {
      toast({
        title: 'Gap Detected',
        description: `Gap closed at ${event.position}ms`,
        duration: 1500
      });
    });

  }, []);

  // Sync state with engine
  useEffect(() => {
    if (engineRef.current) {
      const currentState = engineRef.current.getState();
      if (JSON.stringify(currentState) !== JSON.stringify(state)) {
        setState(currentState);
      }
    }
  }, [state]);

  const moveClip = useCallback(async (clipId: string, position: number, trackId?: string) => {
    if (!engineRef.current) return;

    setIsProcessing(true);
    try {
      const newState = engineRef.current.moveClip(clipId, position, trackId);
      setState(newState);
      
      toast({
        title: 'Clip Moved',
        description: 'Clip snapped to magnetic position',
        duration: 1000
      });
    } catch (error) {
      logger.error('Failed to move clip', error as Error, { clipId, position, trackId, component: 'useMagneticTimeline' });
      toast({
        title: 'Error',
        description: 'Failed to move clip',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const deleteClip = useCallback(async (clipId: string) => {
    if (!engineRef.current) return;

    setIsProcessing(true);
    try {
      const newState = engineRef.current.deleteClip(clipId);
      setState(newState);
      
      toast({
        title: 'Clip Deleted',
        description: 'Clip removed with ripple effect',
        duration: 1000
      });
    } catch (error) {
      logger.error('Failed to delete clip', error as Error, { clipId, component: 'useMagneticTimeline' });
      toast({
        title: 'Error',
        description: 'Failed to delete clip',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const updateConfig = useCallback((config: Partial<MagneticTimelineConfig>) => {
    if (!engineRef.current) return;
    
    engineRef.current.setConfig(config);
    setState(engineRef.current.getState());
  }, []);

  const toggleAutoRipple = useCallback(() => {
    if (!engineRef.current) return;
    
    const currentConfig = engineRef.current.getConfig();
    updateConfig({ autoRipple: !currentConfig.autoRipple });
    
    toast({
      title: 'Auto Ripple',
      description: currentConfig.autoRipple ? 'Disabled' : 'Enabled',
      duration: 1000
    });
  }, [updateConfig, toast]);

  const toggleGapClosing = useCallback(() => {
    if (!engineRef.current) return;
    
    const currentConfig = engineRef.current.getConfig();
    updateConfig({ gapClosing: !currentConfig.gapClosing });
    
    toast({
      title: 'Gap Closing',
      description: currentConfig.gapClosing ? 'Disabled' : 'Enabled',
      duration: 1000
    });
  }, [updateConfig, toast]);

  const toggleSnapToBeat = useCallback(() => {
    if (!engineRef.current) return;
    
    const currentConfig = engineRef.current.getConfig();
    updateConfig({ snapToBeat: !currentConfig.snapToBeat });
    
    toast({
      title: 'Snap to Beat',
      description: currentConfig.snapToBeat ? 'Disabled' : 'Enabled',
      duration: 1000
    });
  }, [updateConfig, toast]);

  const detectBeats = useCallback(async (audioFile: string) => {
    if (!beatDetectorRef.current) return;

    setIsBeatDetectionActive(true);
    setIsProcessing(true);
    
    try {
      const detectedBeats = await beatDetectorRef.current.detectBeats(audioFile);
      setBeats(detectedBeats);
      
      // Add magnetic zones for detected beats
      if (engineRef.current && detectedBeats.length > 0) {
        // Add first few beats as magnetic zones
        detectedBeats.slice(0, 10).forEach((beat, index) => {
          // Add to first track or specified track
          const firstTrack = state.tracks[0];
          if (firstTrack) {
            engineRef.current?.addMagneticZone(firstTrack.id, beat.time);
          }
        });
        
        setState(engineRef.current.getState());
      }
      
      if (onBeatDetected) {
        onBeatDetected(detectedBeats);
      }
      
      toast({
        title: 'Beats Detected',
        description: `Found ${detectedBeats.length} beats in audio`,
        duration: 2000
      });
    } catch (error) {
      logger.error('Beat detection failed', error as Error, { audioFile, component: 'useMagneticTimeline' });
      toast({
        title: 'Error',
        description: 'Failed to detect beats in audio',
        variant: 'destructive'
      });
    } finally {
      setIsBeatDetectionActive(false);
      setIsProcessing(false);
    }
  }, [state.tracks, onBeatDetected, toast]);

  const addMagneticZone = useCallback((trackId: string, position: number) => {
    if (!engineRef.current) return;
    
    const newState = engineRef.current.addMagneticZone(trackId, position);
    setState(newState);
  }, []);

  const removeMagneticZone = useCallback((zoneId: string) => {
    if (!engineRef.current) return;
    
    const newState = engineRef.current.removeMagneticZone(zoneId);
    setState(newState);
  }, []);

  const getClipAtPosition = useCallback((position: number, trackId?: string): TimelineClip | null => {
    const track = trackId 
      ? state.tracks.find(t => t.id === trackId)
      : state.tracks[0];
      
    if (!track) return null;
    
    return track.clips.find(clip => 
      position >= clip.startTime && position <= clip.startTime + clip.duration
    ) || null;
  }, [state.tracks]);

  const getSnapPoints = useCallback((): number[] => {
    const snapPoints: number[] = [0]; // Timeline start
    
    state.tracks.forEach(track => {
      track.clips.forEach(clip => {
        snapPoints.push(clip.startTime);
        snapPoints.push(clip.startTime + clip.duration);
      });
    });
    
    // Add magnetic zones
    state.magneticZones?.forEach(zone => {
      snapPoints.push(zone.position);
    });
    
    return [...new Set(snapPoints)].sort((a, b) => a - b); // Remove duplicates and sort
  }, [state.tracks, state.magneticZones]);

  const getGaps = useCallback(() => {
    const gaps: Array<{ start: number; end: number; duration: number; trackId: string }> = [];
    
    state.tracks.forEach(track => {
      const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime);
      
      // Check gap before first clip
      if (sortedClips.length > 0 && sortedClips[0].startTime > 0) {
        gaps.push({
          start: 0,
          end: sortedClips[0].startTime,
          duration: sortedClips[0].startTime,
          trackId: track.id
        });
      }
      
      // Check gaps between clips
      for (let i = 1; i < sortedClips.length; i++) {
        const prevEnd = sortedClips[i - 1].startTime + sortedClips[i - 1].duration;
        const currStart = sortedClips[i].startTime;
        
        if (currStart > prevEnd) {
          gaps.push({
            start: prevEnd,
            end: currStart,
            duration: currStart - prevEnd,
            trackId: track.id
          });
        }
      }
    });
    
    return gaps;
  }, [state.tracks]);

  return {
    state,
    config: engineRef.current?.getConfig() || {
      autoRipple: true,
      gapClosing: true,
      snapToBeat: false,
      snapThreshold: 50,
      rippleDelay: 100
    },
    isProcessing,
    beats,
    isBeatDetectionActive,
    
    // Actions
    moveClip,
    deleteClip,
    updateConfig,
    toggleAutoRipple,
    toggleGapClosing,
    toggleSnapToBeat,
    detectBeats,
    addMagneticZone,
    removeMagneticZone,
    
    // State helpers
    getClipAtPosition,
    getSnapPoints,
    getGaps
  };
};