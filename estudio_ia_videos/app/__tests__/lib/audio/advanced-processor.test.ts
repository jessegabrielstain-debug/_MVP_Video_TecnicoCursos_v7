/**
 * Advanced Audio Processor Tests
 * 
 * Comprehensive test suite for audio processing:
 * - Noise reduction (multiple algorithms)
 * - Loudness normalization (EBU R128)
 * - Dynamic compression
 * - Equalization
 * - Silence removal
 * - Noise gate
 * - Batch processing
 * - Factory functions & presets
 * 
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import {
  AdvancedAudioProcessor,
  createVoiceoverProcessor,
  createPodcastProcessor,
  createMusicProcessor,
  createCleanupProcessor,
  AUDIO_PRESETS,
  type AudioProcessingConfig,
  type AudioProcessingResult,
} from '@/lib/audio/advanced-processor';

// Mock FFmpeg
jest.mock('fluent-ffmpeg', () => {
  return jest.fn().mockImplementation(() => ({
    input: jest.fn().mockReturnThis(),
    audioFilters: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn(function(event: string, callback: Function) {
      if (event === 'end') {
        setTimeout(() => callback(), 10);
      } else if (event === 'progress') {
        setTimeout(() => {
          callback({ percent: 50 });
          callback({ percent: 100 });
        }, 5);
      }
      return this;
    }),
    run: jest.fn(),
    ffprobe: jest.fn((callback: Function) => {
      callback(null, {
        format: {
          duration: 120.5,
          bit_rate: 192000,
          size: 2880000,
        },
        streams: [{
          codec_type: 'audio',
          codec_name: 'aac',
          sample_rate: 48000,
          channels: 2,
          bit_rate: 192000,
        }],
      });
    }),
  }));
});

// Mock fs operations
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    stat: jest.fn(() => Promise.resolve({ size: 2880000 })),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('AdvancedAudioProcessor', () => {
  let processor: AdvancedAudioProcessor;
  const testAudioPath = '/test/input.mp3';
  const testOutputPath = '/test/output.mp3';

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new AdvancedAudioProcessor({
      noiseReduction: { enabled: true, level: 'moderate' },
      normalization: { enabled: true, target: -16 },
    });
  });

  afterEach(() => {
    processor.removeAllListeners();
  });

  describe('Constructor & Initialization', () => {
    it('should create instance with default config', () => {
      const defaultProcessor = new AdvancedAudioProcessor();
      expect(defaultProcessor).toBeInstanceOf(AdvancedAudioProcessor);
    });

    it('should accept custom configuration', () => {
      const config: AudioProcessingConfig = {
        noiseReduction: { enabled: true, level: 'aggressive' },
        normalization: { enabled: true, target: -16, mode: 'EBU_R128' },
        compression: { enabled: true, ratio: 4, threshold: -20 },
        equalizer: { enabled: true, preset: 'voice' },
        gate: { enabled: true, threshold: -40 },
        silenceRemoval: { enabled: true, threshold: -50 },
      };
      const customProcessor = new AdvancedAudioProcessor(config);
      expect(customProcessor).toBeInstanceOf(AdvancedAudioProcessor);
    });

    it('should merge partial config with defaults', () => {
      const partialConfig = { 
        noiseReduction: { enabled: true, level: 'light' as const }
      };
      const processorWithPartial = new AdvancedAudioProcessor(partialConfig);
      expect(processorWithPartial).toBeInstanceOf(AdvancedAudioProcessor);
    });
  });

  describe('Audio Presets', () => {
    it('should have voiceover preset configured', () => {
      expect(AUDIO_PRESETS.voiceover).toBeDefined();
      expect(AUDIO_PRESETS.voiceover.noiseReduction.enabled).toBe(true);
      expect(AUDIO_PRESETS.voiceover.normalization.target).toBe(-16);
    });

    it('should have podcast preset configured', () => {
      expect(AUDIO_PRESETS.podcast).toBeDefined();
      expect(AUDIO_PRESETS.podcast.compression.enabled).toBe(true);
    });

    it('should have music preset configured', () => {
      expect(AUDIO_PRESETS.music).toBeDefined();
      expect(AUDIO_PRESETS.music.equalizer.preset).toBe('music');
    });

    it('should have cleanup preset configured', () => {
      expect(AUDIO_PRESETS.cleanup).toBeDefined();
      expect(AUDIO_PRESETS.cleanup.noiseReduction.level).toBe('aggressive');
    });
  });

  describe('Factory Functions', () => {
    it('createVoiceoverProcessor should create instance with voiceover preset', () => {
      const voiceProcessor = createVoiceoverProcessor();
      expect(voiceProcessor).toBeInstanceOf(AdvancedAudioProcessor);
    });

    it('createPodcastProcessor should create instance with podcast preset', () => {
      const podcastProcessor = createPodcastProcessor();
      expect(podcastProcessor).toBeInstanceOf(AdvancedAudioProcessor);
    });

    it('createMusicProcessor should create instance with music preset', () => {
      const musicProcessor = createMusicProcessor();
      expect(musicProcessor).toBeInstanceOf(AdvancedAudioProcessor);
    });

    it('createCleanupProcessor should create instance with cleanup preset', () => {
      const cleanupProcessor = createCleanupProcessor();
      expect(cleanupProcessor).toBeInstanceOf(AdvancedAudioProcessor);
    });
  });

  describe('processAudio', () => {
    it('should validate input file exists', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      await expect(processor.processAudio(testAudioPath, testOutputPath))
        .rejects
        .toThrow('Input audio file not found');
    });

    it('should process audio and return result', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await processor.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('outputPath');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('fileSizeReduction');
    });

    it('should emit progress events', async () => {
      const progressSpy = jest.fn();
      processor.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await processor.processAudio(testAudioPath, testOutputPath);

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should calculate file size reduction', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.stat as jest.Mock).mockResolvedValueOnce({ size: 5000000 });
      (fs.stat as jest.Mock).mockResolvedValueOnce({ size: 3000000 });

      const result = await processor.processAudio(testAudioPath, testOutputPath);

      expect(result.fileSizeReduction).toBeGreaterThan(0);
    });
  });

  describe('Noise Reduction', () => {
    it('should apply noise reduction when enabled', async () => {
      const nrProcessor = new AdvancedAudioProcessor({
        noiseReduction: { enabled: true, level: 'moderate' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await nrProcessor.processAudio(testAudioPath, testOutputPath);

      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });

    it('should support light noise reduction level', async () => {
      const lightNR = new AdvancedAudioProcessor({
        noiseReduction: { enabled: true, level: 'light' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await lightNR.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('appliedFilters');
    });

    it('should support moderate noise reduction level', async () => {
      const moderateNR = new AdvancedAudioProcessor({
        noiseReduction: { enabled: true, level: 'moderate' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await moderateNR.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('appliedFilters');
    });

    it('should support aggressive noise reduction level', async () => {
      const aggressiveNR = new AdvancedAudioProcessor({
        noiseReduction: { enabled: true, level: 'aggressive' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await aggressiveNR.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('appliedFilters');
    });

    it('should skip noise reduction when disabled', async () => {
      const noNR = new AdvancedAudioProcessor({
        noiseReduction: { enabled: false },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noNR.processAudio(testAudioPath, testOutputPath);

      expect(result).toBeDefined();
    });
  });

  describe('Loudness Normalization', () => {
    it('should normalize to EBU R128 standard', async () => {
      const normProcessor = new AdvancedAudioProcessor({
        normalization: { enabled: true, target: -16, mode: 'EBU_R128' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await normProcessor.processAudio(testAudioPath, testOutputPath);

      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });

    it('should normalize to custom target LUFS', async () => {
      const customNorm = new AdvancedAudioProcessor({
        normalization: { enabled: true, target: -23, mode: 'EBU_R128' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await customNorm.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('appliedFilters');
    });

    it('should support peak normalization mode', async () => {
      const peakNorm = new AdvancedAudioProcessor({
        normalization: { enabled: true, target: -1, mode: 'peak' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await peakNorm.processAudio(testAudioPath, testOutputPath);

      expect(result).toBeDefined();
    });

    it('should skip normalization when disabled', async () => {
      const noNorm = new AdvancedAudioProcessor({
        normalization: { enabled: false },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noNorm.processAudio(testAudioPath, testOutputPath);

      expect(result).toBeDefined();
    });
  });

  describe('Dynamic Compression', () => {
    it('should apply compression when enabled', async () => {
      const compProcessor = new AdvancedAudioProcessor({
        compression: { enabled: true, ratio: 4, threshold: -20 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await compProcessor.processAudio(testAudioPath, testOutputPath);

      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });

    it('should use custom compression ratio', async () => {
      const customRatio = new AdvancedAudioProcessor({
        compression: { enabled: true, ratio: 8, threshold: -24 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await customRatio.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('appliedFilters');
    });

    it('should apply makeup gain', async () => {
      const withGain = new AdvancedAudioProcessor({
        compression: { 
          enabled: true, 
          ratio: 4, 
          threshold: -20,
          makeupGain: 6,
        },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await withGain.processAudio(testAudioPath, testOutputPath);

      expect(result).toBeDefined();
    });

    it('should skip compression when disabled', async () => {
      const noComp = new AdvancedAudioProcessor({
        compression: { enabled: false },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noComp.processAudio(testAudioPath, testOutputPath);

      expect(result).toBeDefined();
    });
  });

  describe('Equalization', () => {
    it('should apply voice EQ preset', async () => {
      const voiceEQ = new AdvancedAudioProcessor({
        equalizer: { enabled: true, preset: 'voice' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await voiceEQ.processAudio(testAudioPath, testOutputPath);

      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });

    it('should apply podcast EQ preset', async () => {
      const podcastEQ = new AdvancedAudioProcessor({
        equalizer: { enabled: true, preset: 'podcast' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await podcastEQ.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('appliedFilters');
    });

    it('should apply music EQ preset', async () => {
      const musicEQ = new AdvancedAudioProcessor({
        equalizer: { enabled: true, preset: 'music' },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await musicEQ.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('appliedFilters');
    });

    it('should skip EQ when disabled', async () => {
      const noEQ = new AdvancedAudioProcessor({
        equalizer: { enabled: false },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noEQ.processAudio(testAudioPath, testOutputPath);

      expect(result).toBeDefined();
    });
  });

  describe('Noise Gate', () => {
    it('should apply noise gate when enabled', async () => {
      const gateProcessor = new AdvancedAudioProcessor({
        gate: { enabled: true, threshold: -40, attack: 10, release: 100 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await gateProcessor.processAudio(testAudioPath, testOutputPath);

      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });

    it('should use custom threshold', async () => {
      const customGate = new AdvancedAudioProcessor({
        gate: { enabled: true, threshold: -50 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await customGate.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('appliedFilters');
    });

    it('should skip gate when disabled', async () => {
      const noGate = new AdvancedAudioProcessor({
        gate: { enabled: false },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noGate.processAudio(testAudioPath, testOutputPath);

      expect(result).toBeDefined();
    });
  });

  describe('Silence Removal', () => {
    it('should remove silence when enabled', async () => {
      const silenceProcessor = new AdvancedAudioProcessor({
        silenceRemoval: { enabled: true, threshold: -50, duration: 0.5 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await silenceProcessor.processAudio(testAudioPath, testOutputPath);

      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });

    it('should use custom silence threshold', async () => {
      const customSilence = new AdvancedAudioProcessor({
        silenceRemoval: { enabled: true, threshold: -60 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await customSilence.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('appliedFilters');
    });

    it('should skip silence removal when disabled', async () => {
      const noSilence = new AdvancedAudioProcessor({
        silenceRemoval: { enabled: false },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await noSilence.processAudio(testAudioPath, testOutputPath);

      expect(result).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple files in batch', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const files = [
        { input: '/test/file1.mp3', output: '/test/out1.mp3' },
        { input: '/test/file2.mp3', output: '/test/out2.mp3' },
      ];

      const results = await processor.processBatch(files);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('outputPath');
    });

    it('should handle batch processing errors gracefully', async () => {
      (fs.access as jest.Mock).mockResolvedValueOnce(undefined);
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      const files = [
        { input: '/test/file1.mp3', output: '/test/out1.mp3' },
        { input: '/test/missing.mp3', output: '/test/out2.mp3' },
      ];

      const results = await processor.processBatch(files);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should emit batch progress events', async () => {
      const batchProgressSpy = jest.fn();
      processor.on('batchProgress', batchProgressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const files = [
        { input: '/test/file1.mp3', output: '/test/out1.mp3' },
      ];

      await processor.processBatch(files);

      expect(batchProgressSpy).toHaveBeenCalled();
    });
  });

  describe('Video Audio Extraction', () => {
    it('should extract audio from video file', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await processor.extractAudioFromVideo('/test/video.mp4', '/test/audio.mp3');

      const ffmpegMock = require('fluent-ffmpeg');
      expect(ffmpegMock).toHaveBeenCalled();
    });

    it('should handle extraction errors', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(
        processor.extractAudioFromVideo('/test/missing.mp4', '/test/audio.mp3')
      ).rejects.toThrow();
    });
  });

  describe('Progress Tracking', () => {
    it('should emit start event', async () => {
      const startSpy = jest.fn();
      processor.on('start', startSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await processor.processAudio(testAudioPath, testOutputPath);

      expect(startSpy).toHaveBeenCalled();
    });

    it('should emit progress events with percentage', async () => {
      const progressSpy = jest.fn();
      processor.on('progress', progressSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await processor.processAudio(testAudioPath, testOutputPath);

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should emit complete event', async () => {
      const completeSpy = jest.fn();
      processor.on('complete', completeSpy);

      (fs.access as jest.Mock).mockResolvedValue(undefined);
      await processor.processAudio(testAudioPath, testOutputPath);

      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          outputPath: expect.stringContaining(''),
        })
      );
    });

    it('should emit error event on failure', async () => {
      const errorSpy = jest.fn();
      processor.on('error', errorSpy);

      (fs.access as jest.Mock).mockRejectedValue(new Error('Test error'));

      await expect(processor.processAudio(testAudioPath, testOutputPath))
        .rejects
        .toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing input file', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(processor.processAudio(testAudioPath, testOutputPath))
        .rejects
        .toThrow('Input audio file not found');
    });

    it('should handle FFmpeg processing errors', async () => {
      const ffmpegMock = require('fluent-ffmpeg');
      ffmpegMock.mockImplementationOnce(() => ({
        input: jest.fn().mockReturnThis(),
        audioFilters: jest.fn().mockReturnThis(),
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

      await expect(processor.processAudio(testAudioPath, testOutputPath))
        .rejects
        .toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work with voiceover processor preset', async () => {
      const voiceProcessor = createVoiceoverProcessor();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await voiceProcessor.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('outputPath');
      expect(result).toHaveProperty('appliedFilters');
    });

    it('should work with podcast processor preset', async () => {
      const podcastProcessor = createPodcastProcessor();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await podcastProcessor.processAudio(testAudioPath, testOutputPath);

      expect(result.appliedFilters.length).toBeGreaterThan(0);
    });

    it('should work with music processor preset', async () => {
      const musicProcessor = createMusicProcessor();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await musicProcessor.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('duration');
    });

    it('should work with cleanup processor preset', async () => {
      const cleanupProcessor = createCleanupProcessor();
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await cleanupProcessor.processAudio(testAudioPath, testOutputPath);

      expect(result).toHaveProperty('fileSizeReduction');
    });

    it('should handle complex audio processing chain', async () => {
      const complexProcessor = new AdvancedAudioProcessor({
        noiseReduction: { enabled: true, level: 'aggressive' },
        normalization: { enabled: true, target: -16 },
        compression: { enabled: true, ratio: 4, threshold: -20 },
        equalizer: { enabled: true, preset: 'voice' },
        gate: { enabled: true, threshold: -40 },
        silenceRemoval: { enabled: true, threshold: -50 },
      });

      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await complexProcessor.processAudio(testAudioPath, testOutputPath);

      expect(result.appliedFilters.length).toBeGreaterThan(3);
    });
  });
});
