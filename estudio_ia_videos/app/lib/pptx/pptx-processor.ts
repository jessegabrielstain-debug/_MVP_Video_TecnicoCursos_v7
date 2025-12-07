import { PPTXParser } from './pptx-parser';
import { Slide, ParsedPPTXData } from '@/lib/definitions';

export interface PPTXValidationResult {
  valid: boolean;
  isValid: boolean;
  error?: string;
  slideCount?: number;
  warnings: string[];
}

export interface PPTXProcessResult {
  success: boolean;
  slides: Partial<Slide>[];
  error?: string;
  assets: {
    images: Record<string, unknown>[];
  };
  timeline: {
    totalDuration: number;
  };
  extractionStats?: Record<string, unknown>;
}

export interface ProcessingProgress {
  stage: string;
  progress: number;
  message: string;
}

export class PPTXProcessor {
  private parser: PPTXParser;

  constructor() {
    this.parser = new PPTXParser();
  }

  async parse(buffer: Buffer): Promise<ParsedPPTXData> {
    return this.parser.parsePPTX(buffer);
  }

  async process(options: { file: File }): Promise<{ slides: Partial<Slide>[] }> {
    const { file } = options;
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedData = await this.parser.parsePPTX(buffer);
    return { slides: parsedData.slides };
  }

  static async validatePPTXFile(buffer: Buffer): Promise<PPTXValidationResult> {
    try {
      // Verificar magic bytes do PPTX (ZIP)
      if (buffer.length < 4) {
        return { valid: false, isValid: false, error: 'File too small', warnings: [] };
      }
      
      // PPTX files are ZIP archives - check for PK signature
      const isPKSignature = buffer[0] === 0x50 && buffer[1] === 0x4B;
      if (!isPKSignature) {
        return { valid: false, isValid: false, error: 'Invalid PPTX file format', warnings: [] };
      }
      
      return { valid: true, isValid: true, warnings: [] };
    } catch (error) {
      return { 
        valid: false, 
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        warnings: []
      };
    }
  }

  static async processFile(
    buffer: Buffer, 
    projectId?: string, 
    options?: Record<string, unknown>, 
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<PPTXProcessResult> {
    try {
      if (onProgress) onProgress({ stage: 'init', progress: 0, message: 'Starting processing' });
      
      const processor = new PPTXProcessor();
      const result = await processor.parse(buffer);
      
      if (onProgress) onProgress({ stage: 'parsing', progress: 50, message: 'Parsed PPTX structure' });

      const slides = result.slides || [];
      const totalDuration = slides.reduce((acc, slide) => acc + (slide.duration || 5000), 0);

      if (onProgress) onProgress({ stage: 'completed', progress: 100, message: 'Processing completed' });

      return {
        success: true,
        slides: slides,
        assets: {
          images: [] // TODO: Populate with actual images if available
        },
        timeline: {
          totalDuration
        },
        extractionStats: {
          slideCount: slides.length,
          duration: totalDuration
        }
      };
    } catch (error) {
      return {
        success: false,
        slides: [],
        error: error instanceof Error ? error.message : 'Processing failed',
        assets: { images: [] },
        timeline: { totalDuration: 0 }
      };
    }
  }
}

