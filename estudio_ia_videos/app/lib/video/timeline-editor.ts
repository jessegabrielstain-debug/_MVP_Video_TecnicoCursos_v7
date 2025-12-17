/**
 * Timeline Editor Module
 * 
 * Editor de timeline não-linear para composição de vídeos
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { randomUUID } from 'crypto';
import { Logger } from '@/lib/logger';

const logger = new Logger('TimelineEditor');

// ==================== TYPES ====================

export type TrackType = 'video' | 'audio' | 'both';

export interface Transition {
  type: string;
  duration: number;
}

export interface TimelineClip {
  id: string;
  filePath: string;
  startTime: number;
  endTime: number;
  duration: number;
  timelineStart: number;
  timelineEnd: number;
  speed?: number;
  volume?: number;
  transition?: Transition;
}

export interface TimelineTrack {
  id: string;
  type: TrackType;
  clips: TimelineClip[];
  volume: number;
  muted: boolean;
  locked: boolean;
}

export interface TimelineConfig {
  tracks: TimelineTrack[];
  fps: number;
  resolution: { width: number; height: number };
  flow?: ContinuousFlowOptions;
}

export interface ExportOptions {
  outputPath: string;
  videoCodec?: string;
  audioCodec?: string;
  preset?: string;
  crf?: number;
  audioBitrate?: string;
  enableFlow?: boolean;
}

export interface PreviewResult {
  success: boolean;
  thumbnailPath?: string;
  timestamp: number;
}

export interface ExportResult {
  success: boolean;
  outputPath: string;
  clipCount: number;
  trackCount: number;
}

export type TransitionType = 'fade' | 'dissolve' | 'wipe' | 'slide';

export interface ContinuousFlowOptions {
  enabled: boolean;
  bpmSource: 'auto' | 'manual';
  bpmManual?: number;
  beatToleranceMs?: number;
  crossfadeRatio?: number; // 0.25..0.5 of beat period
  sidechain?: { threshold?: number; ratio?: number };
}

// ==================== TIMELINE EDITOR CLASS ====================

export default class TimelineEditor extends EventEmitter {
  private timeline: TimelineConfig;

  constructor(config?: Partial<TimelineConfig>) {
    super();
    this.timeline = {
      tracks: [],
      fps: 30,
      resolution: { width: 1920, height: 1080 },
      ...config
    };
  }

  getTimeline(): TimelineConfig {
    return this.timeline;
  }

  addTrack(type: TrackType, options: { volume?: number } = {}): string {
    const id = `track_${randomUUID()}`;
    this.timeline.tracks.push({
      id,
      type,
      clips: [],
      volume: options.volume ?? 1.0,
      muted: false,
      locked: false
    });
    this.emit('track-added', { trackId: id, type });
    return id;
  }

  setContinuousFlow(options: ContinuousFlowOptions): void {
    this.timeline.flow = { ...options };
    this.emit('flow-updated', { flow: this.timeline.flow });
  }

  private estimateBeatPeriodMs(): number | null {
    const bpm = this.timeline.flow?.bpmSource === 'manual' ? this.timeline.flow?.bpmManual : undefined;
    if (bpm && bpm > 0) {
      return (60_000 / bpm);
    }
    // Fallback: assume moderate tempo
    return 60_000 / 100; // 100 BPM default when auto not implemented
  }

  snapClipsToBeat(trackId: string): void {
    const beatPeriod = this.estimateBeatPeriodMs();
    if (!beatPeriod) return;
    const tolerance = this.timeline.flow?.beatToleranceMs ?? 25;
    const track = this.timeline.tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track não encontrada');
    for (const clip of track.clips) {
      const startMs = clip.timelineStart * 1000;
      const endMs = clip.timelineEnd * 1000;
      const startBeat = Math.round(startMs / beatPeriod) * beatPeriod;
      const endBeat = Math.round(endMs / beatPeriod) * beatPeriod;
      if (Math.abs(startBeat - startMs) <= tolerance) {
        clip.timelineStart = startBeat / 1000;
        clip.timelineEnd = clip.timelineStart + clip.duration;
      }
      if (Math.abs(endBeat - endMs) <= tolerance) {
        clip.timelineEnd = endBeat / 1000;
        clip.duration = clip.timelineEnd - clip.timelineStart;
      }
    }
    this.emit('clips-snapped', { trackId });
  }

  applyAdaptiveCrossfades(trackId: string): void {
    const period = this.estimateBeatPeriodMs();
    if (!period) return;
    const ratio = this.timeline.flow?.crossfadeRatio ?? 0.35;
    const durationSec = (period * ratio) / 1000;
    const track = this.timeline.tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track não encontrada');
    for (let i = 0; i < track.clips.length - 1; i++) {
      const a = track.clips[i];
      const b = track.clips[i + 1];
      b.transition = { type: 'fade', duration: durationSec };
    }
    this.emit('crossfades-applied', { trackId, durationSec });
  }

  removeTrack(trackId: string): boolean {
    const index = this.timeline.tracks.findIndex(t => t.id === trackId);
    if (index === -1) throw new Error('Track não encontrada');
    
    if (this.timeline.tracks[index].locked) {
      throw new Error('Track travada');
    }

    this.timeline.tracks.splice(index, 1);
    this.emit('track-removed', { trackId });
    return true;
  }

  async addClip(trackId: string, options: { 
    filePath: string; 
    startTime: number; 
    endTime: number; 
    timelineStart?: number;
    transition?: Transition;
    speed?: number;
    volume?: number;
  }): Promise<string> {
    const track = this.timeline.tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track não encontrada');

    // Validar arquivo
    try {
      await fs.access(options.filePath);
    } catch {
      throw new Error('Arquivo não encontrado');
    }

    if (options.endTime <= options.startTime) {
      throw new Error('Tempos de clip inválidos');
    }

    const duration = options.endTime - options.startTime;
    const id = `clip_${randomUUID()}`;
    
    // Calcular posição na timeline se não fornecida
    let timelineStart = options.timelineStart;
    if (timelineStart === undefined) {
      const lastClip = track.clips[track.clips.length - 1];
      timelineStart = lastClip ? lastClip.timelineEnd : 0;
    }

    const clip: TimelineClip = {
      id,
      filePath: options.filePath,
      startTime: options.startTime,
      endTime: options.endTime,
      duration,
      timelineStart,
      timelineEnd: timelineStart + duration,
      transition: options.transition,
      speed: options.speed,
      volume: options.volume
    };

    track.clips.push(clip);
    this.sortClips(track);
    
    this.emit('clip-added', { trackId, clipId: id });
    return id;
  }

  removeClip(trackId: string, clipId: string): boolean {
    const track = this.timeline.tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track não encontrada');

    const index = track.clips.findIndex(c => c.id === clipId);
    if (index === -1) return false;

    track.clips.splice(index, 1);
    return true;
  }

  async trimClip(trackId: string, clipId: string, options: { startTime?: number; endTime?: number; duration?: number }): Promise<void> {
    const track = this.timeline.tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track não encontrada');

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) throw new Error('Clip não encontrado');

    const oldDuration = clip.duration;

    if (options.startTime !== undefined) {
      clip.startTime = options.startTime;
    }

    if (options.duration) {
      clip.duration = options.duration;
      clip.endTime = clip.startTime + options.duration;
    } else if (options.endTime !== undefined) {
      if (options.endTime <= clip.startTime) throw new Error('Tempos de trim inválidos');
      clip.endTime = options.endTime;
      clip.duration = clip.endTime - clip.startTime;
    }

    clip.timelineEnd = clip.timelineStart + clip.duration;
    
    this.emit('clip-trimmed', { clipId, oldDuration, newDuration: clip.duration });
  }

  async splitClip(trackId: string, clipId: string, options: { timestamp: number }): Promise<[string, string]> {
    const track = this.timeline.tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track não encontrada');

    const clipIndex = track.clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) throw new Error('Clip não encontrado');

    const clip = track.clips[clipIndex];
    
    // Validar ponto de divisão (relativo à duração do clip)
    if (options.timestamp >= clip.duration || options.timestamp <= 0) {
      throw new Error('Ponto de divisão inválido');
    }

    // Criar dois novos clips
    const splitPoint = clip.startTime + options.timestamp;
    
    const clip1: TimelineClip = {
      ...clip,
      id: `clip_${randomUUID()}`,
      endTime: splitPoint,
      duration: options.timestamp,
      timelineEnd: clip.timelineStart + options.timestamp
    };

    const clip2: TimelineClip = {
      ...clip,
      id: `clip_${randomUUID()}`,
      startTime: splitPoint,
      duration: clip.duration - options.timestamp,
      timelineStart: clip.timelineStart + options.timestamp
    };

    // Substituir clip original pelos dois novos
    track.clips.splice(clipIndex, 1, clip1, clip2);
    
    return [clip1.id, clip2.id];
  }

  moveClip(trackId: string, clipId: string, newTimelineStart: number): void {
    const track = this.timeline.tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track não encontrada');

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) throw new Error('Clip não encontrado');

    clip.timelineStart = newTimelineStart;
    clip.timelineEnd = newTimelineStart + clip.duration;
    
    this.sortClips(track);
  }

  moveClipToTrack(fromTrackId: string, toTrackId: string, clipId: string): void {
    const fromTrack = this.timeline.tracks.find(t => t.id === fromTrackId);
    const toTrack = this.timeline.tracks.find(t => t.id === toTrackId);
    
    if (!fromTrack || !toTrack) throw new Error('Track não encontrada');
    
    if (fromTrack.type !== toTrack.type && fromTrack.type !== 'both' && toTrack.type !== 'both') {
      throw new Error('Tipos de track incompatíveis');
    }

    const clipIndex = fromTrack.clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) throw new Error('Clip não encontrado');

    const clip = fromTrack.clips[clipIndex];
    fromTrack.clips.splice(clipIndex, 1);
    toTrack.clips.push(clip);
    
    this.sortClips(toTrack);
  }

  applyTransition(trackId: string, clipId: string, transition: Transition): void {
    const track = this.timeline.tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track não encontrada');

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) throw new Error('Clip não encontrado');

    clip.transition = transition;
  }

  getTimelineDuration(): number {
    let maxDuration = 0;
    for (const track of this.timeline.tracks) {
      for (const clip of track.clips) {
        if (clip.timelineEnd > maxDuration) {
          maxDuration = clip.timelineEnd;
        }
      }
    }
    return maxDuration;
  }

  getTotalClipCount(): number {
    return this.timeline.tracks.reduce((acc, track) => acc + track.clips.length, 0);
  }

  clearTimeline(): void {
    this.timeline.tracks = [];
  }

  loadTimeline(config: TimelineConfig): void {
    this.timeline = { ...config };
  }

  async generatePreview(timestamp: number): Promise<PreviewResult> {
    this.emit('preview-start', { timestamp });
    
    // Mock implementation
    const result = {
      success: true,
      thumbnailPath: `preview_${timestamp}_${randomUUID()}.jpg`,
      timestamp
    };

    this.emit('preview-complete', result);
    return result;
  }

  async export(options: ExportOptions): Promise<ExportResult> {
    if (this.getTotalClipCount() === 0) {
      throw new Error('Timeline vazia');
    }

    // Verificar overlaps
    for (const track of this.timeline.tracks) {
      for (let i = 0; i < track.clips.length - 1; i++) {
        const current = track.clips[i];
        const next = track.clips[i + 1];
        if (current.timelineEnd > next.timelineStart) {
          throw new Error('Overlap detectado');
        }
      }
    }

    this.emit('export-start', { tracks: this.timeline.tracks.length });

    // Mock FFmpeg execution + flow filters when enabled
    const command = ffmpeg();
    if (options.videoCodec) command.videoCodec(options.videoCodec);
    if (options.audioCodec) command.audioCodec(options.audioCodec);
    
    const outputOptions = [];
    if (options.preset) outputOptions.push(`-preset ${options.preset}`);
    if (options.crf) outputOptions.push(`-crf ${options.crf}`);
    if (options.audioBitrate) outputOptions.push(`-b:a ${options.audioBitrate}`);
    
    if (outputOptions.length > 0) {
      command.outputOptions(outputOptions);
    }

    if (options.enableFlow && this.timeline.flow?.enabled) {
      const sidechain = this.timeline.flow.sidechain ?? { threshold: 0.015, ratio: 4 };
      try {
        command.audioFilters([
          `sidechaincompress=threshold=${sidechain.threshold ?? 0.015}:ratio=${sidechain.ratio ?? 4}`,
        ]);
      } catch (error) {
        // Sidechain filter não suportado - continua sem ele
        logger.warn('Sidechain audio filter not supported, skipping', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      // Video filters placeholders for slow-motion/time-lapse (applied per clip in real pipeline)
    }

    this.emit('export-progress', { percent: 50 });

    const result = {
      success: true,
      outputPath: options.outputPath,
      clipCount: this.getTotalClipCount(),
      trackCount: this.timeline.tracks.length
    };

    this.emit('export-complete', result);
    return result;
  }

  private sortClips(track: TimelineTrack): void {
    track.clips.sort((a, b) => a.timelineStart - b.timelineStart);
  }
}

// ==================== FACTORY FUNCTIONS ====================

export function createBasicEditor(): TimelineEditor {
  return new TimelineEditor();
}

export function createHighQualityEditor(): { editor: TimelineEditor; exportOptions: ExportOptions } {
  return {
    editor: new TimelineEditor(),
    exportOptions: {
      outputPath: 'output.mp4',
      videoCodec: 'libx265',
      preset: 'slow',
      crf: 18
    }
  };
}

export function createSocialMediaEditor(): { editor: TimelineEditor; config: TimelineConfig; exportOptions: ExportOptions } {
  const config: TimelineConfig = {
    tracks: [],
    fps: 30,
    resolution: { width: 1080, height: 1920 }
  };
  
  return {
    editor: new TimelineEditor(config),
    config,
    exportOptions: {
      outputPath: 'output.mp4',
      preset: 'fast'
    }
  };
}

export function createCourseEditor(): { editor: TimelineEditor; config: TimelineConfig; exportOptions: ExportOptions } {
  const config: TimelineConfig = {
    tracks: [],
    fps: 30,
    resolution: { width: 1920, height: 1080 }
  };
  
  return {
    editor: new TimelineEditor(config),
    config,
    exportOptions: {
      outputPath: 'output.mp4',
      crf: 20
    }
  };
}
