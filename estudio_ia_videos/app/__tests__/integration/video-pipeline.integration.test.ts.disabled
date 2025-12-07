/**
 * Pipeline Integration Tests
 * 
 * Testes end-to-end do pipeline completo de processamento de vídeos
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  VideoProcessingPipeline,
  createNRPipeline,
  VideoProcessingRequest,
  QueuePriority
} from '@/lib/video/pipeline';

describe('VideoProcessingPipeline - Integration Tests', () => {
  let pipeline: VideoProcessingPipeline;

  beforeEach(() => {
    pipeline = createNRPipeline();
  });

  afterEach(async () => {
    await pipeline.stop();
  });

  describe('Complete Video Processing', () => {
    it('should process video through full pipeline', async () => {
      const request: VideoProcessingRequest = {
        id: 'test-001',
        inputPath: '/path/to/test-video.mp4',
        outputPath: '/path/to/output-video.mp4',
        priority: QueuePriority.NORMAL,
        options: {
          validate: true,
          analyzeAudio: true,
          normalize: false,
          removeSilence: false
        }
      };

      const jobId = await pipeline.processVideo(request);
      expect(jobId).toBeDefined();

      // Aguardar processamento
      const result = await pipeline.waitForCompletion(request.id, 10000);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.requestId).toBe('test-001');
      expect(result.validation).toBeDefined();
      expect(result.audioAnalysis).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    }, 15000);

    it('should handle validation failures', async () => {
      const request: VideoProcessingRequest = {
        id: 'test-002',
        inputPath: '/path/to/invalid-video.mp4',
        options: {
          validate: true
        }
      };

      const jobId = await pipeline.processVideo(request);
      const result = await pipeline.waitForCompletion(request.id, 10000);

      expect(result.success).toBe(false);
      expect(result.validation?.valid).toBe(false);
      expect(result.error).toContain('Validation failed');
    }, 15000);

    it('should process with audio normalization', async () => {
      const request: VideoProcessingRequest = {
        id: 'test-003',
        inputPath: '/path/to/test-video.mp4',
        outputPath: '/path/to/normalized-video.mp4',
        options: {
          validate: true,
          analyzeAudio: true,
          normalize: true
        }
      };

      const jobId = await pipeline.processVideo(request);
      const result = await pipeline.waitForCompletion(request.id, 10000);

      expect(result.success).toBe(true);
      expect(result.audioAnalysis).toBeDefined();
    }, 15000);

    it('should process with silence removal', async () => {
      const request: VideoProcessingRequest = {
        id: 'test-004',
        inputPath: '/path/to/test-video.mp4',
        outputPath: '/path/to/trimmed-video.mp4',
        options: {
          validate: true,
          analyzeAudio: true,
          removeSilence: true
        }
      };

      const jobId = await pipeline.processVideo(request);
      const result = await pipeline.waitForCompletion(request.id, 10000);

      expect(result.success).toBe(true);
    }, 15000);
  });

  describe('Batch Processing', () => {
    it('should process multiple videos in batch', async () => {
      const requests: VideoProcessingRequest[] = [
        {
          id: 'batch-001',
          inputPath: '/path/to/video1.mp4',
          priority: QueuePriority.HIGH
        },
        {
          id: 'batch-002',
          inputPath: '/path/to/video2.mp4',
          priority: QueuePriority.NORMAL
        },
        {
          id: 'batch-003',
          inputPath: '/path/to/video3.mp4',
          priority: QueuePriority.LOW
        }
      ];

      const jobIds = await pipeline.processBatch(requests);
      expect(jobIds).toHaveLength(3);

      // Aguardar todos
      const results = await Promise.all(
        requests.map(r => pipeline.waitForCompletion(r.id, 15000))
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    }, 20000);

    it('should process videos by priority', async () => {
      const requests: VideoProcessingRequest[] = [
        {
          id: 'priority-001',
          inputPath: '/path/to/video1.mp4',
          priority: QueuePriority.LOW,
          metadata: { order: 1 }
        },
        {
          id: 'priority-002',
          inputPath: '/path/to/video2.mp4',
          priority: QueuePriority.URGENT,
          metadata: { order: 2 }
        },
        {
          id: 'priority-003',
          inputPath: '/path/to/video3.mp4',
          priority: QueuePriority.HIGH,
          metadata: { order: 3 }
        }
      ];

      const jobIds = await pipeline.processBatch(requests);

      // URGENT deve ser processado primeiro
      const results = await Promise.all(
        requests.map(r => pipeline.waitForCompletion(r.id, 15000))
      );

      // Verificar que URGENT foi processado primeiro
      expect(results[1].processingTime).toBeLessThan(results[0].processingTime);
    }, 20000);
  });

  describe('Caching', () => {
    it('should cache validation results', async () => {
      const request: VideoProcessingRequest = {
        id: 'cache-001',
        inputPath: '/path/to/same-video.mp4',
        options: { validate: true }
      };

      // Primeiro processamento
      await pipeline.processVideo(request);
      const result1 = await pipeline.waitForCompletion(request.id, 10000);

      // Segundo processamento do mesmo vídeo
      request.id = 'cache-002';
      await pipeline.processVideo(request);
      const result2 = await pipeline.waitForCompletion(request.id, 10000);

      // Segundo deve ser mais rápido (cache)
      expect(result2.processingTime).toBeLessThan(result1.processingTime);
    }, 25000);

    it('should cache audio analysis results', async () => {
      const request: VideoProcessingRequest = {
        id: 'audio-cache-001',
        inputPath: '/path/to/same-video.mp4',
        options: { analyzeAudio: true }
      };

      await pipeline.processVideo(request);
      const result1 = await pipeline.waitForCompletion(request.id, 10000);

      request.id = 'audio-cache-002';
      await pipeline.processVideo(request);
      const result2 = await pipeline.waitForCompletion(request.id, 10000);

      expect(result2.processingTime).toBeLessThan(result1.processingTime);
    }, 25000);
  });

  describe('Event Handling', () => {
    it('should emit processing events', async () => {
      const events: string[] = [];

      pipeline.on('request:received', () => events.push('received'));
      pipeline.on('validation:started', () => events.push('validation-started'));
      pipeline.on('validation:completed', () => events.push('validation-completed'));
      pipeline.on('audio:analyzing', () => events.push('audio-analyzing'));
      pipeline.on('audio:analyzed', () => events.push('audio-analyzed'));
      pipeline.on('processing:started', () => events.push('processing-started'));
      pipeline.on('processing:completed', () => events.push('processing-completed'));

      const request: VideoProcessingRequest = {
        id: 'events-001',
        inputPath: '/path/to/test-video.mp4',
        options: {
          validate: true,
          analyzeAudio: true
        }
      };

      await pipeline.processVideo(request);
      await pipeline.waitForCompletion(request.id, 10000);

      expect(events).toContain('received');
      expect(events).toContain('validation-started');
      expect(events).toContain('validation-completed');
      expect(events).toContain('processing-started');
      expect(events).toContain('processing-completed');
    }, 15000);

    it('should emit pipeline:idle when queue is empty', async () => {
      let idleEmitted = false;
      pipeline.on('pipeline:idle', () => {
        idleEmitted = true;
      });

      const request: VideoProcessingRequest = {
        id: 'idle-001',
        inputPath: '/path/to/test-video.mp4'
      };

      await pipeline.processVideo(request);
      await pipeline.waitForCompletion(request.id, 10000);

      // Aguardar evento idle
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(idleEmitted).toBe(true);
    }, 15000);
  });

  describe('Statistics', () => {
    it('should provide pipeline statistics', async () => {
      const requests: VideoProcessingRequest[] = [
        { id: 'stats-001', inputPath: '/path/to/video1.mp4' },
        { id: 'stats-002', inputPath: '/path/to/video2.mp4' },
        { id: 'stats-003', inputPath: '/path/to/video3.mp4' }
      ];

      await pipeline.processBatch(requests);

      await Promise.all(
        requests.map(r => pipeline.waitForCompletion(r.id, 15000))
      );

      const stats = pipeline.getStats();

      expect(stats.queue).toBeDefined();
      expect(stats.cache).toBeDefined();
      expect(stats.results).toBeDefined();
      expect(stats.results.total).toBe(3);
      expect(stats.results.successful).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle missing input file', async () => {
      const request: VideoProcessingRequest = {
        id: 'error-001',
        inputPath: '/path/to/non-existent.mp4'
      };

      await pipeline.processVideo(request);
      const result = await pipeline.waitForCompletion(request.id, 10000);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 15000);

    it('should handle processing errors gracefully', async () => {
      const request: VideoProcessingRequest = {
        id: 'error-002',
        inputPath: '/path/to/corrupted.mp4'
      };

      const jobId = await pipeline.processVideo(request);
      expect(jobId).toBeDefined();

      // Não deve crashar o pipeline
      const result = await pipeline.waitForCompletion(request.id, 10000);
      expect(result).toBeDefined();
    }, 15000);
  });

  describe('Cleanup', () => {
    it('should clear old results', async () => {
      const request: VideoProcessingRequest = {
        id: 'cleanup-001',
        inputPath: '/path/to/test-video.mp4'
      };

      await pipeline.processVideo(request);
      await pipeline.waitForCompletion(request.id, 10000);

      const cleared = pipeline.clearResults();
      expect(cleared).toBe(1);

      const result = pipeline.getResult(request.id);
      expect(result).toBeUndefined();
    }, 15000);
  });
});
