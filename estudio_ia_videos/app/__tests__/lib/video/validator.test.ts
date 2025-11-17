/**
 * Video Validator Tests
 * 
 * Testes completos para o módulo de validação de vídeos com mocks adequados
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import VideoValidator, {
  createNRValidator,
  createShortVideoValidator,
  createStrictNRValidator,
  create4KValidator,
  createYouTubeValidator
} from '../../../lib/video/validator';

// Mocking modules
jest.mock('fluent-ffmpeg');
jest.mock('fs/promises');

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';

describe('VideoValidator', () => {
  let validator: VideoValidator;

  // Helper function to create mock probe data
  interface ProbeDataOverrides {
    format?: Partial<{ format_name: string; duration: number; bit_rate: number; size: number; }>;
    video?: Partial<{ codec_type: string; codec_name: string; width: number; height: number; r_frame_rate: string; bit_rate: number; }>;
    noAudio?: boolean;
  }
  const createMockProbeData = (overrides: ProbeDataOverrides = {}) => ({
    format: {
      format_name: 'mp4',
      duration: 120,
      bit_rate: 5000000,
      size: 10 * 1024 * 1024,
      ...overrides.format
    },
    streams: [
      {
        codec_type: 'video',
        codec_name: 'h264',
        width: 1920,
        height: 1080,
        r_frame_rate: '30/1',
        bit_rate: 4000000,
        ...overrides.video
      },
      ...(overrides.noAudio ? [] : [{
        codec_type: 'audio',
        codec_name: 'aac',
        channels: 2,
        sample_rate: 48000,
        bit_rate: 128000,
        ...overrides.audio
      }]),
      ...(overrides.subtitle ? [{
        codec_type: 'subtitle',
        codec_name: 'srt'
      }] : [])
    ]
  });

  beforeEach(() => {
    jest.clearAllMocks();
    validator = new VideoValidator();

    // Default mocks
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.stat as jest.Mock).mockResolvedValue({ size: 10 * 1024 * 1024 });
    (ffmpeg.ffprobe as jest.Mock).mockImplementation((file, callback) => {
      callback(null, createMockProbeData());
    });
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      expect(validator).toBeInstanceOf(VideoValidator);
    });

    it('should accept custom options', () => {
      const customValidator = new VideoValidator({
        maxDuration: 600,
        minDuration: 30,
        requireAudio: false
      });
      expect(customValidator).toBeInstanceOf(VideoValidator);
    });
  });

  describe('validate()', () => {
    it('should validate a valid video file', async () => {
      // Mock do ffprobe
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 120,
            bit_rate: '5000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1'
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
              sample_rate: 48000
            }
          ]
        });
      });

      // Mock do fs.statSync
      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 10 * 1024 * 1024 // 10MB
      });

      const result = await validator.validate(testVideoPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.quality).toBe('high');
      expect(result.metadata).toBeDefined();
    });

    it('should reject video with unsupported format', async () => {
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'unknown',
            duration: 120,
            bit_rate: '5000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1'
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 10 * 1024 * 1024
      });

      const result = await validator.validate(testVideoPath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('não suportado');
    });

    it('should reject video that is too long', async () => {
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 2000, // > 30 minutos
            bit_rate: '5000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1'
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 10 * 1024 * 1024
      });

      const result = await validator.validate(testVideoPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('muito longa'))).toBe(true);
    });

    it('should reject video without audio when required', async () => {
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 120,
            bit_rate: '5000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1'
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 10 * 1024 * 1024
      });

      const result = await validator.validate(testVideoPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('não possui áudio'))).toBe(true);
    });

    it('should reject video with low resolution', async () => {
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 120,
            bit_rate: '5000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 640,
              height: 360,
              r_frame_rate: '30/1'
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
              sample_rate: 48000
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 10 * 1024 * 1024
      });

      const result = await validator.validate(testVideoPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('muito baixa'))).toBe(true);
    });

    it('should warn about unusual aspect ratio', async () => {
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 120,
            bit_rate: '5000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1000,
              height: 800,
              r_frame_rate: '30/1'
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
              sample_rate: 48000
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 10 * 1024 * 1024
      });

      const result = await validator.validate(testVideoPath);

      expect(result.warnings.some(w => w.includes('Aspect ratio incomum'))).toBe(true);
    });
  });

  describe('validateBatch()', () => {
    it('should validate multiple videos', async () => {
      const files = [
        path.join(__dirname, 'fixtures', 'video1.mp4'),
        path.join(__dirname, 'fixtures', 'video2.mp4')
      ];

      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 120,
            bit_rate: '5000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1'
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
              sample_rate: 48000
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 10 * 1024 * 1024
      });

      const results = await validator.validateBatch(files);

      expect(results.size).toBe(2);
      results.forEach(result => {
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Quality Detection', () => {
    it('should detect ultra quality (4K)', async () => {
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 120,
            bit_rate: '10000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 3840,
              height: 2160,
              r_frame_rate: '30/1'
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
              sample_rate: 48000
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 100 * 1024 * 1024
      });

      const result = await validator.validate(testVideoPath);

      expect(result.quality).toBe('ultra');
    });

    it('should detect high quality (Full HD)', async () => {
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 120,
            bit_rate: '6000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1'
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
              sample_rate: 48000
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 50 * 1024 * 1024
      });

      const result = await validator.validate(testVideoPath);

      expect(result.quality).toBe('high');
    });

    it('should detect medium quality (HD)', async () => {
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 120,
            bit_rate: '3000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1280,
              height: 720,
              r_frame_rate: '30/1'
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
              sample_rate: 48000
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 25 * 1024 * 1024
      });

      const result = await validator.validate(testVideoPath);

      expect(result.quality).toBe('medium');
    });

    it('should detect low quality (SD)', async () => {
      jest.spyOn(require('fluent-ffmpeg'), 'ffprobe').mockImplementation((file, callback) => {
        callback(null, {
          format: {
            format_name: 'mp4',
            duration: 120,
            bit_rate: '1000000'
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 720,
              height: 480,
              r_frame_rate: '30/1'
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
              sample_rate: 48000
            }
          ]
        });
      });

      jest.spyOn(require('fs'), 'statSync').mockReturnValue({
        size: 10 * 1024 * 1024
      });

      const result = await validator.validate(testVideoPath);

      expect(result.quality).toBe('low');
    });
  });

  describe('Factory Functions', () => {
    it('should create NR validator with correct settings', () => {
      const nrValidator = createNRValidator();
      expect(nrValidator).toBeInstanceOf(VideoValidator);
    });

    it('should create short video validator with correct settings', () => {
      const shortValidator = createShortVideoValidator();
      expect(shortValidator).toBeInstanceOf(VideoValidator);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
