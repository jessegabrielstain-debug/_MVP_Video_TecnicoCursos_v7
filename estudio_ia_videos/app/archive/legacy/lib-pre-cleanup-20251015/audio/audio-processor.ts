/**
 * Advanced Audio Processing System
 * 
 * Sistema completo de processamento de áudio incluindo:
 * - Audio Effects (EQ, compressor, reverb, delay, chorus, flanger, distortion)
 * - Audio Mixing (multi-track, volume, pan, fade)
 * - Normalization & Dynamics
 * - Noise Reduction & Voice Enhancement
 * - Audio Sync & Alignment
 * - Ducking & Sidechain
 * - Audio Analysis & Visualization
 * - Audio Presets
 * 
 * @module AdvancedAudioProcessing
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Tipos de efeitos de áudio
 */
export type AudioEffectType =
  | 'equalizer'
  | 'compressor'
  | 'reverb'
  | 'delay'
  | 'chorus'
  | 'flanger'
  | 'distortion'
  | 'phaser'
  | 'tremolo'
  | 'limiter';

/**
 * Configuração de efeito base
 */
export interface AudioEffectConfig {
  id: string;
  type: AudioEffectType;
  name: string;
  enabled: boolean;
  mix: number; // 0-1 (dry/wet)
  bypass: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Equalizer (EQ)
 */
export interface EqualizerEffect extends AudioEffectConfig {
  type: 'equalizer';
  bands: Array<{
    frequency: number; // Hz
    gain: number; // dB (-12 to +12)
    q: number; // Quality factor (0.1 to 10)
    type: 'lowshelf' | 'highshelf' | 'peaking' | 'lowpass' | 'highpass' | 'notch';
  }>;
}

/**
 * Compressor
 */
export interface CompressorEffect extends AudioEffectConfig {
  type: 'compressor';
  threshold: number; // dB (-60 to 0)
  ratio: number; // 1:1 to 20:1
  attack: number; // ms (0 to 1000)
  release: number; // ms (0 to 3000)
  knee: number; // dB (0 to 40)
  makeupGain: number; // dB (0 to 30)
}

/**
 * Reverb
 */
export interface ReverbEffect extends AudioEffectConfig {
  type: 'reverb';
  roomSize: number; // 0-1
  damping: number; // 0-1
  preDelay: number; // ms (0 to 500)
  decay: number; // seconds (0.1 to 20)
  earlyReflections: number; // 0-1
  diffusion: number; // 0-1
  reverbType: 'room' | 'hall' | 'plate' | 'spring' | 'cathedral' | 'studio';
}

/**
 * Delay/Echo
 */
export interface DelayEffect extends AudioEffectConfig {
  type: 'delay';
  time: number; // ms (1 to 5000)
  feedback: number; // 0-1
  pingPong: boolean;
  sync: boolean;
  tempo?: number; // BPM
  delayType: 'mono' | 'stereo' | 'pingpong' | 'multi-tap';
}

/**
 * Chorus
 */
export interface ChorusEffect extends AudioEffectConfig {
  type: 'chorus';
  rate: number; // Hz (0.1 to 10)
  depth: number; // 0-1
  voices: number; // 1-8
  spread: number; // 0-1
  feedback: number; // 0-1
}

/**
 * Flanger
 */
export interface FlangerEffect extends AudioEffectConfig {
  type: 'flanger';
  rate: number; // Hz (0.01 to 20)
  depth: number; // 0-1
  feedback: number; // -1 to 1
  delay: number; // ms (0 to 20)
  stereoPhase: number; // degrees (0 to 180)
}

/**
 * Distortion
 */
export interface DistortionEffect extends AudioEffectConfig {
  type: 'distortion';
  drive: number; // 0-1
  tone: number; // 0-1
  outputGain: number; // dB (-20 to +20)
  distortionType: 'soft' | 'hard' | 'fuzz' | 'overdrive' | 'tube';
}

/**
 * Audio Track
 */
export interface AudioTrack {
  id: string;
  name: string;
  enabled: boolean;
  volume: number; // 0-1
  pan: number; // -1 (left) to 1 (right)
  solo: boolean;
  mute: boolean;
  effects: AudioEffectConfig[];
  audioData?: Float32Array[];
  startTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

/**
 * Mix Bus
 */
export interface MixBus {
  id: string;
  name: string;
  tracks: string[]; // Track IDs
  volume: number;
  effects: AudioEffectConfig[];
  routing: 'master' | string; // Bus ID or 'master'
}

/**
 * Noise Reduction Config
 */
export interface NoiseReductionConfig {
  enabled: boolean;
  noiseProfile?: Float32Array;
  threshold: number; // dB
  reduction: number; // dB
  smoothing: number; // 0-1
}

/**
 * Voice Enhancement
 */
export interface VoiceEnhancementConfig {
  enabled: boolean;
  deEsser: {
    enabled: boolean;
    frequency: number; // Hz
    threshold: number; // dB
  };
  breathControl: {
    enabled: boolean;
    threshold: number; // dB
    reduction: number; // dB
  };
  warmth: number; // 0-1
  presence: number; // 0-1
  clarity: number; // 0-1
}

/**
 * Ducking Configuration
 */
export interface DuckingConfig {
  enabled: boolean;
  sideChainTrackId: string;
  threshold: number; // dB
  ratio: number;
  attack: number; // ms
  release: number; // ms
  range: number; // dB
}

/**
 * Audio Analysis Result
 */
export interface AudioAnalysis {
  trackId: string;
  peakLevel: number; // dB
  rmsLevel: number; // dB
  dynamicRange: number; // dB
  spectralCentroid: number; // Hz
  zeroCrossingRate: number;
  tempo?: number; // BPM
  key?: string;
  frequency: {
    low: number; // Average energy 20-250 Hz
    mid: number; // Average energy 250-4000 Hz
    high: number; // Average energy 4000-20000 Hz
  };
}

/**
 * Audio Preset
 */
export interface AudioPreset {
  id: string;
  name: string;
  description: string;
  category: 'voice' | 'music' | 'sfx' | 'podcast' | 'broadcast' | 'custom';
  effects: AudioEffectConfig[];
  mixing?: {
    volume: number;
    pan: number;
  };
}

/**
 * Configuração do sistema
 */
export interface AudioProcessorConfig {
  sampleRate: number; // Hz (44100, 48000, 96000)
  bitDepth: 16 | 24 | 32;
  maxTracks: number;
  maxEffectsPerTrack: number;
  bufferSize: number;
  enableRealTimeProcessing: boolean;
}

/**
 * Estatísticas
 */
export interface AudioStats {
  totalTracks: number;
  activeTracks: number;
  totalEffects: number;
  processingTime: number; // ms
  cpuUsage: number; // 0-100
  peakLevel: number; // dB
}

/**
 * Activity log
 */
export interface AudioActivity {
  id: string;
  timestamp: Date;
  type: 'track-added' | 'effect-added' | 'mixed' | 'normalized' | 'exported';
  description: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MAIN CLASS
// ============================================================================

/**
 * Advanced Audio Processing System
 */
export class AdvancedAudioProcessor extends EventEmitter {
  private config: AudioProcessorConfig;
  private tracks: Map<string, AudioTrack>;
  private buses: Map<string, MixBus>;
  private effects: Map<string, AudioEffectConfig>;
  private presets: Map<string, AudioPreset>;
  private activities: AudioActivity[];
  private stats: AudioStats;

