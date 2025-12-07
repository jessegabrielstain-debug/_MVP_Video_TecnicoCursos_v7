/**
 * Testes para Audio Mixer
 */

import AudioMixer, {
  createBasicMixer,
  createPodcastMixer,
  createCourseMixer,
  createDuckingMixer,
  EQConfig,
  CompressorConfig,
  EffectConfig
} from '../../../lib/audio/audio-mixer';
import { EventEmitter } from 'events';

// Mocks
jest.mock('fluent-ffmpeg');
jest.mock('fs/promises');

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs/promises');

interface FfmpegInstance {
  input: jest.Mock;
  output: jest.Mock;
  audioCodec: jest.Mock;
  audioChannels: jest.Mock;
  audioFrequency: jest.Mock;
  audioBitrate: jest.Mock;
  audioFilters: jest.Mock;
  complexFilter: jest.Mock;
  map: jest.Mock;
  on: jest.Mock;
  run: jest.Mock;
}

describe('AudioMixer', () => {
  let mixer: AudioMixer;
  let mockFfmpegInstance: FfmpegInstance;

  beforeEach(() => {
    mixer = new AudioMixer();
    
    // Mock FFmpeg
    mockFfmpegInstance = {
      input: jest.fn().mockReturnThis(),
      output: jest.fn().mockReturnThis(),
      audioCodec: jest.fn().mockReturnThis(),
      audioChannels: jest.fn().mockReturnThis(),
      audioFrequency: jest.fn().mockReturnThis(),
      audioBitrate: jest.fn().mockReturnThis(),
      audioFilters: jest.fn().mockReturnThis(),
      complexFilter: jest.fn().mockReturnThis(),
      map: jest.fn().mockReturnThis(),
      on: jest.fn(function(event, handler) {
        if (event === 'end') {
          setTimeout(() => handler(), 10);
        }
        return this;
      }),
      run: jest.fn()
    };

    (ffmpeg as jest.Mock).mockReturnValue(mockFfmpegInstance);

    // Mock ffprobe
    interface FfprobeData {
      format: { duration: number };
      streams: Array<{ codec_type: string; codec_name: string; sample_rate: number; channels: number; }>;
    }
    (ffmpeg as unknown as { ffprobe: (path: string, callback: (err: Error | null, data: FfprobeData) => void) => void }).ffprobe = jest.fn((filePath, callback) => {
      callback(null, {
        format: { duration: 120 },
        streams: [
          {
            codec_type: 'audio',
            codec_name: 'mp3',
            sample_rate: 48000,
            channels: 2
          }
        ]
      });
    });

    // Mock fs
    fs.access = jest.fn().mockImplementation(() => Promise.resolve());
    fs.mkdir = jest.fn().mockImplementation(() => Promise.resolve());
    fs.stat = jest.fn().mockImplementation(() => Promise.resolve({ size: 2048000 }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('deve criar uma instância do AudioMixer', () => {
      expect(mixer).toBeInstanceOf(AudioMixer);
      expect(mixer).toBeInstanceOf(EventEmitter);
    });

    it('deve inicializar com configuração padrão', () => {
      const config = mixer.getConfig();
      
      expect(config.tracks).toHaveLength(0);
      expect(config.masterVolume).toBe(1.0);
      expect(config.sampleRate).toBe(48000);
      expect(config.bitDepth).toBe(16);
      expect(config.channels).toBe(2);
    });
  });

  describe('Track Management', () => {
    it('deve adicionar uma track', async () => {
      const trackId = await mixer.addTrack({
        name: 'Voz',
        filePath: 'voz.mp3',
        volume: 1.0,
        pan: 0
      });
      
      expect(trackId).toBeDefined();
      expect(trackId).toContain('track_');
      
      const config = mixer.getConfig();
      expect(config.tracks).toHaveLength(1);
      expect(config.tracks[0].name).toBe('Voz');
    });

    it('deve adicionar track com configurações completas', async () => {
      await mixer.addTrack({
        name: 'Música',
        filePath: 'music.mp3',
        volume: 0.6,
        pan: -0.2,
        startTime: 5,
        eq: { lowGain: -2, midGain: 1, highGain: 0 },
        compressor: { threshold: -20, ratio: 4 },
        fadeIn: 2,
        fadeOut: 3
      });
      
      const config = mixer.getConfig();
      const track = config.tracks[0];
      
      expect(track.volume).toBe(0.6);
      expect(track.pan).toBe(-0.2);
      expect(track.startTime).toBe(5);
      expect(track.eq).toBeDefined();
      expect(track.compressor).toBeDefined();
      expect(track.fadeIn).toBe(2);
      expect(track.fadeOut).toBe(3);
    });

    it('deve remover uma track', async () => {
      const trackId = await mixer.addTrack({
        name: 'Test',
        filePath: 'test.mp3'
      });
      
      const removed = mixer.removeTrack(trackId);
      
      expect(removed).toBe(true);
      expect(mixer.getConfig().tracks).toHaveLength(0);
    });

    it('deve lançar erro ao remover track inexistente', () => {
      expect(() => {
        mixer.removeTrack('invalid-id');
      }).toThrow('Track não encontrada');
    });

    it('deve lançar erro ao adicionar arquivo inexistente', async () => {
      fs.access = jest.fn().mockRejectedValue(new Error('ENOENT'));
      
      await expect(
        mixer.addTrack({
          name: 'Test',
          filePath: 'missing.mp3'
        })
      ).rejects.toThrow('Arquivo de áudio não encontrado');
    });

    it('deve emitir evento ao adicionar track', async (done) => {
      mixer.on('track-added', ({ trackId, track }) => {
        expect(trackId).toBeDefined();
        expect(track.name).toBe('Voz');
        done();
      });
      
      await mixer.addTrack({
        name: 'Voz',
        filePath: 'voz.mp3'
      });
    });

    it('deve emitir evento ao remover track', async (done) => {
      const trackId = await mixer.addTrack({
        name: 'Test',
        filePath: 'test.mp3'
      });
      
      mixer.on('track-removed', ({ trackId: id }) => {
        expect(id).toBe(trackId);
        done();
      });
      
      mixer.removeTrack(trackId);
    });
  });

  describe('Track Controls', () => {
    let trackId: string;

    beforeEach(async () => {
      trackId = await mixer.addTrack({
        name: 'Test',
        filePath: 'test.mp3'
      });
    });

    it('deve definir volume', () => {
      mixer.setVolume(trackId, 0.8);
      
      const config = mixer.getConfig();
      expect(config.tracks[0].volume).toBe(0.8);
    });

    it('deve lançar erro para volume inválido', () => {
      expect(() => {
        mixer.setVolume(trackId, 3);
      }).toThrow('Volume deve estar entre 0 e 2');
    });

    it('deve definir pan', () => {
      mixer.setPan(trackId, -0.5);
      
      const config = mixer.getConfig();
      expect(config.tracks[0].pan).toBe(-0.5);
    });

    it('deve lançar erro para pan inválido', () => {
      expect(() => {
        mixer.setPan(trackId, 1.5);
      }).toThrow('Pan deve estar entre -1 e 1');
    });

    it('deve mutar track', () => {
      mixer.setMute(trackId, true);
      
      const config = mixer.getConfig();
      expect(config.tracks[0].muted).toBe(true);
    });

    it('deve colocar track em solo', () => {
      mixer.setSolo(trackId, true);
      
      const config = mixer.getConfig();
      expect(config.tracks[0].solo).toBe(true);
    });

    it('deve emitir eventos de controle', (done) => {
      let volumeChanged = false;
      let panChanged = false;
      let muteChanged = false;

      mixer.on('volume-changed', ({ volume }) => {
        expect(volume).toBe(0.7);
        volumeChanged = true;
      });

      mixer.on('pan-changed', ({ pan }) => {
        expect(pan).toBe(0.3);
        panChanged = true;
      });

      mixer.on('mute-changed', ({ muted }) => {
        expect(muted).toBe(true);
        muteChanged = true;
        
        if (volumeChanged && panChanged && muteChanged) {
          done();
        }
      });

      mixer.setVolume(trackId, 0.7);
      mixer.setPan(trackId, 0.3);
      mixer.setMute(trackId, true);
    });
  });

  describe('EQ', () => {
    let trackId: string;

    beforeEach(async () => {
      trackId = await mixer.addTrack({
        name: 'Test',
        filePath: 'test.mp3'
      });
    });

    it('deve aplicar equalização', () => {
      const eq: EQConfig = {
        lowGain: -3,
        midGain: 2,
        highGain: 1
      };

      mixer.setEQ(trackId, eq);
      
      const config = mixer.getConfig();
      expect(config.tracks[0].eq).toEqual(eq);
    });

    it('deve aplicar EQ com frequências customizadas', () => {
      const eq: EQConfig = {
        lowGain: -2,
        lowFreq: 80,
        midGain: 3,
        midFreq: 1500,
        highGain: -1,
        highFreq: 12000
      };

      mixer.setEQ(trackId, eq);
      
      const config = mixer.getConfig();
      expect(config.tracks[0].eq?.lowFreq).toBe(80);
      expect(config.tracks[0].eq?.midFreq).toBe(1500);
      expect(config.tracks[0].eq?.highFreq).toBe(12000);
    });

    it('deve emitir evento ao aplicar EQ', (done) => {
      const eq: EQConfig = { lowGain: -3 };

      mixer.on('eq-changed', ({ trackId: id, eq: appliedEq }) => {
        expect(id).toBe(trackId);
        expect(appliedEq).toEqual(eq);
        done();
      });

      mixer.setEQ(trackId, eq);
    });
  });

  describe('Compressor', () => {
    let trackId: string;

    beforeEach(async () => {
      trackId = await mixer.addTrack({
        name: 'Test',
        filePath: 'test.mp3'
      });
    });

    it('deve aplicar compressor', () => {
      const comp: CompressorConfig = {
        threshold: -20,
        ratio: 4,
        attack: 10,
        release: 100,
        makeupGain: 3
      };

      mixer.setCompressor(trackId, comp);
      
      const config = mixer.getConfig();
      expect(config.tracks[0].compressor).toEqual(comp);
    });

    it('deve emitir evento ao aplicar compressor', (done) => {
      const comp: CompressorConfig = { threshold: -18, ratio: 6 };

      mixer.on('compressor-changed', ({ trackId: id, compressor }) => {
        expect(id).toBe(trackId);
        expect(compressor).toEqual(comp);
        done();
      });

      mixer.setCompressor(trackId, comp);
    });
  });

  describe('Effects', () => {
    let trackId: string;

    beforeEach(async () => {
      trackId = await mixer.addTrack({
        name: 'Test',
        filePath: 'test.mp3'
      });
    });

    it('deve adicionar efeito reverb', () => {
      mixer.addEffect(trackId, {
        type: 'reverb',
        mix: 0.3
      });
      
      const config = mixer.getConfig();
      expect(config.tracks[0].effects).toHaveLength(1);
      expect(config.tracks[0].effects?.[0].type).toBe('reverb');
    });

    it('deve adicionar múltiplos efeitos', () => {
      mixer.addEffect(trackId, { type: 'reverb', mix: 0.2 });
      mixer.addEffect(trackId, { type: 'delay', mix: 0.3 });
      mixer.addEffect(trackId, { type: 'chorus', mix: 0.4 });
      
      const config = mixer.getConfig();
      expect(config.tracks[0].effects).toHaveLength(3);
    });

    it('deve limpar efeitos', () => {
      mixer.addEffect(trackId, { type: 'reverb', mix: 0.3 });
      mixer.addEffect(trackId, { type: 'delay', mix: 0.2 });
      
      mixer.clearEffects(trackId);
      
      const config = mixer.getConfig();
      expect(config.tracks[0].effects).toHaveLength(0);
    });

    it('deve emitir eventos de efeitos', (done) => {
      let effectAdded = false;
      let effectsCleared = false;

      mixer.on('effect-added', ({ effect }) => {
        expect(effect.type).toBe('reverb');
        effectAdded = true;
      });

      mixer.on('effects-cleared', ({ trackId: id }) => {
        expect(id).toBe(trackId);
        effectsCleared = true;
        
        if (effectAdded && effectsCleared) {
          done();
        }
      });

      mixer.addEffect(trackId, { type: 'reverb', mix: 0.3 });
      mixer.clearEffects(trackId);
    });
  });

  describe('Automation', () => {
    let trackId: string;

    beforeEach(async () => {
      trackId = await mixer.addTrack({
        name: 'Test',
        filePath: 'test.mp3'
      });
    });

    it('deve adicionar automação de volume', () => {
      mixer.addAutomation(trackId, {
        parameter: 'volume',
        points: [
          { timestamp: 0, value: 0.5 },
          { timestamp: 10, value: 1.0 },
          { timestamp: 20, value: 0.3 }
        ]
      });
      
      const config = mixer.getConfig();
      expect(config.tracks[0].automation).toHaveLength(1);
      expect(config.tracks[0].automation?.[0].parameter).toBe('volume');
    });

    it('deve ordenar pontos de automação por timestamp', () => {
      mixer.addAutomation(trackId, {
        parameter: 'volume',
        points: [
          { timestamp: 20, value: 0.3 },
          { timestamp: 0, value: 0.5 },
          { timestamp: 10, value: 1.0 }
        ]
      });
      
      const config = mixer.getConfig();
      const points = config.tracks[0].automation?.[0].points;
      
      expect(points?.[0].timestamp).toBe(0);
      expect(points?.[1].timestamp).toBe(10);
      expect(points?.[2].timestamp).toBe(20);
    });

    it('deve adicionar múltiplas automações', () => {
      mixer.addAutomation(trackId, {
        parameter: 'volume',
        points: [{ timestamp: 0, value: 1.0 }]
      });

      mixer.addAutomation(trackId, {
        parameter: 'pan',
        points: [{ timestamp: 0, value: 0 }]
      });
      
      const config = mixer.getConfig();
      expect(config.tracks[0].automation).toHaveLength(2);
    });
  });

  describe('Ducking', () => {
    let voiceTrackId: string;
    let musicTrackId: string;

    beforeEach(async () => {
      voiceTrackId = await mixer.addTrack({
        name: 'Voz',
        filePath: 'voz.mp3'
      });

      musicTrackId = await mixer.addTrack({
        name: 'Música',
        filePath: 'music.mp3'
      });
    });

    it('deve adicionar configuração de ducking', () => {
      mixer.addDucking({
        targetTrackId: musicTrackId,
        triggerTrackId: voiceTrackId,
        threshold: -25,
        reduction: -12,
        attack: 10,
        release: 100
      });
      
      const config = mixer.getConfig();
      expect(config.ducking).toHaveLength(1);
    });

    it('deve lançar erro ao configurar ducking com tracks inválidas', () => {
      expect(() => {
        mixer.addDucking({
          targetTrackId: 'invalid-id',
          triggerTrackId: voiceTrackId
        });
      }).toThrow('Track não encontrada');
    });

    it('deve emitir evento ao adicionar ducking', (done) => {
      mixer.on('ducking-added', ({ ducking }) => {
        expect(ducking.targetTrackId).toBe(musicTrackId);
        expect(ducking.triggerTrackId).toBe(voiceTrackId);
        done();
      });

      mixer.addDucking({
        targetTrackId: musicTrackId,
        triggerTrackId: voiceTrackId
      });
    });
  });

  describe('Master Controls', () => {
    it('deve definir volume master', () => {
      mixer.setMasterVolume(0.8);
      
      const config = mixer.getConfig();
      expect(config.masterVolume).toBe(0.8);
    });

    it('deve lançar erro para volume master inválido', () => {
      expect(() => {
        mixer.setMasterVolume(3);
      }).toThrow('Master volume deve estar entre 0 e 2');
    });

    it('deve emitir evento ao mudar volume master', (done) => {
      mixer.on('master-volume-changed', ({ volume }) => {
        expect(volume).toBe(0.9);
        done();
      });

      mixer.setMasterVolume(0.9);
    });
  });

  describe('Config Management', () => {
    it('deve obter configuração', async () => {
      await mixer.addTrack({
        name: 'Track 1',
        filePath: 'track1.mp3'
      });

      const config = mixer.getConfig();
      
      expect(config.tracks).toHaveLength(1);
      expect(config.masterVolume).toBe(1.0);
    });

    it('deve carregar configuração', () => {
      const config = {
        tracks: [
          {
            id: 'track_1',
            name: 'Test',
            filePath: 'test.mp3',
            volume: 1.0,
            pan: 0,
            muted: false,
            solo: false,
            startTime: 0,
            duration: 120
          }
        ],
        masterVolume: 0.9,
        sampleRate: 44100,
        bitDepth: 24,
        channels: 2
      };

      mixer.loadConfig(config);
      
      const loaded = mixer.getConfig();
      expect(loaded.tracks).toHaveLength(1);
      expect(loaded.masterVolume).toBe(0.9);
      expect(loaded.sampleRate).toBe(44100);
    });

    it('deve limpar todas as tracks', async () => {
      await mixer.addTrack({ name: 'Track 1', filePath: 'track1.mp3' });
      await mixer.addTrack({ name: 'Track 2', filePath: 'track2.mp3' });
      
      mixer.clearTracks();
      
      const config = mixer.getConfig();
      expect(config.tracks).toHaveLength(0);
    });
  });

  describe('Export', () => {
    beforeEach(async () => {
      await mixer.addTrack({
        name: 'Voz',
        filePath: 'voz.mp3',
        volume: 1.0
      });

      await mixer.addTrack({
        name: 'Música',
        filePath: 'music.mp3',
        volume: 0.6
      });
    });

    it('deve exportar mix', async () => {
      const result = await mixer.export({
        outputPath: 'mix.mp3'
      });
      
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('mix.mp3');
      expect(result.trackCount).toBe(2);
    });

    it('deve exportar com formato WAV', async () => {
      await mixer.export({
        outputPath: 'mix.wav',
        format: 'wav'
      });
      
      expect(mockFfmpegInstance.audioCodec).toHaveBeenCalledWith('pcm_s16le');
    });

    it('deve exportar com formato FLAC', async () => {
      await mixer.export({
        outputPath: 'mix.flac',
        format: 'flac'
      });
      
      expect(mockFfmpegInstance.audioCodec).toHaveBeenCalledWith('flac');
    });

    it('deve exportar com normalização', async () => {
      await mixer.export({
        outputPath: 'mix.mp3',
        normalize: true,
        targetLUFS: -16
      });
      
      expect(mockFfmpegInstance.audioFilters).toHaveBeenCalled();
    });

    it('deve lançar erro ao exportar mixer vazio', async () => {
      mixer.clearTracks();
      
      await expect(
        mixer.export({ outputPath: 'mix.mp3' })
      ).rejects.toThrow('Mixer vazio');
    });

    it('deve lançar erro ao exportar com todas tracks mutadas', async () => {
      const config = mixer.getConfig();
      config.tracks.forEach(t => t.muted = true);
      mixer.loadConfig(config);
      
      await expect(
        mixer.export({ outputPath: 'mix.mp3' })
      ).rejects.toThrow('Todas as tracks estão mutadas');
    });

    it('deve emitir eventos durante exportação', async (done) => {
      let startEmitted = false;
      let progressEmitted = false;

      mixer.on('export-start', ({ trackCount }) => {
        expect(trackCount).toBe(2);
        startEmitted = true;
      });

      mixer.on('export-progress', ({ percent }) => {
        progressEmitted = true;
      });

      mixer.on('export-complete', (result) => {
        expect(startEmitted).toBe(true);
        expect(result.success).toBe(true);
        done();
      });

      await mixer.export({ outputPath: 'mix.mp3' });
    });
  });

  describe('Track Analysis', () => {
    it('deve analisar níveis de track', async () => {
      const trackId = await mixer.addTrack({
        name: 'Test',
        filePath: 'test.mp3'
      });

      const analysis = await mixer.analyzeTrack(trackId);
      
      expect(analysis.peakLevel).toBeDefined();
      expect(analysis.rmsLevel).toBeDefined();
      expect(analysis.duration).toBe(120);
    });
  });

  describe('Factory Functions', () => {
    it('deve criar mixer básico', () => {
      const basicMixer = createBasicMixer();
      expect(basicMixer).toBeInstanceOf(AudioMixer);
    });

    it('deve criar mixer para podcasts', () => {
      const { mixer: podcastMixer, config } = createPodcastMixer();
      
      expect(podcastMixer).toBeInstanceOf(AudioMixer);
      expect(config.sampleRate).toBe(48000);
      expect(config.channels).toBe(2);
    });

    it('deve criar mixer para cursos', () => {
      const { mixer: courseMixer, presets } = createCourseMixer();
      
      expect(courseMixer).toBeInstanceOf(AudioMixer);
      expect(presets.voice).toBeDefined();
      expect(presets.music).toBeDefined();
      expect(presets.voice.eq).toBeDefined();
      expect(presets.voice.compressor).toBeDefined();
    });

    it('deve criar mixer com ducking automático', async () => {
      const duckingMixer = createDuckingMixer();
      
      expect(duckingMixer).toBeInstanceOf(AudioMixer);
      
      // Adicionar tracks de voz e música
      await duckingMixer.addTrack({
        name: 'Voz Principal',
        filePath: 'voz.mp3'
      });

      await duckingMixer.addTrack({
        name: 'Música de Fundo',
        filePath: 'music.mp3'
      });

      const config = duckingMixer.getConfig();
      expect(config.ducking).toHaveLength(1);
    });
  });

  describe('Update Track', () => {
    it('deve atualizar propriedades de track', async () => {
      const trackId = await mixer.addTrack({
        name: 'Original',
        filePath: 'test.mp3',
        volume: 1.0
      });

      mixer.updateTrack(trackId, {
        name: 'Atualizado',
        volume: 0.7,
        pan: -0.3
      });

      const config = mixer.getConfig();
      const track = config.tracks[0];
      
      expect(track.name).toBe('Atualizado');
      expect(track.volume).toBe(0.7);
      expect(track.pan).toBe(-0.3);
    });

    it('deve emitir evento ao atualizar track', async (done) => {
      const trackId = await mixer.addTrack({
        name: 'Test',
        filePath: 'test.mp3'
      });

      mixer.on('track-updated', ({ trackId: id, updates }) => {
        expect(id).toBe(trackId);
        expect(updates.volume).toBe(0.8);
        done();
      });

      mixer.updateTrack(trackId, { volume: 0.8 });
    });
  });

  describe('Solo Behavior', () => {
    it('deve mutar outras tracks ao ativar solo', async () => {
      const track1 = await mixer.addTrack({
        name: 'Track 1',
        filePath: 'track1.mp3'
      });

      const track2 = await mixer.addTrack({
        name: 'Track 2',
        filePath: 'track2.mp3'
      });

      mixer.setSolo(track1, true);

      const config = mixer.getConfig();
      expect(config.tracks[0].solo).toBe(true);
      expect(config.tracks[1].muted).toBe(true);
    });

    it('deve desmutar tracks ao desativar solo', async () => {
      const track1 = await mixer.addTrack({
        name: 'Track 1',
        filePath: 'track1.mp3'
      });

      const track2 = await mixer.addTrack({
        name: 'Track 2',
        filePath: 'track2.mp3'
      });

      mixer.setSolo(track1, true);
      mixer.setSolo(track1, false);

      const config = mixer.getConfig();
      expect(config.tracks[0].solo).toBe(false);
      expect(config.tracks[1].muted).toBe(false);
    });
  });
});
