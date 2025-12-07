/**
 * Subtitle Embedder Module
 * 
 * Gerenciamento de legendas: embutir (hard/soft), transcrever, sincronizar e converter
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { randomUUID } from 'crypto';

// ==================== TYPES ====================

export enum SubtitleFormat {
  SRT = 'srt',
  VTT = 'vtt',
  ASS = 'ass',
  SSA = 'ssa'
}

export enum EmbedMode {
  HARDSUB = 'hardsub',
  SOFTSUB = 'softsub'
}

export interface SubtitleCue {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleTrack {
  language: string;
  title?: string;
  format: SubtitleFormat;
  cues: SubtitleCue[];
  default?: boolean;
  forced?: boolean;
}

export interface SubtitleStyle {
  fontName?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  [key: string]: unknown;
}

export interface EmbedOptions {
  mode: EmbedMode;
  tracks: SubtitleTrack[];
  outputPath: string;
  defaultStyle?: SubtitleStyle;
}

export interface EmbedResult {
  success: boolean;
  mode: EmbedMode;
  tracksEmbedded: number;
  outputPath: string;
}

export interface TranscriptionOptions {
  language?: string;
  maxLineLength?: number;
}

export interface TranscriptionResult {
  track: SubtitleTrack;
}

export interface SyncOptions {
  adjustTiming?: boolean;
  maxOffset?: number;
}

export interface SyncResult {
  cues: SubtitleCue[];
}

// ==================== SUBTITLE EMBEDDER CLASS ====================

export default class SubtitleEmbedder extends EventEmitter {
  constructor() {
    super();
  }

  async embed(videoPath: string, options: EmbedOptions): Promise<EmbedResult> {
    // Ensure output directory exists
    await fs.mkdir(path.dirname(options.outputPath), { recursive: true });

    if (options.mode === EmbedMode.HARDSUB) {
      return this.embedHardsub(videoPath, options);
    } else {
      return this.embedSoftsub(videoPath, options);
    }
  }

  private async embedHardsub(videoPath: string, options: EmbedOptions): Promise<EmbedResult> {
    if (options.tracks.length === 0) {
      throw new Error('No subtitle tracks provided for hardsub');
    }

    // Hardsub only supports one track (usually)
    const track = options.tracks[0];
    const tempSubPath = path.join(path.dirname(options.outputPath), `temp_${randomUUID()}.${track.format}`);
    
    // Write subtitle file
    await this.writeSubtitleFile(tempSubPath, track, options.defaultStyle);

    return new Promise((resolve, reject) => {
      const command = ffmpeg(videoPath);

      // Apply subtitles filter
      // Note: path separator handling for ffmpeg filter might be needed on Windows
      // but fluent-ffmpeg usually handles it or we need to escape.
      // For simplicity assuming standard path.
      // On Windows, paths in filters need to be escaped properly (e.g. forward slashes or escaped backslashes)
      // Here we'll assume fluent-ffmpeg handles basic cases or we use relative path if possible.
      
      // Using absolute path for filter requires escaping on Windows: C\:/path/to/file
      // Let's try to use standard path.
      
      // For hardsub, we use video filter "subtitles=filename"
      // We need to escape the path for the filter string
      const escapedPath = tempSubPath.replace(/\\/g, '/').replace(/:/g, '\\:');

      command
        .videoFilters(`subtitles='${escapedPath}'`)
        .videoCodec('libx264')
        .audioCodec('copy')
        .output(options.outputPath)
        .on('progress', (progress) => {
          this.emit('progress', progress);
        })
        .on('end', async () => {
          try {
            await fs.unlink(tempSubPath);
          } catch (e) {
            // Ignore cleanup error
          }
          this.emit('embed:complete', { success: true });
          resolve({
            success: true,
            mode: EmbedMode.HARDSUB,
            tracksEmbedded: 1,
            outputPath: options.outputPath
          });
        })
        .on('error', (err) => {
          if (this.listenerCount('error') > 0) {
            this.emit('error', err);
          }
          reject(err);
        })
        .run();
    });
  }

  private async embedSoftsub(videoPath: string, options: EmbedOptions): Promise<EmbedResult> {
    const tempFiles: string[] = [];

    return new Promise(async (resolve, reject) => {
      const command = ffmpeg(videoPath);
      
      // Copy video and audio streams
      command.videoCodec('copy').audioCodec('copy');

      // Add subtitle inputs
      for (let i = 0; i < options.tracks.length; i++) {
        const track = options.tracks[i];
        const tempSubPath = path.join(path.dirname(options.outputPath), `temp_${randomUUID()}_${i}.${track.format}`);
        await this.writeSubtitleFile(tempSubPath, track);
        tempFiles.push(tempSubPath);
        
        command.input(tempSubPath);
        
        // Map streams: 0 is video, 1..N are subtitles
        // Actually 0 is input video (v+a), 1 is first subtitle file, etc.
        // We map 0:v, 0:a, 1:s, 2:s, ...
        
        // fluent-ffmpeg mapping:
        // .outputOptions('-map 0') // Map all from input 0
        // .outputOptions('-map 1') // Map all from input 1
        
        // We need to be specific about metadata
        const streamIndex = i; // 0-based index of subtitle stream in output
        // Metadata setting is complex in fluent-ffmpeg, usually done via outputOptions
        // -metadata:s:s:0 language=eng
        
        command.outputOptions(`-metadata:s:s:${i} language=${track.language}`);
        if (track.title) {
          command.outputOptions(`-metadata:s:s:${i} title="${track.title}"`);
        }
        if (track.default) {
          command.outputOptions(`-disposition:s:${i} default`);
        }
      }

      // Map all inputs
      command.outputOptions('-map 0'); // Video + Audio from first input
      for (let i = 0; i < options.tracks.length; i++) {
        command.outputOptions(`-map ${i + 1}`); // Subtitle inputs
      }
      
      // Set codec for subtitles (usually copy or mov_text for mp4)
      // For MKV copy is fine. For MP4, srt/vtt might need conversion to mov_text
      // But let's assume copy or let ffmpeg handle it.
      command.outputOptions('-c:s copy');

      command
        .output(options.outputPath)
        .on('progress', (progress) => {
          this.emit('progress', progress);
        })
        .on('end', async () => {
          // Cleanup
          for (const file of tempFiles) {
            try { await fs.unlink(file); } catch (e) {}
          }
          this.emit('embed:complete', { success: true });
          resolve({
            success: true,
            mode: EmbedMode.SOFTSUB,
            tracksEmbedded: options.tracks.length,
            outputPath: options.outputPath
          });
        })
        .on('error', (err) => {
          if (this.listenerCount('error') > 0) {
            this.emit('error', err);
          }
          reject(err);
        })
        .run();
    });
  }

  async transcribe(videoPath: string, options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    // Mock transcription
    // In real implementation, extract audio and send to Whisper/Google/AWS
    
    const tempAudioPath = path.join(path.dirname(videoPath), `temp_audio_${randomUUID()}.mp3`);
    
    // Extract audio (mock)
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .save(tempAudioPath)
        .on('end', () => resolve())
        .on('error', reject);
    });

    // Mock result
    const track: SubtitleTrack = {
      language: 'eng',
      format: SubtitleFormat.SRT,
      cues: [
        { index: 1, startTime: 0, endTime: 2, text: 'Hello world' },
        { index: 2, startTime: 2.5, endTime: 5, text: 'This is a transcription' }
      ]
    };

    // Cleanup
    try { await fs.unlink(tempAudioPath); } catch (e) {}

    this.emit('transcription:complete', { track });
    return { track };
  }

  async synchronize(videoPath: string, subtitlePath: string, options: SyncOptions = {}): Promise<SyncResult> {
    const content = await fs.readFile(subtitlePath, 'utf-8');
    const cues = this.parseSubtitle(content, path.extname(subtitlePath).slice(1) as SubtitleFormat);
    
    // Mock synchronization logic
    // In real implementation, analyze audio waveform and align text
    
    this.emit('sync:complete', { cues });
    return { cues };
  }

  async convert(inputPath: string, outputPath: string, format: SubtitleFormat): Promise<void> {
    const content = await fs.readFile(inputPath, 'utf-8');
    const inputFormat = path.extname(inputPath).slice(1) as SubtitleFormat;
    const cues = this.parseSubtitle(content, inputFormat);
    
    const track: SubtitleTrack = {
      language: 'eng', // Default
      format: format,
      cues: cues
    };
    
    await this.writeSubtitleFile(outputPath, track);
    
    this.emit('convert:complete', { inputPath, outputPath, format });
  }

  private async writeSubtitleFile(filePath: string, track: SubtitleTrack, style?: SubtitleStyle): Promise<void> {
    let content = '';
    
    if (track.format === SubtitleFormat.SRT) {
      content = track.cues.map(cue => {
        return `${cue.index}\n${this.formatTimeSRT(cue.startTime)} --> ${this.formatTimeSRT(cue.endTime)}\n${cue.text}\n`;
      }).join('\n');
    } else if (track.format === SubtitleFormat.VTT) {
      content = 'WEBVTT\n\n' + track.cues.map(cue => {
        return `${this.formatTimeVTT(cue.startTime)} --> ${this.formatTimeVTT(cue.endTime)}\n${cue.text}\n`;
      }).join('\n');
    } else if (track.format === SubtitleFormat.ASS) {
      content = `[Script Info]
Title: ${track.title || 'Untitled'}
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style?.fontName || 'Arial'},${style?.fontSize || 20},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,${style?.bold ? -1 : 0},0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
      content += track.cues.map(cue => {
        return `Dialogue: 0,${this.formatTimeASS(cue.startTime)},${this.formatTimeASS(cue.endTime)},Default,,0,0,0,,${cue.text}`;
      }).join('\n');
    }

    await fs.writeFile(filePath, content);
  }

  private parseSubtitle(content: string, format: SubtitleFormat): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    
    if (format === SubtitleFormat.SRT) {
      // Simple SRT parser
      const blocks = content.trim().split(/\n\s*\n/);
      for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length >= 3) {
          const index = parseInt(lines[0]);
          const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
          if (timeMatch) {
            const text = lines.slice(2).join('\n');
            cues.push({
              index,
              startTime: this.parseTimeSRT(timeMatch[1]),
              endTime: this.parseTimeSRT(timeMatch[2]),
              text
            });
          }
        }
      }
    } else if (format === SubtitleFormat.VTT) {
      // Simple VTT parser
      const lines = content.split('\n');
      let currentCue: Partial<SubtitleCue> | null = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === 'WEBVTT' || line === '') continue;
        
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timeMatch) {
          currentCue = {
            startTime: this.parseTimeVTT(timeMatch[1]),
            endTime: this.parseTimeVTT(timeMatch[2]),
            text: ''
          };
        } else if (currentCue) {
          currentCue.text = currentCue.text ? currentCue.text + '\n' + line : line;
          // Check if next line is empty or end of file
          if (i === lines.length - 1 || lines[i+1].trim() === '') {
            cues.push(currentCue as SubtitleCue);
            currentCue = null;
          }
        }
      }
    }
    
    return cues;
  }

  private formatTimeSRT(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours().toString().padStart(2, '0');
    const mm = date.getUTCMinutes().toString().padStart(2, '0');
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${hh}:${mm}:${ss},${ms}`;
  }

  private formatTimeVTT(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours().toString().padStart(2, '0');
    const mm = date.getUTCMinutes().toString().padStart(2, '0');
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  }

  private formatTimeASS(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours().toString();
    const mm = date.getUTCMinutes().toString().padStart(2, '0');
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  }

  private parseTimeSRT(timeString: string): number {
    const [h, m, s, ms] = timeString.split(/[:,]/).map(Number);
    return h * 3600 + m * 60 + s + ms / 1000;
  }

  private parseTimeVTT(timeString: string): number {
    const [h, m, s, ms] = timeString.split(/[:.]/).map(Number);
    return h * 3600 + m * 60 + s + ms / 1000;
  }
}

// ==================== FACTORY FUNCTIONS ====================

export async function embedHardSubtitles(
  videoPath: string, 
  subtitlePath: string, 
  outputPath: string
): Promise<EmbedResult> {
  const embedder = new SubtitleEmbedder();
  const content = await fs.readFile(subtitlePath, 'utf-8');
  const format = path.extname(subtitlePath).slice(1) as SubtitleFormat;
  // Use private method via cast or just parse manually
  // Since parseSubtitle is private, we can't use it directly.
  // But we can use synchronize to get cues.
  const { cues } = await embedder.synchronize(videoPath, subtitlePath);
  
  const track: SubtitleTrack = {
    language: 'eng',
    format: format,
    cues: cues
  };
  
  return embedder.embed(videoPath, {
    mode: EmbedMode.HARDSUB,
    tracks: [track],
    outputPath
  });
}

export async function embedMultiLanguageSubtitles(
  videoPath: string, 
  subtitles: { path: string; language: string; title?: string }[], 
  outputPath: string
): Promise<EmbedResult> {
  const embedder = new SubtitleEmbedder();
  const tracks: SubtitleTrack[] = [];
  
  for (let i = 0; i < subtitles.length; i++) {
    const sub = subtitles[i];
    const { cues } = await embedder.synchronize(videoPath, sub.path);
    const format = path.extname(sub.path).slice(1) as SubtitleFormat;
    
    tracks.push({
      language: sub.language,
      title: sub.title,
      format: format,
      cues: cues,
      default: i === 0 // First one is default
    });
  }
  
  return embedder.embed(videoPath, {
    mode: EmbedMode.SOFTSUB,
    tracks,
    outputPath
  });
}
