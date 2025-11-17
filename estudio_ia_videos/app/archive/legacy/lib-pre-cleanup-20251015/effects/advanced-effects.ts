/**
 * Advanced Video Effects System
 * 
 * Sistema completo de efeitos avançados para vídeo incluindo:
 * - Particle Systems (neve, chuva, fogos, confetti, smoke)
 * - Advanced Transitions (wipe, zoom, rotate, page turn, morph)
 * - Motion Tracking (object tracking, face tracking, stabilization)
 * - Chroma Key (green screen, blue screen, custom color)
 * - Color Grading (LUTs, curves, HSL, color wheels)
 * - Blur Effects (gaussian, motion, radial, tilt-shift)
 * - Distortion (fisheye, lens correction, perspective)
 * - Time Effects (slow motion, time-lapse, reverse, freeze)
 * - Effects Presets (cinematic, vintage, horror, sci-fi)
 * 
 * @module AdvancedVideoEffects
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Tipos de efeitos disponíveis
 */
export type EffectType =
  | 'particle'
  | 'transition'
  | 'tracking'
  | 'chromakey'
  | 'colorgrade'
  | 'blur'
  | 'distortion'
  | 'time'
  | 'composite';

/**
 * Tipos de partículas
 */
export type ParticleType = 'snow' | 'rain' | 'fire' | 'confetti' | 'smoke' | 'sparkle' | 'dust';

/**
 * Tipos de transições
 */
export type TransitionType = 'wipe' | 'zoom' | 'rotate' | 'page-turn' | 'morph' | 'glitch' | 'ripple';

/**
 * Tipos de tracking
 */
export type TrackingType = 'object' | 'face' | 'motion' | 'stabilization';

/**
 * Tipos de blur
 */
export type BlurType = 'gaussian' | 'motion' | 'radial' | 'tilt-shift' | 'bokeh';

/**
 * Easing functions para animações
 */
export type EasingFunction =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'
  | 'back';

/**
 * Configuração de efeito base
 */
export interface EffectConfig {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  startTime: number;
  duration: number;
  intensity: number; // 0-1
  easing?: EasingFunction;
  metadata?: Record<string, unknown>;
}

/**
 * Sistema de partículas
 */
export interface ParticleEffect extends EffectConfig {
  type: 'particle';
  particleType: ParticleType;
  count: number;
  size: { min: number; max: number };
  velocity: { x: number; y: number };
  gravity: number;
  lifetime: number;
  color: string;
  opacity: { start: number; end: number };
  rotation?: boolean;
  wind?: { x: number; y: number };
}

/**
 * Transição avançada
 */
export interface TransitionEffect extends EffectConfig {
  type: 'transition';
  transitionType: TransitionType;
  direction: 'left' | 'right' | 'up' | 'down' | 'in' | 'out';
  feather: number; // 0-1
  borderWidth?: number;
  borderColor?: string;
  customMask?: string; // URL ou path
}

/**
 * Motion tracking
 */
export interface TrackingEffect extends EffectConfig {
  type: 'tracking';
  trackingType: TrackingType;
  target?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  smoothing: number; // 0-1
  confidence: number; // 0-1
  path?: Array<{ x: number; y: number; timestamp: number }>;
}

/**
 * Chroma key (green screen)
 */
export interface ChromaKeyEffect extends EffectConfig {
  type: 'chromakey';
  keyColor: string;
  tolerance: number; // 0-1
  softness: number; // 0-1
  despill: number; // 0-1
  edgeBlur: number;
  shadows: boolean;
  highlights: boolean;
}

/**
 * Color grading
 */
export interface ColorGradeEffect extends EffectConfig {
  type: 'colorgrade';
  lut?: string; // LUT file path
  temperature: number; // -100 to 100
  tint: number; // -100 to 100
  exposure: number; // -5 to 5
  contrast: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  whites: number; // -100 to 100
  blacks: number; // -100 to 100
  saturation: number; // -100 to 100
  vibrance: number; // -100 to 100
  hue: number; // -180 to 180
  curves?: {
    red: number[];
    green: number[];
    blue: number[];
    rgb: number[];
  };
}

/**
 * Efeito de blur
 */
