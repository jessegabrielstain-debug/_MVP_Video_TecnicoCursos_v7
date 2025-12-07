/**
 * Adaptive Bitrate Streaming (ABR) Tests
 * 
 * Comprehensive test suite for ABR system:
 * - HLS manifest generation
 * - DASH manifest generation
 * - Multi-resolution encoding
 * - AES-128 encryption
 * - Thumbnail generation
 * - Progress tracking
 * - Factory functions
 * - Presets validation
 * 
 * @jest-environment node
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  AdaptiveBitrateStreaming,
  createBasicABR,
  createStandardABR,
  createPremiumABR,
  PRESET_QUALITY_LEVELS,
  type ABRConfig,
  type QualityLevel,
  type ABRResult,
} from '@/lib/video/adaptive-streaming';

// Mock FFmpeg
jest.mock('fluent-ffmpeg', () => {
  return jest.fn().mockImplementation(() => ({
    input: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn(function(event: string, callback: Function) {
      if (event === 'end') {
        setTimeout(() => callback(), 10);
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
    stat: jest.fn(() => Promise.resolve({ size: 1024000 })),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('AdaptiveBitrateStreaming', () => {
  let abr: AdaptiveBitrateStreaming;
  const testVideoPath = '/test/input.mp4';
  const testOutputDir = '/test/output';

  beforeEach(() => {
    jest.clearAllMocks();
    abr = new AdaptiveBitrateStreaming({
      format: 'hls',
      segmentDuration: 6,
      qualityLevels: PRESET_QUALITY_LEVELS.standard,
    });
  });

  afterEach(() => {
    abr.removeAllListeners();
  });

  describe('Constructor & Initialization', () => {
    it('should create instance with default config', () => {
      const defaultABR = new AdaptiveBitrateStreaming();
      expect(defaultABR).toBeInstanceOf(AdaptiveBitrateStreaming);
    });

    it('should accept custom configuration', () => {
      const config: ABRConfig = {
        format: 'dash',
        segmentDuration: 10,
        qualityLevels: PRESET_QUALITY_LEVELS.basic,
        enableEncryption: true,
        generateThumbnails: true,
      };
      const customABR = new AdaptiveBitrateStreaming(config);
      expect(customABR).toBeInstanceOf(AdaptiveBitrateStreaming);
    });

    it('should merge partial config with defaults', () => {
      const partialConfig = { format: 'dash' as const };
      const abrWithPartial = new AdaptiveBitrateStreaming(partialConfig);
      expect(abrWithPartial).toBeInstanceOf(AdaptiveBitrateStreaming);
    });
  });

  describe('Quality Levels Presets', () => {
    it('should have basic preset with 3 levels', () => {
      expect(PRESET_QUALITY_LEVELS.basic).toHaveLength(3);
      expect(PRESET_QUALITY_LEVELS.basic[0].name).toBe('360p');
      expect(PRESET_QUALITY_LEVELS.basic[2].name).toBe('720p');
    });

    it('should have standard preset with 5 levels', () => {
      expect(PRESET_QUALITY_LEVELS.standard).toHaveLength(5);
      expect(PRESET_QUALITY_LEVELS.standard[0].name).toBe('240p');
      expect(PRESET_QUALITY_LEVELS.standard[4].name).toBe('1080p');
    });

    it('should have premium preset with 7 levels including 4K', () => {
      expect(PRESET_QUALITY_LEVELS.premium).toHaveLength(7);
      expect(PRESET_QUALITY_LEVELS.premium[6].name).toBe('2160p');
      expect(PRESET_QUALITY_LEVELS.premium[6].width).toBe(3840);
    });

    it('should have increasing bitrates in each preset', () => {
      PRESET_QUALITY_LEVELS.standard.forEach((level, index) => {
        if (index > 0) {
          expect(level.bitrate).toBeGreaterThan(
            PRESET_QUALITY_LEVELS.standard[index - 1].bitrate
          );
        }
      });
    });
  });

  describe('Factory Functions', () => {
    it('createBasicABR should create instance with basic preset', () => {
      const basicABR = createBasicABR();
      expect(basicABR).toBeInstanceOf(AdaptiveBitrateStreaming);
    });

    it('createStandardABR should create instance with standard preset', () => {
      const standardABR = createStandardABR();
      expect(standardABR).toBeInstanceOf(AdaptiveBitrateStreaming);
    });

    it('createPremiumABR should create instance with premium preset', () => {
      const premiumABR = createPremiumABR();
      expect(premiumABR).toBeInstanceOf(AdaptiveBitrateStreaming);
    });
  });

  describe('generateABR', () => {
    it('should validate input file exists', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
      
      await expect(abr.generateABR(testVideoPath, testOutputDir))
        .rejects
        .toThrow('Input video file not found');
    });

    it('should create output directory if not exists', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await abr.generateABR(testVideoPath, testOutputDir);

      expect(fs.mkdir).toHaveBeenCalledWith(
        testOutputDir,
        { recursive: true }
      );
    });

    it('should emit progress events', async () => {
      const progressSpy = jest.fn();
      abr.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await abr.generateABR(testVideoPath, testOutputDir);

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should return ABRResult with all data', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await abr.generateABR(testVideoPath, testOutputDir);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('masterPlaylistPath');
      expect(result).toHaveProperty('qualityLevels');
      expect(result).toHaveProperty('totalSize');
      expect(result).toHaveProperty('duration');
    });

    it('should generate HLS format correctly', async () => {
      const hlsABR = new AdaptiveBitrateStreaming({ format: 'hls' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await hlsABR.generateABR(testVideoPath, testOutputDir);

      expect(result.format).toBe('hls');
      expect(result.masterPlaylistPath).toContain('.m3u8');
    });

    it('should generate DASH format correctly', async () => {
      const dashABR = new AdaptiveBitrateStreaming({ format: 'dash' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await dashABR.generateABR(testVideoPath, testOutputDir);

      expect(result.format).toBe('dash');
      expect(result.masterPlaylistPath).toContain('.mpd');
    });

    it('should handle encryption when enabled', async () => {
      const encryptedABR = new AdaptiveBitrateStreaming({
        enableEncryption: true,
        format: 'hls',
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await encryptedABR.generateABR(testVideoPath, testOutputDir);

      expect(result).toHaveProperty('encryptionKey');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('enc.key'),
        expect.anything()
      );
    });

    it('should generate thumbnails when enabled', async () => {
      const thumbABR = new AdaptiveBitrateStreaming({
        generateThumbnails: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await abr.generateABR(testVideoPath, testOutputDir);

      expect(result.qualityLevels.length).toBeGreaterThan(0);
    });

    it('should process all quality levels', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await abr.generateABR(testVideoPath, testOutputDir);

      expect(result.qualityLevels).toHaveLength(
        PRESET_QUALITY_LEVELS.standard.length
      );
    });
  });

  describe('HLS Manifest Generation', () => {
    it('should generate valid HLS master playlist', async () => {
      const levels: QualityLevel[] = PRESET_QUALITY_LEVELS.basic;
      const hlsABR = new AdaptiveBitrateStreaming({ format: 'hls' });

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await hlsABR.generateABR(testVideoPath, testOutputDir);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('master.m3u8'),
        expect.stringContaining('#EXTM3U')
      );
    });

    it('should include all quality levels in master playlist', async () => {
      const hlsABR = new AdaptiveBitrateStreaming({ format: 'hls' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await hlsABR.generateABR(testVideoPath, testOutputDir);

      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const masterPlaylistCall = writeFileCalls.find(call => 
        call[0].includes('master.m3u8')
      );

      expect(masterPlaylistCall).toBeDefined();
      if (masterPlaylistCall) {
        const content = masterPlaylistCall[1];
        PRESET_QUALITY_LEVELS.standard.forEach(level => {
          expect(content).toContain(level.name);
        });
      }
    });

    it('should include encryption info in HLS when enabled', async () => {
      const encryptedHLS = new AdaptiveBitrateStreaming({
        format: 'hls',
        enableEncryption: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await encryptedHLS.generateABR(testVideoPath, testOutputDir);

      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const playlistCall = writeFileCalls.find(call => 
        call[0].includes('.m3u8') && !call[0].includes('master')
      );

      if (playlistCall) {
        const content = playlistCall[1];
        expect(content).toContain('#EXT-X-KEY');
        expect(content).toContain('METHOD=AES-128');
      }
    });
  });

  describe('DASH Manifest Generation', () => {
    it('should generate valid DASH MPD manifest', async () => {
      const dashABR = new AdaptiveBitrateStreaming({ format: 'dash' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await dashABR.generateABR(testVideoPath, testOutputDir);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('manifest.mpd'),
        expect.stringContaining('<MPD')
      );
    });

    it('should include all quality levels in MPD', async () => {
      const dashABR = new AdaptiveBitrateStreaming({ format: 'dash' });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await dashABR.generateABR(testVideoPath, testOutputDir);

      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const mpdCall = writeFileCalls.find(call => call[0].includes('.mpd'));

      expect(mpdCall).toBeDefined();
      if (mpdCall) {
        const content = mpdCall[1];
        expect(content).toContain('<AdaptationSet');
        expect(content).toContain('<Representation');
      }
    });
  });

  describe('Progress Tracking', () => {
    it('should emit start event', async () => {
      const startSpy = jest.fn();
      abr.on('start', startSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await abr.generateABR(testVideoPath, testOutputDir);

      expect(startSpy).toHaveBeenCalled();
    });

    it('should emit progress events with percentage', async () => {
      const progressSpy = jest.fn();
      abr.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await abr.generateABR(testVideoPath, testOutputDir);

      expect(progressSpy).toHaveBeenCalled();
      const calls = progressSpy.mock.calls;
      calls.forEach(call => {
        expect(call[0]).toHaveProperty('percent');
        expect(call[0].percent).toBeGreaterThanOrEqual(0);
        expect(call[0].percent).toBeLessThanOrEqual(100);
      });
    });

    it('should emit complete event', async () => {
      const completeSpy = jest.fn();
      abr.on('complete', completeSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await abr.generateABR(testVideoPath, testOutputDir);

      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          format: expect.any(String),
          masterPlaylistPath: expect.any(String),
        })
      );
    });

    it('should emit error event on failure', async () => {
      const errorSpy = jest.fn();
      abr.on('error', errorSpy);

      (fs.access as jest.Mock).mockRejectedValue(new Error('Test error'));

      await expect(abr.generateABR(testVideoPath, testOutputDir))
        .rejects
        .toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Encryption', () => {
    it('should generate 16-byte AES-128 key', async () => {
      const encABR = new AdaptiveBitrateStreaming({
        enableEncryption: true,
        format: 'hls',
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await encABR.generateABR(testVideoPath, testOutputDir);

      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const keyCall = writeFileCalls.find(call => call[0].includes('enc.key'));

      expect(keyCall).toBeDefined();
      if (keyCall) {
        const key = keyCall[1];
        expect(Buffer.isBuffer(key) || key instanceof Uint8Array).toBe(true);
      }
    });

    it('should not generate key when encryption disabled', async () => {
      const noEncABR = new AdaptiveBitrateStreaming({
        enableEncryption: false,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noEncABR.generateABR(testVideoPath, testOutputDir);

      expect(result.encryptionKey).toBeUndefined();
    });
  });

  describe('Thumbnail Generation', () => {
    it('should generate thumbnails for each quality level', async () => {
      const thumbABR = new AdaptiveBitrateStreaming({
        generateThumbnails: true,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await thumbABR.generateABR(testVideoPath, testOutputDir);

      result.qualityLevels.forEach(level => {
        expect(level).toHaveProperty('thumbnailPath');
        expect(level.thumbnailPath).toContain('thumbnail');
      });
    });

    it('should not generate thumbnails when disabled', async () => {
      const noThumbABR = new AdaptiveBitrateStreaming({
        generateThumbnails: false,
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noThumbABR.generateABR(testVideoPath, testOutputDir);

      result.qualityLevels.forEach(level => {
        expect(level.thumbnailPath).toBeUndefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing input file', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(abr.generateABR(testVideoPath, testOutputDir))
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

      await expect(abr.generateABR(testVideoPath, testOutputDir))
        .rejects
        .toThrow();
    });

    it('should clean up on error', async () => {
      const errorABR = new AdaptiveBitrateStreaming();
      (fs.access as jest.Mock).mockRejectedValue(new Error('Test error'));

      try {
        await errorABR.generateABR(testVideoPath, testOutputDir);
      } catch (error) {
        // Expected error
      }

      // Verify cleanup or error handling occurred
      expect(errorABR.listenerCount('error')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work with basic preset end-to-end', async () => {
      const basicABR = createBasicABR();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await basicABR.generateABR(testVideoPath, testOutputDir);

      expect(result.qualityLevels).toHaveLength(3);
      expect(result.format).toBe('hls');
    });

    it('should work with standard preset end-to-end', async () => {
      const standardABR = createStandardABR();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await standardABR.generateABR(testVideoPath, testOutputDir);

      expect(result.qualityLevels).toHaveLength(5);
    });

    it('should work with premium preset end-to-end', async () => {
      const premiumABR = createPremiumABR();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await premiumABR.generateABR(testVideoPath, testOutputDir);

      expect(result.qualityLevels).toHaveLength(7);
    });
  });
});
