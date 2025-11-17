/**
 * Export System Integration Tests
 * Testes end-to-end do sistema completo de exportação
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals'
import { ExportQueueManager } from '../lib/export/export-queue'
import { StorageManager } from '../lib/export/storage-manager'
import { FFmpegRenderer } from '../lib/export/ffmpeg-renderer'
import { ExportFormat, ExportResolution, ExportQuality, ExportStatus, ExportPhase } from '../types/export.types'
import type { ExportJob, ExportSettings, TimelineData } from '../types/export.types'
import { v4 as uuidv4 } from 'uuid'

// Mock do FFmpeg para testes
jest.mock('../lib/export/ffmpeg-renderer')

// Mock do Socket.IO
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  connected: true,
}

const mockIo = {
  to: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
}

describe('Export System Integration Tests', () => {
  let queue: ExportQueueManager
  let storage: StorageManager
  let renderer: FFmpegRenderer

  const mockTimelineData: TimelineData = {
    videoTracks: [
      {
        id: 'track-1',
        clips: [
          {
            id: 'clip-1',
            source: '/test/video1.mp4',
            startTime: 0,
            duration: 10,
          },
          {
            id: 'clip-2',
            source: '/test/video2.mp4',
            startTime: 10,
            duration: 15,
          },
        ],
      },
    ],
    audioTracks: [
      {
        id: 'audio-1',
        clips: [
          {
            id: 'audio-clip-1',
            source: '/test/audio1.mp3',
            startTime: 0,
            duration: 25,
          },
        ],
      },
    ],
  }

  // Helper para criar job
  const createJob = (userId: string, projectId: string, timelineId: string, settings: ExportSettings): ExportJob => {
    return {
      id: uuidv4(),
      userId,
      projectId,
      timelineId,
      settings,
      timelineData: mockTimelineData,
      status: ExportStatus.PENDING,
      progress: 0,
      createdAt: new Date(),
    }
  }

  beforeAll(() => {
    // Configurar mocks
    const MockFFmpegRenderer = FFmpegRenderer as jest.MockedClass<typeof FFmpegRenderer>
    MockFFmpegRenderer.prototype.renderVideo = jest.fn().mockImplementation(
      async (job: ExportJob, onProgress: (phase: ExportPhase, progress: number, message?: string) => void) => {
        // Simular progresso
        onProgress(ExportPhase.INITIALIZING, 0, 'Starting...')
        await new Promise(resolve => setTimeout(resolve, 50))
        
        onProgress(ExportPhase.PROCESSING_VIDEO, 25, 'Processing video tracks...')
        await new Promise(resolve => setTimeout(resolve, 50))
        
        onProgress(ExportPhase.PROCESSING_AUDIO, 50, 'Processing audio tracks...')
        await new Promise(resolve => setTimeout(resolve, 50))
        
        onProgress(ExportPhase.ENCODING, 75, 'Encoding final video...')
        await new Promise(resolve => setTimeout(resolve, 50))
        
        onProgress(ExportPhase.FINALIZING, 90, 'Finalizing...')
        await new Promise(resolve => setTimeout(resolve, 50))
        
        return '/tmp/output.mp4'
      }
    )
  })

  beforeEach(() => {
    // Resetar mocks
    jest.clearAllMocks()

    // Criar instâncias
    queue = new ExportQueueManager(false) // Desabilitar auto-processing para controle manual
    storage = new StorageManager({
      provider: 'local',
      local: {
        baseDir: '/tmp/exports',
      },
    })
    renderer = new FFmpegRenderer()
  })

  afterEach(() => {
    queue.stopProcessing()
  })

  afterAll(() => {
    // Cleanup final
  })

  describe('Complete Export Flow', () => {
    it('should complete full export workflow', async () => {
      // 1. Criar job
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      const job = queue.addJob('user-1', 'project-1', 'timeline-1', settings, mockTimelineData)

      expect(job.status).toBe(ExportStatus.PENDING)
      expect(job.progress).toBe(0)

      // 2. Iniciar processamento
      const processedJob = await new Promise<ExportJob>((resolve) => {
        queue.on('job:completed', (completedJob) => {
          resolve(completedJob)
        })

        // Simular worker processando
        queue.on('job:start', async (startedJob) => {
          // Renderizar vídeo (mock)
          const outputPath = await renderer.renderVideo(startedJob, (phase, progress, message) => {
            queue.updateJobProgress(startedJob.id, progress, phase, message)
          })

          // Atualizar status
          queue.updateJobStatus(startedJob.id, ExportStatus.COMPLETED, {
            outputPath,
            outputUrl: `http://localhost:3000/exports/${startedJob.id}.mp4`,
            fileSize: 1024 * 1024 * 2.5, // 2.5 MB
            duration: 25.0,
          })
        })

        // Iniciar processamento
        queue['processNextJob']()
      })

      // 3. Verificar job concluído
      expect(processedJob.status).toBe(ExportStatus.COMPLETED)
      expect(processedJob.progress).toBe(100)
      expect(processedJob.outputUrl).toBeDefined()
      expect(processedJob.fileSize).toBe(1024 * 1024 * 2.5)
      expect(processedJob.duration).toBe(25.0)
      expect(processedJob.completedAt).toBeDefined()

      // 4. Verificar que FFmpeg foi chamado
      expect(renderer.renderVideo).toHaveBeenCalledTimes(1)
    }, 10000)

    it('should handle multiple concurrent exports', async () => {
      const jobs: ExportJob[] = []

      // Criar 3 jobs
      for (let i = 1; i <= 3; i++) {
        const settings: ExportSettings = {
          format: ExportFormat.MP4,
          resolution: ExportResolution.HD_720,
          quality: ExportQuality.MEDIUM,
          fps: 30,
        }

        const job = queue.addJob(`user-${i}`, 'project-1', 'timeline-1', settings, mockTimelineData)
        jobs.push(job)
      }

      expect(jobs.length).toBe(3)
      expect(jobs.every(j => j.status === ExportStatus.PENDING)).toBe(true)

      // Verificar status da fila
      const status = queue.getQueueStatus()
      expect(status.totalJobs).toBe(3)
      expect(status.pendingJobs).toBe(3)
      expect(status.processingJobs).toBe(0)

      // Simular processamento concorrente (max 2)
      let completedCount = 0
      queue.on('job:completed', () => {
        completedCount++
      })

      // Processar jobs
      await Promise.all(
        jobs.map(async (job) => {
          queue.updateJobStatus(job.id, ExportStatus.PROCESSING)
          
          // Simular processamento
          await new Promise(resolve => setTimeout(resolve, 200))
          
          queue.updateJobStatus(job.id, ExportStatus.COMPLETED, {
            outputPath: `/tmp/${job.id}.mp4`,
            outputUrl: `http://localhost:3000/exports/${job.id}.mp4`,
            fileSize: 1024 * 1024,
            duration: 25.0,
          })
        })
      )

      // Verificar todos concluídos
      expect(completedCount).toBe(3)

      const finalStatus = queue.getQueueStatus()
      expect(finalStatus.completedJobs).toBe(3)
      expect(finalStatus.pendingJobs).toBe(0)
    }, 15000)

    it('should track progress updates in real-time', async () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      const job = queue.addJob('user-1', 'project-1', 'timeline-1', settings, mockTimelineData)

      const progressUpdates: Array<{ progress: number; phase: ExportPhase }> = []

      queue.on('job:progress', (updatedJob) => {
        progressUpdates.push({
          progress: updatedJob.progress,
          phase: updatedJob.currentPhase!,
        })
      })

      // Simular progresso
      await new Promise<void>((resolve) => {
        queue.on('job:start', async (startedJob) => {
          await renderer.renderVideo(startedJob, (phase, progress, message) => {
            queue.updateJobProgress(startedJob.id, progress, phase, message)
          })

          queue.updateJobStatus(startedJob.id, ExportStatus.COMPLETED, {
            outputPath: '/tmp/output.mp4',
            outputUrl: 'http://localhost:3000/exports/output.mp4',
            fileSize: 1024 * 1024 * 5,
            duration: 25.0,
          })

          resolve()
        })

        queue['processNextJob']()
      })

      // Verificar progresso foi atualizado
      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[0].progress).toBe(0)
      expect(progressUpdates[0].phase).toBe(ExportPhase.INITIALIZING)

      // Verificar todas as fases
      const phases = progressUpdates.map(u => u.phase)
      expect(phases).toContain(ExportPhase.INITIALIZING)
      expect(phases).toContain(ExportPhase.PROCESSING_VIDEO)
      expect(phases).toContain(ExportPhase.PROCESSING_AUDIO)
      expect(phases).toContain(ExportPhase.ENCODING)
      expect(phases).toContain(ExportPhase.FINALIZING)
    }, 10000)
  })

  describe('Error Handling', () => {
    it('should handle rendering errors gracefully', async () => {
      // Mock FFmpeg para falhar
      const MockFFmpegRenderer = FFmpegRenderer as jest.MockedClass<typeof FFmpegRenderer>
      MockFFmpegRenderer.prototype.renderVideo = jest.fn().mockRejectedValue(
        new Error('FFmpeg encoding failed')
      )

      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      const job = queue.addJob('user-1', 'project-1', 'timeline-1', settings, mockTimelineData)

      await new Promise<void>((resolve) => {
        queue.on('job:updated', (updatedJob) => {
          if (updatedJob.status === ExportStatus.FAILED) {
            expect(updatedJob.error).toBe('FFmpeg encoding failed')
            expect(updatedJob.failedAt).toBeDefined()
            resolve()
          }
        })

        queue.on('job:start', async (startedJob) => {
          try {
            await renderer.renderVideo(startedJob, () => {});
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'FFmpeg encoding failed';
            queue.updateJobStatus(startedJob.id, ExportStatus.FAILED, {
              error: errorMessage,
            });
          }
        });

        queue['processNextJob']()
      })
    }, 10000)

    it('should handle job cancellation', async () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      const job = queue.addJob('user-1', 'project-1', 'timeline-1', settings, mockTimelineData)

      // Atualizar para processando
      queue.updateJobStatus(job.id, ExportStatus.PROCESSING)

      // Cancelar job
      const cancelled = queue.cancelJob(job.id)

      expect(cancelled).toBe(true)

      const cancelledJob = queue.getJob(job.id)
      expect(cancelledJob?.status).toBe(ExportStatus.CANCELLED)
      expect(cancelledJob?.cancelledAt).toBeDefined()
    })

    it('should not cancel completed jobs', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      const job = queue.addJob('user-1', 'project-1', 'timeline-1', settings, mockTimelineData)

      // Completar job
      queue.updateJobStatus(job.id, ExportStatus.COMPLETED, {
        outputPath: '/tmp/output.mp4',
        outputUrl: 'http://localhost:3000/exports/output.mp4',
        fileSize: 1024 * 1024,
        duration: 25.0,
      })

      // Tentar cancelar
      const cancelled = queue.cancelJob(job.id)

      expect(cancelled).toBe(false)

      const completedJob = queue.getJob(job.id)
      expect(completedJob?.status).toBe(ExportStatus.COMPLETED)
    })
  })

  describe('Storage Integration', () => {
    it('should store exported file locally', async () => {
      const buffer = Buffer.from('fake video data')
      const jobId = 'test-job-123'
      const filename = `${jobId}.mp4`

      const result = await storage.uploadFile(buffer, filename, 'video/mp4')

      expect(result.url).toBeDefined()
      expect(result.path).toContain(filename)
      expect(result.size).toBe(buffer.length)
    })

    it('should determine correct content type', () => {
      // Test private method via interface extension
      interface StorageWithContentType {
        getContentType(filename: string): string;
      }
      const storageWithMethod = storage as unknown as StorageWithContentType;
      
      expect(storageWithMethod.getContentType('video.mp4')).toBe('video/mp4');
      expect(storageWithMethod.getContentType('video.webm')).toBe('video/webm');
      expect(storageWithMethod.getContentType('video.mov')).toBe('video/quicktime');
      expect(storageWithMethod.getContentType('unknown.xyz')).toBe('application/octet-stream');
    });
  })

  describe('Queue Statistics', () => {
    it('should calculate accurate statistics', async () => {
      // Criar múltiplos jobs
      for (let i = 1; i <= 5; i++) {
        const settings: ExportSettings = {
          format: ExportFormat.MP4,
          resolution: ExportResolution.HD_720,
          quality: ExportQuality.MEDIUM,
          fps: 30,
        }

        const job = queue.addJob(`user-${i}`, 'project-1', 'timeline-1', settings, mockTimelineData)

        // Simular processamento
        queue.updateJobStatus(job.id, ExportStatus.PROCESSING)
        await new Promise(resolve => setTimeout(resolve, 50))

        queue.updateJobStatus(job.id, ExportStatus.COMPLETED, {
          outputPath: `/tmp/${job.id}.mp4`,
          outputUrl: `http://localhost:3000/exports/${job.id}.mp4`,
          fileSize: 1024 * 1024 * (i + 1), // Tamanho variável
          duration: 20 + i, // Duração variável
        })
      }

      const stats = queue.getStatistics()

      expect(stats.totalJobs).toBe(5)
      expect(stats.completedJobs).toBe(5)
      expect(stats.failedJobs).toBe(0)
      expect(stats.cancelledJobs).toBe(0)
      expect(stats.averageDuration).toBeGreaterThan(0)
      expect(stats.totalDuration).toBeGreaterThan(0)
    }, 10000)
  })

  describe('User & Project Filtering', () => {
    it('should get jobs by user', () => {
      // Criar jobs para diferentes usuários
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      queue.addJob('user-1', 'project-1', 'timeline-1', settings, mockTimelineData)
      queue.addJob('user-1', 'project-2', 'timeline-2', settings, mockTimelineData)
      queue.addJob('user-2', 'project-3', 'timeline-3', settings, mockTimelineData)

      const user1Jobs = queue.getUserJobs('user-1')
      const user2Jobs = queue.getUserJobs('user-2')

      expect(user1Jobs.length).toBe(2)
      expect(user2Jobs.length).toBe(1)
      expect(user1Jobs.every(j => j.userId === 'user-1')).toBe(true)
      expect(user2Jobs.every(j => j.userId === 'user-2')).toBe(true)
    })

    it('should get jobs by project', () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      queue.addJob('user-1', 'project-1', 'timeline-1', settings, mockTimelineData)
      queue.addJob('user-2', 'project-1', 'timeline-2', settings, mockTimelineData)
      queue.addJob('user-1', 'project-2', 'timeline-3', settings, mockTimelineData)

      const project1Jobs = queue.getProjectJobs('project-1')
      const project2Jobs = queue.getProjectJobs('project-2')

      expect(project1Jobs.length).toBe(2)
      expect(project2Jobs.length).toBe(1)
      expect(project1Jobs.every(j => j.projectId === 'project-1')).toBe(true)
      expect(project2Jobs.every(j => j.projectId === 'project-2')).toBe(true)
    })
  })

  describe('WebSocket Events', () => {
    it('should emit progress events via WebSocket', async () => {
      const settings: ExportSettings = {
        format: ExportFormat.MP4,
        resolution: ExportResolution.HD_720,
        quality: ExportQuality.HIGH,
        fps: 30,
      }

      const job = queue.addJob('user-1', 'project-1', 'timeline-1', settings, mockTimelineData)

      // Capturar eventos emitidos
      interface EmittedEvent {
        event: string;
        data: {
          jobId: string;
          progress: number;
          currentPhase?: string;
          message?: string;
        };
      }
      const emittedEvents: EmittedEvent[] = [];

      queue.on('job:progress', (updatedJob) => {
        // Simular emissão WebSocket
        emittedEvents.push({
          event: 'export:progress',
          data: {
            jobId: updatedJob.id,
            progress: updatedJob.progress,
            currentPhase: updatedJob.currentPhase,
            message: updatedJob.message,
          },
        })
      })

      queue.on('job:completed', (completedJob) => {
        emittedEvents.push({
          event: 'export:complete',
          data: {
            jobId: completedJob.id,
            outputUrl: completedJob.outputUrl,
            fileSize: completedJob.fileSize,
            duration: completedJob.duration,
          },
        })
      })

      // Simular progresso
      await new Promise<void>((resolve) => {
        queue.on('job:start', async (startedJob) => {
          await renderer.renderVideo(startedJob, (phase, progress, message) => {
            queue.updateJobProgress(startedJob.id, progress, phase, message)
          })

          queue.updateJobStatus(startedJob.id, ExportStatus.COMPLETED, {
            outputPath: '/tmp/output.mp4',
            outputUrl: 'http://localhost:3000/exports/output.mp4',
            fileSize: 1024 * 1024 * 2,
            duration: 25.0,
          })

          resolve()
        })

        queue['processNextJob']()
      })

      // Verificar eventos emitidos
      expect(emittedEvents.length).toBeGreaterThan(0)

      const progressEvents = emittedEvents.filter(e => e.event === 'export:progress')
      const completeEvents = emittedEvents.filter(e => e.event === 'export:complete')

      expect(progressEvents.length).toBeGreaterThan(0)
      expect(completeEvents.length).toBe(1)

      const lastProgress = progressEvents[progressEvents.length - 1]
      expect(lastProgress.data.progress).toBeGreaterThan(0)

      const complete = completeEvents[0]
      expect(complete.data.outputUrl).toBeDefined()
      expect(complete.data.fileSize).toBeGreaterThan(0)
    }, 10000)
  })

  describe('Performance', () => {
    it('should handle high-volume job creation', () => {
      const startTime = Date.now()

      // Criar 100 jobs
      for (let i = 1; i <= 100; i++) {
        const settings: ExportSettings = {
          format: ExportFormat.MP4,
          resolution: ExportResolution.HD_720,
          quality: ExportQuality.MEDIUM,
          fps: 30,
        }

        queue.addJob(`user-${i % 10}`, `project-${i % 5}`, `timeline-${i}`, settings, mockTimelineData)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      const status = queue.getQueueStatus()
      expect(status.totalJobs).toBe(100)
      expect(duration).toBeLessThan(1000) // Menos de 1 segundo para criar 100 jobs
    })

    it('should efficiently retrieve jobs by filters', () => {
      // Criar 50 jobs
      for (let i = 1; i <= 50; i++) {
        const settings: ExportSettings = {
          format: ExportFormat.MP4,
          resolution: ExportResolution.HD_720,
          quality: ExportQuality.MEDIUM,
          fps: 30,
        }

        queue.addJob(`user-${i % 5}`, `project-${i % 10}`, `timeline-${i}`, settings, mockTimelineData)
      }

      const startTime = Date.now()

      // Executar múltiplas consultas
      queue.getUserJobs('user-1')
      queue.getUserJobs('user-2')
      queue.getProjectJobs('project-1')
      queue.getProjectJobs('project-2')
      queue.getStatistics()

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100) // Menos de 100ms para todas as consultas
    })
  })
})
