/**
 * Advanced Video Effects System - Test Suite
 * Testa todas as funcionalidades do sistema de efeitos avançados
 */

import {
  AdvancedVideoEffects,
  createBasicEffectsSystem,
  createProEffectsSystem,
  createDevEffectsSystem,
} from '../../../lib/effects/advanced-effects';
import type {
  EffectConfig,
  ParticleEffect,
  TransitionEffect,
  TrackingEffect,
  ChromaKeyEffect,
  ColorGradeEffect,
  BlurEffect,
  DistortionEffect,
  TimeEffect,
} from '../../../lib/effects/advanced-effects';

const expectEffect = (effect: EffectConfig | undefined): EffectConfig => {
  expect(effect).toBeDefined();

  if (!effect) {
    throw new Error('Expected effect to be defined');
  }

  return effect;
};

const expectEffectOfType = <T extends EffectConfig>(
  effect: EffectConfig | undefined,
  predicate: (candidate: EffectConfig) => candidate is T,
  expectedType: T['type']
): T => {
  const defined = expectEffect(effect);
  expect(defined.type).toBe(expectedType);

  if (!predicate(defined)) {
    throw new Error(`Expected effect of type ${expectedType}`);
  }

  return defined;
};

const isParticleEffect = (effect: EffectConfig): effect is ParticleEffect => effect.type === 'particle';
const isTransitionEffect = (effect: EffectConfig): effect is TransitionEffect => effect.type === 'transition';
const isTrackingEffect = (effect: EffectConfig): effect is TrackingEffect => effect.type === 'tracking';
const isChromaKeyEffect = (effect: EffectConfig): effect is ChromaKeyEffect => effect.type === 'chromakey';
const isColorGradeEffect = (effect: EffectConfig): effect is ColorGradeEffect => effect.type === 'colorgrade';
const isBlurEffect = (effect: EffectConfig): effect is BlurEffect => effect.type === 'blur';
const isDistortionEffect = (effect: EffectConfig): effect is DistortionEffect => effect.type === 'distortion';
const isTimeEffect = (effect: EffectConfig): effect is TimeEffect => effect.type === 'time';

const expectParticleEffect = (effect: EffectConfig | undefined): ParticleEffect =>
  expectEffectOfType(effect, isParticleEffect, 'particle');

const expectTransitionEffect = (effect: EffectConfig | undefined): TransitionEffect =>
  expectEffectOfType(effect, isTransitionEffect, 'transition');

const expectTrackingEffect = (effect: EffectConfig | undefined): TrackingEffect =>
  expectEffectOfType(effect, isTrackingEffect, 'tracking');

const expectChromaKeyEffect = (effect: EffectConfig | undefined): ChromaKeyEffect =>
  expectEffectOfType(effect, isChromaKeyEffect, 'chromakey');

const expectColorGradeEffect = (effect: EffectConfig | undefined): ColorGradeEffect =>
  expectEffectOfType(effect, isColorGradeEffect, 'colorgrade');

const expectBlurEffect = (effect: EffectConfig | undefined): BlurEffect =>
  expectEffectOfType(effect, isBlurEffect, 'blur');

const expectDistortionEffect = (effect: EffectConfig | undefined): DistortionEffect =>
  expectEffectOfType(effect, isDistortionEffect, 'distortion');

const expectTimeEffect = (effect: EffectConfig | undefined): TimeEffect =>
  expectEffectOfType(effect, isTimeEffect, 'time');

