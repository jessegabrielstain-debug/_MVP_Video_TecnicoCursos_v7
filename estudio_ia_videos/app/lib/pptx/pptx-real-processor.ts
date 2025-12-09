/**
 * PPTX Real Processor
 * Processador completo de PPTX
 */

import { PPTXRealParser } from '@/lib/pptx-real-parser';
import { logger } from '@/lib/logger';

export interface ProcessOptions {
  extractImages?: boolean;
  extractNotes?: boolean;
  generateThumbnails?: boolean;
}

export interface ProcessedPPTX {
  slides: Array<{
    id: string;
    title: string;
    content: string;
    notes?: string;
    images?: Buffer[];
  }>;
  metadata: Record<string, unknown>;
}

export class PPTXRealProcessor {
  private parser = new PPTXRealParser();
  
  async process(buffer: Buffer, options?: ProcessOptions): Promise<ProcessedPPTX> {
    logger.info('[PPTXProcessor] Processing PPTX with options:', { component: 'PPTXRealProcessor', options });
    
    const parsed = await this.parser.parseBuffer(buffer);
    
    return {
      slides: parsed.slides.map((s, i) => ({
        id: crypto.randomUUID(),
        title: s.title,
        content: s.text,
        notes: options?.extractNotes ? s.notes : undefined,
      })),
      metadata: parsed.metadata,
    };
  }

  async processBuffer(buffer: Buffer, options?: ProcessOptions): Promise<ProcessedPPTX> {
    return this.process(buffer, options);
  }
}

export const pptxRealProcessor = new PPTXRealProcessor();
export const pptxProcessor = pptxRealProcessor;
