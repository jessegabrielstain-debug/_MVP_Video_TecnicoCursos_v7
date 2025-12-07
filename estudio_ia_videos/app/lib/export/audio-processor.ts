
export enum AudioEnhancementType {
  NORMALIZE = 'normalize',
  NOISE_REDUCTION = 'noise_reduction',
  COMPRESSION = 'compression',
  EQUALIZATION = 'equalization',
  FADE_IN = 'fade_in',
  FADE_OUT = 'fade_out',
  EQUALIZER = 'equalizer',
  BASS_BOOST = 'bass_boost',
  TREBLE_BOOST = 'treble_boost',
  VOLUME = 'volume',
  DUCKING = 'ducking'
}

export interface AudioEnhancement {
  id?: string;
  type: AudioEnhancementType;
  value: number | boolean | Record<string, unknown>;
  enabled: boolean;
}

export type AudioEnhancementConfig = AudioEnhancement;

export interface AudioPreset {
  id: string;
  name: string;
  description: string;
  enhancements: AudioEnhancement[];
}

export const DEFAULT_ENHANCEMENT_VALUES: Record<AudioEnhancementType, any> = {
  [AudioEnhancementType.NORMALIZE]: true,
  [AudioEnhancementType.NOISE_REDUCTION]: 0.5,
  [AudioEnhancementType.COMPRESSION]: { threshold: -20, ratio: 4 },
  [AudioEnhancementType.EQUALIZATION]: { low: 0, mid: 0, high: 0 },
  [AudioEnhancementType.FADE_IN]: 1.0,
  [AudioEnhancementType.FADE_OUT]: 1.0,
  [AudioEnhancementType.EQUALIZER]: { low: 0, mid: 0, high: 0 },
  [AudioEnhancementType.BASS_BOOST]: 0.5,
  [AudioEnhancementType.TREBLE_BOOST]: 0.5,
  [AudioEnhancementType.VOLUME]: 1.0,
  [AudioEnhancementType.DUCKING]: 0.5
};

export class AudioProcessor {
  processAudio(inputPath: string, outputPath: string, enhancements: AudioEnhancement[], onProgress?: (progress: number) => void): Promise<void> {
    return Promise.resolve();
  }

  static createEnhancement(type: AudioEnhancementType): AudioEnhancement {
    return {
      id: `enhancement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      value: DEFAULT_ENHANCEMENT_VALUES[type],
      enabled: true
    };
  }

  static getPresets(): AudioPreset[] {
    return [
      {
        id: 'podcast',
        name: 'Podcast',
        description: 'Otimizado para voz falada',
        enhancements: [
          { type: AudioEnhancementType.NORMALIZE, value: true, enabled: true },
          { type: AudioEnhancementType.NOISE_REDUCTION, value: 0.3, enabled: true },
          { type: AudioEnhancementType.COMPRESSION, value: { threshold: -16, ratio: 3 }, enabled: true }
        ]
      },
      {
        id: 'music',
        name: 'Música',
        description: 'Realça graves e agudos',
        enhancements: [
          { type: AudioEnhancementType.BASS_BOOST, value: 0.3, enabled: true },
          { type: AudioEnhancementType.TREBLE_BOOST, value: 0.2, enabled: true }
        ]
      }
    ];
  }
}
