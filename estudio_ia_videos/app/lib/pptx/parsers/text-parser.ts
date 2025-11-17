import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface SlideTextBoxSummary {
  id: string;
  text: string;
  position?: SlideTextBoxPosition;
  formatting?: SlideTextFormatting;
}

export type SlideTextBoxPosition = Partial<{
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}>;

export interface SlideTextFormatting {
  id: string;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface SlideHyperlink {
  id: string;
  text: string;
  url: string;
  target?: '_self' | '_blank';
}

export interface SlideTextExtractionResult {
  success: boolean;
  plainText?: string;
  wordCount?: number;
  characterCount?: number;
  bulletPoints?: string[];
  textBoxes?: SlideTextBoxSummary[];
  error?: string;
}

export class PPTXTextParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  async extractText(zip: JSZip, slideNumber: number): Promise<SlideTextExtractionResult> {
    try {
      const slidePath = `ppt/slides/slide${slideNumber}.xml`;
      const slideFile = zip.file(slidePath);
      
      if (!slideFile) {
        return { success: false, error: 'Slide não encontrado' };
      }

      const slideXml = await slideFile.async('string');
      const slideData = this.xmlParser.parse(slideXml);

      const textBoxes: SlideTextBoxSummary[] = [];
      const bulletPoints: string[] = [];
      let allText = '';

      // Navegar pela estrutura p:sld -> p:cSld -> p:spTree -> p:sp (shapes)
      const spTree = slideData?.['p:sld']?.['p:cSld']?.['p:spTree'];
      if (!spTree) {
        return {
          success: true,
          plainText: '',
          wordCount: 0,
          characterCount: 0,
          bulletPoints: [],
          textBoxes: [],
        };
      }

      // Processar todos os shapes (p:sp) que contêm texto
      const shapes = this.toArray(spTree['p:sp']);
      
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        if (!shape || !shape['p:txBody']) continue;

        const txBody = shape['p:txBody'];
        const position = this.extractPosition(shape);
        const formatting = this.extractFormattingFromShape(shape, `shape-${i}`);
        
        let shapeText = '';
        const paragraphs = this.toArray(txBody['a:p']);

        for (const paragraph of paragraphs) {
          if (!paragraph) continue;
          
          // Verificar se é bullet point
          const isBullet = paragraph['a:pPr']?.['a:buFont'] || paragraph['a:pPr']?.['a:buChar'];
          
          const runs = this.toArray(paragraph['a:r']);
          let paragraphText = '';

          for (const run of runs) {
            if (!run) continue;
            const text = run['a:t'];
            if (typeof text === 'string') {
              paragraphText += text;
            }
          }

          if (paragraphText) {
            if (isBullet) {
              bulletPoints.push(paragraphText);
            }
            shapeText += paragraphText + '\n';
          }
        }

        if (shapeText.trim()) {
          textBoxes.push({
            id: `textbox-${i}`,
            text: shapeText.trim(),
            position,
            formatting,
          });
          allText += shapeText + ' ';
        }
      }

      const plainText = allText.trim();
      const wordCount = plainText ? plainText.split(/\s+/).length : 0;
      const characterCount = plainText.length;

