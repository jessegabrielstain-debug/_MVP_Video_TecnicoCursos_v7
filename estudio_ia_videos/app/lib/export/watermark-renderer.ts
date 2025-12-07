import { WatermarkConfig } from '@/types/watermark.types';

export class WatermarkRenderer {
  applyWatermark(
    inputPath: string,
    outputPath: string,
    config: WatermarkConfig,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return Promise.resolve();
  }
}

export const watermarkRenderer = new WatermarkRenderer();
