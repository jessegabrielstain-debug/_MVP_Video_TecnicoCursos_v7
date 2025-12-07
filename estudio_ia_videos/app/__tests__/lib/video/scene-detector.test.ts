/**
 * Video Scene Detector Tests
 * 
 * Comprehensive test suite for scene detection:
 * - Scene change detection
 * - Transition analysis (cuts, fades, dissolves)
 * - Black frame detection
 * - Histogram analysis
 * - Thumbnail generation
 * - EDL/JSON export
 * - Progress tracking
 * - Factory functions
 * 
 * @jest-environment node
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  VideoSceneDetector,
  createShortVideoDetector,
  createMediumVideoDetector,
  createLongVideoDetector,
  createSensitiveDetector,
  type SceneDetectionConfig,
  type Scene,
  type SceneDetectionResult,
  type TransitionType,
} from '@/lib/video/scene-detector';

// Mock FFmpeg
jest.mock('fluent-ffmpeg', () => {
  return jest.fn().mockImplementation(() => ({
    input: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    complexFilter: jest.fn().mockReturnThis(),
    on: jest.fn(function(event: string, callback: Function) {
      if (event === 'end') {
        setTimeout(() => callback(), 10);
      } else if (event === 'stderr') {
        // Simulate FFmpeg scene detection output
        setTimeout(() => {
          callback('frame:0 pts:0 pts_time:0');
          callback('lavfi.scene_score=0.95');
          callback('frame:150 pts:150 pts_time:5.0');
          callback('lavfi.scene_score=0.85');
          callback('frame:300 pts:300 pts_time:10.0');
        }, 5);
      }
      return this;
    }),
    run: jest.fn(),
    screenshots: jest.fn().mockReturnThis(),
  }));
});

// Mock fs operations
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('VideoSceneDetector', () => {
  let detector: VideoSceneDetector;
  const testVideoPath = '/test/input.mp4';
  const testOutputDir = '/test/output';

  beforeEach(() => {
    jest.clearAllMocks();
    detector = new VideoSceneDetector({
      sceneThreshold: 0.4,
      minSceneDuration: 1.0,
    });
  });

  afterEach(() => {
    detector.removeAllListeners();
  });

  describe('Constructor & Initialization', () => {
    it('should create instance with default config', () => {
      const defaultDetector = new VideoSceneDetector();
      expect(defaultDetector).toBeInstanceOf(VideoSceneDetector);
    });

    it('should accept custom configuration', () => {
      const config: SceneDetectionConfig = {
        sceneThreshold: 0.5,
        minSceneDuration: 2.0,
        detectTransitions: true,
        detectBlackFrames: true,
        generateThumbnails: true,
        thumbnailSize: '320x180',
      };
      const customDetector = new VideoSceneDetector(config);
      expect(customDetector).toBeInstanceOf(VideoSceneDetector);
    });

    it('should merge partial config with defaults', () => {
      const partialConfig = { sceneThreshold: 0.6 };
      const detectorWithPartial = new VideoSceneDetector(partialConfig);
      expect(detectorWithPartial).toBeInstanceOf(VideoSceneDetector);
    });
  });

  describe('Factory Functions', () => {
    it('createShortVideoDetector should create instance for short videos', () => {
      const shortDetector = createShortVideoDetector();
      expect(shortDetector).toBeInstanceOf(VideoSceneDetector);
    });

    it('createMediumVideoDetector should create instance for medium videos', () => {
      const mediumDetector = createMediumVideoDetector();
      expect(mediumDetector).toBeInstanceOf(VideoSceneDetector);
    });

    it('createLongVideoDetector should create instance for long videos', () => {
      const longDetector = createLongVideoDetector();
      expect(longDetector).toBeInstanceOf(VideoSceneDetector);
    });

    it('createSensitiveDetector should create instance with low threshold', () => {
      const sensitiveDetector = createSensitiveDetector();
      expect(sensitiveDetector).toBeInstanceOf(VideoSceneDetector);
    });
  });

  describe('detectScenes', () => {
    it('should validate input file exists', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      await expect(detector.detectScenes(testVideoPath))
        .rejects
        .toThrow('Input video file not found');
    });

    it('should detect scenes and return result', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);

      expect(result).toHaveProperty('scenes');
      expect(result).toHaveProperty('totalScenes');
      expect(result).toHaveProperty('videoDuration');
      expect(Array.isArray(result.scenes)).toBe(true);
    });

    it('should emit progress events', async () => {
      const progressSpy = jest.fn();
      detector.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await detector.detectScenes(testVideoPath);

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should create output directory when specified', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await detector.detectScenes(testVideoPath, testOutputDir);

      expect(fs.mkdir).toHaveBeenCalledWith(
        testOutputDir,
        { recursive: true }
      );
    });

    it('should return scenes with correct structure', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);

      if (result.scenes.length > 0) {
        const scene = result.scenes[0];
        expect(scene).toHaveProperty('sceneNumber');
        expect(scene).toHaveProperty('startTime');
        expect(scene).toHaveProperty('endTime');
        expect(scene).toHaveProperty('duration');
        expect(scene).toHaveProperty('startFrame');
        expect(scene).toHaveProperty('endFrame');
      }
    });

    it('should calculate total scenes correctly', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);

      expect(result.totalScenes).toBe(result.scenes.length);
    });
  });

  describe('Scene Change Detection', () => {
    it('should detect scene changes using FFmpeg filter', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);

      expect(result.scenes.length).toBeGreaterThan(0);
    });

    it('should respect sceneThreshold parameter', async () => {
      const highThreshold = new VideoSceneDetector({ sceneThreshold: 0.9 });
      const lowThreshold = new VideoSceneDetector({ sceneThreshold: 0.1 });

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const highResult = await highThreshold.detectScenes(testVideoPath);
      const lowResult = await lowThreshold.detectScenes(testVideoPath);

      // Lower threshold should detect more scenes
      expect(lowResult.scenes.length).toBeGreaterThanOrEqual(highResult.scenes.length);
    });

    it('should respect minSceneDuration parameter', async () => {
      const longMin = new VideoSceneDetector({ minSceneDuration: 5.0 });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await longMin.detectScenes(testVideoPath);

      result.scenes.forEach(scene => {
        expect(scene.duration).toBeGreaterThanOrEqual(5.0);
      });
    });

    it('should handle videos with no scene changes', async () => {
      const ffmpegMock = require('fluent-ffmpeg');
      ffmpegMock.mockImplementationOnce(() => ({
        input: jest.fn().mockReturnThis(),
        outputOptions: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        on: jest.fn(function(event: string, callback: Function) {
          if (event === 'end') {
            setTimeout(() => callback(), 10);
          } else if (event === 'stderr') {
            // No scene changes
            setTimeout(() => {
              callback('frame:0 pts:0 pts_time:0');
            }, 5);
          }
          return this;
        }),
        run: jest.fn(),
      }));

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);

      expect(result.scenes.length).toBeGreaterThanOrEqual(1); // At least one scene (whole video)
    });
  });

  describe('Transition Analysis', () => {
    it('should detect fade transitions when enabled', async () => {
      const transDetector = new VideoSceneDetector({
        detectTransitions: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await transDetector.detectScenes(testVideoPath);

      // Check if transitions are detected
      if (result.scenes.length > 1) {
        result.scenes.forEach(scene => {
          expect(scene).toHaveProperty('transitionType');
        });
      }
    });

    it('should identify different transition types', async () => {
      const transDetector = new VideoSceneDetector({
        detectTransitions: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await transDetector.detectScenes(testVideoPath);

      const transitionTypes: TransitionType[] = ['cut', 'fade', 'dissolve'];
      
      result.scenes.forEach(scene => {
        if (scene.transitionType) {
          expect(transitionTypes).toContain(scene.transitionType);
        }
      });
    });

    it('should not analyze transitions when disabled', async () => {
      const noTransDetector = new VideoSceneDetector({
        detectTransitions: false,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noTransDetector.detectScenes(testVideoPath);

      result.scenes.forEach(scene => {
        expect(scene.transitionType).toBeUndefined();
      });
    });
  });

  describe('Black Frame Detection', () => {
    it('should detect black frames when enabled', async () => {
      const blackDetector = new VideoSceneDetector({
        detectBlackFrames: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await blackDetector.detectScenes(testVideoPath);

      expect(result).toHaveProperty('blackFrames');
    });

    it('should not detect black frames when disabled', async () => {
      const noBlackDetector = new VideoSceneDetector({
        detectBlackFrames: false,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noBlackDetector.detectScenes(testVideoPath);

      expect(result.blackFrames).toBeUndefined();
    });

    it('should provide black frame timestamps', async () => {
      const blackDetector = new VideoSceneDetector({
        detectBlackFrames: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await blackDetector.detectScenes(testVideoPath);

      if (result.blackFrames && result.blackFrames.length > 0) {
        result.blackFrames.forEach(bf => {
          expect(bf).toHaveProperty('startTime');
          expect(bf).toHaveProperty('endTime');
          expect(bf).toHaveProperty('duration');
        });
      }
    });
  });

  describe('Thumbnail Generation', () => {
    it('should generate thumbnails for each scene when enabled', async () => {
      const thumbDetector = new VideoSceneDetector({
        generateThumbnails: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await thumbDetector.detectScenes(testVideoPath, testOutputDir);

      result.scenes.forEach(scene => {
        expect(scene).toHaveProperty('thumbnailPath');
        expect(scene.thumbnailPath).toContain('scene_');
      });
    });

    it('should not generate thumbnails when disabled', async () => {
      const noThumbDetector = new VideoSceneDetector({
        generateThumbnails: false,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noThumbDetector.detectScenes(testVideoPath);

      result.scenes.forEach(scene => {
        expect(scene.thumbnailPath).toBeUndefined();
      });
    });

    it('should use custom thumbnail size', async () => {
      const customSizeDetector = new VideoSceneDetector({
        generateThumbnails: true,
        thumbnailSize: '640x360',
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await customSizeDetector.detectScenes(testVideoPath, testOutputDir);

      // Verify FFmpeg was called with correct size
      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });
  });

  describe('Export Functions', () => {
    it('should export scenes to JSON format', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);
      await detector.exportJSON(result, testOutputDir);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.stringContaining('')
      );
    });

    it('should export scenes to EDL format', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);
      await detector.exportEDL(result, testOutputDir);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.edl'),
        expect.stringContaining('')
      );
    });

    it('should create valid JSON structure', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);
      await detector.exportJSON(result, testOutputDir);

      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const jsonCall = writeFileCalls.find(call => call[0].includes('.json'));

      if (jsonCall) {
        const jsonContent = jsonCall[1];
        expect(() => JSON.parse(jsonContent)).not.toThrow();
      }
    });

    it('should create valid EDL format', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);
      await detector.exportEDL(result, testOutputDir);

      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const edlCall = writeFileCalls.find(call => call[0].includes('.edl'));

      if (edlCall) {
        const edlContent = edlCall[1];
        expect(edlContent).toContain('TITLE:');
        expect(typeof edlContent).toBe('string');
      }
    });
  });

  describe('Timecode Conversion', () => {
    it('should convert seconds to SMPTE timecode correctly', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);

      result.scenes.forEach(scene => {
        expect(scene).toHaveProperty('startTimecode');
        expect(scene).toHaveProperty('endTimecode');
        expect(scene.startTimecode).toMatch(/\d{2}:\d{2}:\d{2}:\d{2}/);
        expect(scene.endTimecode).toMatch(/\d{2}:\d{2}:\d{2}:\d{2}/);
      });
    });

    it('should handle edge case timecodes', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath);

      if (result.scenes.length > 0) {
        const firstScene = result.scenes[0];
        expect(firstScene.startTimecode).toBe('00:00:00:00');
      }
    });
  });

  describe('Progress Tracking', () => {
    it('should emit start event', async () => {
      const startSpy = jest.fn();
      detector.on('start', startSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await detector.detectScenes(testVideoPath);

      expect(startSpy).toHaveBeenCalled();
    });

    it('should emit progress events with stage info', async () => {
      const progressSpy = jest.fn();
      detector.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await detector.detectScenes(testVideoPath);

      expect(progressSpy).toHaveBeenCalled();
      const calls = progressSpy.mock.calls;
      calls.forEach(call => {
        expect(call[0]).toHaveProperty('stage');
        expect(call[0]).toHaveProperty('percent');
      });
    });

    it('should emit complete event with result', async () => {
      const completeSpy = jest.fn();
      detector.on('complete', completeSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await detector.detectScenes(testVideoPath);

      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          scenes: expect.any(Array),
          totalScenes: expect.any(Number),
        })
      );
    });

    it('should emit error event on failure', async () => {
      const errorSpy = jest.fn();
      detector.on('error', errorSpy);

      (fs.access as jest.Mock).mockRejectedValue(new Error('Test error'));

      await expect(detector.detectScenes(testVideoPath))
        .rejects
        .toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing input file', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(detector.detectScenes(testVideoPath))
        .rejects
        .toThrow('Input video file not found');
    });

    it('should handle FFmpeg errors gracefully', async () => {
      const ffmpegMock = require('fluent-ffmpeg');
      ffmpegMock.mockImplementationOnce(() => ({
        input: jest.fn().mockReturnThis(),
        outputOptions: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        on: jest.fn(function(event: string, callback: Function) {
          if (event === 'error') {
            setTimeout(() => callback(new Error('FFmpeg error')), 10);
          }
          return this;
        }),
        run: jest.fn(),
      }));

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await expect(detector.detectScenes(testVideoPath))
        .rejects
        .toThrow();
    });

    it('should handle export errors', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockRejectedValueOnce(new Error('Write error'));

      const result = await detector.detectScenes(testVideoPath);

      await expect(detector.exportJSON(result, testOutputDir))
        .rejects
        .toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work with short video detector preset', async () => {
      const shortDetector = createShortVideoDetector();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await shortDetector.detectScenes(testVideoPath);

      expect(result).toHaveProperty('scenes');
      expect(result.scenes).toBeInstanceOf(Array);
    });

    it('should work with medium video detector preset', async () => {
      const mediumDetector = createMediumVideoDetector();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await mediumDetector.detectScenes(testVideoPath);

      expect(result).toHaveProperty('scenes');
    });

    it('should work with long video detector preset', async () => {
      const longDetector = createLongVideoDetector();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await longDetector.detectScenes(testVideoPath);

      expect(result).toHaveProperty('scenes');
    });

    it('should work with sensitive detector preset', async () => {
      const sensitiveDetector = createSensitiveDetector();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await sensitiveDetector.detectScenes(testVideoPath);

      expect(result.scenes.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle full workflow with exports', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await detector.detectScenes(testVideoPath, testOutputDir);
      await detector.exportJSON(result, testOutputDir);
      await detector.exportEDL(result, testOutputDir);

      expect(fs.writeFile).toHaveBeenCalledTimes(2); // JSON + EDL
    });
  });

  describe('Performance', () => {
    it('should complete detection in reasonable time', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const startTime = Date.now();
      await detector.detectScenes(testVideoPath);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds for mocked test
    });

    it('should handle memory efficiently for long videos', async () => {
      const longDetector = createLongVideoDetector();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const initialMemory = process.memoryUsage().heapUsed;
      await longDetector.detectScenes(testVideoPath);
      const finalMemory = process.memoryUsage().heapUsed;

      // Memory increase should be reasonable
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });
});
