import JSZip from 'jszip';

export interface SlideTextBoxSummary {
  id: string;
  text: string;
  position?: SlideTextBoxPosition;
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
  async extractText(zip: JSZip, slideNumber: number): Promise<SlideTextExtractionResult> {
    if (!zip.files[`ppt/slides/slide${slideNumber}.xml`]) {
      return { success: false, error: 'Slide não encontrado' };
    }

    const mockText = `Texto do slide ${slideNumber}`;
    return {
      success: true,
      plainText: mockText,
      wordCount: mockText.split(/\s+/).length,
      characterCount: mockText.length,
      bulletPoints: [],
      textBoxes: [{ id: '1', text: mockText, position: { x: 0, y: 0 } }],
    };
  }

  async extractFormatting(zip: JSZip, slideNumber: number): Promise<{ success: boolean; formatting: SlideTextFormatting[] }> {
    return { success: true, formatting: [] };
  }

  async extractBulletPoints(zip: JSZip, slideNumber: number): Promise<string[]> {
    return [];
  }

  async extractHyperlinks(zip: JSZip, slideNumber: number): Promise<SlideHyperlink[]> {
    return [];
  }
}

export async function extractTextFromSlide(
  zip: JSZip,
  slideNumber: number,
): Promise<SlideTextExtractionResult> {
  const parser = new PPTXTextParser();
  return parser.extractText(zip, slideNumber);
}
