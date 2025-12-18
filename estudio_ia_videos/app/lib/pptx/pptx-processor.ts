import { PPTXParser } from './pptx-parser';
import { Slide, ParsedPPTXData } from '@/lib/definitions';
import JSZip from 'jszip';
import { PPTXImageParser } from './parsers/image-parser';
import { logger } from '@/lib/logger';

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
    images: Array<{
      id: string;
      filename: string;
      url?: string;
      thumbnailUrl?: string;
      mimeType: string;
      width?: number;
      height?: number;
    }>;
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

export interface PPTXProcessingOptions {
  projectId?: string;
  extractImages?: boolean;
  generateThumbnails?: boolean;
  uploadToStorage?: boolean;
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
    options?: PPTXProcessingOptions, 
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<PPTXProcessResult> {
    try {
      if (onProgress) onProgress({ stage: 'init', progress: 0, message: 'Iniciando processamento' });
      
      const processor = new PPTXProcessor();
      const result = await processor.parse(buffer);
      
      if (onProgress) onProgress({ stage: 'parsing', progress: 30, message: 'Estrutura PPTX parseada' });

      const slides = result.slides || [];
      const totalDuration = slides.reduce((acc, slide) => acc + (slide.duration || 5000), 0);

      // Extrair imagens se solicitado
      let extractedImages: Array<{
        id: string;
        filename: string;
        url?: string;
        thumbnailUrl?: string;
        mimeType: string;
        width?: number;
        height?: number;
      }> = [];

      if (options?.extractImages !== false && projectId) {
        try {
          if (onProgress) onProgress({ stage: 'extracting-images', progress: 50, message: 'Extraindo imagens' });
          
          const zip = await JSZip.loadAsync(buffer);
          const imageResult = await PPTXImageParser.extractImages(zip, projectId, {
            maxImages: 100,
            uploadToS3: options?.uploadToStorage !== false,
            generateThumbnails: options?.generateThumbnails !== false,
            includeThumbnails: options?.generateThumbnails !== false,
          });

          if (imageResult.success) {
            extractedImages = imageResult.images.map(img => ({
              id: img.id,
              filename: img.filename,
              url: img.url,
              thumbnailUrl: img.thumbnailUrl,
              mimeType: img.mimeType,
              width: img.width,
              height: img.height,
            }));

            logger.info(`✅ ${extractedImages.length} imagens extraídas do PPTX`, { 
              component: 'PPTXProcessor',
              projectId,
              imageCount: extractedImages.length 
            });
          } else {
            logger.warn('Alguns erros ao extrair imagens', { 
              component: 'PPTXProcessor',
              errors: imageResult.errors 
            });
          }
        } catch (imageError) {
          logger.error('Erro ao extrair imagens do PPTX', imageError instanceof Error ? imageError : new Error(String(imageError)), { 
            component: 'PPTXProcessor' 
          });
          // Continuar processamento mesmo se extração de imagens falhar
        }
      }

      if (onProgress) onProgress({ stage: 'completed', progress: 100, message: 'Processamento concluído' });

      return {
        success: true,
        slides: slides,
        assets: {
          images: extractedImages
        },
        timeline: {
          totalDuration
        },
        extractionStats: {
          slideCount: slides.length,
          duration: totalDuration,
          imageCount: extractedImages.length
        }
      };
    } catch (error) {
      logger.error('Erro ao processar PPTX', error instanceof Error ? error : new Error(String(error)), { 
        component: 'PPTXProcessor' 
      });
      
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

