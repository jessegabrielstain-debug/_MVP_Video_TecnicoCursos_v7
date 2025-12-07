/**
 * 📦 PPTX Advanced Parser - Integração Completa de Todos os Parsers
 * 
 * Este módulo integra todos os parsers individuais (texto, imagens, layout, notes, 
 * duração, animações) em uma única interface de alto nível para extração completa 
 * de dados de arquivos PPTX.
 */

import JSZip from 'jszip';
import { PPTXTextParser, SlideTextExtractionResult } from './text-parser';
import { PPTXImageParser, ExtractedImage, ImageExtractionOptions } from './image-parser';
import { PPTXLayoutParser, SlideLayoutDetectionResult } from './layout-parser';
import { PPTXNotesParser, SpeakerNotesResult } from './notes-parser';
import { SlideDurationCalculator, SlideDurationResult, DurationCalculationOptions } from './duration-calculator';
import { PPTXAnimationParser, SlideAnimationResult } from './animation-parser';

export interface CompleteSlideData {
  slideNumber: number;
  text: SlideTextExtractionResult;
  images: ExtractedImage[];
  layout: SlideLayoutDetectionResult;
  notes: SpeakerNotesResult;
  duration: SlideDurationResult;
  animations: SlideAnimationResult;
}

export interface CompletePPTXData {
  success: boolean;
  slides: CompleteSlideData[];
  metadata: {
    totalSlides: number;
    totalDuration: number; // segundos
    totalImages: number;
    averageSlideDuration: number;
    hasAnimations: boolean;
    hasSpeakerNotes: boolean;
  };
  errors: string[];
}

export interface AdvancedParsingOptions {
  imageOptions?: ImageExtractionOptions;
  durationOptions?: DurationCalculationOptions;
  includeAnimations?: boolean; // default: true
  includeNotes?: boolean; // default: true
  includeImages?: boolean; // default: true
}

export class PPTXAdvancedParser {
  private textParser: PPTXTextParser;
  private imageParser: typeof PPTXImageParser;
  private layoutParser: PPTXLayoutParser;
  private notesParser: PPTXNotesParser;
  private durationCalculator: SlideDurationCalculator;
  private animationParser: PPTXAnimationParser;

  constructor() {
    this.textParser = new PPTXTextParser();
    this.imageParser = PPTXImageParser;
    this.layoutParser = new PPTXLayoutParser();
    this.notesParser = new PPTXNotesParser();
    this.durationCalculator = new SlideDurationCalculator();
    this.animationParser = new PPTXAnimationParser();
  }

  /**
   * Parse completo de um único slide
   */
  async parseSlide(
    zip: JSZip,
    slideNumber: number,
    projectId: string,
    options: AdvancedParsingOptions = {}
  ): Promise<CompleteSlideData> {
    const {
      imageOptions = {},
      durationOptions = {},
      includeAnimations = true,
      includeNotes = true,
      includeImages = true,
    } = options;

    // Extrair texto
    const text = await this.textParser.extractTextFromSlide(zip, slideNumber);

    // Extrair imagens (se solicitado)
    let images: ExtractedImage[] = [];
    if (includeImages) {
      const imageResult = await this.imageParser.extractImages(zip, projectId, imageOptions);
      images = imageResult.images;
    }

    // Detectar layout
    const layout = await this.layoutParser.detectLayout(zip, slideNumber);

    // Extrair notes (se solicitado)
    let notes: SpeakerNotesResult = { success: true, notes: '', wordCount: 0, estimatedDuration: 0 };
    if (includeNotes) {
      notes = await this.notesParser.extractNotes(zip, slideNumber);
    }

    // Calcular duração
    const durationCalc = new SlideDurationCalculator(durationOptions);
    const duration = await durationCalc.calculateDuration(zip, slideNumber);

    // Extrair animações (se solicitado)
    let animations: SlideAnimationResult = { success: true, animations: [], totalAnimationDuration: 0 };
    if (includeAnimations) {
      animations = await this.animationParser.extractAnimations(zip, slideNumber);
    }

    return {
      slideNumber,
      text,
      images,
      layout,
      notes,
      duration,
      animations,
    };
  }

  /**
   * Parse completo de toda a apresentação
   */
  async parsePresentation(
    zip: JSZip,
    projectId: string,
    options: AdvancedParsingOptions = {}
  ): Promise<CompletePPTXData> {
    const errors: string[] = [];
    const slides: CompleteSlideData[] = [];

    try {
      // Descobrir quantos slides existem
      const slideFiles = Object.keys(zip.files)
        .filter((filename) => filename.match(/ppt\/slides\/slide\d+\.xml/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
          const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
          return numA - numB;
        });

      // Processar cada slide
      for (const slideFile of slideFiles) {
        const match = slideFile.match(/slide(\d+)\.xml/);
        if (match) {
          const slideNumber = parseInt(match[1], 10);
          
          try {
            const slideData = await this.parseSlide(zip, slideNumber, projectId, options);
            slides.push(slideData);
          } catch (error) {
            errors.push(`Erro ao processar slide ${slideNumber}: ${error}`);
          }
        }
      }

      // Calcular metadata agregado
      const totalDuration = slides.reduce((sum, s) => sum + (s.duration.estimatedDuration || 0), 0);
      const totalImages = slides.reduce((sum, s) => sum + s.images.length, 0);
      const averageSlideDuration = slides.length > 0 ? totalDuration / slides.length : 0;
      const hasAnimations = slides.some(s => s.animations.animations && s.animations.animations.length > 0);
      const hasSpeakerNotes = slides.some(s => s.notes.wordCount && s.notes.wordCount > 0);

      return {
        success: errors.length === 0,
        slides,
        metadata: {
          totalSlides: slides.length,
          totalDuration,
          totalImages,
          averageSlideDuration: Math.round(averageSlideDuration),
          hasAnimations,
          hasSpeakerNotes,
        },
        errors,
      };
    } catch (error) {
      return {
        success: false,
        slides: [],
        metadata: {
          totalSlides: 0,
          totalDuration: 0,
          totalImages: 0,
          averageSlideDuration: 0,
          hasAnimations: false,
          hasSpeakerNotes: false,
        },
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
      };
    }
  }
}

/**
 * Função helper para parse completo de arquivo PPTX
 */
export async function parseCompletePPTX(
  buffer: Buffer | ArrayBuffer,
  projectId: string,
  options?: AdvancedParsingOptions
): Promise<CompletePPTXData> {
  const zip = await JSZip.loadAsync(buffer);
  const parser = new PPTXAdvancedParser();
  return parser.parsePresentation(zip, projectId, options);
}

/**
 * Função helper para parse de um único slide
 */
export async function parseCompleteSlide(
  buffer: Buffer | ArrayBuffer,
  slideNumber: number,
  projectId: string,
  options?: AdvancedParsingOptions
): Promise<CompleteSlideData> {
  const zip = await JSZip.loadAsync(buffer);
  const parser = new PPTXAdvancedParser();
  return parser.parseSlide(zip, slideNumber, projectId, options);
}