      return {
        success: true,
        plainText,
        wordCount,
        characterCount,
        bulletPoints,
        textBoxes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  private extractPosition(shape: any): SlideTextBoxPosition | undefined {
    try {
      const spPr = shape['p:spPr'];
      if (!spPr) return undefined;

      const xfrm = spPr['a:xfrm'];
      if (!xfrm) return undefined;

      const off = xfrm['a:off'];
      const ext = xfrm['a:ext'];

      const position: SlideTextBoxPosition = {};

      if (off) {
        if (off['@_x'] !== undefined) position.x = parseInt(off['@_x'], 10);
        if (off['@_y'] !== undefined) position.y = parseInt(off['@_y'], 10);
      }

      if (ext) {
        if (ext['@_cx'] !== undefined) position.width = parseInt(ext['@_cx'], 10);
        if (ext['@_cy'] !== undefined) position.height = parseInt(ext['@_cy'], 10);
      }

      if (xfrm['@_rot']) {
        position.rotation = parseInt(xfrm['@_rot'], 10) / 60000; // Converter de 1/60000 graus
      }

      return position;
    } catch {
      return undefined;
    }
  }

  private extractFormattingFromShape(shape: any, id: string): SlideTextFormatting {
    const formatting: SlideTextFormatting = { id };

    try {
      const txBody = shape['p:txBody'];
      if (!txBody) return formatting;

      const paragraphs = this.toArray(txBody['a:p']);
      if (paragraphs.length === 0) return formatting;

      const firstParagraph = paragraphs[0];
      const pPr = firstParagraph['a:pPr'];
      
      // Alinhamento
      if (pPr?.['@_algn']) {
        const align = pPr['@_algn'];
        if (align === 'l') formatting.alignment = 'left';
        else if (align === 'ctr') formatting.alignment = 'center';
        else if (align === 'r') formatting.alignment = 'right';
        else if (align === 'just') formatting.alignment = 'justify';
      }

      // Pegar formatação do primeiro run
      const runs = this.toArray(firstParagraph['a:r']);
      if (runs.length > 0) {
        const rPr = runs[0]['a:rPr'];
        if (rPr) {
          if (rPr['@_sz']) formatting.fontSize = parseInt(rPr['@_sz'], 10) / 100; // Converter de centésimos de ponto
          if (rPr['@_b'] === '1' || rPr['@_b'] === true) formatting.bold = true;
          if (rPr['@_i'] === '1' || rPr['@_i'] === true) formatting.italic = true;
          if (rPr['@_u'] !== 'none' && rPr['@_u']) formatting.underline = true;

          // Font family
          const latin = rPr['a:latin'];
          if (latin?.['@_typeface']) {
            formatting.fontFamily = latin['@_typeface'];
          }

          // Cor
          const solidFill = rPr['a:solidFill'];
          if (solidFill) {
            const srgbClr = solidFill['a:srgbClr'];
            if (srgbClr?.['@_val']) {
              formatting.color = `#${srgbClr['@_val']}`;
            }
          }
        }
      }
    } catch {
      // Ignorar erros de formatação
    }

    return formatting;
  }

  private toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  }

  async extractFormatting(zip: JSZip, slideNumber: number): Promise<{ success: boolean; formatting: SlideTextFormatting[] }> {
    try {
      const result = await this.extractText(zip, slideNumber);
      if (!result.success || !result.textBoxes) {
        return { success: false, formatting: [] };
      }

      const formatting = result.textBoxes
        .filter(tb => tb.formatting)
        .map(tb => tb.formatting!);

      return { success: true, formatting };
    } catch {
      return { success: false, formatting: [] };
    }
  }

  async extractBulletPoints(zip: JSZip, slideNumber: number): Promise<string[]> {
    try {
      const result = await this.extractText(zip, slideNumber);
      return result.bulletPoints || [];
    } catch {
      return [];
    }
  }

  async extractHyperlinks(zip: JSZip, slideNumber: number): Promise<SlideHyperlink[]> {
    try {
      const slidePath = `ppt/slides/slide${slideNumber}.xml`;
      const slideFile = zip.file(slidePath);
      
      if (!slideFile) return [];

      const slideXml = await slideFile.async('string');
      const slideData = this.xmlParser.parse(slideXml);

      const hyperlinks: SlideHyperlink[] = [];
      const spTree = slideData?.['p:sld']?.['p:cSld']?.['p:spTree'];
      if (!spTree) return [];

      const shapes = this.toArray(spTree['p:sp']);
      
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        if (!shape?.['p:txBody']) continue;

        const paragraphs = this.toArray(shape['p:txBody']['a:p']);
        
        for (const paragraph of paragraphs) {
          if (!paragraph) continue;
          
          const runs = this.toArray(paragraph['a:r']);
          for (const run of runs) {
            if (!run) continue;
            
            const rPr = run['a:rPr'];
            const hlinkClick = rPr?.['a:hlinkClick'];
            
            if (hlinkClick) {
              const text = run['a:t'] || '';
              const url = hlinkClick['@_r:id'] || hlinkClick['@_tooltip'] || '';
              
              if (url) {
                hyperlinks.push({
                  id: `hyperlink-${i}-${hyperlinks.length}`,
                  text: typeof text === 'string' ? text : '',
                  url,
                  target: '_blank',
                });
              }
            }
          }
        }
      }

      return hyperlinks;
    } catch {
      return [];
    }
  }
}

export async function extractTextFromSlide(
  zip: JSZip,
  slideNumber: number,
): Promise<SlideTextExtractionResult> {
  const parser = new PPTXTextParser();
  return parser.extractText(zip, slideNumber);
}
