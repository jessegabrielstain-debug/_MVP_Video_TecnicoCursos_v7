import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { PPTXNotesData, PPTXParagraph, PPTXRun, getString, ensureArray } from './types';

export interface SpeakerNotesResult {
  success: boolean;
  notes?: string;
  wordCount?: number;
  estimatedDuration?: number; // em segundos (baseado em 150 WPM)
  error?: string;
}

export class PPTXNotesParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  async extractNotes(zip: JSZip, slideNumber: number): Promise<SpeakerNotesResult> {
    try {
      const notesPath = `ppt/notesSlides/notesSlide${slideNumber}.xml`;
      const notesFile = zip.file(notesPath);

      if (!notesFile) {
        return {
          success: true,
          notes: '',
          wordCount: 0,
          estimatedDuration: 0,
        };
      }

      const notesXml = await notesFile.async('string');
      const notesData = this.xmlParser.parse(notesXml);

      const notesText = this.extractTextFromNotes(notesData);
      const wordCount = notesText ? notesText.split(/\s+/).length : 0;
      
      // Calcular duração estimada: 150 palavras por minuto
      const estimatedDuration = wordCount > 0 ? Math.ceil((wordCount / 150) * 60) : 0;

      return {
        success: true,
        notes: notesText,
        wordCount,
        estimatedDuration,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  private extractTextFromNotes(notesData: PPTXNotesData): string {
    try {
      const texts: string[] = [];
      const spTree = notesData?.['p:notes']?.['p:cSld']?.['p:spTree'];
      
      if (!spTree) return '';

      // Processar shapes que contêm texto
      const shapes = ensureArray(spTree['p:sp']);
      
      for (const shape of shapes) {
        if (!shape?.['p:txBody']) continue;

        const paragraphs = ensureArray<PPTXParagraph>(shape['p:txBody']['a:p']);
        
        for (const paragraph of paragraphs) {
          if (!paragraph) continue;
          
          const runs = ensureArray<PPTXRun>(paragraph['a:r']);
          
          for (const run of runs) {
            if (!run) continue;
            
            const text = getString(run['a:t']);
            if (text) {
              texts.push(text);
            }
          }
        }
      }

      return texts.join(' ').trim();
    } catch {
      return '';
    }
  }

  /**
   * Extrai notas de múltiplos slides de uma vez
   */
  async extractAllNotes(zip: JSZip): Promise<Map<number, SpeakerNotesResult>> {
    const notesMap = new Map<number, SpeakerNotesResult>();
    
    // Encontrar todos os arquivos de notes
    const notesFiles = Object.keys(zip.files).filter(
      (filename) => filename.match(/ppt\/notesSlides\/notesSlide\d+\.xml/)
    );

    for (const notesPath of notesFiles) {
      const match = notesPath.match(/notesSlide(\d+)\.xml/);
      if (match) {
        const slideNumber = parseInt(match[1], 10);
        const result = await this.extractNotes(zip, slideNumber);
        notesMap.set(slideNumber, result);
      }
    }

    return notesMap;
  }
}

export async function extractSpeakerNotes(
  zip: JSZip,
  slideNumber: number
): Promise<SpeakerNotesResult> {
  const parser = new PPTXNotesParser();
  return parser.extractNotes(zip, slideNumber);
}

export async function extractAllSpeakerNotes(
  zip: JSZip
): Promise<Map<number, SpeakerNotesResult>> {
  const parser = new PPTXNotesParser();
  return parser.extractAllNotes(zip);
}
