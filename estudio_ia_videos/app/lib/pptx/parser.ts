import JSZip from 'jszip';
import { ParsedPPTXData, SlideTransition } from '@/lib/definitions';

const SLIDE_PREFIX = 'ppt/slides/slide';
const NOTES_PREFIX = 'ppt/notesSlides/notesSlide';

const XML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

const DEFAULT_TRANSITION: SlideTransition = {
  type: 'none',
  duration: 0,
};

export interface ParsedPptxSlideSummary {
  index: number;
  title: string;
  textContent: string;
  notes: string | null;
}

function decodeXmlEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39|apos);/g, match => XML_ENTITY_MAP[match] ?? match);
}

function extractTextBlocks(xml: string): string[] {
  const matches = xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
  const blocks: string[] = [];
  for (const match of matches) {
    const raw = match[1] ?? '';
    const trimmed = decodeXmlEntities(raw).trim();
    if (trimmed.length > 0) {
      blocks.push(trimmed);
    }
  }
  return blocks;
}

function getSlideIndexFromPath(path: string): number {
  const match = path.match(/slide(\d+)\.xml$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export async function parsePptxSlides(buffer: ArrayBuffer): Promise<ParsedPptxSlideSummary[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slideEntries = Object.keys(zip.files)
    .filter(name => name.startsWith(SLIDE_PREFIX) && name.endsWith('.xml'))
    .sort((a, b) => getSlideIndexFromPath(a) - getSlideIndexFromPath(b));

  const parsedSlides: ParsedPptxSlideSummary[] = [];

  for (const slidePath of slideEntries) {
    const slideIndex = getSlideIndexFromPath(slidePath);
    const slideFile = zip.files[slidePath];
    if (!slideFile) continue;

    const slideXml = await slideFile.async('string');
    const blocks = extractTextBlocks(slideXml);
    const textContent = blocks.join('\n');
    const title = blocks[0] ?? `Slide ${slideIndex}`;

    let notes: string | null = null;
    const notesPath = `${NOTES_PREFIX}${slideIndex}.xml`;
    const notesFile = zip.files[notesPath];
    if (notesFile) {
      const notesXml = await notesFile.async('string');
      const notesBlocks = extractTextBlocks(notesXml);
      if (notesBlocks.length > 0) {
        notes = notesBlocks.join('\n');
      }
    }

    parsedSlides.push({
      index: slideIndex,
      title,
      textContent,
      notes,
    });
  }

  return parsedSlides;
}

export class PPTXParser {
  async parsePPTX(buffer: Buffer): Promise<ParsedPPTXData> {
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    const slides = await parsePptxSlides(arrayBuffer);

    return {
      metadata: {
        title: 'Mock Presentation',
        author: 'Mock Author',
        slideCount: slides.length,
      },
      slides: slides.map(slide => ({
        id: String(slide.index),
        slideNumber: slide.index,
        title: slide.title,
        content: slide.textContent,
        notes: slide.notes ?? undefined,
        duration: 5,
        transition: DEFAULT_TRANSITION,
      })),
    };
  }

  static async validatePPTX(buffer: Buffer): Promise<boolean> {
    try {
      await JSZip.loadAsync(buffer);
      return true;
    } catch {
      return false;
    }
  }
}

