export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
  type: 'silence' | 'breath' | 'filler';
  confidence: number;
}

export interface SilenceDetectionOptions {
  silenceThreshold: number; // dB threshold for silence detection (-50 to -10)
  minSilenceDuration: number; // minimum duration to consider as silence (seconds)
  breathDetection: boolean; // enable breath sound detection
  fillerWordDetection: boolean; // enable filler word detection (um, uh, etc.)
  minBreathDuration: number; // minimum breath duration (seconds)
  maxBreathDuration: number; // maximum breath duration (seconds)
  padding: number; // padding around detected segments (seconds)
}

export interface SilenceDetectionResult {
  segments: SilenceSegment[];
  totalSilenceDuration: number;
  totalBreathDuration: number;
  totalFillerDuration: number;
  originalDuration: number;
  processedDuration: number;
  silenceRatio: number; // ratio of silence to total duration
  audioQuality: number; // quality score (0-100)
}

export interface SilenceRemovalPreset {
  name: string;
  description: string;
  options: Partial<SilenceDetectionOptions>;
}

export const SILENCE_REMOVAL_PRESETS: SilenceRemovalPreset[] = [
  {
    name: 'Aggressive',
    description: 'Remove most silence and breath sounds for fast-paced content',
    options: {
      silenceThreshold: -35,
      minSilenceDuration: 0.3,
      breathDetection: true,
      fillerWordDetection: true,
      minBreathDuration: 0.1,
      maxBreathDuration: 0.5,
      padding: 0.02,
    }
  },
  {
    name: 'Balanced',
    description: 'Good balance between natural flow and efficiency',
    options: {
      silenceThreshold: -30,
      minSilenceDuration: 0.5,
      breathDetection: true,
      fillerWordDetection: false,
      minBreathDuration: 0.1,
      maxBreathDuration: 0.8,
      padding: 0.05,
    }
  },
  {
    name: 'Conservative',
    description: 'Minimal removal, preserves natural speech patterns',
    options: {
      silenceThreshold: -25,
      minSilenceDuration: 1.0,
      breathDetection: false,
      fillerWordDetection: false,
      minBreathDuration: 0.2,
      maxBreathDuration: 1.0,
      padding: 0.1,
    }
  },
  {
    name: 'Podcast',
    description: 'Optimized for podcast audio with natural pauses',
    options: {
      silenceThreshold: -32,
      minSilenceDuration: 0.8,
      breathDetection: true,
      fillerWordDetection: true,
      minBreathDuration: 0.15,
      maxBreathDuration: 0.6,
      padding: 0.08,
    }
  },
  {
    name: 'Educational',
    description: 'Preserves important pauses for learning content',
    options: {
      silenceThreshold: -28,
      minSilenceDuration: 1.2,
      breathDetection: false,
      fillerWordDetection: true,
      minBreathDuration: 0.2,
      maxBreathDuration: 0.8,
      padding: 0.1,
    }
  }
];

export interface SilenceRemovalJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  originalFileSize: number;
  processedFileSize?: number;
  progress: number;
  result?: SilenceDetectionResult;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  options: SilenceDetectionOptions;
}

export interface SilenceRemovalStats {
  totalFilesProcessed: number;
  totalTimeSaved: number; // seconds
  averageSilenceRatio: number;
  averageAudioQuality: number;
  mostCommonSegmentType: 'silence' | 'breath' | 'filler';
  processingHistory: SilenceRemovalJob[];
}