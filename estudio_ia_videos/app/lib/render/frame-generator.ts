/**
 * 🎨 Frame Generator - IMPLEMENTAÇÃO REAL
 * Geração de frames a partir de slides usando Remotion + Canvas
 */

import { renderMedia, selectComposition, renderStill } from '@remotion/renderer';
import { promises as fs } from 'fs';
import path from 'path';
import { createCanvas, loadImage, Image, CanvasRenderingContext2D } from 'canvas';
import { logger } from '@/lib/logger';

export interface SlideFrame {
  slideNumber: number;
  frameIndex: number;
  duration: number; // segundos
  text?: {
    content: string;
    formatting?: {
      bold?: boolean;
      italic?: boolean;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      alignment?: 'left' | 'center' | 'right';
    };
    position?: { x: number; y: number; width: number; height: number };
  }[];
  images?: {
    url: string;
    position?: { x: number; y: number; width: number; height: number };
  }[];
  background?: string;
  transition?: {
    type: 'fade' | 'push' | 'wipe' | 'zoom' | 'none';
    duration: number;
  };
}

export interface FrameGenerationOptions {
  width?: number;
  height?: number;
  fps?: number;
  quality?: number; // 0-100
  format?: 'png' | 'jpeg';
  backgroundColor?: string;
  tempDir?: string;
}

export interface FrameGenerationResult {
  success: boolean;
  totalFrames: number;
  framesDir: string;
  duration: number; // segundos totais
  errors: string[];
}

export interface PPTXSlideData {
  estimatedDuration: number;
  images?: Array<{
    id: string;
    url: string;
    position?: { x: number; y: number; width: number; height: number };
  }>;
  textBoxes?: Array<{
    text: string;
    position: { x: number; y: number; width: number; height: number };
    formatting?: {
      fontSize?: number;
      fontFamily?: string;
      bold?: boolean;
      italic?: boolean;
      color?: string;
      alignment?: 'left' | 'center' | 'right';
    };
  }>;
  background?: string;
  transition?: { type: string; duration: number };
}

export class FrameGenerator {
  private width: number;
  private height: number;
  private fps: number;
  private format: 'png' | 'jpeg';
  private quality: number;
  private backgroundColor: string;

  constructor(options: FrameGenerationOptions = {}) {
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.fps = options.fps || 30;
    this.format = options.format || 'png';
    this.quality = options.quality || 90;
    this.backgroundColor = options.backgroundColor || '#FFFFFF';
  }

