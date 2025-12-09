import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { PDFPage, PDFElement } from './pdf-processor';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

export interface NarrationScript {
  id: string;
  pageNumber: number;
  text: string;
  duration: number; // seconds
  voiceSettings: VoiceSettings;
  emphasisWords: string[];
  pausePoints: number[]; // seconds from start
  tone: 'formal' | 'casual' | 'enthusiastic' | 'serious' | 'friendly';
}

export interface VoiceSettings {
  voice: string;
  speed: number; // 0.5 to 2.0
  pitch: number; // -20 to 20
  volume: number; // 0.0 to 1.0
  emphasis: 'normal' | 'strong' | 'reduced';
}

export interface NarrationOptions {
  language?: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  enableEmotion?: boolean;
  enablePauses?: boolean;
  maxWordsPerSegment?: number;
  targetAudience?: 'general' | 'technical' | 'academic' | 'children';
}

export interface GeneratedNarration {
  scripts: NarrationScript[];
  totalDuration: number;
  audioFiles: string[];
  backgroundMusic?: string;
  transitions: TransitionConfig[];
}

export interface TransitionConfig {
  type: 'fade' | 'slide' | 'zoom' | 'dissolve';
  duration: number;
  audioEffect?: string;
}

export class AINarrator {
  private static instance: AINarrator;
  private tempDir: string;
  private supabase: SupabaseClient;

