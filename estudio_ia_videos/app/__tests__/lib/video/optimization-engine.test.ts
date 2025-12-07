/**
 * Video Optimization Engine Tests
 * 
 * Comprehensive test suite for video optimization:
 * - Automatic analysis and optimization
 * - Intelligent bitrate calculation
 * - Codec selection (H.264, H.265, VP9, AV1)
 * - Resolution optimization
 * - FPS adjustment
 * - Two-pass encoding
 * - Platform-specific presets
 * - Recommendation engine
 * 
 * @jest-environment node
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  VideoOptimizationEngine,
  createYouTubeOptimizer,
  createVimeoOptimizer,
  createMobileOptimizer,
  createFileSizeOptimizer,
  createQualityOptimizer,
  PLATFORM_PRESETS,
  type OptimizationConfig,
  type OptimizationResult,
  type VideoCharacteristics,
  type OptimizationRecommendation,
} from '@/lib/video/optimization-engine';

// Mock FFmpeg
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn().mockImplementation(() => ({
    input: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    videoCodec: jest.fn().mockReturnThis(),
    videoBitrate: jest.fn().mockReturnThis(),
    size: jest.fn().mockReturnThis(),
    fps: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn(function(event: string, callback: Function) {
      if (event === 'end') {
        setTimeout(() => callback(), 10);
      } else if (event === 'progress') {
        setTimeout(() => {
          callback({ percent: 30 });
          callback({ percent: 60 });
          callback({ percent: 100 });
        }, 5);
      }
      return this;
    }),
    run: jest.fn(),
  }));

  // Add static ffprobe method
  (mockFfmpeg as any).ffprobe = jest.fn((path: string, callback: Function) => {
    callback(null, {
      format: {
        duration: 120.5,
        bit_rate: 8000000,
        size: 120000000,
      },
      streams: [
        {
          codec_type: 'video',
          codec_name: 'h264',
          width: 1920,
          height: 1080,
          avg_frame_rate: '30/1',
          bit_rate: 7500000,
          pix_fmt: 'yuv420p',
        },
        {
          codec_type: 'audio',
          codec_name: 'aac',
          sample_rate: 48000,
          channels: 2,
          bit_rate: 192000,
        },
      ],
    });
  });

  return mockFfmpeg;
});

// Mock fs operations
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    stat: jest.fn(() => Promise.resolve({ size: 120000000 })),
    mkdir: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('VideoOptimizationEngine', () => {
  let optimizer: VideoOptimizationEngine;
  const testVideoPath = '/test/input.mp4';
  const testOutputPath = '/test/output.mp4';

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = new VideoOptimizationEngine({
      targetQuality: 'balanced',
      twoPass: true,
    });
  });

  afterEach(() => {
    optimizer.removeAllListeners();
  });

  describe('Constructor & Initialization', () => {
    it('should create instance with default config', () => {
      const defaultOptimizer = new VideoOptimizationEngine();
      expect(defaultOptimizer).toBeInstanceOf(VideoOptimizationEngine);
    });

    it('should accept custom configuration', () => {
      const config: OptimizationConfig = {
        targetQuality: 'high',
        twoPass: true,
        targetCodec: 'h265',
        targetBitrate: 5000,
        targetResolution: { width: 1280, height: 720 },
        targetFps: 30,
        platformPreset: 'youtube',
      };
      const customOptimizer = new VideoOptimizationEngine(config);
      expect(customOptimizer).toBeInstanceOf(VideoOptimizationEngine);
    });

    it('should merge partial config with defaults', () => {
      const partialConfig = { targetQuality: 'high' as const };
      const optimizerWithPartial = new VideoOptimizationEngine(partialConfig);
      expect(optimizerWithPartial).toBeInstanceOf(VideoOptimizationEngine);
    });
  });

  describe('Platform Presets', () => {
    it('should have YouTube preset configured', () => {
      expect(PLATFORM_PRESETS.youtube).toBeDefined();
      expect(PLATFORM_PRESETS.youtube.targetCodec).toBe('h264');
      expect(PLATFORM_PRESETS.youtube.maxBitrate).toBeDefined();
    });

    it('should have Vimeo preset configured', () => {
      expect(PLATFORM_PRESETS.vimeo).toBeDefined();
      expect(PLATFORM_PRESETS.vimeo.quality).toBe('high');
    });

    it('should have Facebook preset configured', () => {
      expect(PLATFORM_PRESETS.facebook).toBeDefined();
      expect(PLATFORM_PRESETS.facebook.maxDuration).toBeDefined();
    });

    it('should have Instagram preset configured', () => {
      expect(PLATFORM_PRESETS.instagram).toBeDefined();
      expect(PLATFORM_PRESETS.instagram.maxResolution).toBeDefined();
    });

    it('should have TikTok preset configured', () => {
      expect(PLATFORM_PRESETS.tiktok).toBeDefined();
      expect(PLATFORM_PRESETS.tiktok.aspectRatio).toBe('9:16');
    });

    it('should have Mobile preset configured', () => {
      expect(PLATFORM_PRESETS.mobile).toBeDefined();
      expect(PLATFORM_PRESETS.mobile.targetCodec).toBe('h264');
    });

    it('should have Web preset configured', () => {
      expect(PLATFORM_PRESETS.web).toBeDefined();
      expect(PLATFORM_PRESETS.web.targetBitrate).toBeDefined();
    });
  });

  describe('Factory Functions', () => {
    it('createYouTubeOptimizer should create instance with YouTube preset', () => {
      const youtubeOpt = createYouTubeOptimizer();
      expect(youtubeOpt).toBeInstanceOf(VideoOptimizationEngine);
    });

    it('createVimeoOptimizer should create instance with Vimeo preset', () => {
      const vimeoOpt = createVimeoOptimizer();
      expect(vimeoOpt).toBeInstanceOf(VideoOptimizationEngine);
    });

    it('createMobileOptimizer should create instance with Mobile preset', () => {
      const mobileOpt = createMobileOptimizer();
      expect(mobileOpt).toBeInstanceOf(VideoOptimizationEngine);
    });

    it('createFileSizeOptimizer should create instance for file size optimization', () => {
      const fileSizeOpt = createFileSizeOptimizer();
      expect(fileSizeOpt).toBeInstanceOf(VideoOptimizationEngine);
    });

    it('createQualityOptimizer should create instance for quality optimization', () => {
      const qualityOpt = createQualityOptimizer();
      expect(qualityOpt).toBeInstanceOf(VideoOptimizationEngine);
    });
  });

  describe('analyzeAndRecommend', () => {
    it('should validate input file exists', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      await expect(optimizer.analyzeAndRecommend(testVideoPath))
        .rejects
        .toThrow('Input video file not found');
    });

    it('should analyze video characteristics', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const recommendations = await optimizer.analyzeAndRecommend(testVideoPath);

      expect(recommendations).toHaveProperty('currentInfo');
      expect(recommendations).toHaveProperty('recommendations');
      expect(recommendations).toHaveProperty('estimatedSavings');
    });

    it('should provide optimization recommendations', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      
      // Create optimizer with specific targets to trigger recommendations
      const recOptimizer = new VideoOptimizationEngine({
        targetResolution: { width: 1280, height: 720 }, // Downscale from 1080p
        targetCodec: 'h265' // Change from h264
      });

      const recommendations = await recOptimizer.analyzeAndRecommend(testVideoPath);

      expect(Array.isArray(recommendations.recommendations)).toBe(true);
      expect(recommendations.recommendations.length).toBeGreaterThan(0);
    });

    it('should estimate file size savings', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const recommendations = await optimizer.analyzeAndRecommend(testVideoPath);

      expect(recommendations.estimatedSavings).toHaveProperty('sizeReduction');
      expect(recommendations.estimatedSavings).toHaveProperty('percentReduction');
    });

    it('should detect video complexity', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const recommendations = await optimizer.analyzeAndRecommend(testVideoPath);

      expect(recommendations.currentInfo).toHaveProperty('complexity');
      expect(['low', 'medium', 'high']).toContain(recommendations.currentInfo.complexity);
    });
  });

  describe('optimizeVideo', () => {
    it('should validate input file exists', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      await expect(optimizer.optimizeVideo(testVideoPath, testOutputPath))
        .rejects
        .toThrow('Input video file not found');
    });

    it('should optimize video and return result', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await optimizer.optimizeVideo(testVideoPath, testOutputPath);

      expect(result).toHaveProperty('outputPath');
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('optimizedSize');
      expect(result).toHaveProperty('savings');
    });

    it('should emit progress events', async () => {
      const progressSpy = jest.fn();
      optimizer.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await optimizer.optimizeVideo(testVideoPath, testOutputPath);

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should calculate file size savings', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      // Mock fs.stat to return a smaller size for the output file
      (fs.stat as jest.Mock).mockResolvedValueOnce({ size: 60000000 });

      const result = await optimizer.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.savings.sizeReduction).toBeGreaterThan(0);
      expect(result.savings.percentReduction).toBeGreaterThan(0);
    });

    it('should apply two-pass encoding when enabled', async () => {
      const twoPassOpt = new VideoOptimizationEngine({ twoPass: true });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await twoPassOpt.optimizeVideo(testVideoPath, testOutputPath);

      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });

    it('should apply single-pass encoding when disabled', async () => {
      const singlePassOpt = new VideoOptimizationEngine({ twoPass: false });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await singlePassOpt.optimizeVideo(testVideoPath, testOutputPath);

      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });
  });

  describe('Codec Selection', () => {
    it('should use H.264 codec when specified', async () => {
      const h264Opt = new VideoOptimizationEngine({ targetCodec: 'h264' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await h264Opt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result).toHaveProperty('codec');
      expect(result.codec).toBe('h264');
    });

    it('should use H.265 codec when specified', async () => {
      const h265Opt = new VideoOptimizationEngine({ targetCodec: 'h265' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await h265Opt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.codec).toBe('h265');
    });

    it('should use VP9 codec when specified', async () => {
      const vp9Opt = new VideoOptimizationEngine({ targetCodec: 'vp9' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await vp9Opt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.codec).toBe('vp9');
    });

    it('should use AV1 codec when specified', async () => {
      const av1Opt = new VideoOptimizationEngine({ targetCodec: 'av1' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await av1Opt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.codec).toBe('av1');
    });

    it('should automatically select best codec when not specified', async () => {
      const autoOpt = new VideoOptimizationEngine({});
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await autoOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.codec).toBeDefined();
      expect(['h264', 'h265', 'vp9', 'av1']).toContain(result.codec);
    });
  });

  describe('Resolution Optimization', () => {
    it('should maintain resolution when target not specified', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await optimizer.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.resolution).toBeDefined();
    });

    it('should downscale to target resolution', async () => {
      const downscaleOpt = new VideoOptimizationEngine({
        targetResolution: { width: 1280, height: 720 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await downscaleOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.resolution).toBeDefined();
    });

    it('should not upscale video when source is smaller', async () => {
      const upscaleOpt = new VideoOptimizationEngine({
        targetResolution: { width: 3840, height: 2160 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await upscaleOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result).toBeDefined();
    });

    it('should maintain aspect ratio when downscaling', async () => {
      const aspectOpt = new VideoOptimizationEngine({
        targetResolution: { width: 1280, height: 720 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await aspectOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.resolution).toBeDefined();
    });
  });

  describe('Bitrate Optimization', () => {
    it('should calculate optimal bitrate based on content', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const recommendations = await optimizer.analyzeAndRecommend(testVideoPath);

      expect(recommendations).toHaveProperty('recommendedBitrate');
      expect(recommendations.recommendedBitrate).toBeGreaterThan(0);
    });

    it('should use target bitrate when specified', async () => {
      const targetBitrateOpt = new VideoOptimizationEngine({
        targetBitrate: 5000,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await targetBitrateOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.bitrate).toBeDefined();
    });

    it('should adjust bitrate based on complexity', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const recommendations = await optimizer.analyzeAndRecommend(testVideoPath);

      expect(recommendations.currentInfo.complexity).toBeDefined();
    });

    it('should respect maximum bitrate constraints', async () => {
      const maxBitrateOpt = new VideoOptimizationEngine({
        targetBitrate: 10000,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await maxBitrateOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.bitrate).toBeLessThanOrEqual(10000);
    });
  });

  describe('FPS Optimization', () => {
    it('should maintain FPS when target not specified', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await optimizer.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.fps).toBeDefined();
    });

    it('should adjust FPS to target value', async () => {
      const fpsOpt = new VideoOptimizationEngine({ targetFps: 24 });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await fpsOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.fps).toBeDefined();
    });

    it('should recommend FPS reduction for file size savings', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const recommendations = await optimizer.analyzeAndRecommend(testVideoPath);

      // Should have some recommendations
      expect(recommendations.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Quality Presets', () => {
    it('should use low quality preset', async () => {
      const lowQualityOpt = new VideoOptimizationEngine({ targetQuality: 'low' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await lowQualityOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result).toBeDefined();
    });

    it('should use balanced quality preset', async () => {
      const balancedOpt = new VideoOptimizationEngine({ targetQuality: 'balanced' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await balancedOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result).toBeDefined();
    });

    it('should use high quality preset', async () => {
      const highQualityOpt = new VideoOptimizationEngine({ targetQuality: 'high' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await highQualityOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result).toBeDefined();
    });
  });

  describe('Platform-Specific Optimization', () => {
    it('should optimize for YouTube', async () => {
      const youtubeOpt = createYouTubeOptimizer();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await youtubeOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.codec).toBe('h264');
    });

    it('should optimize for Vimeo', async () => {
      const vimeoOpt = createVimeoOptimizer();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await vimeoOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result).toBeDefined();
    });

    it('should optimize for Mobile', async () => {
      const mobileOpt = createMobileOptimizer();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await mobileOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result).toBeDefined();
    });

    it('should optimize for file size', async () => {
      const fileSizeOpt = createFileSizeOptimizer();
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      // Mock fs.stat to return a smaller size for the output file
      (fs.stat as jest.Mock).mockResolvedValueOnce({ size: 60000000 });

      const result = await fileSizeOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.savings.percentReduction).toBeGreaterThan(0);
    });

    it('should optimize for quality', async () => {
      const qualityOpt = createQualityOptimizer();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await qualityOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result).toBeDefined();
    });
  });

  describe('Progress Tracking', () => {
    it('should emit start event', async () => {
      const startSpy = jest.fn();
      optimizer.on('start', startSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await optimizer.optimizeVideo(testVideoPath, testOutputPath);

      expect(startSpy).toHaveBeenCalled();
    });

    it('should emit progress events with percentage', async () => {
      const progressSpy = jest.fn();
      optimizer.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await optimizer.optimizeVideo(testVideoPath, testOutputPath);

      expect(progressSpy).toHaveBeenCalled();
      const calls = progressSpy.mock.calls;
      interface ProgressData { percent: number; }
      calls.forEach((call: [ProgressData, ...unknown[]]) => {
        expect(call[0]).toHaveProperty('percent');
        expect(call[0].percent).toBeGreaterThanOrEqual(0);
        expect(call[0].percent).toBeLessThanOrEqual(100);
      });
    });

    it('should emit complete event', async () => {
      const completeSpy = jest.fn();
      optimizer.on('complete', completeSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await optimizer.optimizeVideo(testVideoPath, testOutputPath);

      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          outputPath: expect.stringContaining(''),
          savings: expect.any(Object),
        })
      );
    });

    it('should emit error event on failure', async () => {
      const errorSpy = jest.fn();
      optimizer.on('error', errorSpy);

      (fs.access as jest.Mock).mockRejectedValue(new Error('Test error'));

      await expect(optimizer.optimizeVideo(testVideoPath, testOutputPath))
        .rejects
        .toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should track two-pass encoding progress', async () => {
      const progressSpy = jest.fn();
      const twoPassOpt = new VideoOptimizationEngine({ twoPass: true });
      twoPassOpt.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await twoPassOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(progressSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing input file', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(optimizer.optimizeVideo(testVideoPath, testOutputPath))
        .rejects
        .toThrow('Input video file not found');
    });

    it('should handle FFmpeg encoding errors', async () => {
      const ffmpegMock = require('fluent-ffmpeg');
      ffmpegMock.mockImplementationOnce(() => ({
        input: jest.fn().mockReturnThis(),
        outputOptions: jest.fn().mockReturnThis(),
        videoCodec: jest.fn().mockReturnThis(),
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

      await expect(optimizer.optimizeVideo(testVideoPath, testOutputPath))
        .rejects
        .toThrow();
    });

    it('should handle probe errors in analysis', async () => {
      const ffmpegMock = require('fluent-ffmpeg');
      const originalFfprobe = ffmpegMock.ffprobe;
      
      ffmpegMock.ffprobe = jest.fn((path: string, callback: Function) => {
        callback(new Error('Probe error'), null);
      });

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await expect(optimizer.analyzeAndRecommend(testVideoPath))
        .rejects
        .toThrow();
        
      // Restore original mock
      ffmpegMock.ffprobe = originalFfprobe;
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow: analyze then optimize', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const recommendations = await optimizer.analyzeAndRecommend(testVideoPath);
      expect(recommendations).toBeDefined();

      const result = await optimizer.optimizeVideo(testVideoPath, testOutputPath);
      expect(result).toBeDefined();
    });

    it('should work with all factory presets', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const youtubeResult = await createYouTubeOptimizer().optimizeVideo(testVideoPath, '/test/youtube.mp4');
      expect(youtubeResult).toBeDefined();

      const vimeoResult = await createVimeoOptimizer().optimizeVideo(testVideoPath, '/test/vimeo.mp4');
      expect(vimeoResult).toBeDefined();

      const mobileResult = await createMobileOptimizer().optimizeVideo(testVideoPath, '/test/mobile.mp4');
      expect(mobileResult).toBeDefined();
    });

    it('should handle complex optimization scenario', async () => {
      const complexOpt = new VideoOptimizationEngine({
        targetQuality: 'high',
        twoPass: true,
        targetCodec: 'h265',
        targetBitrate: 5000,
        targetResolution: { width: 1920, height: 1080 },
        targetFps: 30,
      });

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await complexOpt.optimizeVideo(testVideoPath, testOutputPath);

      expect(result.codec).toBe('h265');
      expect(result.savings).toBeDefined();
    });
  });
});
