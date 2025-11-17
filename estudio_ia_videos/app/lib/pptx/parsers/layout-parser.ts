import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface SlideLayoutInfo {
  name: string;
  type: string;
  layoutId?: string;
}

export interface SlideLayoutElement {
  id: string;
  elementType: 'text' | 'image' | 'shape' | 'chart' | 'table';
  position?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface SlideContentAnalysis {
  textPercentage: number;
  imagePercentage: number;
  otherPercentage: number;
}

export interface SlideLayoutDetectionResult {
  success: boolean;
  layout?: SlideLayoutInfo;
  elements?: SlideLayoutElement[];
  confidence?: number;
  error?: string;
}

export class PPTXLayoutParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  async detectLayout(zip: JSZip, slideNumber: number): Promise<SlideLayoutDetectionResult> {
    try {
      const slidePath = `ppt/slides/slide${slideNumber}.xml`;
      const slideFile = zip.file(slidePath);
      
      if (!slideFile) {
        return { success: false, error: 'Slide não encontrado' };
      }

      const slideXml = await slideFile.async('string');
      const slideData = this.xmlParser.parse(slideXml);

      // Extrair referência ao slideLayout
      const sldLayout = slideData?.['p:sld']?.['p:cSld']?.['p:sldLayout'];
      const layoutRel = sldLayout?.['@_r:id'];

      let layoutInfo: SlideLayoutInfo = {
        name: 'Unknown',
        type: 'blank',
      };

      if (layoutRel) {
        // Ler arquivo de relacionamentos
        const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
        const relsFile = zip.file(relsPath);
        
        if (relsFile) {
          const relsXml = await relsFile.async('string');
          const relsData = this.xmlParser.parse(relsXml);
          const relationships = this.toArray(relsData?.['Relationships']?.['Relationship']);
          
          const layoutRelation = relationships.find(
            (rel: any) => rel['@_Id'] === layoutRel
          );

          if (layoutRelation) {
            const layoutPath = `ppt/${layoutRelation['@_Target'].replace('../', '')}`;
            const layoutFile = zip.file(layoutPath);
            
            if (layoutFile) {
              const layoutXml = await layoutFile.async('string');
              const layoutData = this.xmlParser.parse(layoutXml);
              const layoutAttrs = layoutData?.['p:sldLayout'];
              
              if (layoutAttrs) {
                const layoutType = layoutAttrs['@_type'] || 'blank';
                const layoutName = this.getLayoutName(layoutType);
                
                layoutInfo = {
                  name: layoutName,
                  type: layoutType,
                  layoutId: layoutRel,
                };
              }
            }
          }
        }
      }

      // Extrair elementos do slide
      const elements = await this.extractLayoutElements(zip, slideNumber);
      
      // Se não conseguimos detectar o layout pelo XML, inferir pelo conteúdo
      if (layoutInfo.type === 'blank' && elements.length > 0) {
        layoutInfo.type = await this.detectLayoutType(elements);
        layoutInfo.name = this.getLayoutName(layoutInfo.type);
      }

      const confidence = await this.calculateConfidence(layoutInfo, elements);

      return {
        success: true,
        layout: layoutInfo,
        elements,
        confidence,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async extractLayoutElements(zip: JSZip, slideNumber: number): Promise<SlideLayoutElement[]> {
    try {
      const slidePath = `ppt/slides/slide${slideNumber}.xml`;
      const slideFile = zip.file(slidePath);
      
      if (!slideFile) return [];

      const slideXml = await slideFile.async('string');
      const slideData = this.xmlParser.parse(slideXml);

      const elements: SlideLayoutElement[] = [];
      const spTree = slideData?.['p:sld']?.['p:cSld']?.['p:spTree'];
      if (!spTree) return [];

      // Processar shapes (texto)
      const shapes = this.toArray(spTree['p:sp']);
      for (const shape of shapes) {
        if (shape?.['p:txBody']) {
          const element = this.extractElementInfo(shape, 'text');
          if (element) elements.push(element);
        }
      }

      // Processar pictures (imagens)
      const pictures = this.toArray(spTree['p:pic']);
      for (const picture of pictures) {
        const element = this.extractElementInfo(picture, 'image');
        if (element) elements.push(element);
      }

      // Processar gráficos
      const graphics = this.toArray(spTree['p:graphicFrame']);
      for (const graphic of graphics) {
        const nvGraphicFramePr = graphic?.['p:nvGraphicFramePr'];
        const cNvPr = nvGraphicFramePr?.['p:cNvPr'];
        const name = cNvPr?.['@_name']?.toLowerCase() || '';
        
        let elementType: 'chart' | 'table' | 'shape' = 'shape';
        if (name.includes('chart')) elementType = 'chart';
        else if (name.includes('table')) elementType = 'table';
        
        const element = this.extractElementInfo(graphic, elementType);
        if (element) elements.push(element);
      }

      return elements;
    } catch {
      return [];
    }
  }

  private extractElementInfo(shape: any, type: SlideLayoutElement['elementType']): SlideLayoutElement | null {
    try {
      const spPr = shape['p:spPr'];
      const position: any = {};

      if (spPr) {
        const xfrm = spPr['a:xfrm'];
        if (xfrm) {
          const off = xfrm['a:off'];
          const ext = xfrm['a:ext'];

          if (off) {
            position.x = parseInt(off['@_x'], 10) || 0;
            position.y = parseInt(off['@_y'], 10) || 0;
          }
          if (ext) {
            position.width = parseInt(ext['@_cx'], 10) || 0;
            position.height = parseInt(ext['@_cy'], 10) || 0;
          }
        }
      }

      return {
        id: `element-${type}-${Math.random().toString(36).substr(2, 9)}`,
        elementType: type,
        position: Object.keys(position).length > 0 ? position : undefined,
      };
    } catch {
      return null;
    }
  }

  async analyzeSlideContent(zip: JSZip, slideNumber: number): Promise<SlideContentAnalysis> {
    const elements = await this.extractLayoutElements(zip, slideNumber);
    
    if (elements.length === 0) {
      return { textPercentage: 0, imagePercentage: 0, otherPercentage: 0 };
    }

    const textElements = elements.filter((e) => e.elementType === 'text').length;
    const imageElements = elements.filter((e) => e.elementType === 'image').length;
    const otherElements = elements.length - textElements - imageElements;

    const total = elements.length;

    return {
      textPercentage: Math.round((textElements / total) * 100),
      imagePercentage: Math.round((imageElements / total) * 100),
      otherPercentage: Math.round((otherElements / total) * 100),
    };
  }

  async detectLayoutType(elements: SlideLayoutElement[]): Promise<string> {
    const textCount = elements.filter((e) => e.elementType === 'text').length;
    const imageCount = elements.filter((e) => e.elementType === 'image').length;
    const chartCount = elements.filter((e) => e.elementType === 'chart').length;
    const tableCount = elements.filter((e) => e.elementType === 'table').length;

    // Lógica de inferência de layout
    if (textCount === 1 && imageCount === 0 && chartCount === 0) {
      return 'title'; // Apenas título
    }
    if (textCount >= 1 && imageCount >= 1) {
      return 'titleContent'; // Título + conteúdo
    }
    if (imageCount >= 1 && textCount === 0) {
      return 'picture'; // Apenas imagem
    }
    if (chartCount >= 1) {
      return 'chart'; // Contém gráfico
    }
    if (tableCount >= 1) {
      return 'table'; // Contém tabela
    }
    if (textCount >= 2) {
      return 'twoContent'; // Dois conteúdos
    }
    if (elements.length === 0) {
      return 'blank'; // Slide vazio
    }

    return 'obj'; // Layout genérico
  }

  private getLayoutName(type: string): string {
    const layoutNames: Record<string, string> = {
      title: 'Title Slide',
      titleContent: 'Title and Content',
      sectionHeader: 'Section Header',
      twoContent: 'Two Content',
      comparison: 'Comparison',
      titleOnly: 'Title Only',
      blank: 'Blank',
      contentCaption: 'Content with Caption',
      picture: 'Picture with Caption',
      chart: 'Chart',
      table: 'Table',
      obj: 'Content',
    };

    return layoutNames[type] || type;
  }

  async calculateConfidence(layout: SlideLayoutInfo, elements: SlideLayoutElement[] = []): Promise<number> {
    // Se temos layoutId do XML, confiança alta
    if (layout.layoutId) {
      return 0.95;
    }

    // Se inferido pelo conteúdo
    if (elements.length === 0) {
      return 0.5; // Baixa confiança para slide vazio
    }

    if (elements.length >= 3) {
      return 0.85; // Boa confiança com múltiplos elementos
    }

    return 0.75; // Confiança média
  }

  private toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  }
}

export async function detectSlideLayout(
  zip: JSZip,
  slideNumber: number,
): Promise<SlideLayoutDetectionResult> {
  const parser = new PPTXLayoutParser();
  return parser.detectLayout(zip, slideNumber);
}
