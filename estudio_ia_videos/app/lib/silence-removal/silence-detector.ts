import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
  type: 'silence' | 'breath' | 'filler';
  confidence: number;
}

export interface SilenceDetectionOptions {
  silenceThreshold: number; // dB threshold for silence detection
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
  silenceRatio: number;
  audioQuality: number;
}

export class SilenceDetector {
  private readonly tempDir: string;

  constructor(tempDir: string = '/tmp/silence-detection') {
    this.tempDir = tempDir;
  }

  async detectSilence(
    audioPath: string,
    options: Partial<SilenceDetectionOptions> = {}
  ): Promise<SilenceDetectionResult> {
    const opts: SilenceDetectionOptions = {
      silenceThreshold: -30,
      minSilenceDuration: 0.5,
      breathDetection: true,
      fillerWordDetection: true,
      minBreathDuration: 0.1,
      maxBreathDuration: 0.8,
      padding: 0.05,
      ...options
    };

    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      // Get audio duration
      const duration = await this.getAudioDuration(audioPath);

      // Detect silence segments
      const silenceSegments = await this.detectSilenceSegments(audioPath, opts);

      // Detect breath segments if enabled
      const breathSegments = opts.breathDetection
        ? await this.detectBreathSegments(audioPath, opts)
        : [];

      // Detect filler words if enabled
      const fillerSegments = opts.fillerWordDetection
        ? await this.detectFillerWords(audioPath, opts)
        : [];

      // Combine and sort all segments
      const allSegments = [...silenceSegments, ...breathSegments, ...fillerSegments]
        .sort((a, b) => a.start - b.start);

      // Remove overlapping segments
      const mergedSegments = this.mergeOverlappingSegments(allSegments);

      // Calculate statistics
      const totalSilenceDuration = silenceSegments.reduce((sum, seg) => sum + seg.duration, 0);
      const totalBreathDuration = breathSegments.reduce((sum, seg) => sum + seg.duration, 0);
      const totalFillerDuration = fillerSegments.reduce((sum, seg) => sum + seg.duration, 0);
      const totalRemovedDuration = mergedSegments.reduce((sum, seg) => sum + seg.duration, 0);
      const processedDuration = duration - totalRemovedDuration;

      // Calculate audio quality score (0-100)
      const silenceRatio = totalSilenceDuration / duration;
      const breathRatio = totalBreathDuration / duration;
      const audioQuality = Math.max(0, Math.min(100, 100 - (silenceRatio * 50) - (breathRatio * 30)));

      return {
        segments: mergedSegments,
        totalSilenceDuration,
        totalBreathDuration,
        totalFillerDuration,
        originalDuration: duration,
        processedDuration,
        silenceRatio,
        audioQuality
      };
    } catch (error) {
      logger.error('Error detecting silence', error instanceof Error ? error : new Error(String(error)), { component: 'SilenceDetector' });
      throw new Error(`Failed to detect silence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
      );
      return parseFloat(stdout.trim());
    } catch (error) {
      throw new Error(`Failed to get audio duration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async detectSilenceSegments(
    audioPath: string,
    options: SilenceDetectionOptions
  ): Promise<SilenceSegment[]> {
    try {
      const { stdout } = await execAsync(
        `ffmpeg -i "${audioPath}" -af silencedetect=noise=${options.silenceThreshold}dB:d=${options.minSilenceDuration} -f null -`
      );

      const segments: SilenceSegment[] = [];
      const silenceStartRegex = /silence_start: ([\d.]+)/g;
      const silenceEndRegex = /silence_end: ([\d.]+)/g;

      const silenceStarts: number[] = [];
      const silenceEnds: number[] = [];

      let match;
      while ((match = silenceStartRegex.exec(stdout)) !== null) {
        silenceStarts.push(parseFloat(match[1]));
      }
      while ((match = silenceEndRegex.exec(stdout)) !== null) {
        silenceEnds.push(parseFloat(match[1]));
      }

      for (let i = 0; i < Math.min(silenceStarts.length, silenceEnds.length); i++) {
        const start = Math.max(0, silenceStarts[i] - options.padding);
        const end = silenceEnds[i] + options.padding;
        const duration = end - start;

        if (duration >= options.minSilenceDuration) {
          segments.push({
            start,
            end,
            duration,
            type: 'silence',
            confidence: 0.9
          });
        }
      }

      return segments;
    } catch (error) {
      logger.error('Error detecting silence segments', error instanceof Error ? error : new Error(String(error)), { component: 'SilenceDetector' });
      return [];
    }
  }

  private async detectBreathSegments(
    audioPath: string,
    options: SilenceDetectionOptions
  ): Promise<SilenceSegment[]> {
    try {
      // Extract audio features for breath detection
      const featuresPath = path.join(this.tempDir, 'audio_features.txt');
      
      // Use aubio to extract spectral features
      await execAsync(
        `aubiopitch -i "${audioPath}" -o "${featuresPath}" -s -20 -t 0.5`
      );

      // Analyze features for breath patterns
      const featuresContent = await fs.readFile(featuresPath, 'utf-8');
      const lines = featuresContent.split('\n').filter(line => line.trim());

      const segments: SilenceSegment[] = [];
      let currentBreathStart: number | null = null;
      let breathEnergy = 0;

      for (const line of lines) {
        const [time, frequency, energy] = line.split('\t').map(parseFloat);
        
        if (isNaN(time) || isNaN(frequency) || isNaN(energy)) continue;

        // Detect breath patterns (low frequency, low energy)
        if (frequency < 200 && energy < -40 && !currentBreathStart) {
          currentBreathStart = time;
          breathEnergy = energy;
        } else if (currentBreathStart && (frequency > 300 || energy > -30)) {
          const duration = time - currentBreathStart;
          
          if (duration >= options.minBreathDuration && duration <= options.maxBreathDuration) {
            segments.push({
              start: Math.max(0, currentBreathStart - options.padding),
              end: time + options.padding,
              duration: duration + (2 * options.padding),
              type: 'breath',
              confidence: Math.min(0.9, Math.max(0.6, 1 - Math.abs(breathEnergy / 50)))
            });
          }
          
          currentBreathStart = null;
        }
      }

      return segments;
    } catch (error) {
      logger.error('Error detecting breath segments', error instanceof Error ? error : new Error(String(error)), { component: 'SilenceDetector' });
      return [];
    }
  }

  private async detectFillerWords(
    audioPath: string,
    options: SilenceDetectionOptions
  ): Promise<SilenceSegment[]> {
    try {
      // This is a simplified implementation
      // In a real implementation, you'd use speech recognition to detect filler words
      const segments: SilenceSegment[] = [];
      
      // Common filler words in Portuguese and English
      const fillerWords = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'tipo', 'né', 'sabe'];
      
      // For now, return empty array - this would need speech-to-text integration
      return segments;
    } catch (error) {
      logger.error('Error detecting filler words', error instanceof Error ? error : new Error(String(error)), { component: 'SilenceDetector' });
      return [];
    }
  }

  private mergeOverlappingSegments(segments: SilenceSegment[]): SilenceSegment[] {
    if (segments.length === 0) return [];

    const merged: SilenceSegment[] = [];
    let current = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
      const next = segments[i];
      
      // Check if segments overlap or are very close
      if (next.start <= current.end + 0.1) {
        // Merge segments
        current.end = Math.max(current.end, next.end);
        current.duration = current.end - current.start;
        current.confidence = Math.max(current.confidence, next.confidence);
      } else {
        // No overlap, add current and start new segment
        merged.push(current);
        current = { ...next };
      }
    }
    
    merged.push(current);
    return merged;
  }

