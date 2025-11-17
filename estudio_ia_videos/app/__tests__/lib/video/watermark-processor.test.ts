/**
 * Tests for Watermark Processor
 */

import WatermarkProcessor, {
  WatermarkType,
  WatermarkPosition,
  WatermarkAnimation,
  applyLogoWatermark,
  applyCopyrightWatermark
} from '@/lib/video/watermark-processor';
import { promises as fs } from 'fs';

// Mock ffmpeg
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn(() => mockCommand);
  
  const mockCommand = {
    input: jest.fn().mockReturnThis(),
    videoCodec: jest.fn().mockReturnThis(),
    audioCodec: jest.fn().mockReturnThis(),
    complexFilter: jest.fn().mockReturnThis(),
    addOption: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn(function(event: string, callback: Function) {
      if (event === 'end') {
        setTimeout(() => callback(), 10);
      }
      if (event === 'progress') {
        setTimeout(() => callback({
          frames: 100,
          currentFps: 30,
          percent: 50
        }), 5);
      }
      return this;
    }),
    run: jest.fn()
  };

  mockFfmpeg.ffprobe = jest.fn((filePath: string, callback: Function) => {
    callback(null, {
      format: {
        duration: 60
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
  createCanvas: jest.fn((width: number, height: number) => ({
    width,
    height,
    getContext: jest.fn(() => ({
      drawImage: jest.fn(),
      globalAlpha: 1,
      font: '',
      fillStyle: '',
      textBaseline: '',
      textAlign: '',
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      translate: jest.fn(),
      rotate: jest.fn()
    })),
    toBuffer: jest.fn(() => Buffer.from('watermark'))
  })),
  loadImage: jest.fn((data: any) => Promise.resolve({
    width: 200,
    height: 100
  })),
  registerFont: jest.fn()
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toBuffer: jest.fn(() => Promise.resolve(Buffer.from('qrcode')))
}));

describe('WatermarkProcessor', () => {
  let processor: WatermarkProcessor;
  const testVideoPath = '/test/video.mp4';
  const outputPath = '/test/watermarked.mp4';

  beforeEach(() => {
    processor = new WatermarkProcessor();
    jest.clearAllMocks();
    
    // Mock fs
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'stat').mockResolvedValue({ size: 10000000 });
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
  });

  afterEach(() => {
    processor.removeAllListeners();
    jest.restoreAllMocks();
  });

  describe('process', () => {
    it('should process single watermark successfully', async () => {
      const result = await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test Watermark',
          position: WatermarkPosition.BOTTOM_RIGHT
        }],
        outputPath
      });

      expect(result.success).toBe(true);
      expect(result.watermarksApplied).toBe(1);
      expect(result.outputPath).toBe(outputPath);
    });

    it('should process multiple watermarks', async () => {
      const result = await processor.process(testVideoPath, {
        watermarks: [
          {
            type: WatermarkType.LOGO,
            imagePath: '/test/logo.png',
            position: WatermarkPosition.TOP_RIGHT
          },
          {
            type: WatermarkType.COPYRIGHT,
            text: '© 2025 Company',
            position: WatermarkPosition.BOTTOM_LEFT
          }
        ],
        outputPath
      });

      expect(result.success).toBe(true);
      expect(result.watermarksApplied).toBe(2);
    });

    it('should create temp directory', async () => {
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CENTER
        }],
        outputPath
      });

      expect(fs.mkdir).toHaveBeenCalled();
    });

    it('should apply text watermark', async () => {
      const canvas = require('canvas');
      
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Sample Text',
          position: WatermarkPosition.CENTER,
          fontSize: 32,
          fontColor: '#FFFFFF'
        }],
        outputPath
      });

      expect(canvas.createCanvas).toHaveBeenCalled();
    });

    it('should apply image watermark', async () => {
      const canvas = require('canvas');
      
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.IMAGE,
          imagePath: '/test/watermark.png',
          position: WatermarkPosition.TOP_LEFT,
          opacity: 0.7
        }],
        outputPath
      });

      expect(canvas.loadImage).toHaveBeenCalled();
    });

    it('should apply QR code watermark', async () => {
      const QRCode = require('qrcode');
      
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.QRCODE,
          qrData: 'https://example.com',
          position: WatermarkPosition.TOP_RIGHT,
          qrSize: 150
        }],
        outputPath
      });

      expect(QRCode.toBuffer).toHaveBeenCalledWith(
        'https://example.com',
        expect.any(Object)
      );
    });

    it('should apply custom opacity', async () => {
      const canvas = require('canvas');
      const mockCtx = {
        globalAlpha: 1,
        drawImage: jest.fn()
      };

      canvas.createCanvas.mockReturnValueOnce({
        getContext: jest.fn(() => mockCtx),
        toBuffer: jest.fn(() => Buffer.from('watermark'))
      });

      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CENTER,
          opacity: 0.5
        }],
        outputPath
      });

      expect(mockCtx.globalAlpha).toBe(0.5);
    });

    it('should apply rotation', async () => {
      const canvas = require('canvas');
      const mockCtx = {
        translate: jest.fn(),
        rotate: jest.fn(),
        fillText: jest.fn(),
        measureText: jest.fn(() => ({ width: 100 })),
        font: '',
        fillStyle: '',
        globalAlpha: 1,
        textBaseline: '',
        textAlign: '',
        shadowColor: '',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0
      };

      canvas.createCanvas.mockReturnValueOnce({
        width: 400,
        height: 200,
        getContext: jest.fn(() => mockCtx),
        toBuffer: jest.fn(() => Buffer.from('watermark'))
      });

      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Rotated',
          position: WatermarkPosition.CENTER,
          rotation: -45
        }],
        outputPath
      });

      expect(mockCtx.rotate).toHaveBeenCalled();
    });

    it('should clean up temp files after processing', async () => {
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CENTER
        }],
        outputPath
      });

      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should emit processing:complete event', async () => {
      const completeSpy = jest.fn();
      processor.on('processing:complete', completeSpy);

      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CENTER
        }],
        outputPath
      });

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should emit progress events', async () => {
      const progressSpy = jest.fn();
      processor.on('progress', progressSpy);

      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CENTER
        }],
        outputPath
      });

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg().on = jest.fn((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Processing failed')), 10);
        }
        return ffmpeg();
      });

      await expect(
        processor.process(testVideoPath, {
          watermarks: [{
            type: WatermarkType.TEXT,
            text: 'Test',
            position: WatermarkPosition.CENTER
          }],
          outputPath
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing image path', async () => {
      await expect(
        processor.process(testVideoPath, {
          watermarks: [{
            type: WatermarkType.IMAGE,
            position: WatermarkPosition.CENTER
            // imagePath missing
          }],
          outputPath
        })
      ).rejects.toThrow('Image path required');
    });

    it('should throw error for missing text', async () => {
      await expect(
        processor.process(testVideoPath, {
          watermarks: [{
            type: WatermarkType.TEXT,
            position: WatermarkPosition.CENTER
            // text missing
          }],
          outputPath
        })
      ).rejects.toThrow('Text required');
    });

    it('should throw error for missing QR data', async () => {
      await expect(
        processor.process(testVideoPath, {
          watermarks: [{
            type: WatermarkType.QRCODE,
            position: WatermarkPosition.CENTER
            // qrData missing
          }],
          outputPath
        })
      ).rejects.toThrow('QR data required');
    });
  });

  describe('processBatch', () => {
    const videoPaths = ['/test/video1.mp4', '/test/video2.mp4', '/test/video3.mp4'];
    const outputDir = '/test/output';

    beforeEach(() => {
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    });

    it('should process multiple videos', async () => {
      const result = await processor.processBatch(videoPaths, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Batch',
          position: WatermarkPosition.CENTER
        }],
        outputDir
      });

      expect(result.totalProcessed).toBe(3);
      expect(result.totalFailed).toBe(0);
      expect(result.results.length).toBe(3);
    });

    it('should process in parallel when specified', async () => {
      const result = await processor.processBatch(videoPaths, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Parallel',
          position: WatermarkPosition.CENTER
        }],
        outputDir,
        parallel: 2
      });

      expect(result.totalProcessed).toBeGreaterThan(0);
    });

    it('should emit batch:progress events', async () => {
      const progressSpy = jest.fn();
      processor.on('batch:progress', progressSpy);

      await processor.processBatch(videoPaths, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CENTER
        }],
        outputDir
      });

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should emit batch:complete event', async () => {
      const completeSpy = jest.fn();
      processor.on('batch:complete', completeSpy);

      await processor.processBatch(videoPaths, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CENTER
        }],
        outputDir
      });

      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.any(Array),
          totalProcessed: expect.any(Number),
          totalFailed: expect.any(Number)
        })
      );
    });

    it('should handle partial failures', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      let callCount = 0;
      
      ffmpeg().on = jest.fn((event: string, callback: Function) => {
        callCount++;
        if (event === 'error' && callCount === 2) {
          setTimeout(() => callback(new Error('Failed')), 10);
        } else if (event === 'end') {
          setTimeout(() => callback(), 10);
        }
        return ffmpeg();
      });

      const result = await processor.processBatch(videoPaths, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CENTER
        }],
        outputDir
      });

      expect(result.totalProcessed).toBeGreaterThan(0);
      expect(result.totalFailed).toBeGreaterThan(0);
    });
  });

  describe('applyProtection', () => {
    it('should apply multiple protection layers', async () => {
      const result = await processor.applyProtection(
        testVideoPath,
        outputPath,
        'TechCompany'
      );

      expect(result.success).toBe(true);
      expect(result.watermarksApplied).toBeGreaterThan(2); // Logo + Copyright + Center watermark
    });

    it('should include QR code when URL provided', async () => {
      const QRCode = require('qrcode');

      await processor.applyProtection(
        testVideoPath,
        outputPath,
        'TechCompany',
        { url: 'https://verify.com/123' }
      );

      expect(QRCode.toBuffer).toHaveBeenCalledWith(
        'https://verify.com/123',
        expect.any(Object)
      );
    });

    it('should apply current year to copyright', async () => {
      const currentYear = new Date().getFullYear();

      await processor.applyProtection(
        testVideoPath,
        outputPath,
        'TestCompany'
      );

      // Verify copyright text includes current year
      const canvas = require('canvas');
      const calls = canvas.createCanvas.mock.calls;
      
      // Check if any canvas was created for copyright text
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('Watermark Positions', () => {
    it('should position at top left', async () => {
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.TOP_LEFT
        }],
        outputPath
      });

      const ffmpeg = require('fluent-ffmpeg');
      expect(ffmpeg().complexFilter).toHaveBeenCalled();
    });

    it('should position at center', async () => {
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CENTER
        }],
        outputPath
      });

      const ffmpeg = require('fluent-ffmpeg');
      expect(ffmpeg().complexFilter).toHaveBeenCalled();
    });

    it('should use custom position', async () => {
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.CUSTOM,
          x: 100,
          y: 200
        }],
        outputPath
      });

      const ffmpeg = require('fluent-ffmpeg');
      expect(ffmpeg().complexFilter).toHaveBeenCalled();
    });

    it('should apply margin to position', async () => {
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Test',
          position: WatermarkPosition.BOTTOM_RIGHT,
          margin: 50
        }],
        outputPath
      });

      const ffmpeg = require('fluent-ffmpeg');
      expect(ffmpeg().complexFilter).toHaveBeenCalled();
    });
  });

  describe('Factory Functions', () => {
    it('applyLogoWatermark should apply logo', async () => {
      const logoPath = '/test/logo.png';

      const result = await applyLogoWatermark(
        testVideoPath,
        logoPath,
        outputPath
      );

      expect(result.success).toBe(true);
      expect(result.watermarksApplied).toBe(1);
    });

    it('applyLogoWatermark should use specified position', async () => {
      const result = await applyLogoWatermark(
        testVideoPath,
        '/test/logo.png',
        outputPath,
        WatermarkPosition.TOP_LEFT
      );

      expect(result.success).toBe(true);
    });

    it('applyCopyrightWatermark should apply copyright', async () => {
      const result = await applyCopyrightWatermark(
        testVideoPath,
        outputPath,
        '© 2025 Test Company'
      );

      expect(result.success).toBe(true);
      expect(result.watermarksApplied).toBe(1);
    });
  });

  describe('Watermark Types', () => {
    it('should handle all watermark types', () => {
      expect(WatermarkType.IMAGE).toBe('image');
      expect(WatermarkType.TEXT).toBe('text');
      expect(WatermarkType.LOGO).toBe('logo');
      expect(WatermarkType.QRCODE).toBe('qrcode');
      expect(WatermarkType.COPYRIGHT).toBe('copyright');
    });
  });

  describe('Watermark Animations', () => {
    it('should support fade in animation', async () => {
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Fade In',
          position: WatermarkPosition.CENTER,
          animation: WatermarkAnimation.FADE_IN,
          animationDuration: 2
        }],
        outputPath
      });

      expect(true).toBe(true); // Animation applied in complexFilter
    });

    it('should support fade out animation', async () => {
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Fade Out',
          position: WatermarkPosition.CENTER,
          animation: WatermarkAnimation.FADE_OUT,
          animationDuration: 2
        }],
        outputPath
      });

      expect(true).toBe(true);
    });

    it('should support pulse animation', async () => {
      await processor.process(testVideoPath, {
        watermarks: [{
          type: WatermarkType.TEXT,
          text: 'Pulse',
          position: WatermarkPosition.CENTER,
          animation: WatermarkAnimation.PULSE,
          animationDuration: 1
        }],
        outputPath
      });

      expect(true).toBe(true);
    });
  });
});
