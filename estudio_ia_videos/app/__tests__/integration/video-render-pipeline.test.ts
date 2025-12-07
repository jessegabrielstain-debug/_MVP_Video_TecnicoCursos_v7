/**
 * Testes de Integração - Pipeline Completo de Renderização
 * 
 * Testa o fluxo completo: Frame Generation → FFmpeg Encoding → Upload
 * 
 * @group integration
 * @group video-render
 */

import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// Mock Supabase
const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'videos/test.mp4' }, error: null })
const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/videos/test.mp4' } })
const mockFrom = jest.fn().mockReturnValue({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  list: jest.fn().mockResolvedValue({ data: [], error: null }),
  update: jest.fn().mockResolvedValue({ error: null }),
  remove: jest.fn().mockResolvedValue({ error: null })
})

const mockSelect = jest.fn().mockReturnThis()
const mockInsert = jest.fn().mockReturnThis()
const mockUpdate = jest.fn().mockReturnThis()
const mockDelete = jest.fn().mockReturnThis()
const mockEq = jest.fn().mockReturnThis()
const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })

const mockSupabaseClient = {
  storage: {
    from: mockFrom
  },
  from: jest.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle
  })
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => mockSupabaseClient)
}))

// Mock fetch for worker progress
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({})
})) as any

// Import classes AFTER mocks
import { VideoRenderWorker } from '@/lib/workers/video-render-worker'
import { FrameGenerator } from '@/lib/render/frame-generator'
import { FFmpegExecutor } from '@/lib/render/ffmpeg-executor'
import { VideoUploader } from '@/lib/storage/video-uploader'
import { createClient } from '@supabase/supabase-js'

