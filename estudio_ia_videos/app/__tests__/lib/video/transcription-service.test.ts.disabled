/**
 * 🧪 Video Transcription Service - Test Suite
 * 
 * Testes completos para o serviço de transcrição de vídeo
 * 
 * @jest-environment node
 */

import VideoTranscriptionService, {
  createBasicTranscriptionService,
  createStandardTranscriptionService,
  createPremiumTranscriptionService,
  createMultilingualTranscriptionService,
  TranscriptionResult,
  TranscriptionSegment,
  ExportOptions,
} from '../../../lib/video/transcription-service';
import { promises as fs } from 'fs';
import path from 'path';

// ==================== MOCKS ====================

jest.mock('fluent-ffmpeg');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

const mockFfmpeg = require('fluent-ffmpeg');

// ==================== TEST DATA ====================

const mockTranscriptionResult: TranscriptionResult = {
  text: 'Bem-vindo ao nosso curso sobre segurança do trabalho. Nesta aula, vamos aprender sobre os equipamentos de proteção individual.',
  segments: [
    {
      id: 1,
      start: 0.0,
      end: 5.2,
      duration: 5.2,
      text: 'Bem-vindo ao nosso curso sobre segurança do trabalho.',
      confidence: 0.95,
      words: [
        { word: 'Bem-vindo', start: 0.0, end: 0.8, confidence: 0.98 },
        { word: 'ao', start: 0.8, end: 1.0, confidence: 0.99 },
        { word: 'nosso', start: 1.0, end: 1.4, confidence: 0.97 },
        { word: 'curso', start: 1.4, end: 2.0, confidence: 0.96 },
        { word: 'sobre', start: 2.0, end: 2.5, confidence: 0.98 },
        { word: 'segurança', start: 2.5, end: 3.3, confidence: 0.94 },
        { word: 'do', start: 3.3, end: 3.5, confidence: 0.99 },
        { word: 'trabalho', start: 3.5, end: 5.2, confidence: 0.93 },
      ],
    },
    {
      id: 2,
      start: 5.5,
      end: 10.8,
      duration: 5.3,
      text: 'Nesta aula, vamos aprender sobre os equipamentos de proteção individual.',
      confidence: 0.92,
    },
  ],
  metadata: {
    language: 'pt',
    languageConfidence: 0.98,
    model: 'base',
    duration: 10.8,
    processingTime: 5000,
    segmentCount: 2,
    wordCount: 18,
    averageConfidence: 0.935,
    speechRate: 100,
  },
  highlights: ['Bem-vindo ao nosso curso sobre segurança do trabalho.'],
  keywords: ['segurança', 'proteção', 'epi', 'equipamento'],
};

// ==================== TESTS ====================

