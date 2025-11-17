/**
 * Tests for Video Transcoder
 */

import VideoTranscoder, {
  VideoFormat,
  VideoCodec,
  AudioCodec,
  VideoPreset,
  STANDARD_RESOLUTIONS,
  transcodeForNR,
  createAdaptiveStream
} from '@/lib/video/transcoder';
import { promises as fs } from 'fs';
import path from 'path';

// Mock ffmpeg
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn(() => mockCommand);
  
  const mockCommand = {
    videoCodec: jest.fn().mockReturnThis(),
    audioCodec: jest.fn().mockReturnThis(),
    addOption: jest.fn().mockReturnThis(),
    size: jest.fn().mockReturnThis(),
    videoBitrate: jest.fn().mockReturnThis(),
    fps: jest.fn().mockReturnThis(),
    audioBitrate: jest.fn().mockReturnThis(),
    audioChannels: jest.fn().mockReturnThis(),
    audioFrequency: jest.fn().mockReturnThis(),
    videoFilters: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn(function(event: string, callback: (data?: {frames: number; currentFps: number; currentKbps: number; timemark: string}) => void) {
      if (event === 'end') {
        setTimeout(() => callback(), 10);
      }
      if (event === 'progress') {
        setTimeout(() => callback({
          frames: 100,
          currentFps: 30,
          currentKbps: 2000,
          timemark: '00:00:10'
        }), 5);
      }
      return this;
    }),
    run: jest.fn()
  };

  mockFfmpeg.ffprobe = jest.fn((filePath: string, callback: Function) => {
    callback(null, {
      format: {
        duration: 60,
        bit_rate: '2000000'
      }
    });
  });

  return mockFfmpeg;
});

