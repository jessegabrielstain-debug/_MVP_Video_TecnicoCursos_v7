import { logger } from '@/lib/logger';
import { z } from 'zod';
import { PPTXParser } from '@/lib/pptx/pptx-parser';
import { PPTXImageParser } from '@/lib/pptx/parsers/image-parser';
import { PPTXNotesParser } from '@/lib/pptx/parsers/notes-parser';
import { PPTXTextParser } from '@/lib/pptx/parsers/text-parser';
import { Slide, ProcessingOptions, ProgressCallback } from '@/lib/definitions';
import JSZip from 'jszip';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_SLIDE_COUNT = 200; // Limit slides to prevent DOS
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Categorias de erros para melhor diagnóstico
 */
export enum PPTXErrorCategory {
  VALIDATION = 'validation',
  PARSING = 'parsing',
  EXTRACTION = 'extraction',
  STORAGE = 'storage',
  TIMEOUT = 'timeout',
  MEMORY = 'memory',
  UNKNOWN = 'unknown'
}

/**
 * Classe de erro customizada para processamento PPTX
 */
export class PPTXProcessingError extends Error {
  constructor(
    message: string,
    public category: PPTXErrorCategory,
    public details?: Record<string, unknown>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PPTXProcessingError';
  }
}

// Esquema para um único slide, alinhado com o que o parser retorna
const SlideSchema = z.object({
  id: z.string(),
  slideNumber: z.number().int().positive(),
  title: z.string(),
  content: z.string(),
  notes: z.string().optional(),
  duration: z.number().positive(),
  transition: z.object({
    type: z.string(),
    duration: z.number(),
  }),
  images: z.array(z.string()).optional(),
});

// Esquema para os metadados, alinhado com o parser e dados adicionais
const MetadataSchema = z.object({
  title: z.string(),
  author: z.string(),
  slideCount: z.number().int().nonnegative(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  createdAt: z.date(),
});

// Esquema para o resultado final do processamento
const ProcessingResultSchema = z.object({
  success: z.boolean(),
  projectId: z.string(),
  metadata: MetadataSchema.optional(),
  slides: z.array(SlideSchema).optional(),
  thumbnails: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;

/**
 * Executa uma operação com retry automático em caso de falha
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Verificar se erro é retryable
      if (error instanceof PPTXProcessingError && !error.retryable) {
        throw error;
      }
      
      // Última tentativa - lançar erro
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Aguardar com backoff exponencial
      const delay = delayMs * Math.pow(2, attempt - 1);
      logger.warn(`Tentativa ${attempt} falhou. Retry em ${delay}ms...`, { component: 'PptxProcessor' });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Operação falhou após múltiplas tentativas');
}

/**
 * Categoriza um erro para melhor tratamento
 */
function categorizeError(error: unknown): PPTXErrorCategory {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return PPTXErrorCategory.TIMEOUT;
  }
  if (message.includes('memory') || message.includes('heap')) {
    return PPTXErrorCategory.MEMORY;
  }
  if (message.includes('invalid') || message.includes('corrupt')) {
    return PPTXErrorCategory.VALIDATION;
  }
  if (message.includes('parse') || message.includes('xml')) {
    return PPTXErrorCategory.PARSING;
  }
  if (message.includes('extract') || message.includes('read')) {
    return PPTXErrorCategory.EXTRACTION;
  }
  if (message.includes('upload') || message.includes('storage')) {
    return PPTXErrorCategory.STORAGE;
  }
  
  return PPTXErrorCategory.UNKNOWN;
}

/**
 * Enriquece slides com dados avançados dos parsers especializados
 */
async function enrichSlidesWithAdvancedData(
  zip: JSZip,
  slides: Partial<Slide>[],
  options: ProcessingOptions
): Promise<Partial<Slide>[]> {
  if (!options.extractImages && !options.extractNotes && !options.extractFormatting) {
    return slides;
  }

  const enrichedSlides = [...slides];

  try {
    // Preparar tarefas de extração paralela
    const extractionTasks: Promise<void>[] = [];

    // Extrair imagens se solicitado
    if (options.extractImages) {
      const imageParser = new PPTXImageParser();
      const imageTask = (async () => {
        const results = await Promise.allSettled(
          enrichedSlides.map((_, i) => {
            const slideNumber = i + 1;
            return retryOperation(() => imageParser.extractImages(zip, slideNumber));
          })
        );
        results.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value.length > 0) {
            enrichedSlides[i].images = result.value
              .map(img => img.url)
              .filter((url): url is string => !!url);
          }
        });
      })();
      extractionTasks.push(imageTask);
    }

    // Extrair notas se solicitado
    if (options.extractNotes) {
      const notesParser = new PPTXNotesParser();
      const notesTask = (async () => {
        const results = await Promise.allSettled(
          enrichedSlides.map((_, i) => {
            const slideNumber = i + 1;
            return retryOperation(() => notesParser.extractNotes(zip, slideNumber));
          })
        );
        results.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value) {
            enrichedSlides[i].notes = result.value.notes || '';
          }
        });
      })();
      extractionTasks.push(notesTask);
    }

    // Extrair formatação avançada se solicitado
    if (options.extractFormatting) {
      const textParser = new PPTXTextParser();
      const formatTask = (async () => {
        const results = await Promise.allSettled(
          enrichedSlides.map((_, i) => {
            const slideNumber = i + 1;
            return retryOperation(() => textParser.extractTextFromSlide(zip, slideNumber));
          })
        );
        results.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value.success && result.value.textBoxes) {
            const formattedContent = result.value.textBoxes
              .map(tb => `[${tb.id}] ${tb.text}`)
              .join('\n\n');
            if (formattedContent) {
              enrichedSlides[i].content = formattedContent;
            }
          }
        });
      })();
      extractionTasks.push(formatTask);
    }

    // Executar todas as tarefas em paralelo
    await Promise.allSettled(extractionTasks);
  } catch (error) {
    const category = categorizeError(error);
    logger.warn(`Erro [${category}] ao enriquecer slides`, { component: 'PptxProcessor', error: error instanceof Error ? error : new Error(String(error)) });
    // Continuar com slides básicos em caso de erro
  }

  return enrichedSlides;
}

