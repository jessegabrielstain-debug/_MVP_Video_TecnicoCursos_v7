import { z } from 'zod';
import { PPTXParser } from '@/lib/pptx/pptx-parser';
import { Slide, ProcessingOptions, ProgressCallback } from '@/lib/definitions';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

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

    progressCallback?.({
      stage: 'processing-slides',
      progress: 75,
      currentStep: 'Mapeando conteúdo dos slides',
      totalSlides: parsedData.slides.length,
    });

    // 3. Mapeamento e enriquecimento dos dados
    const defaultDuration = options.defaultDuration ?? 5;
    const defaultTransition = options.transition ?? { type: 'fade', duration: 0.5 };

    const slides: Slide[] = parsedData.slides.map((slide, index) => ({
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
      createdAt: new Date(), // Mock
    };

    // 4. Geração de thumbnails (simulada)
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

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const validStructure = await PPTXParser.validatePPTX(buffer);
    if (!validStructure) {
      return { valid: false, error: 'Formato de arquivo inválido. Estrutura interna não reconhecida.' };
    }
    return { valid: true };
  } catch (error) {
    console.error("Error validating file:", error);
    return { valid: false, error: 'Formato de arquivo inválido ou corrompido.' };
  }
}


