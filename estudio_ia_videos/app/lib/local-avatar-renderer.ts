/**
 * Local Avatar Renderer
 * Renderização local de avatares (sem UE5)
 */

import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';
import path from 'path';
import fs from 'fs';
import { logger } from '@/lib/logger';

export interface AvatarConfig {
  type: 'static' | '2d' | '3d';
  assetPath: string;
  dimensions: { width: number; height: number };
}

export class LocalAvatarRenderer {
  async render(config: AvatarConfig, frame: number): Promise<Buffer> {
    const { width, height } = config.dimensions;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    try {
      // Tentar carregar asset se existir
      if (config.assetPath && fs.existsSync(config.assetPath)) {
        const image = await loadImage(config.assetPath);
        ctx.drawImage(image, 0, 0, width, height);
        logger.debug(`[Avatar] Asset carregado com sucesso`, { assetPath: config.assetPath, frame, component: 'LocalAvatarRenderer' });
      } else {
        // Fallback: Desenhar avatar placeholder (melhorado)
        logger.warn(`[Avatar] Asset não encontrado, usando placeholder`, { assetPath: config.assetPath, frame, component: 'LocalAvatarRenderer' });
        this.drawPlaceholderAvatar(ctx, width, height, frame);
      }
    } catch (error) {
      logger.error(`[Avatar] Erro ao renderizar frame ${frame}`, error instanceof Error ? error : new Error(String(error)), { frame, component: 'LocalAvatarRenderer' });
      // Fallback robusto: sempre desenhar placeholder em caso de erro
      this.drawPlaceholderAvatar(ctx, width, height, frame);
    }

    return canvas.toBuffer('image/png');
  }
  
  private drawPlaceholderAvatar(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    // Desenhar avatar placeholder melhorado com animação suave
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Background gradiente
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Cabeça (círculo com sombra)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6'; // Blue-500
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Boca animada (sincronizada com frame para simular fala)
    const mouthOpen = Math.abs(Math.sin(frame * 0.3)) * 15 + 5; // Animação mais suave
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + radius * 0.3, radius * 0.4, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1d4ed8'; // Blue-700
    ctx.fill();
    
    // Olhos (com animação de piscar ocasional)
    const blink = Math.sin(frame * 0.1) > 0.95 ? 0.05 : radius * 0.1;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.2, blink, 0, Math.PI * 2);
    ctx.arc(centerX + radius * 0.3, centerY - radius * 0.2, blink, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilas
    ctx.fillStyle = '#1e40af';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.2, blink * 0.5, 0, Math.PI * 2);
    ctx.arc(centerX + radius * 0.3, centerY - radius * 0.2, blink * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  async renderSequence(config: AvatarConfig, totalFrames: number): Promise<Buffer[]> {
    const frames: Buffer[] = [];
    for (let i = 0; i < totalFrames; i++) {
      frames.push(await this.render(config, i));
    }
    return frames;
  }
}

export const localAvatarRenderer = new LocalAvatarRenderer();