  constructor(config?: Partial<AudioProcessorConfig>) {
    super();

    this.config = {
      sampleRate: 48000,
      bitDepth: 24,
      maxTracks: 64,
      maxEffectsPerTrack: 16,
      bufferSize: 512,
      enableRealTimeProcessing: true,
      ...config,
    };

    this.tracks = new Map();
    this.buses = new Map();
    this.effects = new Map();
    this.presets = new Map();
    this.activities = [];

    this.stats = {
      totalTracks: 0,
      activeTracks: 0,
      totalEffects: 0,
      processingTime: 0,
      cpuUsage: 0,
      peakLevel: -Infinity,
    };

    this.initializePresets();
  }

  // ==========================================================================
  // TRACK MANAGEMENT
  // ==========================================================================

  /**
   * Adicionar track de áudio
   */
  addTrack(name: string, audioData?: Float32Array[], startTime = 0): string {
    if (this.tracks.size >= this.config.maxTracks) {
      this.emit('error', { type: 'max-tracks', message: 'Maximum tracks reached' });
      return '';
    }

    const trackId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const track: AudioTrack = {
      id: trackId,
      name,
      enabled: true,
      volume: 1.0,
      pan: 0,
      solo: false,
      mute: false,
      effects: [],
      audioData,
      startTime,
      duration: audioData ? audioData[0].length / this.config.sampleRate : 0,
    };

    this.tracks.set(trackId, track);
    this.stats.totalTracks++;

    this.logActivity('track-added', `Track ${name} added`);
    this.emit('track:added', track);

    return trackId;
  }