describe('Video Render Pipeline Integration', () => {
  let worker: VideoRenderWorker
  let testDir: string
  
  beforeAll(() => {
    // Setup worker
    worker = new VideoRenderWorker()
    
    // Create test directory
    testDir = path.join(process.cwd(), 'tmp', 'test-render')
  })
  
  afterAll(async () => {
    // Cleanup test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true })
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('FrameGenerator', () => {
    it('should generate frames from simple slides', async () => {
      const generator = new FrameGenerator({
        width: 1280,
        height: 720,
        fps: 30,
        quality: 90
      })
      
      const slides = [
        {
          slideNumber: 1,
          frameIndex: 0,
          duration: 3,
          text: [{
            content: 'Test Slide 1\nThis is a test slide with some content.',
            position: { x: 10, y: 10, width: 80, height: 80 }
          }],
          background: '#FFFFFF'
        },
        {
          slideNumber: 2,
          frameIndex: 0,
          duration: 2,
          text: [{
            content: 'Test Slide 2\nAnother test slide.',
            position: { x: 10, y: 10, width: 80, height: 80 }
          }],
          background: '#F0F0F0'
        }
      ]
      
      const outputDir = path.join(testDir, 'frames-simple')
      
      const result = await generator.generateFrames(slides, outputDir)
      
      // 3s * 30fps + 2s * 30fps = 150 frames
      expect(result.success).toBe(true)
      expect(result.totalFrames).toBe(150)
      
      const frames = await fs.readdir(outputDir)
      expect(frames).toHaveLength(150)
      expect(frames[0]).toMatch(/frame_000000\.png$/) // 0-indexed padding 6
      
      // Verify files exist
      for (const frame of frames.slice(0, 10)) {
        expect(existsSync(path.join(outputDir, frame))).toBe(true)
      }
    }, 60000)
    
    it('should generate frames with images', async () => {
      const generator = new FrameGenerator({
        width: 1920,
        height: 1080,
        fps: 30,
        quality: 80
      })
      
      const slides = [
        {
          slideNumber: 1,
          frameIndex: 0,
          duration: 5,
          text: [{
            content: 'Slide with Image',
            position: { x: 10, y: 10, width: 80, height: 20 }
          }],
          images: [
            {
              url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              position: { x: 10, y: 30, width: 20, height: 20 }
            }
          ],
          background: '#FFFFFF'
        }
      ]
      
      const outputDir = path.join(testDir, 'frames-images')
      
      const result = await generator.generateFrames(slides, outputDir)
      
      expect(result.success).toBe(true)
      expect(result.totalFrames).toBe(150) // 5s * 30fps
      
      const frames = await fs.readdir(outputDir)
      expect(frames).toHaveLength(150)
    }, 60000)
    
    it('should track progress during generation', async () => {
      const generator = new FrameGenerator({
        width: 1280,
        height: 720,
        fps: 30,
        quality: 90
      })
      
      const slides = [
        {
          slideNumber: 1,
          frameIndex: 0,
          duration: 2,
          text: [{ content: 'Progress Test' }],
          background: '#FFFFFF'
        }
      ]
      
      const outputDir = path.join(testDir, 'frames-progress')
      
      const progressUpdates: number[] = []
      
      await generator.generateFrames(slides, outputDir, (current, total) => {
        progressUpdates.push((current / total) * 100)
      })
      
      // Should have multiple progress updates
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      // Progress should increase
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1])
      }
    }, 30000)
  })
  
  describe('FFmpegExecutor', () => {
    let framesDir: string
    
    beforeAll(async () => {
      // Generate frames for FFmpeg tests
      const generator = new FrameGenerator({
        width: 1280,
        height: 720,
        fps: 30,
        quality: 90
      })
      
      const slides = [
        {
          slideNumber: 1,
          frameIndex: 0,
          duration: 2,
          text: [{ content: 'FFmpeg Test Slide' }],
          background: '#FFFFFF'
        }
      ]
      
      framesDir = path.join(testDir, 'ffmpeg-frames')
      
      await generator.generateFrames(slides, framesDir)
    })
    
    it('should encode video from frames (H.264)', async () => {
      const executor = new FFmpegExecutor()
      
      const outputPath = path.join(testDir, 'output-h264.mp4')
      
      const result = await executor.renderFromFrames({
        inputFramesDir: framesDir,
        inputFramesPattern: 'frame_%06d.png',
        outputPath,
        codec: 'h264',
        quality: 'medium', preset: 'ultrafast',
        resolution: '720p',
        fps: 30
      })
      
      expect(result.success).toBe(true)
      expect(result.outputPath).toBe(outputPath)
      expect(existsSync(outputPath)).toBe(true)
      
      // Check file size (should be > 0)
      const stats = await fs.stat(outputPath)
      expect(stats.size).toBeGreaterThan(0)
    }, 60000)
    
    it('should track encoding progress', async () => {
      const executor = new FFmpegExecutor()
      
      const outputPath = path.join(testDir, 'output-progress.mp4')
      const progressUpdates: number[] = []
      
      await executor.renderFromFrames(
        {
          inputFramesDir: framesDir,
          inputFramesPattern: 'frame_%06d.png',
          outputPath,
          codec: 'h264',
          quality: 'medium', preset: 'ultrafast',
          resolution: '720p',
          fps: 30
        },
        (progress) => {
          progressUpdates.push(progress.progress)
        }
      )
      
      // Should have progress updates
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      // Progress should increase
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1])
      }
    }, 60000)
    
    it('should support different codecs', async () => {
      const executor = new FFmpegExecutor()
      
      const codecs = [
        { codec: 'h264' as const, ext: 'mp4' },
        { codec: 'h265' as const, ext: 'mp4' },
        { codec: 'vp9' as const, ext: 'webm' }
      ]
      
      for (const { codec, ext } of codecs) {
        const outputPath = path.join(testDir, `output-${codec}.${ext}`)
        
        await executor.renderFromFrames({
          inputFramesDir: framesDir,
          inputFramesPattern: 'frame_%06d.png',
          outputPath,
          codec,
          quality: 'medium', preset: 'ultrafast',
          resolution: '720p',
          fps: 30
        })
        
        expect(existsSync(outputPath)).toBe(true)
        
        const stats = await fs.stat(outputPath)
        expect(stats.size).toBeGreaterThan(0)
      }
    }, 120000)
  })
  
  describe('VideoUploader', () => {
    let videoPath: string
    
    beforeAll(async () => {
      // Generate video for upload tests
      const generator = new FrameGenerator({
        width: 1280,
        height: 720,
        fps: 30,
        quality: 90
      })
      
      const slides = [
        {
          slideNumber: 1,
          frameIndex: 0,
          duration: 2,
          text: [{ content: 'Upload Test' }],
          background: '#FFFFFF'
        }
      ]
      
      const framesDir = path.join(testDir, 'upload-frames')
      
      await generator.generateFrames(slides, framesDir)
      
      const executor = new FFmpegExecutor()
      videoPath = path.join(testDir, 'upload-test.mp4')
      
      await executor.renderFromFrames({
        inputFramesDir: framesDir,
        inputFramesPattern: 'frame_%06d.png',
        outputPath: videoPath,
        codec: 'h264',
        quality: 'medium', preset: 'ultrafast',
        resolution: '720p',
        fps: 30
      })
    })
    
    it('should upload video to Supabase Storage', async () => {
      const uploader = new VideoUploader()
      
      const result = await uploader.uploadVideo({
        videoPath,
        projectId: 'test-project-123',
        userId: 'test-user-456',
        jobId: 'test-job-789',
        metadata: {
          resolution: { width: 1280, height: 720 },
          fps: 30,
          codec: 'h264',
          format: 'mp4',
          duration: 2
        }
      })
      
      expect(result).toMatch(/^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/videos\//)
      expect(mockUpload).toHaveBeenCalled()
      expect(mockGetPublicUrl).toHaveBeenCalled()
    }, 60000)
  })
  
  describe('Full Pipeline', () => {
    it('should process complete render job', async () => {
      // Mock database responses for this test
      mockSingle.mockResolvedValueOnce({ data: { id: 'project-123' }, error: null }) // project
      mockSingle.mockResolvedValueOnce({ data: { id: 'job-123' }, error: null }) // job
      
      // Process job with worker
      const progressUpdates: Array<{ stage: string; progress: number }> = []
      
      worker.on('progress', (data) => {
        progressUpdates.push({
          stage: data.stage,
          progress: data.progress
        })
      })
      
      const result = await worker.processRenderJob({
        id: 'job-123',
        projectId: 'project-123',
        userId: 'test-user-789',
        slides: [
          {
            estimatedDuration: 2,
            textBoxes: [{ text: 'Pipeline Test Slide 1', position: { x: 10, y: 10, width: 100, height: 50 } }],
            background: '#FFFFFF'
          },
          {
            estimatedDuration: 2,
            textBoxes: [{ text: 'Pipeline Test Slide 2', position: { x: 10, y: 10, width: 100, height: 50 } }],
            background: '#F0F0F0'
          }
        ],
        config: {
          resolution: { width: 1280, height: 720 },
          fps: 30,
          quality: 'medium',
          codec: 'h264',
          format: 'mp4',
          audioEnabled: false,
          transitionsEnabled: false
        }
      })
      
      // Verify result
      expect(result).toMatch(/^https:\/\//)
      
      // Verify progress updates
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      // Should have different stages
      const stages = new Set(progressUpdates.map(u => u.stage))
      expect(stages.size).toBeGreaterThan(1)
      
      // Verify database was updated (via fetch mock or internal logic)
      // Since we mocked fetch, we can check if it was called
      expect(global.fetch).toHaveBeenCalledWith('/api/render/progress', expect.anything())
      
    }, 180000) // 3 minutes timeout
  })
  
  describe('Error Handling', () => {
    it('should handle missing frames directory', async () => {
      const executor = new FFmpegExecutor()
      
      const result = await executor.renderFromFrames({
        inputFramesDir: '/nonexistent/frames',
        inputFramesPattern: 'frame_%06d.png',
        outputPath: path.join(testDir, 'error-output.mp4'),
        codec: 'h264',
        quality: 'medium', preset: 'ultrafast',
        resolution: '720p',
        fps: 30
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
    
    it('should handle invalid codec', async () => {
      const generator = new FrameGenerator({
        width: 1280,
        height: 720,
        fps: 30,
        quality: 90
      })
      
      const slides = [
        {
          slideNumber: 1,
          frameIndex: 0,
          duration: 1,
          text: [{ content: 'Error Test' }],
          background: '#FFFFFF'
        }
      ]
      
      const framesDir = path.join(testDir, 'error-frames')
      
      await generator.generateFrames(slides, framesDir)
      
      const executor = new FFmpegExecutor()
      
      const result = await executor.renderFromFrames({
        inputFramesDir: framesDir,
        inputFramesPattern: 'frame_%06d.png',
        outputPath: path.join(testDir, 'error-invalid-codec.mp4'),
        codec: 'invalid-codec' as any,
        quality: 'medium', preset: 'ultrafast',
        resolution: '720p',
        fps: 30
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
