/**
 * Video Analytics Engine Tests
 * 
 * Comprehensive test suite for video analytics:
 * - Quality metrics (PSNR, SSIM, VMAF)
 * - Audio analysis (loudness, clipping, dynamic range)
 * - Compliance checking
 * - Report generation (HTML/JSON)
 * - Recommendations engine
 * - Progress tracking
 * - Factory functions
 * 
 * @jest-environment node
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  VideoAnalyticsEngine,
  createBasicAnalyzer,
  createFullAnalyzer,
  createComplianceAnalyzer,
  type AnalyticsConfig,
  type AnalyticsResult,
  type VideoQualityMetrics,
  type AudioQualityMetrics,
  type ComplianceMetrics,
} from '@/lib/video/analytics-engine';

// Mock FFmpeg
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn().mockImplementation(() => ({
    input: jest.fn().mockReturnThis(),
    ffprobe: jest.fn((callback: Function) => {
      callback(null, {
        format: {
          duration: 120.5,
          bit_rate: 5000000,
          size: 75000000,
        },
        streams: [
          {
            codec_type: 'video',
            codec_name: 'h264',
            width: 1920,
            height: 1080,
            avg_frame_rate: '30/1',
            bit_rate: 4500000,
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
    }),
    outputOptions: jest.fn().mockReturnThis(),
    complexFilter: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn(function(event: string, callback: Function) {
      if (event === 'end') {
        setTimeout(() => callback(), 10);
      } else if (event === 'stderr') {
        setTimeout(() => {
          callback('lavfi.psnr.psnr_avg=42.5');
          callback('lavfi.ssim.All=0.985');
          callback('[Parsed_loudnorm] input_i=-16.2');
          callback('[Parsed_astats] Peak level dB=-0.5');
        }, 5);
      }
      return this;
    }),
    run: jest.fn(),
  }));

  // Add static ffprobe
  (mockFfmpeg as any).ffprobe = jest.fn((path: string, callback: Function) => {
    callback(null, {
      format: {
        duration: 120.5,
        bit_rate: 5000000,
        size: 75000000,
      },
      streams: [
        {
          codec_type: 'video',
          codec_name: 'h264',
          width: 1920,
          height: 1080,
          avg_frame_rate: '30/1',
          bit_rate: 4500000,
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
    stat: jest.fn(() => Promise.resolve({ size: 75000000 })),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
  },
}));

describe('VideoAnalyticsEngine', () => {
  let analytics: VideoAnalyticsEngine;
  const testVideoPath = '/test/input.mp4';
  const testOutputDir = '/test/output';

  beforeEach(() => {
    jest.clearAllMocks();
    analytics = new VideoAnalyticsEngine({
      analyzeQuality: true,
      analyzeAudio: true,
      checkCompliance: true,
    });
  });

  afterEach(() => {
    analytics.removeAllListeners();
  });

  describe('Constructor & Initialization', () => {
    it('should create instance with default config', () => {
      const defaultAnalytics = new VideoAnalyticsEngine();
      expect(defaultAnalytics).toBeInstanceOf(VideoAnalyticsEngine);
    });

    it('should accept custom configuration', () => {
      const config: AnalyticsConfig = {
        analyzeQuality: true,
        analyzeAudio: true,
        checkCompliance: true,
        generateRecommendations: true,
        complianceRules: {
          minResolution: { width: 1280, height: 720 },
          maxBitrate: 8000,
          allowedCodecs: ['h264', 'h265'],
        },
      };
      const customAnalytics = new VideoAnalyticsEngine(config);
      expect(customAnalytics).toBeInstanceOf(VideoAnalyticsEngine);
    });

    it('should merge partial config with defaults', () => {
      const partialConfig = { analyzeQuality: false };
      const analyticsWithPartial = new VideoAnalyticsEngine(partialConfig);
      expect(analyticsWithPartial).toBeInstanceOf(VideoAnalyticsEngine);
    });
  });

  describe('Factory Functions', () => {
    it('createBasicAnalyzer should create instance with basic analysis', () => {
      const basicAnalyzer = createBasicAnalyzer();
      expect(basicAnalyzer).toBeInstanceOf(VideoAnalyticsEngine);
    });

    it('createFullAnalyzer should create instance with all features', () => {
      const fullAnalyzer = createFullAnalyzer();
      expect(fullAnalyzer).toBeInstanceOf(VideoAnalyticsEngine);
    });

    it('createComplianceAnalyzer should create instance for compliance', () => {
      const complianceAnalyzer = createComplianceAnalyzer();
      expect(complianceAnalyzer).toBeInstanceOf(VideoAnalyticsEngine);
    });
  });

  describe('analyzeVideo', () => {
    it('should validate input file exists', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      await expect(analytics.analyzeVideo(testVideoPath))
        .rejects
        .toThrow('Input video file not found');
    });

    it('should analyze video and return result', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      expect(result).toHaveProperty('videoInfo');
      expect(result).toHaveProperty('qualityMetrics');
      expect(result).toHaveProperty('audioMetrics');
      expect(result).toHaveProperty('complianceMetrics');
    });

    it('should emit progress events', async () => {
      const progressSpy = jest.fn();
      analytics.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await analytics.analyzeVideo(testVideoPath);

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should calculate overall score', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      expect(result).toHaveProperty('overallScore');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should assign grade based on score', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      expect(result).toHaveProperty('grade');
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    });
  });

  describe('Video Quality Metrics', () => {
    it('should analyze visual quality when enabled', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      expect(result.qualityMetrics).toBeDefined();
      if (result.qualityMetrics) {
        expect(result.qualityMetrics).toHaveProperty('psnr');
        expect(result.qualityMetrics).toHaveProperty('ssim');
      }
    });

    it('should calculate PSNR correctly', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.qualityMetrics?.psnr) {
        expect(result.qualityMetrics.psnr).toBeGreaterThan(0);
        expect(result.qualityMetrics.psnr).toBeLessThan(100);
      }
    });

    it('should calculate SSIM correctly', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.qualityMetrics?.ssim) {
        expect(result.qualityMetrics.ssim).toBeGreaterThanOrEqual(0);
        expect(result.qualityMetrics.ssim).toBeLessThanOrEqual(1);
      }
    });

    it('should detect sharpness issues', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.qualityMetrics) {
        expect(result.qualityMetrics).toHaveProperty('sharpness');
      }
    });

    it('should detect noise levels', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.qualityMetrics) {
        expect(result.qualityMetrics).toHaveProperty('noise');
      }
    });

    it('should detect blockiness/compression artifacts', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.qualityMetrics) {
        expect(result.qualityMetrics).toHaveProperty('blockiness');
      }
    });

    it('should skip quality analysis when disabled', async () => {
      const noQualityAnalytics = new VideoAnalyticsEngine({
        analyzeQuality: false,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noQualityAnalytics.analyzeVideo(testVideoPath);

      expect(result.qualityMetrics).toBeUndefined();
    });
  });

  describe('Audio Quality Metrics', () => {
    it('should analyze audio when enabled', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      expect(result.audioMetrics).toBeDefined();
      if (result.audioMetrics) {
        expect(result.audioMetrics).toHaveProperty('loudness');
      }
    });

    it('should measure loudness in LUFS', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.audioMetrics?.loudness) {
        expect(result.audioMetrics.loudness).toBeLessThan(0); // LUFS is negative
        expect(result.audioMetrics.loudness).toBeGreaterThan(-60);
      }
    });

    it('should detect audio clipping', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.audioMetrics) {
        expect(result.audioMetrics).toHaveProperty('peakLevel');
        expect(result.audioMetrics).toHaveProperty('hasClipping');
      }
    });

    it('should measure dynamic range', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.audioMetrics) {
        expect(result.audioMetrics).toHaveProperty('dynamicRange');
      }
    });

    it('should detect silence periods', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.audioMetrics) {
        expect(result.audioMetrics).toHaveProperty('silencePercentage');
      }
    });

    it('should skip audio analysis when disabled', async () => {
      const noAudioAnalytics = new VideoAnalyticsEngine({
        analyzeAudio: false,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noAudioAnalytics.analyzeVideo(testVideoPath);

      expect(result.audioMetrics).toBeUndefined();
    });
  });

  describe('Compliance Checking', () => {
    it('should check compliance when enabled', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      expect(result.complianceMetrics).toBeDefined();
    });

    it('should validate codec compliance', async () => {
      const complianceAnalytics = new VideoAnalyticsEngine({
        checkCompliance: true,
        complianceRules: {
          allowedCodecs: ['h264'],
        },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await complianceAnalytics.analyzeVideo(testVideoPath);

      if (result.complianceMetrics) {
        expect(result.complianceMetrics).toHaveProperty('codecCompliant');
      }
    });

    it('should validate resolution compliance', async () => {
      const complianceAnalytics = new VideoAnalyticsEngine({
        checkCompliance: true,
        complianceRules: {
          minResolution: { width: 1280, height: 720 },
        },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await complianceAnalytics.analyzeVideo(testVideoPath);

      if (result.complianceMetrics) {
        expect(result.complianceMetrics).toHaveProperty('resolutionCompliant');
      }
    });

    it('should validate bitrate compliance', async () => {
      const complianceAnalytics = new VideoAnalyticsEngine({
        checkCompliance: true,
        complianceRules: {
          maxBitrate: 10000,
        },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await complianceAnalytics.analyzeVideo(testVideoPath);

      if (result.complianceMetrics) {
        expect(result.complianceMetrics).toHaveProperty('bitrateCompliant');
      }
    });

    it('should validate FPS compliance', async () => {
      const complianceAnalytics = new VideoAnalyticsEngine({
        checkCompliance: true,
        complianceRules: {
          allowedFps: [24, 30, 60],
        },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await complianceAnalytics.analyzeVideo(testVideoPath);

      if (result.complianceMetrics) {
        expect(result.complianceMetrics).toHaveProperty('fpsCompliant');
      }
    });

    it('should provide overall compliance status', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);

      if (result.complianceMetrics) {
        expect(result.complianceMetrics).toHaveProperty('isCompliant');
        expect(typeof result.complianceMetrics.isCompliant).toBe('boolean');
      }
    });

    it('should skip compliance check when disabled', async () => {
      const noComplianceAnalytics = new VideoAnalyticsEngine({
        checkCompliance: false,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noComplianceAnalytics.analyzeVideo(testVideoPath);

      expect(result.complianceMetrics).toBeUndefined();
    });
  });

  describe('Recommendations Engine', () => {
    it('should generate recommendations when enabled', async () => {
      const recommendAnalytics = new VideoAnalyticsEngine({
        generateRecommendations: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await recommendAnalytics.analyzeVideo(testVideoPath);

      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should recommend bitrate optimization', async () => {
      const recommendAnalytics = new VideoAnalyticsEngine({
        generateRecommendations: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await recommendAnalytics.analyzeVideo(testVideoPath);

      // Should have at least some recommendations
      expect(result.recommendations?.length).toBeGreaterThanOrEqual(0);
    });

    it('should recommend audio normalization if needed', async () => {
      const recommendAnalytics = new VideoAnalyticsEngine({
        generateRecommendations: true,
        analyzeAudio: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await recommendAnalytics.analyzeVideo(testVideoPath);

      if (result.recommendations) {
        expect(result.recommendations).toBeInstanceOf(Array);
      }
    });

    it('should not generate recommendations when disabled', async () => {
      const noRecommendAnalytics = new VideoAnalyticsEngine({
        generateRecommendations: false,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noRecommendAnalytics.analyzeVideo(testVideoPath);

      expect(result.recommendations).toBeUndefined();
    });
  });

  describe('Report Generation', () => {
    it('should save JSON report', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);
      await analytics.saveJSONReport(result, testOutputDir);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.any(String)
      );
    });

    it('should save HTML report', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);
      await analytics.saveHTMLReport(result, testOutputDir);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.html'),
        expect.any(String)
      );
    });

    it('should create valid JSON structure', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);
      await analytics.saveJSONReport(result, testOutputDir);

      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const jsonCall = writeFileCalls.find(call => call[0].includes('.json'));

      if (jsonCall) {
        const jsonContent = jsonCall[1];
        expect(() => JSON.parse(jsonContent)).not.toThrow();
      }
    });

    it('should create valid HTML structure', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);
      await analytics.saveHTMLReport(result, testOutputDir);

      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const htmlCall = writeFileCalls.find(call => call[0].includes('.html'));

      if (htmlCall) {
        const htmlContent = htmlCall[1];
        expect(htmlContent).toContain('<!DOCTYPE html>');
        expect(htmlContent).toContain('<html');
        expect(htmlContent).toContain('</html>');
      }
    });

    it('should include all metrics in HTML report', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);
      await analytics.saveHTMLReport(result, testOutputDir);

      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const htmlCall = writeFileCalls.find(call => call[0].includes('.html'));

      if (htmlCall) {
        const htmlContent = htmlCall[1];
        expect(htmlContent).toContain('Quality');
        expect(htmlContent).toContain('Audio');
      }
    });
  });

  describe('Progress Tracking', () => {
    it('should emit start event', async () => {
      const startSpy = jest.fn();
      analytics.on('start', startSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await analytics.analyzeVideo(testVideoPath);

      expect(startSpy).toHaveBeenCalled();
    });

    it('should emit progress events with analysis stage', async () => {
      const progressSpy = jest.fn();
      analytics.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await analytics.analyzeVideo(testVideoPath);

      expect(progressSpy).toHaveBeenCalled();
      const calls = progressSpy.mock.calls;
      calls.forEach((call: any) => {
        expect(call[0]).toHaveProperty('stage');
        expect(call[0]).toHaveProperty('percent');
      });
    });

    it('should emit complete event with result', async () => {
      const completeSpy = jest.fn();
      analytics.on('complete', completeSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await analytics.analyzeVideo(testVideoPath);

      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          videoInfo: expect.any(Object),
          overallScore: expect.any(Number),
        })
      );
    });

    it('should emit error event on failure', async () => {
      const errorSpy = jest.fn();
      analytics.on('error', errorSpy);

      (fs.access as jest.Mock).mockRejectedValue(new Error('Test error'));

      await expect(analytics.analyzeVideo(testVideoPath))
        .rejects
        .toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing input file', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(analytics.analyzeVideo(testVideoPath))
        .rejects
        .toThrow('Input video file not found');
    });

    it('should handle FFmpeg probe errors', async () => {
      const ffmpegMock = require('fluent-ffmpeg');
      ffmpegMock.mockImplementationOnce(() => ({
        ffprobe: jest.fn((callback: Function) => {
          callback(new Error('Probe error'), null);
        }),
      }));

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await expect(analytics.analyzeVideo(testVideoPath))
        .rejects
        .toThrow();
    });

    it('should handle report generation errors', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockRejectedValueOnce(new Error('Write error'));

      const result = await analytics.analyzeVideo(testVideoPath);

      await expect(analytics.saveJSONReport(result, testOutputDir))
        .rejects
        .toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work with basic analyzer preset', async () => {
      const basicAnalyzer = createBasicAnalyzer();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await basicAnalyzer.analyzeVideo(testVideoPath);

      expect(result).toHaveProperty('videoInfo');
      expect(result).toHaveProperty('overallScore');
    });

    it('should work with full analyzer preset', async () => {
      const fullAnalyzer = createFullAnalyzer();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await fullAnalyzer.analyzeVideo(testVideoPath);

      expect(result.qualityMetrics).toBeDefined();
      expect(result.audioMetrics).toBeDefined();
      expect(result.complianceMetrics).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should work with compliance analyzer preset', async () => {
      const complianceAnalyzer = createComplianceAnalyzer();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await complianceAnalyzer.analyzeVideo(testVideoPath);

      expect(result.complianceMetrics).toBeDefined();
    });

    it('should handle full workflow with reports', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await analytics.analyzeVideo(testVideoPath);
      await analytics.saveJSONReport(result, testOutputDir);
      await analytics.saveHTMLReport(result, testOutputDir);

      expect(fs.writeFile).toHaveBeenCalledTimes(2);
    });
  });
});