  async removeSilence(
    inputPath: string,
    outputPath: string,
    segments: SilenceSegment[]
  ): Promise<void> {
    try {
      if (segments.length === 0) {
        // No segments to remove, just copy the file
        await fs.copyFile(inputPath, outputPath);
        return;
      }

      // Build FFmpeg complex filter for removing segments
      const filterComplex = this.buildSilenceRemovalFilter(segments);
      
      await execAsync(
        `ffmpeg -i "${inputPath}" -filter_complex "${filterComplex}" -c:v copy -c:a aac -b:a 192k "${outputPath}"`
      );
    } catch (error) {
      throw new Error(`Failed to remove silence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSilenceRemovalFilter(segments: SilenceSegment[]): string {
    // Create a filter that keeps only the non-silent parts
    const parts: string[] = [];
    let currentTime = 0;

    for (const segment of segments) {
      if (segment.start > currentTime) {
        // Add the segment before the silence
        parts.push(`between(t,${currentTime},${segment.start})`);
      }
      currentTime = segment.end;
    }

    // Add the final segment after the last silence
    // Note: This assumes we know the total duration, which we would need to pass in
    // For now, we'll use a simpler approach with trim and concat

    // Alternative approach using trim and concat
    const trims: string[] = [];
    let segmentIndex = 0;
    currentTime = 0;

    for (const segment of segments) {
      if (segment.start > currentTime) {
        trims.push(`[0:a]atrim=start=${currentTime}:end=${segment.start},asetpts=PTS-STARTPTS[a${segmentIndex++}]`);
      }
      currentTime = segment.end;
    }

    // Concatenate all non-silent parts
    const concatInputs = trims.map((_, i) => `[a${i}]`).join('');
    const concatFilter = `${concatInputs}concat=n=${trims.length}:v=0:a=1[outa]`;

    return [...trims, concatFilter].join(';');
  }

  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      logger.error('Error cleaning up temp directory', error instanceof Error ? error : new Error(String(error)), { component: 'SilenceDetector' });
    }
  }
}