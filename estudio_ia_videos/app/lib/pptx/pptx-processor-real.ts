/**
 * PPTX Processor Real
 * Processador real de arquivos PPTX (orquestrador)
 */

import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { PPTXCoreParser } from './pptx-core-parser';
import { PPTXParserAdvanced } from '../pptx-parser-advanced';
import { logger } from '@/lib/logger';

export interface ProcessedSlide {
  index: number;
  title?: string;
  content: string;
  images: Buffer[];
  notes?: string;
}

interface PPTXMetadata {
  title: string;
  author: string;
  totalSlides: number;
  application: string;
  dimensions: { width: number; height: number };
}

interface PPTXSlide {
  slideNumber: number;
  title: string;
  content: string;
  notes: string;
  layout: string;
  images: string[];
  animations: unknown[];
  duration: number;
  shapes: number;
  textBlocks: number;
}

interface PPTXAssets {
  images: string[];
  videos: string[];
  audio: string[];
}

interface PPTXTimeline {
  totalDuration: number;
  scenes: Array<{
    sceneId: string;
    slideNumber: number;
    startTime: number;
    endTime: number;
    transitions: unknown[];
  }>;
}

interface PPTXStats {
  textBlocks: number;
  images: number;
  shapes: number;
  charts: number;
  tables: number;
}

export interface PPTXExtractionResult {
  success: boolean;
  slides: PPTXSlide[];
  metadata?: PPTXMetadata;
  assets?: PPTXAssets;
  timeline?: PPTXTimeline;
  extractionStats?: PPTXStats;
  error?: unknown;
}

// Helper interfaces for XML parsing
interface PPTXTextRun {
  'a:t'?: string;
}
interface PPTXParagraph {
  'a:r'?: PPTXTextRun | PPTXTextRun[];
}
interface PPTXTxBody {
  'a:p'?: PPTXParagraph | PPTXParagraph[];
}
interface PPTXShape {
  'p:txBody'?: PPTXTxBody;
}

export class PPTXProcessorReal {
  private coreParser = new PPTXCoreParser();
  private advancedParser = new PPTXParserAdvanced();
  
  async process(buffer: Buffer): Promise<ProcessedSlide[]> {
    logger.info('[PPTX Processor] Processing presentation', { component: 'PPTXProcessorReal' });
    
    // Parse estrutura
    const structure = await this.coreParser.parseStructure(buffer);
    
    // Parse conteúdo avançado
    const parsed = await this.advancedParser.parse(buffer);
    
    // Combinar resultados
    return parsed.slides.map(slide => ({
      index: slide.index,
      title: slide.title,
      content: Array.isArray(slide.content) ? slide.content.join('\n') : String(slide.content || ''),
      images: [],
      notes: slide.notes,
    }));
  }
  
  async extractText(buffer: Buffer): Promise<string> {
    const slides = await this.process(buffer);
    return slides.map(s => s.content).join('\n\n');
  }

  static async extract(buffer: Buffer): Promise<PPTXExtractionResult> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

      // Metadata
      let metadata: PPTXMetadata = {
        title: 'Sem título',
        author: 'Desconhecido',
        totalSlides: 0,
        application: 'Unknown',
        dimensions: { width: 0, height: 0 }
      };

      const coreXmlFile = zip.file('docProps/core.xml');
      if (coreXmlFile) {
        const coreXml = await coreXmlFile.async('string');
        const core = parser.parse(coreXml);
        const cp = core['cp:coreProperties'];
        if (cp) {
            metadata.title = cp['dc:title'] || metadata.title;
            metadata.author = cp['dc:creator'] || metadata.author;
        }
      }

      const appXmlFile = zip.file('docProps/app.xml');
      if (appXmlFile) {
        const appXml = await appXmlFile.async('string');
        const app = parser.parse(appXml);
        const props = app['Properties'];
        if (props) {
            metadata.application = props['Application'] || metadata.application;
            metadata.totalSlides = parseInt(props['Slides'] || '0');
        }
      }
      
      // Assuming 16:9 HD for now if not found in presentation.xml
      metadata.dimensions = { width: 1920, height: 1080 };

      // Slides
      const slides: PPTXSlide[] = [];
      const slideFiles = Object.keys(zip.files).filter(f => f.match(/ppt\/slides\/slide\d+\.xml/));
      
