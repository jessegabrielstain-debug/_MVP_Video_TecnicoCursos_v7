/**
 * Testes para Advanced Audio Processing System
 */

import {
  AdvancedAudioProcessor,
  AudioEffectType,
  EqualizerEffect,
  CompressorEffect,
  ReverbEffect,
  DelayEffect,
  ChorusEffect,
  FlangerEffect,
  DistortionEffect,
  AudioTrack,
  AudioPreset,
  NoiseReductionConfig,
  VoiceEnhancementConfig,
  DuckingConfig,
  createBasicAudioProcessor,
  createProAudioProcessor,
  createDevAudioProcessor,
} from '../../../lib/audio/audio-processor';

describe('AdvancedAudioProcessor', () => {
  let processor: AdvancedAudioProcessor;

  beforeEach(() => {
    processor = new AdvancedAudioProcessor();
  });

  afterEach(() => {
    processor.destroy();
  });

  // ==========================================================================
  // TRACK MANAGEMENT
  // ==========================================================================

  describe('Track Management', () => {
    test('should add audio track', () => {
      const trackId = processor.addTrack('Voice');

      expect(trackId).toBeTruthy();

      const track = processor.getTrack(trackId);
      expect(track).toBeDefined();
      expect(track?.name).toBe('Voice');
      expect(track?.volume).toBe(1.0);
      expect(track?.pan).toBe(0);
    });

    test('should add track with audio data', () => {
      const audioData = [new Float32Array(1000), new Float32Array(1000)];

      const trackId = processor.addTrack('Music', audioData, 0);

      const track = processor.getTrack(trackId);
      expect(track?.audioData).toEqual(audioData);
    });

    test('should get all tracks', () => {
      processor.addTrack('Voice');
      processor.addTrack('Music');

      const tracks = processor.getAllTracks();

      expect(tracks).toHaveLength(2);
    });

    test('should set track volume', () => {
      const trackId = processor.addTrack('Voice');

      const success = processor.setTrackVolume(trackId, 0.5);

      expect(success).toBe(true);

      const track = processor.getTrack(trackId);
      expect(track?.volume).toBe(0.5);
    });

    test('should clamp volume between 0 and 1', () => {
      const trackId = processor.addTrack('Voice');

      processor.setTrackVolume(trackId, 1.5);
      expect(processor.getTrack(trackId)?.volume).toBe(1.0);

      processor.setTrackVolume(trackId, -0.5);
      expect(processor.getTrack(trackId)?.volume).toBe(0);
    });

    test('should set track pan', () => {
      const trackId = processor.addTrack('Voice');

      const success = processor.setTrackPan(trackId, 0.7);

      expect(success).toBe(true);

      const track = processor.getTrack(trackId);
      expect(track?.pan).toBe(0.7);
    });

    test('should clamp pan between -1 and 1', () => {
      const trackId = processor.addTrack('Voice');

      processor.setTrackPan(trackId, 1.5);
      expect(processor.getTrack(trackId)?.pan).toBe(1.0);

      processor.setTrackPan(trackId, -1.5);
      expect(processor.getTrack(trackId)?.pan).toBe(-1.0);
    });

    test('should toggle mute', () => {
      const trackId = processor.addTrack('Voice');

      processor.toggleMute(trackId);

      expect(processor.getTrack(trackId)?.mute).toBe(true);

      processor.toggleMute(trackId);

      expect(processor.getTrack(trackId)?.mute).toBe(false);
    });

    test('should toggle solo', () => {
      const trackId = processor.addTrack('Voice');

      processor.toggleSolo(trackId);

      expect(processor.getTrack(trackId)?.solo).toBe(true);

      processor.toggleSolo(trackId);

      expect(processor.getTrack(trackId)?.solo).toBe(false);
    });

    test('should delete track', () => {
      const trackId = processor.addTrack('Voice');

      const success = processor.deleteTrack(trackId);

      expect(success).toBe(true);
      expect(processor.getTrack(trackId)).toBeUndefined();
    });

    test('should not exceed max tracks', () => {
      const testProcessor = new AdvancedAudioProcessor({ maxTracks: 2 });
      const errorHandler = jest.fn();
      testProcessor.on('error', errorHandler);

      testProcessor.addTrack('Track 1');
      testProcessor.addTrack('Track 2');
      const trackId3 = testProcessor.addTrack('Track 3');

      expect(trackId3).toBe('');
      expect(errorHandler).toHaveBeenCalled();

      testProcessor.destroy();
    });

    test('should emit track:added event', () => {
      const handler = jest.fn();
      processor.on('track:added', handler);

      processor.addTrack('Voice');

      expect(handler).toHaveBeenCalled();
    });

    test('should emit track:updated event', () => {
      const handler = jest.fn();
      processor.on('track:updated', handler);

      const trackId = processor.addTrack('Voice');
      processor.setTrackVolume(trackId, 0.5);

      expect(handler).toHaveBeenCalled();
    });

    test('should emit track:deleted event', () => {
      const handler = jest.fn();
      processor.on('track:deleted', handler);

      const trackId = processor.addTrack('Voice');
      processor.deleteTrack(trackId);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EQUALIZER
  // ==========================================================================

  describe('Equalizer', () => {
    test('should create equalizer with default bands', () => {
      const effectId = processor.createEqualizer('Master EQ');

      expect(effectId).toBeTruthy();

      const effect = processor['effects'].get(effectId) as EqualizerEffect;
      expect(effect.type).toBe('equalizer');
      expect(effect.bands).toHaveLength(5);
    });

    test('should create equalizer with custom bands', () => {
      const customBands: EqualizerEffect['bands'] = [
        { frequency: 100, gain: 3, q: 1.0, type: 'lowshelf' },
        { frequency: 500, gain: -2, q: 1.5, type: 'peaking' },
      ];

      const effectId = processor.createEqualizer('Custom EQ', customBands);

      const effect = processor['effects'].get(effectId) as EqualizerEffect;
      expect(effect.bands).toEqual(customBands);
    });

    test('should emit effect:created event', () => {
      const handler = jest.fn();
      processor.on('effect:created', handler);

      processor.createEqualizer('Test EQ');

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // COMPRESSOR
  // ==========================================================================

  describe('Compressor', () => {
    test('should create compressor with default settings', () => {
      const effectId = processor.createCompressor('Master Comp');

      expect(effectId).toBeTruthy();

      const effect = processor['effects'].get(effectId) as CompressorEffect;
      expect(effect.type).toBe('compressor');
      expect(effect.threshold).toBe(-24);
      expect(effect.ratio).toBe(4);
      expect(effect.attack).toBe(5);
      expect(effect.release).toBe(100);
    });

    test('should create compressor with custom settings', () => {
      const effectId = processor.createCompressor('Voice Comp', {
        threshold: -18,
        ratio: 3,
        attack: 3,
        release: 80,
        knee: 4,
        makeupGain: 6,
      });

      const effect = processor['effects'].get(effectId) as CompressorEffect;
      expect(effect.threshold).toBe(-18);
      expect(effect.ratio).toBe(3);
      expect(effect.makeupGain).toBe(6);
    });
  });

  // ==========================================================================
  // REVERB
  // ==========================================================================

  describe('Reverb', () => {
    test('should create room reverb', () => {
      const effectId = processor.createReverb('room');

      const effect = processor['effects'].get(effectId) as ReverbEffect;
      expect(effect.type).toBe('reverb');
      expect(effect.reverbType).toBe('room');
      expect(effect.roomSize).toBe(0.3);
    });

    test('should create hall reverb', () => {
      const effectId = processor.createReverb('hall');

      const effect = processor['effects'].get(effectId) as ReverbEffect;
      expect(effect.reverbType).toBe('hall');
      expect(effect.roomSize).toBe(0.7);
    });

    test('should create cathedral reverb', () => {
      const effectId = processor.createReverb('cathedral');

      const effect = processor['effects'].get(effectId) as ReverbEffect;
      expect(effect.reverbType).toBe('cathedral');
      expect(effect.decay).toBe(8.0);
    });

    test('should create reverb with custom options', () => {
      const effectId = processor.createReverb('plate', {
        mix: 0.5,
        preDelay: 50,
      });

      const effect = processor['effects'].get(effectId) as ReverbEffect;
      expect(effect.mix).toBe(0.5);
      expect(effect.preDelay).toBe(50);
    });
  });

  // ==========================================================================
  // DELAY
  // ==========================================================================

  describe('Delay', () => {
    test('should create mono delay', () => {
      const effectId = processor.createDelay('mono', 500);

      const effect = processor['effects'].get(effectId) as DelayEffect;
      expect(effect.type).toBe('delay');
      expect(effect.delayType).toBe('mono');
      expect(effect.time).toBe(500);
    });

    test('should create pingpong delay', () => {
      const effectId = processor.createDelay('pingpong', 300);

      const effect = processor['effects'].get(effectId) as DelayEffect;
      expect(effect.delayType).toBe('pingpong');
      expect(effect.pingPong).toBe(true);
    });

    test('should create delay with custom options', () => {
      const effectId = processor.createDelay('stereo', 400, {
        feedback: 0.5,
        sync: true,
        tempo: 120,
      });

      const effect = processor['effects'].get(effectId) as DelayEffect;
      expect(effect.feedback).toBe(0.5);
      expect(effect.sync).toBe(true);
      expect(effect.tempo).toBe(120);
    });
  });

  // ==========================================================================
  // CHORUS
  // ==========================================================================

  describe('Chorus', () => {
    test('should create chorus with default settings', () => {
      const effectId = processor.createChorus();

      const effect = processor['effects'].get(effectId) as ChorusEffect;
      expect(effect.type).toBe('chorus');
      expect(effect.rate).toBe(1.5);
      expect(effect.voices).toBe(3);
    });

    test('should create chorus with custom settings', () => {
      const effectId = processor.createChorus({
        rate: 2.0,
        depth: 0.7,
        voices: 4,
        spread: 0.8,
      });

      const effect = processor['effects'].get(effectId) as ChorusEffect;
      expect(effect.rate).toBe(2.0);
      expect(effect.voices).toBe(4);
    });
  });

  // ==========================================================================
  // FLANGER
  // ==========================================================================

  describe('Flanger', () => {
    test('should create flanger with default settings', () => {
      const effectId = processor.createFlanger();

      const effect = processor['effects'].get(effectId) as FlangerEffect;
      expect(effect.type).toBe('flanger');
      expect(effect.rate).toBe(0.5);
      expect(effect.delay).toBe(5);
    });

    test('should create flanger with custom settings', () => {
      const effectId = processor.createFlanger({
        rate: 1.0,
        depth: 0.8,
        feedback: 0.6,
        stereoPhase: 120,
      });

      const effect = processor['effects'].get(effectId) as FlangerEffect;
      expect(effect.rate).toBe(1.0);
      expect(effect.stereoPhase).toBe(120);
    });
  });

  // ==========================================================================
  // DISTORTION
  // ==========================================================================

  describe('Distortion', () => {
    test('should create soft distortion', () => {
      const effectId = processor.createDistortion('soft');

      const effect = processor['effects'].get(effectId) as DistortionEffect;
      expect(effect.type).toBe('distortion');
      expect(effect.distortionType).toBe('soft');
    });

    test('should create overdrive distortion', () => {
      const effectId = processor.createDistortion('overdrive');

      const effect = processor['effects'].get(effectId) as DistortionEffect;
      expect(effect.distortionType).toBe('overdrive');
    });

    test('should create distortion with custom settings', () => {
      const effectId = processor.createDistortion('fuzz', {
        drive: 0.8,
        tone: 0.6,
        outputGain: -3,
      });

      const effect = processor['effects'].get(effectId) as DistortionEffect;
      expect(effect.drive).toBe(0.8);
      expect(effect.outputGain).toBe(-3);
    });
  });

  // ==========================================================================
  // EFFECT MANAGEMENT
  // ==========================================================================

  describe('Effect Management', () => {
    test('should add effect to track', () => {
      const trackId = processor.addTrack('Voice');
      const effectId = processor.createCompressor('Voice Comp');

      const success = processor.addEffectToTrack(trackId, effectId);

      expect(success).toBe(true);

      const track = processor.getTrack(trackId);
      expect(track?.effects).toHaveLength(1);
      expect(track?.effects[0].id).toBe(effectId);
    });

    test('should remove effect from track', () => {
      const trackId = processor.addTrack('Voice');
      const effectId = processor.createCompressor('Voice Comp');

      processor.addEffectToTrack(trackId, effectId);
      const success = processor.removeEffectFromTrack(trackId, effectId);

      expect(success).toBe(true);

      const track = processor.getTrack(trackId);
      expect(track?.effects).toHaveLength(0);
    });

    test('should not exceed max effects per track', () => {
      const testProcessor = new AdvancedAudioProcessor({ maxEffectsPerTrack: 2 });
      const errorHandler = jest.fn();
      testProcessor.on('error', errorHandler);

      const trackId = testProcessor.addTrack('Voice');
      const effect1 = testProcessor.createCompressor('Comp 1');
      const effect2 = testProcessor.createEqualizer('EQ 1');
      const effect3 = testProcessor.createReverb('room');

      testProcessor.addEffectToTrack(trackId, effect1);
      testProcessor.addEffectToTrack(trackId, effect2);
      const success = testProcessor.addEffectToTrack(trackId, effect3);

      expect(success).toBe(false);
      expect(errorHandler).toHaveBeenCalled();

      testProcessor.destroy();
    });

    test('should toggle effect bypass', () => {
      const effectId = processor.createCompressor('Test Comp');

      processor.toggleEffectBypass(effectId);

      const effect = processor['effects'].get(effectId);
      expect(effect?.bypass).toBe(true);

      processor.toggleEffectBypass(effectId);

      expect(effect?.bypass).toBe(false);
    });

    test('should emit track:effect-added event', () => {
      const handler = jest.fn();
      processor.on('track:effect-added', handler);

      const trackId = processor.addTrack('Voice');
      const effectId = processor.createCompressor('Comp');

      processor.addEffectToTrack(trackId, effectId);

      expect(handler).toHaveBeenCalled();
    });

    test('should emit track:effect-removed event', () => {
      const handler = jest.fn();
      processor.on('track:effect-removed', handler);

      const trackId = processor.addTrack('Voice');
      const effectId = processor.createCompressor('Comp');

      processor.addEffectToTrack(trackId, effectId);
      processor.removeEffectFromTrack(trackId, effectId);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // MIXING
  // ==========================================================================

  describe('Mixing', () => {
    test('should create mix bus', () => {
      const track1 = processor.addTrack('Voice');
      const track2 = processor.addTrack('Music');

      const busId = processor.createMixBus('Vocals', [track1, track2]);

      expect(busId).toBeTruthy();
    });

    test('should mix tracks', async () => {
      const audioData1 = [new Float32Array(1000).fill(0.5), new Float32Array(1000).fill(0.5)];
      const audioData2 = [new Float32Array(1000).fill(0.3), new Float32Array(1000).fill(0.3)];

      processor.addTrack('Voice', audioData1, 0);
      processor.addTrack('Music', audioData2, 0);

      const mixed = await processor.mixTracks(1.0);

      expect(mixed).toHaveLength(2); // Stereo
      expect(mixed[0]).toBeInstanceOf(Float32Array);
      expect(mixed[1]).toBeInstanceOf(Float32Array);
    });

    test('should respect mute when mixing', async () => {
      const audioData = [new Float32Array(1000).fill(0.5), new Float32Array(1000).fill(0.5)];

      const trackId = processor.addTrack('Voice', audioData, 0);
      processor.toggleMute(trackId, true);

      const mixed = await processor.mixTracks(1.0);

      // All samples should be 0 (muted)
      expect(mixed[0].every(s => s === 0)).toBe(true);
    });

    test('should respect solo when mixing', async () => {
      const audioData1 = [new Float32Array(1000).fill(0.5), new Float32Array(1000).fill(0.5)];
      const audioData2 = [new Float32Array(1000).fill(0.3), new Float32Array(1000).fill(0.3)];

      const track1 = processor.addTrack('Voice', audioData1, 0);
      processor.addTrack('Music', audioData2, 0);

      processor.toggleSolo(track1, true);

      const mixed = await processor.mixTracks(1.0);

      // Only track1 should be audible
      expect(mixed[0][0]).toBeCloseTo(0.5, 1);
    });

    test('should emit audio:mixed event', async () => {
      const handler = jest.fn();
      processor.on('audio:mixed', handler);

      const audioData = [new Float32Array(1000), new Float32Array(1000)];
      processor.addTrack('Voice', audioData, 0);

      await processor.mixTracks(1.0);

      expect(handler).toHaveBeenCalled();
    });

    test('should emit bus:created event', () => {
      const handler = jest.fn();
      processor.on('bus:created', handler);

      const track1 = processor.addTrack('Voice');
      processor.createMixBus('Vocals', [track1]);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // NORMALIZATION & DYNAMICS
  // ==========================================================================

  describe('Normalization & Dynamics', () => {
    test('should normalize audio', () => {
      const audioData = [new Float32Array([0.1, 0.5, -0.3]), new Float32Array([0.2, -0.4, 0.6])];

      const normalized = processor.normalize(audioData, -3);

      expect(normalized).toHaveLength(2);
      expect(normalized[0]).toBeInstanceOf(Float32Array);
    });

    test('should apply fade in', () => {
      const audioData = [new Float32Array(1000).fill(1.0), new Float32Array(1000).fill(1.0)];

      // Fade for 100 samples (at 48kHz, this is ~2ms)
      const fadeDuration = 100 / processor.getConfig().sampleRate;
      const faded = processor.applyFadeIn(audioData, fadeDuration);

      // First sample should be silent
      expect(faded[0][0]).toBe(0);

      // Last sample should be full volume (after fade completes)
      expect(faded[0][999]).toBe(1.0);

      // Sample at index 99 should be at full volume
      expect(faded[0][99]).toBeCloseTo(1.0, 1);
    });

    test('should apply fade out', () => {
      const audioData = [new Float32Array(1000).fill(1.0), new Float32Array(1000).fill(1.0)];

      // Fade for 100 samples (at 48kHz, this is ~2ms)
      const fadeDuration = 100 / processor.getConfig().sampleRate;
      const faded = processor.applyFadeOut(audioData, fadeDuration);

      // First sample should be full volume
      expect(faded[0][0]).toBe(1.0);

      // Last sample should be silent
      expect(faded[0][999]).toBe(0);

      // Sample at index 900 should be full volume (before fade starts)
      expect(faded[0][899]).toBe(1.0);
    });

    test('should emit audio:normalized event', () => {
      const handler = jest.fn();
      processor.on('audio:normalized', handler);

      const audioData = [new Float32Array([0.5]), new Float32Array([0.5])];
      processor.normalize(audioData);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // NOISE REDUCTION
  // ==========================================================================

  describe('Noise Reduction', () => {
    test('should apply noise reduction', () => {
      const audioData = [new Float32Array(1000), new Float32Array(1000)];
      const trackId = processor.addTrack('Voice', audioData);

      const config: NoiseReductionConfig = {
        enabled: true,
        threshold: -40,
        reduction: 20,
        smoothing: 0.5,
      };

      const success = processor.applyNoiseReduction(trackId, config);

      expect(success).toBe(true);
    });

    test('should emit noise-reduction:applied event', () => {
      const handler = jest.fn();
      processor.on('noise-reduction:applied', handler);

      const audioData = [new Float32Array(1000), new Float32Array(1000)];
      const trackId = processor.addTrack('Voice', audioData);

      const config: NoiseReductionConfig = {
        enabled: true,
        threshold: -40,
        reduction: 20,
        smoothing: 0.5,
      };

      processor.applyNoiseReduction(trackId, config);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // VOICE ENHANCEMENT
  // ==========================================================================

  describe('Voice Enhancement', () => {
    test('should apply voice enhancement', () => {
      const audioData = [new Float32Array(1000), new Float32Array(1000)];
      const trackId = processor.addTrack('Voice', audioData);

      const config: VoiceEnhancementConfig = {
        enabled: true,
        deEsser: { enabled: true, frequency: 8000, threshold: -15 },
        breathControl: { enabled: true, threshold: -40, reduction: 10 },
        warmth: 0.5,
        presence: 0.7,
        clarity: 0.6,
      };

      const success = processor.applyVoiceEnhancement(trackId, config);

      expect(success).toBe(true);
    });

    test('should emit voice-enhancement:applied event', () => {
      const handler = jest.fn();
      processor.on('voice-enhancement:applied', handler);

      const audioData = [new Float32Array(1000), new Float32Array(1000)];
      const trackId = processor.addTrack('Voice', audioData);

      const config: VoiceEnhancementConfig = {
        enabled: true,
        deEsser: { enabled: true, frequency: 8000, threshold: -15 },
        breathControl: { enabled: true, threshold: -40, reduction: 10 },
        warmth: 0.5,
        presence: 0.7,
        clarity: 0.6,
      };

      processor.applyVoiceEnhancement(trackId, config);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // DUCKING
  // ==========================================================================

  describe('Ducking', () => {
    test('should apply ducking', () => {
      const audioData1 = [new Float32Array(1000), new Float32Array(1000)];
      const audioData2 = [new Float32Array(1000), new Float32Array(1000)];

      const track1 = processor.addTrack('Voice', audioData1);
      const track2 = processor.addTrack('Music', audioData2);

      const config: DuckingConfig = {
        enabled: true,
        sideChainTrackId: track1,
        threshold: -20,
        ratio: 4,
        attack: 10,
        release: 100,
        range: 12,
      };

      const success = processor.applyDucking(track2, config);

      expect(success).toBe(true);
    });

    test('should emit ducking:applied event', () => {
      const handler = jest.fn();
      processor.on('ducking:applied', handler);

      const audioData1 = [new Float32Array(1000), new Float32Array(1000)];
      const audioData2 = [new Float32Array(1000), new Float32Array(1000)];

      const track1 = processor.addTrack('Voice', audioData1);
      const track2 = processor.addTrack('Music', audioData2);

      const config: DuckingConfig = {
        enabled: true,
        sideChainTrackId: track1,
        threshold: -20,
        ratio: 4,
        attack: 10,
        release: 100,
        range: 12,
      };

      processor.applyDucking(track2, config);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // AUDIO ANALYSIS
  // ==========================================================================

  describe('Audio Analysis', () => {
    test('should analyze audio', () => {
      const audioData = [new Float32Array(1000), new Float32Array(1000)];
      const trackId = processor.addTrack('Voice', audioData);

      const analysis = processor.analyzeAudio(trackId);

      expect(analysis).toBeDefined();
      expect(analysis?.trackId).toBe(trackId);
      expect(analysis?.peakLevel).toBeDefined();
      expect(analysis?.rmsLevel).toBeDefined();
      expect(analysis?.frequency).toBeDefined();
    });

    test('should emit audio:analyzed event', () => {
      const handler = jest.fn();
      processor.on('audio:analyzed', handler);

      const audioData = [new Float32Array(1000), new Float32Array(1000)];
      const trackId = processor.addTrack('Voice', audioData);

      processor.analyzeAudio(trackId);

      expect(handler).toHaveBeenCalled();
    });

    test('should return null for non-existent track', () => {
      const analysis = processor.analyzeAudio('non-existent');

      expect(analysis).toBeNull();
    });
  });

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  describe('Presets', () => {
    test('should have default presets', () => {
      const presets = processor['presets'];

      expect(presets.size).toBeGreaterThan(0);
    });

    test('should create preset', () => {
      const compId = processor.createCompressor('Comp');
      const eqId = processor.createEqualizer('EQ');

      const comp = processor['effects'].get(compId);
      const eq = processor['effects'].get(eqId);

      const presetId = processor.createPreset(
        'Voice Processing',
        'Optimized for voice',
        'voice',
        [comp!, eq!]
      );

      expect(presetId).toBeTruthy();
    });

    test('should apply preset to track', () => {
      const compId = processor.createCompressor('Comp');
      const comp = processor['effects'].get(compId);

      const presetId = processor.createPreset('Test Preset', 'Test', 'custom', [comp!]);

      const trackId = processor.addTrack('Voice');

      const success = processor.applyPreset(trackId, presetId);

      expect(success).toBe(true);

      const track = processor.getTrack(trackId);
      expect(track?.effects.length).toBeGreaterThan(0);
    });

    test('should get presets by category', () => {
      const voicePresets = processor.getPresetsByCategory('voice');

      expect(Array.isArray(voicePresets)).toBe(true);
      expect(voicePresets.every(p => p.category === 'voice')).toBe(true);
    });

    test('should emit preset:created event', () => {
      const handler = jest.fn();
      processor.on('preset:created', handler);

      processor.createPreset('Test', 'Test preset', 'custom', []);

      expect(handler).toHaveBeenCalled();
    });

    test('should emit preset:applied event', () => {
      const handler = jest.fn();
      processor.on('preset:applied', handler);

      const compId = processor.createCompressor('Comp');
      const comp = processor['effects'].get(compId);

      const presetId = processor.createPreset('Test', 'Test', 'custom', [comp!]);
      const trackId = processor.addTrack('Voice');

      processor.applyPreset(trackId, presetId);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  describe('Configuration', () => {
    test('should get configuration', () => {
      const config = processor.getConfig();

      expect(config.sampleRate).toBe(48000);
      expect(config.bitDepth).toBe(24);
      expect(config.maxTracks).toBe(64);
    });

    test('should update configuration', () => {
      processor.updateConfig({ sampleRate: 96000, maxTracks: 128 });

      const config = processor.getConfig();
      expect(config.sampleRate).toBe(96000);
      expect(config.maxTracks).toBe(128);
    });

    test('should emit config:updated event', () => {
      const handler = jest.fn();
      processor.on('config:updated', handler);

      processor.updateConfig({ sampleRate: 96000 });

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  describe('Statistics', () => {
    test('should get statistics', () => {
      processor.addTrack('Voice');
      processor.addTrack('Music');

      const stats = processor.getStats();

      expect(stats.totalTracks).toBe(2);
      expect(stats).toHaveProperty('activeTracks');
      expect(stats).toHaveProperty('totalEffects');
    });

    test('should track active tracks', () => {
      const track1 = processor.addTrack('Voice');
      const track2 = processor.addTrack('Music');

      processor.toggleMute(track2, true);

      const stats = processor.getStats();

      expect(stats.activeTracks).toBe(1);
    });
  });

  // ==========================================================================
  // ACTIVITIES
  // ==========================================================================

  describe('Activities', () => {
    test('should log activities', () => {
      processor.addTrack('Voice');

      const activities = processor.getActivities();

      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0]).toHaveProperty('type');
      expect(activities[0]).toHaveProperty('description');
    });

    test('should limit activities', () => {
      const errorHandler = jest.fn();
      processor.on('error', errorHandler);

      for (let i = 0; i < 100; i++) {
        processor.addTrack(`Track ${i}`);
      }

      const activities = processor.getActivities(10);

      expect(activities).toHaveLength(10);
    });

    test('should emit activity:logged event', () => {
      const handler = jest.fn();
      processor.on('activity:logged', handler);

      processor.addTrack('Voice');

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SYSTEM RESET
  // ==========================================================================

  describe('System Reset', () => {
    test('should reset system', () => {
      processor.addTrack('Voice');
      processor.addTrack('Music');
      processor.createCompressor('Comp');

      processor.reset();

      expect(processor.getAllTracks()).toHaveLength(0);
      expect(processor.getStats().totalTracks).toBe(0);
      expect(processor.getStats().totalEffects).toBe(0);
    });

    test('should recreate presets after reset', () => {
      processor.reset();

      const presets = processor['presets'];
      expect(presets.size).toBeGreaterThan(0);
    });

    test('should emit system:reset event', () => {
      const handler = jest.fn();
      processor.on('system:reset', handler);

      processor.reset();

      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // FACTORY FUNCTIONS
  // ==========================================================================

  describe('Factory Functions', () => {
    test('should create basic audio processor', () => {
      const basic = createBasicAudioProcessor();

      const config = basic.getConfig();
      expect(config.sampleRate).toBe(44100);
      expect(config.bitDepth).toBe(16);
      expect(config.maxTracks).toBe(16);

      basic.destroy();
    });

    test('should create pro audio processor', () => {
      const pro = createProAudioProcessor();

      const config = pro.getConfig();
      expect(config.sampleRate).toBe(96000);
      expect(config.bitDepth).toBe(32);
      expect(config.maxTracks).toBe(128);

      pro.destroy();
    });

    test('should create dev audio processor', () => {
      const dev = createDevAudioProcessor();

      const config = dev.getConfig();
      expect(config.sampleRate).toBe(48000);
      expect(config.bitDepth).toBe(24);
      expect(config.maxTracks).toBe(32);

      dev.destroy();
    });
  });
});
