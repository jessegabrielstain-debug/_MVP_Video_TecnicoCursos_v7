/**
 * 🔧 Utils para Renderização - Fase 8
 * Utilitários e helpers para o sistema de renderização
 */

import path from 'path';
import fs from 'fs/promises';
import { createCanvas, loadImage } from 'canvas';

export interface VideoSettings {
  resolution: { width: number; height: number };
  fps: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  codec: 'h264' | 'h265' | 'vp8' | 'vp9';
  format: 'mp4' | 'webm' | 'mov';
}

export interface SlideData {
  id: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  duration: number;
  animations?: Animation[];
  textElements?: TextElement[];
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface TextElement {
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface Animation {
  type: 'fadeIn' | 'slideIn' | 'zoom' | 'bounce';
  startFrame: number;
  duration: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

/**
 * Converte resolução string para objeto
 */
export function parseResolution(resolution: string): { width: number; height: number } {
  switch (resolution) {
    case '720p':
      return { width: 1280, height: 720 };
    case '1080p':
      return { width: 1920, height: 1080 };
    case '4k':
      return { width: 3840, height: 2160 };
    default:
      return { width: 1920, height: 1080 };
  }
}

/**
 * Calcula bitrate baseado na resolução e qualidade
 */
export function calculateBitrate(resolution: string, quality: string): number {
  const resolutionMultiplier = {
    '720p': 1,
    '1080p': 2,
    '4k': 6
  }[resolution] || 2;

  const qualityMultiplier = {
    'low': 1000,
    'medium': 2500,
    'high': 5000,
    'ultra': 8000
  }[quality] || 2500;

  return resolutionMultiplier * qualityMultiplier;
}

/**
 * Gera configurações FFmpeg baseadas nas opções
 */
export function generateFFmpegArgs(settings: VideoSettings, inputDir: string, audioPath?: string, outputPath?: string): string[] {
  const args: string[] = [];

  // Input de frames
  args.push('-framerate', String(settings.fps));
  args.push('-i', path.join(inputDir, 'frame_%04d.png'));

  // Input de áudio (se existir)
  if (audioPath) {
    args.push('-i', audioPath);
    args.push('-c:a', 'aac');
    args.push('-b:a', '192k');
  }

  // Codec de vídeo
  switch (settings.codec) {
    case 'h264':
      args.push('-c:v', 'libx264');
      break;
    case 'h265':
      args.push('-c:v', 'libx265');
      break;
    case 'vp8':
      args.push('-c:v', 'libvpx');
      break;
    case 'vp9':
      args.push('-c:v', 'libvpx-vp9');
      break;
  }

  // Qualidade
  const crfMap = {
    'ultra': '15',
    'high': '18',
    'medium': '23',
    'low': '28'
  };
  args.push('-crf', crfMap[settings.quality]);

  // Resolução
  args.push('-s', `${settings.resolution.width}x${settings.resolution.height}`);

  // Pixel format
  args.push('-pix_fmt', 'yuv420p');

  // Preset
  args.push('-preset', 'medium');

  // Flags de otimização
  args.push('-movflags', '+faststart');
  args.push('-threads', '0');

  // Output
  if (outputPath) {
    args.push('-y'); // Sobrescrever
    args.push(outputPath);
  }

  return args;
}

/**
 * Cria diretório se não existir
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Remove diretório e todo seu conteúdo
 */
export async function removeDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to remove directory ${dirPath}:`, error);
  }
}

/**
 * Lista arquivos de frame em um diretório
 */
export async function listFrameFiles(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files
      .filter(file => /^frame_\d{4}\.(png|jpg|jpeg)$/i.test(file))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Calcula duração total baseada nos slides
 */
export function calculateTotalDuration(slides: SlideData[]): number {
  return slides.reduce((total, slide) => total + slide.duration, 0);
}

/**
 * Converte duração em segundos para frames
 */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.ceil(seconds * fps);
}

/**
 * Converte frames para duração em segundos
 */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

/**
 * Gera nome único para arquivo temporário
 */
export function generateTempFileName(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formata duração para exibição (HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Valida configurações de vídeo
 */
export function validateVideoSettings(settings: VideoSettings): string[] {
  const errors: string[] = [];

  if (settings.fps < 1 || settings.fps > 120) {
    errors.push('FPS deve estar entre 1 e 120');
  }

  if (settings.resolution.width < 320 || settings.resolution.height < 240) {
    errors.push('Resolução mínima é 320x240');
  }

  if (settings.resolution.width > 7680 || settings.resolution.height > 4320) {
    errors.push('Resolução máxima é 7680x4320 (8K)');
  }

  return errors;
}

/**
 * Cria imagem em branco para placeholder
 */
export async function createBlankFrame(
  width: number,
  height: number,
  backgroundColor: string = '#000000'
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Preencher com cor de fundo
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  return canvas.toBuffer('image/png');
}

/**
 * Aplicar animação a um elemento
 */
export function applyAnimation(
  ctx: CanvasRenderingContext2D,
  animation: Animation,
  currentFrame: number,
  fps: number
): number {
  const startFrame = animation.startFrame;
  const endFrame = startFrame + secondsToFrames(animation.duration, fps);

  if (currentFrame < startFrame || currentFrame > endFrame) {
    return 1; // Sem animação
  }

  const progress = (currentFrame - startFrame) / (endFrame - startFrame);
  
  switch (animation.type) {
    case 'fadeIn':
      return easeProgress(progress, animation.easing);
    
    case 'slideIn':
      const offset = (1 - easeProgress(progress, animation.easing)) * 100;
      ctx.translate(-offset, 0);
      return 1;
    
    case 'zoom':
      const scale = 0.5 + (0.5 * easeProgress(progress, animation.easing));
      ctx.scale(scale, scale);
      return 1;
    
    case 'bounce':
      const bounce = Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.1;
      ctx.translate(0, bounce * 50);
      return 1;
    
    default:
      return 1;
  }
}

/**
 * Aplica easing ao progresso da animação
 */
function easeProgress(progress: number, easing?: string): number {
  switch (easing) {
    case 'easeIn':
      return progress * progress;
    
    case 'easeOut':
      return 1 - Math.pow(1 - progress, 2);
    
    case 'easeInOut':
      return progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    default:
      return progress; // linear
  }
}

/**
 * Parse de progresso do FFmpeg
 */
export function parseFFmpegProgress(output: string): {
  frame?: number;
  fps?: number;
  time?: number;
  bitrate?: string;
  size?: string;
  speed?: number;
} {
  const result: {
    frame?: number;
    fps?: number;
    time?: number;
    bitrate?: string;
    size?: string;
    speed?: number;
  } = {};

  const frameMatch = output.match(/frame=\s*(\d+)/);
  if (frameMatch) result.frame = parseInt(frameMatch[1]);

  const fpsMatch = output.match(/fps=\s*([\d.]+)/);
  if (fpsMatch) result.fps = parseFloat(fpsMatch[1]);

  const timeMatch = output.match(/time=(\d+):(\d+):([\d.]+)/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseFloat(timeMatch[3]);
    result.time = hours * 3600 + minutes * 60 + seconds;
  }

  const bitrateMatch = output.match(/bitrate=\s*([\d.]+\s*\w+)/);
  if (bitrateMatch) result.bitrate = bitrateMatch[1];

  const sizeMatch = output.match(/size=\s*([\d.]+\s*\w+)/);
  if (sizeMatch) result.size = sizeMatch[1];

  const speedMatch = output.match(/speed=\s*([\d.]+)x/);
  if (speedMatch) result.speed = parseFloat(speedMatch[1]);

  return result;
}

/**
 * Estima tempo restante baseado no progresso
 */
export function estimateTimeRemaining(
  currentFrame: number,
  totalFrames: number,
  elapsedTime: number
): number {
  if (currentFrame <= 0) return 0;

  const progress = currentFrame / totalFrames;
  const estimatedTotal = elapsedTime / progress;
  
  return Math.max(0, estimatedTotal - elapsedTime);
}

/**
 * Cria configuração de renderização padrão
 */
export function createDefaultRenderSettings(): VideoSettings {
  return {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    quality: 'high',
    codec: 'h264',
    format: 'mp4'
  };
}