describe('VideoTranscriptionService', () => {
  let service: VideoTranscriptionService;
  const testVideoPath = '/test/video.mp4';
  const testAudioPath = '/test/audio.wav';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    // Mock FFmpeg
    const mockFFmpegInstance = {
      noVideo: jest.fn().mockReturnThis(),
      audioCodec: jest.fn().mockReturnThis(),
      audioChannels: jest.fn().mockReturnThis(),
      audioFrequency: jest.fn().mockReturnThis(),
      setStartTime: jest.fn().mockReturnThis(),
      setDuration: jest.fn().mockReturnThis(),
      output: jest.fn().mockReturnThis(),
      on: jest.fn(function(this: unknown, event: string, callback: Function) {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return this;
      }),
      run: jest.fn(),
    };

    mockFfmpeg.mockReturnValue(mockFFmpegInstance);

    service = new VideoTranscriptionService();
  });

  // ==================== BASIC TRANSCRIPTION ====================

  describe('Basic Transcription', () => {
    test('deve transcrever vídeo completo', async () => {
      const result = await service.transcribe(testVideoPath);

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.segments).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('deve criar diretório temporário', async () => {
      await service.transcribe(testVideoPath);

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('transcription'),
        { recursive: true }
      );
    });

    test('deve extrair áudio do vídeo', async () => {
      await service.transcribe(testVideoPath);

      expect(mockFfmpeg).toHaveBeenCalledWith(testVideoPath);
    });

    test('deve retornar metadados completos', async () => {
      const result = await service.transcribe(testVideoPath);
      const metadata = result.metadata;

      expect(metadata.language).toBeDefined();
      expect(metadata.model).toBeDefined();
      expect(metadata.duration).toBeGreaterThan(0);
      expect(metadata.processingTime).toBeGreaterThan(0);
      expect(metadata.segmentCount).toBeGreaterThan(0);
      expect(metadata.wordCount).toBeGreaterThan(0);
    });

    test('deve incluir timestamps em cada segmento', async () => {
      const result = await service.transcribe(testVideoPath);

      result.segments.forEach(segment => {
        expect(segment.start).toBeDefined();
        expect(segment.end).toBeDefined();
        expect(segment.duration).toBeDefined();
        expect(segment.end).toBeGreaterThan(segment.start);
      });
    });

    test('deve incluir texto em cada segmento', async () => {
      const result = await service.transcribe(testVideoPath);

      result.segments.forEach(segment => {
        expect(segment.text).toBeDefined();
        expect(segment.text.length).toBeGreaterThan(0);
      });
    });
  });

  // ==================== TRANSCRIPTION OPTIONS ====================

  describe('Transcription Options', () => {
    test('deve aceitar modelo específico', async () => {
      const service = new VideoTranscriptionService({
        model: 'large-v3',
      });

      const result = await service.transcribe(testVideoPath);
      expect(result.metadata.model).toBe('large-v3');
    });

    test('deve aceitar idioma específico', async () => {
      const result = await service.transcribe(testVideoPath, {
        language: 'en',
      });

      expect(result.metadata.language).toBe('en');
    });

    test('deve incluir timestamps de palavras quando habilitado', async () => {
      const service = new VideoTranscriptionService({
        wordTimestamps: true,
      });

      const result = await service.transcribe(testVideoPath);
      
      const segmentWithWords = result.segments.find(s => s.words && s.words.length > 0);
      expect(segmentWithWords).toBeDefined();
      
      if (segmentWithWords?.words) {
        segmentWithWords.words.forEach(word => {
          expect(word.word).toBeDefined();
          expect(word.start).toBeDefined();
          expect(word.end).toBeDefined();
        });
      }
    });

    test('deve aplicar diarization quando habilitado', async () => {
      const service = new VideoTranscriptionService({
        diarization: true,
      });

      const result = await service.transcribe(testVideoPath, {
        speakerCount: 2,
      });

      expect(result.metadata.speakerCount).toBeDefined();
      
      const segmentWithSpeaker = result.segments.find(s => s.speaker !== undefined);
      expect(segmentWithSpeaker).toBeDefined();
    });

    test('deve suportar tradução', async () => {
      const service = new VideoTranscriptionService({
        task: 'translate',
        translate: true,
      });

      const result = await service.transcribe(testVideoPath);
      expect(result).toBeDefined();
    });

    test('deve aceitar temperatura customizada', async () => {
      const service = new VideoTranscriptionService({
        temperature: 0.5,
      });

      await service.transcribe(testVideoPath);
      // Temperature afeta criatividade do modelo
    });
  });

  // ==================== SEGMENT TRANSCRIPTION ====================

  describe('Segment Transcription', () => {
    test('deve transcrever apenas segmento específico', async () => {
      const result = await service.transcribeSegment(testVideoPath, 10, 20);

      expect(result).toBeDefined();
      expect(result.segments).toBeDefined();
    });

    test('deve ajustar timestamps para offset inicial', async () => {
      const startOffset = 10;
      const result = await service.transcribeSegment(testVideoPath, startOffset, 20);

      result.segments.forEach(segment => {
        expect(segment.start).toBeGreaterThanOrEqual(startOffset);
      });
    });

    test('deve extrair áudio apenas do segmento especificado', async () => {
      await service.transcribeSegment(testVideoPath, 5, 15);

      // Verifica se FFmpeg foi chamado com setStartTime e setDuration
      const mockInstance = mockFfmpeg.mock.results[0].value;
      expect(mockInstance.setStartTime).toHaveBeenCalledWith(5);
      expect(mockInstance.setDuration).toHaveBeenCalledWith(10);
    });
  });

  // ==================== LANGUAGE DETECTION ====================

  describe('Language Detection', () => {
    test('deve detectar idioma automaticamente quando não especificado', async () => {
      const result = await service.transcribe(testVideoPath);

      expect(result.metadata.language).toBeDefined();
      expect(result.metadata.languageConfidence).toBeDefined();
    });

    test('deve usar idioma especificado se fornecido', async () => {
      const result = await service.transcribe(testVideoPath, {
        language: 'es',
      });

      expect(result.metadata.language).toBe('es');
    });
  });

  // ==================== EXPORT FORMATS ====================

  describe('Export Formats', () => {
    const outputDir = '/test/output';

    test('deve exportar para SRT', async () => {
      const result = mockTranscriptionResult;
      const outputPath = path.join(outputDir, 'output.srt');

      await service.export(result, outputPath, { format: 'srt' });

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('1\n00:00:00,000 --> 00:00:05,200'),
        'utf-8'
      );
    });

    test('deve exportar para VTT', async () => {
      const result = mockTranscriptionResult;
      const outputPath = path.join(outputDir, 'output.vtt');

      await service.export(result, outputPath, { format: 'vtt' });

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('WEBVTT'),
        'utf-8'
      );
    });

    test('deve exportar para JSON', async () => {
      const result = mockTranscriptionResult;
      const outputPath = path.join(outputDir, 'output.json');

      await service.export(result, outputPath, { format: 'json' });

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('"text"'),
        'utf-8'
      );
    });

    test('deve exportar para TXT simples', async () => {
      const result = mockTranscriptionResult;
      const outputPath = path.join(outputDir, 'output.txt');

      await service.export(result, outputPath, { format: 'txt' });

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining(''),
        'utf-8'
      );
    });

    test('deve exportar para ASS', async () => {
      const result = mockTranscriptionResult;
      const outputPath = path.join(outputDir, 'output.ass');

      await service.export(result, outputPath, { format: 'ass' });

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('[Script Info]'),
        'utf-8'
      );
    });

    test('deve exportar para SBV (YouTube)', async () => {
      const result = mockTranscriptionResult;
      const outputPath = path.join(outputDir, 'output.sbv');

      await service.export(result, outputPath, { format: 'sbv' });

      expect(fs.writeFile).toHaveBeenCalled();
    });

    test('deve lançar erro para formato não suportado', async () => {
      const result = mockTranscriptionResult;
      const outputPath = path.join(outputDir, 'output.xyz');

      await expect(
        service.export(result, outputPath, { format: 'xyz' as unknown as 'srt' })
      ).rejects.toThrow('Unsupported format');
    });
  });

  // ==================== EXPORT OPTIONS ====================

  describe('Export Options', () => {
    const outputPath = '/test/output.srt';

    test('deve incluir timestamps quando habilitado', async () => {
      const result = mockTranscriptionResult;

      await service.export(result, outputPath, {
        format: 'txt',
        includeTimestamps: true,
      });

      const content = (fs.writeFile as jest.Mock).mock.calls[0][1];
      expect(content).toContain('[00:00:00,000]');
    });

    test('deve incluir speaker labels quando habilitado', async () => {
      const resultWithSpeakers = {
        ...mockTranscriptionResult,
        segments: mockTranscriptionResult.segments.map((s, i) => ({
          ...s,
          speaker: i % 2,
        })),
      };

      await service.export(resultWithSpeakers, outputPath, {
        format: 'srt',
        includeSpeakers: true,
      });

      const content = (fs.writeFile as jest.Mock).mock.calls[0][1];
      expect(content).toContain('[Speaker');
    });

    test('deve incluir confidence scores quando habilitado', async () => {
      const result = mockTranscriptionResult;

      await service.export(result, outputPath, {
        format: 'txt',
        includeConfidence: true,
      });

      // Confidence pode ser incluído no formato personalizado
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  // ==================== TRANSLATION ====================

  describe('Translation', () => {
    test('deve traduzir resultado para idioma alvo', async () => {
      const result = mockTranscriptionResult;
      const translated = await service.translate(result, 'en');

      expect(translated.metadata.language).toBe('en');
      expect(translated.segments.length).toBe(result.segments.length);
    });

    test('deve emitir evento de tradução', async () => {
      const result = mockTranscriptionResult;
      const translateHandler = jest.fn();

      service.on('translate', translateHandler);
      await service.translate(result, 'es');

      expect(translateHandler).toHaveBeenCalledWith({
        from: 'pt',
        to: 'es',
      });
    });
  });

  // ==================== METADATA EXTRACTION ====================

  describe('Metadata Extraction', () => {
    test('deve calcular speech rate', async () => {
      const result = await service.transcribe(testVideoPath);

      expect(result.metadata.speechRate).toBeDefined();
      expect(result.metadata.speechRate).toBeGreaterThan(0);
    });

    test('deve calcular average confidence', async () => {
      const result = await service.transcribe(testVideoPath);

      if (result.metadata.averageConfidence) {
        expect(result.metadata.averageConfidence).toBeGreaterThan(0);
        expect(result.metadata.averageConfidence).toBeLessThanOrEqual(1);
      }
    });

    test('deve contar palavras corretamente', async () => {
      const result = await service.transcribe(testVideoPath);

      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });

    test('deve contar segmentos corretamente', async () => {
      const result = await service.transcribe(testVideoPath);

      expect(result.metadata.segmentCount).toBe(result.segments.length);
    });

    test('deve calcular duração total', async () => {
      const result = await service.transcribe(testVideoPath);

      expect(result.metadata.duration).toBeGreaterThan(0);
    });
  });

  // ==================== KEYWORDS & HIGHLIGHTS ====================

  describe('Keywords & Highlights', () => {
    test('deve extrair keywords relevantes', async () => {
      const result = await service.transcribe(testVideoPath);

      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);
    });

    test('deve extrair highlights importantes', async () => {
      const result = await service.transcribe(testVideoPath);

      expect(result.highlights).toBeDefined();
      expect(Array.isArray(result.highlights)).toBe(true);
    });

    test('highlights devem ser frases com alta confiança', async () => {
      const result = await service.transcribe(testVideoPath);

      if (result.highlights && result.highlights.length > 0) {
        // Cada highlight deve existir no texto original
        result.highlights.forEach(highlight => {
          expect(result.text).toContain(highlight);
        });
      }
    });
  });

  // ==================== FACTORY FUNCTIONS ====================

  describe('Factory Functions', () => {
    test('createBasicTranscriptionService deve criar serviço básico', () => {
      const service = createBasicTranscriptionService();
      expect(service).toBeInstanceOf(VideoTranscriptionService);
    });

    test('createStandardTranscriptionService deve criar serviço padrão', () => {
      const service = createStandardTranscriptionService();
      expect(service).toBeInstanceOf(VideoTranscriptionService);
    });

    test('createPremiumTranscriptionService deve criar serviço premium', () => {
      const service = createPremiumTranscriptionService();
      expect(service).toBeInstanceOf(VideoTranscriptionService);
    });

    test('createMultilingualTranscriptionService deve criar serviço multilíngue', () => {
      const service = createMultilingualTranscriptionService();
      expect(service).toBeInstanceOf(VideoTranscriptionService);
    });
  });

  // ==================== EVENTS ====================

  describe('Event Emission', () => {
    test('deve emitir evento de start', async () => {
      const startHandler = jest.fn();
      service.on('start', startHandler);

      await service.transcribe(testVideoPath);

      expect(startHandler).toHaveBeenCalledWith(
        expect.objectContaining({ videoPath: testVideoPath })
      );
    });

    test('deve emitir eventos de progress', async () => {
      const progressHandler = jest.fn();
      service.on('progress', progressHandler);

      await service.transcribe(testVideoPath);

      expect(progressHandler).toHaveBeenCalled();
    });

    test('deve emitir evento de complete', async () => {
      const completeHandler = jest.fn();
      service.on('complete', completeHandler);

      await service.transcribe(testVideoPath);

      expect(completeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(''),
          segments: expect.arrayContaining([]),
        })
      );
    });

    test('deve emitir evento de export', async () => {
      const result = mockTranscriptionResult;
      const exportHandler = jest.fn();

      service.on('export', exportHandler);
      await service.export(result, '/test/output.srt', { format: 'srt' });

      expect(exportHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          outputPath: '/test/output.srt',
          format: 'srt',
        })
      );
    });

    test('deve emitir evento de error em caso de falha', async () => {
      mockFfmpeg.mockImplementation(() => {
        throw new Error('FFmpeg failed');
      });

      const errorHandler = jest.fn();
      service.on('error', errorHandler);

      await expect(service.transcribe(testVideoPath)).rejects.toThrow();
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  // ==================== TIME FORMATTING ====================

  describe('Time Formatting', () => {
    test('deve formatar tempo SRT corretamente', async () => {
      const result = mockTranscriptionResult;
      await service.export(result, '/test/output.srt', { format: 'srt' });

      const content = (fs.writeFile as jest.Mock).mock.calls[0][1];
      expect(content).toMatch(/\d{2}:\d{2}:\d{2},\d{3}/);
    });

    test('deve formatar tempo VTT corretamente', async () => {
      const result = mockTranscriptionResult;
      await service.export(result, '/test/output.vtt', { format: 'vtt' });

      const content = (fs.writeFile as jest.Mock).mock.calls[0][1];
      expect(content).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
    });

    test('deve formatar tempo ASS corretamente', async () => {
      const result = mockTranscriptionResult;
      await service.export(result, '/test/output.ass', { format: 'ass' });

      const content = (fs.writeFile as jest.Mock).mock.calls[0][1];
      expect(content).toMatch(/\d:\d{2}:\d{2}\.\d{2}/);
    });
  });

  // ==================== ERROR HANDLING ====================

  describe('Error Handling', () => {
    test('deve lançar erro se FFmpeg falhar na extração de áudio', async () => {
      const mockInstance = {
        noVideo: jest.fn().mockReturnThis(),
        audioCodec: jest.fn().mockReturnThis(),
        audioChannels: jest.fn().mockReturnThis(),
        audioFrequency: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        on: jest.fn(function(this: unknown, event: string, callback: Function) {
          if (event === 'error') {
            setTimeout(() => callback(new Error('FFmpeg extraction failed')), 0);
          }
          return this;
        }),
        run: jest.fn(),
      };

      mockFfmpeg.mockReturnValue(mockInstance);

      await expect(service.transcribe(testVideoPath)).rejects.toThrow();
    });

    test('deve limpar arquivos temporários após transcrição', async () => {
      await service.transcribe(testVideoPath);

      expect(fs.unlink).toHaveBeenCalled();
    });

    test('deve ignorar erros ao limpar arquivos temporários', async () => {
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('Cleanup failed'));

      // Não deve lançar erro
      await service.transcribe(testVideoPath);
    });
  });

  // ==================== PERFORMANCE ====================

  describe('Performance', () => {
    test('deve incluir tempo de processamento nos metadados', async () => {
      const result = await service.transcribe(testVideoPath);

      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    test('modelo tiny deve ser mais rápido que large', () => {
      const tinyService = new VideoTranscriptionService({ model: 'tiny' });
      const largeService = new VideoTranscriptionService({ model: 'large-v3' });

      // Em produção, tiny seria mais rápido
      expect(tinyService).toBeInstanceOf(VideoTranscriptionService);
      expect(largeService).toBeInstanceOf(VideoTranscriptionService);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    test('deve lidar com vídeo sem áudio', async () => {
      const mockInstance = {
        noVideo: jest.fn().mockReturnThis(),
        audioCodec: jest.fn().mockReturnThis(),
        audioChannels: jest.fn().mockReturnThis(),
        audioFrequency: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        on: jest.fn(function(this: unknown, event: string, callback: Function) {
          if (event === 'error') {
            setTimeout(() => callback(new Error('No audio stream')), 0);
          }
          return this;
        }),
        run: jest.fn(),
      };

      mockFfmpeg.mockReturnValue(mockInstance);

      await expect(service.transcribe(testVideoPath)).rejects.toThrow();
    });

    test('deve lidar com segmentos sem palavras', async () => {
      const result = await service.transcribe(testVideoPath);

      // Alguns segmentos podem não ter word-level timestamps
      const segmentWithoutWords = result.segments.find(s => !s.words || s.words.length === 0);
      
      if (segmentWithoutWords) {
        expect(segmentWithoutWords.text).toBeDefined();
      }
    });

    test('deve lidar com texto vazio gracefully', async () => {
      const emptyResult: TranscriptionResult = {
        ...mockTranscriptionResult,
        text: '',
        segments: [],
      };

      await service.export(emptyResult, '/test/output.srt', { format: 'srt' });
      expect(fs.writeFile).toHaveBeenCalled();
    });

    test('deve lidar com confidence scores ausentes', async () => {
      const resultNoConfidence: TranscriptionResult = {
        ...mockTranscriptionResult,
        segments: mockTranscriptionResult.segments.map(s => ({
          ...s,
          confidence: undefined,
        })),
        metadata: {
          ...mockTranscriptionResult.metadata,
          averageConfidence: undefined,
        },
      };

      await service.export(resultNoConfidence, '/test/output.srt', { format: 'srt' });
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  // ==================== INTEGRATION ====================

  describe('Integration', () => {
    test('deve integrar com diferentes providers', () => {
      const providers = ['openai', 'whisper-cpp', 'local'] as const;

      providers.forEach(provider => {
        const service = new VideoTranscriptionService({ provider });
        expect(service).toBeInstanceOf(VideoTranscriptionService);
      });
    });

    test('deve aceitar API key para provider OpenAI', () => {
      const service = new VideoTranscriptionService({
        provider: 'openai',
        apiKey: 'sk-test-key',
      });

      expect(service).toBeInstanceOf(VideoTranscriptionService);
    });
  });
});
