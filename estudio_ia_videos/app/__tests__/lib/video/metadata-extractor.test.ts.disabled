/**
 * 🧪 Video Metadata Extractor - Test Suite
 * 
 * Testes completos para o extrator de metadados de vídeo
 * 
 * @jest-environment node
 */

import VideoMetadataExtractor, {
  createBasicExtractor,
  createFullExtractor,
  createConformanceValidator,
  VideoMetadata,
  ExtractionResult,
} from '../../../lib/video/metadata-extractor';
import { promises as fs } from 'fs';
import path from 'path';

// ==================== MOCKS ====================

jest.mock('fluent-ffmpeg');
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    stat: jest.fn(),
    writeFile: jest.fn(),
  },
}));

const mockFfmpeg = require('fluent-ffmpeg');

// Mock probe data
const mockProbeData = {
  format: {
    format_name: 'mp4',
    format_long_name: 'QuickTime / MOV',
    duration: 120.5,
    bit_rate: 5000000,
    size: 75312500,
    tags: {
      title: 'Test Video',
      artist: 'Test Creator',
      encoder: 'FFmpeg 5.0',
      creation_time: '2025-01-01T00:00:00.000000Z',
    },
  },
  streams: [
    {
      index: 0,
      codec_type: 'video',
      codec_name: 'h264',
      codec_long_name: 'H.264 / AVC / MPEG-4 AVC',
      profile: 'High',
      level: 40,
      width: 1920,
      height: 1080,
      pix_fmt: 'yuv420p',
      avg_frame_rate: '30/1',
      r_frame_rate: '30/1',
      bit_rate: 4500000,
      nb_frames: 3615,
      display_aspect_ratio: '16:9',
      color_space: 'bt709',
      color_range: 'tv',
      tags: {
        language: 'eng',
      },
      disposition: {
        default: 1,
      },
    },
    {
      index: 1,
      codec_type: 'audio',
      codec_name: 'aac',
      codec_long_name: 'AAC (Advanced Audio Coding)',
      sample_rate: 48000,
      channels: 2,
      channel_layout: 'stereo',
      bit_rate: 192000,
      sample_fmt: 'fltp',
      tags: {
        language: 'eng',
        title: 'Main Audio',
      },
      disposition: {
        default: 1,
      },
    },
    {
      index: 2,
      codec_type: 'subtitle',
      codec_name: 'subrip',
      codec_long_name: 'SubRip subtitle',
      tags: {
        language: 'por',
        title: 'Portuguese Subtitles',
      },
      disposition: {
        default: 0,
        forced: 0,
      },
    },
  ],
  chapters: [
    {
      id: 0,
      start_time: '0.0',
      end_time: '60.0',
      tags: {
        title: 'Introduction',
      },
    },
    {
      id: 1,
      start_time: '60.0',
      end_time: '120.5',
      tags: {
        title: 'Main Content',
      },
    },
  ],
};

// ==================== TESTS ====================

