import { logger } from '@/lib/logger';
import PptxGenJS from 'pptxgenjs';

/**
 * PPTX Generator
 * Gerador real de apresentações PowerPoint usando PptxGenJS
 */

export interface SlideContent {
  title?: string;
  content?: string;
  layout?: string;
}

export interface PPTXGenerationOptions {
  theme?: string;
  layout?: string;
  branding?: {
    logo?: string;
    colors?: string[];
  };
}

export class PPTXGenerator {
  private options: PPTXGenerationOptions;

  constructor(options: PPTXGenerationOptions = {}) {
    this.options = options;
  }

  async generate(slides: SlideContent[]): Promise<Buffer> {
    logger.info(`[PPTX] Generating presentation with ${slides.length} slides`, { component: 'PPTXGenerator' });
    
    const pptx = new PptxGenJS();
    
    // Aplicar tema se fornecido
    if (this.options.branding?.colors && this.options.branding.colors.length > 0) {
      pptx.theme = { headFontFace: 'Arial', bodyFontFace: 'Calibri' };
    }
    
    for (const slideContent of slides) {
      const slide = pptx.addSlide();
      
      // Adicionar título se existir
      if (slideContent.title) {
        slide.addText(slideContent.title, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 1,
          fontSize: 32,
          bold: true,
          color: this.options.branding?.colors?.[0] || '363636'
        });
      }
      
      // Adicionar conteúdo se existir
      if (slideContent.content) {
        slide.addText(slideContent.content, {
          x: 0.5,
          y: 2,
          w: '90%',
          h: 4,
          fontSize: 18,
          color: '363636'
        });
      }
      
      // Adicionar logo se fornecido
      if (this.options.branding?.logo) {
        try {
          slide.addImage({
            path: this.options.branding.logo,
            x: 8.5,
            y: 0.2,
            w: 1,
            h: 0.5
          });
        } catch (err) {
          logger.warn('[PPTX] Failed to add logo', { error: err });
        }
      }
    }
    
    const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
    return buffer;
  }
  
  async addSlide(pptxBuffer: Buffer, slide: SlideContent): Promise<Buffer> {
    logger.info('[PPTX] Adding slide to existing presentation', { component: 'PPTXGenerator' });
    
    // Para adicionar slide em PPTX existente, precisaríamos usar outra biblioteca
    // como officegen ou abrir com PptxGenJS se possível
    throw new Error('addSlide not yet implemented - use generate() to create new presentation');
  }

  async generateFromData(data: Record<string, unknown>): Promise<Buffer> {
    logger.info('[PPTX] Generating from data', { component: 'PPTXGenerator', data });
    
    // Converter data em slides
    const slides: SlideContent[] = [];
    if (Array.isArray(data.slides)) {
      slides.push(...data.slides as SlideContent[]);
    } else {
      // Criar um slide com os dados fornecidos
      slides.push({
        title: String(data.title || 'Apresentação'),
        content: JSON.stringify(data, null, 2)
      });
    }
    
    return this.generate(slides);
  }

  async generateFromTemplate(templateId: string, variables: Record<string, unknown>): Promise<Buffer> {
    logger.info('[PPTX] Generating from template', { component: 'PPTXGenerator', templateId, variables });
    
    // Aqui você poderia buscar um template do banco/S3 e aplicar as variáveis
    // Por enquanto, criar apresentação básica com as variáveis
    const slides: SlideContent[] = [{
      title: String(variables.title || 'Template ' + templateId),
      content: Object.entries(variables)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    }];
    
    return this.generate(slides);
  }
}

export const pptxGenerator = new PPTXGenerator();
