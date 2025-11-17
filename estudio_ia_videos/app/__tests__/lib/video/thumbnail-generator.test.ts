/**
 * Tests for Thumbnail Generator
 */

import ThumbnailGenerator, {
  STANDARD_SIZES,
  generateCoverThumbnail,
  generateHoverPreviews
} from '@/lib/video/thumbnail-generator';
import { promises as fs } from 'fs';
import path from 'path';

// Mock ffmpeg
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn(() => mockCommand);
  
  const mockCommand = {
    seekInput: jest.fn().mockReturnThis(),
    frames: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    videoFilters: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    size: jest.fn().mockReturnThis(),
    on: jest.fn(function(event: string, callback: Function) {
      if (event === 'end') {
        setTimeout(() => callback(), 10);
      }
      if (event === 'stderr') {
        setTimeout(() => callback('pts_time:5.5'), 5);
        setTimeout(() => callback('pts_time:15.2'), 5);
      }
      return this;
    }),
    run: jest.fn()
  };

  mockFfmpeg.ffprobe = jest.fn((filePath: string, callback: Function) => {
    callback(null, {
      format: {
        duration: 120
      },
      streams: [{
        codec_type: 'video',
        width: 1920,
        height: 1080
      }]
    });
  });

  return mockFfmpeg;
});

// Mock canvas
jest.mock('canvas', () => ({
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(1920 * 1080 * 4).fill(128)
      }))
    })),
    toBuffer: jest.fn(() => Buffer.from('fake-image'))
  })),
  loadImage: jest.fn(() => Promise.resolve({
    width: 1920,
    height: 1080
  })),
  registerFont: jest.fn()
}));

