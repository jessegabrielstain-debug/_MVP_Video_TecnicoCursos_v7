/**
 * Export System Unit Tests
 * Testa fila, API endpoints e storage manager
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { ExportQueueManager } from '@/lib/export/export-queue'
import { StorageManager } from '@/lib/export/storage-manager'
import {
  ExportJob,
  ExportStatus,
  ExportFormat,
  ExportResolution,
  ExportQuality,
  ExportPhase,
} from '@/types/export.types'

describe('ExportQueueManager', () => {
  let queue: ExportQueueManager

  beforeEach(() => {
    queue = new ExportQueueManager(false) // Desabilitar auto-processing nos testes
  })

  afterEach(() => {
    queue.stopProcessing() // Limpar interval
  })

  describe('Job Management', () => {
    it('should add job to queue', () => {
      const job: ExportJob = {
        id: 'test-job-1',
        userId: 'user-1',
        projectId: 'project-1',
        timelineId: 'timeline-1',
        status: ExportStatus.PENDING,
        progress: 0,
        settings: {
          format: ExportFormat.MP4,
          resolution: ExportResolution.FULL_HD_1080,
          quality: ExportQuality.HIGH,
          fps: 30,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      queue.addJob(job)
      const retrieved = queue.getJob('test-job-1')

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('test-job-1')
      expect(retrieved?.status).toBe(ExportStatus.PENDING)
    })

    it('should update job status', () => {
      const job: ExportJob = {
        id: 'test-job-2',
        userId: 'user-1',
        projectId: 'project-1',
        timelineId: 'timeline-1',
        status: ExportStatus.PENDING,
        progress: 0,
        settings: {
          format: ExportFormat.MP4,
          resolution: ExportResolution.HD_720,
          quality: ExportQuality.MEDIUM,
          fps: 30,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      queue.addJob(job)
      queue.updateJobStatus('test-job-2', ExportStatus.PROCESSING)

      const updated = queue.getJob('test-job-2')
      expect(updated?.status).toBe(ExportStatus.PROCESSING)
      expect(updated?.startedAt).toBeDefined()
    })

    it('should update job progress', () => {
      const job: ExportJob = {
        id: 'test-job-3',
        userId: 'user-1',
        projectId: 'project-1',
        timelineId: 'timeline-1',
        status: ExportStatus.PROCESSING,
        progress: 0,
        settings: {
          format: ExportFormat.WEBM,
          resolution: ExportResolution.FULL_HD_1080,
          quality: ExportQuality.HIGH,
          fps: 30,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      queue.addJob(job)

      const progressListener = jest.fn()
      queue.on('job:progress', progressListener)

      queue.updateJobProgress('test-job-3', 50, ExportPhase.ENCODING, 'Encoding video...', 120)

      expect(progressListener).toHaveBeenCalled()
      const updated = queue.getJob('test-job-3')
      expect(updated?.progress).toBe(50)
    })

    it('should cancel job', () => {
      const job: ExportJob = {
        id: 'test-job-4',
        userId: 'user-1',
        projectId: 'project-1',
        timelineId: 'timeline-1',
        status: ExportStatus.PENDING,
        progress: 0,
        settings: {
          format: ExportFormat.MP4,
          resolution: ExportResolution.HD_720,
          quality: ExportQuality.LOW,
          fps: 24,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      queue.addJob(job)
      const cancelled = queue.cancelJob('test-job-4')

      expect(cancelled).toBe(true)
      const updated = queue.getJob('test-job-4')
      expect(updated?.status).toBe(ExportStatus.CANCELLED)
    })

    it('should not cancel completed job', () => {
      const job: ExportJob = {
        id: 'test-job-5',
        userId: 'user-1',
        projectId: 'project-1',
        timelineId: 'timeline-1',
        status: ExportStatus.COMPLETED,
        progress: 100,
        settings: {
          format: ExportFormat.MP4,
          resolution: ExportResolution.FULL_HD_1080,
          quality: ExportQuality.ULTRA,
          fps: 60,
          includeWatermark: true,
        },
        createdAt: new Date(),
        outputUrl: '/exports/user-1/video.mp4',
      }

      queue.addJob(job)
      const cancelled = queue.cancelJob('test-job-5')

      expect(cancelled).toBe(false)
    })
  })

  describe('Queue Operations', () => {
    it('should get queue status', () => {
      const job1: ExportJob = {
        id: 'job-1',
        userId: 'user-1',
        projectId: 'project-1',
        timelineId: 'timeline-1',
        status: ExportStatus.PENDING,
        progress: 0,
        settings: {
          format: ExportFormat.MP4,
          resolution: ExportResolution.HD_720,
          quality: ExportQuality.MEDIUM,
          fps: 30,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      const job2: ExportJob = {
        id: 'job-2',
        userId: 'user-1',
        projectId: 'project-2',
        timelineId: 'timeline-2',
        status: ExportStatus.PROCESSING,
        progress: 50,
        settings: {
          format: ExportFormat.WEBM,
          resolution: ExportResolution.FULL_HD_1080,
          quality: ExportQuality.HIGH,
          fps: 30,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      queue.addJob(job1)
      queue.addJob(job2)

      const status = queue.getQueueStatus()

      expect(status.totalJobs).toBe(2)
      expect(status.pendingJobs).toBe(1)
      expect(status.processingJobs).toBe(1)
    })

    it('should get user jobs', () => {
      const job1: ExportJob = {
        id: 'job-1',
        userId: 'user-1',
        projectId: 'project-1',
        timelineId: 'timeline-1',
        status: ExportStatus.PENDING,
        progress: 0,
        settings: {
          format: ExportFormat.MP4,
          resolution: ExportResolution.HD_720,
          quality: ExportQuality.MEDIUM,
          fps: 30,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      const job2: ExportJob = {
        id: 'job-2',
        userId: 'user-2',
        projectId: 'project-2',
        timelineId: 'timeline-2',
        status: ExportStatus.PENDING,
        progress: 0,
        settings: {
          format: ExportFormat.WEBM,
          resolution: ExportResolution.FULL_HD_1080,
          quality: ExportQuality.HIGH,
          fps: 30,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      queue.addJob(job1)
      queue.addJob(job2)

      const userJobs = queue.getUserJobs('user-1')

      expect(userJobs.length).toBe(1)
      expect(userJobs[0].userId).toBe('user-1')
    })

    it('should get project jobs', () => {
      const job1: ExportJob = {
        id: 'job-1',
        userId: 'user-1',
        projectId: 'project-1',
        timelineId: 'timeline-1',
        status: ExportStatus.PENDING,
        progress: 0,
        settings: {
          format: ExportFormat.MP4,
          resolution: ExportResolution.HD_720,
          quality: ExportQuality.MEDIUM,
          fps: 30,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      const job2: ExportJob = {
        id: 'job-2',
        userId: 'user-1',
        projectId: 'project-1',
        timelineId: 'timeline-2',
        status: ExportStatus.PENDING,
        progress: 0,
        settings: {
          format: ExportFormat.WEBM,
          resolution: ExportResolution.FULL_HD_1080,
          quality: ExportQuality.HIGH,
          fps: 30,
          includeWatermark: false,
        },
        createdAt: new Date(),
      }

      queue.addJob(job1)
      queue.addJob(job2)

      const projectJobs = queue.getProjectJobs('project-1')

      expect(projectJobs.length).toBe(2)
      expect(projectJobs[0].projectId).toBe('project-1')
    })
  })

  describe('Statistics', () => {
    it('should calculate statistics', () => {
      const stats = queue.getStatistics()

      expect(stats).toHaveProperty('totalJobs')
      expect(stats).toHaveProperty('queueSize')
      expect(stats).toHaveProperty('processing')
      expect(stats).toHaveProperty('averageDuration')
      expect(stats).toHaveProperty('maxConcurrent')
    })
  })
})

describe('StorageManager', () => {
  describe('Local Storage', () => {
    it('should create storage manager with local config', () => {
      const storage = new StorageManager({
        provider: 'local',
        localPath: '/tmp/test-exports',
      })

      expect(storage).toBeDefined()
    })

    it('should determine correct content type', () => {
      const storage = new StorageManager({ provider: 'local' })

      // Access private method via any (for testing only)
      const getContentType = (storage as any).getContentType.bind(storage)

      expect(getContentType('video.mp4')).toBe('video/mp4')
      expect(getContentType('video.webm')).toBe('video/webm')
      expect(getContentType('video.mov')).toBe('video/quicktime')
    })
  })

  describe('Supabase Storage', () => {
    it('should create storage manager with supabase config', () => {
      const storage = new StorageManager({
        provider: 'supabase',
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'test-key',
      })

      expect(storage).toBeDefined()
    })

    it('should fallback to local if supabase config missing', () => {
      const storage = new StorageManager({
        provider: 'supabase',
        // Missing URL and key
      })

      expect(storage).toBeDefined()
    })
  })
})
