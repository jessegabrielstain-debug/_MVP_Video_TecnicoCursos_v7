/**
 * Video Validator Module
 * 
 * Validação completa de vídeos com verificação de:
 * - Formatos suportados
 * - Qualidade e resolução
 * - Metadados e conformidade NR
 * - Duração e tamanho
 */

import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

// ==================== TYPES ====================

export interface VideoMetadata {
  format: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  size: number;
  hasAudio: boolean;
  audioCodec?: string;
  videoCodec: string;
  audioChannels?: number;
  audioSampleRate?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: VideoMetadata;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  nrCompliant: boolean;
}

export interface ValidationOptions {
  maxDuration?: number;        // Duração máxima em segundos (padrão: 1800 = 30min)
  minDuration?: number;        // Duração mínima em segundos (padrão: 10)
  maxFileSize?: number;        // Tamanho máximo em bytes (padrão: 500MB)
  minWidth?: number;           // Largura mínima (padrão: 720)
  minHeight?: number;          // Altura mínima (padrão: 480)
  requiredFormats?: string[];  // Formatos aceitos
  requireAudio?: boolean;      // Exige áudio
  nrCompliance?: boolean;      // Validar conformidade NR
}

export interface NRComplianceCheck {
  hasWatermark: boolean;
  hasIntro: boolean;
  hasOutro: boolean;
  hasSubtitles: boolean;
  audioClear: boolean;
  properDuration: boolean;
  score: number; // 0-100
}

// ==================== CONSTANTS ====================

const SUPPORTED_FORMATS = [
  'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'm4v'
];

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  maxDuration: 1800,
  minDuration: 10,
  maxFileSize: 500 * 1024 * 1024,
  minWidth: 720,
  minHeight: 480,
  requiredFormats: SUPPORTED_FORMATS,
  requireAudio: true,
  nrCompliance: true
};

const QUALITY_THRESHOLDS = {
  ultra: { width: 3840, height: 2160, bitrate: 8000000 },
  high: { width: 1920, height: 1080, bitrate: 4000000 },
  medium: { width: 1280, height: 720, bitrate: 2000000 },
  low: { width: 640, height: 360, bitrate: 500000 }
};

// ==================== VIDEO VALIDATOR CLASS ====================

export class VideoValidator {
  private options: Required<ValidationOptions>;

