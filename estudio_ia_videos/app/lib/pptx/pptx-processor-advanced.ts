/**
 * PPTX Processor Advanced
 *
 * Integração futura dos parsers avançados:
 * - image-parser.ts: Extração de imagens do PPTX
 * - animation-parser.ts: Detecção de animações
 * - layout-parser.ts: Análise de layouts complexos
 * - notes-parser.ts: Extração de notas do apresentador
 *
 * TODO: Implementar quando necessário para features avançadas
 */

import JSZip from 'jszip';
import { Slide } from '@/lib/definitions';
import { logger } from '@/lib/logger';

export interface AdvancedPPTXOptions {
  extractImages?: boolean;
  extractAnimations?: boolean;
  extractLayouts?: boolean;
  generateThumbnails?: boolean;
}

/** Imagem com posicionamento avançado */
export interface RichImage {
  url: string;
  width: number;
  height: number;
  position: { x: number; y: number };
}

/** Animação avançada com delay */
export interface AdvancedAnimation {
  type: string;
  duration: number;
  delay: number;
}

/** Layout com placeholders */
export interface AdvancedLayout {
  type: string;
  placeholders: string[];
}

/** Slide com dados avançados - usa tipos do Slide base como opcionais */
export interface AdvancedSlideData extends Omit<Slide, 'layout'> {
  /** Imagens com metadados de posicionamento */
  richImages?: RichImage[];
  /** Animações avançadas (sobrescreve base) */
  advancedAnimations?: AdvancedAnimation[];
  /** Layout avançado com placeholders */
  advancedLayout?: AdvancedLayout;
  /** Layout simples (do tipo original) */
  layout?: string;
}

/**
 * Processa PPTX com features avançadas
 * @param buffer - Buffer do arquivo PPTX
 * @param options - Opções de processamento
 * @param projectId - ID do projeto para upload de assets
 */
export async function processAdvancedPPTX(
  buffer: Buffer,
  options: AdvancedPPTXOptions = {},
  projectId?: string
): Promise<AdvancedSlideData[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slides: AdvancedSlideData[] = [];

  try {
    // 1. Parsear estrutura básica do PPTX
    const { PPTXParser } = await import('./pptx-parser');
    const parser = new PPTXParser();
    const parsedData = await parser.parsePPTX(buffer);
    
    const baseSlides = parsedData.slides || [];
    
    // 2. Processar cada slide com features avançadas
    for (let i = 0; i < baseSlides.length; i++) {
      const slideNumber = i + 1;
      const baseSlide = baseSlides[i];
      
      const advancedSlide: AdvancedSlideData = {
        ...baseSlide,
      };

      // 3. Extrair imagens avançadas se solicitado
      if (options.extractImages !== false) {
        try {
          const { PPTXImageParser } = await import('./parsers/image-parser');
          const imageParser = new PPTXImageParser();
          const slideImages = await imageParser.extractImages(zip, slideNumber);
          
          if (slideImages.length > 0) {
            advancedSlide.richImages = slideImages.map(img => ({
              url: img.url || '',
              width: img.width || 0,
              height: img.height || 0,
              position: img.position || { x: 0, y: 0 },
            }));
          }
        } catch (imageError) {
          logger.warn(`Erro ao extrair imagens do slide ${slideNumber}`, { 
            component: 'PptxProcessorAdvanced',
            error: imageError 
          });
        }
      }

      // 4. Extrair animações se solicitado
      if (options.extractAnimations !== false) {
        try {
          const { PPTXAnimationParser } = await import('./parsers/animation-parser');
          const animationParser = new PPTXAnimationParser();
          const animationResult = await animationParser.extractAnimations(zip, slideNumber);
          
          if (animationResult.success && animationResult.animations) {
            advancedSlide.advancedAnimations = animationResult.animations.map(anim => ({
              type: anim.effectName,
              duration: anim.duration || 500,
              delay: anim.delay || 0,
            }));
          }
        } catch (animationError) {
          logger.warn(`Erro ao extrair animações do slide ${slideNumber}`, { 
            component: 'PptxProcessorAdvanced',
            error: animationError 
          });
        }
      }

      // 5. Gerar thumbnail se solicitado
      if (options.generateThumbnails) {
        try {
          const slidePath = `ppt/slides/slide${slideNumber}.xml`;
          const slideFile = zip.file(slidePath);
          
          if (slideFile) {
            const slideContent = await slideFile.async('string');
            const thumbnailUrl = await generateSlideThumbnail(slideContent, 320, 180);
            // Adicionar thumbnailUrl ao slide se necessário
            if (thumbnailUrl && !thumbnailUrl.includes('placeholder')) {
              advancedSlide.thumbnailUrl = thumbnailUrl;
            }
          }
        } catch (thumbnailError) {
          logger.warn(`Erro ao gerar thumbnail do slide ${slideNumber}`, { 
            component: 'PptxProcessorAdvanced',
            error: thumbnailError 
          });
        }
      }

      slides.push(advancedSlide);
    }

    logger.info(`✅ PPTX avançado processado: ${slides.length} slides`, { 
      component: 'PptxProcessorAdvanced',
      slideCount: slides.length 
    });

    return slides;
  } catch (error) {
    logger.error('Erro ao processar PPTX avançado', error instanceof Error ? error : new Error(String(error)), { 
      component: 'PptxProcessorAdvanced' 
    });
    return slides; // Retornar slides processados até o erro
  }
}

