/**
 * Tests for app/lib/queue/types.ts
 * Queue type definitions and type guards
 */

import type {
  JobStatus,
  JobPriority,
  RenderSlide,
  SlideTransition,
  SlideElement,
  RenderConfig,
  RenderSettings,
  RenderTaskPayload,
  RenderTaskResult,
  RenderMetadata,
  JobOptions,
  QueueJob,
  JobResult,
  QueueConfig,
  QueueMetrics,
  JobProcessor,
} from '../../../lib/queue/types'

describe('Queue Types Module', () => {
  describe('JobStatus Type', () => {
    it('should accept valid job statuses', () => {
      const statuses: JobStatus[] = [
        'pending',
        'queued',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'retrying',
      ]
      
      expect(statuses).toHaveLength(7)
      statuses.forEach(status => {
        expect(typeof status).toBe('string')
      })
    })
  })

  describe('JobPriority Type', () => {
    it('should accept valid priorities', () => {
      const priorities: JobPriority[] = ['low', 'normal', 'high']
      
      expect(priorities).toHaveLength(3)
    })
  })

  describe('RenderSlide Interface', () => {
    it('should create valid render slide', () => {
      const slide: RenderSlide = {
        id: 'slide-1',
        order_index: 0,
        title: 'Introduction',
        content: 'Welcome to the presentation',
        notes: 'Speaker notes here',
        background_color: '#ffffff',
        duration_ms: 5000,
      }
      
      expect(slide.id).toBe('slide-1')
      expect(slide.order_index).toBe(0)
      expect(slide.title).toBe('Introduction')
    })

    it('should allow minimal slide with only required fields', () => {
      const minimalSlide: RenderSlide = {
        id: 'slide-min',
        order_index: 1,
      }
      
      expect(minimalSlide.id).toBe('slide-min')
      expect(minimalSlide.title).toBeUndefined()
    })

    it('should include slide elements', () => {
      const slideWithElements: RenderSlide = {
        id: 'slide-elements',
        order_index: 0,
        elements: [
          {
            id: 'elem-1',
            type: 'text',
            x: 100,
            y: 200,
            width: 400,
            height: 50,
            content: 'Hello World',
          },
          {
            id: 'elem-2',
            type: 'image',
            x: 100,
            y: 300,
            width: 200,
            height: 200,
            src: 'https://example.com/image.png',
          },
        ],
      }
      
      expect(slideWithElements.elements).toHaveLength(2)
      expect(slideWithElements.elements![0].type).toBe('text')
      expect(slideWithElements.elements![1].type).toBe('image')
    })

    it('should include transition settings', () => {
      const slideWithTransition: RenderSlide = {
        id: 'slide-transition',
        order_index: 0,
        transition: {
          type: 'fade',
          duration_ms: 500,
        },
      }
      
      expect(slideWithTransition.transition?.type).toBe('fade')
      expect(slideWithTransition.transition?.duration_ms).toBe(500)
    })
  })

  describe('SlideTransition Interface', () => {
    it('should accept all transition types', () => {
      const transitions: SlideTransition[] = [
        { type: 'none', duration_ms: 0 },
        { type: 'fade', duration_ms: 500 },
        { type: 'slide', duration_ms: 300 },
        { type: 'zoom', duration_ms: 400 },
        { type: 'dissolve', duration_ms: 600 },
      ]
      
      expect(transitions).toHaveLength(5)
    })
  })

  describe('SlideElement Interface', () => {
    it('should accept all element types', () => {
      const baseElement = { id: 'e1', x: 0, y: 0, width: 100, height: 100 }
      
      const elements: SlideElement[] = [
        { ...baseElement, type: 'text', content: 'Hello' },
        { ...baseElement, type: 'image', src: '/img.png' },
        { ...baseElement, type: 'video', src: '/vid.mp4' },
        { ...baseElement, type: 'shape' },
        { ...baseElement, type: 'chart' },
      ]
      
      expect(elements).toHaveLength(5)
    })

    it('should support style property', () => {
      const styledElement: SlideElement = {
        id: 'styled',
        type: 'text',
        x: 0,
        y: 0,
        width: 200,
        height: 50,
        style: {
          fontSize: 24,
          color: '#000000',
          fontWeight: 'bold',
        },
      }
      
      expect(styledElement.style?.fontSize).toBe(24)
      expect(styledElement.style?.color).toBe('#000000')
    })
  })

  describe('RenderConfig Interface', () => {
    it('should create render config with defaults', () => {
      const config: RenderConfig = {}
      
      expect(config.width).toBeUndefined()
      expect(config.height).toBeUndefined()
    })

    it('should create full render config', () => {
      const config: RenderConfig = {
        width: 1920,
        height: 1080,
        fps: 30,
        quality: 'high',
        format: 'mp4',
        codec: 'h264',
        bitrate: '5000k',
        audioCodec: 'aac',
        audioBitrate: '192k',
        test: false,
      }
      
      expect(config.width).toBe(1920)
      expect(config.fps).toBe(30)
      expect(config.quality).toBe('high')
    })

    it('should accept all quality levels', () => {
      const qualities: RenderConfig['quality'][] = ['low', 'medium', 'high', 'ultra']
      
      qualities.forEach(quality => {
        const config: RenderConfig = { quality }
        expect(config.quality).toBe(quality)
      })
    })

    it('should accept all format types', () => {
      const formats: RenderConfig['format'][] = ['mp4', 'webm', 'mov']
      
      formats.forEach(format => {
        const config: RenderConfig = { format }
        expect(config.format).toBe(format)
      })
    })
  })

  describe('RenderSettings Interface', () => {
    it('should accept resolution presets', () => {
      const resolutions: RenderSettings['resolution'][] = ['720p', '1080p', '4k']
      
      resolutions.forEach(resolution => {
        const settings: RenderSettings = { resolution }
        expect(settings.resolution).toBe(resolution)
      })
    })

    it('should create complete settings', () => {
      const settings: RenderSettings = {
        resolution: '1080p',
        fps: 60,
        quality: 'ultra',
        format: 'mov',
        audio_bitrate: 320,
        video_bitrate: 8000,
      }
      
      expect(settings.resolution).toBe('1080p')
      expect(settings.fps).toBe(60)
      expect(settings.video_bitrate).toBe(8000)
    })
  })

  describe('RenderTaskPayload Interface', () => {
    it('should create minimal payload', () => {
      const payload: RenderTaskPayload = {
        projectId: 'proj-123',
        userId: 'user-456',
      }
      
      expect(payload.projectId).toBe('proj-123')
      expect(payload.userId).toBe('user-456')
    })

    it('should create full payload', () => {
      const payload: RenderTaskPayload = {
        projectId: 'proj-123',
        userId: 'user-456',
        jobId: 'job-789',
        slides: [
          { id: 's1', order_index: 0 },
          { id: 's2', order_index: 1 },
        ],
        config: { fps: 30, quality: 'high' },
        settings: { resolution: '1080p' },
        webhookUrl: 'https://example.com/webhook',
      }
      
      expect(payload.slides).toHaveLength(2)
      expect(payload.webhookUrl).toBe('https://example.com/webhook')
    })
  })

  describe('RenderTaskResult Interface', () => {
    it('should create result with output URL', () => {
      const result: RenderTaskResult = {
        jobId: 'job-123',
        outputUrl: 'https://storage.example.com/output.mp4',
      }
      
      expect(result.jobId).toBe('job-123')
      expect(result.outputUrl).toContain('output.mp4')
    })

    it('should include metadata', () => {
      const result: RenderTaskResult = {
        jobId: 'job-123',
        outputUrl: 'https://storage.example.com/output.mp4',
        durationMs: 15000,
        metadata: {
          renderTime: 45000,
          fileSize: 52428800,
          resolution: '1920x1080',
          duration: 120,
          codec: 'h264',
          slidesCount: 15,
        },
      }
      
      expect(result.metadata?.renderTime).toBe(45000)
      expect(result.metadata?.slidesCount).toBe(15)
    })
  })

  describe('JobOptions Interface', () => {
    it('should create job options', () => {
      const options: JobOptions = {
        priority: 'high',
        maxAttempts: 3,
        delay: 1000,
        timeout: 300000,
      }
      
      expect(options.priority).toBe('high')
      expect(options.maxAttempts).toBe(3)
    })

    it('should allow partial options', () => {
      const options: JobOptions = {
        priority: 'low',
      }
      
      expect(options.priority).toBe('low')
      expect(options.maxAttempts).toBeUndefined()
    })
  })

  describe('QueueJob Interface', () => {
    it('should create complete queue job', () => {
      const job: QueueJob<RenderTaskPayload> = {
        id: 'job-123',
        type: 'render',
        data: {
          projectId: 'proj-1',
          userId: 'user-1',
        },
        status: 'pending',
        priority: 'normal',
        maxAttempts: 3,
        attempts: 0,
        createdAt: new Date(),
      }
      
      expect(job.id).toBe('job-123')
      expect(job.status).toBe('pending')
      expect(job.data.projectId).toBe('proj-1')
    })

    it('should track job lifecycle', () => {
      const now = new Date()
      
      const completedJob: QueueJob = {
        id: 'job-completed',
        type: 'render',
        data: {},
        status: 'completed',
        priority: 'normal',
        maxAttempts: 3,
        attempts: 1,
        createdAt: now,
        processedAt: new Date(now.getTime() + 1000),
        completedAt: new Date(now.getTime() + 60000),
        result: {
          success: true,
          outputUrl: 'https://storage.example.com/output.mp4',
        },
      }
      
      expect(completedJob.status).toBe('completed')
      expect(completedJob.result?.success).toBe(true)
    })

    it('should track failed job', () => {
      const failedJob: QueueJob = {
        id: 'job-failed',
        type: 'render',
        data: {},
        status: 'failed',
        priority: 'normal',
        maxAttempts: 3,
        attempts: 3,
        createdAt: new Date(),
        failedAt: new Date(),
        error: 'FFmpeg encoding failed: out of memory',
        result: {
          success: false,
          error: 'FFmpeg encoding failed: out of memory',
        },
      }
      
      expect(failedJob.status).toBe('failed')
      expect(failedJob.error).toContain('FFmpeg')
    })
  })

  describe('QueueConfig Interface', () => {
    it('should create queue config', () => {
      const config: QueueConfig = {
        name: 'render-queue',
        concurrency: 4,
        timeout: 600000,
        redisUrl: 'redis://localhost:6379',
      }
      
      expect(config.name).toBe('render-queue')
      expect(config.concurrency).toBe(4)
    })

    it('should allow minimal config', () => {
      const config: QueueConfig = {
        name: 'simple-queue',
      }
      
      expect(config.name).toBe('simple-queue')
      expect(config.concurrency).toBeUndefined()
    })
  })

  describe('QueueMetrics Interface', () => {
    it('should represent queue metrics', () => {
      const metrics: QueueMetrics = {
        throughput: 100,
        successRate: 0.95,
        avgProcessingTime: 45000,
        active: 5,
        pending: 10,
        completed: 1000,
        failed: 50,
      }
      
      expect(metrics.throughput).toBe(100)
      expect(metrics.successRate).toBe(0.95)
      expect(metrics.active + metrics.pending).toBe(15)
    })
  })

  describe('JobProcessor Type', () => {
    it('should define processor function signature', async () => {
      const processor: JobProcessor<RenderTaskPayload, RenderTaskResult> = async (job) => {
        return {
          jobId: job.id,
          outputUrl: `https://storage.example.com/${job.data.projectId}/output.mp4`,
        }
      }
      
      const mockJob: QueueJob<RenderTaskPayload> = {
        id: 'test-job',
        type: 'render',
        data: { projectId: 'proj-1', userId: 'user-1' },
        status: 'processing',
        priority: 'normal',
        maxAttempts: 3,
        attempts: 1,
        createdAt: new Date(),
      }
      
      const result = await processor(mockJob)
      
      expect(result.jobId).toBe('test-job')
      expect(result.outputUrl).toContain('proj-1')
    })
  })
})
