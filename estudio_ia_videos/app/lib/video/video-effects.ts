/**
 * Video Effects stub para testes
 */

export enum ColorFilter {
  NONE = 'none',
  SEPIA = 'sepia',
  GRAYSCALE = 'grayscale',
  NEGATIVE = 'negative'
}

export enum TransitionType {
  FADE = 'fade',
  DISSOLVE = 'dissolve',
  WIPE = 'wipe',
  SLIDE = 'slide'
}

export enum SpecialEffect {
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  GLOW = 'glow',
  PIXELATE = 'pixelate'
}

export interface EffectsConfig {
  colorFilter?: ColorFilter
  transition?: TransitionType
  specialEffect?: SpecialEffect
  brightness?: number
  contrast?: number
  saturation?: number
}

export default class VideoEffects {
  async applyEffects(inputPath: string, outputPath: string, config: EffectsConfig): Promise<void> {
    return Promise.resolve()
  }
}

export function createBasicEffects(): EffectsConfig {
  return { colorFilter: ColorFilter.NONE }
}

export function createVintageEffects(): EffectsConfig {
  return { colorFilter: ColorFilter.SEPIA }
}

export function createCinematicEffects(): EffectsConfig {
  return { brightness: 0.9, contrast: 1.2 }
}

export function createNoirEffects(): EffectsConfig {
  return { colorFilter: ColorFilter.GRAYSCALE }
}

export function createVibrantEffects(): EffectsConfig {
  return { saturation: 1.5 }
}

export function createSlowMotionEffects(): EffectsConfig {
  return {}
}
