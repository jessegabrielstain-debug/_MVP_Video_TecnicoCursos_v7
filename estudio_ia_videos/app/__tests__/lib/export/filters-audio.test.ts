/**
 * 🧪 Unit Tests - Video Filters & Audio Processor (CORRECTED)
 * Sprint 49 - Task 7
 * 
 * Testa configurações de filtros e áudio sem executar FFmpeg
 * - Validação de tipos de filtros
 * - Validação de configurações de áudio
 * - Enums e interfaces
 */

import { 
  VideoFilters,
  VideoFilterType,
  type VideoFilterConfig 
} from '@/lib/export/video-filters'
import { 
  AudioProcessor,
  AudioEnhancementType,
  type AudioEnhancementConfig,
  type NormalizationConfig,
  type CompressionConfig 
} from '@/lib/export/audio-processor'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

type NormalizationValue = NormalizationConfig['value']
type CompressionValue = CompressionConfig['value']

const isNormalizationValue = (value: AudioEnhancementConfig['value']): value is NormalizationValue => {
  if (!isRecord(value)) return false

  const { method, targetLevel } = value
  return (
    typeof method === 'string' &&
    (method === 'peak' || method === 'rms' || method === 'ebu') &&
    typeof targetLevel === 'number'
  )
}

const isCompressionValue = (value: AudioEnhancementConfig['value']): value is CompressionValue => {
  if (!isRecord(value)) return false

  const { threshold, ratio, attack, release } = value

  return (
    typeof threshold === 'number' &&
    typeof ratio === 'number' &&
    typeof attack === 'number' &&
    typeof release === 'number'
  )
}

const assertNormalizationValue = (enhancement: AudioEnhancementConfig): NormalizationValue => {
  expect(enhancement.type).toBe(AudioEnhancementType.NORMALIZE)

  if (!isNormalizationValue(enhancement.value)) {
    throw new Error('Expected normalization configuration value')
  }

  return enhancement.value
}

const assertCompressionValue = (enhancement: AudioEnhancementConfig): CompressionValue => {
  expect(enhancement.type).toBe(AudioEnhancementType.COMPRESSION)

  if (!isCompressionValue(enhancement.value)) {
    throw new Error('Expected compression configuration value')
  }

  return enhancement.value
}

