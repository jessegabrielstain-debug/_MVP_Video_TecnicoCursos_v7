/**
 * 📊 Enhanced PPTX Processor with real-time validation
 * Improved processing with detailed error handling and progress tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

interface ProcessingResult {
  success: boolean;
  data?: {
    slides: SlideData[];
    metadata: PPTXMetadata;
    totalDuration: number;
    errors: ProcessingError[];
    warnings: string[];
  };
  error?: string;
  processingTime: number;
}

interface SlideData {
  id: string;
  title: string;
  content: string;
  images: ImageData[];
  animations: AnimationData[];
  duration: number;
  order: number;
  textElements: TextElement[];
  backgroundType: 'solid' | 'gradient' | 'image' | 'pattern';
  backgroundColor?: string;
  backgroundImage?: string;
}

interface PPTXMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  createdDate: Date;
  modifiedDate: Date;
  slideCount: number;
  totalImages: number;
  hasAnimations: boolean;
  templateInfo: string;
  fileSize: number;
  version: string;
}

interface ProcessingError {
  type: 'warning' | 'error' | 'critical';
  message: string;
  slideIndex?: number;
  elementId?: string;
  recoverable: boolean;
}

interface ImageData {
  id: string;
  name: string;
  type: string;
  base64: string;
  width: number;
  height: number;
  position: { x: number; y: number };
  alt?: string;
}

interface AnimationData {
  id: string;
  type: string;
  duration: number;
  delay: number;
  elementId: string;
}

interface TextElement {
  id: string;
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  position: { x: number; y: number };
  width: number;
  height: number;
}

export class EnhancedPPTXProcessor {
  private parser: XMLParser;
  private processingErrors: ProcessingError[] = [];
  private warnings: string[] = [];

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: 'text',
      parseAttributeValue: true,
      parseTagValue: true,
    });
  }

  async processFile(fileBuffer: Buffer, fileName: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    this.processingErrors = [];
    this.warnings = [];

    try {
      console.log(`[Enhanced PPTX] Starting processing: ${fileName}`);
      
      // Validate file
      const validation = this.validateFile(fileBuffer, fileName);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          processingTime: Date.now() - startTime
        };
      }

      // Extract ZIP contents
      const zip = await JSZip.loadAsync(fileBuffer);
      
      // Process presentation metadata
      const metadata = await this.extractMetadata(zip, fileName, fileBuffer.length);
      
      // Process slides
      const slides = await this.extractSlides(zip);
      
      // Calculate total duration
      const totalDuration = slides.reduce((acc, slide) => acc + slide.duration, 0);
      
      console.log(`[Enhanced PPTX] Processing completed: ${slides.length} slides, ${totalDuration}s total`);
      
      return {
        success: true,
        data: {
          slides,
          metadata,
          totalDuration,
          errors: this.processingErrors,
          warnings: this.warnings
        },
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('[Enhanced PPTX] Processing failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error',
        processingTime: Date.now() - startTime
      };
    }
  }

  private validateFile(buffer: Buffer, fileName: string): { valid: boolean; error?: string } {
    // Check file extension
    if (!fileName.toLowerCase().endsWith('.pptx')) {
      return { valid: false, error: 'Invalid file extension. Only .pptx files are supported.' };
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (buffer.length > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 50MB.' };
    }

    // Check minimum size (1KB)
    if (buffer.length < 1024) {
      return { valid: false, error: 'File too small. Minimum size is 1KB.' };
    }

    // Check ZIP signature
    const zipSignature = buffer.slice(0, 4);
    const validSignatures = [
      Buffer.from([0x50, 0x4B, 0x03, 0x04]), // Standard ZIP
      Buffer.from([0x50, 0x4B, 0x05, 0x06]), // Empty ZIP
      Buffer.from([0x50, 0x4B, 0x07, 0x08])  // Spanned ZIP
    ];

    const isValidZip = validSignatures.some(sig => sig.equals(zipSignature));
    if (!isValidZip) {
      return { valid: false, error: 'Invalid PPTX file format. File appears to be corrupted.' };
    }

    return { valid: true };
  }

  private async extractMetadata(zip: JSZip, fileName: string, fileSize: number): Promise<PPTXMetadata> {
    try {
      const corePropsFile = zip.file('docProps/core.xml');
      const appPropsFile = zip.file('docProps/app.xml');
      
      let metadata: Partial<PPTXMetadata> = {
        title: fileName.replace(/\.pptx$/i, ''),
        author: 'Unknown',
        subject: '',
        keywords: [],
        createdDate: new Date(),
        modifiedDate: new Date(),
        slideCount: 0,
        totalImages: 0,
        hasAnimations: false,
        templateInfo: 'Custom',
        fileSize,
        version: '1.0'
      };

      if (corePropsFile) {
        const corePropsXml = await corePropsFile.async('text');
        const coreProps = this.parser.parse(corePropsXml);
        
        if (coreProps['cp:coreProperties']) {
          const props = coreProps['cp:coreProperties'];
          metadata.title = props['dc:title'] || metadata.title;
          metadata.author = props['dc:creator'] || metadata.author;
          metadata.subject = props['dc:subject'] || metadata.subject;
          metadata.keywords = props['cp:keywords'] ? 
            props['cp:keywords'].split(/[,;]/).map((k: string) => k.trim()) : [];
          
          if (props['dcterms:created']) {
            metadata.createdDate = new Date(props['dcterms:created']);
          }
          if (props['dcterms:modified']) {
            metadata.modifiedDate = new Date(props['dcterms:modified']);
          }
        }
      }

      if (appPropsFile) {
        const appPropsXml = await appPropsFile.async('text');
        const appProps = this.parser.parse(appPropsXml);
        
        if (appProps['Properties']) {
          const props = appProps['Properties'];
          metadata.slideCount = parseInt(props['Slides']) || 0;
          metadata.templateInfo = props['Template'] || 'Custom';
          metadata.version = props['AppVersion'] || '1.0';
        }
      }

      return metadata as PPTXMetadata;

    } catch (error) {
      this.warnings.push('Could not extract complete metadata from PPTX file');
      console.warn('[Enhanced PPTX] Metadata extraction warning:', error);
      
      return {
        title: fileName.replace(/\.pptx$/i, ''),
        author: 'Unknown',
        subject: '',
        keywords: [],
        createdDate: new Date(),
        modifiedDate: new Date(),
        slideCount: 0,
        totalImages: 0,
        hasAnimations: false,
        templateInfo: 'Custom',
        fileSize,
        version: '1.0'
      };
    }
  }

  private async extractSlides(zip: JSZip): Promise<SlideData[]> {
    const slides: SlideData[] = [];
    
    try {
      // Get slide relationships
      const relsFile = zip.file('ppt/_rels/presentation.xml.rels');
      if (!relsFile) {
        throw new Error('Could not find presentation relationships');
      }

      const relsXml = await relsFile.async('text');
      const rels = this.parser.parse(relsXml);
      
      const slideFiles = [];
      if (rels.Relationships && rels.Relationships.Relationship) {
        const relationships = Array.isArray(rels.Relationships.Relationship) 
          ? rels.Relationships.Relationship 
          : [rels.Relationships.Relationship];
        
        for (const rel of relationships) {
          if (rel['@_Type'] && rel['@_Type'].includes('slide') && !rel['@_Type'].includes('master')) {
            slideFiles.push({
              id: rel['@_Id'],
              target: rel['@_Target']
            });
          }
        }
      }

      // Sort slides by ID to maintain order
      slideFiles.sort((a, b) => {
        const aMatch = a.target.match(/slide(\d+)\.xml/);
        const bMatch = b.target.match(/slide(\d+)\.xml/);
        if (aMatch && bMatch) {
          return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        }
        return 0;
      });

      // Process each slide
      for (let index = 0; index < slideFiles.length; index++) {
        const slideFile = slideFiles[index];
        try {
          const slide = await this.processSlide(zip, slideFile.target, index);
          slides.push(slide);
        } catch (error) {
          this.processingErrors.push({
            type: 'error',
            message: `Failed to process slide ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            slideIndex: index,
            recoverable: true
          });
          
          // Create placeholder slide
          slides.push({
            id: `slide-${index}`,
            title: `Slide ${index + 1} (Error)`,
            content: 'This slide could not be processed due to an error.',
            images: [],
            animations: [],
            duration: 3,
            order: index,
            textElements: [],
            backgroundType: 'solid',
            backgroundColor: '#ffffff'
          });
        }
      }

      return slides;

    } catch (error) {
      this.processingErrors.push({
        type: 'critical',
        message: `Critical error extracting slides: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recoverable: false
      });
      
      throw error;
    }
  }

  private async processSlide(zip: JSZip, slideTarget: string, index: number): Promise<SlideData> {
    const slideFile = zip.file(`ppt/${slideTarget}`);
    if (!slideFile) {
      throw new Error(`Slide file not found: ${slideTarget}`);
    }

    const slideXml = await slideFile.async('text');
    const slideData = this.parser.parse(slideXml);
    
    const slide: SlideData = {
      id: `slide-${index}`,
      title: '',
      content: '',
      images: [],
      animations: [],
      duration: 5, // Default 5 seconds
      order: index,
      textElements: [],
      backgroundType: 'solid',
      backgroundColor: '#ffffff'
    };

    // Extract slide content
    if (slideData['p:sld'] && slideData['p:sld']['p:cSld']) {
      const cSld = slideData['p:sld']['p:cSld'];
      
      // Process shapes and content
      if (cSld['p:spTree'] && cSld['p:spTree']['p:sp']) {
        const shapes = Array.isArray(cSld['p:spTree']['p:sp']) 
          ? cSld['p:spTree']['p:sp'] 
          : [cSld['p:spTree']['p:sp']];
        
        for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
          const shape = shapes[shapeIndex];
          
          try {
            await this.processShape(shape, slide, shapeIndex);
          } catch (error) {
            this.warnings.push(`Could not process shape ${shapeIndex} in slide ${index + 1}`);
          }
        }
      }

      // Process background
      if (cSld['p:bg']) {
        this.processBackground(cSld['p:bg'], slide);
      }
    }

    // Set slide title from first text element or default
    if (slide.textElements.length > 0) {
      slide.title = slide.textElements[0].content.substring(0, 50) + 
        (slide.textElements[0].content.length > 50 ? '...' : '');
    } else {
      slide.title = `Slide ${index + 1}`;
    }

    // Combine all text content
    slide.content = slide.textElements.map(el => el.content).join(' ');

    // Calculate duration based on content
    const wordsCount = slide.content.split(/\s+/).length;
    slide.duration = Math.max(3, Math.min(15, wordsCount * 0.5)); // 0.5 seconds per word, min 3s, max 15s

    return slide;
  }

  private async processShape(shape: Record<string, any>, slide: SlideData, shapeIndex: number): Promise<void> {
    // Process text content
    if (shape['p:txBody'] && shape['p:txBody']['a:p']) {
      const paragraphs = Array.isArray(shape['p:txBody']['a:p']) 
        ? shape['p:txBody']['a:p'] 
        : [shape['p:txBody']['a:p']];
      
      for (const paragraph of paragraphs) {
        if (paragraph['a:r'] && paragraph['a:r']['a:t']) {
          const textContent = paragraph['a:r']['a:t'];
          if (textContent && typeof textContent === 'string' && textContent.trim()) {
            slide.textElements.push({
              id: `text-${slide.order}-${shapeIndex}`,
              content: textContent.trim(),
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#000000',
              bold: false,
              italic: false,
              position: { x: 0, y: 0 },
              width: 100,
              height: 20
            });
          }
        }
      }
    }

    // Process images (placeholder - would need to extract from relationships)
    if (shape['p:pic']) {
      slide.images.push({
        id: `image-${slide.order}-${shapeIndex}`,
        name: `slide${slide.order}_image${shapeIndex}`,
        type: 'image/png',
        base64: '', // Would extract actual image data
        width: 100,
        height: 100,
        position: { x: 0, y: 0 },
        alt: 'Image from slide'
      });
    }
  }

  private processBackground(bgData: Record<string, any>, slide: SlideData): void {
    // Process background properties
    if (bgData['p:bgPr']) {
      const bgPr = bgData['p:bgPr'];
      
      if (bgPr['a:solidFill']) {
        slide.backgroundType = 'solid';
        // Extract color information
        slide.backgroundColor = '#ffffff'; // Default, would parse actual color
      } else if (bgPr['a:gradFill']) {
        slide.backgroundType = 'gradient';
      } else if (bgPr['a:blipFill']) {
        slide.backgroundType = 'image';
      }
    }
  }
}

// API endpoint
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const processor = new EnhancedPPTXProcessor();
    
    const result = await processor.processFile(fileBuffer, file.name);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'PPTX processed successfully',
        data: result.data,
        processingTime: result.processingTime
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('[Enhanced PPTX API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