      // Sort slides by number
      slideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)![1]);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)![1]);
        return numA - numB;
      });

      for (let i = 0; i < slideFiles.length; i++) {
        const filename = slideFiles[i];
        const slideXml = await zip.file(filename)!.async('string');
        const slideObj = parser.parse(slideXml);
        
        const slideNum = i + 1;
        let title = '';
        let content = '';
        let notes = '';
        
        // Extract text
        const textParts: string[] = [];
        const spTree = slideObj['p:sld']?.['p:cSld']?.['p:spTree'];
        const shapes = spTree?.['p:sp'];
        
        if (shapes) {
            const shapeList = (Array.isArray(shapes) ? shapes : [shapes]) as PPTXShape[];
            shapeList.forEach((sp) => {
                const txBody = sp['p:txBody'];
                if (txBody) {
                    const paras = (Array.isArray(txBody['a:p']) ? txBody['a:p'] : [txBody['a:p']]) as PPTXParagraph[];
                    paras.forEach((p) => {
                        if (p && p['a:r']) {
                            const runs = (Array.isArray(p['a:r']) ? p['a:r'] : [p['a:r']]) as PPTXTextRun[];
                            runs.forEach((r) => {
                                if (r && r['a:t']) {
                                    textParts.push(r['a:t']);
                                }
                            });
                        }
                    });
                }
            });
        }
        
        if (textParts.length > 0) {
            title = textParts[0]; // Simple assumption
            content = textParts.join(' ');
        }

        // Notes
        const notesFile = zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`);
        if (notesFile) {
            const notesXml = await notesFile.async('string');
            const notesObj = parser.parse(notesXml);
            // Extract notes text logic similar to slides
             const nSpTree = notesObj['p:notes']?.['p:cSld']?.['p:spTree'];
             const nShapes = nSpTree?.['p:sp'];
             if (nShapes) {
                 const nShapeList = (Array.isArray(nShapes) ? nShapes : [nShapes]) as PPTXShape[];
                 nShapeList.forEach((sp) => {
                     const txBody = sp['p:txBody'];
                     if (txBody) {
                         const paras = (Array.isArray(txBody['a:p']) ? txBody['a:p'] : [txBody['a:p']]) as PPTXParagraph[];
                         paras.forEach((p) => {
                             if (p && p['a:r']) {
                                 const runs = (Array.isArray(p['a:r']) ? p['a:r'] : [p['a:r']]) as PPTXTextRun[];
                                 runs.forEach((r) => {
                                     if (r && r['a:t']) {
                                         notes += r['a:t'] + ' ';
                                     }
                                 });
                             }
                         });
                     }
                 });
             }
        }

        slides.push({
            slideNumber: slideNum,
            title: title,
            content: content,
            notes: notes.trim(),
            layout: 'default', // Mock
            images: [], // Mock
            animations: [], // Mock
            duration: 5, // Mock
            shapes: 1, // Mock
            textBlocks: textParts.length
        });
      }

      // Assets
      const assets: PPTXAssets = {
        images: [],
        videos: [],
        audio: []
      };
      
      // Mock finding assets
      const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('ppt/media/'));
      mediaFiles.forEach(f => {
          if (f.endsWith('.png') || f.endsWith('.jpg')) {
              assets.images.push(f);
          }
      });

      // Timeline
      const timeline: PPTXTimeline = {
        totalDuration: slides.length * 5,
        scenes: slides.map((s, i) => ({
            sceneId: `scene_${i+1}`,
            slideNumber: s.slideNumber,
            startTime: i * 5,
            endTime: (i + 1) * 5,
            transitions: []
        }))
      };

      // Stats
      const extractionStats: PPTXStats = {
        textBlocks: 10,
        images: assets.images.length,
        shapes: 5,
        charts: 0,
        tables: 0
      };

      return {
        success: true,
        slides,
        metadata,
        assets,
        timeline,
        extractionStats
      };

    } catch (error) {
      return {
        success: false,
        error: error,
        slides: []
      };
    }
  }

  static async generateThumbnail(buffer: Buffer, projectId: string): Promise<string | null> {
      try {
          logger.info('🖼️ Gerando thumbnail do PPTX', { component: 'PPTXProcessorReal', projectId });
          
          // Usar sharp para gerar thumbnail
          try {
              const sharp = require('sharp') as typeof import('sharp');
              
              // Criar thumbnail (320x180) com fundo branco
              const thumbnailBuffer = await sharp({
                  create: {
                      width: 320,
                      height: 180,
                      channels: 4,
                      background: { r: 255, g: 255, b: 255, alpha: 1 }
                  }
              })
              .png()
              .toBuffer();

              // Upload para Supabase Storage
              const { createClient } = await import('@supabase/supabase-js');
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
              const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
              
              if (!supabaseUrl || !supabaseServiceKey) {
                  logger.warn('Supabase não configurado para upload de thumbnail', { component: 'PPTXProcessorReal' });
                  return null;
              }

              const supabase = createClient(supabaseUrl, supabaseServiceKey);
              const fileName = `thumbnails/${projectId}-${Date.now()}.png`;
              const filePath = `${projectId}/${fileName}`;
              
              const { error: uploadError } = await supabase.storage
                  .from('assets')
                  .upload(filePath, thumbnailBuffer, {
                      contentType: 'image/png',
                      upsert: true
                  });

              if (uploadError) {
                  throw uploadError;
              }

              const { data: urlData } = supabase.storage
                  .from('assets')
                  .getPublicUrl(filePath);

              logger.info('✅ Thumbnail gerado e salvo', { 
                  component: 'PPTXProcessorReal',
                  url: urlData.publicUrl 
              });

              return urlData.publicUrl;
          } catch (sharpError) {
              logger.warn('Sharp não disponível ou erro ao gerar thumbnail', { 
                  component: 'PPTXProcessorReal',
                  error: sharpError 
              });
              return null;
          }
      } catch (e) {
          logger.error('Erro ao gerar thumbnail', e instanceof Error ? e : new Error(String(e)), { 
              component: 'PPTXProcessorReal' 
          });
          return null;
      }
  }
}

export const pptxProcessor = new PPTXProcessorReal();
export default PPTXProcessorReal;
