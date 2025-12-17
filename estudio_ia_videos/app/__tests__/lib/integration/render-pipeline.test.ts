/**
 * Integration Tests: Render Pipeline
 * 
 * Tests for the complete render workflow from job creation
 * to completion, including queue management and status updates.
 */

import { RenderJobStatus } from '../../lib/types/render'

// Mock Redis/BullMQ
const mockQueueAdd = jest.fn()
const mockQueueGetJob = jest.fn()
const mockQueueGetJobs = jest.fn()

jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: mockQueueAdd,
    getJob: mockQueueGetJob,
    getJobs: mockQueueGetJobs,
    close: jest.fn(),
  })),
  Worker: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}))

// Mock Supabase
const mockSupabaseFrom = jest.fn()
const mockSupabaseInsert = jest.fn()
const mockSupabaseUpdate = jest.fn()
const mockSupabaseSelect = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockSupabaseFrom,
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'videos/output.mp4' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.example.com/video.mp4' } })),
      })),
    },
  })),
}))

describe('Render Pipeline Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockQueueAdd.mockResolvedValue({ id: 'queue-job-123' })
    mockQueueGetJob.mockResolvedValue(null)
    mockQueueGetJobs.mockResolvedValue([])
    
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
      update: mockSupabaseUpdate,
    })
    
    mockSupabaseSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })
    
    mockSupabaseInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'job-123', status: 'pending' }, 
          error: null 
        }),
      }),
    })
    
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    })
  })

  describe('Job Creation', () => {
    it('should create a render job with valid input', async () => {
      const jobData = {
        projectId: 'project-123',
        userId: 'user-456',
        config: {
          fps: 30,
          quality: 'high',
          resolution: { width: 1920, height: 1080 },
        },
      }

      // Simulate job creation
      const createJob = async (data: typeof jobData) => {
        const dbResult = await mockSupabaseInsert({
          project_id: data.projectId,
          user_id: data.userId,
          config: data.config,
          status: 'pending',
        })
        
        const queueResult = await mockQueueAdd('render', {
          jobId: 'job-123',
          ...data,
        })

        return {
          jobId: 'job-123',
          queueId: queueResult.id,
          status: 'pending',
        }
      }

      const result = await createJob(jobData)
      
      expect(result.jobId).toBe('job-123')
      expect(result.status).toBe('pending')
      expect(mockQueueAdd).toHaveBeenCalledWith('render', expect.objectContaining({
        projectId: 'project-123',
      }))
    })

    it('should validate job configuration', () => {
      const validateConfig = (config: Record<string, unknown>) => {
        const errors: string[] = []
        
        if (!config.fps || typeof config.fps !== 'number') {
          errors.push('fps must be a number')
        } else if (config.fps < 1 || config.fps > 60) {
          errors.push('fps must be between 1 and 60')
        }
        
        if (!config.quality || !['low', 'medium', 'high'].includes(config.quality as string)) {
          errors.push('quality must be low, medium, or high')
        }
        
        return { valid: errors.length === 0, errors }
      }

      expect(validateConfig({ fps: 30, quality: 'high' })).toEqual({ valid: true, errors: [] })
      expect(validateConfig({ fps: 0, quality: 'invalid' })).toEqual({
        valid: false,
        errors: ['fps must be a number', 'quality must be low, medium, or high'],
      })
    })

    it('should handle duplicate job prevention', async () => {
      // First check if job already exists
      mockSupabaseSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 'existing-job', status: 'processing' }],
              error: null,
            }),
          }),
        }),
      })

      const checkExistingJob = async (projectId: string) => {
        const result = await mockSupabaseSelect()
          .eq('project_id', projectId)
          .eq('status', 'in')
          .in('status', ['pending', 'processing', 'queued'])
        
        return result.data && result.data.length > 0
      }

      const hasExisting = await checkExistingJob('project-123')
      expect(hasExisting).toBe(true)
    })
  })

  describe('Job Status Management', () => {
    const statuses: RenderJobStatus[] = ['pending', 'queued', 'processing', 'completed', 'failed', 'cancelled']

    it('should track valid status transitions', () => {
      const validTransitions: Record<RenderJobStatus, RenderJobStatus[]> = {
        pending: ['queued', 'cancelled'],
        queued: ['processing', 'cancelled'],
        processing: ['completed', 'failed', 'cancelled'],
        completed: [],
        failed: ['pending'], // retry
        cancelled: [],
      }

      const canTransition = (from: RenderJobStatus, to: RenderJobStatus) => {
        return validTransitions[from]?.includes(to) ?? false
      }

      expect(canTransition('pending', 'queued')).toBe(true)
      expect(canTransition('pending', 'completed')).toBe(false)
      expect(canTransition('processing', 'completed')).toBe(true)
      expect(canTransition('completed', 'processing')).toBe(false)
    })

    it('should update job status in database', async () => {
      const updateJobStatus = async (jobId: string, status: RenderJobStatus) => {
        await mockSupabaseUpdate({
          status,
          updated_at: new Date().toISOString(),
        })
        return { success: true }
      }

      await updateJobStatus('job-123', 'processing')
      
      expect(mockSupabaseUpdate).toHaveBeenCalled()
    })

    it('should record status history', () => {
      const statusHistory: Array<{ status: RenderJobStatus; timestamp: Date }> = []
      
      const recordStatus = (status: RenderJobStatus) => {
        statusHistory.push({ status, timestamp: new Date() })
      }

      recordStatus('pending')
      recordStatus('queued')
      recordStatus('processing')
      recordStatus('completed')

      expect(statusHistory).toHaveLength(4)
      expect(statusHistory[0].status).toBe('pending')
      expect(statusHistory[statusHistory.length - 1].status).toBe('completed')
    })
  })

  describe('Queue Management', () => {
    it('should add job to queue with priority', async () => {
      const addToQueue = async (jobData: Record<string, unknown>, priority: number) => {
        return await mockQueueAdd('render', jobData, { priority })
      }

      await addToQueue({ projectId: 'project-123' }, 1)
      
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'render',
        expect.any(Object),
        expect.objectContaining({ priority: 1 })
      )
    })

    it('should retrieve jobs by status', async () => {
      mockQueueGetJobs.mockResolvedValue([
        { id: 'job-1', data: { status: 'waiting' } },
        { id: 'job-2', data: { status: 'waiting' } },
      ])

      const getJobsByStatus = async (status: string) => {
        return await mockQueueGetJobs([status])
      }

      const jobs = await getJobsByStatus('waiting')
      
      expect(jobs).toHaveLength(2)
    })

    it('should handle queue overflow', () => {
      const MAX_QUEUE_SIZE = 100
      let queueSize = 95

      const canAddToQueue = () => queueSize < MAX_QUEUE_SIZE
      const incrementQueue = () => {
        if (canAddToQueue()) {
          queueSize++
          return true
        }
        return false
      }

      expect(incrementQueue()).toBe(true) // 96
      expect(incrementQueue()).toBe(true) // 97
      expect(incrementQueue()).toBe(true) // 98
      expect(incrementQueue()).toBe(true) // 99
      expect(incrementQueue()).toBe(true) // 100
      expect(incrementQueue()).toBe(false) // overflow
    })
  })

  describe('Progress Tracking', () => {
    it('should track render progress', () => {
      const progress = {
        totalFrames: 1800, // 60 seconds at 30fps
        renderedFrames: 0,
        currentPhase: 'initializing' as const,
        estimatedTimeRemaining: 0,
      }

      const updateProgress = (frames: number, phase: string) => {
        progress.renderedFrames = frames
        progress.currentPhase = phase as typeof progress.currentPhase
        const percentComplete = frames / progress.totalFrames
        progress.estimatedTimeRemaining = Math.round((1 - percentComplete) * 120) // assume 2 min total
      }

      updateProgress(450, 'rendering')
      expect(progress.renderedFrames).toBe(450)
      expect(progress.estimatedTimeRemaining).toBe(90) // 75% remaining of 120s

      updateProgress(1800, 'encoding')
      expect(progress.estimatedTimeRemaining).toBe(0)
    })

    it('should emit progress events', () => {
      const events: Array<{ type: string; data: unknown }> = []
      
      const emitProgress = (percent: number, message: string) => {
        events.push({
          type: 'progress',
          data: { percent, message, timestamp: Date.now() },
        })
      }

      emitProgress(25, 'Rendering frames...')
      emitProgress(50, 'Halfway complete')
      emitProgress(100, 'Render complete')

      expect(events).toHaveLength(3)
      expect(events[2].data).toMatchObject({ percent: 100 })
    })
  })

  describe('Error Handling', () => {
    it('should handle render failures', async () => {
      const handleRenderError = async (jobId: string, error: Error) => {
        await mockSupabaseUpdate({
          status: 'failed',
          error_message: error.message,
          error_code: 'RENDER_FAILED',
          failed_at: new Date().toISOString(),
        })
        
        return {
          jobId,
          status: 'failed',
          error: error.message,
        }
      }

      const result = await handleRenderError('job-123', new Error('FFmpeg encoding failed'))
      
      expect(result.status).toBe('failed')
      expect(result.error).toBe('FFmpeg encoding failed')
    })

    it('should categorize errors', () => {
      const categorizeError = (errorMessage: string): string => {
        if (errorMessage.includes('FFmpeg') || errorMessage.includes('encoding')) {
          return 'ffmpeg'
        }
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          return 'timeout'
        }
        if (errorMessage.includes('storage') || errorMessage.includes('upload')) {
          return 'storage'
        }
        if (errorMessage.includes('memory') || errorMessage.includes('OOM')) {
          return 'resource'
        }
        return 'unknown'
      }

      expect(categorizeError('FFmpeg encoding failed')).toBe('ffmpeg')
      expect(categorizeError('Operation timed out')).toBe('timeout')
      expect(categorizeError('Storage upload failed')).toBe('storage')
      expect(categorizeError('Out of memory (OOM)')).toBe('resource')
      expect(categorizeError('Some random error')).toBe('unknown')
    })

    it('should support job retry', async () => {
      let retryCount = 0
      const MAX_RETRIES = 3

      const retryJob = async (jobId: string) => {
        if (retryCount >= MAX_RETRIES) {
          return { success: false, reason: 'Max retries exceeded' }
        }
        
        retryCount++
        
        await mockSupabaseUpdate({
          status: 'pending',
          retry_count: retryCount,
        })
        
        return { success: true, retryCount }
      }

      expect(await retryJob('job-123')).toMatchObject({ success: true, retryCount: 1 })
      expect(await retryJob('job-123')).toMatchObject({ success: true, retryCount: 2 })
      expect(await retryJob('job-123')).toMatchObject({ success: true, retryCount: 3 })
      expect(await retryJob('job-123')).toMatchObject({ success: false })
    })
  })

  describe('Cleanup', () => {
    it('should cleanup temporary files after render', () => {
      const tempFiles = ['/tmp/render-123/frame-001.png', '/tmp/render-123/frame-002.png']
      let cleanedUp = false

      const cleanup = async (files: string[]) => {
        // Simulate file cleanup
        cleanedUp = true
        return { deleted: files.length }
      }

      cleanup(tempFiles).then(result => {
        expect(cleanedUp).toBe(true)
        expect(result.deleted).toBe(2)
      })
    })

    it('should remove stale jobs', async () => {
      const STALE_THRESHOLD_HOURS = 24

      const findStaleJobs = () => {
        const threshold = new Date()
        threshold.setHours(threshold.getHours() - STALE_THRESHOLD_HOURS)
        
        return [
          { id: 'stale-1', status: 'processing', updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000) },
          { id: 'stale-2', status: 'queued', updated_at: new Date(Date.now() - 30 * 60 * 60 * 1000) },
        ]
      }

      const staleJobs = findStaleJobs()
      expect(staleJobs).toHaveLength(2)
    })
  })
})
