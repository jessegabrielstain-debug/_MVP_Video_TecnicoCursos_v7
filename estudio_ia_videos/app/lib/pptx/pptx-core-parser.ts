/**
 * PPTX Core Parser
 * Parser central de arquivos PPTX (low-level)
 */

import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface PPTXStructure {
  slides: Array<{
    id: string;
    layoutId?: string;
    content: string[]; // Array of text strings found in the slide
  }>;
  layouts: Array<{
    id: string;
    name: string;
  }>;
  masters: Array<{
    id: string;
    name: string;
  }>;
}

export class PPTXCoreParser {
  private parser: XMLParser;

  constructor(private jobId?: string) {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
  }

  async parseStructure(buffer: Buffer): Promise<PPTXStructure> {
    console.log(`[PPTX Core ${this.jobId || ''}] Parsing structure`);
    
    const zip = await JSZip.loadAsync(buffer);
    const structure: PPTXStructure = {
      slides: [],
      layouts: [],
      masters: [],
    };

    // Find all slide files
    const slideFiles = Object.keys(zip.files).filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/));
    
    // Sort by number to maintain order (approximate, real order is in presentation.xml)
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)![1]);
      const numB = parseInt(b.match(/slide(\d+)\.xml/)![1]);
      return numA - numB;
    });

    for (const fileName of slideFiles) {
      const xmlContent = await zip.file(fileName)?.async('string');
      if (!xmlContent) continue;

      const slideObj = this.parser.parse(xmlContent);
      const textContent = this.extractText(slideObj);

      structure.slides.push({
        id: fileName,
        content: textContent
      });
    }

    return structure;
  }

  async parseFile(buffer: Buffer, filename: string, progressCallback?: (progress: number) => void): Promise<any> {
    progressCallback?.(0.1);
    const structure = await this.parseStructure(buffer);
    progressCallback?.(0.9);
    
    return {
      id: `doc_${Date.now()}`,
      title: filename.replace('.pptx', ''),
      author: 'Unknown',
      slides: structure.slides.map((slide, idx) => ({
        slideNumber: idx + 1,
        title: `Slide ${idx + 1}`,
        content: slide.content.map(text => ({
          type: 'text',
          content: text
        }))
      })),
      metadata: {
        createdAt: new Date().toISOString()
      }
    };
  }
  
  private extractText(obj: unknown): string[] {
    const texts: string[] = [];
    
    // Recursive traversal to find <a:t> tags (text)
    function traverse(o: unknown) {
      if (Array.isArray(o)) {
        o.forEach(traverse);
        return;
      }

      if (typeof o === 'object' && o !== null) {
        const node = o as Record<string, unknown>;
        // Check for text tag
        if (node['a:t']) {
          // a:t can be a string or an object with text content
          const at = node['a:t'];
          let text = '';
          
          if (typeof at === 'string') {
            text = at;
          } else if (typeof at === 'object' && at !== null && '#text' in at) {
            text = (at as Record<string, unknown>)['#text'] as string;
          }

          if (text && typeof text === 'string' && text.trim().length > 0) {
            texts.push(text.trim());
          }
        }
        
        // Continue traversal
        for (const key in node) {
          traverse(node[key]);
        }
      }
    }
    
    traverse(obj);
    return texts;
  }
  
  async extractRels(buffer: Buffer): Promise<Record<string, string>> {
    // Placeholder - extrair relações do PPTX
    return {};
  }
}

export const pptxCoreParser = new PPTXCoreParser();