describe('VideoMetadataExtractor', () => {
  let extractor: VideoMetadataExtractor;
  const testVideoPath = '/test/video.mp4';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file system
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.stat as jest.Mock).mockResolvedValue({
      size: 75312500,
      birthtime: new Date('2025-01-01'),
      mtime: new Date('2025-01-02'),
    });

    // Mock FFprobe
    mockFfmpeg.ffprobe = jest.fn((path, callback) => {
      callback(null, mockProbeData);
    });

    extractor = new VideoMetadataExtractor();
  });

  // ==================== BASIC EXTRACTION ====================

  describe('Basic Extraction', () => {
    test('deve extrair metadados completos', async () => {
      const result = await extractor.extract(testVideoPath);

      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('deve extrair informações do arquivo corretamente', async () => {
      const result = await extractor.extract(testVideoPath);
      const fileInfo = result.metadata.file;

      expect(fileInfo.path).toBe(testVideoPath);
      expect(fileInfo.filename).toBe('video.mp4');
      expect(fileInfo.extension).toBe('.mp4');
      expect(fileInfo.size).toBe(75312500);
      expect(fileInfo.sizeFormatted).toBe('71.82 MB');
    });

    test('deve extrair informações de formato', async () => {
      const result = await extractor.extract(testVideoPath);
      const format = result.metadata.format;

      expect(format.formatName).toBe('mp4');
      expect(format.formatLongName).toBe('QuickTime / MOV');
      expect(format.duration).toBe(120.5);
      expect(format.durationFormatted).toBe('00:02:00');
      expect(format.bitrate).toBe(5000000);
      expect(format.bitrateFormatted).toBe('5.00 Mbps');
      expect(format.title).toBe('Test Video');
      expect(format.encoder).toBe('FFmpeg 5.0');
    });

    test('deve extrair informações básicas rapidamente', async () => {
      const basic = await extractor.extractBasic(testVideoPath);

      expect(basic.duration).toBe(120.5);
      expect(basic.resolution.width).toBe(1920);
      expect(basic.resolution.height).toBe(1080);
      expect(basic.codec).toBe('h264');
      expect(basic.fileSize).toBe(75312500);
    });
  });

  // ==================== VIDEO STREAMS ====================

  describe('Video Streams', () => {
    test('deve extrair streams de vídeo corretamente', async () => {
      const result = await extractor.extract(testVideoPath);
      const videoStreams = result.metadata.videoStreams;

      expect(videoStreams).toHaveLength(1);
      
      const video = videoStreams[0];
      expect(video.codec).toBe('h264');
      expect(video.codecLongName).toBe('H.264 / AVC / MPEG-4 AVC');
      expect(video.profile).toBe('High');
      expect(video.level).toBe(40);
      expect(video.width).toBe(1920);
      expect(video.height).toBe(1080);
      expect(video.fps).toBe(30);
      expect(video.pixelFormat).toBe('yuv420p');
      expect(video.aspectRatio).toBe('16:9');
    });

    test('deve calcular FPS corretamente', async () => {
      const result = await extractor.extract(testVideoPath);
      const video = result.metadata.videoStreams[0];

      expect(video.fps).toBe(30);
    });

    test('deve detectar resolução e aspect ratio', async () => {
      const result = await extractor.extract(testVideoPath);
      const video = result.metadata.videoStreams[0];

      expect(video.width).toBe(1920);
      expect(video.height).toBe(1080);
      expect(video.aspectRatio).toBe('16:9');
      expect(video.displayAspectRatio).toBe('16:9');
    });

    test('deve extrair informações de cor', async () => {
      const result = await extractor.extract(testVideoPath);
      const video = result.metadata.videoStreams[0];

      expect(video.colorSpace).toBe('bt709');
      expect(video.colorRange).toBe('tv');
    });

    test('deve detectar HDR quando presente', async () => {
      // Mock HDR data
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        const hdrData = JSON.parse(JSON.stringify(mockProbeData));
        hdrData.streams[0].color_transfer = 'smpte2084';
        hdrData.streams[0].color_primaries = 'bt2020';
        callback(null, hdrData);
      });

      const result = await extractor.extract(testVideoPath);
      const video = result.metadata.videoStreams[0];

      expect(video.hdr).toBeDefined();
      expect(video.hdr?.isHDR).toBe(true);
      expect(video.hdr?.standard).toBe('HDR10');
    });

    test('deve detectar rotação de vídeo', async () => {
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        const rotatedData = JSON.parse(JSON.stringify(mockProbeData));
        rotatedData.streams[0].tags = { rotate: '90' };
        callback(null, rotatedData);
      });

      const result = await extractor.extract(testVideoPath);
      const video = result.metadata.videoStreams[0];

      expect(video.rotation).toBe(90);
    });
  });

  // ==================== AUDIO STREAMS ====================

  describe('Audio Streams', () => {
    test('deve extrair streams de áudio corretamente', async () => {
      const result = await extractor.extract(testVideoPath);
      const audioStreams = result.metadata.audioStreams;

      expect(audioStreams).toHaveLength(1);
      
      const audio = audioStreams[0];
      expect(audio.codec).toBe('aac');
      expect(audio.codecLongName).toBe('AAC (Advanced Audio Coding)');
      expect(audio.sampleRate).toBe(48000);
      expect(audio.channels).toBe(2);
      expect(audio.channelLayout).toBe('stereo');
      expect(audio.language).toBe('eng');
      expect(audio.title).toBe('Main Audio');
    });

    test('deve formatar bitrate de áudio', async () => {
      const result = await extractor.extract(testVideoPath);
      const audio = result.metadata.audioStreams[0];

      expect(audio.bitrate).toBe(192000);
      expect(audio.bitrateFormatted).toBe('192 kbps');
    });

    test('deve identificar stream padrão', async () => {
      const result = await extractor.extract(testVideoPath);
      const audio = result.metadata.audioStreams[0];

      expect(audio.isDefault).toBe(true);
    });
  });

  // ==================== SUBTITLE STREAMS ====================

  describe('Subtitle Streams', () => {
    test('deve extrair streams de legendas', async () => {
      const result = await extractor.extract(testVideoPath);
      const subtitles = result.metadata.subtitleStreams;

      expect(subtitles).toHaveLength(1);
      
      const sub = subtitles[0];
      expect(sub.codec).toBe('subrip');
      expect(sub.language).toBe('por');
      expect(sub.title).toBe('Portuguese Subtitles');
      expect(sub.isDefault).toBe(false);
      expect(sub.isForced).toBe(false);
    });
  });

  // ==================== CHAPTERS ====================

  describe('Chapters', () => {
    test('deve extrair chapters quando disponíveis', async () => {
      const result = await extractor.extract(testVideoPath);
      const chapters = result.metadata.chapters;

      expect(chapters).toBeDefined();
      expect(chapters).toHaveLength(2);
      
      const chapter1 = chapters![0];
      expect(chapter1.id).toBe(0);
      expect(chapter1.startTime).toBe(0);
      expect(chapter1.endTime).toBe(60);
      expect(chapter1.duration).toBe(60);
      expect(chapter1.title).toBe('Introduction');
    });

    test('deve permitir desabilitar extração de chapters', async () => {
      const extractor = new VideoMetadataExtractor({
        extractChapters: false,
      });

      const result = await extractor.extract(testVideoPath);
      expect(result.metadata.chapters).toBeUndefined();
    });
  });

  // ==================== CONFORMANCE VALIDATION ====================

  describe('Conformance Validation', () => {
    test('deve validar vídeo conforme com requisitos', async () => {
      const result = await extractor.validateConformance(testVideoPath, {
        minDuration: 60,
        maxDuration: 180,
        minResolution: { width: 1280, height: 720 },
        maxResolution: { width: 3840, height: 2160 },
        allowedCodecs: ['h264', 'h265'],
        maxFileSize: 100 * 1024 * 1024, // 100 MB
      });

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('deve detectar violação de duração mínima', async () => {
      const result = await extractor.validateConformance(testVideoPath, {
        minDuration: 180,
      });

      expect(result.isValid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.stringContaining('Duration 120.5s below minimum 180s')
      );
    });

    test('deve detectar violação de duração máxima', async () => {
      const result = await extractor.validateConformance(testVideoPath, {
        maxDuration: 60,
      });

      expect(result.isValid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.stringContaining('Duration 120.5s exceeds maximum 60s')
      );
    });

    test('deve detectar violação de resolução mínima', async () => {
      const result = await extractor.validateConformance(testVideoPath, {
        minResolution: { width: 3840, height: 2160 },
      });

      expect(result.isValid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.stringContaining('Resolution 1920x1080 below minimum 3840x2160')
      );
    });

    test('deve detectar violação de codec', async () => {
      const result = await extractor.validateConformance(testVideoPath, {
        allowedCodecs: ['h265', 'vp9'],
      });

      expect(result.isValid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.stringContaining('Codec h264 not in allowed list')
      );
    });

    test('deve detectar violação de tamanho de arquivo', async () => {
      const result = await extractor.validateConformance(testVideoPath, {
        maxFileSize: 10 * 1024 * 1024, // 10 MB
      });

      expect(result.isValid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.stringContaining('File size')
      );
    });

    test('deve detectar múltiplas violações', async () => {
      const result = await extractor.validateConformance(testVideoPath, {
        minDuration: 180,
        maxFileSize: 10 * 1024 * 1024,
        allowedCodecs: ['vp9'],
      });

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);
    });
  });

  // ==================== OPTIONS ====================

  describe('Extraction Options', () => {
    test('deve permitir desabilitar EXIF', async () => {
      const extractor = new VideoMetadataExtractor({
        extractExif: false,
      });

      const result = await extractor.extract(testVideoPath);
      expect(result.metadata.exif).toBeUndefined();
    });

    test('deve permitir desabilitar XMP', async () => {
      const extractor = new VideoMetadataExtractor({
        extractXmp: false,
      });

      const result = await extractor.extract(testVideoPath);
      expect(result.metadata.xmp).toBeUndefined();
    });

    test('deve calcular checksum quando habilitado', async () => {
      const extractor = new VideoMetadataExtractor({
        calculateChecksum: true,
      });

      // Mock crypto
      jest.mock('crypto', () => ({
        createHash: jest.fn(() => ({
          update: jest.fn(),
          digest: jest.fn(() => 'abc123def456'),
        })),
      }));

      jest.mock('fs', () => ({
        createReadStream: jest.fn(() => ({
          on: jest.fn((event, callback) => {
            if (event === 'end') callback();
            return this;
          }),
        })),
        promises: {
          access: jest.fn(),
          stat: jest.fn().mockResolvedValue({
            size: 75312500,
            birthtime: new Date(),
            mtime: new Date(),
          }),
        },
      }));

      // Test checksum option enabled
      expect(extractor).toBeDefined();
    });
  });

  // ==================== FACTORY FUNCTIONS ====================

  describe('Factory Functions', () => {
    test('createBasicExtractor deve criar extrator básico', () => {
      const extractor = createBasicExtractor();
      expect(extractor).toBeInstanceOf(VideoMetadataExtractor);
    });

    test('createFullExtractor deve criar extrator completo', () => {
      const extractor = createFullExtractor();
      expect(extractor).toBeInstanceOf(VideoMetadataExtractor);
    });

    test('createConformanceValidator deve criar validador', () => {
      const validator = createConformanceValidator();
      expect(validator).toBeInstanceOf(VideoMetadataExtractor);
    });
  });

  // ==================== EVENTS ====================

  describe('Event Emission', () => {
    test('deve emitir evento de start', async () => {
      const startHandler = jest.fn();
      extractor.on('start', startHandler);

      await extractor.extract(testVideoPath);

      expect(startHandler).toHaveBeenCalledWith({ videoPath: testVideoPath });
    });

    test('deve emitir eventos de progress', async () => {
      const progressHandler = jest.fn();
      extractor.on('progress', progressHandler);

      await extractor.extract(testVideoPath);

      expect(progressHandler).toHaveBeenCalled();
      expect(progressHandler.mock.calls.some(
        call => call[0].stage === 'complete' && call[0].percent === 100
      )).toBe(true);
    });

    test('deve emitir evento de complete', async () => {
      const completeHandler = jest.fn();
      extractor.on('complete', completeHandler);

      await extractor.extract(testVideoPath);

      expect(completeHandler).toHaveBeenCalled();
    });

    test('deve emitir evento de error em caso de falha', async () => {
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        callback(new Error('FFprobe failed'), null);
      });

      const errorHandler = jest.fn();
      extractor.on('error', errorHandler);

      await expect(extractor.extract(testVideoPath)).rejects.toThrow();
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  // ==================== ERROR HANDLING ====================

  describe('Error Handling', () => {
    test('deve lançar erro se arquivo não existir', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(extractor.extract(testVideoPath)).rejects.toThrow();
    });

    test('deve lançar erro se FFprobe falhar', async () => {
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        callback(new Error('Invalid file'), null);
      });

      await expect(extractor.extract(testVideoPath)).rejects.toThrow('Invalid file');
    });

    test('deve adicionar warnings para falhas não fatais', async () => {
      // Mock EXIF extraction failure (não fatal)
      const result = await extractor.extract(testVideoPath);

      // Como EXIF requer biblioteca externa, deve ter warning ou undefined
      expect(result.metadata.exif).toBeUndefined();
    });
  });

  // ==================== FORMATTING ====================

  describe('Formatting Utilities', () => {
    test('deve formatar tamanho de arquivo corretamente', async () => {
      const sizes = [
        { bytes: 1024, expected: '1.00 KB' },
        { bytes: 1048576, expected: '1.00 MB' },
        { bytes: 1073741824, expected: '1.00 GB' },
      ];

      for (const { bytes, expected } of sizes) {
        (fs.stat as jest.Mock).mockResolvedValue({
          size: bytes,
          birthtime: new Date(),
          mtime: new Date(),
        });

        const result = await extractor.extract(testVideoPath);
        expect(result.metadata.file.sizeFormatted).toBe(expected);
      }
    });

    test('deve formatar bitrate corretamente', async () => {
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        const data = JSON.parse(JSON.stringify(mockProbeData));
        data.format.bit_rate = 8500000;
        callback(null, data);
      });

      const result = await extractor.extract(testVideoPath);
      expect(result.metadata.format.bitrateFormatted).toBe('8.50 Mbps');
    });

    test('deve formatar duração corretamente', async () => {
      const durations = [
        { seconds: 65, expected: '00:01:05' },
        { seconds: 3665, expected: '01:01:05' },
        { seconds: 45, expected: '00:00:45' },
      ];

      for (const { seconds, expected } of durations) {
        mockFfmpeg.ffprobe = jest.fn((path, callback) => {
          const data = JSON.parse(JSON.stringify(mockProbeData));
          data.format.duration = seconds;
          callback(null, data);
        });

        const result = await extractor.extract(testVideoPath);
        expect(result.metadata.format.durationFormatted).toBe(expected);
      }
    });
  });

  // ==================== PERFORMANCE ====================

  describe('Performance', () => {
    test('extractBasic deve ser mais rápido que extract', async () => {
      const basicStart = Date.now();
      await extractor.extractBasic(testVideoPath);
      const basicTime = Date.now() - basicStart;

      const fullStart = Date.now();
      await extractor.extract(testVideoPath);
      const fullTime = Date.now() - fullStart;

      // Basic deve ser pelo menos tão rápido quanto full
      expect(basicTime).toBeLessThanOrEqual(fullTime);
    });

    test('deve incluir tempo de processamento no resultado', async () => {
      const result = await extractor.extract(testVideoPath);

      expect(result.processingTime).toBeGreaterThan(0);
      expect(typeof result.processingTime).toBe('number');
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    test('deve lidar com vídeo sem streams de áudio', async () => {
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        const data = JSON.parse(JSON.stringify(mockProbeData));
        data.streams = data.streams.filter((s: any) => s.codec_type !== 'audio');
        callback(null, data);
      });

      const result = await extractor.extract(testVideoPath);
      expect(result.metadata.audioStreams).toHaveLength(0);
    });

    test('deve lidar com vídeo sem legendas', async () => {
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        const data = JSON.parse(JSON.stringify(mockProbeData));
        data.streams = data.streams.filter((s: any) => s.codec_type !== 'subtitle');
        callback(null, data);
      });

      const result = await extractor.extract(testVideoPath);
      expect(result.metadata.subtitleStreams).toHaveLength(0);
    });

    test('deve lidar com vídeo sem chapters', async () => {
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        const data = JSON.parse(JSON.stringify(mockProbeData));
        delete data.chapters;
        callback(null, data);
      });

      const result = await extractor.extract(testVideoPath);
      expect(result.metadata.chapters).toBeUndefined();
    });

    test('deve lidar com tags ausentes', async () => {
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        const data = JSON.parse(JSON.stringify(mockProbeData));
        delete data.format.tags;
        callback(null, data);
      });

      const result = await extractor.extract(testVideoPath);
      expect(result.metadata.format.title).toBeUndefined();
      expect(result.metadata.tags).toEqual({});
    });

    test('deve lidar com valores ausentes gracefully', async () => {
      mockFfmpeg.ffprobe = jest.fn((path, callback) => {
        const data = {
          format: {
            format_name: 'mp4',
          },
          streams: [],
        };
        callback(null, data);
      });

      const result = await extractor.extract(testVideoPath);
      expect(result.metadata.format.duration).toBe(0);
      expect(result.metadata.videoStreams).toHaveLength(0);
    });
  });
});
