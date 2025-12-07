/**
 * Auto Narration Service
 * Geração automática de narração para slides PPTX
 */

import { generateAndUploadTTSAudio } from '@/lib/services/tts/elevenlabs-service';
import { logger } from '@/lib/services/logger-service';

export interface NarrationOptions {
  provider?: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  language?: string;
  emotion?: 'neutral' | 'professional' | 'enthusiastic';
  preferNotes?: boolean;
}

export interface NarrationResult {
  audioBuffer: Buffer;
  duration: number;
  transcript: string;
}

export interface SlideData {
  slideNumber: number;
  notes?: string;
  elements: unknown[];
}

export interface NarrationOutput {
  slideNumber: number;
  audioUrl: string;
  script: string;
  provider: string;
  voice: string;
  duration: number;
}

export interface BatchNarrationResult {
  success: boolean;
  narrations: NarrationOutput[];
  totalDuration: number;
  error?: string;
}

export class AutoNarrationService {
  async generateForSlide(slideText: string, options?: NarrationOptions): Promise<NarrationResult> {
    console.log('[AutoNarration] Generating narration for slide');
    
    // TODO: Implement single slide generation if needed
    return {
      audioBuffer: Buffer.from([]),
      duration: 0,
      transcript: slideText,
    };
  }
  
  async generateForPresentation(slides: string[], options?: NarrationOptions): Promise<NarrationResult[]> {
    console.log('[AutoNarration] Generating narration for presentation');
    return slides.map(text => ({
      audioBuffer: Buffer.from([]),
      duration: 0,
      transcript: text,
    }));
  }

  /**
   * Gera narrações para um conjunto de slides
   */
  async generateNarrations(
    slides: SlideData[],
    projectId: string,
    options: NarrationOptions
  ): Promise<BatchNarrationResult> {
    try {
      logger.info('AutoNarration', `Iniciando geração de narração para projeto ${projectId}`, { slideCount: slides.length });
      
      const narrations: NarrationOutput[] = [];
      let totalDuration = 0;

      for (const slide of slides) {
        // Determinar texto a ser narrado
        let textToNarrate = '';
        
        if (options.preferNotes && slide.notes && slide.notes.trim().length > 0) {
          textToNarrate = slide.notes;
        } else {
          // Extrair texto dos elementos do slide se não houver notas ou preferNotes for false
          // Simplificação: concatenar textos encontrados nos elementos
          const elements = slide.elements as Array<{ type: string; text?: string; content?: string }>;
          textToNarrate = elements
            .filter(el => (el.type === 'text' || el.type === 'shape') && (el.text || el.content))
            .map(el => el.text || el.content)
            .join('. ');
        }

        if (!textToNarrate || textToNarrate.trim().length === 0) {
          logger.warn('AutoNarration', `Slide ${slide.slideNumber} sem texto para narrar. Pulando.`);
          continue;
        }

        // Limitar tamanho do texto se necessário
        if (textToNarrate.length > 5000) {
          textToNarrate = textToNarrate.substring(0, 5000);
        }

        try {
          // Gerar áudio usando ElevenLabs (ou outro provider se implementado)
          // Por enquanto forçamos ElevenLabs se o provider for 'elevenlabs' ou default
          // Se for 'azure', poderíamos ter outro serviço, mas vamos usar ElevenLabs como fallback ou principal
          
          const fileName = `${projectId}/slide-${slide.slideNumber}-${Date.now()}.mp3`;
          
          // Usar voz padrão se não especificada
          const voiceId = options.voice || '21m00Tcm4TlvDq8ikWAM'; // Rachel
          
          const audioUrl = await generateAndUploadTTSAudio(
            textToNarrate,
            fileName,
            voiceId
          );

          // Estimativa de duração (se a API não retornar, podemos estimar pelo tamanho do texto ou obter metadados do arquivo)
          // Para precisão, precisaríamos ler o arquivo ou a API retornar a duração.
          // ElevenLabsService generateTTSAudio retorna Buffer, mas generateAndUploadTTSAudio retorna URL.
          // Vamos assumir uma estimativa baseada em palavras por minuto (avg 150 wpm)
          const wordCount = textToNarrate.split(/\s+/).length;
          const estimatedDuration = Math.ceil((wordCount / 150) * 60 * 1000); // ms

          narrations.push({
            slideNumber: slide.slideNumber,
            audioUrl,
            script: textToNarrate,
            provider: 'elevenlabs',
            voice: voiceId,
            duration: estimatedDuration
          });

          totalDuration += estimatedDuration;
          
          logger.info('AutoNarration', `Narração gerada para slide ${slide.slideNumber}`);

        } catch (err) {
          logger.error('AutoNarration', `Erro ao gerar narração para slide ${slide.slideNumber}`, err as Error);
          // Continuar para o próximo slide mesmo com erro
        }
      }

      return {
        success: true,
        narrations,
        totalDuration
      };

    } catch (error) {
      logger.error('AutoNarration', 'Erro fatal na geração de narrações', error as Error);
      return {
        success: false,
        narrations: [],
        totalDuration: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const autoNarrationService = new AutoNarrationService();