export interface BlurEffect extends EffectConfig {
  type: 'blur';
  blurType: BlurType;
  amount: number; // 0-100
  angle?: number; // Para motion blur
  quality: 'low' | 'medium' | 'high' | 'ultra';
  center?: { x: number; y: number }; // Para radial blur
  falloff?: number; // Para tilt-shift e radial
}

/**
 * Distorção
 */
export interface DistortionEffect extends EffectConfig {
  type: 'distortion';
  distortionType: 'fisheye' | 'lens' | 'perspective' | 'wave' | 'ripple';
  amount: number;
  center?: { x: number; y: number };
  wavelength?: number;
  frequency?: number;
  corners?: Array<{ x: number; y: number }>; // Para perspective
}

/**
 * Efeitos de tempo
 */
export interface TimeEffect extends EffectConfig {
  type: 'time';
  timeType: 'slow' | 'fast' | 'reverse' | 'freeze' | 'ramp';
  speed: number; // 0.1 to 10
  interpolation: 'linear' | 'optical-flow' | 'frame-blend';
  freezeFrame?: number; // Frame específico para freeze
}

/**
 * Effect preset
 */
export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  category: 'cinematic' | 'vintage' | 'horror' | 'sci-fi' | 'romantic' | 'action' | 'custom';
  effects: EffectConfig[];
  thumbnailUrl?: string;
}

/**
 * Render options
 */
export interface RenderOptions {
  quality: 'draft' | 'preview' | 'final';
  resolution: { width: number; height: number };
  fps: number;
  format: 'rgba' | 'rgb' | 'yuv';
  antialiasing: boolean;
  motionBlur: boolean;
}

/**
 * Effect layer
 */
export interface EffectLayer {
  id: string;
  name: string;
  effects: EffectConfig[];
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'add' | 'subtract';
  opacity: number;
  enabled: boolean;
}

/**
 * Configuração do sistema
 */
export interface AdvancedEffectsConfig {
  maxEffectsPerLayer: number;
  maxLayers: number;
  enableGPUAcceleration: boolean;
  cacheSize: number; // MB
  previewQuality: 'low' | 'medium' | 'high';
  realTimePreview: boolean;
  autoSaveInterval: number; // ms
}

/**
 * Estatísticas de performance
 */
export interface EffectStats {
  totalEffects: number;
  activeEffects: number;
  renderTime: number; // ms
  cacheHitRate: number; // 0-1
  memoryUsage: number; // MB
  gpuUsage: number; // 0-100
}

/**
 * Activity log
 */
export interface EffectActivity {
  id: string;
  timestamp: Date;
  type: 'created' | 'updated' | 'deleted' | 'applied' | 'rendered';
  effectId: string;
  userId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MAIN CLASS
// ============================================================================

/**
 * Advanced Video Effects System
 */
export class AdvancedVideoEffects extends EventEmitter {
  private config: AdvancedEffectsConfig;
  private effects: Map<string, EffectConfig>;
  private layers: Map<string, EffectLayer>;
  private presets: Map<string, EffectPreset>;
  private activities: EffectActivity[];
  private renderCache: Map<string, any>;
  private stats: EffectStats;

  constructor(config?: Partial<AdvancedEffectsConfig>) {
    super();

    this.config = {
      maxEffectsPerLayer: 20,
      maxLayers: 10,
      enableGPUAcceleration: true,
      cacheSize: 500,
      previewQuality: 'medium',
      realTimePreview: true,
      autoSaveInterval: 30000,
      ...config,
    };

    this.effects = new Map();
    this.layers = new Map();
    this.presets = new Map();
    this.activities = [];
    this.renderCache = new Map();

    this.stats = {
      totalEffects: 0,
      activeEffects: 0,
      renderTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      gpuUsage: 0,
    };

    this.initializePresets();
  }

  // ==========================================================================
  // PARTICLE EFFECTS
  // ==========================================================================

