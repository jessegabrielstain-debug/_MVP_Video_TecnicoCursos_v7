/**
 * 🎯 Slide Processor - Processamento avançado de slides
 * Responsável por extrair e processar elementos visuais dos slides
 */

import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'crypto';
import path from 'path';

export interface SlideElement {
  id: string;
  type: 'shape' | 'text' | 'image' | 'table' | 'chart' | 'group';
  content?: string;
  style?: ElementStyle;
  position: ElementPosition;
  properties?: Record<string, unknown>;
}

export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
}

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
}

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image' | 'pattern' | 'none';
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
}

export interface ProcessedSlide {
  number: number;
  elements: SlideElement[];
  background: SlideBackground;
  layout: string;
  notes?: string;
  duration?: number;
  transition?: {
    type: string;
    duration: number;
    direction?: string;
  };
}

export class SlideProcessor {
  private xmlParser: XMLParser;
  
  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      preserveOrder: true
    });
  }

  /**
   * Processa um slide individual do PPTX
   */
  async processSlide(
    zip: JSZip,
    slideXmlPath: string,
    slideNumber: number
  ): Promise<ProcessedSlide> {
    const slideContent = await zip.file(slideXmlPath)?.async('text');
    if (!slideContent) {
      throw new Error(`Slide ${slideNumber} não encontrado`);
    }

    const parsed = this.xmlParser.parse(slideContent);
    const slideData = this.extractSlideData(parsed);

    // Processa relacionamentos do slide (imagens, mídia, etc)
    const relsPath = this.getSlideRelsPath(slideXmlPath);
    const relationships = await this.processRelationships(zip, relsPath);

    // Processa elementos do slide
    const elements = await this.processElements(parsed, relationships);

    // Processa background
    const background = this.processBackground(parsed, relationships);

    // Processa notas do slide
    const notes = await this.processNotes(zip, slideNumber);

    return {
      number: slideNumber,
      elements,
      background,
      layout: this.detectLayout(elements),
      notes,
      duration: this.calculateDuration(elements),
      transition: this.extractTransition(parsed)
    };
  }

  /**
   * Extrai dados básicos do slide
   */
  private extractSlideData(parsed: any): any {
    // Implementação da extração de dados básicos
    return parsed;
  }

  /**
   * Processa elementos individuais do slide
   */
  private async processElements(parsed: any, relationships: any): Promise<SlideElement[]> {
    const elements: SlideElement[] = [];
    
    // Processa shapes e outros elementos
    if (parsed?.p?.sld?.cSld?.spTree) {
      const spTree = parsed.p.sld.cSld.spTree;
      
      // Processa shapes
      if (spTree.sp) {
        for (const shape of Array.isArray(spTree.sp) ? spTree.sp : [spTree.sp]) {
          const element = this.processShape(shape);
          if (element) elements.push(element);
        }
      }

      // Processa grupos
      if (spTree.grpSp) {
        for (const group of Array.isArray(spTree.grpSp) ? spTree.grpSp : [spTree.grpSp]) {
          const groupElements = this.processGroup(group);
          elements.push(...groupElements);
        }
      }

      // Processa imagens
      if (spTree.pic) {
        for (const pic of Array.isArray(spTree.pic) ? spTree.pic : [spTree.pic]) {
          const image = this.processImage(pic, relationships);
          if (image) elements.push(image);
        }
      }
    }

    return elements;
  }

  /**
   * Processa um shape individual
   */
  private processShape(shape: any): SlideElement | null {
    if (!shape) return null;

    return {
      id: shape.nvSpPr?.cNvPr?.['@_id'] || this.generateId(),
      type: 'shape',
      content: this.extractTextFromShape(shape),
      style: this.extractShapeStyle(shape),
      position: this.extractPosition(shape),
      properties: {
        shapeType: shape.spPr?.prstGeom?.['@_prst'] || 'rect'
      }
    };
  }

  /**
   * Processa um grupo de elementos
   */
  private processGroup(group: any): SlideElement[] {
    const elements: SlideElement[] = [];
    
    if (group.grpSpPr) {
      const groupTransform = this.extractPosition(group);
      
      // Processa elementos do grupo
      if (group.sp) {
        for (const shape of Array.isArray(group.sp) ? group.sp : [group.sp]) {
          const element = this.processShape(shape);
          if (element) {
            // Ajusta posição relativa ao grupo
            element.position = this.adjustPositionToGroup(element.position, groupTransform);
            elements.push(element);
          }
        }
      }
    }

    return elements;
  }

  /**
   * Processa uma imagem
   */
  private processImage(pic: any, relationships: any): SlideElement | null {
    if (!pic || !pic.blipFill?.blip?.['@_embed']) return null;

    const rId = pic.blipFill.blip['@_embed'];
    const imageInfo = relationships[rId];

    return {
      id: pic.nvPicPr?.cNvPr?.['@_id'] || this.generateId(),
      type: 'image',
      position: this.extractPosition(pic),
      properties: {
        src: imageInfo?.target || '',
        name: pic.nvPicPr?.cNvPr?.['@_name'] || ''
      }
    };
  }

  /**
   * Extrai texto de um shape
   */
  private extractTextFromShape(shape: any): string {
    if (!shape.txBody?.p) return '';

    let text = '';
    const paragraphs = Array.isArray(shape.txBody.p) ? shape.txBody.p : [shape.txBody.p];

    for (const p of paragraphs) {
      if (p.r) {
        const runs = Array.isArray(p.r) ? p.r : [p.r];
        for (const r of runs) {
          if (r.t) text += r.t + ' ';
        }
      }
      text = text.trim() + '\n';
    }

    return text.trim();
  }

  /**
   * Extrai estilo de um shape
   */
  private extractShapeStyle(shape: any): ElementStyle {
    return {
      fill: this.extractFill(shape.spPr?.solidFill),
      stroke: this.extractStroke(shape.spPr?.ln),
      strokeWidth: shape.spPr?.ln?.['@_w'] ? shape.spPr.ln['@_w'] / 12700 : undefined,
      opacity: shape.spPr?.['@_alpha'] ? shape.spPr['@_alpha'] / 100000 : 1,
      fontFamily: shape.txBody?.p?.[0]?.r?.[0]?.rPr?.['@_typeface'],
      fontSize: shape.txBody?.p?.[0]?.r?.[0]?.rPr?.['@_sz'] ? shape.txBody.p[0].r[0].rPr['@_sz'] / 100 : undefined,
      textAlign: this.extractTextAlign(shape.txBody?.p?.[0]?.pPr)
    };
  }

  /**
   * Extrai posição de um elemento
   */
  private extractPosition(element: any): ElementPosition {
    const xfrm = element.spPr?.xfrm || element.grpSpPr?.xfrm;
    if (!xfrm) return { x: 0, y: 0, width: 0, height: 0 };

    return {
      x: xfrm.off?.['@_x'] ? xfrm.off['@_x'] / 12700 : 0,
      y: xfrm.off?.['@_y'] ? xfrm.off['@_y'] / 12700 : 0,
      width: xfrm.ext?.['@_cx'] ? xfrm.ext['@_cx'] / 12700 : 0,
      height: xfrm.ext?.['@_cy'] ? xfrm.ext['@_cy'] / 12700 : 0,
      rotation: xfrm['@_rot'] ? (xfrm['@_rot'] / 60000) % 360 : 0
    };
  }

  /**
   * Ajusta posição relativa ao grupo
   */
  private adjustPositionToGroup(position: ElementPosition, groupTransform: ElementPosition): ElementPosition {
    return {
      x: position.x + groupTransform.x,
      y: position.y + groupTransform.y,
      width: position.width,
      height: position.height,
      rotation: (position.rotation || 0) + (groupTransform.rotation || 0)
    };
  }

  /**
   * Processa relacionamentos do slide
   */
  private async processRelationships(zip: JSZip, relsPath: string): Promise<Record<string, unknown>> {
    const relationships: Record<string, unknown> = {};
    
    const relsContent = await zip.file(relsPath)?.async('text');
    if (relsContent) {
      const parsed = this.xmlParser.parse(relsContent);
      const rels = parsed?.Relationships?.Relationship;
      
      if (rels) {
        const relsArray = Array.isArray(rels) ? rels : [rels];
        for (const rel of relsArray) {
          relationships[rel['@_Id']] = {
            type: rel['@_Type'],
            target: rel['@_Target']
          };
        }
      }
    }

    return relationships;
  }

  /**
   * Obtém o caminho do arquivo de relacionamentos do slide
   */
  private getSlideRelsPath(slideXmlPath: string): string {
    const dir = path.dirname(slideXmlPath);
    const basename = path.basename(slideXmlPath);
    return `${dir}/_rels/${basename}.rels`;
  }

  /**
   * Processa notas do slide
   */
  private async processNotes(zip: JSZip, slideNumber: number): Promise<string | undefined> {
    const notesPath = `ppt/notesSlides/notesSlide${slideNumber}.xml`;
    const notesContent = await zip.file(notesPath)?.async('text');
    
    if (notesContent) {
      const parsed = this.xmlParser.parse(notesContent);
      // Implementar extração de notas
      return '';
    }

    return undefined;
  }

  /**
   * Detecta o layout do slide baseado nos elementos
   */
  private detectLayout(elements: SlideElement[]): string {
    // Implementar detecção de layout
    return 'default';
  }

  /**
   * Calcula a duração estimada do slide
   */
  private calculateDuration(elements: SlideElement[]): number {
    // Implementar cálculo de duração
    return 5000; // 5 segundos por padrão
  }

  /**
   * Extrai informações de transição do slide
   */
  private extractTransition(parsed: any): { type: string; duration: number; direction?: string } | undefined {
    const transition = parsed?.p?.sld?.transition;
    if (!transition) return undefined;

    return {
      type: Object.keys(transition)[0] || 'none',
      duration: transition['@_dur'] ? transition['@_dur'] * 1000 : 1000,
      direction: transition['@_dir']
    };
  }

  /**
   * Gera um ID único para elementos
   */
  private generateId(): string {
    return createHash('md5')
      .update(Date.now().toString())
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Extrai cor de preenchimento
   */
  private extractFill(fill: any): string | undefined {
    if (!fill) return undefined;
    // Implementar extração de cor
    return '#000000';
  }

  /**
   * Extrai cor do contorno
   */
  private extractStroke(stroke: any): string | undefined {
    if (!stroke) return undefined;
    // Implementar extração de cor do contorno
    return '#000000';
  }

  /**
   * Extrai alinhamento do texto
   */
  private extractTextAlign(pPr: any): ElementStyle['textAlign'] {
    if (!pPr) return 'left';
    if (pPr['@_algn'] === 'ctr') return 'center';
    if (pPr['@_algn'] === 'r') return 'right';
    if (pPr['@_algn'] === 'just') return 'justify';
    return 'left';
  }
}