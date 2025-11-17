/**
 * Testes para Video Effects Engine
 * 
 * @module video-effects.test
 * @author GitHub Copilot
 * @version 1.0.0
 */

import VideoEffects, {
  createBasicEffects,
  createVintageEffects,
  createCinematicEffects,
  createNoirEffects,
  createVibrantEffects,
  createSlowMotionEffects,
  EffectsConfig,
  ColorFilter,
  TransitionType,
  SpecialEffect
} from '../../../lib/video/video-effects';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';

// ==================== MOCKS ====================

jest.mock('fluent-ffmpeg');
jest.mock('fs/promises');

// Mock FFmpeg
const mockFfmpeg = {
  input: jest.fn().mockReturnThis(),
  videoCodec: jest.fn().mockReturnThis(),
  audioCodec: jest.fn().mockReturnThis(),
  outputOptions: jest.fn().mockReturnThis(),
  videoFilters: jest.fn().mockReturnThis(),
  complexFilter: jest.fn().mockReturnThis(),
  size: jest.fn().mockReturnThis(),
  fps: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis()
};

// ==================== SETUP ====================

beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock ffmpeg constructor
  (ffmpeg as unknown as jest.Mock).mockReturnValue(mockFfmpeg);
  
  // Mock fs.access
  jest.spyOn(fs, 'access').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ==================== TESTES ====================