  /**
   * Gera frames a partir de slides
   */
  async generateFrames(
    slides: SlideFrame[],
    outputDir: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<FrameGenerationResult> {
    const errors: string[] = [];
    let frameIndex = 0;
    const startTime = Date.now();

    try {
      // Criar diretório de output
      await fs.mkdir(outputDir, { recursive: true });

      // Calcular total de frames
      const totalFrames = slides.reduce((acc, slide) => {
        return acc + Math.ceil(slide.duration * this.fps);
      }, 0);

      logger.info(`🎨 Gerando ${totalFrames} frames para ${slides.length} slides...`, { component: 'FrameGenerator' });

      // Gerar frames para cada slide
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideFrames = Math.ceil(slide.duration * this.fps);

        logger.info(`📄 Processando slide ${i + 1}/${slides.length} (${slideFrames} frames)`, { component: 'FrameGenerator' });

        try {
          // Gerar frames do slide
          for (let f = 0; f < slideFrames; f++) {
            const canvas = createCanvas(this.width, this.height);
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = slide.background || this.backgroundColor;
            ctx.fillRect(0, 0, this.width, this.height);

            // Renderizar imagens
            if (slide.images && slide.images.length > 0) {
              await this.renderImages(ctx, slide.images);
            }

            // Renderizar texto
            if (slide.text && slide.text.length > 0) {
              this.renderText(ctx, slide.text);
            }

            // Aplicar transição (se for primeiro ou último frame do slide)
            if (slide.transition && slide.transition.type !== 'none') {
              const isTransition = f < (slide.transition.duration * this.fps) || 
                                    f > (slideFrames - (slide.transition.duration * this.fps));
              if (isTransition) {
                await this.applyTransition(ctx, slide.transition, f, slideFrames);
              }
            }

            // Salvar frame
            const framePath = path.join(outputDir, `frame_${String(frameIndex).padStart(6, '0')}.${this.format}`);
            await this.saveFrame(canvas, framePath);

            frameIndex++;

            if (onProgress && frameIndex % 10 === 0) {
              onProgress(frameIndex, totalFrames);
            }
          }
        } catch (error) {
          const errorMsg = `Erro ao processar slide ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          logger.error('❌', new Error(errorMsg), { component: 'FrameGenerator' });
          errors.push(errorMsg);
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      const totalDuration = slides.reduce((acc, s) => acc + s.duration, 0);

      logger.info(`✅ Frames gerados: ${frameIndex} frames em ${duration.toFixed(2)}s`, { component: 'FrameGenerator' });

      return {
        success: errors.length === 0,
        totalFrames: frameIndex,
        framesDir: outputDir,
        duration: totalDuration,
        errors,
      };

    } catch (error) {
      logger.error('❌ Erro ao gerar frames:', error instanceof Error ? error : new Error(String(error)), { component: 'FrameGenerator' });
      return {
        success: false,
        totalFrames: frameIndex,
        framesDir: outputDir,
        duration: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
      };
    }
  }

  /**
   * Renderiza imagens no canvas
   */
  private async renderImages(
    ctx: CanvasRenderingContext2D,
    images: SlideFrame['images']
  ): Promise<void> {
    if (!images) return;

    for (const img of images) {
      try {
        const image = await loadImage(img.url);
        
        if (img.position) {
          // Posição especificada
          const { x, y, width, height } = img.position;
          const scaleX = (width / 100) * this.width;
          const scaleY = (height / 100) * this.height;
          const posX = (x / 100) * this.width;
          const posY = (y / 100) * this.height;
          
          ctx.drawImage(image, posX, posY, scaleX, scaleY);
        } else {
          // Centralizar imagem
          const scale = Math.min(
            this.width / image.width,
            this.height / image.height
          ) * 0.8; // 80% do slide
          
          const scaledWidth = image.width * scale;
          const scaledHeight = image.height * scale;
          const x = (this.width - scaledWidth) / 2;
          const y = (this.height - scaledHeight) / 2;
          
          ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
        }
      } catch (error) {
        logger.error(`Erro ao carregar imagem: ${img.url}`, error instanceof Error ? error : new Error(String(error)), { component: 'FrameGenerator' });
      }
    }
  }

  /**
   * Renderiza texto no canvas
   */
  private renderText(
    ctx: CanvasRenderingContext2D,
    textElements: SlideFrame['text']
  ): void {
    if (!textElements) return;

    for (const element of textElements) {
      const format = element.formatting || {};
      
      // Font
      const fontSize = format.fontSize || 48;
      const fontFamily = format.fontFamily || 'Arial';
      const fontWeight = format.bold ? 'bold' : 'normal';
      const fontStyle = format.italic ? 'italic' : 'normal';
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

      // Color
      ctx.fillStyle = format.color || '#000000';

      // Position
      let x = 100; // padding padrão
      let y = 100;
      
      if (element.position) {
        x = (element.position.x / 100) * this.width;
        y = (element.position.y / 100) * this.height;
      }

      // Alignment
      const alignment = format.alignment || 'left';
      ctx.textAlign = alignment;
      
      if (alignment === 'center') {
        x = this.width / 2;
      } else if (alignment === 'right') {
        x = this.width - 100;
      }

      // Quebrar texto em linhas se necessário
      const maxWidth = element.position?.width 
        ? (element.position.width / 100) * this.width 
        : this.width - 200;

      const lines = this.wrapText(ctx, element.content, maxWidth);
      
      // Renderizar cada linha
      lines.forEach((line, index) => {
        const lineY = y + (index * fontSize * 1.2);
        ctx.fillText(line, x, lineY);
      });
    }
  }

  /**
   * Quebra texto em linhas
   */
  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Aplica transição ao frame
   */
  private async applyTransition(
    ctx: CanvasRenderingContext2D,
    transition: NonNullable<SlideFrame['transition']>,
    currentFrame: number,
    totalFrames: number
  ): Promise<void> {
    const transitionFrames = transition.duration * this.fps;
    const isStart = currentFrame < transitionFrames;
    const progress = isStart 
      ? currentFrame / transitionFrames
      : 1 - ((currentFrame - (totalFrames - transitionFrames)) / transitionFrames);

    switch (transition.type) {
      case 'fade':
        ctx.globalAlpha = progress;
        break;
      
      case 'zoom':
        const scale = 0.8 + (progress * 0.2);
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-this.width / 2, -this.height / 2);
        break;
      
      // Outras transições podem ser adicionadas aqui
    }
  }

  /**
   * Salva frame no disco
   */
  private async saveFrame(
    canvas: ReturnType<typeof createCanvas>,
    framePath: string
  ): Promise<void> {
    const buffer = this.format === 'png'
      ? canvas.toBuffer('image/png')
      : canvas.toBuffer('image/jpeg', { quality: this.quality / 100 });

    await fs.writeFile(framePath, buffer);
  }

  /**
   * Converte slides PPTX para formato de frames
   */
  static convertPPTXSlidesToFrames(
    slides: PPTXSlideData[], // Array de slides parseados do PPTX
    defaultDuration: number = 5
  ): SlideFrame[] {
    return slides.map((slide, index) => ({
      slideNumber: index + 1,
      frameIndex: 0,
      duration: slide.estimatedDuration || defaultDuration,
      text: slide.textBoxes?.map((tb) => ({
        content: tb.text,
        formatting: {
          bold: tb.formatting?.bold,
          italic: tb.formatting?.italic,
          fontSize: tb.formatting?.fontSize,
          fontFamily: tb.formatting?.fontFamily,
          color: tb.formatting?.color,
          alignment: tb.formatting?.alignment,
        },
        position: tb.position,
      })),
      images: slide.images?.map((img) => ({
        url: img.url,
        position: img.position,
      })),
      background: slide.background,
      transition: (slide.transition && ['fade', 'push', 'wipe', 'zoom', 'none'].includes(slide.transition.type)) 
        ? { type: slide.transition.type as 'fade' | 'push' | 'wipe' | 'zoom' | 'none', duration: slide.transition.duration }
        : { type: 'fade', duration: 0.5 },
    }));
  }
}

/**
 * NOVA IMPLEMENTAÇÃO REAL - Integração com PPTX Parser
 */
export async function generateFramesFromSlides(
  slides: PPTXSlideData[],
  outputDir: string,
  options: {
    resolution: { width: number; height: number };
    fps: number;
    transitionsEnabled: boolean;
    onProgress?: (progress: number) => void;
  }
): Promise<number> {
  logger.info(`Generating frames for ${slides.length} slides`, { component: 'FrameGenerator' });
  
  await fs.mkdir(outputDir, { recursive: true });

  let totalFrames = 0;
  let currentFrame = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideFrames = Math.ceil(slide.estimatedDuration * options.fps);
    
    logger.info(`Generating ${slideFrames} frames for slide ${i + 1}`, { component: 'FrameGenerator' });

    // Gera frames para o slide usando Canvas
    const framesGenerated = await generateSlideFramesWithCanvas(
      slide,
      outputDir,
      currentFrame,
      slideFrames,
      options
    );

    currentFrame += framesGenerated;
    totalFrames += framesGenerated;

    // Progress callback
    if (options.onProgress) {
      const progress = ((i + 1) / slides.length) * 100;
      options.onProgress(progress);
    }
  }

  logger.info(`Generated ${totalFrames} total frames`, { component: 'FrameGenerator' });
  return totalFrames;
}

/**
 * Gera frames para um slide usando Canvas (mais rápido que Remotion)
 */
async function generateSlideFramesWithCanvas(
  slide: PPTXSlideData,
  outputDir: string,
  startFrame: number,
  frameCount: number,
  options: {
    resolution: { width: number; height: number };
    fps: number;
    transitionsEnabled: boolean;
    onProgress?: (progress: number) => void;
  }
): Promise<number> {
  const canvas = createCanvas(options.resolution.width, options.resolution.height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Carrega imagens se houver
  const loadedImages: { [key: string]: Image } = {};
  if (slide.images?.length) {
    for (const img of slide.images) {
      try {
        if (img.url && img.url.startsWith('http')) {
          loadedImages[img.id] = await loadImage(img.url);
        }
      } catch (error) {
        logger.warn(`Failed to load image: ${img.url}`, { component: 'FrameGenerator', error: String(error) });
      }
    }
  }

  // Gera cada frame
  for (let frame = 0; frame < frameCount; frame++) {
    // Limpa canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderiza imagens
    if (slide.images?.length) {
      for (const img of slide.images) {
        const loadedImg = loadedImages[img.id];
        if (loadedImg && img.position) {
          ctx.drawImage(
            loadedImg,
            img.position.x,
            img.position.y,
            img.position.width || loadedImg.width,
            img.position.height || loadedImg.height
          );
        }
      }
    }

    // Renderiza texto
    if (slide.textBoxes?.length) {
      for (const textBox of slide.textBoxes) {
        if (textBox.text && textBox.position) {
          // Configurar fonte
          const fontSize = textBox.formatting?.fontSize || 24;
          const fontFamily = textBox.formatting?.fontFamily || 'Arial';
          const fontWeight = textBox.formatting?.bold ? 'bold' : 'normal';
          const fontStyle = textBox.formatting?.italic ? 'italic' : 'normal';
          
          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
          ctx.fillStyle = textBox.formatting?.color || '#000000';
          ctx.textAlign = textBox.formatting?.alignment || 'left';

          // Quebra de linha simples
          const words = textBox.text.split(' ');
          const maxWidth = textBox.position.width || 400;
          let line = '';
          let y = textBox.position.y + fontSize;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
              ctx.fillText(line, textBox.position.x, y);
              line = words[n] + ' ';
              y += fontSize * 1.2;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, textBox.position.x, y);
        }
      }
    }

    // Salva frame
    const outputPath = path.join(outputDir, `frame_${String(startFrame + frame).padStart(6, '0')}.png`);
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
  }

  return frameCount;
}

export default FrameGenerator;
