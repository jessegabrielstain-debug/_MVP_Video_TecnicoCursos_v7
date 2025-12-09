import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

export interface Beat {
  time: number; // milliseconds
  confidence: number; // 0-1
  intensity: 'low' | 'medium' | 'high';
}

export interface BeatDetectionConfig {
  sensitivity: number; // 0-1
  minConfidence: number; // 0-1
  maxBeatsPerMinute: number;
  minBeatsPerMinute: number;
}

export class BeatDetectorService {
  private config: BeatDetectionConfig;
  private tempDir: string;

  constructor(config: BeatDetectionConfig, tempDir: string = '/tmp/beats') {
    this.config = config;
    this.tempDir = tempDir;
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * Detect beats in audio file using FFmpeg and aubio
   */
  async detectBeats(audioPath: string): Promise<Beat[]> {
    try {
      // Extract audio if it's a video file
      const audioFile = await this.extractAudioIfNeeded(audioPath);
      
      // Use aubio for beat detection
      const beats = await this.detectBeatsWithAubio(audioFile);
      
      // Filter and classify beats
      const filteredBeats = this.filterBeats(beats);
      const classifiedBeats = this.classifyBeats(filteredBeats, audioFile);
      
      // Clean up temporary files
      if (audioFile !== audioPath) {
        await fs.unlink(audioFile).catch(() => {});
      }
      
      return classifiedBeats;
    } catch (error) {
      logger.error('Beat detection failed', error instanceof Error ? error : new Error(String(error)), { component: 'BeatDetector' });
      return [];
    }
  }

  /**
   * Extract audio from video file if needed
   */
  private async extractAudioIfNeeded(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    // If it's already an audio file, return as-is
    if (['.mp3', '.wav', '.aac', '.m4a', '.flac'].includes(ext)) {
      return filePath;
    }

    // Extract audio to temporary file
    const audioFile = path.join(this.tempDir, `audio_${Date.now()}.wav`);
    
    const command = `ffmpeg -i "${filePath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${audioFile}" -y`;
    
    try {
      await execAsync(command);
      return audioFile;
    } catch (error) {
      throw new Error(`Failed to extract audio: ${error}`);
    }
  }

  /**
   * Detect beats using aubio
   */
  private async detectBeatsWithAubio(audioFile: string): Promise<Beat[]> {
    const beats: Beat[] = [];
    
    try {
      // Use aubio beat detection
      const command = `aubio beat "${audioFile}"`;
      const { stdout } = await execAsync(command);
      
      // Parse aubio output
      const lines = stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const match = line.match(/(\d+\.\d+)\s+(\d+\.\d+)/);
        if (match) {
          const time = parseFloat(match[1]) * 1000; // Convert to milliseconds
          const confidence = parseFloat(match[2]);
          
          beats.push({
            time,
            confidence,
            intensity: 'medium' // Will be classified later
          });
        }
      }
      
      return beats;
    } catch (error) {
      // Fallback to simple energy-based detection if aubio is not available
      return this.detectBeatsWithFFmpeg(audioFile);
    }
  }

  /**
   * Fallback beat detection using FFmpeg
   */
  private async detectBeatsWithFFmpeg(audioFile: string): Promise<Beat[]> {
    const beats: Beat[] = [];
    
    try {
      // Use FFmpeg's astats filter to detect energy peaks
      const command = `ffmpeg -i "${audioFile}" -af astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level -f null -`;
      const { stderr } = await execAsync(command);
      
      // Parse FFmpeg output for energy levels
      const lines = stderr.split('\n').filter(line => line.includes('RMS_level'));
      const energyLevels: number[] = [];
      
      for (const line of lines) {
        const match = line.match(/RMS_level=(-?\d+\.\d+)/);
        if (match) {
          energyLevels.push(parseFloat(match[1]));
        }
      }
      
      // Detect peaks in energy levels
      const peaks = this.detectPeaks(energyLevels);
      
      // Convert peaks to beats
      const sampleRate = 44100; // Standard audio sample rate
      const hopSize = 1024; // Typical hop size for analysis
      
      peaks.forEach((peak, index) => {
        if (peak.isPeak) {
          const time = (index * hopSize / sampleRate) * 1000; // Convert to milliseconds
          beats.push({
            time,
            confidence: peak.confidence,
            intensity: 'medium'
          });
        }
      });
      
      return beats;
    } catch (error) {
      logger.error('FFmpeg beat detection failed', error instanceof Error ? error : new Error(String(error)), { component: 'BeatDetector' });
      return [];
    }
  }