export const processPPTXFile = async (
  file: File,
  projectId: string,
  options: ProcessingOptions = {},
  progressCallback?: ProgressCallback
): Promise<ProcessingResult> => {
  try {
    // 1. Validação inicial do arquivo
    const validation = await validatePPTXFile(file);
    if (!validation.valid) {
      return {
        success: false,
        projectId,
        error: validation.error,
        slides: [],
        thumbnails: [],
      };
    }

    progressCallback?.({ stage: 'initializing', progress: 0, currentStep: 'Validando arquivo PPTX' });
    progressCallback?.({ stage: 'parsing', progress: 25, currentStep: 'Carregando e parseando arquivo' });

    // 2. Parse do arquivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parser = new PPTXParser();
    const parsedData = await parser.parsePPTX(buffer);
    
    // 2.5. Carregar ZIP para parsers avançados
    const zip = await JSZip.loadAsync(buffer);

    progressCallback?.({
      stage: 'processing-slides',
      progress: 50,
      currentStep: 'Mapeando conteúdo dos slides',
      totalSlides: parsedData.slides.length,
    });

    // 3. Enriquecer slides com parsers avançados (se solicitado)
    let enrichedSlides = parsedData.slides;
    if (options.extractImages || options.extractNotes || options.extractFormatting) {
      progressCallback?.({
        stage: 'processing-slides',
        progress: 60,
        currentStep: 'Extraindo dados avançados (imagens, notas, formatação)',
      });
      enrichedSlides = await enrichSlidesWithAdvancedData(zip, parsedData.slides, options);
    }

    progressCallback?.({
      stage: 'processing-slides',
      progress: 75,
      currentStep: 'Finalizando processamento de slides',
      totalSlides: enrichedSlides.length,
    });

    // 4. Mapeamento e normalização dos dados
    const defaultDuration = options.defaultDuration ?? 5;
    const defaultTransition = options.transition ?? { type: 'fade', duration: 0.5 };

    const slides: Slide[] = enrichedSlides.map((slide, index) => ({
      id: `slide-${index + 1}`,
      slideNumber: index + 1,
      title: slide.title || `Slide ${index + 1}`,
      content: slide.content || '',
      notes: slide.notes || '',
      duration: slide.duration ?? defaultDuration,
      transition: slide.transition ?? defaultTransition,
      images: slide.images,
    }));

    const metadata = {
      ...parsedData.metadata,
      fileName: file.name,
      fileSize: file.size,
      createdAt: file.lastModified ? new Date(file.lastModified) : new Date(),
    };

    // 4. Geração de thumbnails (simulada - TODO: implementar com canvas/sharp)
    // Para implementação real: usar image-parser.ts para extrair imagens do PPTX
    // e gerar previews usando canvas ou sharp library
    const thumbnails = slides.map((slide) => `/thumbnails/mock-thumb-${projectId}-${slide.id}.png`);

    progressCallback?.({ stage: 'finalizing', progress: 100, currentStep: 'Finalizando processamento' });

    // 5. Validação final com Zod e retorno
    const result: ProcessingResult = {
      success: true,
      projectId,
      metadata,
      slides,
      thumbnails,
    };
    
    // Usar safeParse para evitar que o Zod lance um erro que seria capturado pelo catch
    const finalValidation = ProcessingResultSchema.safeParse(result);
    if (!finalValidation.success) {
        return {
            success: false,
            projectId,
            error: `Erro de validação interna: ${finalValidation.error.message}`,
            slides: [],
            thumbnails: [],
        };
    }

    return finalValidation.data;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao processar o arquivo.';
    return {
      success: false,
      projectId,
      error: message,
      slides: [],
      thumbnails: [],
    };
  }
};

export async function validatePPTXFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!file || file.size === 0) {
    return { valid: false, error: 'Arquivo não encontrado ou vazio.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Arquivo muito grande (limite: ${MAX_FILE_SIZE / 1024 / 1024}MB).` };
  }

  // Check Magic Bytes for ZIP (PK..)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const header = new Uint8Array(arrayBuffer.slice(0, 4));
    const isZip = header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04;
    
    if (!isZip) {
      return { valid: false, error: 'Arquivo inválido. Assinatura ZIP não encontrada.' };
    }

    const buffer = Buffer.from(arrayBuffer);
    const validStructure = await PPTXParser.validatePPTX(buffer);
    if (!validStructure) {
      return { valid: false, error: 'Formato de arquivo inválido. Estrutura interna não reconhecida.' };
    }

    // Quick check for slide count using JSZip without full parsing
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files).filter(f => f.match(/ppt\/slides\/slide\d+\.xml/));
    
    if (slideFiles.length > MAX_SLIDE_COUNT) {
      return { valid: false, error: `Muitos slides (${slideFiles.length}). O limite é ${MAX_SLIDE_COUNT}.` };
    }

    return { valid: true };
  } catch (error) {
    logger.error("Error validating file", error instanceof Error ? error : new Error(String(error)), { component: 'PptxProcessor' });
    return { valid: false, error: 'Formato de arquivo inválido ou corrompido.' };
  }
}


