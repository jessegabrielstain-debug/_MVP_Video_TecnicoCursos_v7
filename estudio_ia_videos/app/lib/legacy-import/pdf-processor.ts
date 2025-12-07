// @ts-ignore
import { createWorker } from 'tesseract.js';
// @ts-ignore
import pdf from 'pdf-parse';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface PDFPage {
  pageNumber: number;
  text: string;
  images: string[]; // Base64 encoded images
  layout: {
    width: number;
    height: number;
    elements: PDFElement[];
  };
}

export interface PDFElement {
  type: 'text' | 'image' | 'heading' | 'list' | 'table';
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    isBold?: boolean;
    isItalic?: boolean;
  };
}

export interface PDFProcessingOptions {
  extractImages?: boolean;
  ocrLanguage?: string;
  preserveLayout?: boolean;
  minTextLength?: number;
  enableSmartSegmentation?: boolean;
}

export interface ProcessedPDF {
  pages: PDFPage[];
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
    modificationDate?: string;
    pageCount: number;
  };
  summary: string;
  keyTopics: string[];
  estimatedDuration: number; // seconds
  complexity: 'simple' | 'medium' | 'complex';
}

export class PDFProcessor {
  private static instance: PDFProcessor;
  private tempDir: string;

  private constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'pdf-processing');
    this.ensureTempDir();
  }

  static getInstance(): PDFProcessor {
    if (!PDFProcessor.instance) {
      PDFProcessor.instance = new PDFProcessor();
    }
    return PDFProcessor.instance;
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async processPDF(
    pdfPath: string,
    options: PDFProcessingOptions = {}
  ): Promise<ProcessedPDF> {
    const {
      extractImages = true,
      ocrLanguage = 'por',
      preserveLayout = true,
      minTextLength = 10,
      enableSmartSegmentation = true
    } = options;

    try {
      // Extract text and metadata using pdf-parse
      const pdfBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdf(pdfBuffer);

      // Extract pages with images and layout
      const pages = await this.extractPages(pdfPath, {
        extractImages,
        ocrLanguage,
        preserveLayout
      });

      // Generate summary and key topics
      const summary = this.generateSummary(pages);
      const keyTopics = this.extractKeyTopics(pages);

      // Estimate video duration based on content complexity
      const estimatedDuration = this.estimateDuration(pages);
      const complexity = this.assessComplexity(pages);

      return {
        pages,
        metadata: {
          title: pdfData.info?.Title,
          author: pdfData.info?.Author,
          subject: pdfData.info?.Subject,
          keywords: pdfData.info?.Keywords,
          creationDate: pdfData.info?.CreationDate,
          modificationDate: pdfData.info?.ModDate,
          pageCount: pages.length
        },
        summary,
        keyTopics,
        estimatedDuration,
        complexity
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      throw new Error(`Failed to process PDF: ${(error as Error).message}`);
    }
  }

  private async extractPages(
    pdfPath: string,
    options: PDFProcessingOptions
  ): Promise<PDFPage[]> {
    const pages: PDFPage[] = [];

    try {
      // Convert PDF to images for OCR and layout analysis
      const imagePaths = await this.convertPDFToImages(pdfPath);

      for (let i = 0; i < imagePaths.length; i++) {
        const pageNumber = i + 1;
        const imagePath = imagePaths[i];

        // Extract text using OCR
        const ocrText = await this.extractTextFromImage(imagePath, options.ocrLanguage || 'por');

        // Extract layout elements
        const layout = await this.analyzeLayout(imagePath, ocrText);

        // Extract images if enabled
        const images = options.extractImages 
          ? await this.extractImagesFromPage(pdfPath, pageNumber)
          : [];

        pages.push({
          pageNumber,
          text: ocrText,
          images,
          layout
        });

        // Clean up temporary image file
        try {
          await fs.unlink(imagePath);
        } catch (cleanupError) {
          console.warn(`Failed to clean up temp image ${imagePath}:`, cleanupError);
        }
      }

      return pages;
    } catch (error) {
      console.error('Page extraction error:', error);
      throw error;
    }
  }

  private async convertPDFToImages(pdfPath: string): Promise<string[]> {
    const outputDir = path.join(this.tempDir, `pdf_images_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPattern = path.join(outputDir, 'page_%03d.png');
    
    // Convert PDF to high-resolution images
    const command = `magick convert -density 300 "${pdfPath}" -quality 100 "${outputPattern}"`;
    
    try {
      await execAsync(command);
    } catch (error) {
      // Fallback to pdftoppm if ImageMagick is not available
      const fallbackCommand = `pdftoppm -png -r 300 "${pdfPath}" "${path.join(outputDir, 'page')}"`;
      await execAsync(fallbackCommand);
    }

    // Get list of generated image files
    const files = await fs.readdir(outputDir);
    const imageFiles = files
      .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
      .sort()
      .map(file => path.join(outputDir, file));

    return imageFiles;
  }

  private async extractTextFromImage(imagePath: string, language: string): Promise<string> {
    const worker = await createWorker(language);
    
    try {
      const { data: { text } } = await worker.recognize(imagePath);
      await worker.terminate();
      return text.trim();
    } catch (error) {
      await worker.terminate();
      throw new Error(`OCR failed for image ${imagePath}: ${(error as Error).message}`);
    }
  }

  private async analyzeLayout(imagePath: string, text: string): Promise<{
    width: number;
    height: number;
    elements: PDFElement[];
  }> {
    // Get image dimensions
    const { stdout } = await execAsync(`identify -format "%w %h" "${imagePath}"`);
    const [width, height] = stdout.trim().split(' ').map(Number);

    // Simple layout analysis - in production, use more sophisticated methods
    const elements = this.detectLayoutElements(text, width, height);

    return {
      width,
      height,
      elements
    };
  }

  private detectLayoutElements(text: string, pageWidth: number, pageHeight: number): PDFElement[] {
    const elements: PDFElement[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    let currentY = 50; // Start position
    const lineHeight = 30;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.length === 0) return;

      // Detect element type based on content and formatting
      const elementType = this.classifyElementType(trimmedLine, index);
      
      // Estimate position (simplified - in production, use actual coordinates)
      const element: PDFElement = {
        type: elementType,
        content: trimmedLine,
        position: {
          x: 50,
          y: currentY,
          width: pageWidth - 100,
          height: lineHeight
        },
        style: this.analyzeTextStyle(trimmedLine)
      };

      elements.push(element);
      currentY += lineHeight + 10;
    });

    return elements;
  }

  private classifyElementType(text: string, lineIndex: number): PDFElement['type'] {
    const trimmedText = text.trim();

    // Heading detection
    if (trimmedText.length < 100 && (
      trimmedText === trimmedText.toUpperCase() ||
      /^[A-Z][a-zA-Z\s]{0,50}$/.test(trimmedText) ||
      lineIndex === 0
    )) {
      return 'heading';
    }

    // List detection
    if (/^[•\-*]\s+/.test(trimmedText) || /^\d+\.\s+/.test(trimmedText)) {
      return 'list';
    }

    // Table detection (simplified)
    if (trimmedText.includes('|') || trimmedText.includes('\t')) {
      return 'table';
    }

    // Image placeholder (if text indicates image)
    if (trimmedText.toLowerCase().includes('figura') || 
        trimmedText.toLowerCase().includes('imagem') ||
        trimmedText.toLowerCase().includes('figure')) {
      return 'image';
    }

    return 'text';
  }

  private analyzeTextStyle(text: string): PDFElement['style'] {
    return {
      fontSize: this.estimateFontSize(text),
      fontWeight: text === text.toUpperCase() ? 'bold' : 'normal',
      isBold: text === text.toUpperCase() || text.includes('**'),
      isItalic: text.includes('*') || text.includes('_'),
      color: this.detectTextColor(text)
    };
  }

  private estimateFontSize(text: string): number {
    if (text.length < 50 && text === text.toUpperCase()) return 24; // Heading
    if (text.length < 100) return 18; // Subheading
    return 12; // Body text
  }

  private detectTextColor(text: string): string {
    // Simple color detection based on content
    if (text.toLowerCase().includes('importante') || 
        text.toLowerCase().includes('atenção') ||
        text.toLowerCase().includes('cuidado')) {
      return '#ff0000'; // Red for warnings
    }
    return '#000000'; // Default black
  }

  private async extractImagesFromPage(pdfPath: string, pageNumber: number): Promise<string[]> {
    const outputDir = path.join(this.tempDir, `page_${pageNumber}_images_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    try {
      // Extract images from specific page
      const command = `pdfimages -p -f ${pageNumber} -l ${pageNumber} -png "${pdfPath}" "${path.join(outputDir, 'image')}"`;
      await execAsync(command);

      // Read extracted images
      const files = await fs.readdir(outputDir);
      const images = await Promise.all(
        files
          .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
          .map(async file => {
            const imagePath = path.join(outputDir, file);
            const imageBuffer = await fs.readFile(imagePath);
            return `data:image/png;base64,${imageBuffer.toString('base64')}`;
          })
      );

      // Clean up
      await this.cleanupDirectory(outputDir);

      return images;
    } catch (error) {
      console.warn(`Failed to extract images from page ${pageNumber}:`, error);
      return [];
    }
  }

  private generateSummary(pages: PDFPage[]): string {
    const allText = pages.map(page => page.text).join('\n');
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Extract first few meaningful sentences as summary
    const summarySentences = sentences.slice(0, 3).map(s => s.trim());
    
    return summarySentences.join('. ') + '.';
  }

  private extractKeyTopics(pages: PDFPage[]): string[] {
    const allText = pages.map(page => page.text).join('\n');
    const words = allText.toLowerCase().split(/\s+/);
    
    // Simple keyword extraction (in production, use more sophisticated NLP)
    const wordFrequency: { [key: string]: number } = {};
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-zà-ú]/g, '');
      if (cleanWord.length > 4 && !this.isStopWord(cleanWord)) {
        wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
      }
    });

    // Get top keywords
    const sortedKeywords = Object.entries(wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return sortedKeywords.slice(0, 5); // Top 5 topics
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'para', 'com', 'por', 'sem', 'sob', 'sobre', 'debaixo', 'através',
      'contra', 'desde', 'até', 'entre', 'durante', 'após', 'antes',
      'este', 'esta', 'isto', 'esse', 'essa', 'isso', 'aquele', 'aquela',
      'aqui', 'ali', 'lá', 'cá', 'acolá', 'onde', 'quando', 'como',
      'porque', 'porquê', 'porque', 'que', 'qual', 'quais', 'quem',
      'cujo', 'cuja', 'cujos', 'cujas', 'quanto', 'quanta', 'quantos',
      'quantas'
    ];
    
    return stopWords.includes(word);
  }

  private estimateDuration(pages: PDFPage[]): number {
    const totalWords = pages.reduce((count, page) => {
      return count + page.text.split(/\s+/).length;
    }, 0);

    // Estimate: ~150 words per minute for narration + 5 seconds per slide
    const narrationTime = (totalWords / 150) * 60;
    const slideTime = pages.length * 5;
    
    return Math.ceil(narrationTime + slideTime);
  }

  private assessComplexity(pages: PDFPage[]): 'simple' | 'medium' | 'complex' {
    const totalElements = pages.reduce((count, page) => {
      return count + page.layout.elements.length;
    }, 0);

    const avgElementsPerPage = totalElements / pages.length;
    const imageCount = pages.reduce((count, page) => count + page.images.length, 0);

    if (avgElementsPerPage < 10 && imageCount < 5) return 'simple';
    if (avgElementsPerPage < 25 && imageCount < 15) return 'medium';
    return 'complex';
  }

  private async cleanupDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      await Promise.all(files.map(file => fs.unlink(path.join(dirPath, file))));
      await fs.rmdir(dirPath);
    } catch (error) {
      console.warn(`Failed to cleanup directory ${dirPath}:`, error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(files.map(file => 
        fs.unlink(path.join(this.tempDir, file)).catch(() => {})
      ));
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error);
    }
  }
}