
export enum VideoFilterType {
  BRIGHTNESS = 'brightness',
  CONTRAST = 'contrast',
  SATURATION = 'saturation',
  GRAYSCALE = 'grayscale',
  SEPIA = 'sepia',
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  HUE = 'hue',
  VIGNETTE = 'vignette',
  DENOISE = 'denoise'
}

export interface VideoFilter {
  type: VideoFilterType;
  value: number;
  enabled: boolean;
}

export class VideoFilters {
  applyFilters(inputPath: string, outputPath: string, filters: VideoFilter[], onProgress?: (progress: number) => void): Promise<void> {
    return Promise.resolve();
  }
}