  private constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'narration');
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.ensureTempDir();
  }

  static getInstance(): AINarrator {
    if (!AINarrator.instance) {
      AINarrator.instance = new AINarrator();
    }
    return AINarrator.instance;
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating temp directory', error instanceof Error ? error : new Error(String(error)), { component: 'AINarrator' });
    }
  }

  async generateNarration(
    pages: PDFPage[],
    options: NarrationOptions = {}
  ): Promise<GeneratedNarration> {
    const {
      language = 'pt-BR',
      voice = 'pt-BR-Wavenet-A',
      speed = 1.0,
      pitch = 0,
      volume = 0.9,
      enableEmotion = true,
      enablePauses = true,
      maxWordsPerSegment = 150,
      targetAudience = 'general'
    } = options;

    try {
      // Generate narration scripts for each page
      const scripts = await this.generateScripts(pages, {
        language,
        maxWordsPerSegment,
        targetAudience,
        enableEmotion,
        enablePauses
      });

      // Generate audio files for each script
      const audioFiles = await this.generateAudioFiles(scripts, {
        language,
        voice,
        speed,
        pitch,
        volume
      });

      // Calculate total duration
      const totalDuration = scripts.reduce((total, script) => total + script.duration, 0);

      // Generate transition configurations
      const transitions = this.generateTransitions(pages.length);

      return {
        scripts,
        totalDuration,
        audioFiles,
        transitions
      };
    } catch (error) {
      logger.error('Narration generation error', error instanceof Error ? error : new Error(String(error)), { component: 'AINarrator' });
      throw new Error(`Failed to generate narration: ${(error as Error).message}`);
    }
  }

  private async generateScripts(
    pages: PDFPage[],
    options: {
      language: string;
      maxWordsPerSegment: number;
      targetAudience: string;
      enableEmotion: boolean;
      enablePauses: boolean;
    }
  ): Promise<NarrationScript[]> {
    const scripts: NarrationScript[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageScripts = await this.generatePageScripts(page, i + 1, options);
      scripts.push(...pageScripts);
    }

    return scripts;
  }

  private async generatePageScripts(
    page: PDFPage,
    pageNumber: number,
    options: {
      language: string;
      maxWordsPerSegment: number;
      targetAudience: string;
      enableEmotion: boolean;
      enablePauses: boolean;
    }
  ): Promise<NarrationScript[]> {
    const pageScripts: NarrationScript[] = [];
    const elements = page.layout.elements;

    // Group elements into logical segments
    const segments = this.groupElementsIntoSegments(elements, options.maxWordsPerSegment);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const script = await this.createScriptForSegment(segment, pageNumber, i, options);
      pageScripts.push(script);
    }

    return pageScripts;
  }

  private groupElementsIntoSegments(
    elements: PDFElement[],
    maxWordsPerSegment: number
  ): PDFElement[][] {
    const segments: PDFElement[][] = [];
    let currentSegment: PDFElement[] = [];
    let currentWordCount = 0;

    for (const element of elements) {
      const wordCount = element.content.split(/\s+/).length;

      if (currentWordCount + wordCount > maxWordsPerSegment && currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
        currentWordCount = 0;
      }

      currentSegment.push(element);
      currentWordCount += wordCount;
    }

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }

  private async createScriptForSegment(
    segment: PDFElement[],
    pageNumber: number,
    segmentIndex: number,
    options: {
      language: string;
      targetAudience: string;
      enableEmotion: boolean;
      enablePauses: boolean;
    }
  ): Promise<NarrationScript> {
    const text = this.generateNarrationText(segment, options);
    const duration = this.estimateDuration(text);
    const emphasisWords = this.extractEmphasisWords(segment);
    const pausePoints = options.enablePauses ? this.calculatePausePoints(text) : [];
    const tone = this.determineTone(segment, options.targetAudience);

    return {
      id: `page_${pageNumber}_segment_${segmentIndex}`,
      pageNumber,
      text,
      duration,
      voiceSettings: {
        voice: this.selectVoice(options.language, tone),
        speed: this.calculateSpeed(text, options.targetAudience),
        pitch: this.calculatePitch(tone),
        volume: 0.9,
        emphasis: this.calculateEmphasis(tone)
      },
      emphasisWords,
      pausePoints,
      tone
    };
  }

  private generateNarrationText(
    segment: PDFElement[],
    options: {
      language: string;
      targetAudience: string;
      enableEmotion: boolean;
    }
  ): string {
    let text = '';

    for (const element of segment) {
      switch (element.type) {
        case 'heading':
          text += `Agora vamos falar sobre: ${element.content}. `;
          break;
        case 'list':
          text += `Observe os seguintes pontos: ${element.content}. `;
          break;
        case 'table':
          text += `Veja estes dados organizados: ${element.content}. `;
          break;
        case 'image':
          text += `Como você pode ver na imagem: ${element.content}. `;
          break;
        default:
          text += `${element.content}. `;
      }
    }

    // Adapt text for target audience
    text = this.adaptTextForAudience(text, options.targetAudience);

    return text.trim();
  }

  private adaptTextForAudience(text: string, audience: string): string {
    switch (audience) {
      case 'children':
        return this.simplifyText(text);
      case 'technical':
        return text; // Keep technical terms
      case 'academic':
        return this.formalizeText(text);
      case 'general':
      default:
        return this.makeConversational(text);
    }
  }

  private simplifyText(text: string): string {
    // Simple simplification logic - in production, use more sophisticated methods
    return text
      .replace(/complexo/g, 'difícil')
      .replace(/implementação/g, 'colocação')
      .replace(/funcionalidade/g, 'função')
      .replace(/otimização/g, 'melhoria');
  }

  private formalizeText(text: string): string {
    return text
      .replace(/vamos falar sobre/g, 'discutiremos')
      .replace(/observe/g, 'observamos')
      .replace(/veja/g, 'verificamos');
  }

  private makeConversational(text: string): string {
    return text
      .replace(/Agora vamos falar sobre:/g, 'Vamos ver:')
      .replace(/Observe os seguintes pontos:/g, 'Perceba:')
      .replace(/Veja estes dados organizados:/g, 'Veja só:');
  }

  private estimateDuration(text: string): number {
    const words = text.split(/\s+/).length;
    // Average speaking rate: ~150 words per minute
    return Math.ceil((words / 150) * 60);
  }

  private extractEmphasisWords(segment: PDFElement[]): string[] {
    const emphasisWords: string[] = [];

    for (const element of segment) {
      if (element.style?.isBold || element.content === element.content.toUpperCase()) {
        emphasisWords.push(element.content);
      }
    }

    return emphasisWords;
  }

  private calculatePausePoints(text: string): number[] {
    const pausePoints: number[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentTime = 0;

    for (let i = 0; i < sentences.length - 1; i++) {
      const sentence = sentences[i];
      currentTime += this.estimateDuration(sentence);
      pausePoints.push(currentTime);
    }

    return pausePoints;
  }

  private determineTone(segment: PDFElement[], audience: string): NarrationScript['tone'] {
    // Simple tone detection based on content
    const text = segment.map(el => el.content).join(' ').toLowerCase();

    if (text.includes('importante') || text.includes('atenção')) return 'serious';
    if (audience === 'children') return 'friendly';
    if (text.includes('exemplo') || text.includes('veja')) return 'casual';
    
    return 'formal';
  }

  private selectVoice(language: string, tone: string): string {
    const voiceMap: { [key: string]: { [key: string]: string } } = {
      'pt-BR': {
        'formal': 'pt-BR-Wavenet-A',
        'casual': 'pt-BR-Wavenet-B',
        'enthusiastic': 'pt-BR-Wavenet-C',
        'serious': 'pt-BR-Wavenet-D',
        'friendly': 'pt-BR-Wavenet-C'
      },
      'en-US': {
        'formal': 'en-US-Wavenet-A',
        'casual': 'en-US-Wavenet-B',
        'enthusiastic': 'en-US-Wavenet-C',
        'serious': 'en-US-Wavenet-D',
        'friendly': 'en-US-Wavenet-C'
      }
    };

    return voiceMap[language]?.[tone] || voiceMap[language]?.['formal'] || 'pt-BR-Wavenet-A';
  }

  private calculateSpeed(text: string, audience: string): number {
    if (audience === 'children') return 0.8;
    if (audience === 'technical') return 0.9;
    return 1.0;
  }

  private calculatePitch(tone: string): number {
    switch (tone) {
      case 'enthusiastic': return 5;
      case 'serious': return -3;
      case 'friendly': return 3;
      default: return 0;
    }
  }

  private calculateEmphasis(tone: string): VoiceSettings['emphasis'] {
    switch (tone) {
      case 'enthusiastic': return 'strong';
      case 'serious': return 'strong';
      default: return 'normal';
    }
  }

  private async generateAudioFiles(
    scripts: NarrationScript[],
    options: {
      language: string;
      voice: string;
      speed: number;
      pitch: number;
      volume: number;
    }
  ): Promise<string[]> {
    const audioFiles: string[] = [];

    for (const script of scripts) {
      const audioFile = await this.generateAudioFile(script, options);
      audioFiles.push(audioFile);
    }

    return audioFiles;
  }

  private async generateAudioFile(
    script: NarrationScript,
    options: {
      language: string;
      voice: string;
      speed: number;
      pitch: number;
      volume: number;
    }
  ): Promise<string> {
    const outputFile = path.join(this.tempDir, `${script.id}.mp3`);

    // Use Google Text-to-Speech or similar service
    // For now, we'll use a mock implementation
    try {
      // Mock: Create silent audio file with correct duration
      const duration = script.duration;
      const command = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} -q:a 9 -acodec mp3 "${outputFile}"`;
      await execAsync(command);

      return outputFile;
    } catch (error) {
      logger.error(`Failed to generate audio for script ${script.id}`, error instanceof Error ? error : new Error(String(error)), { component: 'AINarrator' });
      throw error;
    }
  }

  private generateTransitions(slideCount: number): TransitionConfig[] {
    const transitions: TransitionConfig[] = [];
    const transitionTypes: TransitionConfig['type'][] = ['fade', 'slide', 'zoom', 'dissolve'];

    for (let i = 0; i < slideCount - 1; i++) {
      transitions.push({
        type: transitionTypes[Math.floor(Math.random() * transitionTypes.length)],
        duration: 1.0,
        audioEffect: i % 3 === 0 ? 'whoosh' : undefined
      });
    }

    return transitions;
  }

  async synthesizeNarrationWithBackground(
    narration: GeneratedNarration,
    backgroundMusicPath?: string
  ): Promise<string> {
    const outputFile = path.join(this.tempDir, `final_narration_${Date.now()}.mp3`);

    try {
      // Combine all audio files
      const audioListFile = path.join(this.tempDir, `audio_list_${Date.now()}.txt`);
      const audioListContent = narration.audioFiles.map(file => `file '${file}'`).join('\n');
      await fs.writeFile(audioListFile, audioListContent);

      // Concatenate audio files
      const concatCommand = `ffmpeg -f concat -safe 0 -i "${audioListFile}" -c copy "${outputFile}"`;
      await execAsync(concatCommand);

      // Clean up
      await fs.unlink(audioListFile);

      return outputFile;
    } catch (error) {
      logger.error('Failed to synthesize narration', error instanceof Error ? error : new Error(String(error)), { component: 'AINarrator' });
      throw error;
    }
  }

  async saveNarrationToDatabase(
    narration: GeneratedNarration,
    pdfId: string,
    userId: string
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('narrations')
        .insert({
          user_id: userId,
          pdf_id: pdfId,
          scripts: narration.scripts,
          total_duration: narration.totalDuration,
          audio_files: narration.audioFiles,
          transitions: narration.transitions,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save narration: ${error.message}`);
      }

      return data.id;
    } catch (error) {
      logger.error('Database error', error instanceof Error ? error : new Error(String(error)), { component: 'AINarrator' });
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(files.map(file => 
        fs.unlink(path.join(this.tempDir, file)).catch(() => {})
      ));
    } catch (error) {
      logger.warn('Failed to cleanup temp directory', { component: 'AINarrator', error: String(error) });
    }
  }
}