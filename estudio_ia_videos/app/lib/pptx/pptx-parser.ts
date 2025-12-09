import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { ParsedPPTXData, ParsedPPTXMetadata, Slide } from '@/lib/definitions';
import { logger } from '@/lib/logger';
import type { PPTXParseResult } from '@/types/external-apis';

const DEFAULT_METADATA: ParsedPPTXMetadata = {
  title: 'Untitled Presentation',
  author: 'Unknown',
  slideCount: 0,
};

type SlideXmlNode = Record<string, unknown>;

export class PPTXParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseAttributeValue: true,
      trimValues: true,
      cdataPropName: '__cdata',
    });
  }

  static async validatePPTX(buffer: Buffer): Promise<boolean> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const presentationFile = zip.file(/ppt\/presentation.xml/);
      if (!presentationFile || presentationFile.length === 0) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async parsePPTX(buffer: Buffer): Promise<ParsedPPTXData> {
    const zip = await JSZip.loadAsync(buffer);

    const coreXmlFile = zip.file('docProps/core.xml');
    let title = DEFAULT_METADATA.title;
    let author = DEFAULT_METADATA.author;
    let subject: string | undefined;

    if (coreXmlFile) {
      const coreXml = await coreXmlFile.async('string');
      const coreProps = this.xmlParser.parse(coreXml)['cp:coreProperties'];
      if (coreProps) {
        title = coreProps['dc:title'] || title;
        author = coreProps['dc:creator'] || author;
        subject = coreProps['dc:subject'];
      }
    }

    const presentationXmlFile = zip.file(/ppt\/presentation.xml/)[0];
    if (!presentationXmlFile) {
      throw new Error('presentation.xml not found in ppt/ directory');
    }
    const presentationXml = await presentationXmlFile.async('string');
    const presentation = this.xmlParser.parse(presentationXml);
    const slideList =
      presentation['p:presentation']?.['p:sldIdLst'] ??
      presentation['p:presentation']?.['p:slideIdLst'];
    const slideIds = (this.isRecord(slideList) ? slideList['p:sldId'] ?? slideList['p:slideId'] : undefined) || [];
    const slideEntries = this.toArray(slideIds);

    const slides: Partial<Slide>[] = [];
    if (slideEntries.length > 0) {
      for (const [index] of slideEntries.entries()) {
        const slideNumber = index + 1;
        const slidePath = `ppt/slides/slide${slideNumber}.xml`;
        const slideXmlFile = zip.file(slidePath);

        if (slideXmlFile) {
          try {
            const slideXml = await slideXmlFile.async('string');
            const slideContent = this.xmlParser.parse(slideXml);
            const textElements = this.extractText(slideContent);
            slides.push({
              title: textElements[0] || `Slide ${slideNumber}`,
              content: textElements.slice(1).join('\n'),
              notes: '',
            });
          } catch (e) {
            logger.warn(`Failed to parse slide ${slideNumber}:`, { component: 'PPTXParser', error: e });
            // Continue to next slide
          }
        }
      }
    }


    return {
      metadata: {
        title,
        author,
        subject,
        slideCount: slides.length,
      },
      slides,
    };
  }

  async parseFile(file: File): Promise<PPTXParseResult> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await this.parsePPTX(buffer);
    
    return {
      metadata: {
        title: parsed.metadata.title,
        author: parsed.metadata.author,
        slideCount: parsed.metadata.slideCount,
        subject: parsed.metadata.subject,
        keywords: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      slides: parsed.slides.map((s, i) => ({
        slideIndex: i,
        slideId: `slide-${i+1}`,
        layout: 'default',
        title: s.title,
        notes: s.notes,
        elements: s.content ? [{
          id: `text-${i}`,
          type: 'text' as const,
          content: s.content,
          position: { x: 0, y: 0, width: 100, height: 100 }
        }] : [],
      })),
      errors: [],
      warnings: [],
      statistics: {
        totalSlides: parsed.metadata.slideCount,
        totalElements: parsed.slides.length,
        totalImages: 0,
        totalTextBoxes: parsed.slides.length,
        parseTimeMs: 0,
      }
    };
  }

  convertToTimelineData(pptxDocument: Record<string, unknown>): Record<string, unknown> {
    return {
      tracks: [
        {
          id: 'track-1',
          type: 'video',
          clips: (pptxDocument.slides as Record<string, unknown>[]).map((s, i: number) => ({
            id: `clip-${s.id}`,
            start: i * 5,
            duration: 5,
            content: s
          }))
        }
      ]
    };
  }

  private extractText(slideContent: unknown): string[] {
    const texts: string[] = [];
    if (!this.isRecord(slideContent)) {
      return texts;
    }

    const spTree = this.getNested(slideContent, ['p:sld', 'p:cSld', 'p:spTree']);
    if (!this.isRecord(spTree)) {
      return texts;
    }

    const shapes = this.toArray(spTree['p:sp']);
    for (const shape of shapes) {
      if (!this.isRecord(shape)) continue;
      const textBody = this.isRecord(shape['p:txBody']) ? (shape['p:txBody'] as SlideXmlNode) : undefined;
      if (!textBody) continue;

      const paragraphs = this.toArray(textBody['a:p']);
      for (const paragraph of paragraphs) {
        if (!this.isRecord(paragraph)) continue;
        const runs = this.toArray(paragraph['a:r']);
        for (const run of runs) {
          if (!this.isRecord(run)) continue;
          const textValue = run['a:t'];
          if (typeof textValue === 'string' || typeof textValue === 'number') {
            texts.push(String(textValue));
          } else if (this.isRecord(textValue) && typeof textValue.__cdata === 'string') {
            texts.push(textValue.__cdata);
          }
        }
      }
    }

    return texts;
  }

  private isRecord(value: unknown): value is SlideXmlNode {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  private getNested(source: SlideXmlNode, path: string[]): unknown {
    return path.reduce<unknown>((acc, key) => {
      if (!this.isRecord(acc)) {
        return undefined;
      }
      return acc[key];
    }, source);
  }
}