describe('ThumbnailGenerator', () => {
  let generator: ThumbnailGenerator;
  const testVideoPath = '/test/video.mp4';
  const outputDir = '/test/thumbnails';

  beforeEach(() => {
    generator = new ThumbnailGenerator();
    jest.clearAllMocks();
    
    // Mock fs
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('fake-image'));
    jest.spyOn(fs, 'stat').mockResolvedValue({ size: 50000 } as unknown as import('fs/promises').FileHandle & import('fs').Stats);
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
  });

  afterEach(() => {
    generator.removeAllListeners();
    jest.restoreAllMocks();
  });

  describe('generate', () => {
    it('should generate thumbnails successfully', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 5,
        outputDir
      });

      expect(result.thumbnails.length).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should create output directory', async () => {
      await generator.generate(testVideoPath, {
        count: 3,
        outputDir
      });

      expect(fs.mkdir).toHaveBeenCalledWith(
        outputDir,
        { recursive: true }
      );
    });

    it('should detect scenes when enabled', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 5,
        detectScenes: true,
        outputDir
      });

      expect(result.scenes).toBeDefined();
      expect(Array.isArray(result.scenes)).toBe(true);
    });

    it('should analyze quality when enabled', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 3,
        analyzeQuality: true,
        outputDir
      });

      const thumbnail = result.thumbnails[0];
      expect(thumbnail.quality).toBeDefined();
      expect(thumbnail.quality?.brightness).toBeGreaterThanOrEqual(0);
      expect(thumbnail.quality?.contrast).toBeGreaterThanOrEqual(0);
      expect(thumbnail.quality?.score).toBeGreaterThanOrEqual(0);
    });

    it('should skip black frames when avoidBlack is true', async () => {
      // Mock to return black frame
      const canvas = require('canvas');
      canvas.createCanvas.mockReturnValueOnce({
        getContext: jest.fn(() => ({
          drawImage: jest.fn(),
          getImageData: jest.fn(() => ({
            data: new Uint8ClampedArray(1920 * 1080 * 4).fill(10) // Very dark
          }))
        })),
        toBuffer: jest.fn(() => Buffer.from('black-image'))
      });

      const skippedSpy = jest.fn();
      generator.on('thumbnail:skipped', skippedSpy);

      await generator.generate(testVideoPath, {
        count: 3,
        analyzeQuality: true,
        avoidBlack: true,
        outputDir
      });

      // Should have skipped at least one frame
      expect(skippedSpy).toHaveBeenCalled();
    });

    it('should generate multiple sizes', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 2,
        sizes: [STANDARD_SIZES.large, STANDARD_SIZES.medium, STANDARD_SIZES.small],
        outputDir
      });

      // 2 timestamps × 3 sizes = 6 thumbnails
      expect(result.thumbnails.length).toBe(6);
    });

    it('should generate sprite sheet when enabled', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 10,
        generateSprite: true,
        outputDir
      });

      expect(result.sprite).toBeDefined();
      expect(result.sprite?.path).toContain('sprite.jpg');
      expect(result.sprite?.columns).toBeGreaterThan(0);
      expect(result.sprite?.rows).toBeGreaterThan(0);
    });

    it('should find best thumbnail when quality analysis is enabled', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 5,
        analyzeQuality: true,
        outputDir
      });

      expect(result.bestThumbnail).toBeDefined();
      expect(result.bestThumbnail?.quality?.score).toBeGreaterThan(0);
    });

    it('should emit thumbnail:generated events', async () => {
      const eventSpy = jest.fn();
      generator.on('thumbnail:generated', eventSpy);

      await generator.generate(testVideoPath, {
        count: 3,
        outputDir
      });

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit generation:complete event', async () => {
      const completeSpy = jest.fn();
      generator.on('generation:complete', completeSpy);

      await generator.generate(testVideoPath, {
        count: 2,
        outputDir
      });

      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnails: expect.arrayContaining([]),
          processingTime: expect.any(Number)
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg().on = jest.fn((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Frame extraction failed')), 10);
        }
        return ffmpeg();
      });

      await expect(
        generator.generate(testVideoPath, {
          count: 1,
          outputDir
        })
      ).rejects.toThrow();
    });

    it('should use specific timestamp when provided', async () => {
      const specificTimestamp = 30;

      const result = await generator.generate(testVideoPath, {
        timestamp: specificTimestamp,
        count: 1,
        outputDir
      });

      expect(result.thumbnails.length).toBe(1);
      expect(result.thumbnails[0].timestamp).toBe(specificTimestamp);
    });

    it('should use scene timestamps when scenes detected', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 5,
        detectScenes: true,
        outputDir
      });

      if (result.scenes && result.scenes.length > 0) {
        const sceneTimestamps = result.scenes.map(s => s.timestamp);
        const thumbnailTimestamps = result.thumbnails.map(t => t.timestamp);
        
        // Some thumbnail timestamps should match scene timestamps
        const hasMatchingTimestamps = thumbnailTimestamps.some(
          t => sceneTimestamps.includes(t)
        );
        expect(hasMatchingTimestamps).toBe(true);
      }
    });
  });

  describe('generateSingle', () => {
    it('should generate single thumbnail', async () => {
      const timestamp = 10;
      const outputPath = '/test/thumb.jpg';

      const result = await generator.generateSingle(
        testVideoPath,
        timestamp,
        outputPath
      );

      expect(result.success).toBe(true);
      expect(result.timestamp).toBe(timestamp);
    });

    it('should use specified size', async () => {
      const result = await generator.generateSingle(
        testVideoPath,
        10,
        '/test/thumb.jpg',
        STANDARD_SIZES.large
      );

      expect(result.size).toEqual(STANDARD_SIZES.large);
    });
  });

  describe('generateStoryboard', () => {
    it('should generate storyboard with sprite sheet', async () => {
      const result = await generator.generateStoryboard(
        testVideoPath,
        '/test/storyboard.jpg',
        {
          columns: 10,
          rows: 10
        }
      );

      expect(result.columns).toBe(10);
      expect(result.rows).toBe(10);
      expect(result.totalThumbnails).toBe(100);
      expect(result.path).toContain('sprite.jpg');
    });

    it('should generate WebVTT file', async () => {
      const result = await generator.generateStoryboard(
        testVideoPath,
        '/test/storyboard.jpg'
      );

      expect(result.vttPath).toBeDefined();
      expect(result.vttPath).toContain('.vtt');
    });

    it('should use custom thumbnail size', async () => {
      const customSize = STANDARD_SIZES.small;

      const result = await generator.generateStoryboard(
        testVideoPath,
        '/test/storyboard.jpg',
        {
          thumbnailSize: customSize
        }
      );

      expect(result.thumbnailWidth).toBe(customSize.width);
      expect(result.thumbnailHeight).toBe(customSize.height);
    });
  });

  describe('Quality Analysis', () => {
    it('should calculate brightness correctly', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 1,
        analyzeQuality: true,
        outputDir
      });

      const quality = result.thumbnails[0].quality;
      expect(quality?.brightness).toBeGreaterThanOrEqual(0);
      expect(quality?.brightness).toBeLessThanOrEqual(255);
    });

    it('should calculate contrast correctly', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 1,
        analyzeQuality: true,
        outputDir
      });

      const quality = result.thumbnails[0].quality;
      expect(quality?.contrast).toBeGreaterThanOrEqual(0);
      expect(quality?.contrast).toBeLessThanOrEqual(1);
    });

    it('should detect black frames', async () => {
      const canvas = require('canvas');
      canvas.createCanvas.mockReturnValueOnce({
        getContext: jest.fn(() => ({
          drawImage: jest.fn(),
          getImageData: jest.fn(() => ({
            data: new Uint8ClampedArray(1920 * 1080 * 4).fill(5) // Black
          }))
        })),
        toBuffer: jest.fn(() => Buffer.from('black'))
      });

      const result = await generator.generate(testVideoPath, {
        count: 1,
        analyzeQuality: true,
        avoidBlack: false,
        outputDir
      });

      if (result.thumbnails.length > 0) {
        expect(result.thumbnails[0].quality?.isBlack).toBe(true);
      }
    });

    it('should calculate quality score', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 1,
        analyzeQuality: true,
        outputDir
      });

      const score = result.thumbnails[0].quality?.score;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Factory Functions', () => {
    it('generateCoverThumbnail should generate at middle of video', async () => {
      const outputPath = '/test/cover.jpg';

      const result = await generateCoverThumbnail(testVideoPath, outputPath);

      expect(result.success).toBe(true);
      // Should be around middle (60 seconds for 120s video)
      expect(result.timestamp).toBeGreaterThan(50);
      expect(result.timestamp).toBeLessThan(70);
    });

    it('generateHoverPreviews should use small size', async () => {
      const result = await generateHoverPreviews(testVideoPath, outputDir, 5);

      expect(result.thumbnails.length).toBeGreaterThan(0);
      expect(result.thumbnails[0].size).toEqual(STANDARD_SIZES.small);
    });

    it('generateHoverPreviews should detect scenes', async () => {
      const result = await generateHoverPreviews(testVideoPath, outputDir);

      expect(result.scenes).toBeDefined();
    });
  });

  describe('Scene Detection', () => {
    it('should emit scenes:detected event', async () => {
      const scenesSpy = jest.fn();
      generator.on('scenes:detected', scenesSpy);

      await generator.generate(testVideoPath, {
        count: 3,
        detectScenes: true,
        outputDir
      });

      expect(scenesSpy).toHaveBeenCalled();
    });

    it('should return scene information', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 3,
        detectScenes: true,
        outputDir
      });

      if (result.scenes && result.scenes.length > 0) {
        const scene = result.scenes[0];
        expect(scene).toHaveProperty('timestamp');
        expect(scene).toHaveProperty('sceneNumber');
        expect(scene).toHaveProperty('confidence');
      }
    });
  });

  describe('Sprite Sheet Generation', () => {
    it('should emit sprite:generated event', async () => {
      const spriteSpy = jest.fn();
      generator.on('sprite:generated', spriteSpy);

      await generator.generate(testVideoPath, {
        count: 10,
        generateSprite: true,
        outputDir
      });

      expect(spriteSpy).toHaveBeenCalled();
    });

    it('should calculate grid dimensions correctly', async () => {
      const result = await generator.generate(testVideoPath, {
        count: 12,
        generateSprite: true,
        outputDir
      });

      const sprite = result.sprite!;
      const totalCells = sprite.columns * sprite.rows;
      expect(totalCells).toBeGreaterThanOrEqual(12);
    });

    it('should save sprite image', async () => {
      await generator.generate(testVideoPath, {
        count: 10,
        generateSprite: true,
        outputDir
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('sprite.jpg'),
        expect.any(Object)
      );
    });

    it('should generate WebVTT file', async () => {
      await generator.generate(testVideoPath, {
        count: 10,
        generateSprite: true,
        outputDir
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('sprite.vtt'),
        expect.stringContaining('WEBVTT')
      );
    });
  });

  describe('Standard Sizes', () => {
    it('should have large size defined', () => {
      expect(STANDARD_SIZES.large).toEqual({
        width: 1280,
        height: 720,
        name: 'large'
      });
    });

    it('should have medium size defined', () => {
      expect(STANDARD_SIZES.medium).toEqual({
        width: 640,
        height: 360,
        name: 'medium'
      });
    });

    it('should have small size defined', () => {
      expect(STANDARD_SIZES.small).toEqual({
        width: 320,
        height: 180,
        name: 'small'
      });
    });

    it('should have preview size defined', () => {
      expect(STANDARD_SIZES.preview).toEqual({
        width: 160,
        height: 90,
        name: 'preview'
      });
    });
  });
});
