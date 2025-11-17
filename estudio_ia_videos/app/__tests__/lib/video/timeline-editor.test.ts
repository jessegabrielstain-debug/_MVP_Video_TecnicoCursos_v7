/**
 * Testes para Timeline Editor
 */

import TimelineEditor, {
  createBasicEditor,
  createHighQualityEditor,
  createSocialMediaEditor,
  createCourseEditor,
  TimelineClip,
  TimelineTrack,
  TransitionType
} from '../../../lib/video/timeline-editor';
import { EventEmitter } from 'events';

// Mocks
jest.mock('fluent-ffmpeg');
jest.mock('fs/promises');

type MockedFfmpegModule = jest.Mock & {
  ffprobe: jest.Mock;
};

const ffmpeg = require('fluent-ffmpeg') as MockedFfmpegModule;
const fs = require('fs/promises');

describe('TimelineEditor', () => {
  let editor: TimelineEditor;
  let mockFfmpegInstance: unknown;

  beforeEach(() => {
    editor = new TimelineEditor();
    
    // Mock FFmpeg
    mockFfmpegInstance = {
      input: jest.fn().mockReturnThis(),
      setStartTime: jest.fn().mockReturnThis(),
      setDuration: jest.fn().mockReturnThis(),
      videoFilters: jest.fn().mockReturnThis(),
      audioFilters: jest.fn().mockReturnThis(),
      output: jest.fn().mockReturnThis(),
      videoCodec: jest.fn().mockReturnThis(),
      audioCodec: jest.fn().mockReturnThis(),
      outputOptions: jest.fn().mockReturnThis(),
      complexFilter: jest.fn().mockReturnThis(),
      map: jest.fn().mockReturnThis(),
      seekInput: jest.fn().mockReturnThis(),
      frames: jest.fn().mockReturnThis(),
      on: jest.fn(function(event, handler) {
        if (event === 'end') {
          setTimeout(() => handler(), 10);
        }
        return this;
      }),
      run: jest.fn()
    };

    ffmpeg.mockReturnValue(mockFfmpegInstance);

    // Mock ffprobe
    ffmpeg.ffprobe = jest.fn((filePath, callback) => {
      callback(null, {
        format: { duration: 60 },
        streams: [
          {
            codec_type: 'video',
            width: 1920,
            height: 1080,
            r_frame_rate: '30/1'
          }
        ]
      });
    });

    // Mock fs - sempre resolver com sucesso por padrão
    fs.access = jest.fn().mockImplementation(() => Promise.resolve());
    fs.mkdir = jest.fn().mockImplementation(() => Promise.resolve());
    fs.stat = jest.fn().mockImplementation(() => Promise.resolve({ size: 1024000 }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('deve criar uma instância do TimelineEditor', () => {
      expect(editor).toBeInstanceOf(TimelineEditor);
      expect(editor).toBeInstanceOf(EventEmitter);
    });

    it('deve inicializar com timeline vazia', () => {
      const timeline = editor.getTimeline();
      expect(timeline.tracks).toHaveLength(0);
      expect(timeline.fps).toBe(30);
      expect(timeline.resolution).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe('Track Management', () => {
    it('deve adicionar uma track de vídeo', () => {
      const trackId = editor.addTrack('video');
      
      expect(trackId).toBeDefined();
      expect(trackId).toContain('track_');
      
      const timeline = editor.getTimeline();
      expect(timeline.tracks).toHaveLength(1);
      expect(timeline.tracks[0].type).toBe('video');
    });

    it('deve adicionar uma track de áudio', () => {
      const trackId = editor.addTrack('audio', { volume: 0.8 });
      
      const timeline = editor.getTimeline();
      expect(timeline.tracks[0].type).toBe('audio');
      expect(timeline.tracks[0].volume).toBe(0.8);
    });

    it('deve adicionar múltiplas tracks', () => {
      const track1 = editor.addTrack('video');
      const track2 = editor.addTrack('audio');
      const track3 = editor.addTrack('both');
      
      const timeline = editor.getTimeline();
      expect(timeline.tracks).toHaveLength(3);
    });

    it('deve remover uma track', () => {
      const trackId = editor.addTrack('video');
      const removed = editor.removeTrack(trackId);
      
      expect(removed).toBe(true);
      expect(editor.getTimeline().tracks).toHaveLength(0);
    });

    it('deve lançar erro ao remover track inexistente', () => {
      expect(() => {
        editor.removeTrack('invalid-track-id');
      }).toThrow('Track não encontrada');
    });

    it('deve lançar erro ao remover track travada', () => {
      const trackId = editor.addTrack('video');
      const timeline = editor.getTimeline();
      timeline.tracks[0].locked = true;
      editor.loadTimeline(timeline);
      
      expect(() => {
        editor.removeTrack(trackId);
      }).toThrow('Track travada');
    });

    it('deve emitir evento ao adicionar track', (done) => {
      editor.on('track-added', ({ trackId, type }) => {
        expect(trackId).toBeDefined();
        expect(type).toBe('video');
        done();
      });
      
      editor.addTrack('video');
    });

    it('deve emitir evento ao remover track', (done) => {
      const trackId = editor.addTrack('video');
      
      editor.on('track-removed', ({ trackId: removedId }) => {
        expect(removedId).toBe(trackId);
        done();
      });
      
      editor.removeTrack(trackId);
    });
  });

  describe('Clip Management', () => {
    let trackId: string;

    beforeEach(() => {
      trackId = editor.addTrack('video');
    });

    it('deve adicionar um clip a uma track', async () => {
      const clipId = await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10
      });
      
      expect(clipId).toBeDefined();
      expect(clipId).toContain('clip_');
      
      const timeline = editor.getTimeline();
      expect(timeline.tracks[0].clips).toHaveLength(1);
    });

    it('deve calcular duração do clip corretamente', async () => {
      await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 5,
        endTime: 15
      });
      
      const timeline = editor.getTimeline();
      const clip = timeline.tracks[0].clips[0];
      
      expect(clip.duration).toBe(10);
      expect(clip.timelineEnd).toBe(10);
    });

    it('deve posicionar clips sequencialmente', async () => {
      await editor.addClip(trackId, {
        filePath: 'clip1.mp4',
        startTime: 0,
        endTime: 5
      });
      
      await editor.addClip(trackId, {
        filePath: 'clip2.mp4',
        startTime: 0,
        endTime: 3
      });
      
      const timeline = editor.getTimeline();
      const clips = timeline.tracks[0].clips;
      
      expect(clips[0].timelineStart).toBe(0);
      expect(clips[0].timelineEnd).toBe(5);
      expect(clips[1].timelineStart).toBe(5);
      expect(clips[1].timelineEnd).toBe(8);
    });

    it('deve adicionar clip com transição', async () => {
      await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10,
        transition: { type: 'fade', duration: 1.5 }
      });
      
      const timeline = editor.getTimeline();
      const clip = timeline.tracks[0].clips[0];
      
      expect(clip.transition).toBeDefined();
      expect(clip.transition?.type).toBe('fade');
      expect(clip.transition?.duration).toBe(1.5);
    });

    it('deve remover um clip', async () => {
      const clipId = await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10
      });
      
      const removed = editor.removeClip(trackId, clipId);
      
      expect(removed).toBe(true);
      expect(editor.getTimeline().tracks[0].clips).toHaveLength(0);
    });

    it('deve lançar erro ao adicionar clip com arquivo inexistente', async () => {
      fs.access = jest.fn().mockRejectedValue(new Error('File not found'));
      
      await expect(
        editor.addClip(trackId, {
          filePath: 'missing.mp4',
          startTime: 0,
          endTime: 10
        })
      ).rejects.toThrow('Arquivo não encontrado');
    });

    it('deve lançar erro ao adicionar clip com tempos inválidos', async () => {
      await expect(
        editor.addClip(trackId, {
          filePath: 'test.mp4',
          startTime: 10,
          endTime: 5  // Fim antes do início
        })
      ).rejects.toThrow('Tempos de clip inválidos');
    });

    it('deve emitir evento ao adicionar clip', async (done) => {
      editor.on('clip-added', ({ trackId: tid, clipId }) => {
        expect(tid).toBe(trackId);
        expect(clipId).toBeDefined();
        done();
      });
      
      await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10
      });
    });
  });

  describe('Clip Editing', () => {
    let trackId: string;
    let clipId: string;

    beforeEach(async () => {
      trackId = editor.addTrack('video');
      clipId = await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 20
      });
    });

    it('deve fazer trim de um clip', async () => {
      await editor.trimClip(trackId, clipId, {
        startTime: 5,
        endTime: 15
      });
      
      const timeline = editor.getTimeline();
      const clip = timeline.tracks[0].clips[0];
      
      expect(clip.startTime).toBe(5);
      expect(clip.endTime).toBe(15);
      expect(clip.duration).toBe(10);
    });

    it('deve fazer trim usando duration', async () => {
      await editor.trimClip(trackId, clipId, {
        startTime: 3,
        duration: 8
      });
      
      const timeline = editor.getTimeline();
      const clip = timeline.tracks[0].clips[0];
      
      expect(clip.duration).toBe(8);
      expect(clip.endTime).toBe(11);
    });

    it('deve dividir um clip em dois', async () => {
      const [clip1Id, clip2Id] = await editor.splitClip(trackId, clipId, {
        timestamp: 10
      });
      
      const timeline = editor.getTimeline();
      const clips = timeline.tracks[0].clips;
      
      expect(clips).toHaveLength(2);
      expect(clips[0].id).toBe(clip1Id);
      expect(clips[1].id).toBe(clip2Id);
      expect(clips[0].duration).toBe(10);
      expect(clips[1].duration).toBe(10);
    });

    it('deve mover um clip na timeline', () => {
      editor.moveClip(trackId, clipId, 5);
      
      const timeline = editor.getTimeline();
      const clip = timeline.tracks[0].clips[0];
      
      expect(clip.timelineStart).toBe(5);
      expect(clip.timelineEnd).toBe(25);
    });

    it('deve aplicar transição a um clip', () => {
      editor.applyTransition(trackId, clipId, {
        type: 'dissolve',
        duration: 2
      });
      
      const timeline = editor.getTimeline();
      const clip = timeline.tracks[0].clips[0];
      
      expect(clip.transition?.type).toBe('dissolve');
      expect(clip.transition?.duration).toBe(2);
    });

    it('deve lançar erro ao fazer trim com tempos inválidos', async () => {
      await expect(
        editor.trimClip(trackId, clipId, {
          startTime: 15,
          endTime: 5
        })
      ).rejects.toThrow('Tempos de trim inválidos');
    });

    it('deve lançar erro ao dividir em ponto inválido', async () => {
      await expect(
        editor.splitClip(trackId, clipId, { timestamp: 25 })
      ).rejects.toThrow('Ponto de divisão inválido');
    });

    it('deve emitir evento ao fazer trim', async (done) => {
      editor.on('clip-trimmed', ({ clipId: id, oldDuration, newDuration }) => {
        expect(id).toBe(clipId);
        expect(oldDuration).toBe(20);
        expect(newDuration).toBe(10);
        done();
      });
      
      await editor.trimClip(trackId, clipId, { duration: 10 });
    });
  });

  describe('Multi-track Operations', () => {
    it('deve mover clip entre tracks', async () => {
      const track1 = editor.addTrack('video');
      const track2 = editor.addTrack('video');
      
      const clipId = await editor.addClip(track1, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10
      });
      
      editor.moveClipToTrack(track1, track2, clipId);
      
      const timeline = editor.getTimeline();
      expect(timeline.tracks[0].clips).toHaveLength(0);
      expect(timeline.tracks[1].clips).toHaveLength(1);
    });

    it('deve lançar erro ao mover clip entre tracks incompatíveis', async () => {
      const videoTrack = editor.addTrack('video');
      const audioTrack = editor.addTrack('audio');
      
      const clipId = await editor.addClip(videoTrack, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10
      });
      
      expect(() => {
        editor.moveClipToTrack(videoTrack, audioTrack, clipId);
      }).toThrow('Tipos de track incompatíveis');
    });
  });

  describe('Timeline Operations', () => {
    it('deve calcular duração total da timeline', async () => {
      const trackId = editor.addTrack('video');
      
      await editor.addClip(trackId, {
        filePath: 'clip1.mp4',
        startTime: 0,
        endTime: 10
      });
      
      await editor.addClip(trackId, {
        filePath: 'clip2.mp4',
        startTime: 0,
        endTime: 5
      });
      
      const duration = editor.getTimelineDuration();
      expect(duration).toBe(15); // 10 + 5
    });

    it('deve contar total de clips', async () => {
      const track1 = editor.addTrack('video');
      const track2 = editor.addTrack('audio');
      
      await editor.addClip(track1, { filePath: 'v1.mp4', startTime: 0, endTime: 10 });
      await editor.addClip(track1, { filePath: 'v2.mp4', startTime: 0, endTime: 5 });
      await editor.addClip(track2, { filePath: 'a1.mp3', startTime: 0, endTime: 15 });
      
      const count = editor.getTotalClipCount();
      expect(count).toBe(3);
    });

    it('deve limpar timeline', async () => {
      const trackId = editor.addTrack('video');
      await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10
      });
      
      editor.clearTimeline();
      
      const timeline = editor.getTimeline();
      expect(timeline.tracks).toHaveLength(0);
    });

    it('deve carregar uma timeline', () => {
      const config = {
        tracks: [
          {
            id: 'track_1',
            type: 'video' as const,
            clips: [],
            muted: false,
            volume: 1.0,
            locked: false
          }
        ],
        fps: 25,
        resolution: { width: 1280, height: 720 }
      };
      
      editor.loadTimeline(config);
      
      const timeline = editor.getTimeline();
      expect(timeline.tracks).toHaveLength(1);
      expect(timeline.fps).toBe(25);
      expect(timeline.resolution).toEqual({ width: 1280, height: 720 });
    });
  });

  describe('Preview Generation', () => {
    it('deve gerar preview em timestamp específico', async () => {
      const trackId = editor.addTrack('video');
      await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 30
      });
      
      const result = await editor.generatePreview(15);
      
      expect(result.success).toBe(true);
      expect(result.thumbnailPath).toContain('preview_15_');
      expect(result.timestamp).toBe(15);
    });

    it('deve emitir eventos de preview', async (done) => {
      const trackId = editor.addTrack('video');
      await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 30
      });
      
      let startEmitted = false;
      
      editor.on('preview-start', ({ timestamp }) => {
        expect(timestamp).toBe(10);
        startEmitted = true;
      });
      
      editor.on('preview-complete', (result) => {
        expect(startEmitted).toBe(true);
        expect(result.success).toBe(true);
        done();
      });
      
      await editor.generatePreview(10);
    });
  });

  describe('Export', () => {
    beforeEach(async () => {
      const trackId = editor.addTrack('video');
      await editor.addClip(trackId, {
        filePath: 'clip1.mp4',
        startTime: 0,
        endTime: 10
      });
      await editor.addClip(trackId, {
        filePath: 'clip2.mp4',
        startTime: 0,
        endTime: 5
      });
    });

    it('deve exportar timeline', async () => {
      const result = await editor.export({
        outputPath: 'output.mp4'
      });
      
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('output.mp4');
      expect(result.clipCount).toBe(2);
      expect(result.trackCount).toBe(1);
    });

    it('deve usar opções de exportação personalizadas', async () => {
      await editor.export({
        outputPath: 'output.mp4',
        videoCodec: 'libx265',
        preset: 'slow',
        crf: 18,
        audioBitrate: '256k'
      });
      
      expect(mockFfmpegInstance.videoCodec).toHaveBeenCalledWith('libx265');
      expect(mockFfmpegInstance.outputOptions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('-preset slow'),
          expect.stringContaining('-crf 18'),
          expect.stringContaining('-b:a 256k')
        ])
      );
    });

    it('deve lançar erro ao exportar timeline vazia', async () => {
      editor.clearTimeline();
      
      await expect(
        editor.export({ outputPath: 'output.mp4' })
      ).rejects.toThrow('Timeline vazia');
    });

    it('deve emitir eventos durante exportação', async (done) => {
      let startEmitted = false;
      let progressEmitted = false;
      
      editor.on('export-start', ({ tracks }) => {
        expect(tracks).toBe(1);
        startEmitted = true;
      });
      
      editor.on('export-progress', ({ percent }) => {
        progressEmitted = true;
      });
      
      editor.on('export-complete', (result) => {
        expect(startEmitted).toBe(true);
        expect(result.success).toBe(true);
        done();
      });
      
      await editor.export({ outputPath: 'output.mp4' });
    });
  });

  describe('Validation', () => {
    it('deve validar arquivo existente', async () => {
      const trackId = editor.addTrack('video');
      
      await expect(
        editor.addClip(trackId, {
          filePath: 'valid.mp4',
          startTime: 0,
          endTime: 10
        })
      ).resolves.toBeDefined();
    });

    it('deve rejeitar arquivo inexistente', async () => {
      fs.access = jest.fn().mockRejectedValue(new Error('ENOENT'));
      
      const trackId = editor.addTrack('video');
      
      await expect(
        editor.addClip(trackId, {
          filePath: 'missing.mp4',
          startTime: 0,
          endTime: 10
        })
      ).rejects.toThrow('Arquivo não encontrado');
    });

    it('deve detectar overlaps na timeline', async () => {
      const trackId = editor.addTrack('video');
      
      await editor.addClip(trackId, {
        filePath: 'clip1.mp4',
        startTime: 0,
        endTime: 10,
        timelineStart: 0
      });
      
      await editor.addClip(trackId, {
        filePath: 'clip2.mp4',
        startTime: 0,
        endTime: 10,
        timelineStart: 5  // Overlap com clip anterior
      });
      
      await expect(
        editor.export({ outputPath: 'output.mp4' })
      ).rejects.toThrow('Overlap detectado');
    });
  });

  describe('Factory Functions', () => {
    it('deve criar editor básico', () => {
      const basicEditor = createBasicEditor();
      expect(basicEditor).toBeInstanceOf(TimelineEditor);
    });

    it('deve criar editor de alta qualidade', () => {
      const { editor: hqEditor, exportOptions } = createHighQualityEditor();
      
      expect(hqEditor).toBeInstanceOf(TimelineEditor);
      expect(exportOptions.videoCodec).toBe('libx265');
      expect(exportOptions.preset).toBe('slow');
      expect(exportOptions.crf).toBe(18);
    });

    it('deve criar editor para redes sociais', () => {
      const { editor: smEditor, config, exportOptions } = createSocialMediaEditor();
      
      expect(smEditor).toBeInstanceOf(TimelineEditor);
      expect(config.resolution).toEqual({ width: 1080, height: 1920 });
      expect(exportOptions.preset).toBe('fast');
    });

    it('deve criar editor para cursos', () => {
      const { editor: courseEditor, config, exportOptions } = createCourseEditor();
      
      expect(courseEditor).toBeInstanceOf(TimelineEditor);
      expect(config.resolution).toEqual({ width: 1920, height: 1080 });
      expect(config.fps).toBe(30);
      expect(exportOptions.crf).toBe(20);
    });
  });

  describe('Advanced Features', () => {
    it('deve aplicar velocidade a clip', async () => {
      const trackId = editor.addTrack('video');
      
      await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10,
        speed: 2.0  // 2x mais rápido
      });
      
      const timeline = editor.getTimeline();
      const clip = timeline.tracks[0].clips[0];
      
      expect(clip.speed).toBe(2.0);
    });

    it('deve aplicar volume a clip', async () => {
      const trackId = editor.addTrack('video');
      
      await editor.addClip(trackId, {
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10,
        volume: 0.5
      });
      
      const timeline = editor.getTimeline();
      const clip = timeline.tracks[0].clips[0];
      
      expect(clip.volume).toBe(0.5);
    });

    it('deve ordenar clips por posição na timeline', async () => {
      const trackId = editor.addTrack('video');
      
      const clip1 = await editor.addClip(trackId, {
        filePath: 'clip1.mp4',
        startTime: 0,
        endTime: 5,
        timelineStart: 10
      });
      
      const clip2 = await editor.addClip(trackId, {
        filePath: 'clip2.mp4',
        startTime: 0,
        endTime: 5,
        timelineStart: 0
      });
      
      const timeline = editor.getTimeline();
      const clips = timeline.tracks[0].clips;
      
      // clip2 deve vir primeiro (timelineStart = 0)
      expect(clips[0].id).toBe(clip2);
      expect(clips[1].id).toBe(clip1);
    });
  });
});
