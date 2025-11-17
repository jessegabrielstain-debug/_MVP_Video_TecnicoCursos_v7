/**
 * Testes de Integração - Pipeline Completo de Renderização
 * 
 * Testa o fluxo completo: Frame Generation → FFmpeg Encoding → Upload
 * 
 * @group integration
 * @group video-render
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { VideoRenderWorker } from '@/lib/workers/video-render-worker'
import { FrameGenerator } from '@/lib/render/frame-generator'
import { FFmpegExecutor } from '@/lib/render/ffmpeg-executor'
import { VideoUploader } from '@/lib/storage/video-uploader'
import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

describe('Video Render Pipeline Integration', () => {
  let supabase: ReturnType<typeof createClient>
  let worker: VideoRenderWorker
  let testDir: string
  
  beforeAll(() => {
    // Setup Supabase client
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Setup worker
    worker = new VideoRenderWorker(supabase)
    
    // Create test directory
    testDir = path.join(process.cwd(), 'tmp', 'test-render')
  })
  
  afterAll(async () => {
    // Cleanup test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true })
    }
  })
  
  describe('FrameGenerator', () => {
    it('should generate frames from simple slides', async () => {
      const generator = new FrameGenerator({
        resolution: '720p',
        fps: 30,
        quality: 'high'
      })
      
      const slides = [
        {
          id: 'slide-1',
          order_index: 0,
          duration_seconds: 3,
          content: {
            title: 'Test Slide 1',
            text: 'This is a test slide with some content.',
            background: { type: 'solid' as const, color: '#FFFFFF' }
          }
        },
        {
          id: 'slide-2',
          order_index: 1,
          duration_seconds: 2,
          content: {
            title: 'Test Slide 2',
            text: 'Another test slide.',
            background: { type: 'solid' as const, color: '#F0F0F0' }
          }
        }
      ]
      
      const outputDir = path.join(testDir, 'frames-simple')
      await fs.mkdir(outputDir, { recursive: true })
      
      const frames = await generator.generateFrames(slides, outputDir)
      
      // 3s * 30fps + 2s * 30fps = 150 frames
      expect(frames).toHaveLength(150)
      expect(frames[0]).toMatch(/frame_000001\.png$/)
      expect(frames[149]).toMatch(/frame_000150\.png$/)
      
      // Verify files exist
      for (const framePath of frames.slice(0, 10)) {
        expect(existsSync(framePath)).toBe(true)
      }
    }, 30000)
    
    it('should generate frames with images', async () => {
      const generator = new FrameGenerator({
        resolution: '1080p',
        fps: 30,
        quality: 'medium'
      })
      
      const slides = [
        {
          id: 'slide-img-1',
          order_index: 0,
          duration_seconds: 5,
          content: {
            title: 'Slide with Image',
            text: 'This slide contains an image.',
            images: [
              {
                src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                x: 100,
                y: 100,
                width: 200,
                height: 200
              }
            ],
            background: { type: 'solid' as const, color: '#FFFFFF' }
          }
        }
      ]
      
      const outputDir = path.join(testDir, 'frames-images')
      await fs.mkdir(outputDir, { recursive: true })
      
      const frames = await generator.generateFrames(slides, outputDir)
      
      expect(frames).toHaveLength(150) // 5s * 30fps
      expect(existsSync(frames[0])).toBe(true)
    }, 30000)
    
    it('should track progress during generation', async () => {
      const generator = new FrameGenerator({
        resolution: '720p',
        fps: 30,
        quality: 'high'
      })
      
      const slides = [
        {
          id: 'slide-progress-1',
          order_index: 0,
          duration_seconds: 2,
          content: {
            title: 'Progress Test',
            background: { type: 'solid' as const, color: '#FFFFFF' }
          }
        }
      ]
      
      const outputDir = path.join(testDir, 'frames-progress')
      await fs.mkdir(outputDir, { recursive: true })
      
      const progressUpdates: number[] = []
      
      await generator.generateFrames(slides, outputDir, (percent) => {
        progressUpdates.push(percent)
      })
      
      // Should have multiple progress updates
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      // Progress should increase
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1])
      }
      
      // Final progress should be 100
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100)
    }, 30000)
  })
  
  describe('FFmpegExecutor', () => {
    let framesDir: string
    
    beforeAll(async () => {
      // Generate frames for FFmpeg tests
      const generator = new FrameGenerator({
        resolution: '720p',
        fps: 30,
        quality: 'high'
      })
      
      const slides = [
        {
          id: 'ffmpeg-test-1',
          order_index: 0,
          duration_seconds: 2,
          content: {
            title: 'FFmpeg Test Slide',
            background: { type: 'solid' as const, color: '#FFFFFF' }
          }
        }
      ]
      
      framesDir = path.join(testDir, 'ffmpeg-frames')
      await fs.mkdir(framesDir, { recursive: true })
      
      await generator.generateFrames(slides, framesDir)
    })
    
    it('should encode video from frames (H.264)', async () => {
      const executor = new FFmpegExecutor()
      
      const outputPath = path.join(testDir, 'output-h264.mp4')
      
      const result = await executor.renderFromFrames({
        inputPattern: path.join(framesDir, 'frame_%06d.png'),
        outputPath,
        codec: 'libx264',
        quality: 'ultrafast',
        resolution: '720p',
        fps: 30
      })
      
      expect(result).toBe(outputPath)
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
          inputPattern: path.join(framesDir, 'frame_%06d.png'),
          outputPath,
          codec: 'libx264',
          quality: 'ultrafast',
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
        { codec: 'libx264' as const, ext: 'mp4' },
        { codec: 'libx265' as const, ext: 'mp4' },
        { codec: 'libvpx-vp9' as const, ext: 'webm' }
      ]
      
      for (const { codec, ext } of codecs) {
        const outputPath = path.join(testDir, `output-${codec}.${ext}`)
        
        await executor.renderFromFrames({
          inputPattern: path.join(framesDir, 'frame_%06d.png'),
          outputPath,
          codec,
          quality: 'ultrafast',
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
        resolution: '720p',
        fps: 30,
        quality: 'high'
      })
      
      const slides = [
        {
          id: 'upload-test-1',
          order_index: 0,
          duration_seconds: 2,
          content: {
            title: 'Upload Test',
            background: { type: 'solid' as const, color: '#FFFFFF' }
          }
        }
      ]
      
      const framesDir = path.join(testDir, 'upload-frames')
      await fs.mkdir(framesDir, { recursive: true })
      
      await generator.generateFrames(slides, framesDir)
      
      const executor = new FFmpegExecutor()
      videoPath = path.join(testDir, 'upload-test.mp4')
      
      await executor.renderFromFrames({
        inputPattern: path.join(framesDir, 'frame_%06d.png'),
        outputPath: videoPath,
        codec: 'libx264',
        quality: 'ultrafast',
        resolution: '720p',
        fps: 30
      })
    })
    
    it('should upload video to Supabase Storage', async () => {
      const uploader = new VideoUploader(supabase)
      
      const result = await uploader.uploadVideo({
        videoPath,
        projectId: 'test-project-123',
        userId: 'test-user-456',
        jobId: 'test-job-789',
        metadata: {
          resolution: '720p',
          fps: 30,
          codec: 'libx264',
          format: 'mp4',
          duration: 2
        }
      })
      
      expect(result.videoUrl).toMatch(/^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/videos\//)
      expect(result.fileSize).toBeGreaterThan(0)
      expect(result.uploadTime).toBeGreaterThan(0)
    }, 60000)
    
    it('should generate thumbnail', async () => {
      const uploader = new VideoUploader(supabase)
      
      const result = await uploader.uploadVideo({
        videoPath,
        projectId: 'test-project-thumbnail',
        userId: 'test-user-456',
        jobId: 'test-job-thumbnail',
        metadata: {
          resolution: '720p',
          fps: 30,
          codec: 'libx264',
          format: 'mp4',
          duration: 2
        }
      })
      
      expect(result.thumbnailUrl).toBeDefined()
      expect(result.thumbnailUrl).toMatch(/thumb\.(jpg|png)$/)
    }, 60000)
  })
  
  describe('Full Pipeline', () => {
    it('should process complete render job', async () => {
      // Create test project and slides
      const { data: project } = await supabase
        .from('projects')
        .insert({
          name: 'Test Pipeline Project',
          description: 'Integration test'
        })
        .select()
        .single()
      
      const slides = [
        {
          project_id: project!.id,
          order_index: 0,
          duration_seconds: 2,
          content: {
            title: 'Pipeline Test Slide 1',
            text: 'First slide content',
            background: { type: 'solid' as const, color: '#FFFFFF' }
          }
        },
        {
          project_id: project!.id,
          order_index: 1,
          duration_seconds: 2,
          content: {
            title: 'Pipeline Test Slide 2',
            text: 'Second slide content',
            background: { type: 'solid' as const, color: '#F0F0F0' }
          }
        }
      ]
      
      await supabase.from('slides').insert(slides)
      
      // Create render job
      const { data: job } = await supabase
        .from('render_jobs')
        .insert({
          project_id: project!.id,
          user_id: 'test-user-789',
          status: 'queued',
          render_settings: {
            resolution: '720p',
            fps: 30,
            quality: 'ultrafast',
            codec: 'libx264'
          }
        })
        .select()
        .single()
      
      // Process job with worker
      const progressUpdates: Array<{ stage: string; progress: number }> = []
      
      worker.on('progress', (data) => {
        progressUpdates.push({
          stage: data.stage,
          progress: data.progress
        })
      })
      
      const result = await worker.processRenderJob({
        jobId: job!.id,
        projectId: project!.id,
        userId: 'test-user-789',
        settings: {
          resolution: '720p',
          fps: 30,
          quality: 'ultrafast',
          codec: 'libx264'
        }
      })
      
      // Verify result
      expect(result.jobId).toBe(job!.id)
      expect(result.outputUrl).toMatch(/^https:\/\//)
      expect(result.durationMs).toBeGreaterThan(0)
      
      // Verify progress updates
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      // Should have different stages
      const stages = new Set(progressUpdates.map(u => u.stage))
      expect(stages.size).toBeGreaterThan(1)
      
      // Verify database was updated
      const { data: updatedJob } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('id', job!.id)
        .single()
      
      expect(updatedJob!.status).toBe('completed')
      expect(updatedJob!.progress).toBe(100)
      expect(updatedJob!.output_url).toBe(result.outputUrl)
      expect(updatedJob!.duration_ms).toBe(result.durationMs)
      
      // Cleanup
      await supabase.from('render_jobs').delete().eq('id', job!.id)
      await supabase.from('slides').delete().eq('project_id', project!.id)
      await supabase.from('projects').delete().eq('id', project!.id)
    }, 180000) // 3 minutes timeout
  })
  
  describe('Error Handling', () => {
    it('should handle missing frames directory', async () => {
      const executor = new FFmpegExecutor()
      
      await expect(
        executor.renderFromFrames({
          inputPattern: '/nonexistent/frames/frame_%06d.png',
          outputPath: path.join(testDir, 'error-output.mp4'),
          codec: 'libx264',
          quality: 'ultrafast',
          resolution: '720p',
          fps: 30
        })
      ).rejects.toThrow()
    })
    
    it('should handle invalid codec', async () => {
      const generator = new FrameGenerator({
        resolution: '720p',
        fps: 30,
        quality: 'high'
      })
      
      const slides = [
        {
          id: 'error-test-1',
          order_index: 0,
          duration_seconds: 1,
          content: {
            title: 'Error Test',
            background: { type: 'solid' as const, color: '#FFFFFF' }
          }
        }
      ]
      
      const framesDir = path.join(testDir, 'error-frames')
      await fs.mkdir(framesDir, { recursive: true })
      
      await generator.generateFrames(slides, framesDir)
      
      const executor = new FFmpegExecutor()
      
      await expect(
        executor.renderFromFrames({
          inputPattern: path.join(framesDir, 'frame_%06d.png'),
          outputPath: path.join(testDir, 'error-invalid-codec.mp4'),
          codec: 'invalid-codec' as any,
          quality: 'ultrafast',
          resolution: '720p',
          fps: 30
        })
      ).rejects.toThrow()
    })
    
    it('should handle upload failure gracefully', async () => {
      const invalidSupabase = createClient(
        'https://invalid.supabase.co',
        'invalid-key'
      )
      
      const uploader = new VideoUploader(invalidSupabase)
      
      await expect(
        uploader.uploadVideo({
          videoPath: '/nonexistent/video.mp4',
          projectId: 'test',
          userId: 'test',
          jobId: 'test',
          metadata: {
            resolution: '720p',
            fps: 30,
            codec: 'libx264',
            format: 'mp4',
            duration: 1
          }
        })
      ).rejects.toThrow()
    })
  })
})
