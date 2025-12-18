/**
 * AI-Powered Scene Transitions
 * Sistema inteligente de transições entre cenas usando IA
 */

import { logger } from '@/lib/logger';

// ==============================================
// TIPOS
// ==============================================

export interface SceneAnalysis {
  sceneId: string;
  brightness: number; // 0-100
  contrast: number; // 0-100
  dominantColors: string[];
  motionIntensity: number; // 0-100
  audioEnergy: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative' | 'energetic' | 'calm';
  subjects: Array<{
    type: 'person' | 'object' | 'text' | 'landscape';
    confidence: number;
    position: { x: number; y: number };
  }>;
}

export interface TransitionRecommendation {
  type: string;
  duration: number; // milissegundos
  easing: string;
  confidence: number; // 0-1
  reason: string;
}

export interface TransitionTypes {
  // Transições suaves
  fade: { duration: number; type: 'in' | 'out' | 'cross' };
  dissolve: { duration: number };

  // Transições dinâmicas
  slide: { direction: 'left' | 'right' | 'up' | 'down'; duration: number };
  wipe: { direction: 'left' | 'right' | 'up' | 'down'; duration: number };
  zoom: { direction: 'in' | 'out'; duration: number; centerX: number; centerY: number };

  // Transições criativas
  morphing: { duration: number; intensity: number };
  glitch: { duration: number; intensity: number };
  blur: { duration: number; radius: number };

  // Transições cinematográficas
  whipPan: { duration: number; speed: number };
  filmBurn: { duration: number };
  lightLeak: { duration: number; intensity: number };
}

// ==============================================
// SCENE TRANSITIONS ENGINE
// ==============================================

export class SceneTransitionsEngine {
  /**
   * Analisa uma cena para extrair características visuais e de áudio
   */
  async analyzeScene(videoPath: string, startTime: number, duration: number): Promise<SceneAnalysis> {
    try {
      logger.info('Analyzing scene', {
        component: 'SceneTransitionsEngine',
        videoPath,
        startTime,
        duration
      });

      // Em produção, isso usaria:
      // - OpenCV para análise de vídeo
      // - TensorFlow/PyTorch para detecção de objetos
      // - Análise de áudio para energia
      // - Computer vision para cores dominantes

      // Por enquanto, retornar análise básica
      // TODO: Integrar com serviço de IA (AWS Rekognition, Azure Video Analyzer, ou Google Video Intelligence)
      
      const analysis: SceneAnalysis = {
        sceneId: `scene-${startTime}`,
        brightness: 70,
        contrast: 60,
        dominantColors: ['#4A90E2', '#F5F5F5', '#333333'],
        motionIntensity: 45,
        audioEnergy: 55,
        sentiment: 'neutral',
        subjects: [
          {
            type: 'person',
            confidence: 0.85,
            position: { x: 50, y: 50 }
          }
        ]
      };

      return analysis;
    } catch (error) {
      logger.error('Scene analysis error', error instanceof Error ? error : new Error(String(error)), {
        component: 'SceneTransitionsEngine'
      });
      throw error;
    }
  }

  /**
   * Recomenda a melhor transição entre duas cenas usando IA
   */
  recommendTransition(
    fromScene: SceneAnalysis,
    toScene: SceneAnalysis
  ): TransitionRecommendation {
    logger.debug('Recommending transition', {
      component: 'SceneTransitionsEngine',
      from: fromScene.sceneId,
      to: toScene.sceneId
    });

    // Diferença de brightness
    const brightnessDiff = Math.abs(fromScene.brightness - toScene.brightness);

    // Diferença de motion
    const motionDiff = Math.abs(fromScene.motionIntensity - toScene.motionIntensity);

    // Diferença de energia de áudio
    const energyDiff = Math.abs(fromScene.audioEnergy - toScene.audioEnergy);

    // Mudança de sentimento
    const sentimentChange = fromScene.sentiment !== toScene.sentiment;

    // Lógica de recomendação baseada em regras

    // 1. Grande diferença de brightness = fade
    if (brightnessDiff > 40) {
      return {
        type: 'fade',
        duration: 800,
        easing: 'ease-in-out',
        confidence: 0.9,
        reason: 'Large brightness difference'
      };
    }

    // 2. Alta energia + mudança = whip pan
    if (fromScene.audioEnergy > 70 && energyDiff > 30) {
      return {
        type: 'whipPan',
        duration: 400,
        easing: 'ease-out',
        confidence: 0.85,
        reason: 'High energy with significant change'
      };
    }

    // 3. Movimento alto para baixo = slow dissolve
    if (fromScene.motionIntensity > 60 && toScene.motionIntensity < 30) {
      return {
        type: 'dissolve',
        duration: 1200,
        easing: 'ease-out',
        confidence: 0.8,
        reason: 'Transition from high to low motion'
      };
    }

    // 4. Mudança de sentimento = morphing suave
    if (sentimentChange) {
      return {
        type: 'morphing',
        duration: 1000,
        easing: 'ease-in-out',
        confidence: 0.75,
        reason: 'Sentiment change detected'
      };
    }

    // 5. Cores similares = slide
    if (this.colorsAreSimilar(fromScene.dominantColors, toScene.dominantColors)) {
      return {
        type: 'slide',
        duration: 600,
        easing: 'ease-in-out',
        confidence: 0.7,
        reason: 'Similar color palette'
      };
    }

    // Default: fade cross
    return {
      type: 'fade',
      duration: 500,
      easing: 'ease-in-out',
      confidence: 0.6,
      reason: 'Default smooth transition'
    };
  }

