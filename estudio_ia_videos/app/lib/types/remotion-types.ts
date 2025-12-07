import { z } from 'zod';
import { TimelineProject } from './timeline-types';

export const RemotionConfigSchema = z.object({
  fps: z.number().default(30),
  durationInFrames: z.number(),
  width: z.number().default(1920),
  height: z.number().default(1080),
  codec: z.string().default('h264'),
});

export type RemotionConfig = z.infer<typeof RemotionConfigSchema>;

export interface RemotionComposition {
  id: string;
  component: React.ComponentType<any>;
  props: Record<string, unknown>;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

export const QUALITY_PRESETS: Record<string, { name: string; width: number; height: number; bitrate: string; audioBitrate: string }> = {
  '720p': { name: 'HD (720p)', width: 1280, height: 720, bitrate: '2M', audioBitrate: '128k' },
  '1080p': { name: 'Full HD (1080p)', width: 1920, height: 1080, bitrate: '5M', audioBitrate: '192k' },
  '4k': { name: '4K Ultra HD', width: 3840, height: 2160, bitrate: '15M', audioBitrate: '320k' },
};

export interface RenderJob {
  id: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: string;
  updatedAt: string;
  outputUrl?: string;
  error?: string;
}

export interface RenderProgress {
  progress: number;
  status: string;
  frame?: number;
  totalFrames?: number;
  percentage?: number;
  renderedInSeconds?: number;
  estimatedTimeRemaining?: number;
}

export interface ExportSettings {
  format: 'mp4' | 'webm' | 'gif' | 'mp3' | 'wav';
  quality: number;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
  audioCodec?: string;
  bitrate?: string;
  audioBitrate?: string;
  fps?: number;
  scale?: number;
}

export interface QualityPreset {
  name: string;
  width: number;
  height: number;
  fps: number;
  crf: number;
  bitrate: string;
  format: string;
}

export interface VideoCompositionProps {
  project: TimelineProject;
  config?: {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    composition: string;
  };
  [key: string]: unknown;
}
