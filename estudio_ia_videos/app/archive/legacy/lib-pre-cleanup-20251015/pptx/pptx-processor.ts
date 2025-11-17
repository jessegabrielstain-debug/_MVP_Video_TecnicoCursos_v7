/**
 * 🎯 PPTX Processor - Orquestrador principal para processamento real de PPTX
 * FASE 1: PPTX Processing Real
 */

import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'crypto';
import { PPTXValidator } from './validation/pptx-validator';
import { ContentHandlerFactory } from './handlers/content-handlers';
import { SlideProcessor } from './processors/slide-processor';
import { createProject } from '@/lib/supabase/projects';
import { addSlide } from '@/lib/supabase/slides';

export interface PPTXMetadata {
  title: string;
  author: string;
  totalSlides: number;
  createdDate?: Date;
  modifiedDate?: Date;
  company?: string;
  description?: string;
  keywords?: string[];
  category?: string;
  status?: string;
  revision?: number;
}

export interface PPTXElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'table' | 'chart' | 'group';
  content?: string;
  style?: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };
  properties?: Record<string, unknown>;
}

export interface PPTXSlide {
  number: number;
  elements: PPTXElement[];
  background: {
    type: 'solid' | 'gradient' | 'image' | 'none' | 'pattern';
    color?: string;
    gradient?: {
      type: 'linear' | 'radial';
      stops: Array<{
        position: number;
        color: string;
      }>;
      angle?: number;
    };
    image?: {
      src: string;
      fit: 'none' | 'fill' | 'contain' | 'cover';
    };
  };
  layout: string;
  notes?: string;
  duration?: number;
  transition?: {
    type: string;
    duration: number;
    direction?: string;
  };
}

export interface ProcessingOptions {
  validateFile?: boolean;
  extractMetadata?: boolean;
  extractNotes?: boolean;
  preserveFormatting?: boolean;
  maxImageSize?: number;
  imageQuality?: number;
}

export interface PPTXProcessingResult {
  slides: PPTXSlide[];
  metadata: PPTXMetadata;
  projectId?: string;
}

export class PPTXProcessor {
  private validator: PPTXValidator;
  private slideProcessor: SlideProcessor;
  private parser: XMLParser;
  private userId: string | null = null;

  constructor(userId?: string) {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      preserveOrder: true
    });
    this.validator = new PPTXValidator();
    this.slideProcessor = new SlideProcessor(this.parser);
    if (userId) {
      this.userId = userId;
    }
  }

  setUserContext(userId: string | null) {
    this.userId = userId ?? null;
    return this;
  }

  /**
   * Processa um arquivo PPTX a partir de um buffer
   */
  async parse(buffer: Buffer): Promise<PPTXProcessingResult> {
    try {
      // Validar arquivo
      const validation = await this.validator.validatePPTX(buffer);
      if (!validation.isValid) {
        throw new Error(`Arquivo PPTX inválido: ${validation.errors[0].message}`);
      }

      // Carregar arquivo ZIP
      const zip = await JSZip.loadAsync(buffer);

      // Extrair metadados
      const metadata = await this.extractMetadata(zip);

      // Processar slides
      const slides = await this.processSlides(zip);

      // **INTEGRAÇÃO SUPABASE: Criar projeto e slides no banco de dados**
      let projectId: string | undefined;

      if (this.userId) {
        const newProject = await createProject({
          user_id: this.userId,
          title: metadata.title || 'Novo Projeto PPTX',
          description:
            metadata.description || `Projeto importado em ${new Date().toLocaleDateString()}`
        });

        if (!newProject) {
          throw new Error('Falha ao criar o projeto no banco de dados.');
        }

        projectId = newProject.id;

        const slidePayloads = slides.map(slide => ({
          project_id: newProject.id,
          order_index: slide.number,
          title: `Slide ${slide.number}`,
          content: JSON.stringify(slide.elements),
          duration: 5
        }));

        for (const payload of slidePayloads) {
          await addSlide(payload);
        }
      }
      // Fim da integração

      return {
        slides,
        metadata,
        projectId
      };
    } catch (error) {
      console.error('Erro ao processar PPTX:', error);
      throw error;
    }
  }

  /**
   * Extrai metadados do arquivo PPTX
   */
  private async extractMetadata(zip: JSZip): Promise<PPTXMetadata> {
    try {
      const coreProps = await zip.file('docProps/core.xml')?.async('text');
      if (!coreProps) {
        return this.createEmptyMetadata();
      }

      const parsed = this.parser.parse(coreProps);
      const props = parsed['cp:coreProperties'];

      return {
        title: props?.['dc:title'] || '',
        author: props?.['dc:creator'] || '',
        totalSlides: await this.countSlides(zip),
        createdDate: props?.['dcterms:created'] ? new Date(props['dcterms:created']) : undefined,
        modifiedDate: props?.['dcterms:modified'] ? new Date(props['dcterms:modified']) : undefined,
        company: props?.['cp:company'] || undefined,
        description: props?.['dc:description'] || undefined,
        keywords: props?.['cp:keywords']?.split(',').map((k: string) => k.trim()) || undefined,
        category: props?.['cp:category'] || undefined,
        status: props?.['cp:contentStatus'] || undefined,
        revision: props?.['cp:revision'] ? parseInt(props['cp:revision']) : undefined
      };
    } catch (error) {
      console.error('Erro ao extrair metadados:', error);
      return this.createEmptyMetadata();
    }
  }

  /**
   * Processa todos os slides do PPTX
   */
  private async processSlides(zip: JSZip): Promise<PPTXSlide[]> {
    const slides: PPTXSlide[] = [];
    const slideFiles = Object.keys(zip.files).filter(file =>
      file.match(/ppt\/slides\/slide[0-9]+\.xml/)
    );

    for (const slideFile of slideFiles) {
      const slideNumber = parseInt(slideFile.match(/slide([0-9]+)\.xml/)?.[1] || '0');
      const slide = await this.slideProcessor.processSlide(zip, slideFile, slideNumber);
      slides.push(slide);
    }

    // Ordenar slides por número
    slides.sort((a, b) => a.number - b.number);

    return slides;
  }

  /**
   * Conta o número total de slides
   */
  private async countSlides(zip: JSZip): Promise<number> {
    const slideFiles = Object.keys(zip.files).filter(file =>
      file.match(/ppt\/slides\/slide[0-9]+\.xml/)
    );
    return slideFiles.length;
  }

  /**
   * Cria um objeto de metadados vazio
   */
  private createEmptyMetadata(): PPTXMetadata {
    return {
      title: '',
      author: '',
      totalSlides: 0
    };
  }

  /**
   * Gera um ID único
   */
  private generateId(): string {
    return createHash('md5')
      .update(Date.now().toString())
      .digest('hex')
      .substring(0, 8);
  }
}