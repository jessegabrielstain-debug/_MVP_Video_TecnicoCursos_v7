import JSZip from 'jszip';
import { PPTXTextParser } from './text-parser';
import { PPTXLayoutParser } from './layout-parser';
import { PPTXNotesParser } from './notes-parser';

export interface SlideDurationResult {
  success: boolean;
  estimatedDuration: number; // em segundos
  breakdown?: {
    textReadingTime: number; // tempo para ler texto do slide
    notesNarrationTime: number; // tempo para narrar notes
    visualComplexityTime: number; // tempo extra para processar elementos visuais
    transitionTime: number; // tempo de transição (padrão)
  };
  confidence?: number; // 0-1
  error?: string;
}

export interface DurationCalculationOptions {
  wordsPerMinute?: number; // Padrão: 150 WPM
  visualProcessingTime?: number; // Tempo por elemento visual em segundos (padrão: 2s)
  transitionTime?: number; // Tempo de transição entre slides (padrão: 1s)
  minSlideDuration?: number; // Duração mínima de um slide (padrão: 3s)
  maxSlideDuration?: number; // Duração máxima de um slide (padrão: 120s)
}

const DEFAULT_OPTIONS: Required<DurationCalculationOptions> = {
  wordsPerMinute: 150,
  visualProcessingTime: 2,
  transitionTime: 1,
  minSlideDuration: 3,
  maxSlideDuration: 120,
};

export class SlideDurationCalculator {
  private textParser: PPTXTextParser;
  private layoutParser: PPTXLayoutParser;
  private notesParser: PPTXNotesParser;
  private options: Required<DurationCalculationOptions>;

  constructor(options?: DurationCalculationOptions) {
    this.textParser = new PPTXTextParser();
    this.layoutParser = new PPTXLayoutParser();
    this.notesParser = new PPTXNotesParser();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async calculateDuration(zip: JSZip, slideNumber: number): Promise<SlideDurationResult> {
    try {
      // 1. Extrair texto do slide
      const textResult = await this.textParser.extractText(zip, slideNumber);
      const slideWordCount = textResult.wordCount || 0;
      
      // 2. Extrair speaker notes (prioridade para narração)
      const notesResult = await this.notesParser.extractNotes(zip, slideNumber);
      const notesWordCount = notesResult.wordCount || 0;
      
      // 3. Analisar layout e elementos visuais
      const layoutResult = await this.layoutParser.detectLayout(zip, slideNumber);
      const visualElements = layoutResult.elements || [];
      
      // Calcular tempo de leitura do texto do slide (se não houver notes)
      const textReadingTime = notesWordCount === 0 
        ? this.calculateReadingTime(slideWordCount)
        : 0;
      
      // Calcular tempo de narração das notes (tem prioridade)
      const notesNarrationTime = notesWordCount > 0
        ? this.calculateReadingTime(notesWordCount)
        : 0;
      
      // Calcular tempo de processamento visual
      const visualComplexityTime = this.calculateVisualProcessingTime(visualElements.length);
      
      // Tempo de transição
      const transitionTime = this.options.transitionTime;
      
      // Duração total
      let totalDuration = 
        Math.max(textReadingTime, notesNarrationTime) + // Maior dos dois (narração ou leitura)
        visualComplexityTime +
        transitionTime;
      
      // Aplicar limites min/max
      totalDuration = Math.max(this.options.minSlideDuration, totalDuration);
      totalDuration = Math.min(this.options.maxSlideDuration, totalDuration);
      
      // Calcular confiança baseado na qualidade dos dados
      const confidence = this.calculateConfidence(textResult, notesResult, layoutResult);
      
      return {
        success: true,
        estimatedDuration: Math.ceil(totalDuration),
        breakdown: {
          textReadingTime: Math.round(textReadingTime * 10) / 10,
          notesNarrationTime: Math.round(notesNarrationTime * 10) / 10,
          visualComplexityTime: Math.round(visualComplexityTime * 10) / 10,
          transitionTime,
        },
        confidence,
      };
    } catch (error) {
      return {
        success: false,
        estimatedDuration: this.options.minSlideDuration,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  private calculateReadingTime(wordCount: number): number {
    // Converter WPM para segundos
    return (wordCount / this.options.wordsPerMinute) * 60;
  }

  private calculateVisualProcessingTime(visualElementCount: number): number {
    // Cada elemento visual adiciona tempo de processamento
    // Mas com rendimentos decrescentes (evitar slides muito longos)
    if (visualElementCount === 0) return 0;
    if (visualElementCount === 1) return this.options.visualProcessingTime;
    if (visualElementCount <= 3) return this.options.visualProcessingTime * 1.5;
    if (visualElementCount <= 5) return this.options.visualProcessingTime * 2;
    return this.options.visualProcessingTime * 2.5; // Máximo para muitos elementos
  }

  private calculateConfidence(textResult: any, notesResult: any, layoutResult: any): number {
    let confidence = 0.5; // Base
    
    // Se temos notes, confiança maior (mais preciso para TTS)
    if (notesResult.success && notesResult.wordCount && notesResult.wordCount > 0) {
      confidence += 0.3;
    }
    
    // Se temos texto do slide
    if (textResult.success && textResult.wordCount && textResult.wordCount > 0) {
      confidence += 0.1;
    }
    
    // Se detectamos layout com confiança
    if (layoutResult.success && layoutResult.confidence && layoutResult.confidence > 0.7) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Calcula duração total de uma apresentação
   */
  async calculatePresentationDuration(zip: JSZip): Promise<{
    success: boolean;
    totalDuration: number; // em segundos
    slideDurations: Map<number, number>;
    averageSlideDuration: number;
    error?: string;
  }> {
    try {
      // Descobrir quantos slides existem
      const slideFiles = Object.keys(zip.files).filter(
        (filename) => filename.match(/ppt\/slides\/slide\d+\.xml/)
      );
      
      const slideDurations = new Map<number, number>();
      
      for (const slideFile of slideFiles) {
        const match = slideFile.match(/slide(\d+)\.xml/);
        if (match) {
          const slideNumber = parseInt(match[1], 10);
          const result = await this.calculateDuration(zip, slideNumber);
          if (result.success) {
            slideDurations.set(slideNumber, result.estimatedDuration);
          }
        }
      }
      
      const durations = Array.from(slideDurations.values());
      const totalDuration = durations.reduce((sum, d) => sum + d, 0);
      const averageSlideDuration = durations.length > 0 
        ? totalDuration / durations.length 
        : 0;
      
      return {
        success: true,
        totalDuration,
        slideDurations,
        averageSlideDuration: Math.round(averageSlideDuration),
      };
    } catch (error) {
      return {
        success: false,
        totalDuration: 0,
        slideDurations: new Map(),
        averageSlideDuration: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}

export async function calculateSlideDuration(
  zip: JSZip,
  slideNumber: number,
  options?: DurationCalculationOptions
): Promise<SlideDurationResult> {
  const calculator = new SlideDurationCalculator(options);
  return calculator.calculateDuration(zip, slideNumber);
}

export async function calculatePresentationDuration(
  zip: JSZip,
  options?: DurationCalculationOptions
) {
  const calculator = new SlideDurationCalculator(options);
  return calculator.calculatePresentationDuration(zip);
}