describe('Video Filters - Configuration Validation', () => {
  describe('Filter Types', () => {
    it('deve ter todos os tipos de filtro disponíveis', () => {
      expect(VideoFilterType.BRIGHTNESS).toBe('brightness')
      expect(VideoFilterType.CONTRAST).toBe('contrast')
      expect(VideoFilterType.SATURATION).toBe('saturation')
      expect(VideoFilterType.HUE).toBe('hue')
      expect(VideoFilterType.BLUR).toBe('blur')
      expect(VideoFilterType.SHARPEN).toBe('sharpen')
      expect(VideoFilterType.SEPIA).toBe('sepia')
      expect(VideoFilterType.GRAYSCALE).toBe('grayscale')
      expect(VideoFilterType.VIGNETTE).toBe('vignette')
      expect(VideoFilterType.DENOISE).toBe('denoise')
    })
  })

  describe('Filter Configuration', () => {
    it('deve aceitar configuração de brightness', () => {
      const filter: VideoFilterConfig = {
        type: VideoFilterType.BRIGHTNESS,
        value: 0.2,
        enabled: true,
      }

      expect(filter.type).toBe(VideoFilterType.BRIGHTNESS)
      expect(filter.value).toBe(0.2)
      expect(filter.enabled).toBe(true)
    })

    it('deve aceitar configuração de contrast', () => {
      const filter: VideoFilterConfig = {
        type: VideoFilterType.CONTRAST,
        value: 0.15,
        enabled: true,
      }

      expect(filter.type).toBe(VideoFilterType.CONTRAST)
    })

    it('deve aceitar filtro desabilitado', () => {
      const filter: VideoFilterConfig = {
        type: VideoFilterType.BLUR,
        value: 5,
        enabled: false,
      }

      expect(filter.enabled).toBe(false)
    })

    it('deve aceitar múltiplos filtros em array', () => {
      const filters: VideoFilterConfig[] = [
        { type: VideoFilterType.BRIGHTNESS, value: 0.1, enabled: true },
        { type: VideoFilterType.CONTRAST, value: 0.2, enabled: true },
        { type: VideoFilterType.SATURATION, value: 1.2, enabled: true },
      ]

      expect(filters).toHaveLength(3)
      expect(filters.every(f => f.enabled)).toBe(true)
    })
  })

  describe('VideoFilters Class', () => {
    it('deve ter método applyFilters', () => {
      const videoFilters = new VideoFilters()
      expect(typeof videoFilters.applyFilters).toBe('function')
    })

    it('applyFilters deve aceitar 4 parâmetros', () => {
      const videoFilters = new VideoFilters()
      // inputPath, outputPath, filters, onProgress
      expect(videoFilters.applyFilters.length).toBe(4)
    })
  })

  describe('Filter Values', () => {
    it('deve aceitar valores numéricos para brightness', () => {
      const values = [-1.0, -0.5, 0, 0.5, 1.0]
      
      values.forEach(value => {
        const filter: VideoFilterConfig = {
          type: VideoFilterType.BRIGHTNESS,
          value,
          enabled: true,
        }
        expect(typeof filter.value).toBe('number')
      })
    })

    it('deve aceitar valores de saturação', () => {
      const filter: VideoFilterConfig = {
        type: VideoFilterType.SATURATION,
        value: 1.5,
        enabled: true,
      }

      expect(filter.value).toBeGreaterThan(0)
    })

    it('deve aceitar valores de blur', () => {
      const filter: VideoFilterConfig = {
        type: VideoFilterType.BLUR,
        value: 10,
        enabled: true,
      }

      expect(filter.value).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('Audio Processor - Configuration Validation', () => {
  describe('Enhancement Types', () => {
    it('deve ter todos os tipos de enhancement disponíveis', () => {
      expect(AudioEnhancementType.NORMALIZE).toBe('normalize')
      expect(AudioEnhancementType.COMPRESSION).toBe('compression')
      expect(AudioEnhancementType.NOISE_REDUCTION).toBe('noise_reduction')
      expect(AudioEnhancementType.FADE_IN).toBe('fade_in')
      expect(AudioEnhancementType.FADE_OUT).toBe('fade_out')
      expect(AudioEnhancementType.EQUALIZER).toBe('equalizer')
      expect(AudioEnhancementType.BASS_BOOST).toBe('bass_boost')
      expect(AudioEnhancementType.TREBLE_BOOST).toBe('treble_boost')
      expect(AudioEnhancementType.VOLUME).toBe('volume')
      expect(AudioEnhancementType.DUCKING).toBe('ducking')
    })
  })

  describe('Enhancement Configuration', () => {
    it('deve aceitar configuração de normalização', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.NORMALIZE,
        value: { targetLevel: -16, method: 'ebu' },
        enabled: true,
      }

      expect(enhancement.type).toBe(AudioEnhancementType.NORMALIZE)
      expect(enhancement.enabled).toBe(true)
    })

    it('deve aceitar configuração de compressão', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.COMPRESSION,
        value: {
          threshold: -20,
          ratio: 4,
          attack: 5,
          release: 50,
        },
        enabled: true,
      }

      expect(enhancement.type).toBe(AudioEnhancementType.COMPRESSION)
      expect(typeof enhancement.value).toBe('object')
    })

    it('deve aceitar configuração de equalização', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.EQUALIZER,
        value: {
          bass: 3,
          mid: 0,
          treble: 2,
        },
        enabled: true,
      }

      expect(enhancement.type).toBe(AudioEnhancementType.EQUALIZER)
    })

    it('deve aceitar enhancement desabilitado', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.NOISE_REDUCTION,
        value: { strength: 0.5 },
        enabled: false,
      }

      expect(enhancement.enabled).toBe(false)
    })

    it('deve aceitar múltiplos enhancements em array', () => {
      const enhancements: AudioEnhancementConfig[] = [
        {
          type: AudioEnhancementType.NORMALIZE,
          value: { targetLevel: -16, method: 'ebu' },
          enabled: true,
        },
        {
          type: AudioEnhancementType.COMPRESSION,
          value: { threshold: -20, ratio: 4, attack: 5, release: 50 },
          enabled: true,
        },
      ]

      expect(enhancements).toHaveLength(2)
      expect(enhancements.every(e => e.enabled)).toBe(true)
    })
  })

  describe('AudioProcessor Class', () => {
    it('deve ter método processAudio', () => {
      const audioProcessor = new AudioProcessor()
      expect(typeof audioProcessor.processAudio).toBe('function')
    })

    it('processAudio deve aceitar 4 parâmetros', () => {
      const audioProcessor = new AudioProcessor()
      // inputPath, outputPath, enhancements, onProgress
      expect(audioProcessor.processAudio.length).toBe(4)
    })
  })

  describe('Normalization Methods', () => {
    it('deve aceitar método EBU R128', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.NORMALIZE,
        value: { targetLevel: -23, method: 'ebu' },
        enabled: true,
      }

      expect(enhancement.value).toHaveProperty('method')
      const value = assertNormalizationValue(enhancement)
      expect(value.method).toBe('ebu')
    })

    it('deve aceitar método Peak', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.NORMALIZE,
        value: { targetLevel: -1, method: 'peak' },
        enabled: true,
      }

      const value = assertNormalizationValue(enhancement)
      expect(value.method).toBe('peak')
    })

    it('deve aceitar método RMS', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.NORMALIZE,
        value: { targetLevel: -18, method: 'rms' },
        enabled: true,
      }

      const value = assertNormalizationValue(enhancement)
      expect(value.method).toBe('rms')
    })
  })

  describe('Compression Settings', () => {
    it('deve aceitar configuração de threshold', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.COMPRESSION,
        value: {
          threshold: -15,
          ratio: 3,
          attack: 10,
          release: 100,
        },
        enabled: true,
      }

      const value = assertCompressionValue(enhancement)
      expect(value.threshold).toBe(-15)
    })

    it('deve aceitar diferentes ratios de compressão', () => {
      const ratios = [2, 3, 4, 6, 8, 10]
      
      ratios.forEach(ratio => {
        const enhancement: AudioEnhancementConfig = {
          type: AudioEnhancementType.COMPRESSION,
          value: {
            threshold: -20,
            ratio,
            attack: 5,
            release: 50,
          },
          enabled: true,
        }
        const value = assertCompressionValue(enhancement)
        expect(value.ratio).toBe(ratio)
      })
    })
  })

  describe('Fade Configurations', () => {
    it('deve aceitar configuração de fade in', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.FADE_IN,
        value: { duration: 2, curve: 'linear' },
        enabled: true,
      }

      expect(enhancement.type).toBe(AudioEnhancementType.FADE_IN)
    })

    it('deve aceitar configuração de fade out', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.FADE_OUT,
        value: { duration: 3, curve: 'exponential' },
        enabled: true,
      }

      expect(enhancement.type).toBe(AudioEnhancementType.FADE_OUT)
    })
  })

  describe('Volume Control', () => {
    it('deve aceitar configuração de volume', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.VOLUME,
        value: 1.5,
        enabled: true,
      }

      expect(enhancement.type).toBe(AudioEnhancementType.VOLUME)
      expect(typeof enhancement.value).toBe('number')
    })

    it('deve aceitar boost de bass', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.BASS_BOOST,
        value: 5,
        enabled: true,
      }

      expect(enhancement.type).toBe(AudioEnhancementType.BASS_BOOST)
    })

    it('deve aceitar boost de treble', () => {
      const enhancement: AudioEnhancementConfig = {
        type: AudioEnhancementType.TREBLE_BOOST,
        value: 3,
        enabled: true,
      }

      expect(enhancement.type).toBe(AudioEnhancementType.TREBLE_BOOST)
    })
  })
})