  /**
   * Detect peaks in energy levels
   */
  private detectPeaks(energyLevels: number[]): Array<{ isPeak: boolean; confidence: number }> {
    const peaks: Array<{ isPeak: boolean; confidence: number }> = [];
    const windowSize = 10;
    const threshold = this.config.sensitivity;
    
    for (let i = windowSize; i < energyLevels.length - windowSize; i++) {
      const current = energyLevels[i];
      const window = energyLevels.slice(i - windowSize, i + windowSize + 1);
      const localMean = window.reduce((sum, val) => sum + val, 0) / window.length;
      const localStd = Math.sqrt(window.reduce((sum, val) => sum + Math.pow(val - localMean, 2), 0) / window.length);
      
      // Check if current is a peak
      const isPeak = current > localMean + (threshold * localStd);
      const confidence = Math.min(1, Math.abs(current - localMean) / localStd);
      
      peaks.push({ isPeak, confidence });
    }
    
    // Pad beginning and end
    for (let i = 0; i < windowSize; i++) {
      peaks.unshift({ isPeak: false, confidence: 0 });
    }
    for (let i = 0; i < windowSize; i++) {
      peaks.push({ isPeak: false, confidence: 0 });
    }
    
    return peaks;
  }

  /**
   * Filter beats by confidence and tempo
   */
  private filterBeats(beats: Beat[]): Beat[] {
    // Filter by minimum confidence
    let filtered = beats.filter(beat => beat.confidence >= this.config.minConfidence);
    
    // Calculate tempo
    if (filtered.length > 1) {
      const intervals = [];
      for (let i = 1; i < filtered.length; i++) {
        intervals.push(filtered[i].time - filtered[i - 1].time);
      }
      
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const bpm = 60000 / avgInterval; // Convert ms to BPM
      
      // Filter by tempo range
      filtered = filtered.filter((beat, index) => {
        if (index === 0) return true;
        const interval = beat.time - filtered[index - 1].time;
        const beatBpm = 60000 / interval;
        return beatBpm >= this.config.minBeatsPerMinute && beatBpm <= this.config.maxBeatsPerMinute;
      });
    }
    
    return filtered;
  }

  /**
   * Classify beats by intensity
   */
  private async classifyBeats(beats: Beat[], audioFile: string): Promise<Beat[]> {
    try {
      // Use FFmpeg to analyze spectral content around each beat
      const classifiedBeats = await Promise.all(
        beats.map(async (beat) => {
          const startTime = Math.max(0, (beat.time / 1000) - 0.1); // 100ms before
          const duration = 0.2; // 200ms window
          
          // Extract audio segment around beat
          const segmentFile = path.join(this.tempDir, `segment_${Date.now()}.wav`);
          const command = `ffmpeg -i "${audioFile}" -ss ${startTime} -t ${duration} -y "${segmentFile}"`;
          
          await execAsync(command);
          
          // Analyze spectral content
          const spectralCommand = `ffmpeg -i "${segmentFile}" -af spectrastats,ametadata=print:key=lavfi.spectrastats.Overall.mean -f null -`;
          const { stderr } = await execAsync(spectralCommand);
          
          // Parse spectral data
          const spectralMatch = stderr.match(/mean=(-?\d+\.\d+)/);
          const spectralMean = spectralMatch ? parseFloat(spectralMatch[1]) : 0;
          
          // Classify intensity based on spectral content
          let intensity: 'low' | 'medium' | 'high' = 'medium';
          if (spectralMean > -20) {
            intensity = 'high';
          } else if (spectralMean > -40) {
            intensity = 'medium';
          } else {
            intensity = 'low';
          }
          
          // Clean up
          await fs.unlink(segmentFile).catch(() => {});
          
          return {
            ...beat,
            intensity
          };
        })
      );
      
      return classifiedBeats;
    } catch (error) {
      logger.error('Beat classification failed', error instanceof Error ? error : new Error(String(error)), { component: 'BeatDetector' });
      return beats.map(beat => ({ ...beat, intensity: 'medium' as const }));
    }
  }

  /**
   * Get beat grid for timeline
   */
  getBeatGrid(beats: Beat[], startTime: number = 0, endTime?: number): Array<{
    time: number;
    intensity: 'low' | 'medium' | 'high';
    confidence: number;
  }> {
    const filteredBeats = beats.filter(beat => {
      if (beat.time < startTime) return false;
      if (endTime && beat.time > endTime) return false;
      return true;
    });
    
    return filteredBeats.map(beat => ({
      time: beat.time,
      intensity: beat.intensity,
      confidence: beat.confidence
    }));
  }

  /**
   * Find optimal cut points near beats
   */
  findOptimalCutPoints(beats: Beat[], targetTime: number, tolerance: number = 100): Beat[] {
    return beats.filter(beat => 
      Math.abs(beat.time - targetTime) <= tolerance
    ).sort((a, b) => {
      // Sort by proximity to target time, then by confidence
      const distA = Math.abs(a.time - targetTime);
      const distB = Math.abs(b.time - targetTime);
      
      if (distA !== distB) {
        return distA - distB;
      }
      
      return b.confidence - a.confidence;
    });
  }
}