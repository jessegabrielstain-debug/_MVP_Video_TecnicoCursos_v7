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
      // Try to load asset if it exists
      if (config.assetPath && fs.existsSync(config.assetPath)) {
        const image = await loadImage(config.assetPath);
        ctx.drawImage(image, 0, 0, width, height);
      } else {
        // Fallback: Draw a placeholder avatar
        this.drawPlaceholderAvatar(ctx, width, height, frame);
      }
    } catch (error) {
      logger.error(`[Avatar] Error rendering frame ${frame}`, error as Error, { frame, component: 'LocalAvatarRenderer' });
      this.drawPlaceholderAvatar(ctx, width, height, frame);
    }

    return canvas.toBuffer('image/png');
  }
  
  private drawPlaceholderAvatar(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    // Draw a simple animated circle to represent the avatar
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    // "Head"
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6'; // Blue-500
    ctx.fill();

    // "Mouth" (animated)
    const mouthOpen = Math.sin(frame * 0.5) * 10 + 10; // Simple animation
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + radius * 0.3, radius * 0.4, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1d4ed8'; // Blue-700
    ctx.fill();
    
    // "Eyes"
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.2, radius * 0.1, 0, Math.PI * 2);
    ctx.arc(centerX + radius * 0.3, centerY - radius * 0.2, radius * 0.1, 0, Math.PI * 2);
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
