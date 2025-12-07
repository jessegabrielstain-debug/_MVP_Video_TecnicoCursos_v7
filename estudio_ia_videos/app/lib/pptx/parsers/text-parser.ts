import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { PPTXShape, PPTXParagraph, PPTXRun, getString, getNumber, ensureArray } from './types';

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
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  /**
   * Extrai texto de múltiplos slides como array (compatível com testes)
   */
  async extractText(zip: JSZip): Promise<Array<{
    slideNumber: number;
    text: string;
    formatting: SlideTextFormatting[];
    bulletPoints: string[];
    hyperlinks: SlideHyperlink[];
  }>> {
    try {
      const slideFiles = zip.filter((path) => !!path.match(/^ppt\/slides\/slide\d+\.xml$/));
      const results = [];

      for (let i = 0; i < slideFiles.length; i++) {
        const slideNumber = i + 1;
        const result = await this.extractTextFromSlide(zip, slideNumber);
        
        if (result.success) {
          const formatting = result.textBoxes?.map(tb => tb.formatting).filter(Boolean) as SlideTextFormatting[] || [];
          results.push({
            slideNumber,
            text: result.plainText || '',
            formatting,
            bulletPoints: result.bulletPoints || [],
            hyperlinks: await this.extractHyperlinks(zip, slideNumber),
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error extracting text from slides:', error);
      return [];
    }
  }

  /**
   * Extrai texto de um slide específico (método original)
   */
  async extractTextFromSlide(zip: JSZip, slideNumber: number): Promise<SlideTextExtractionResult> {
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
      const shapes = ensureArray<PPTXShape>(spTree['p:sp']);
      
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        if (!shape || !shape['p:txBody']) continue;

        const txBody = shape['p:txBody'];
        const position = this.extractPosition(shape);
        const formatting = this.extractFormattingFromShape(shape, `shape-${i}`);
        
        let shapeText = '';
        const paragraphs = ensureArray<PPTXParagraph>(txBody['a:p']);

        for (const paragraph of paragraphs) {
          if (!paragraph) continue;
          
          // Verificar se é bullet point
          const isBullet = paragraph['a:pPr']?.['a:buFont'] || paragraph['a:pPr']?.['a:buChar'];
          
          const runs = ensureArray<PPTXRun>(paragraph['a:r']);
          let paragraphText = '';

          for (const run of runs) {
            if (!run) continue;
            const text = getString(run['a:t']);
            if (text) {
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

  private extractPosition(shape: PPTXShape): SlideTextBoxPosition | undefined {
    try {
      const spPr = shape['p:spPr'];
      if (!spPr) return undefined;

      const xfrm = spPr['a:xfrm'];
      if (!xfrm) return undefined;

      const off = xfrm['a:off'];
      const ext = xfrm['a:ext'];

      const position: SlideTextBoxPosition = {};

      if (off) {
        position.x = getNumber(off['@_x']);
        position.y = getNumber(off['@_y']);
      }

      if (ext) {
        position.width = getNumber(ext['@_cx']);
        position.height = getNumber(ext['@_cy']);
      }

      if (xfrm['@_rot']) {
        position.rotation = getNumber(xfrm['@_rot']) / 60000; // Converter de 1/60000 graus
      }

      return position;
    } catch {
      return undefined;
    }
  }

  private extractFormattingFromShape(shape: PPTXShape, id: string): SlideTextFormatting {
    const formatting: SlideTextFormatting = { id };

    try {
      const txBody = shape['p:txBody'];
      if (!txBody) return formatting;

      const paragraphs = ensureArray<PPTXParagraph>(txBody['a:p']);
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
      const runs = ensureArray<PPTXRun>(firstParagraph['a:r']);
      if (runs.length > 0) {
        const rPr = runs[0]['a:rPr'];
        if (rPr) {
          const fontSize = getNumber(rPr['@_sz']);
          if (fontSize) formatting.fontSize = fontSize / 100; // Converter de centésimos de ponto
          if (rPr['@_b'] === '1' || rPr['@_b'] === 1 || rPr['@_b'] === true) formatting.bold = true;
          if (rPr['@_i'] === '1' || rPr['@_i'] === 1 || rPr['@_i'] === true) formatting.italic = true;
          if (rPr['@_u'] !== 'none' && rPr['@_u']) formatting.underline = true;

          // Font family
          const latin = rPr['a:latin'];
          const fontFamily = getString(latin?.['@_typeface']);
          if (fontFamily) {
            formatting.fontFamily = fontFamily;
          }

          // Cor
          const solidFill = rPr['a:solidFill'];
          if (solidFill) {
            const srgbClr = solidFill['a:srgbClr'];
            const colorVal = getString(srgbClr?.['@_val']);
            if (colorVal) {
              formatting.color = `#${colorVal}`;
            }
          }
        }
      }
    } catch {
      // Ignorar erros de formatação
    }

    return formatting;
  }

  async extractFormatting(zip: JSZip, slideNumber: number): Promise<{ success: boolean; formatting: SlideTextFormatting[] }> {
    try {
      const result = await this.extractTextFromSlide(zip, slideNumber);
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
      const result = await this.extractTextFromSlide(zip, slideNumber);
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

      // Parse relationships to resolve hyperlink targets
      const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
      const relsFile = zip.file(relsPath);
      const relationships: Record<string, string> = {};

      if (relsFile) {
        const relsXml = await relsFile.async('string');
        const relsData = this.xmlParser.parse(relsXml);
        const rels = ensureArray(relsData?.Relationships?.Relationship);
        
        for (const rel of rels) {
          if (rel && rel['@_Id'] && rel['@_Target']) {
            relationships[rel['@_Id']] = rel['@_Target'];
          }
        }
      }

      const hyperlinks: SlideHyperlink[] = [];
      const spTree = slideData?.['p:sld']?.['p:cSld']?.['p:spTree'];
      if (!spTree) return [];

      const shapes = ensureArray<PPTXShape>(spTree['p:sp']);
      
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        if (!shape?.['p:txBody']) continue;

        const paragraphs = ensureArray<PPTXParagraph>(shape['p:txBody']['a:p']);
        
        for (const paragraph of paragraphs) {
          if (!paragraph) continue;
          
          const runs = ensureArray<PPTXRun>(paragraph['a:r']);
          for (const run of runs) {
            if (!run) continue;
            
            const rPr = run['a:rPr'];
            const hlinkClick = rPr?.['a:hlinkClick'];
            
            if (hlinkClick) {
              const text = getString(run['a:t']);
              const rId = getString(hlinkClick['@_r:id']);
              const tooltip = getString(hlinkClick['@_tooltip']);
              
              // Resolve URL from relationships if rId exists, otherwise use tooltip or rId itself
              const url = (rId && relationships[rId]) || tooltip || rId;
              
              if (url) {
                hyperlinks.push({
                  id: `hyperlink-${i}-${hyperlinks.length}`,
                  text,
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
  return parser.extractTextFromSlide(zip, slideNumber);
}
