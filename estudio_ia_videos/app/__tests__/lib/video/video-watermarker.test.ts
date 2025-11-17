/**
 * Testes para Video Watermarker Module
 * 
 * @module video-watermarker.test
 * @author GitHub Copilot
 * @version 1.0.0
 */

import VideoWatermarker, {
  createBasicWatermarker,
  createTextWatermarker,
  createLogoWatermarker,
  createCopyrightWatermarker,
  createAnimatedWatermarker,
  WatermarkConfig,
  WatermarkResult,
  TextWatermark,
  ImageWatermark
} from '../../../lib/video/video-watermarker';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import { WatermarkPosition } from '../../../types/watermark.types';

// ==================== MOCKS ====================

jest.mock('fluent-ffmpeg');
jest.mock('fs/promises');

// Mock FFmpeg
const mockFfmpeg = {
  videoCodec: jest.fn().mockReturnThis(),
  audioCodec: jest.fn().mockReturnThis(),
  outputOptions: jest.fn().mockReturnThis(),
  complexFilter: jest.fn().mockReturnThis(),
  videoFilters: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis()
};

// ==================== SETUP ====================

beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock ffmpeg constructor
  (ffmpeg as unknown as jest.Mock).mockReturnValue(mockFfmpeg);
  
  // Mock fs.access (arquivo existe)
  jest.spyOn(fs, 'access').mockResolvedValue(undefined);
  
  // Mock fs.stat (tamanho do arquivo)
  jest.spyOn(fs, 'stat').mockResolvedValue({
    size: 1024 * 1024 * 10 // 10MB
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ==================== TESTES ====================

describe('VideoWatermarker', () => {
  
  // ========== CONSTRUCTOR ==========
  
  describe('Constructor', () => {
    test('should create instance with default options', () => {
      const watermarker = new VideoWatermarker();
      expect(watermarker).toBeInstanceOf(VideoWatermarker);
    });

    test('should extend EventEmitter', () => {
      const watermarker = new VideoWatermarker();
      expect(watermarker.on).toBeDefined();
      expect(watermarker.emit).toBeDefined();
    });
  });

  // ========== TEXT WATERMARK ==========

  describe('Text Watermark', () => {
    test('should add text watermark to video', async () => {
      const watermarker = new VideoWatermarker();

      // Mock FFmpeg success
      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: {
          type: 'text',
          text: 'Copyright © 2025',
          fontSize: 24,
          fontColor: 'white',
          opacity: 0.7
        },
        position: 'bottom-right',
        margin: 20
      };

      const result = await watermarker.addWatermark(
        'input.mp4',
        'output.mp4',
        config
      );

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('output.mp4');
      expect(mockFfmpeg.videoFilters).toHaveBeenCalled();
    });

    test('should escape special characters in text', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: {
          type: 'text',
          text: "Test's Text: With\\Special",
          fontSize: 24
        },
        position: 'center'
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config);

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain("\\'");
      expect(filterCall).toContain("\\:");
      expect(filterCall).toContain("\\\\");
    });

    test('should apply custom font and size', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: {
          type: 'text',
          text: 'Custom Font',
          font: 'Roboto',
          fontSize: 36,
          fontColor: 'yellow'
        },
        position: 'top-center'
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config);

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('fontsize=36');
      expect(filterCall).toContain('fontcolor=yellow');
    });

    test('should reject empty text', async () => {
      const watermarker = new VideoWatermarker();

      const config: WatermarkConfig = {
        watermark: {
          type: 'text',
          text: ''
        },
        position: 'center'
      };

      const result = await watermarker.addWatermark(
        'input.mp4',
        'output.mp4',
        config
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Text watermark requires non-empty text');
    });
  });

  // ========== IMAGE WATERMARK ==========

  describe('Image Watermark', () => {
    test('should add image watermark to video', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: {
          type: 'image',
          imagePath: 'logo.png',
          width: 100,
          height: 100,
          opacity: 0.8
        },
        position: 'top-right',
        margin: 15
      };

      const result = await watermarker.addWatermark(
        'input.mp4',
        'output.mp4',
        config
      );

      expect(result.success).toBe(true);
      expect(mockFfmpeg.complexFilter).toHaveBeenCalled();
    });

    test('should maintain aspect ratio when requested', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: {
          type: 'image',
          imagePath: 'logo.png',
          width: 150,
          maintainAspectRatio: true
        },
        position: 'bottom-left'
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config);

      const filterCall = mockFfmpeg.complexFilter.mock.calls[0][0];
      expect(filterCall).toContain('scale=150:-1');
    });

    test('should reject non-existent image', async () => {
      const watermarker = new VideoWatermarker();

      // Mock image not found
      jest.spyOn(fs, 'access').mockImplementation((path) => {
        if (path === 'missing.png') {
          return Promise.reject(new Error('File not found'));
        }
        return Promise.resolve(undefined);
      });

      const config: WatermarkConfig = {
        watermark: {
          type: 'image',
          imagePath: 'missing.png'
        },
        position: 'center'
      };

      const result = await watermarker.addWatermark(
        'input.mp4',
        'output.mp4',
        config
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Watermark image not found');
    });
  });

  // ========== POSITIONS ==========

  describe('Watermark Positions', () => {
    test.each([
      [WatermarkPosition.TOP_LEFT, '10', '10'],
      [WatermarkPosition.TOP_CENTER, '(W-w)/2', '10'],
      [WatermarkPosition.TOP_RIGHT, 'W-w-10', '10'],
      [WatermarkPosition.CENTER_LEFT, '10', '(H-h)/2'],
      [WatermarkPosition.CENTER, '(W-w)/2', '(H-h)/2'],
      [WatermarkPosition.CENTER_RIGHT, 'W-w-10', '(H-h)/2'],
      [WatermarkPosition.BOTTOM_LEFT, '10', 'H-h-10'],
      [WatermarkPosition.BOTTOM_CENTER, '(W-w)/2', 'H-h-10'],
      [WatermarkPosition.BOTTOM_RIGHT, 'W-w-10', 'H-h-10']
    ] satisfies Array<[WatermarkPosition, string, string]>)('should position watermark at %s', async (position, expectedX, expectedY) => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: {
          type: 'text',
          text: 'Test'
        },
        position,
        margin: 10
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config);

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain(`x=${expectedX}`);
      expect(filterCall).toContain(`y=${expectedY}`);
    });

    test('should use custom position when specified', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: {
          type: 'text',
          text: 'Custom'
        },
        position: 'custom',
        customPosition: { x: 100, y: 200, unit: 'px' }
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config);

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('x=100');
      expect(filterCall).toContain('y=200');
    });

    test('should use percentage for custom position', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: {
          type: 'text',
          text: 'Percentage'
        },
        position: 'custom',
        customPosition: { x: 50, y: 75, unit: '%' }
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config);

      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('x=W*0.5');
      expect(filterCall).toContain('y=H*0.75');
    });

    test('should reject custom position without coordinates', async () => {
      const watermarker = new VideoWatermarker();

      const config: WatermarkConfig = {
        watermark: {
          type: 'text',
          text: 'Test'
        },
        position: 'custom'
        // Missing customPosition
      };

      const result = await watermarker.addWatermark(
        'input.mp4',
        'output.mp4',
        config
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Custom position requires customPosition property');
    });
  });

  // ========== BATCH PROCESSING ==========

  describe('Batch Processing', () => {
    test('should process multiple videos', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const inputs = [
        { inputPath: 'video1.mp4', outputPath: 'output1.mp4' },
        { inputPath: 'video2.mp4', outputPath: 'output2.mp4' },
        { inputPath: 'video3.mp4', outputPath: 'output3.mp4' }
      ];

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Batch Test' },
        position: 'bottom-right'
      };

      const results = await watermarker.addWatermarkBatch(inputs, config);

      expect(results.size).toBe(3);
      expect(results.get('video1.mp4')?.success).toBe(true);
      expect(results.get('video2.mp4')?.success).toBe(true);
      expect(results.get('video3.mp4')?.success).toBe(true);
    });

    test('should emit batch progress events', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const batchStartSpy = jest.fn();
      const batchProgressSpy = jest.fn();
      const batchCompleteSpy = jest.fn();

      watermarker.on('batch-start', batchStartSpy);
      watermarker.on('batch-progress', batchProgressSpy);
      watermarker.on('batch-complete', batchCompleteSpy);

      const inputs = [
        { inputPath: 'video1.mp4', outputPath: 'output1.mp4' },
        { inputPath: 'video2.mp4', outputPath: 'output2.mp4' }
      ];

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      await watermarker.addWatermarkBatch(inputs, config);

      expect(batchStartSpy).toHaveBeenCalledWith({ total: 2 });
      expect(batchProgressSpy).toHaveBeenCalledTimes(2);
      expect(batchCompleteSpy).toHaveBeenCalledWith({
        total: 2,
        successful: 2
      });
    });

    test('should continue batch on individual failures', async () => {
      const watermarker = new VideoWatermarker();

      let callCount = 0;
      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        callCount++;
        // Simulate immediate completion for all to avoid timeout
        setImmediate(() => {
          if (callCount === 2) {
            // Fail second video
            mockFfmpeg.on.mock.calls
              .find(call => call[0] === 'error')?.[1](new Error('Processing failed'));
          } else {
            mockFfmpeg.on.mock.calls
              .find(call => call[0] === 'end')?.[1]();
          }
        });
        return mockFfmpeg;
      });

      const inputs = [
        { inputPath: 'video1.mp4', outputPath: 'output1.mp4' },
        { inputPath: 'video2.mp4', outputPath: 'output2.mp4' },
        { inputPath: 'video3.mp4', outputPath: 'output3.mp4' }
      ];

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      const results = await watermarker.addWatermarkBatch(inputs, config);

      expect(results.size).toBe(3);
      expect(results.get('video1.mp4')?.success).toBe(true);
      expect(results.get('video2.mp4')?.success).toBe(false);
      expect(results.get('video3.mp4')?.success).toBe(true);
    }, 10000); // Increase timeout to 10s
  });

  // ========== EVENTS ==========

  describe('Events', () => {
    test('should emit start event', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const startSpy = jest.fn();
      watermarker.on('start', startSpy);

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config);

      expect(startSpy).toHaveBeenCalledWith({
        inputPath: 'input.mp4',
        outputPath: 'output.mp4'
      });
    });

    test('should emit complete event', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const completeSpy = jest.fn();
      watermarker.on('complete', completeSpy);

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config);

      expect(completeSpy).toHaveBeenCalled();
      const result = completeSpy.mock.calls[0][0];
      expect(result.success).toBe(true);
    });

    test('should emit error event on failure', async () => {
      const watermarker = new VideoWatermarker();

      // Mock file not found
      jest.spyOn(fs, 'access').mockImplementation((path) => {
        if (path.toString().includes('missing.mp4')) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve(undefined);
      });

      const errorSpy = jest.fn();
      watermarker.on('error', errorSpy);

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      const result = await watermarker.addWatermark('missing.mp4', 'output.mp4', config);

      expect(result.success).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
    });

    test('should emit progress events during processing', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        // Simulate progress
        const progressCallback = mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'progress')?.[1];
        
        if (progressCallback) {
          progressCallback({
            percent: 50,
            currentTime: 30,
            totalTime: 60,
            speed: '2x',
            fps: 30
          });
        }

        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        
        return mockFfmpeg;
      });

      const progressSpy = jest.fn();
      watermarker.on('progress', progressSpy);

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config);

      expect(progressSpy).toHaveBeenCalledWith({
        percent: 50,
        currentTime: 30,
        totalTime: 60,
        speed: '2x',
        fps: 30
      });
    });
  });

  // ========== VALIDATION ==========

  describe('Input Validation', () => {
    test('should reject non-existent input file', async () => {
      const watermarker = new VideoWatermarker();

      jest.spyOn(fs, 'access').mockImplementation((path) => {
        if (path.toString().includes('missing.mp4')) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve(undefined);
      });

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      const result = await watermarker.addWatermark(
        'missing.mp4',
        'output.mp4',
        config
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Input file not found');
    });
  });

  // ========== OPTIONS ==========

  describe('Processing Options', () => {
    test('should use custom video codec', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config, {
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

    test('should preserve quality when requested', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      await watermarker.addWatermark('input.mp4', 'output.mp4', config, {
        preserveQuality: true
      });

      expect(mockFfmpeg.outputOptions).toHaveBeenCalled();
    });
  });

  // ========== REMOVE WATERMARK ==========

  describe('Remove Watermark', () => {
    test('should remove watermark from region', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const result = await watermarker.removeWatermark(
        'input.mp4',
        'output.mp4',
        { x: 10, y: 10, width: 100, height: 50 }
      );

      expect(result.success).toBe(true);
      expect(mockFfmpeg.videoFilters).toHaveBeenCalled();
      
      const filterCall = mockFfmpeg.videoFilters.mock.calls[0][0];
      expect(filterCall).toContain('delogo');
      expect(filterCall).toContain('x=10');
      expect(filterCall).toContain('y=10');
      expect(filterCall).toContain('w=100');
      expect(filterCall).toContain('h=50');
    });
  });

  // ========== FACTORY FUNCTIONS ==========

  describe('Factory Functions', () => {
    test('createBasicWatermarker should create instance', () => {
      const watermarker = createBasicWatermarker();
      expect(watermarker).toBeInstanceOf(VideoWatermarker);
    });

    test('createTextWatermarker should create configured instance', () => {
      const { watermarker, config } = createTextWatermarker(
        'Copyright © 2025',
        'bottom-right'
      );

      expect(watermarker).toBeInstanceOf(VideoWatermarker);
      expect(config.watermark.type).toBe('text');
      expect((config.watermark as TextWatermark).text).toBe('Copyright © 2025');
      expect(config.position).toBe('bottom-right');
    });

    test('createLogoWatermarker should create configured instance', () => {
      const { watermarker, config } = createLogoWatermarker(
        'logo.png',
        'top-right',
        120
      );

      expect(watermarker).toBeInstanceOf(VideoWatermarker);
      expect(config.watermark.type).toBe('image');
      expect((config.watermark as ImageWatermark).imagePath).toBe('logo.png');
      expect((config.watermark as ImageWatermark).width).toBe(120);
      expect(config.position).toBe('top-right');
    });

    test('createCopyrightWatermarker should create configured instance', () => {
      const { watermarker, config } = createCopyrightWatermarker(
        '© 2025 Company'
      );

      expect(watermarker).toBeInstanceOf(VideoWatermarker);
      expect(config.watermark.type).toBe('text');
      expect((config.watermark as TextWatermark).text).toBe('© 2025 Company');
      expect(config.position).toBe('bottom-center');
    });

    test('createAnimatedWatermarker should create configured instance', () => {
      const { watermarker, config } = createAnimatedWatermarker(
        'Animated Text',
        'fade-in-out'
      );

      expect(watermarker).toBeInstanceOf(VideoWatermarker);
      expect(config.watermark.type).toBe('text');
      expect((config.watermark as TextWatermark).text).toBe('Animated Text');
      expect(config.animation).toBe('fade-in-out');
      expect(config.animationDuration).toBe(2000);
    });
  });

  // ========== RESULT ==========

  describe('Watermark Result', () => {
    test('should return processing time', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      const result = await watermarker.addWatermark(
        'input.mp4',
        'output.mp4',
        config
      );

      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should return file sizes', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      const result = await watermarker.addWatermark(
        'input.mp4',
        'output.mp4',
        config
      );

      expect(result.inputSize).toBe(1024 * 1024 * 10);
      expect(result.outputSize).toBe(1024 * 1024 * 10);
    });

    test('should include errors on failure', async () => {
      const watermarker = new VideoWatermarker();

      jest.spyOn(fs, 'access').mockImplementation((path) => {
        if (path.toString().includes('missing.mp4')) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve(undefined);
      });

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      const result = await watermarker.addWatermark(
        'missing.mp4',
        'output.mp4',
        config
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  // ========== PERFORMANCE ==========

  describe('Performance', () => {
    test('should handle large files efficiently', async () => {
      const watermarker = new VideoWatermarker();

      // Mock large file
      jest.spyOn(fs, 'stat').mockResolvedValue({
        size: 1024 * 1024 * 1024 * 2 // 2GB
      });

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Test' },
        position: 'center'
      };

      const startTime = Date.now();
      const result = await watermarker.addWatermark(
        'large.mp4',
        'output.mp4',
        config
      );
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5s (mock)
    });

    test('should process batch efficiently', async () => {
      const watermarker = new VideoWatermarker();

      mockFfmpeg.save.mockImplementation((outputPath: string) => {
        mockFfmpeg.on.mock.calls
          .find(call => call[0] === 'end')?.[1]();
        return mockFfmpeg;
      });

      const inputs = Array.from({ length: 10 }, (_, i) => ({
        inputPath: `video${i}.mp4`,
        outputPath: `output${i}.mp4`
      }));

      const config: WatermarkConfig = {
        watermark: { type: 'text', text: 'Batch' },
        position: 'center'
      };

      const startTime = Date.now();
      const results = await watermarker.addWatermarkBatch(inputs, config);
      const duration = Date.now() - startTime;

      expect(results.size).toBe(10);
      expect(duration).toBeLessThan(10000); // 10s for 10 videos (mock)
    });
  });
});