describe('AdvancedVideoEffects', () => {
  let system: AdvancedVideoEffects;
  let errorHandler: jest.Mock;

  beforeEach(() => {
    system = new AdvancedVideoEffects();
    errorHandler = jest.fn();
    system.on('error', errorHandler);
  });

  afterEach(() => {
    system.destroy();
  });

  // ==========================================================================
  // PARTICLE EFFECTS
  // ==========================================================================

  describe('Particle Effects', () => {
    test('should create snow particle effect', () => {
      const effectId = system.createParticleEffect('snow', 0, 5);

      expect(effectId).toBeTruthy();
      expect(effectId).toMatch(/^particle-/);

      const effect = expectParticleEffect(system.getEffect(effectId));
      expect(effect.particleType).toBe('snow');
      expect(effect.count).toBe(100);
      expect(effect.color).toBe('#ffffff');
    });

    test('should create rain particle effect', () => {
      const effectId = system.createParticleEffect('rain', 0, 3);

      const effect = expectParticleEffect(system.getEffect(effectId));
      expect(effect.particleType).toBe('rain');
      expect(effect.count).toBe(200);
      expect(effect.velocity.y).toBe(300);
    });

    test('should create fire particle effect', () => {
      const effectId = system.createParticleEffect('fire', 0, 2);

      const effect = expectParticleEffect(system.getEffect(effectId));
      expect(effect.particleType).toBe('fire');
      expect(effect.color).toBe('#ff6600');
      expect(effect.velocity.y).toBe(-80);
    });

    test('should create confetti particle effect', () => {
      const effectId = system.createParticleEffect('confetti', 0, 4);

      const effect = expectParticleEffect(system.getEffect(effectId));
      expect(effect.particleType).toBe('confetti');
      expect(effect.rotation).toBe(true);
    });

    test('should create custom particle effect', () => {
      const effectId = system.createParticleEffect('smoke', 0, 6, {
        count: 50,
        color: '#000000',
        intensity: 0.7,
      });

      const effect = expectParticleEffect(system.getEffect(effectId));
      expect(effect.count).toBe(50);
      expect(effect.color).toBe('#000000');
      expect(effect.intensity).toBe(0.7);
    });

    test('should update particle effect', () => {
      const effectId = system.createParticleEffect('sparkle', 0, 1);

      const updated = system.updateParticleEffect(effectId, {
        count: 150,
        size: { min: 5, max: 10 },
      });

      expect(updated).toBe(true);

      const effect = expectParticleEffect(system.getEffect(effectId));
      expect(effect.count).toBe(150);
      expect(effect.size.max).toBe(10);
    });

    test('should not update non-particle effect', () => {
      const effectId = system.createTransition('wipe', 0, 1);

      const updated = system.updateParticleEffect(effectId, {
        count: 100,
      });

      expect(updated).toBe(false);
    });

    test('should emit event when particle effect created', () => {
      const handler = jest.fn();
      system.on('effect:created', handler);

      system.createParticleEffect('dust', 0, 8);

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].type).toBe('particle');
    });
  });

  // ==========================================================================
  // TRANSITIONS
  // ==========================================================================

  describe('Transitions', () => {
    test('should create wipe transition', () => {
      const effectId = system.createTransition('wipe', 0, 1);

      const effect = expectTransitionEffect(system.getEffect(effectId));
      expect(effect.transitionType).toBe('wipe');
      expect(effect.direction).toBe('right');
    });

    test('should create zoom transition with custom direction', () => {
      const effectId = system.createTransition('zoom', 0, 1.5, {
        direction: 'in',
        feather: 0.3,
      });

      const effect = expectTransitionEffect(system.getEffect(effectId));
      expect(effect.transitionType).toBe('zoom');
      expect(effect.direction).toBe('in');
      expect(effect.feather).toBe(0.3);
    });

    test('should create rotate transition', () => {
      const effectId = system.createTransition('rotate', 0, 2);

      const effect = expectTransitionEffect(system.getEffect(effectId));
      expect(effect.transitionType).toBe('rotate');
    });

    test('should create page-turn transition', () => {
      const effectId = system.createTransition('page-turn', 0, 1);

      const effect = expectTransitionEffect(system.getEffect(effectId));
      expect(effect.transitionType).toBe('page-turn');
    });

    test('should create morph transition', () => {
      const effectId = system.createTransition('morph', 0, 2);

      const effect = expectTransitionEffect(system.getEffect(effectId));
      expect(effect.transitionType).toBe('morph');
    });

    test('should create transition with border', () => {
      const effectId = system.createTransition('wipe', 0, 1, {
        borderWidth: 5,
        borderColor: '#ff0000',
      });

      const effect = expectTransitionEffect(system.getEffect(effectId));
      expect(effect.borderWidth).toBe(5);
      expect(effect.borderColor).toBe('#ff0000');
    });
  });

  // ==========================================================================
  // MOTION TRACKING
  // ==========================================================================

  describe('Motion Tracking', () => {
    test('should create object tracking', () => {
      const effectId = system.createTracking('object', 0, 10);

      const effect = expectTrackingEffect(system.getEffect(effectId));
      expect(effect.trackingType).toBe('object');
      expect(effect.smoothing).toBe(0.5);
    });

    test('should create face tracking', () => {
      const effectId = system.createTracking('face', 0, 10, {
        confidence: 0.9,
      });

      const effect = expectTrackingEffect(system.getEffect(effectId));
      expect(effect.trackingType).toBe('face');
      expect(effect.confidence).toBe(0.9);
    });

    test('should update tracking path', () => {
      const effectId = system.createTracking('motion', 0, 10);

      const point1 = { x: 100, y: 200, timestamp: 0 };
      const point2 = { x: 150, y: 220, timestamp: 0.5 };

      system.updateTrackingPath(effectId, point1);
      system.updateTrackingPath(effectId, point2);

      const effect = expectTrackingEffect(system.getEffect(effectId));
      expect(effect.path).toHaveLength(2);
      expect(effect.path?.[0]).toEqual(point1);
      expect(effect.path?.[1]).toEqual(point2);
    });

    test('should emit tracking updated event', () => {
      const handler = jest.fn();
      system.on('tracking:updated', handler);

      const effectId = system.createTracking('object', 0, 10);
      system.updateTrackingPath(effectId, { x: 10, y: 20, timestamp: 0 });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].point.x).toBe(10);
    });

    test('should apply stabilization', () => {
      const effectId = system.createTracking('stabilization', 0, 10);

      const analysisData = {
        frames: 300,
        motionVectors: [],
      };

      const applied = system.applyStabilization(effectId, analysisData);

      expect(applied).toBe(true);

      const effect = expectTrackingEffect(system.getEffect(effectId));
      expect(effect.metadata?.stabilizationData).toBeDefined();
    });

    test('should not apply stabilization to non-stabilization effect', () => {
      const effectId = system.createTracking('face', 0, 10);

      const applied = system.applyStabilization(effectId, {});

      expect(applied).toBe(false);
    });
  });

  // ==========================================================================
  // CHROMA KEY
  // ==========================================================================

  describe('Chroma Key', () => {
    test('should create green screen chroma key', () => {
      const effectId = system.createChromaKey('#00ff00', 0, 10);

      const effect = expectChromaKeyEffect(system.getEffect(effectId));
      expect(effect.keyColor).toBe('#00ff00');
      expect(effect.tolerance).toBe(0.3);
    });

    test('should create blue screen chroma key', () => {
      const effectId = system.createChromaKey('#0000ff', 0, 10, {
        tolerance: 0.4,
        softness: 0.3,
      });

      const effect = expectChromaKeyEffect(system.getEffect(effectId));
      expect(effect.keyColor).toBe('#0000ff');
      expect(effect.tolerance).toBe(0.4);
      expect(effect.softness).toBe(0.3);
    });

    test('should configure despill and edge blur', () => {
      const effectId = system.createChromaKey('#00ff00', 0, 10, {
        despill: 0.7,
        edgeBlur: 2,
      });

      const effect = expectChromaKeyEffect(system.getEffect(effectId));
      expect(effect.despill).toBe(0.7);
      expect(effect.edgeBlur).toBe(2);
    });

    test('should auto-detect chroma key color', () => {
      const effectId = system.createChromaKey('#ff0000', 0, 10);

      const color = system.autoDetectChromaKey(effectId, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });

      expect(color).toBe('#00ff00');

      const effect = expectChromaKeyEffect(system.getEffect(effectId));
      expect(effect.keyColor).toBe('#00ff00');
    });

    test('should emit chromakey detected event', () => {
      const handler = jest.fn();
      system.on('chromakey:detected', handler);

      const effectId = system.createChromaKey('#ff0000', 0, 10);
      system.autoDetectChromaKey(effectId, { x: 0, y: 0, width: 100, height: 100 });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].color).toBe('#00ff00');
    });
  });

  // ==========================================================================
  // COLOR GRADING
  // ==========================================================================

  describe('Color Grading', () => {
    test('should create color grading effect', () => {
      const effectId = system.createColorGrade(0, 10);

      const effect = expectColorGradeEffect(system.getEffect(effectId));
      expect(effect.temperature).toBe(0);
      expect(effect.exposure).toBe(0);
    });

    test('should create color grading with adjustments', () => {
      const effectId = system.createColorGrade(0, 10, {
        temperature: 10,
        tint: -5,
        exposure: 0.5,
        contrast: 20,
        saturation: 15,
      });

      const effect = expectColorGradeEffect(system.getEffect(effectId));
      expect(effect.temperature).toBe(10);
      expect(effect.tint).toBe(-5);
      expect(effect.exposure).toBe(0.5);
      expect(effect.contrast).toBe(20);
      expect(effect.saturation).toBe(15);
    });

    test('should apply LUT', () => {
      const effectId = system.createColorGrade(0, 10);

      const applied = system.applyLUT(effectId, '/path/to/cinematic.cube');

      expect(applied).toBe(true);

      const effect = expectColorGradeEffect(system.getEffect(effectId));
      expect(effect.lut).toBe('/path/to/cinematic.cube');
    });

    test('should not apply LUT to non-colorgrade effect', () => {
      const effectId = system.createBlur('gaussian', 0, 5, 10);

      const applied = system.applyLUT(effectId, '/path/to/lut.cube');

      expect(applied).toBe(false);
    });

    test('should update RGB curves', () => {
      const effectId = system.createColorGrade(0, 10);

      const points = [0, 0.2, 0.5, 0.8, 1];

      const updated = system.updateCurves(effectId, 'rgb', points);

      expect(updated).toBe(true);

      const effect = expectColorGradeEffect(system.getEffect(effectId));
      expect(effect.curves?.rgb).toEqual(points);
    });

    test('should update individual color channel curves', () => {
      const effectId = system.createColorGrade(0, 10);

      system.updateCurves(effectId, 'red', [0, 0.3, 1]);
      system.updateCurves(effectId, 'green', [0, 0.5, 1]);
      system.updateCurves(effectId, 'blue', [0, 0.7, 1]);

      const effect = expectColorGradeEffect(system.getEffect(effectId));
      expect(effect.curves?.red).toEqual([0, 0.3, 1]);
      expect(effect.curves?.green).toEqual([0, 0.5, 1]);
      expect(effect.curves?.blue).toEqual([0, 0.7, 1]);
    });

    test('should emit curves updated event', () => {
      const handler = jest.fn();
      system.on('curves:updated', handler);

      const effectId = system.createColorGrade(0, 10);
      system.updateCurves(effectId, 'red', [0, 0.5, 1]);

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].channel).toBe('red');
    });
  });

  // ==========================================================================
  // BLUR EFFECTS
  // ==========================================================================

  describe('Blur Effects', () => {
    test('should create gaussian blur', () => {
      const effectId = system.createBlur('gaussian', 0, 5, 20);

      const effect = expectBlurEffect(system.getEffect(effectId));
      expect(effect.blurType).toBe('gaussian');
      expect(effect.amount).toBe(20);
    });

    test('should create motion blur with angle', () => {
      const effectId = system.createBlur('motion', 0, 2, 30, {
        angle: 45,
        quality: 'high',
      });

      const effect = expectBlurEffect(system.getEffect(effectId));
      expect(effect.blurType).toBe('motion');
      expect(effect.angle).toBe(45);
      expect(effect.quality).toBe('high');
    });

    test('should create radial blur', () => {
      const effectId = system.createBlur('radial', 0, 3, 40, {
        center: { x: 0.5, y: 0.5 },
        falloff: 0.8,
      });

      const effect = expectBlurEffect(system.getEffect(effectId));
      expect(effect.blurType).toBe('radial');
      expect(effect.center).toEqual({ x: 0.5, y: 0.5 });
      expect(effect.falloff).toBe(0.8);
    });

    test('should create tilt-shift blur', () => {
      const effectId = system.createBlur('tilt-shift', 0, 5, 25);

      const effect = expectBlurEffect(system.getEffect(effectId));
      expect(effect.blurType).toBe('tilt-shift');
    });

    test('should create bokeh blur', () => {
      const effectId = system.createBlur('bokeh', 0, 5, 50, {
        quality: 'ultra',
      });

      const effect = expectBlurEffect(system.getEffect(effectId));
      expect(effect.blurType).toBe('bokeh');
      expect(effect.quality).toBe('ultra');
    });
  });

  // ==========================================================================
  // DISTORTION
  // ==========================================================================

  describe('Distortion Effects', () => {
    test('should create fisheye distortion', () => {
      const effectId = system.createDistortion('fisheye', 0, 5);

      const effect = expectDistortionEffect(system.getEffect(effectId));
      expect(effect.distortionType).toBe('fisheye');
    });

    test('should create lens distortion', () => {
      const effectId = system.createDistortion('lens', 0, 10, {
        amount: 0.3,
      });

      const effect = expectDistortionEffect(system.getEffect(effectId));
      expect(effect.distortionType).toBe('lens');
      expect(effect.amount).toBe(0.3);
    });

    test('should create wave distortion', () => {
      const effectId = system.createDistortion('wave', 0, 5, {
        wavelength: 100,
        frequency: 2,
      });

      const effect = expectDistortionEffect(system.getEffect(effectId));
      expect(effect.wavelength).toBe(100);
      expect(effect.frequency).toBe(2);
    });

    test('should create perspective distortion', () => {
      const effectId = system.createDistortion('perspective', 0, 5, {
        corners: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      });

      const effect = expectDistortionEffect(system.getEffect(effectId));
      expect(effect.corners).toHaveLength(4);
    });
  });

  // ==========================================================================
  // TIME EFFECTS
  // ==========================================================================

  describe('Time Effects', () => {
    test('should create slow motion effect', () => {
      const effectId = system.createTimeEffect('slow', 0, 5, 0.5);

      const effect = expectTimeEffect(system.getEffect(effectId));
      expect(effect.timeType).toBe('slow');
      expect(effect.speed).toBe(0.5);
    });

    test('should create fast motion effect', () => {
      const effectId = system.createTimeEffect('fast', 0, 3, 2);

      const effect = expectTimeEffect(system.getEffect(effectId));
      expect(effect.timeType).toBe('fast');
      expect(effect.speed).toBe(2);
    });

    test('should create reverse effect', () => {
      const effectId = system.createTimeEffect('reverse', 0, 5, 1);

      const effect = expectTimeEffect(system.getEffect(effectId));
      expect(effect.timeType).toBe('reverse');
    });

    test('should create freeze frame effect', () => {
      const effectId = system.createTimeEffect('freeze', 0, 2, 0, {
        freezeFrame: 60,
      });

      const effect = expectTimeEffect(system.getEffect(effectId));
      expect(effect.timeType).toBe('freeze');
      expect(effect.freezeFrame).toBe(60);
    });

    test('should create time ramp effect', () => {
      const effectId = system.createTimeEffect('ramp', 0, 5, 0.5, {
        interpolation: 'optical-flow',
      });

      const effect = expectTimeEffect(system.getEffect(effectId));
      expect(effect.timeType).toBe('ramp');
      expect(effect.interpolation).toBe('optical-flow');
    });
  });

  // ==========================================================================
  // LAYERS
  // ==========================================================================

  describe('Effect Layers', () => {
    test('should create layer', () => {
      const layerId = system.createLayer('Main Layer');

      expect(layerId).toBeTruthy();
      expect(layerId).toMatch(/^layer-/);
    });

    test('should create layer with blend mode', () => {
      const layerId = system.createLayer('Overlay', 'overlay');

      expect(layerId).toBeTruthy();
    });

    test('should add effect to layer', () => {
      const layerId = system.createLayer('Layer 1');
      const effectId = system.createBlur('gaussian', 0, 5, 10);

      const added = system.addEffectToLayer(layerId, effectId);

      expect(added).toBe(true);
    });

    test('should remove effect from layer', () => {
      const layerId = system.createLayer('Layer 1');
      const effectId = system.createBlur('gaussian', 0, 5, 10);

      system.addEffectToLayer(layerId, effectId);
      const removed = system.removeEffectFromLayer(layerId, effectId);

      expect(removed).toBe(true);
    });

    test('should not exceed max layers', () => {
      const testSystem = new AdvancedVideoEffects({ maxLayers: 2 });
      const errorHandler = jest.fn();
      testSystem.on('error', errorHandler);

      testSystem.createLayer('Layer 1');
      testSystem.createLayer('Layer 2');
      const layerId3 = testSystem.createLayer('Layer 3');

      expect(layerId3).toBe('');
      expect(errorHandler).toHaveBeenCalled();

      testSystem.destroy();
    });

    test('should not exceed max effects per layer', () => {
      const testSystem = new AdvancedVideoEffects({ maxEffectsPerLayer: 2 });
      const errorHandler = jest.fn();
      testSystem.on('error', errorHandler);
      const layerId = testSystem.createLayer('Layer 1');

      const effect1 = testSystem.createBlur('gaussian', 0, 5, 10);
      const effect2 = testSystem.createBlur('motion', 0, 5, 15);
      const effect3 = testSystem.createBlur('radial', 0, 5, 20);

      testSystem.addEffectToLayer(layerId, effect1);
      testSystem.addEffectToLayer(layerId, effect2);
      const added = testSystem.addEffectToLayer(layerId, effect3);

      expect(added).toBe(false);
      expect(errorHandler).toHaveBeenCalled();

      testSystem.destroy();
    });

    test('should reorder layers', () => {
      const layer1 = system.createLayer('Layer 1');
      const layer2 = system.createLayer('Layer 2');
      const layer3 = system.createLayer('Layer 3');

      const reordered = system.reorderLayers([layer3, layer1, layer2]);

      expect(reordered).toBe(true);
    });

    test('should emit layer events', () => {
      const createHandler = jest.fn();
      const updateHandler = jest.fn();

      system.on('layer:created', createHandler);
      system.on('layer:updated', updateHandler);

      const layerId = system.createLayer('Layer 1');
      const effectId = system.createBlur('gaussian', 0, 5, 10);
      system.addEffectToLayer(layerId, effectId);

      expect(createHandler).toHaveBeenCalled();
      expect(updateHandler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  describe('Effect Presets', () => {
    test('should have default presets', () => {
      const cinematic = system.getPresetsByCategory('cinematic');
      expect(cinematic.length).toBeGreaterThan(0);

      const vintage = system.getPresetsByCategory('vintage');
      expect(vintage.length).toBeGreaterThan(0);
    });

    test('should create custom preset', () => {
      const effectId = system.createColorGrade(0, 10, { temperature: 10 });
      const effect = system.getEffect(effectId)!;

      const presetId = system.createPreset(
        'My Preset',
        'Custom look',
        'custom',
        [effect]
      );

      expect(presetId).toBeTruthy();
    });

    test('should apply preset', () => {
      const effectId = system.createColorGrade(0, 10);
      const effect = system.getEffect(effectId)!;

      const presetId = system.createPreset('Test', 'Test preset', 'custom', [effect]);

      const appliedIds = system.applyPreset(presetId, 0);

      expect(appliedIds.length).toBe(1);
      expect(appliedIds[0]).toMatch(/^colorgrade-/);
    });

    test('should get presets by category', () => {
      system.createPreset('Horror 1', 'Dark', 'horror', []);
      system.createPreset('Horror 2', 'Scary', 'horror', []);
      system.createPreset('Romantic 1', 'Love', 'romantic', []);

      const horror = system.getPresetsByCategory('horror');
      const romantic = system.getPresetsByCategory('romantic');

      expect(horror.length).toBeGreaterThanOrEqual(2);
      expect(romantic.length).toBeGreaterThanOrEqual(1);
    });

    test('should emit preset applied event', () => {
      const handler = jest.fn();
      system.on('preset:applied', handler);

      const effectId = system.createBlur('gaussian', 0, 5, 10);
      const effect = system.getEffect(effectId)!;

      const presetId = system.createPreset('Test', 'Test', 'custom', [effect]);
      system.applyPreset(presetId, 0);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EFFECT MANAGEMENT
  // ==========================================================================

  describe('Effect Management', () => {
    test('should get effect by id', () => {
      const effectId = system.createBlur('gaussian', 0, 5, 10);

      const effect = system.getEffect(effectId);

      expect(effect).toBeDefined();
      expect(effect?.id).toBe(effectId);
    });

    test('should get all effects', () => {
      system.createBlur('gaussian', 0, 5, 10);
      system.createColorGrade(0, 10);
      system.createParticleEffect('snow', 0, 5);

      const effects = system.getAllEffects();

      expect(effects.length).toBe(3);
    });

    test('should filter effects by type', () => {
      system.createBlur('gaussian', 0, 5, 10);
      system.createBlur('motion', 0, 5, 15);
      system.createColorGrade(0, 10);

      const blurs = system.getEffectsByType('blur');

      expect(blurs.length).toBe(2);
      expect(blurs.every(e => e.type === 'blur')).toBe(true);
    });

    test('should filter effects by time range', () => {
      system.createBlur('gaussian', 0, 5, 10); // 0-5 (overlap)
      system.createColorGrade(5, 5); // 5-10 (overlap)
      system.createParticleEffect('snow', 10, 5); // 10-15 (overlap)

      const effects = system.getEffectsInTimeRange(4, 11);

      // Todos os 3 efeitos se sobrepõem ao range [4, 11]:
      // - blur 0-5: overlap (termina em 5 > 4)
      // - colorgrade 5-10: overlap (inicia em 5 < 11 E termina em 10 > 4)
      // - particle 10-15: overlap (inicia em 10 < 11)
      expect(effects.length).toBe(3);
    });

    test('should toggle effect', () => {
      const effectId = system.createBlur('gaussian', 0, 5, 10);

      system.toggleEffect(effectId, false);

      let effect = system.getEffect(effectId);
      expect(effect?.enabled).toBe(false);

      system.toggleEffect(effectId, true);

      effect = system.getEffect(effectId);
      expect(effect?.enabled).toBe(true);
    });

    test('should delete effect', () => {
      const effectId = system.createBlur('gaussian', 0, 5, 10);

      const deleted = system.deleteEffect(effectId);

      expect(deleted).toBe(true);

      const effect = system.getEffect(effectId);
      expect(effect).toBeUndefined();
    });

    test('should duplicate effect', () => {
      const effectId = system.createBlur('gaussian', 0, 5, 10);

      const duplicateId = system.duplicateEffect(effectId);

      expect(duplicateId).toBeTruthy();
      expect(duplicateId).not.toBe(effectId);

      const original = expectBlurEffect(system.getEffect(effectId));
      if (!duplicateId) {
        throw new Error('Expected duplicate id to be generated');
      }
      const duplicate = expectBlurEffect(system.getEffect(duplicateId));

      expect(duplicate.type).toBe(original.type);
      expect(duplicate.amount).toBe(original.amount);
      expect(duplicate.name).toContain('(copy)');
    });

    test('should emit effect toggled event', () => {
      const handler = jest.fn();
      system.on('effect:toggled', handler);

      const effectId = system.createBlur('gaussian', 0, 5, 10);
      system.toggleEffect(effectId, false);

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].enabled).toBe(false);
    });

    test('should emit effect duplicated event', () => {
      const handler = jest.fn();
      system.on('effect:duplicated', handler);

      const effectId = system.createBlur('gaussian', 0, 5, 10);
      system.duplicateEffect(effectId);

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].originalId).toBe(effectId);
    });
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe('Rendering', () => {
    test('should render frame', async () => {
      system.createBlur('gaussian', 0, 10, 10);
      system.createColorGrade(0, 10);

      const result = await system.renderFrame(30, 1, {
        quality: 'preview',
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        format: 'rgba',
        antialiasing: true,
        motionBlur: false,
      });

      expect(result).toBeDefined();
      expect(result.frameNumber).toBe(30);
      expect(result.effectsApplied).toBe(2);
    });

    test('should emit frame rendered event', async () => {
      const handler = jest.fn();
      system.on('frame:rendered', handler);

      await system.renderFrame(0, 0, {
        quality: 'draft',
        resolution: { width: 1280, height: 720 },
        fps: 24,
        format: 'rgb',
        antialiasing: false,
        motionBlur: false,
      });

      expect(handler).toHaveBeenCalled();
    });

    test('should clear render cache', () => {
      const handler = jest.fn();
      system.on('cache:cleared', handler);

      system.clearRenderCache();

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ACTIVITIES
  // ==========================================================================

  describe('Activities', () => {
    test('should log activities', () => {
      system.createBlur('gaussian', 0, 5, 10);

      const activities = system.getActivities();

      expect(activities.length).toBeGreaterThan(0);

      const createActivity = activities.find(a => a.type === 'created');
      expect(createActivity).toBeDefined();
    });

    test('should limit activities returned', () => {
      for (let i = 0; i < 100; i++) {
        system.createBlur('gaussian', 0, 5, 10);
      }

      const activities = system.getActivities(10);

      expect(activities.length).toBe(10);
    });

    test('should emit activity logged event', () => {
      const handler = jest.fn();
      system.on('activity:logged', handler);

      system.createBlur('gaussian', 0, 5, 10);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CONFIGURATION & STATS
  // ==========================================================================

  describe('Configuration', () => {
    test('should get config', () => {
      const config = system.getConfig();

      expect(config).toBeDefined();
      expect(config.maxEffectsPerLayer).toBe(20);
      expect(config.enableGPUAcceleration).toBe(true);
    });

    test('should update config', () => {
      system.updateConfig({
        previewQuality: 'high',
        cacheSize: 1000,
      });

      const config = system.getConfig();

      expect(config.previewQuality).toBe('high');
      expect(config.cacheSize).toBe(1000);
    });

    test('should emit config updated event', () => {
      const handler = jest.fn();
      system.on('config:updated', handler);

      system.updateConfig({ previewQuality: 'low' });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    test('should track total effects', () => {
      system.createBlur('gaussian', 0, 5, 10);
      system.createColorGrade(0, 10);
      system.createParticleEffect('snow', 0, 5);

      const stats = system.getStats();

      expect(stats.totalEffects).toBe(3);
    });

    test('should track active effects', () => {
      const id1 = system.createBlur('gaussian', 0, 5, 10);
      system.createColorGrade(0, 10);
      const id3 = system.createParticleEffect('snow', 0, 5);

      system.toggleEffect(id1, false);
      system.toggleEffect(id3, false);

      const stats = system.getStats();

      expect(stats.activeEffects).toBe(1);
    });

    test('should track render time', async () => {
      await system.renderFrame(0, 0, {
        quality: 'draft',
        resolution: { width: 1280, height: 720 },
        fps: 24,
        format: 'rgb',
        antialiasing: false,
        motionBlur: false,
      });

      const stats = system.getStats();

      expect(stats.renderTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('System Reset', () => {
    test('should reset all data', () => {
      system.createBlur('gaussian', 0, 5, 10);
      system.createColorGrade(0, 10);
      system.createLayer('Layer 1');

      system.reset();

      const effects = system.getAllEffects();
      const stats = system.getStats();

      expect(effects.length).toBe(0);
      expect(stats.totalEffects).toBe(0);
    });

    test('should recreate default presets after reset', () => {
      system.reset();

      const cinematic = system.getPresetsByCategory('cinematic');

      expect(cinematic.length).toBeGreaterThan(0);
    });

    test('should emit system reset event', () => {
      const handler = jest.fn();
      system.on('system:reset', handler);

      system.reset();

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // FACTORY FUNCTIONS
  // ==========================================================================

  describe('Factory Functions', () => {
    test('should create basic effects system', () => {
      const basic = createBasicEffectsSystem();

      const config = basic.getConfig();

      expect(config.maxEffectsPerLayer).toBe(10);
      expect(config.maxLayers).toBe(5);

      basic.destroy();
    });

    test('should create pro effects system', () => {
      const pro = createProEffectsSystem();

      const config = pro.getConfig();

      expect(config.maxEffectsPerLayer).toBe(30);
      expect(config.maxLayers).toBe(20);
      expect(config.previewQuality).toBe('high');

      pro.destroy();
    });

    test('should create dev effects system', () => {
      const dev = createDevEffectsSystem();

      const config = dev.getConfig();

      expect(config.maxEffectsPerLayer).toBe(5);
      expect(config.enableGPUAcceleration).toBe(false);
      expect(config.previewQuality).toBe('low');

      dev.destroy();
    });
  });
});