describe('VideoTranscoder', () => {
  let transcoder: VideoTranscoder;
  const testVideoPath = '/test/video.mp4';
  const outputPath = '/test/output.mp4';

  beforeEach(() => {
    transcoder = new VideoTranscoder();
    jest.clearAllMocks();
  });

  afterEach(() => {
    transcoder.removeAllListeners();
  });

  describe('transcode', () => {
    it('should transcode video successfully', async () => {
      const result = await transcoder.transcode(testVideoPath, outputPath, {
        format: VideoFormat.MP4,
        videoCodec: VideoCodec.H264
      });

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(outputPath);
      expect(result.format).toBe(VideoFormat.MP4);
    });

    it('should apply video codec correctly', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      
      await transcoder.transcode(testVideoPath, outputPath, {
        videoCodec: VideoCodec.H265
      });

      expect(ffmpeg().videoCodec).toHaveBeenCalledWith(VideoCodec.H265);
    });

    it('should apply audio codec correctly', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      
      await transcoder.transcode(testVideoPath, outputPath, {
        audioCodec: AudioCodec.OPUS
      });

      expect(ffmpeg().audioCodec).toHaveBeenCalledWith(AudioCodec.OPUS);
    });

    it('should apply preset for H264', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      
      await transcoder.transcode(testVideoPath, outputPath, {
        videoCodec: VideoCodec.H264,
        preset: VideoPreset.FAST
      });

      expect(ffmpeg().addOption).toHaveBeenCalledWith('-preset', VideoPreset.FAST);
    });

    it('should apply custom resolution', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      const resolution = STANDARD_RESOLUTIONS['720p'];
      
      await transcoder.transcode(testVideoPath, outputPath, {
        resolution
      });

      expect(ffmpeg().size).toHaveBeenCalledWith(`${resolution.width}x${resolution.height}`);
    });

    it('should apply FPS setting', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      
      await transcoder.transcode(testVideoPath, outputPath, {
        fps: 60
      });

      expect(ffmpeg().fps).toHaveBeenCalledWith(60);
    });

    it('should apply optimizations when enabled', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      
      await transcoder.transcode(testVideoPath, outputPath, {
        videoCodec: VideoCodec.H264,
        optimize: true
      });

      expect(ffmpeg().addOption).toHaveBeenCalledWith('-movflags', '+faststart');
    });

    it('should emit progress events', async () => {
      const progressSpy = jest.fn();
      transcoder.on('progress', progressSpy);

      await transcoder.transcode(testVideoPath, outputPath);

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should emit complete event', async () => {
      const completeSpy = jest.fn();
      transcoder.on('complete', completeSpy);

      await transcoder.transcode(testVideoPath, outputPath);

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg().on = jest.fn((event: string, callback: any) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Transcode failed')), 10);
        }
        return ffmpeg();
      });

      await expect(
        transcoder.transcode(testVideoPath, outputPath)
      ).rejects.toThrow('Transcode failed');
    });
  });

  describe('transcodeMultiResolution', () => {
    const outputDir = '/test/output';

    beforeEach(() => {
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    });

    it('should transcode to multiple resolutions', async () => {
      const resolutions = [
        STANDARD_RESOLUTIONS['1080p'],
        STANDARD_RESOLUTIONS['720p']
      ];

      const result = await transcoder.transcodeMultiResolution(
        testVideoPath,
        outputDir,
        resolutions
      );

      expect(result.resolutions).toEqual(resolutions);
      expect(result.outputDir).toBe(outputDir);
    });

    it('should emit resolution:complete events', async () => {
      const eventSpy = jest.fn();
      transcoder.on('resolution:complete', eventSpy);

      await transcoder.transcodeMultiResolution(
        testVideoPath,
        outputDir,
        [STANDARD_RESOLUTIONS['720p']]
      );

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should generate HLS playlist when requested', async () => {
      const result = await transcoder.transcodeMultiResolution(
        testVideoPath,
        outputDir,
        [STANDARD_RESOLUTIONS['720p']],
        { format: VideoFormat.HLS }
      );

      expect(result.hlsPlaylist).toBeDefined();
      expect(result.hlsPlaylist).toContain('master.m3u8');
    });

    it('should generate DASH manifest when requested', async () => {
      const result = await transcoder.transcodeMultiResolution(
        testVideoPath,
        outputDir,
        [STANDARD_RESOLUTIONS['720p']],
        { format: VideoFormat.DASH }
      );

      expect(result.dashManifest).toBeDefined();
      expect(result.dashManifest).toContain('manifest.mpd');
    });
  });

  describe('cancelTranscode', () => {
    it('should cancel active transcode', async () => {
      // Iniciar transcodificação
      const transcodePromise = transcoder.transcode(testVideoPath, outputPath);

      // Obter IDs ativos
      const activeIds = transcoder.getActiveTranscodes();
      expect(activeIds.length).toBeGreaterThan(0);

      // Cancelar
      const cancelled = await transcoder.cancelTranscode(activeIds[0]);
      expect(cancelled).toBe(true);
    });

    it('should return false for non-existent transcode ID', async () => {
      const cancelled = await transcoder.cancelTranscode('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('Factory Functions', () => {
    beforeEach(() => {
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    });

    it('transcodeForNR should use correct settings', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      
      await transcodeForNR(testVideoPath, outputPath);

      expect(ffmpeg().videoCodec).toHaveBeenCalledWith(VideoCodec.H264);
      expect(ffmpeg().audioCodec).toHaveBeenCalledWith(AudioCodec.AAC);
    });

    it('createAdaptiveStream should generate multiple resolutions', async () => {
      const result = await createAdaptiveStream(testVideoPath, outputPath);

      expect(result.resolutions.length).toBeGreaterThan(1);
      expect(result.hlsPlaylist).toBeDefined();
    });
  });

  describe('Standard Resolutions', () => {
    it('should have 4K resolution', () => {
      expect(STANDARD_RESOLUTIONS['4K']).toEqual({
        width: 3840,
        height: 2160,
        bitrate: 15000,
        name: '4K'
      });
    });

    it('should have 1080p resolution', () => {
      expect(STANDARD_RESOLUTIONS['1080p']).toEqual({
        width: 1920,
        height: 1080,
        bitrate: 5000,
        name: '1080p'
      });
    });

    it('should have 720p resolution', () => {
      expect(STANDARD_RESOLUTIONS['720p']).toEqual({
        width: 1280,
        height: 720,
        bitrate: 2500,
        name: '720p'
      });
    });
  });
});