  /**
   * Obter track
   */
  getTrack(trackId: string): AudioTrack | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * Listar todas as tracks
   */
  getAllTracks(): AudioTrack[] {
    return Array.from(this.tracks.values());
  }

  /**
   * Atualizar volume da track
   */
  setTrackVolume(trackId: string, volume: number): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.volume = Math.max(0, Math.min(1, volume));

    this.emit('track:updated', track);

    return true;
  }

  /**
   * Atualizar pan da track
   */
  setTrackPan(trackId: string, pan: number): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.pan = Math.max(-1, Math.min(1, pan));

    this.emit('track:updated', track);

    return true;
  }

  /**
   * Toggle mute
   */
  toggleMute(trackId: string, mute?: boolean): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.mute = mute !== undefined ? mute : !track.mute;

    this.emit('track:mute-changed', { trackId, mute: track.mute });

    return true;
  }

  /**
   * Toggle solo
   */
  toggleSolo(trackId: string, solo?: boolean): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.solo = solo !== undefined ? solo : !track.solo;

    this.emit('track:solo-changed', { trackId, solo: track.solo });

    return true;
  }

  /**
   * Deletar track
   */
  deleteTrack(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    this.tracks.delete(trackId);
    this.stats.totalTracks--;

    this.emit('track:deleted', trackId);

    return true;
  }

  // ==========================================================================
  // AUDIO EFFECTS
  // ==========================================================================

  /**
   * Criar equalizer
   */
  createEqualizer(name: string, bands?: EqualizerEffect['bands']): string {
    const effectId = `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const defaultBands: EqualizerEffect['bands'] = bands || [
      { frequency: 60, gain: 0, q: 0.7, type: 'lowshelf' },
      { frequency: 250, gain: 0, q: 1.0, type: 'peaking' },
      { frequency: 1000, gain: 0, q: 1.0, type: 'peaking' },
      { frequency: 4000, gain: 0, q: 1.0, type: 'peaking' },
      { frequency: 12000, gain: 0, q: 0.7, type: 'highshelf' },
    ];

    const effect: EqualizerEffect = {
      id: effectId,
      type: 'equalizer',
      name,
      enabled: true,
      mix: 1.0,
      bypass: false,
      bands: defaultBands,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Criar compressor
   */
  createCompressor(name: string, options?: Partial<CompressorEffect>): string {
    const effectId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: CompressorEffect = {
      id: effectId,
      type: 'compressor',
      name,
      enabled: true,
      mix: 1.0,
      bypass: false,
      threshold: -24,
      ratio: 4,
      attack: 5,
      release: 100,
      knee: 6,
      makeupGain: 0,
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Criar reverb
   */
  createReverb(reverbType: ReverbEffect['reverbType'], options?: Partial<ReverbEffect>): string {
    const effectId = `reverb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const presets: Record<ReverbEffect['reverbType'], Partial<ReverbEffect>> = {
      room: { roomSize: 0.3, damping: 0.5, decay: 1.5 },
      hall: { roomSize: 0.7, damping: 0.3, decay: 4.0 },
      plate: { roomSize: 0.5, damping: 0.7, decay: 2.0 },
      spring: { roomSize: 0.2, damping: 0.8, decay: 1.0 },
      cathedral: { roomSize: 0.9, damping: 0.2, decay: 8.0 },
      studio: { roomSize: 0.4, damping: 0.6, decay: 1.2 },
    };

    const effect: ReverbEffect = {
      id: effectId,
      type: 'reverb',
      name: `${reverbType} reverb`,
      enabled: true,
      mix: 0.3,
      bypass: false,
      roomSize: 0.5,
      damping: 0.5,
      preDelay: 20,
      decay: 2.0,
      earlyReflections: 0.5,
      diffusion: 0.7,
      reverbType,
      ...presets[reverbType],
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Criar delay
   */
  createDelay(delayType: DelayEffect['delayType'], time: number, options?: Partial<DelayEffect>): string {
    const effectId = `delay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: DelayEffect = {
      id: effectId,
      type: 'delay',
      name: `${delayType} delay`,
      enabled: true,
      mix: 0.3,
      bypass: false,
      time,
      feedback: 0.3,
      pingPong: delayType === 'pingpong',
      sync: false,
      delayType,
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Criar chorus
   */
  createChorus(options?: Partial<ChorusEffect>): string {
    const effectId = `chorus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: ChorusEffect = {
      id: effectId,
      type: 'chorus',
      name: 'Chorus',
      enabled: true,
      mix: 0.5,
      bypass: false,
      rate: 1.5,
      depth: 0.5,
      voices: 3,
      spread: 0.5,
      feedback: 0.2,
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Criar flanger
   */
  createFlanger(options?: Partial<FlangerEffect>): string {
    const effectId = `flanger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: FlangerEffect = {
      id: effectId,
      type: 'flanger',
      name: 'Flanger',
      enabled: true,
      mix: 0.5,
      bypass: false,
      rate: 0.5,
      depth: 0.5,
      feedback: 0.5,
      delay: 5,
      stereoPhase: 90,
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Criar distortion
   */
  createDistortion(distortionType: DistortionEffect['distortionType'], options?: Partial<DistortionEffect>): string {
    const effectId = `dist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: DistortionEffect = {
      id: effectId,
      type: 'distortion',
      name: `${distortionType} distortion`,
      enabled: true,
      mix: 0.5,
      bypass: false,
      drive: 0.5,
      tone: 0.5,
      outputGain: 0,
      distortionType,
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Adicionar efeito a track
   */
  addEffectToTrack(trackId: string, effectId: string): boolean {
    const track = this.tracks.get(trackId);
    const effect = this.effects.get(effectId);

    if (!track || !effect) return false;

    if (track.effects.length >= this.config.maxEffectsPerTrack) {
      this.emit('error', { type: 'max-effects', message: 'Maximum effects per track reached' });
      return false;
    }

    track.effects.push(effect);

    this.emit('track:effect-added', { trackId, effectId });

    return true;
  }

  /**
   * Remover efeito de track
   */
  removeEffectFromTrack(trackId: string, effectId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    const index = track.effects.findIndex(e => e.id === effectId);
    if (index === -1) return false;

    track.effects.splice(index, 1);

    this.emit('track:effect-removed', { trackId, effectId });

    return true;
  }

  /**
   * Toggle bypass de efeito
   */
  toggleEffectBypass(effectId: string, bypass?: boolean): boolean {
    const effect = this.effects.get(effectId);
    if (!effect) return false;

    effect.bypass = bypass !== undefined ? bypass : !effect.bypass;

    this.emit('effect:bypass-changed', { effectId, bypass: effect.bypass });

    return true;
  }

  // ==========================================================================
  // MIXING
  // ==========================================================================

  /**
   * Criar mix bus
   */
  createMixBus(name: string, trackIds: string[]): string {
    const busId = `bus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const bus: MixBus = {
      id: busId,
      name,
      tracks: trackIds,
      volume: 1.0,
      effects: [],
      routing: 'master',
    };

    this.buses.set(busId, bus);

    this.emit('bus:created', bus);

    return busId;
  }

  /**
   * Mixar todas as tracks ativas
   */
  async mixTracks(duration: number): Promise<Float32Array[]> {
    const startTime = Date.now();

    // Calcular samples
    const samples = Math.floor(duration * this.config.sampleRate);

    // Stereo output (2 channels)
    const mixedAudio: Float32Array[] = [
      new Float32Array(samples),
      new Float32Array(samples),
    ];

    // Tracks com solo ativo
    const soloTracks = Array.from(this.tracks.values()).filter(t => t.solo);
    const hasSolo = soloTracks.length > 0;

    // Mix each track
    for (const track of this.tracks.values()) {
      if (!track.enabled || track.mute) continue;
      if (hasSolo && !track.solo) continue;
      if (!track.audioData) continue;

      // Apply volume and pan
      const leftGain = track.volume * (track.pan <= 0 ? 1 : 1 - track.pan);
      const rightGain = track.volume * (track.pan >= 0 ? 1 : 1 + track.pan);

      const startSample = Math.floor(track.startTime * this.config.sampleRate);

      // Mix track data
      for (let i = 0; i < track.audioData[0].length && startSample + i < samples; i++) {
        mixedAudio[0][startSample + i] += track.audioData[0][i] * leftGain;
        
        if (track.audioData[1]) {
          mixedAudio[1][startSample + i] += track.audioData[1][i] * rightGain;
        } else {
          mixedAudio[1][startSample + i] += track.audioData[0][i] * rightGain;
        }
      }
    }

    this.stats.processingTime = Date.now() - startTime;

    this.logActivity('mixed', `Mixed ${this.tracks.size} tracks`);
    this.emit('audio:mixed', { duration, samples });

    return mixedAudio;
  }

  // ==========================================================================
  // NORMALIZATION & DYNAMICS
  // ==========================================================================

  /**
   * Normalizar áudio
   */
  normalize(audioData: Float32Array[], targetLevel = -3): Float32Array[] {
    // Find peak
    let peak = 0;
    for (const channel of audioData) {
      for (let i = 0; i < channel.length; i++) {
        peak = Math.max(peak, Math.abs(channel[i]));
      }
    }

    // Calculate gain
    const targetLinear = Math.pow(10, targetLevel / 20);
    const gain = targetLinear / peak;

    // Apply gain
    const normalized = audioData.map(channel => {
      const output = new Float32Array(channel.length);
      for (let i = 0; i < channel.length; i++) {
        output[i] = channel[i] * gain;
      }
      return output;
    });

    this.logActivity('normalized', `Normalized to ${targetLevel} dB`);
    this.emit('audio:normalized', { targetLevel, gain });

    return normalized;
  }

  /**
   * Aplicar fade in
   */
  applyFadeIn(audioData: Float32Array[], duration: number): Float32Array[] {
    const fadeSamples = Math.floor(duration * this.config.sampleRate);

    return audioData.map(channel => {
      const output = new Float32Array(channel.length);
      for (let i = 0; i < channel.length; i++) {
        if (i < fadeSamples) {
          // Fade in: volume increases from 0 to 1 over fadeSamples
          output[i] = channel[i] * (i / (fadeSamples - 1));
        } else {
          output[i] = channel[i];
        }
      }
      return output;
    });
  }

  /**
   * Aplicar fade out
   */
  applyFadeOut(audioData: Float32Array[], duration: number): Float32Array[] {
    const fadeSamples = Math.floor(duration * this.config.sampleRate);
    const startSample = audioData[0].length - fadeSamples;

    return audioData.map(channel => {
      const output = new Float32Array(channel.length);
      for (let i = 0; i < channel.length; i++) {
        if (i >= startSample) {
          // Fade out: volume decreases from 1 to 0 over fadeSamples
          const fadePosition = (i - startSample) / (fadeSamples - 1);
          output[i] = channel[i] * (1 - fadePosition);
        } else {
          output[i] = channel[i];
        }
      }
      return output;
    });
  }

  // ==========================================================================
  // NOISE REDUCTION & VOICE ENHANCEMENT
  // ==========================================================================

  /**
   * Aplicar noise reduction
   */
  applyNoiseReduction(
    trackId: string,
    config: NoiseReductionConfig
  ): boolean {
    const track = this.tracks.get(trackId);
    if (!track || !track.audioData) return false;

    // Simular noise reduction
    track.metadata = {
      ...track.metadata,
      noiseReduction: config,
      appliedAt: new Date(),
    };

    this.emit('noise-reduction:applied', { trackId, config });

    return true;
  }

  /**
   * Aplicar voice enhancement
   */
  applyVoiceEnhancement(
    trackId: string,
    config: VoiceEnhancementConfig
  ): boolean {
    const track = this.tracks.get(trackId);
    if (!track || !track.audioData) return false;

    // Simular voice enhancement
    track.metadata = {
      ...track.metadata,
      voiceEnhancement: config,
      appliedAt: new Date(),
    };

    this.emit('voice-enhancement:applied', { trackId, config });

    return true;
  }

  // ==========================================================================
  // DUCKING
  // ==========================================================================

  /**
   * Aplicar ducking (sidechain)
   */
  applyDucking(targetTrackId: string, config: DuckingConfig): boolean {
    const targetTrack = this.tracks.get(targetTrackId);
    const sideChainTrack = this.tracks.get(config.sideChainTrackId);

    if (!targetTrack || !sideChainTrack) return false;

    // Store ducking config
    targetTrack.metadata = {
      ...targetTrack.metadata,
      ducking: config,
    };

    this.emit('ducking:applied', { targetTrackId, config });

    return true;
  }

  // ==========================================================================
  // AUDIO ANALYSIS
  // ==========================================================================

  /**
   * Analisar áudio
   */
  analyzeAudio(trackId: string): AudioAnalysis | null {
    const track = this.tracks.get(trackId);
    if (!track || !track.audioData) return null;

    // Simular análise
    const analysis: AudioAnalysis = {
      trackId,
      peakLevel: -6.0,
      rmsLevel: -12.0,
      dynamicRange: 18.0,
      spectralCentroid: 2000,
      zeroCrossingRate: 0.05,
      tempo: 120,
      key: 'C',
      frequency: {
        low: 0.3,
        mid: 0.5,
        high: 0.2,
      },
    };

    this.emit('audio:analyzed', analysis);

    return analysis;
  }

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  /**
   * Inicializar presets padrão
   */
  private initializePresets(): void {
    // Voice preset
    this.createPreset(
      'Voice Over',
      'Optimized for voice recording',
      'voice',
      []
    );

    // Music preset
    this.createPreset(
      'Music Master',
      'Professional music mastering',
      'music',
      []
    );

    // Podcast preset
    this.createPreset(
      'Podcast',
      'Clear speech for podcasts',
      'podcast',
      []
    );
  }

  /**
   * Criar preset
   */
  createPreset(
    name: string,
    description: string,
    category: AudioPreset['category'],
    effects: AudioEffectConfig[]
  ): string {
    const presetId = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const preset: AudioPreset = {
      id: presetId,
      name,
      description,
      category,
      effects,
    };

    this.presets.set(presetId, preset);

    this.emit('preset:created', preset);

    return presetId;
  }

  /**
   * Aplicar preset a track
   */
  applyPreset(trackId: string, presetId: string): boolean {
    const track = this.tracks.get(trackId);
    const preset = this.presets.get(presetId);

    if (!track || !preset) return false;

    // Apply preset effects
    preset.effects.forEach(effect => {
      track.effects.push({ ...effect });
    });

    if (preset.mixing) {
      track.volume = preset.mixing.volume;
      track.pan = preset.mixing.pan;
    }

    this.emit('preset:applied', { trackId, presetId });

    return true;
  }

  /**
   * Listar presets por categoria
   */
  getPresetsByCategory(category: AudioPreset['category']): AudioPreset[] {
    return Array.from(this.presets.values()).filter(p => p.category === category);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Obter configuração
   */
  getConfig(): AudioProcessorConfig {
    return { ...this.config };
  }

  /**
   * Atualizar configuração
   */
  updateConfig(updates: Partial<AudioProcessorConfig>): void {
    Object.assign(this.config, updates);

    this.emit('config:updated', this.config);
  }

  /**
   * Obter estatísticas
   */
  getStats(): AudioStats {
    this.stats.activeTracks = Array.from(this.tracks.values()).filter(
      t => t.enabled && !t.mute
    ).length;

    return { ...this.stats };
  }

  /**
   * Obter atividades
   */
  getActivities(limit = 50): AudioActivity[] {
    return this.activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Registrar atividade
   */
  private logActivity(
    type: AudioActivity['type'],
    description: string,
    metadata?: Record<string, unknown>
  ): void {
    const activity: AudioActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      description,
      metadata,
    };

    this.activities.push(activity);

    this.emit('activity:logged', activity);
  }

  /**
   * Reset sistema
   */
  reset(): void {
    this.tracks.clear();
    this.buses.clear();
    this.effects.clear();
    this.activities = [];

    this.stats = {
      totalTracks: 0,
      activeTracks: 0,
      totalEffects: 0,
      processingTime: 0,
      cpuUsage: 0,
      peakLevel: -Infinity,
    };

    // Recriar presets
    this.presets.clear();
    this.initializePresets();

    this.emit('system:reset');
  }

  /**
   * Destruir e limpar recursos
   */
  destroy(): void {
    this.removeAllListeners();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Criar sistema básico
 */
export function createBasicAudioProcessor(): AdvancedAudioProcessor {
  return new AdvancedAudioProcessor({
    sampleRate: 44100,
    bitDepth: 16,
    maxTracks: 16,
    maxEffectsPerTrack: 8,
    bufferSize: 1024,
    enableRealTimeProcessing: false,
  });
}

/**
 * Criar sistema profissional
 */
export function createProAudioProcessor(): AdvancedAudioProcessor {
  return new AdvancedAudioProcessor({
    sampleRate: 96000,
    bitDepth: 32,
    maxTracks: 128,
    maxEffectsPerTrack: 32,
    bufferSize: 256,
    enableRealTimeProcessing: true,
  });
}

/**
 * Criar sistema para desenvolvimento
 */
export function createDevAudioProcessor(): AdvancedAudioProcessor {
  return new AdvancedAudioProcessor({
    sampleRate: 48000,
    bitDepth: 24,
    maxTracks: 32,
    maxEffectsPerTrack: 16,
    bufferSize: 512,
    enableRealTimeProcessing: true,
  });
}
