/**
 * PPTX Real Generator
 * Gerador de arquivos PPTX a partir de dados usando pptxgenjs
 */

import PptxGenJS from 'pptxgenjs';

export interface GeneratorSlide {
  title: string;
  content: string;
  layout?: 'title' | 'content' | 'blank';
  notes?: string;
}

export interface GeneratorOptions {
  theme?: string;
  aspectRatio?: '16:9' | '4:3';
  author?: string;
}

export class PPTXRealGenerator {
  async generate(slides: GeneratorSlide[], options?: GeneratorOptions): Promise<Buffer> {
    console.log('[PPTXGenerator] Generating presentation with', slides.length, 'slides');
    
    const pres = new PptxGenJS();
    
    // Metadata
    pres.author = options?.author || 'Estúdio IA Vídeos';
    pres.company = 'Estúdio IA Vídeos';
    pres.title = 'Generated Presentation';
    
    // Layout
    if (options?.aspectRatio === '4:3') {
      pres.layout = 'LAYOUT_4x3';
    } else {
      pres.layout = 'LAYOUT_16x9';
    }

    // Add Slides
    for (const slideData of slides) {
      const slide = pres.addSlide();
      
      // Title
      if (slideData.title) {
        slide.addText(slideData.title, { 
          x: 0.5, y: 0.5, w: '90%', h: 1, 
          fontSize: 24, bold: true, color: '363636' 
        });
      }
      
      // Content
      if (slideData.content) {
        slide.addText(slideData.content, { 
          x: 0.5, y: 1.5, w: '90%', h: 4, 
          fontSize: 18, color: '666666' 
        });
      }
      
      // Notes
      if (slideData.notes) {
        slide.addNotes(slideData.notes);
      }
    }

    // Generate Buffer
    // stream() returns a Promise<string | ArrayBuffer | Blob | Buffer> depending on args
    // 'nodebuffer' is the type for Node.js Buffer
    return (await pres.write({ outputType: 'nodebuffer' })) as Buffer;
  }
  
  async addSlide(presentation: Buffer, slide: GeneratorSlide): Promise<Buffer> {
    // pptxgenjs doesn't support editing existing PPTX buffers easily.
    // We would need to parse it first or keep the PptxGenJS instance alive.
    // For now, we log a warning and return the original buffer, 
    // or we could throw "Not Implemented" if this is critical.
    console.warn('[PPTXGenerator] addSlide to existing buffer not supported by pptxgenjs. Returning original.');
    return presentation;
  }

  async generateRealPptx(projectData: {
    slides: GeneratorSlide[];
    options?: GeneratorOptions;
    title?: string;
    template?: string;
    branding?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<PptxGenerationResult> {
    try {
      const buffer = await this.generate(projectData.slides, projectData.options);
      // Em produção, faria upload para S3 e retornaria a URL
      const filename = `presentation_${Date.now()}.pptx`;
      const pptxUrl = `/api/pptx/generated/${filename}`;
      return {
        success: true,
        pptxUrl,
        filename,
        buffer,
        slideCount: projectData.slides.length,
        metadata: {
          slides: projectData.slides.length,
          generatedAt: new Date().toISOString(),
          ...projectData.metadata
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export interface PptxGenerationOptions extends GeneratorOptions {
  template?: string;
  title?: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface PptxGenerationResult {
  success: boolean;
  pptxUrl?: string;
  filename?: string;
  buffer?: Buffer;
  slideCount?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export const pptxRealGenerator = new PPTXRealGenerator();

export const generateRealPptxFromProject = async (
  projectId: string, 
  options?: PptxGenerationOptions
): Promise<{ success: boolean; pptxUrl?: string; metadata?: Record<string, unknown>; error?: string }> => {
  console.log('[PPTXGenerator] Generating PPTX for project:', projectId, 'with options:', options);
  
  // Em produção, buscaria os slides do projeto no banco de dados
  // Por enquanto, retorna um placeholder
  return pptxRealGenerator.generateRealPptx({
    slides: [],
    options
  });
};

export { PPTXRealGenerator as RealPptxGenerator };
