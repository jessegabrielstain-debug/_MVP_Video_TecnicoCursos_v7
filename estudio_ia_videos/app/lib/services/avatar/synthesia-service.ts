/**
 * 🎭 Gerador de Avatares com Synthesia - IMPLEMENTAÇÃO REAL
 * Integração com Synthesia para geração de vídeos com avatares IA
 */

import { logger } from '@/lib/services/logger-service';

const SYNTHESIA_API_KEY = process.env.SYNTHESIA_API_KEY;
const SYNTHESIA_API_URL = 'https://api.synthesia.io/v2';

interface SynthesiaVideoOptions {
  avatarId: string;
  script: string;
  background?: string;
  title?: string;
}

interface SynthesiaVideoResponse {
  id: string;
  status: 'processing' | 'complete' | 'failed';
  download?: string;
  error?: string;
}

export interface SynthesiaAvatar {
  id: string;
  name: string;
  gender: string;
  image: string;
  preview_video_url?: string;
}

export class SynthesiaService {
  private apiKey: string;

  constructor() {
    if (!SYNTHESIA_API_KEY) {
      throw new Error('SYNTHESIA_API_KEY não está configurada');
    }
    this.apiKey = SYNTHESIA_API_KEY;
  }

  /**
   * Cria um vídeo com avatar Synthesia
   */
  async createVideo(options: SynthesiaVideoOptions): Promise<string> {
    try {
      logger.info('SynthesiaService', 'Criando vídeo Synthesia', { avatarId: options.avatarId });

      const response = await fetch(`${SYNTHESIA_API_URL}/videos`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: false,
          input: [
            {
              avatarSettings: {
                horizontalAlign: 'center',
                scale: 1,
                style: 'rectangular',
                seamless: false,
              },
              backgroundSettings: {
                videoSettings: {
                  shortBackgroundContentMatchMode: 'freeze',
                  longBackgroundContentMatchMode: 'trim',
                },
              },
              avatar: options.avatarId,
              background: options.background || '#ffffff',
              scriptText: options.script,
            },
          ],
          title: options.title || 'AI Video',
          visibility: 'private',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Synthesia API error: ${error.message || response.statusText}`);
      }

      const data: SynthesiaVideoResponse = await response.json();
      logger.info('SynthesiaService', 'Vídeo Synthesia criado', { videoId: data.id });

      // Aguardar processamento
      const videoUrl = await this.waitForCompletion(data.id);
      return videoUrl;

    } catch (error) {
      logger.error('SynthesiaService', 'Erro ao criar vídeo Synthesia', error as Error);
      throw error;
    }
  }

  /**
   * Aguarda a conclusão do processamento
   */
  private async waitForCompletion(videoId: string, maxAttempts = 120): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getVideoStatus(videoId);

      if (status.status === 'complete' && status.download) {
        logger.info('SynthesiaService', 'Vídeo Synthesia processado com sucesso', { videoId });
        return status.download;
      }

      if (status.status === 'failed') {
        throw new Error(`Synthesia processing failed: ${status.error}`);
      }

      // Aguardar 10 segundos antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    throw new Error('Synthesia processing timeout');
  }

  /**
   * Obtém o status de um vídeo
   */
  async getVideoStatus(videoId: string): Promise<SynthesiaVideoResponse> {
    const response = await fetch(`${SYNTHESIA_API_URL}/videos/${videoId}`, {
      headers: {
        'Authorization': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get video status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Lista avatares disponíveis
   */
  async listAvatars(): Promise<SynthesiaAvatar[]> {
    const response = await fetch(`${SYNTHESIA_API_URL}/avatars`, {
      headers: {
        'Authorization': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list avatars: ${response.statusText}`);
    }

    const data = await response.json();
    return data.avatars || [];
  }

  /**
   * Deleta um vídeo
   */
  async deleteVideo(videoId: string): Promise<void> {
    await fetch(`${SYNTHESIA_API_URL}/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': this.apiKey,
      },
    });

    logger.info('SynthesiaService', 'Vídeo Synthesia deletado', { videoId });
  }
}

export const synthesiaService = new SynthesiaService();