  /**
   * Gera múltiplas opções de transição ordenadas por confiança
   */
  getTransitionOptions(
    fromScene: SceneAnalysis,
    toScene: SceneAnalysis,
    count: number = 3
  ): TransitionRecommendation[] {
    const options: TransitionRecommendation[] = [];

    // Sempre incluir a recomendação principal
    options.push(this.recommendTransition(fromScene, toScene));

    // Adicionar alternativas
    const alternatives: TransitionRecommendation[] = [
      {
        type: 'fade',
        duration: 500,
        easing: 'ease-in-out',
        confidence: 0.8,
        reason: 'Safe classic fade'
      },
      {
        type: 'dissolve',
        duration: 800,
        easing: 'linear',
        confidence: 0.7,
        reason: 'Smooth dissolve'
      },
      {
        type: 'slide',
        duration: 600,
        easing: 'ease-out',
        confidence: 0.65,
        reason: 'Dynamic slide'
      },
      {
        type: 'zoom',
        duration: 700,
        easing: 'ease-in',
        confidence: 0.6,
        reason: 'Attention-grabbing zoom'
      }
    ];

    // Adicionar alternativas até atingir count
    for (const alt of alternatives) {
      if (options.length >= count) break;
      if (!options.find(o => o.type === alt.type)) {
        options.push(alt);
      }
    }

    // Ordenar por confiança
    return options.sort((a, b) => b.confidence - a.confidence).slice(0, count);
  }

  /**
   * Aplica transição usando FFmpeg
   */
  async applyTransition(
    fromVideoPath: string,
    toVideoPath: string,
    transition: TransitionRecommendation,
    outputPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { spawn } = await import('child_process');
      const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

      // Converter duração para segundos
      const durationSec = transition.duration / 1000;

      // Construir filtro FFmpeg baseado no tipo de transição
      const filter = this.buildFFmpegTransitionFilter(transition, durationSec);

      const args = [
        '-i',
        fromVideoPath,
        '-i',
        toVideoPath,
        '-filter_complex',
        filter,
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-y',
        outputPath
      ];

      await this.runFFmpeg(ffmpegPath, args);

      logger.info('Transition applied successfully', {
        component: 'SceneTransitionsEngine',
        type: transition.type,
        duration: transition.duration
      });

      return { success: true };
    } catch (error) {
      logger.error('Transition application error', error instanceof Error ? error : new Error(String(error)), {
        component: 'SceneTransitionsEngine'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Constrói filtro FFmpeg para a transição
   */
  private buildFFmpegTransitionFilter(transition: TransitionRecommendation, duration: number): string {
    switch (transition.type) {
      case 'fade':
        return `[0:v][1:v]xfade=transition=fade:duration=${duration}:offset=0[v];[0:a][1:a]acrossfade=d=${duration}[a]`;

      case 'dissolve':
        return `[0:v][1:v]xfade=transition=dissolve:duration=${duration}:offset=0[v];[0:a][1:a]acrossfade=d=${duration}[a]`;

      case 'slide':
        return `[0:v][1:v]xfade=transition=slideleft:duration=${duration}:offset=0[v];[0:a][1:a]acrossfade=d=${duration}[a]`;

      case 'wipe':
        return `[0:v][1:v]xfade=transition=wipeleft:duration=${duration}:offset=0[v];[0:a][1:a]acrossfade=d=${duration}[a]`;

      case 'zoom':
        return `[0:v][1:v]xfade=transition=zoomin:duration=${duration}:offset=0[v];[0:a][1:a]acrossfade=d=${duration}[a]`;

      case 'morphing':
        return `[0:v][1:v]xfade=transition=smoothleft:duration=${duration}:offset=0[v];[0:a][1:a]acrossfade=d=${duration}[a]`;

      case 'glitch':
        return `[0:v][1:v]xfade=transition=pixelize:duration=${duration}:offset=0[v];[0:a][1:a]acrossfade=d=${duration}[a]`;

      case 'whipPan':
        return `[0:v][1:v]xfade=transition=hblur:duration=${duration}:offset=0[v];[0:a][1:a]acrossfade=d=${duration}[a]`;

      default:
        return `[0:v][1:v]xfade=transition=fade:duration=${duration}:offset=0[v];[0:a][1:a]acrossfade=d=${duration}[a]`;
    }
  }

  /**
   * Executa comando FFmpeg
   */
  private runFFmpeg(ffmpegPath: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const ffmpeg = spawn(ffmpegPath, args);

      let stderr = '';

      ffmpeg.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code: number) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Verifica se duas paletas de cores são similares
   */
  private colorsAreSimilar(colors1: string[], colors2: string[]): boolean {
    // Comparação simples - em produção, usar distance no espaço de cores
    const intersection = colors1.filter(c => colors2.includes(c));
    return intersection.length > 0;
  }

  /**
   * Converte hex para RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Calcula distância entre duas cores
   */
  private colorDistance(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2)
    );
  }
}

// Export singleton
export const sceneTransitionsEngine = new SceneTransitionsEngine();