/**
 * Extrai imagens de um slide específico
 * @param zip - Instância do JSZip com o PPTX carregado
 * @param slideNumber - Número do slide (1-indexed)
 */
export async function extractSlideImages(
  zip: JSZip,
  slideNumber: number
): Promise<string[]> {
  try {
    const { PPTXImageParser } = await import('./parsers/image-parser');
    const imageParser = new PPTXImageParser();
    const images = await imageParser.extractImages(zip, slideNumber);
    
    return images.map(img => img.url || '');
  } catch (error) {
    logger.error(`Erro ao extrair imagens do slide ${slideNumber}`, error instanceof Error ? error : new Error(String(error)), { 
      component: 'PptxProcessorAdvanced' 
    });
    return [];
  }
}

/**
 * Gera thumbnail de um slide
 * @param slideContent - Conteúdo XML do slide
 * @param width - Largura do thumbnail
 * @param height - Altura do thumbnail
 * @param projectId - ID do projeto para salvar thumbnail
 */
export async function generateSlideThumbnail(
  slideContent: string,
  width: number = 320,
  height: number = 180,
  projectId?: string
): Promise<string> {
  try {
    // Tentar usar sharp para gerar thumbnail a partir do conteúdo do slide
    // Como não podemos renderizar diretamente o XML do slide sem um renderer,
    // vamos tentar extrair a primeira imagem do slide e usar como base
    
    // Por enquanto, retornar placeholder se não houver projetoId para upload
    if (!projectId) {
      logger.warn('generateSlideThumbnail: projectId não fornecido, retornando placeholder', { 
        component: 'PptxProcessorAdvanced' 
      });
      return `/api/placeholder/${width}x${height}`;
    }

    // Tentar usar sharp se disponível
    try {
      const sharp = require('sharp') as typeof import('sharp');
      
      // Criar uma imagem em branco como placeholder temporário
      // Em produção, isso deveria renderizar o slide real usando canvas ou puppeteer
      const placeholderBuffer = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 240, g: 240, b: 240, alpha: 1 }
        }
      })
      .png()
      .toBuffer();

      // Upload para Supabase Storage
      const { getBrowserClient } = await import('../../supabase/browser');
      const supabase = getBrowserClient();
      
      const fileName = `thumbnails/slide-${Date.now()}.png`;
      const filePath = `${projectId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, placeholderBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      logger.info(`✅ Thumbnail gerado e salvo`, { 
        component: 'PptxProcessorAdvanced',
        url: urlData.publicUrl 
      });

      return urlData.publicUrl;
    } catch (sharpError) {
      logger.warn('Sharp não disponível, usando placeholder', { 
        component: 'PptxProcessorAdvanced',
        error: sharpError 
      });
      return `/api/placeholder/${width}x${height}`;
    }
  } catch (error) {
    logger.error('Erro ao gerar thumbnail', error instanceof Error ? error : new Error(String(error)), { 
      component: 'PptxProcessorAdvanced' 
    });
    return `/api/placeholder/${width}x${height}`;
  }
}
