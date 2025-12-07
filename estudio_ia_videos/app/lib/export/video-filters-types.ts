export enum VideoFilterType {
  BRIGHTNESS = 'brightness',
  CONTRAST = 'contrast',
  SATURATION = 'saturation',
  HUE = 'hue',
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  SEPIA = 'sepia',
  GRAYSCALE = 'grayscale',
  VIGNETTE = 'vignette',
  FADE = 'fade',
  COLORIZE = 'colorize',
  NOISE = 'noise',
  DENOISE = 'denoise',
}

export interface VideoFilterConfig {
  id?: string
  name?: string
  type: VideoFilterType
  value: number | { angle: number; intensity: number } | Record<string, unknown>
  enabled: boolean
}

export interface FilterPreset {
  id: string
  name: string
  description: string
  filters: VideoFilterConfig[]
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'cinematic',
    name: 'Cinemático',
    description: 'Visual de cinema com contraste e saturação ajustados',
    filters: [
      { type: VideoFilterType.CONTRAST, value: 0.2, enabled: true },
      { type: VideoFilterType.SATURATION, value: 1.2, enabled: true },
      { type: VideoFilterType.VIGNETTE, value: { angle: 45, intensity: 0.3 }, enabled: true },
    ],
  },
  {
    id: 'bw-classic',
    name: 'P&B Clássico',
    description: 'Preto e branco com alto contraste',
    filters: [
      { type: VideoFilterType.GRAYSCALE, value: 1, enabled: true },
      { type: VideoFilterType.CONTRAST, value: 0.3, enabled: true },
    ],
  },
  {
    id: 'warm-vintage',
    name: 'Vintage Quente',
    description: 'Tons quentes e leve desfoque',
    filters: [
      { type: VideoFilterType.SEPIA, value: 0.5, enabled: true },
      { type: VideoFilterType.SATURATION, value: 0.8, enabled: true },
      { type: VideoFilterType.BLUR, value: 1, enabled: true },
    ],
  },
  {
    id: 'sharp-modern',
    name: 'Moderno Nítido',
    description: 'Alta nitidez e cores vibrantes',
    filters: [
      { type: VideoFilterType.SHARPEN, value: 0.5, enabled: true },
      { type: VideoFilterType.SATURATION, value: 1.3, enabled: true },
      { type: VideoFilterType.CONTRAST, value: 0.1, enabled: true },
    ],
  },
]