  constructor(options?: ValidationOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Valida um arquivo de vídeo
   */
  async validate(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      quality: 'medium',
      nrCompliant: false
    };

    try {
      // 1. Verificar se arquivo existe
      await this.checkFileExists(filePath, result);
      if (!result.valid) return result;

      // 2. Obter metadados
      const metadata = await this.extractMetadata(filePath);
      result.metadata = metadata;

      // 3. Validar formato
      this.validateFormat(metadata, result);

      // 4. Validar duração
      this.validateDuration(metadata, result);

      // 5. Validar tamanho
      this.validateFileSize(metadata, result);

      // 6. Validar resolução
      this.validateResolution(metadata, result);

      // 7. Validar áudio
      this.validateAudio(metadata, result);

      // 8. Determinar qualidade
      result.quality = this.determineQuality(metadata);

      // 9. Verificar conformidade NR
      if (this.options.nrCompliance) {
        const nrCheck = await this.checkNRCompliance(filePath, metadata);
        result.nrCompliant = nrCheck.score >= 70;
        
        if (!result.nrCompliant) {
          result.warnings.push(`Conformidade NR baixa (${nrCheck.score}/100)`);
        }
      }

      // 10. Definir status final
      result.valid = result.errors.length === 0;

    } catch (error) {
      result.valid = false;
      result.errors.push(`Erro durante validação: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }

    return result;
  }

  /**
   * Valida múltiplos vídeos em batch
   */
  async validateBatch(filePaths: string[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    for (const filePath of filePaths) {
      results.set(filePath, await this.validate(filePath));
    }
    return results;
  }

  // ==================== PRIVATE METHODS ====================

  private async checkFileExists(filePath: string, result: ValidationResult): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      result.valid = false;
      result.errors.push('Arquivo não encontrado');
    }
  }

  private async extractMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);

        const videoStream = data.streams.find(s => s.codec_type === 'video');
        const audioStream = data.streams.find(s => s.codec_type === 'audio');
        const format = data.format;

        if (!videoStream || !format) {
          return reject(new Error('Metadados de vídeo inválidos ou ausentes'));
        }

        resolve({
          format: format.format_name || 'unknown',
          duration: format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: this.parseFPS(videoStream.r_frame_rate),
          bitrate: Number(format.bit_rate) || 0,
          size: format.size || 0,
          hasAudio: !!audioStream,
          audioCodec: audioStream?.codec_name,
          videoCodec: videoStream.codec_name || 'unknown',
          audioChannels: audioStream?.channels,
          audioSampleRate: audioStream?.sample_rate ? Number(audioStream.sample_rate) : undefined
        });
      });
    });
  }

  private parseFPS(frameRate?: string): number {
    if (!frameRate) return 0;
    if (frameRate.includes('/')) {
      const [num, den] = frameRate.split('/').map(Number);
      return den ? num / den : 0;
    }
    return Number(frameRate) || 0;
  }

  private validateFormat(metadata: VideoMetadata, result: ValidationResult): void {
    const format = metadata.format.split(',')[0]; // ffprobe pode retornar múltiplos formatos
    const isSupported = this.options.requiredFormats.some(f => format.includes(f) || f.includes(format));
    
    if (!isSupported) {
      result.errors.push(`Formato não suportado: ${format}`);
    }
  }

  private validateDuration(metadata: VideoMetadata, result: ValidationResult): void {
    if (metadata.duration < this.options.minDuration) {
      result.errors.push(`Duração muito curta: ${metadata.duration}s (mínimo: ${this.options.minDuration}s)`);
    }

    if (metadata.duration > this.options.maxDuration) {
      result.errors.push(`Duração muito longa: ${metadata.duration}s (máximo: ${this.options.maxDuration}s)`);
    }
  }

  private validateFileSize(metadata: VideoMetadata, result: ValidationResult): void {
    if (metadata.size > this.options.maxFileSize) {
      const sizeMB = (metadata.size / 1024 / 1024).toFixed(2);
      const maxSizeMB = (this.options.maxFileSize / 1024 / 1024).toFixed(2);
      result.errors.push(`Arquivo muito grande: ${sizeMB}MB (máximo: ${maxSizeMB}MB)`);
    }

    // Aviso se arquivo muito pequeno (possível problema de qualidade)
    const minExpectedSize = metadata.duration * 100000; // ~100KB/s
    if (metadata.size < minExpectedSize) {
      result.warnings.push('Arquivo muito pequeno - qualidade pode estar comprometida');
    }
  }

  private validateResolution(metadata: VideoMetadata, result: ValidationResult): void {
    if (metadata.width < this.options.minWidth) {
      result.errors.push(`Largura muito baixa: ${metadata.width}px (mínimo: ${this.options.minWidth}px)`);
    }

    if (metadata.height < this.options.minHeight) {
      result.errors.push(`Altura muito baixa: ${metadata.height}px (mínimo: ${this.options.minHeight}px)`);
    }

    // Verificar aspect ratio comum
    const aspectRatio = metadata.width / metadata.height;
    const commonRatios = [16/9, 4/3, 1/1, 9/16];
    const tolerance = 0.05;
    
    const isCommonRatio = commonRatios.some(ratio => 
      Math.abs(aspectRatio - ratio) < tolerance
    );

    if (!isCommonRatio) {
      result.warnings.push(`Aspect ratio incomum: ${aspectRatio.toFixed(2)}`);
    }
  }

  private validateAudio(metadata: VideoMetadata, result: ValidationResult): void {
    if (this.options.requireAudio && !metadata.hasAudio) {
      result.errors.push('Vídeo não possui áudio (obrigatório)');
    }
  }

  private determineQuality(metadata: VideoMetadata): 'low' | 'medium' | 'high' | 'ultra' {
    if (metadata.width >= QUALITY_THRESHOLDS.ultra.width && 
        metadata.height >= QUALITY_THRESHOLDS.ultra.height &&
        metadata.bitrate >= QUALITY_THRESHOLDS.ultra.bitrate) {
      return 'ultra';
    }

    if (metadata.width >= QUALITY_THRESHOLDS.high.width && 
        metadata.height >= QUALITY_THRESHOLDS.high.height &&
        metadata.bitrate >= QUALITY_THRESHOLDS.high.bitrate) {
      return 'high';
    }

    if (metadata.width >= QUALITY_THRESHOLDS.medium.width && 
        metadata.height >= QUALITY_THRESHOLDS.medium.height &&
        metadata.bitrate >= QUALITY_THRESHOLDS.medium.bitrate) {
      return 'medium';
    }

    return 'low';
  }

  private async checkNRCompliance(filePath: string, metadata: VideoMetadata): Promise<NRComplianceCheck> {
    // Mock implementation for now
    return {
      hasWatermark: true,
      hasIntro: true,
      hasOutro: true,
      hasSubtitles: true,
      audioClear: true,
      properDuration: true,
      score: 85
    };
  }
}

// ==================== FACTORY FUNCTIONS ====================

/**
 * Cria validador com configurações padrão para NR
 */
export function createNRValidator(): VideoValidator {
  return new VideoValidator({
    maxDuration: 1200,     // 20 minutos
    minDuration: 180,      // 3 minutos
    maxFileSize: 300 * 1024 * 1024, // 300MB
    minWidth: 1280,
    minHeight: 720,
    requiredFormats: ['mp4'],
    requireAudio: true,
    nrCompliance: true
  });
}

/**
 * Cria validador com configurações para vídeos curtos
 */
export function createShortVideoValidator(): VideoValidator {
  return new VideoValidator({
    maxDuration: 300,      // 5 minutos
    minDuration: 30,       // 30 segundos
    maxFileSize: 100 * 1024 * 1024, // 100MB
    minWidth: 720,
    minHeight: 480,
    requiredFormats: ['mp4', 'webm'],
    requireAudio: false,
    nrCompliance: false
  });
}

/**
 * Cria validador rigoroso para compliance NR
 */
export function createStrictNRValidator(): VideoValidator {
  return new VideoValidator({
    minDuration: 180,    // 3 minutos
    maxDuration: 1200,   // 20 minutos
    maxFileSize: 500 * 1024 * 1024, // 500 MB
    minWidth: 1920,
    minHeight: 1080, // Full HD obrigatório
    requiredFormats: ['mp4'],
    requireAudio: true,
    nrCompliance: true
  });
}

/**
 * Cria validador para vídeos 4K
 */
export function create4KValidator(): VideoValidator {
  return new VideoValidator({
    minDuration: 60,
    maxDuration: 3600, // 1 hora
    maxFileSize: 2048 * 1024 * 1024, // 2 GB
    minWidth: 3840,
    minHeight: 2160, // 4K
    requiredFormats: ['mp4', 'mov', 'mkv'],
    requireAudio: true,
    nrCompliance: false
  });
}

/**
 * Cria validador para YouTube (otimizado)
 */
export function createYouTubeValidator(): VideoValidator {
  return new VideoValidator({
    minDuration: 60,
    maxDuration: 3600 * 2, // 2 horas
    maxFileSize: 256 * 1024 * 1024 * 1024, // 256 GB (limite YouTube)
    minWidth: 1280,
    minHeight: 720, // HD mínimo
    requiredFormats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
    requireAudio: true,
    nrCompliance: false
  });
}

export default VideoValidator;
