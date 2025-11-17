import JSZip from 'jszip';
import { PPTXParser } from './pptx-parser';
import { Slide } from '@/lib/types';

export class PPTXProcessor {
  private parser: PPTXParser;

  constructor() {
    this.parser = new PPTXParser();
  }

  async process(options: { file: File }): Promise<{ slides: Slide[] }> {
    const { file } = options;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const slides = await this.parser.parse(zip);
    return { slides };
  }
}