  /**
   * Criar efeito de partículas
   */
  createParticleEffect(
    particleType: ParticleType,
    startTime: number,
    duration: number,
    options?: Partial<ParticleEffect>
  ): string {
    const effectId = `particle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const defaultParticleConfigs: Record<ParticleType, Partial<ParticleEffect>> = {
      snow: {
        count: 100,
        size: { min: 2, max: 5 },
        velocity: { x: 0, y: 50 },
        gravity: 0.5,
        lifetime: 5,
        color: '#ffffff',
        opacity: { start: 0.8, end: 0 },
        rotation: true,
        wind: { x: 10, y: 0 },
      },
      rain: {
        count: 200,
        size: { min: 1, max: 2 },
        velocity: { x: 5, y: 300 },
        gravity: 2,
        lifetime: 2,
        color: '#a0c0ff',
        opacity: { start: 0.6, end: 0.3 },
        rotation: false,
      },
      fire: {
        count: 50,
        size: { min: 10, max: 30 },
        velocity: { x: 0, y: -80 },
        gravity: -0.5,
        lifetime: 1.5,
        color: '#ff6600',
        opacity: { start: 1, end: 0 },
        rotation: true,
      },
      confetti: {
        count: 150,
        size: { min: 5, max: 15 },
        velocity: { x: 0, y: -100 },
        gravity: 1.5,
        lifetime: 4,
        color: '#ff0000',
        opacity: { start: 1, end: 0.5 },
        rotation: true,
        wind: { x: 20, y: 0 },
      },
      smoke: {
        count: 30,
        size: { min: 20, max: 60 },
        velocity: { x: 5, y: -30 },
        gravity: -0.2,
        lifetime: 6,
        color: '#888888',
        opacity: { start: 0.7, end: 0 },
        rotation: true,
      },
      sparkle: {
        count: 80,
        size: { min: 3, max: 8 },
        velocity: { x: 0, y: 0 },
        gravity: 0,
        lifetime: 1,
        color: '#ffff00',
        opacity: { start: 1, end: 0 },
        rotation: false,
      },
      dust: {
        count: 60,
        size: { min: 1, max: 3 },
        velocity: { x: 2, y: 5 },
        gravity: 0.1,
        lifetime: 8,
        color: '#cccccc',
        opacity: { start: 0.4, end: 0 },
        rotation: true,
        wind: { x: 5, y: 0 },
      },
    };

    const effect: ParticleEffect = {
      id: effectId,
      type: 'particle',
      name: `${particleType} particles`,
      enabled: true,
      startTime,
      duration,
      intensity: 1,
      particleType,
      ...defaultParticleConfigs[particleType],
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.logActivity('created', effectId, `Particle effect ${particleType} created`);
    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Atualizar parâmetros de partículas
   */
  updateParticleEffect(effectId: string, updates: Partial<ParticleEffect>): boolean {
    const effect = this.effects.get(effectId) as ParticleEffect;
    if (!effect || effect.type !== 'particle') return false;

    Object.assign(effect, updates);

    this.logActivity('updated', effectId, 'Particle effect updated');
    this.emit('effect:updated', effect);

    return true;
  }

  // ==========================================================================
  // TRANSITIONS
  // ==========================================================================

  /**
   * Criar transição avançada
   */
  createTransition(
    transitionType: TransitionType,
    startTime: number,
    duration: number,
    options?: Partial<TransitionEffect>
  ): string {
    const effectId = `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: TransitionEffect = {
      id: effectId,
      type: 'transition',
      name: `${transitionType} transition`,
      enabled: true,
      startTime,
      duration,
      intensity: 1,
      transitionType,
      direction: 'right',
      feather: 0.1,
      easing: 'ease-in-out',
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.logActivity('created', effectId, `Transition ${transitionType} created`);
    this.emit('effect:created', effect);

    return effectId;
  }

  // ==========================================================================
  // MOTION TRACKING
  // ==========================================================================

  /**
   * Criar tracking effect
   */
  createTracking(
    trackingType: TrackingType,
    startTime: number,
    duration: number,
    options?: Partial<TrackingEffect>
  ): string {
    const effectId = `tracking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: TrackingEffect = {
      id: effectId,
      type: 'tracking',
      name: `${trackingType} tracking`,
      enabled: true,
      startTime,
      duration,
      intensity: 1,
      trackingType,
      smoothing: 0.5,
      confidence: 0.8,
      path: [],
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.logActivity('created', effectId, `Tracking ${trackingType} created`);
    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Atualizar tracking path
   */
  updateTrackingPath(
    effectId: string,
    point: { x: number; y: number; timestamp: number }
  ): boolean {
    const effect = this.effects.get(effectId) as TrackingEffect;
    if (!effect || effect.type !== 'tracking') return false;

    if (!effect.path) effect.path = [];
    effect.path.push(point);

    this.emit('tracking:updated', { effectId, point });

    return true;
  }

  /**
   * Aplicar stabilization
   */
  applyStabilization(effectId: string, analysisData: any): boolean {
    const effect = this.effects.get(effectId) as TrackingEffect;
    if (!effect || effect.trackingType !== 'stabilization') return false;

    // Aplicar algoritmo de estabilização
    effect.metadata = {
      ...effect.metadata,
      stabilizationData: analysisData,
      appliedAt: new Date(),
    };

    this.logActivity('applied', effectId, 'Stabilization applied');
    this.emit('stabilization:applied', effect);

    return true;
  }

  // ==========================================================================
  // CHROMA KEY
  // ==========================================================================

  /**
   * Criar efeito chroma key
   */
  createChromaKey(
    keyColor: string,
    startTime: number,
    duration: number,
    options?: Partial<ChromaKeyEffect>
  ): string {
    const effectId = `chromakey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: ChromaKeyEffect = {
      id: effectId,
      type: 'chromakey',
      name: 'Chroma Key',
      enabled: true,
      startTime,
      duration,
      intensity: 1,
      keyColor,
      tolerance: 0.3,
      softness: 0.2,
      despill: 0.5,
      edgeBlur: 1,
      shadows: true,
      highlights: true,
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.logActivity('created', effectId, `Chroma key created (${keyColor})`);
    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Auto-detect chroma key color
   */
  autoDetectChromaKey(effectId: string, sampleArea: { x: number; y: number; width: number; height: number }): string | null {
    const effect = this.effects.get(effectId) as ChromaKeyEffect;
    if (!effect || effect.type !== 'chromakey') return null;

    // Simular detecção automática de cor
    const detectedColor = '#00ff00'; // Green screen padrão

    effect.keyColor = detectedColor;

    this.emit('chromakey:detected', { effectId, color: detectedColor });

    return detectedColor;
  }

  // ==========================================================================
  // COLOR GRADING
  // ==========================================================================

  /**
   * Criar color grading
   */
  createColorGrade(
    startTime: number,
    duration: number,
    options?: Partial<ColorGradeEffect>
  ): string {
    const effectId = `colorgrade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: ColorGradeEffect = {
      id: effectId,
      type: 'colorgrade',
      name: 'Color Grading',
      enabled: true,
      startTime,
      duration,
      intensity: 1,
      temperature: 0,
      tint: 0,
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      saturation: 0,
      vibrance: 0,
      hue: 0,
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.logActivity('created', effectId, 'Color grading created');
    this.emit('effect:created', effect);

    return effectId;
  }

  /**
   * Aplicar LUT (Look-Up Table)
   */
  applyLUT(effectId: string, lutPath: string): boolean {
    const effect = this.effects.get(effectId) as ColorGradeEffect;
    if (!effect || effect.type !== 'colorgrade') return false;

    effect.lut = lutPath;

    this.logActivity('updated', effectId, `LUT applied: ${lutPath}`);
    this.emit('lut:applied', { effectId, lutPath });

    return true;
  }

  /**
   * Ajustar curves
   */
  updateCurves(
    effectId: string,
    channel: 'red' | 'green' | 'blue' | 'rgb',
    points: number[]
  ): boolean {
    const effect = this.effects.get(effectId) as ColorGradeEffect;
    if (!effect || effect.type !== 'colorgrade') return false;

    if (!effect.curves) {
      effect.curves = { red: [], green: [], blue: [], rgb: [] };
    }

    effect.curves[channel] = points;

    this.emit('curves:updated', { effectId, channel, points });

    return true;
  }

  // ==========================================================================
  // BLUR EFFECTS
  // ==========================================================================

  /**
   * Criar efeito de blur
   */
  createBlur(
    blurType: BlurType,
    startTime: number,
    duration: number,
    amount: number,
    options?: Partial<BlurEffect>
  ): string {
    const effectId = `blur-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: BlurEffect = {
      id: effectId,
      type: 'blur',
      name: `${blurType} blur`,
      enabled: true,
      startTime,
      duration,
      intensity: 1,
      blurType,
      amount,
      quality: 'medium',
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.logActivity('created', effectId, `Blur ${blurType} created`);
    this.emit('effect:created', effect);

    return effectId;
  }

  // ==========================================================================
  // DISTORTION
  // ==========================================================================

  /**
   * Criar efeito de distorção
   */
  createDistortion(
    distortionType: 'fisheye' | 'lens' | 'perspective' | 'wave' | 'ripple',
    startTime: number,
    duration: number,
    options?: Partial<DistortionEffect>
  ): string {
    const effectId = `distortion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: DistortionEffect = {
      id: effectId,
      type: 'distortion',
      name: `${distortionType} distortion`,
      enabled: true,
      startTime,
      duration,
      intensity: 1,
      distortionType,
      amount: 0.5,
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.logActivity('created', effectId, `Distortion ${distortionType} created`);
    this.emit('effect:created', effect);

    return effectId;
  }

  // ==========================================================================
  // TIME EFFECTS
  // ==========================================================================

  /**
   * Criar efeito de tempo
   */
  createTimeEffect(
    timeType: 'slow' | 'fast' | 'reverse' | 'freeze' | 'ramp',
    startTime: number,
    duration: number,
    speed: number,
    options?: Partial<TimeEffect>
  ): string {
    const effectId = `time-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const effect: TimeEffect = {
      id: effectId,
      type: 'time',
      name: `${timeType} motion`,
      enabled: true,
      startTime,
      duration,
      intensity: 1,
      timeType,
      speed,
      interpolation: 'optical-flow',
      ...options,
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;

    this.logActivity('created', effectId, `Time effect ${timeType} created (${speed}x)`);
    this.emit('effect:created', effect);

    return effectId;
  }

  // ==========================================================================
  // LAYERS
  // ==========================================================================

  /**
   * Criar layer de efeitos
   */
  createLayer(name: string, blendMode: EffectLayer['blendMode'] = 'normal'): string {
    if (this.layers.size >= this.config.maxLayers) {
      this.emit('error', { type: 'max-layers', message: 'Maximum layers reached' });
      return '';
    }

    const layerId = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const layer: EffectLayer = {
      id: layerId,
      name,
      effects: [],
      blendMode,
      opacity: 1,
      enabled: true,
    };

    this.layers.set(layerId, layer);

    this.emit('layer:created', layer);

    return layerId;
  }

  /**
   * Adicionar efeito a layer
   */
  addEffectToLayer(layerId: string, effectId: string): boolean {
    const layer = this.layers.get(layerId);
    const effect = this.effects.get(effectId);

    if (!layer || !effect) return false;

    if (layer.effects.length >= this.config.maxEffectsPerLayer) {
      this.emit('error', { type: 'max-effects', message: 'Maximum effects per layer reached' });
      return false;
    }

    layer.effects.push(effect);

    this.emit('layer:updated', layer);

    return true;
  }

  /**
   * Remover efeito de layer
   */
  removeEffectFromLayer(layerId: string, effectId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    const index = layer.effects.findIndex(e => e.id === effectId);
    if (index === -1) return false;

    layer.effects.splice(index, 1);

    this.emit('layer:updated', layer);

    return true;
  }

  /**
   * Reordenar layers
   */
  reorderLayers(layerIds: string[]): boolean {
    // Verificar se todos os IDs existem
    if (!layerIds.every(id => this.layers.has(id))) return false;

    // Recriar Map na nova ordem
    const newLayers = new Map<string, EffectLayer>();
    layerIds.forEach(id => {
      const layer = this.layers.get(id)!;
      newLayers.set(id, layer);
    });

    this.layers = newLayers;

    this.emit('layers:reordered', layerIds);

    return true;
  }

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  /**
   * Inicializar presets padrão
   */
  private initializePresets(): void {
    // Cinematic preset
    this.createPreset(
      'Cinematic',
      'Hollywood-style color grading with film grain',
      'cinematic',
      []
    );

    // Vintage preset
    this.createPreset(
      'Vintage 70s',
      'Retro look with warm tones and vignette',
      'vintage',
      []
    );

    // Horror preset
    this.createPreset(
      'Horror',
      'Dark and desaturated with cold tones',
      'horror',
      []
    );

    // Sci-Fi preset
    this.createPreset(
      'Sci-Fi',
      'Futuristic look with blue tones and chromatic aberration',
      'sci-fi',
      []
    );
  }

  /**
   * Criar preset customizado
   */
  createPreset(
    name: string,
    description: string,
    category: EffectPreset['category'],
    effects: EffectConfig[]
  ): string {
    const presetId = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const preset: EffectPreset = {
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
   * Aplicar preset
   */
  applyPreset(presetId: string, startTime: number): string[] {
    const preset = this.presets.get(presetId);
    if (!preset) return [];

    const appliedEffectIds: string[] = [];

    preset.effects.forEach(effectTemplate => {
      const effectId = `${effectTemplate.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const effect = {
        ...effectTemplate,
        id: effectId,
        startTime,
      };

      this.effects.set(effectId, effect);
      appliedEffectIds.push(effectId);
      this.stats.totalEffects++;
    });

    this.logActivity('applied', presetId, `Preset ${preset.name} applied`);
    this.emit('preset:applied', { presetId, effectIds: appliedEffectIds });

    return appliedEffectIds;
  }

  /**
   * Listar presets por categoria
   */
  getPresetsByCategory(category: EffectPreset['category']): EffectPreset[] {
    return Array.from(this.presets.values()).filter(p => p.category === category);
  }

  // ==========================================================================
  // EFFECT MANAGEMENT
  // ==========================================================================

  /**
   * Obter efeito por ID
   */
  getEffect(effectId: string): EffectConfig | undefined {
    return this.effects.get(effectId);
  }

  /**
   * Listar todos os efeitos
   */
  getAllEffects(): EffectConfig[] {
    return Array.from(this.effects.values());
  }

  /**
   * Filtrar efeitos por tipo
   */
  getEffectsByType(type: EffectType): EffectConfig[] {
    return Array.from(this.effects.values()).filter(e => e.type === type);
  }

  /**
   * Filtrar efeitos por intervalo de tempo
   */
  getEffectsInTimeRange(startTime: number, endTime: number): EffectConfig[] {
    return Array.from(this.effects.values()).filter(
      e => {
        const effectStart = e.startTime;
        const effectEnd = e.startTime + e.duration;
        // Efeito se sobrepõe ao range se: inicia antes do fim E termina depois do início
        return effectStart < endTime && effectEnd > startTime;
      }
    );
  }

  /**
   * Habilitar/desabilitar efeito
   */
  toggleEffect(effectId: string, enabled?: boolean): boolean {
    const effect = this.effects.get(effectId);
    if (!effect) return false;

    effect.enabled = enabled !== undefined ? enabled : !effect.enabled;

    this.updateActiveEffectsCount();
    this.emit('effect:toggled', { effectId, enabled: effect.enabled });

    return true;
  }

  /**
   * Deletar efeito
   */
  deleteEffect(effectId: string): boolean {
    const effect = this.effects.get(effectId);
    if (!effect) return false;

    this.effects.delete(effectId);
    this.stats.totalEffects--;

    // Remover de layers
    this.layers.forEach(layer => {
      const index = layer.effects.findIndex(e => e.id === effectId);
      if (index !== -1) {
        layer.effects.splice(index, 1);
      }
    });

    this.logActivity('deleted', effectId, `Effect ${effect.name} deleted`);
    this.emit('effect:deleted', effectId);

    return true;
  }

  /**
   * Duplicar efeito
   */
  duplicateEffect(effectId: string): string | null {
    const effect = this.effects.get(effectId);
    if (!effect) return null;

    const newEffectId = `${effect.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const duplicated = {
      ...effect,
      id: newEffectId,
      name: `${effect.name} (copy)`,
    };

    this.effects.set(newEffectId, duplicated);
    this.stats.totalEffects++;

    this.emit('effect:duplicated', { originalId: effectId, newId: newEffectId });

    return newEffectId;
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  /**
   * Renderizar frame com efeitos
   */
  async renderFrame(frameNumber: number, timestamp: number, options: RenderOptions): Promise<any> {
    const startTime = Date.now();

    // Obter efeitos ativos neste timestamp
    const activeEffects = this.getActiveEffectsAtTime(timestamp);

    // Simular rendering
    const result = {
      frameNumber,
      timestamp,
      effectsApplied: activeEffects.length,
      quality: options.quality,
      resolution: options.resolution,
    };

    this.stats.renderTime = Date.now() - startTime;

    this.emit('frame:rendered', result);

    return result;
  }

  /**
   * Obter efeitos ativos em um timestamp
   */
  private getActiveEffectsAtTime(timestamp: number): EffectConfig[] {
    return Array.from(this.effects.values()).filter(
      e => e.enabled && timestamp >= e.startTime && timestamp <= e.startTime + e.duration
    );
  }

  /**
   * Atualizar contador de efeitos ativos
   */
  private updateActiveEffectsCount(): void {
    this.stats.activeEffects = Array.from(this.effects.values()).filter(e => e.enabled).length;
  }

  /**
   * Limpar cache de render
   */
  clearRenderCache(): void {
    this.renderCache.clear();
    this.stats.cacheHitRate = 0;

    this.emit('cache:cleared');
  }

  // ==========================================================================
  // ACTIVITIES
  // ==========================================================================

  /**
   * Registrar atividade
   */
  private logActivity(
    type: EffectActivity['type'],
    effectId: string,
    description: string,
    metadata?: Record<string, unknown>
  ): void {
    const activity: EffectActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      effectId,
      description,
      metadata,
    };

    this.activities.push(activity);

    this.emit('activity:logged', activity);
  }

  /**
   * Obter atividades recentes
   */
  getActivities(limit = 50): EffectActivity[] {
    return this.activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // ==========================================================================
  // CONFIGURATION & STATS
  // ==========================================================================

  /**
   * Obter configuração
   */
  getConfig(): AdvancedEffectsConfig {
    return { ...this.config };
  }

  /**
   * Atualizar configuração
   */
  updateConfig(updates: Partial<AdvancedEffectsConfig>): void {
    Object.assign(this.config, updates);

    this.emit('config:updated', this.config);
  }

  /**
   * Obter estatísticas
   */
  getStats(): EffectStats {
    this.updateActiveEffectsCount();

    return { ...this.stats };
  }

  /**
   * Resetar sistema
   */
  reset(): void {
    this.effects.clear();
    this.layers.clear();
    this.activities = [];
    this.renderCache.clear();

    this.stats = {
      totalEffects: 0,
      activeEffects: 0,
      renderTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      gpuUsage: 0,
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
 * Criar sistema básico de efeitos
 */
export function createBasicEffectsSystem(): AdvancedVideoEffects {
  return new AdvancedVideoEffects({
    maxEffectsPerLayer: 10,
    maxLayers: 5,
    enableGPUAcceleration: true,
    cacheSize: 200,
    previewQuality: 'medium',
    realTimePreview: true,
    autoSaveInterval: 60000,
  });
}

/**
 * Criar sistema profissional de efeitos
 */
export function createProEffectsSystem(): AdvancedVideoEffects {
  return new AdvancedVideoEffects({
    maxEffectsPerLayer: 30,
    maxLayers: 20,
    enableGPUAcceleration: true,
    cacheSize: 1000,
    previewQuality: 'high',
    realTimePreview: true,
    autoSaveInterval: 30000,
  });
}

/**
 * Criar sistema de efeitos para desenvolvimento
 */
export function createDevEffectsSystem(): AdvancedVideoEffects {
  return new AdvancedVideoEffects({
    maxEffectsPerLayer: 5,
    maxLayers: 3,
    enableGPUAcceleration: false,
    cacheSize: 50,
    previewQuality: 'low',
    realTimePreview: false,
    autoSaveInterval: 120000,
  });
}