describe('VideoEffects', () => {
  
  // ========== CONSTRUCTOR ==========
  
  describe('Constructor', () => {
    test('should create instance with default options', () => {
      const effects = new VideoEffects();
      expect(effects).toBeInstanceOf(VideoEffects);
    });

    test('should extend EventEmitter', () => {
      const effects = new VideoEffects();
      expect(effects.on).toBeDefined();
      expect(effects.emit).toBeDefined();
    });
  });

  // ========== COLOR FILTERS ==========

  describe('Color Filters', () => {
    test('should apply grayscale filter', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'grayscale', intensity: 1.0 }
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.success).toBe(true);
      expect(result.effectsApplied).toContain('Color Filter: grayscale');
      expect(mockFfmpeg.videoFilters).toHaveBeenCalled();
    });

    test('should apply sepia filter', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'sepia', intensity: 0.8 }
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.success).toBe(true);
      expect(result.effectsApplied).toContain('Color Filter: sepia');
    });

    test('should apply vintage filter', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'vintage', intensity: 0.7 }
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.success).toBe(true);
      expect(result.effectsApplied).toContain('Color Filter: vintage');
    });

    test('should handle filter intensity', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'cinema', intensity: 0.5 }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('colorchannelmixer');
    });
  });

  // ========== COLOR CORRECTION ==========

  describe('Color Correction', () => {
    test('should apply brightness correction', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorCorrection: { brightness: 0.2 }
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.success).toBe(true);
      expect(result.effectsApplied).toContain('Color Correction');
      
      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('brightness=0.2');
    });

    test('should apply contrast correction', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorCorrection: { contrast: 0.3 }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('contrast=0.3');
    });

    test('should apply saturation correction', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorCorrection: { saturation: 1.5 }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('saturation=1.5');
    });

    test('should apply multiple corrections', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorCorrection: {
          brightness: 0.1,
          contrast: 0.2,
          saturation: 1.3,
          hue: 30
        }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('brightness=0.1');
      expect(filterCall).toContain('contrast=0.2');
      expect(filterCall).toContain('saturation=1.3');
      expect(filterCall).toContain('hue=h=30');
    });
  });

  // ========== SPECIAL EFFECTS ==========

  describe('Special Effects', () => {
    test('should apply blur effect', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        specialEffects: [{ type: 'blur', radius: 10 }]
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.success).toBe(true);
      expect(result.effectsApplied).toContain('Special Effect: blur');
      
      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('boxblur');
    });

    test('should apply sharpen effect', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        specialEffects: [{ type: 'sharpen', intensity: 0.7 }]
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('unsharp');
    });

    test('should apply vignette effect', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        specialEffects: [{ type: 'vignette', intensity: 0.5 }]
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('vignette');
    });

    test('should apply multiple special effects', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        specialEffects: [
          { type: 'blur', radius: 5 },
          { type: 'vignette', intensity: 0.6 }
        ]
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.effectsApplied).toContain('Special Effect: blur');
      expect(result.effectsApplied).toContain('Special Effect: vignette');
    });
  });

  // ========== TEMPORAL EFFECTS ==========

  describe('Temporal Effects', () => {
    test('should apply slow motion', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        temporalEffect: { type: 'slow-motion', speed: 0.5 }
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.success).toBe(true);
      expect(result.effectsApplied).toContain('Temporal Effect: slow-motion');
      
      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('setpts');
    });

    test('should apply time lapse', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        temporalEffect: { type: 'time-lapse', speed: 2.0 }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('setpts');
    });

    test('should apply reverse effect', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        temporalEffect: { type: 'reverse' }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('reverse');
    });
  });

  // ========== TRANSITIONS ==========

  describe('Transitions', () => {
    test('should add fade transition', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const result = await effects.addTransition(
        'video1.mp4',
        'video2.mp4',
        { type: 'fade', duration: 1.5 },
        'output.mp4'
      );

      expect(result.success).toBe(true);
      expect(result.effectsApplied).toContain('Transition: fade');
      expect(mockFfmpeg.complexFilter).toHaveBeenCalled();
    });

    test('should add wipe transition', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const result = await effects.addTransition(
        'video1.mp4',
        'video2.mp4',
        { type: 'wipe-left', duration: 2.0 },
        'output.mp4'
      );

      expect(result.success).toBe(true);
      const filterCall = mockFfmpeg.complexFilter.mock.calls[0][0];
      expect(filterCall).toContain('xfade');
      expect(filterCall).toContain('wipeleft');
    });
  });

  // ========== SPLIT SCREEN ==========

  describe('Split Screen', () => {
    test('should create 2-horizontal split', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const result = await effects.createSplitScreen(
        {
          videos: ['video1.mp4', 'video2.mp4'],
          layout: '2-horizontal'
        },
        'output.mp4'
      );

      expect(result.success).toBe(true);
      expect(result.effectsApplied).toContain('Split Screen: 2-horizontal');
      expect(mockFfmpeg.complexFilter).toHaveBeenCalled();
    });

    test('should create 4-grid split', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const result = await effects.createSplitScreen(
        {
          videos: ['v1.mp4', 'v2.mp4', 'v3.mp4', 'v4.mp4'],
          layout: '4-grid'
        },
        'output.mp4'
      );

      expect(result.success).toBe(true);
      const filterCall = mockFfmpeg.complexFilter.mock.calls[0][0];
      expect(filterCall).toContain('scale');
      expect(filterCall).toContain('hstack');
      expect(filterCall).toContain('vstack');
    });

    test('should reject split with less than 2 videos', async () => {
      const effects = new VideoEffects();

      const result = await effects.createSplitScreen(
        {
          videos: ['video1.mp4'],
          layout: '2-horizontal'
        },
        'output.mp4'
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('at least 2 videos');
    });
  });

  // ========== COMBINED EFFECTS ==========

  describe('Combined Effects', () => {
    test('should apply multiple effects together', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'vintage', intensity: 0.8 },
        colorCorrection: { brightness: 0.1, contrast: 0.2 },
        specialEffects: [{ type: 'vignette', intensity: 0.5 }]
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.success).toBe(true);
      expect(result.effectsApplied.length).toBe(3);
      expect(result.effectsApplied).toContain('Color Filter: vintage');
      expect(result.effectsApplied).toContain('Color Correction');
      expect(result.effectsApplied).toContain('Special Effect: vignette');
    });
  });

  // ========== VALIDATION ==========

  describe('Input Validation', () => {
    test('should reject non-existent file', async () => {
      const effects = new VideoEffects();

      jest.spyOn(fs, 'access').mockImplementation((path) => {
        if (path.toString().includes('missing.mp4')) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve(undefined);
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'grayscale' }
      };

      const result = await effects.applyEffects('missing.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Input file not found');
    });
  });

  // ========== PROCESSING OPTIONS ==========

  describe('Processing Options', () => {
    test('should use custom codec options', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'grayscale' }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4',
        videoCodec: 'libx265',
        audioCodec: 'aac',
        preset: 'fast',
        crf: 18
      });

      expect(mockFfmpeg.videoCodec).toHaveBeenCalledWith('libx265');
      expect(mockFfmpeg.audioCodec).toHaveBeenCalledWith('aac');
      expect(mockFfmpeg.outputOptions).toHaveBeenCalledWith([
        '-preset fast',
        '-crf 18'
      ]);
    });

    test('should apply custom resolution', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'grayscale' }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4',
        resolution: { width: 1920, height: 1080 }
      });

      expect(mockFfmpeg.size).toHaveBeenCalledWith('1920x1080');
    });

    test('should apply custom FPS', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'grayscale' }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4',
        fps: 60
      });

      expect(mockFfmpeg.fps).toHaveBeenCalledWith(60);
    });
  });

  // ========== EVENTS ==========

  describe('Events', () => {
    test('should emit start event', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const startSpy = jest.fn();
      effects.on('start', startSpy);

      const config: EffectsConfig = {
        colorFilter: { type: 'grayscale' }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(startSpy).toHaveBeenCalled();
    });

    test('should emit complete event', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const completeSpy = jest.fn();
      effects.on('complete', completeSpy);

      const config: EffectsConfig = {
        colorFilter: { type: 'grayscale' }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(completeSpy).toHaveBeenCalled();
      const result = completeSpy.mock.calls[0][0];
      expect(result.success).toBe(true);
    });

    test('should emit progress event', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        // Simulate progress
        const progressCallback = mockFfmpeg.on.mock.calls
          .find((call: any) => call[0] === 'progress')?.[1];
        
        if (progressCallback) {
          progressCallback({
            percent: 50,
            currentFps: 30,
            currentKbps: 5000
          });
        }

        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        
        return mockFfmpeg;
      });

      const progressSpy = jest.fn();
      effects.on('progress', progressSpy);

      const config: EffectsConfig = {
        colorFilter: { type: 'grayscale' }
      };

      await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(progressSpy).toHaveBeenCalled();
    });
  });

  // ========== FACTORY FUNCTIONS ==========

  describe('Factory Functions', () => {
    test('createBasicEffects should create instance', () => {
      const effects = createBasicEffects();
      expect(effects).toBeInstanceOf(VideoEffects);
    });

    test('createVintageEffects should create preset', () => {
      const { effects, config } = createVintageEffects();
      
      expect(effects).toBeInstanceOf(VideoEffects);
      expect(config.colorFilter?.type).toBe('vintage');
      expect(config.colorCorrection).toBeDefined();
      expect(config.specialEffects).toHaveLength(1);
      expect(config.specialEffects?.[0].type).toBe('vignette');
    });

    test('createCinematicEffects should create preset', () => {
      const { effects, config } = createCinematicEffects();
      
      expect(effects).toBeInstanceOf(VideoEffects);
      expect(config.colorFilter?.type).toBe('cinema');
      expect(config.colorCorrection).toBeDefined();
    });

    test('createNoirEffects should create preset', () => {
      const { effects, config } = createNoirEffects();
      
      expect(effects).toBeInstanceOf(VideoEffects);
      expect(config.colorFilter?.type).toBe('noir');
    });

    test('createVibrantEffects should create preset', () => {
      const { effects, config } = createVibrantEffects();
      
      expect(effects).toBeInstanceOf(VideoEffects);
      expect(config.colorFilter?.type).toBe('vibrant');
    });

    test('createSlowMotionEffects should create preset', () => {
      const { effects, config } = createSlowMotionEffects(0.5);
      
      expect(effects).toBeInstanceOf(VideoEffects);
      expect(config.temporalEffect?.type).toBe('slow-motion');
      expect(config.temporalEffect?.speed).toBe(0.5);
    });
  });

  // ========== RESULT ==========

  describe('Effect Result', () => {
    test('should return processing time', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'grayscale' }
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    test('should return effects applied list', async () => {
      const effects = new VideoEffects();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find((call: [string, ...unknown[]]) => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: EffectsConfig = {
        colorFilter: { type: 'vintage', intensity: 0.8 },
        specialEffects: [{ type: 'blur', radius: 5 }]
      };

      const result = await effects.applyEffects('input.mp4', config, {
        outputPath: 'output.mp4'
      });

      expect(result.effectsApplied).toHaveLength(2);
      expect(result.effectsApplied[0]).toContain('vintage');
      expect(result.effectsApplied[1]).toContain('blur');
    });
  });
});
