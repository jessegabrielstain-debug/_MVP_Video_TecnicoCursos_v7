/**
 * PPTX Real Parser
 * Parser oficial de PPTX (versão 1)
 */

import { logger } from '@/lib/logger';

export interface ParsedSlide {
  index: number;
  title: string;
  text: string;
  notes: string;
  images: string[];
  elements?: Record<string, unknown>[]; // Added to support route usage
}

export interface ParsedPresentation {
  slides: ParsedSlide[];
  totalSlides: number;
  metadata: {
    title?: string;
    author?: string;
  };
  assets?: {
    images: Array<{ id: string; src: string; slideIndex: number }>;
    audio: Array<{ id: string; src: string; duration?: number }>;
    videos: Array<{ id: string; src: string; duration?: number }>;
  };
  timeline?: {
    totalDuration: number;
    scenes: Array<{ slideIndex: number; startTime: number; endTime: number }>;
  };
  compliance?: {
    score: number;
    accessibility: boolean;
    fonts: string[];
    warnings: string[];
  };
}

export class PPTXRealParser {
  async parseFile(filePath: string): Promise<ParsedPresentation> {
    logger.info('Parsing file', { component: 'PPTXRealParser', filePath });
    
    return {
      slides: [],
      totalSlides: 0,
      metadata: {},
    };
  }
  
  async parseBuffer(buffer: Buffer): Promise<ParsedPresentation> {
    logger.info('🔄 Parseando buffer PPTX', { component: 'PPTXRealParser', bufferSize: buffer.length });
    
    try {
      // Usar o parser principal para parsear o buffer
      const { PPTXParser } = await import('./pptx/pptx-parser');
      const parser = new PPTXParser();
      const parsedData = await parser.parsePPTX(buffer);

      // Converter para formato ParsedPresentation
      const slides: ParsedSlide[] = (parsedData.slides || []).map((slide, index) => ({
        index: index + 1,
        title: slide.title || `Slide ${index + 1}`,
        text: slide.text || '',
        notes: slide.notes || '',
        images: slide.images || [],
        elements: slide.elements || [],
      }));

      logger.info('✅ Buffer PPTX parseado com sucesso', { 
        component: 'PPTXRealParser',
        slideCount: slides.length 
      });

      return {
        slides,
        totalSlides: slides.length,
        metadata: {
          title: parsedData.metadata?.title,
          author: parsedData.metadata?.author,
        },
      };
    } catch (error) {
      logger.error('Erro ao parsear buffer PPTX', error instanceof Error ? error : new Error(String(error)), { 
        component: 'PPTXRealParser' 
      });
      throw error;
    }
  }

  async parseFromS3(s3Key: string): Promise<ParsedPresentation> {
    logger.info('📥 Buscando PPTX do S3', { component: 'PPTXRealParser', s3Key });
    
    try {
      // Buscar arquivo do S3 usando o serviço de storage
      const { S3StorageService } = await import('./s3-storage');
      
      // Verificar se arquivo existe
      const fileExists = await S3StorageService.fileExists(s3Key);
      if (!fileExists) {
        logger.error('Arquivo não encontrado no S3', new Error(`S3 key não encontrada: ${s3Key}`), { 
          component: 'PPTXRealParser',
          s3Key 
        });
        throw new Error(`Arquivo não encontrado no S3: ${s3Key}`);
      }

      // Baixar arquivo do S3
      logger.info('⬇️ Baixando arquivo do S3...', { component: 'PPTXRealParser', s3Key });
      const downloadResult = await S3StorageService.downloadFile(s3Key);
      
      if (!downloadResult.success || !downloadResult.buffer) {
        const errorMsg = downloadResult.error || 'Erro desconhecido ao baixar arquivo';
        logger.error('Erro ao baixar arquivo do S3', new Error(errorMsg), { 
          component: 'PPTXRealParser',
          s3Key 
        });
        throw new Error(`Erro ao baixar arquivo do S3: ${errorMsg}`);
      }

      // Parsear PPTX usando o parser principal
      logger.info('🔄 Parseando PPTX...', { component: 'PPTXRealParser', s3Key });
      const parsedData = await this.parse(downloadResult.buffer);

      logger.info('✅ PPTX parseado com sucesso do S3', { 
        component: 'PPTXRealParser',
        s3Key,
        slideCount: parsedData.totalSlides 
      });

      return parsedData;
    } catch (error) {
      logger.error('Erro ao parsear PPTX do S3', error instanceof Error ? error : new Error(String(error)), { 
        component: 'PPTXRealParser',
        s3Key 
      });
      throw error;
    }
  }
}

export const pptxRealParser = new PPTXRealParser();
