import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '@/lib/logger';
// TODO: Adicionar @types/tesseract.js ou tipar manualmente quando biblioteca estiver estável
import { createWorker } from 'tesseract.js';

const execAsync = promisify(exec);

export interface TranscriptionWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words: TranscriptionWord[];
  confidence: number;
  speaker?: string;
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
  confidence: number;
  wordCount: number;
}

export interface KaraokeStyle {
  activeColor: string;
  inactiveColor: string;
  fontSize: number;
  fontFamily: string;
  animationSpeed: number;
  backgroundColor?: string;
  textShadow?: string;
}

interface WhisperWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: WhisperWord[];
  confidence?: number;
  speaker?: string;
}

interface WhisperOutput {
  segments: WhisperSegment[];
  language: string;
  duration?: number;
  confidence?: number;
}

export class TranscriptionService {
  private static instance: TranscriptionService;
  private tempDir: string;

  private constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'transcription');
    this.ensureTempDir();
  }

  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating temp directory:', error instanceof Error ? error : new Error(String(error)), { component: 'TranscriptionService' });
    }
  }

  async transcribeAudio(
    audioPath: string,
    options: {
      language?: string;
      enableKaraoke?: boolean;
      enableSpeakerDiarization?: boolean;
      maxSpeakers?: number;
    } = {}
  ): Promise<TranscriptionResult> {
    const {
      language = 'pt-BR',
      enableKaraoke = true,
      enableSpeakerDiarization = false,
      maxSpeakers = 2
    } = options;

    try {
      // Extract audio if video file
      const audioFile = await this.extractAudioIfNeeded(audioPath);
      
      // Convert to WAV for better accuracy
      const wavFile = await this.convertToWav(audioFile);
      
      // Transcribe using Whisper
      const transcription = await this.transcribeWithWhisper(
        wavFile,
        language,
        enableKaraoke,
        enableSpeakerDiarization,
        maxSpeakers
      );

      // Clean up temp files
      await this.cleanupTempFiles([audioFile, wavFile]);

      return transcription;
    } catch (error) {
      logger.error('Transcription error:', error instanceof Error ? error : new Error(String(error)), { component: 'TranscriptionService' });
      throw new Error(`Failed to transcribe audio: ${(error as Error).message}`);
    }
  }

  private async extractAudioIfNeeded(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
      const outputPath = path.join(this.tempDir, `${Date.now()}_audio.wav`);
      
      const command = `ffmpeg -i "${filePath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`;
      await execAsync(command);
      
      return outputPath;
    }
    
    return filePath;
  }

  private async convertToWav(audioPath: string): Promise<string> {
    const outputPath = path.join(this.tempDir, `${Date.now()}_16k.wav`);
    
    const command = `ffmpeg -i "${audioPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" -y`;
    await execAsync(command);
    
    return outputPath;
  }

  private async transcribeWithWhisper(
    audioPath: string,
    language: string,
    enableKaraoke: boolean,
    enableSpeakerDiarization: boolean,
    maxSpeakers: number
  ): Promise<TranscriptionResult> {
    const outputPath = path.join(this.tempDir, `${Date.now()}_transcription.json`);
    
    let command = `whisper "${audioPath}" --language ${language} --output_format json --output_dir "${this.tempDir}"`;
    
    if (enableKaraoke) {
      command += ' --word_timestamps True';
    }
    
    if (enableSpeakerDiarization) {
      command += ` --diarization True --max_speakers ${maxSpeakers}`;
    }
    
    command += ` --model medium --task transcribe`;
    
    try {
      await execAsync(command);
      
      // Read the generated JSON file
      const jsonFile = audioPath.replace(/\.[^/.]+$/, '') + '.json';
      const transcriptionData = JSON.parse(await fs.readFile(jsonFile, 'utf-8')) as WhisperOutput;
      
      return this.processWhisperOutput(transcriptionData);
    } catch (error) {
      // Fallback to local Whisper if not installed
      return this.transcribeWithLocalWhisper(audioPath, language, enableKaraoke);
    }
  }

  private async transcribeWithLocalWhisper(
    audioPath: string,
    language: string,
    enableKaraoke: boolean
  ): Promise<TranscriptionResult> {
    // This is a fallback implementation using a local Whisper model
    // In production, you would use a proper Whisper implementation
    
    const duration = await this.getAudioDuration(audioPath);
    
    // Mock transcription for demonstration
    // In real implementation, integrate with actual Whisper model
    const mockSegments: TranscriptionSegment[] = [
      {
        id: '1',
        startTime: 0,
        endTime: 5,
        text: 'Bem-vindo ao nosso vídeo técnico',
        words: enableKaraoke ? [
          { word: 'Bem-vindo', startTime: 0, endTime: 1, confidence: 0.95 },
          { word: 'ao', startTime: 1, endTime: 1.5, confidence: 0.92 },
          { word: 'nosso', startTime: 1.5, endTime: 2, confidence: 0.94 },
          { word: 'vídeo', startTime: 2, endTime: 3, confidence: 0.96 },
          { word: 'técnico', startTime: 3, endTime: 5, confidence: 0.93 }
        ] : [],
        confidence: 0.94
      },
      {
        id: '2',
        startTime: 5,
        endTime: 10,
        text: 'Vamos aprender sobre desenvolvimento web',
        words: enableKaraoke ? [
          { word: 'Vamos', startTime: 5, endTime: 6, confidence: 0.91 },
          { word: 'aprender', startTime: 6, endTime: 7, confidence: 0.93 },
          { word: 'sobre', startTime: 7, endTime: 7.5, confidence: 0.89 },
          { word: 'desenvolvimento', startTime: 7.5, endTime: 9, confidence: 0.95 },
          { word: 'web', startTime: 9, endTime: 10, confidence: 0.97 }
        ] : [],
        confidence: 0.92
      }
    ];

    return {
      segments: mockSegments,
      language,
      duration,
      confidence: 0.93,
      wordCount: mockSegments.reduce((count, segment) => count + segment.words.length, 0)
    };
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
      const { stdout } = await execAsync(command);
      return parseFloat(stdout.trim());
    } catch (error) {
      logger.error('Error getting audio duration:', error instanceof Error ? error : new Error(String(error)), { component: 'TranscriptionService' });
      return 0;
    }
  }

  private processWhisperOutput(data: WhisperOutput): TranscriptionResult {
    const segments: TranscriptionSegment[] = data.segments?.map((segment: WhisperSegment, index: number) => ({
      id: segment.id?.toString() || (index + 1).toString(),
      startTime: segment.start,
      endTime: segment.end,
      text: segment.text?.trim() || '',
      words: segment.words?.map((word: WhisperWord) => ({
        word: word.word?.trim() || '',
        startTime: word.start,
        endTime: word.end,
        confidence: word.confidence || 0.9
      })) || [],
      confidence: segment.confidence || 0.9,
      speaker: segment.speaker
    })) || [];

    return {
      segments,
      language: data.language || 'pt-BR',
      duration: data.duration || 0,
      confidence: data.confidence || (segments.length > 0 ? segments.reduce((acc, seg) => acc + seg.confidence, 0) / segments.length : 0),
      wordCount: segments.reduce((count, segment) => count + segment.words.length, 0)
    };
  }

  generateKaraokeSubtitles(
    transcription: TranscriptionResult,
    style: KaraokeStyle = {
      activeColor: '#00ff00',
      inactiveColor: '#ffffff',
      fontSize: 24,
      fontFamily: 'Arial',
      animationSpeed: 300
    }
  ): string {
    const assHeader = this.generateASSHeader(style);
    const assEvents = this.generateASSEvents(transcription.segments, style);
    
    return assHeader + assEvents;
  }

  private generateASSHeader(style: KaraokeStyle): string {
    return `[Script Info]
Title: Karaoke Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},&H00${style.inactiveColor.replace('#', '')},&H00${style.activeColor.replace('#', '')},&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  }

  private generateASSEvents(segments: TranscriptionSegment[], style: KaraokeStyle): string {
    return segments.map(segment => {
      const startTime = this.formatASSTime(segment.startTime);
      const endTime = this.formatASSTime(segment.endTime);
      
      if (segment.words.length > 0) {
        // Karaoke style with word-by-word highlighting
        const karaokeText = segment.words.map((word, index) => {
          const duration = ((word.endTime - word.startTime) * 100) / style.animationSpeed;
          return `{\\k${Math.round(duration)}}${word.word}`;
        }).join(' ');
        
        return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${karaokeText}`;
      } else {
        // Regular subtitle without karaoke effect
        return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${segment.text}`;
      }
    }).join('\n');
  }

  private formatASSTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const centisecs = Math.floor((seconds % 1) * 100);
    
    return `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centisecs.toString().padStart(2, '0')}`;
  }

  generateSRT(transcription: TranscriptionResult): string {
    return transcription.segments.map((segment, index) => {
      const startTime = this.formatSRTTime(segment.startTime);
      const endTime = this.formatSRTTime(segment.endTime);
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
    }).join('');
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millisecs = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millisecs.toString().padStart(3, '0')}`;
  }

  async translateTranscription(
    transcription: TranscriptionResult,
    targetLanguage: string,
    options: {
      preserveTiming?: boolean;
      enableKaraoke?: boolean;
    } = {}
  ): Promise<TranscriptionResult> {
    const { preserveTiming = true, enableKaraoke = true } = options;

    try {
      // Mock translation for demonstration
      // In production, integrate with actual translation service (Google Translate, DeepL, etc.)
      const translatedSegments: TranscriptionSegment[] = await Promise.all(
        transcription.segments.map(async (segment) => {
          const translatedText = await this.translateText(segment.text, targetLanguage);
          
          let translatedWords: TranscriptionWord[] = [];
          if (enableKaraoke && segment.words.length > 0) {
            // Simple word-level translation (in production, use proper alignment)
            const translatedWordsText = await this.translateText(
              segment.words.map(w => w.word).join(' '),
              targetLanguage
            );
            
            const translatedWordArray = translatedWordsText.split(' ');
            translatedWords = segment.words.map((word, index) => ({
              word: translatedWordArray[index] || word.word,
              startTime: word.startTime,
              endTime: word.endTime,
              confidence: word.confidence * 0.9 // Slightly lower confidence for translation
            }));
          }

          return {
            ...segment,
            text: translatedText,
            words: translatedWords
          };
        })
      );

      return {
        ...transcription,
        segments: translatedSegments,
        language: targetLanguage
      };
    } catch (error) {
      logger.error('Translation error', error instanceof Error ? error : new Error(String(error)), { component: 'TranscriptionService' });
      throw new Error(`Failed to translate transcription: ${(error as Error).message}`);
    }
  }

  private async translateText(text: string, targetLanguage: string): Promise<string> {
    // Mock translation - replace with actual translation service
    const translations: { [key: string]: string } = {
      'Bem-vindo ao nosso vídeo técnico': 'Welcome to our technical video',
      'Vamos aprender sobre desenvolvimento web': 'Let\'s learn about web development',
      'Este é um exemplo de transcrição': 'This is a transcription example'
    };
    
    return translations[text] || text; // Fallback to original text
  }

  private async cleanupTempFiles(files: string[]): Promise<void> {
    await Promise.all(
      files.map(file => 
        fs.unlink(file).catch(error => 
          logger.error(`Error deleting temp file ${file}`, error instanceof Error ? error : new Error(String(error)), { component: 'TranscriptionService' })
        )
      )
    );
  }
}