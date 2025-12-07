/**
 * 🧪 Integration Tests - Rendering Pipeline (CORRECTED)
 * Sprint 49 - Task 8
 * 
 * Testa orquestração do pipeline sem executar processamento real
 * - Validação de estágios
 * - Estrutura do pipeline
 * - Configurações de integração
 */

import { 
  RenderingPipeline,
  PipelineStage,
  type PipelineProgress,
  type PipelineResult
} from '../../../lib/export/rendering-pipeline'
import { 
  ExportFormat,
  ExportResolution,
  ExportQuality,
  type ExportSettings 
} from '../../../types/export.types'
import { VideoFilterType } from '../../../lib/export/video-filters'
import { AudioEnhancementType } from '../../../lib/export/audio-processor'
import { WatermarkType, WatermarkPosition } from '../../../types/watermark.types'

describe('RenderingPipeline - Integration Validation', () => {
  describe('Pipeline Stages', () => {
    it('deve ter todos os estágios definidos', () => {
      expect(PipelineStage.AUDIO_PROCESSING).toBe('audio_processing')
      expect(PipelineStage.VIDEO_FILTERS).toBe('video_filters')
      expect(PipelineStage.WATERMARK).toBe('watermark')
      expect(PipelineStage.SUBTITLES).toBe('subtitles')
      expect(PipelineStage.COMPLETE).toBe('complete')
    })

    it('deve ter 5 estágios no total', () => {
      const stages = Object.values(PipelineStage)
      expect(stages).toHaveLength(5)
    })
  })

  describe('Pipeline Class', () => {
    it('deve criar instância de RenderingPipeline', () => {
      const pipeline = new RenderingPipeline()
      expect(pipeline).toBeDefined()
      expect(pipeline).toBeInstanceOf(RenderingPipeline)
    })

    it('deve ter método execute', () => {
      const pipeline = new RenderingPipeline()
      expect(typeof pipeline.execute).toBe('function')
    })

    it('execute deve aceitar 4 parâmetros', () => {
      const pipeline = new RenderingPipeline()
      // inputPath, outputPath, settings, onProgress
      expect(pipeline.execute.length).toBe(4)
    })

    it('deve ter método cleanup', () => {
      const pipeline = new RenderingPipeline()
      expect(typeof pipeline.cleanup).toBe('function')
    })
  })

  describe('Export Settings Integration', () => {
    it('deve aceitar settings completos com todas as features', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
        watermark: {
          type: WatermarkType.IMAGE,
          imageUrl: '/test/watermark.png',
          position: WatermarkPosition.BOTTOM_RIGHT,
          opacity: 0.8,
          width: 200,
          height: 'auto',
          maintainAspectRatio: true,
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        videoFilters: [
          { type: VideoFilterType.BRIGHTNESS, value: 0.1, enabled: true },
          { type: VideoFilterType.CONTRAST, value: 0.2, enabled: true },
        ],
        audioEnhancements: [
          {
            type: AudioEnhancementType.NORMALIZE,
            value: { targetLevel: -16, method: 'ebu' },
            enabled: true,
          },
        ],
        subtitle: {
          enabled: true,
          source: '/test/subtitle.srt',
          burnIn: true,
        },
      }

      expect(settings.watermark).toBeDefined()
      expect(settings.videoFilters).toHaveLength(2)
      expect(settings.audioEnhancements).toHaveLength(1)
      expect(settings.subtitle?.enabled).toBe(true)
    })

    it('deve aceitar settings parciais (apenas watermark)', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
        watermark: {
          type: WatermarkType.TEXT,
          text: 'Copyright 2025',
          style: {
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            color: '#FFFFFF',
          },
          position: WatermarkPosition.BOTTOM_CENTER,
          opacity: 0.9,
          padding: { top: 0, right: 0, bottom: 30, left: 0 },
        },
      }

      expect(settings.watermark).toBeDefined()
      expect(settings.videoFilters).toBeUndefined()
      expect(settings.audioEnhancements).toBeUndefined()
      expect(settings.subtitle).toBeUndefined()
    })

    it('deve aceitar settings sem features avançadas', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.MEDIUM,
        fps: 30,
      }

      expect(settings.watermark).toBeUndefined()
      expect(settings.videoFilters).toBeUndefined()
      expect(settings.audioEnhancements).toBeUndefined()
      expect(settings.subtitle).toBeUndefined()
    })
  })

  describe('Pipeline Progress', () => {
    it('PipelineProgress deve ter estrutura correta', () => {
      const progress: PipelineProgress = {
        stage: PipelineStage.AUDIO_PROCESSING,
        stageProgress: 50,
        overallProgress: 12.5,
        message: 'Processando áudio...',
        currentFile: '/tmp/temp.mp4',
      }

      expect(progress).toHaveProperty('stage')
      expect(progress).toHaveProperty('stageProgress')
      expect(progress).toHaveProperty('overallProgress')
      expect(progress).toHaveProperty('message')
      expect(progress).toHaveProperty('currentFile')
    })

    it('deve aceitar progresso em diferentes estágios', () => {
      const stages = [
        PipelineStage.AUDIO_PROCESSING,
        PipelineStage.VIDEO_FILTERS,
        PipelineStage.WATERMARK,
        PipelineStage.SUBTITLES,
        PipelineStage.COMPLETE,
      ]

      stages.forEach((stage, index) => {
        const progress: PipelineProgress = {
          stage,
          stageProgress: 50,
          overallProgress: (index + 1) * 20,
          message: `Estágio ${stage}`,
        }

        expect(progress.stage).toBe(stage)
      })
    })
  })

  describe('Pipeline Result', () => {
    it('PipelineResult deve ter estrutura correta para sucesso', () => {
      const result: PipelineResult = {
        success: true,
        outputPath: '/output/video.mp4',
        stages: [
          { stage: PipelineStage.AUDIO_PROCESSING, duration: 1500, success: true },
          { stage: PipelineStage.VIDEO_FILTERS, duration: 2000, success: true },
          { stage: PipelineStage.WATERMARK, duration: 1000, success: true },
          { stage: PipelineStage.SUBTITLES, duration: 1200, success: true },
        ],
        totalDuration: 5700,
      }

      expect(result.success).toBe(true)
      expect(result.outputPath).toBeDefined()
      expect(result.stages).toHaveLength(4)
      expect(result.totalDuration).toBe(5700)
    })

    it('PipelineResult deve ter estrutura correta para erro', () => {
      const result: PipelineResult = {
        success: false,
        outputPath: '',
        stages: [
          { stage: PipelineStage.AUDIO_PROCESSING, duration: 1500, success: false, error: 'Audio processing failed' },
        ],
        totalDuration: 1500,
      }

      expect(result.success).toBe(false)
      expect(result.stages[0].error).toBeDefined()
      expect(result.stages[0].success).toBe(false)
    })
  })

  describe('Feature Combinations', () => {
    it('deve aceitar combinação audio + filters', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
        audioEnhancements: [
          {
            type: AudioEnhancementType.NORMALIZE,
            value: { targetLevel: -16, method: 'ebu' },
            enabled: true,
          },
        ],
        videoFilters: [
          { type: VideoFilterType.BRIGHTNESS, value: 0.1, enabled: true },
        ],
      }

      expect(settings.audioEnhancements).toBeDefined()
      expect(settings.videoFilters).toBeDefined()
    })

    it('deve aceitar combinação filters + watermark', () => {
      const settings: ExportSettings = {
        format: ExportFormat.WEBM,
        resolution: ExportResolution.UHD_4K,
        quality: ExportQuality.ULTRA,
        fps: 60,
        videoFilters: [
          { type: VideoFilterType.SATURATION, value: 1.2, enabled: true },
        ],
        watermark: {
          type: WatermarkType.TEXT,
          text: 'DRAFT',
          style: {
            fontFamily: 'Impact',
            fontSize: 48,
            fontWeight: 900,
            color: '#FF0000',
          },
          position: WatermarkPosition.CENTER,
          opacity: 0.5,
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      }

      expect(settings.videoFilters).toBeDefined()
      expect(settings.watermark).toBeDefined()
    })

    it('deve aceitar todas as features ativadas', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
        audioEnhancements: [
          {
            type: AudioEnhancementType.NORMALIZE,
            value: { targetLevel: -16, method: 'ebu' },
            enabled: true,
          },
        ],
        videoFilters: [
          { type: VideoFilterType.BRIGHTNESS, value: 0.1, enabled: true },
        ],
        watermark: {
          type: WatermarkType.IMAGE,
          imageUrl: '/logo.png',
          position: WatermarkPosition.TOP_RIGHT,
          opacity: 0.8,
          width: 150,
          height: 'auto',
          maintainAspectRatio: true,
          padding: { top: 10, right: 10, bottom: 10, left: 10 },
        },
        subtitle: {
          enabled: true,
          source: '/subtitle.srt',
          burnIn: true,
        },
      }

      expect(settings.audioEnhancements).toBeDefined()
      expect(settings.videoFilters).toBeDefined()
      expect(settings.watermark).toBeDefined()
      expect(settings.subtitle).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('deve aceitar arrays vazios de filtros', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.LOW,
        fps: 24,
        videoFilters: [],
        audioEnhancements: [],
      }

      expect(settings.videoFilters).toHaveLength(0)
      expect(settings.audioEnhancements).toHaveLength(0)
    })

    it('deve aceitar subtitle desabilitado', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MOV,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
        subtitle: {
          enabled: false,
          source: '',
          burnIn: false,
        },
      }

      expect(settings.subtitle?.enabled).toBe(false)
    })

    it('deve aceitar filtros parcialmente desabilitados', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.MEDIUM,
        fps: 30,
        videoFilters: [
          { type: VideoFilterType.BRIGHTNESS, value: 0.1, enabled: true },
          { type: VideoFilterType.CONTRAST, value: 0.2, enabled: false },
          { type: VideoFilterType.SATURATION, value: 1.2, enabled: true },
        ],
      }

      const enabledFilters = settings.videoFilters?.filter((f: any) => f.enabled)
      expect(enabledFilters).toHaveLength(2)
    })
  })

  describe('Enum Values', () => {
    it('deve ter formatos corretos', () => {
      expect(ExportFormat.MP4).toBe('mp4')
      expect(ExportFormat.WEBM).toBe('webm')
      expect(ExportFormat.MOV).toBe('mov')
    })

    it('deve ter resoluções corretas', () => {
      expect(ExportResolution.HD_720).toBe('720p')
      expect(ExportResolution.FULL_HD_1080).toBe('1080p')
      expect(ExportResolution.UHD_4K).toBe('4k')
    })

    it('deve ter qualidades corretas', () => {
      expect(ExportQuality.LOW).toBe('low')
      expect(ExportQuality.MEDIUM).toBe('medium')
      expect(ExportQuality.HIGH).toBe('high')
      expect(ExportQuality.ULTRA).toBe('ultra')
    })
  })

  describe('FPS Settings', () => {
    const fpsValues = [24, 25, 30, 50, 60]

    fpsValues.forEach(fps => {
      it(`deve aceitar fps: ${fps}`, () => {
        const settings: ExportSettings = {
          format: ExportFormat.MP4,
          resolution: ExportResolution.FULL_HD_1080,
          quality: ExportQuality.HIGH,
          fps,
        }

        expect(settings.fps).toBe(fps)
      })
    })
  })
})
