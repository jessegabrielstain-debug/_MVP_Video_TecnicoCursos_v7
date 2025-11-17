/**
 * Watermark Processor stub para testes
 */

export enum WatermarkType {
  TEXT = 'text',
  IMAGE = 'image',
  LOGO = 'logo'
}

export enum WatermarkPosition {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  CENTER = 'center'
}

export enum WatermarkAnimation {
  NONE = 'none',
  FADE_IN = 'fade-in',
  SLIDE = 'slide'
}

export interface WatermarkConfig {
  type: WatermarkType
  position: WatermarkPosition
  animation?: WatermarkAnimation
  opacity?: number
  text?: string
  imagePath?: string
}

export default class WatermarkProcessor {
  async applyWatermark(inputPath: string, outputPath: string, config: WatermarkConfig): Promise<void> {
    // Stub: não executa ffmpeg real
    return Promise.resolve()
  }
}

export function applyLogoWatermark(inputPath: string, outputPath: string, logoPath: string): Promise<void> {
  return Promise.resolve()
}

export function applyCopyrightWatermark(inputPath: string, outputPath: string, text: string): Promise<void> {
  return Promise.resolve()
}
