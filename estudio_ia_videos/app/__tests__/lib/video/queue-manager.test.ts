/**
 * Queue Manager Tests
 * 
 * Testes completos para o sistema de fila de processamento
 */

import {
  VideoProcessingQueue,
  QueuePriority,
  JobStatus,
  getQueue,
  resetQueue
} from '@/lib/video/queue-manager';

describe('VideoProcessingQueue', () => {
  let queue: VideoProcessingQueue;

  beforeEach(() => {
    queue = new VideoProcessingQueue({
      maxConcurrent: 2,
      maxRetries: 3,
      autoStart: false
    });
  });

  afterEach(async () => {
    queue.stop();
    await queue.clearAll();
  });

  describe('Constructor', () => {
    it('should create queue with default config', () => {
      const defaultQueue = new VideoProcessingQueue();
      expect(defaultQueue).toBeInstanceOf(VideoProcessingQueue);
      defaultQueue.stop();
    });

    it('should create queue with custom config', () => {
      expect(queue).toBeInstanceOf(VideoProcessingQueue);
    });
  });

  describe('addJob()', () => {
    it('should add job to queue', async () => {
      const jobId = await queue.addJob('test', { data: 'test' });

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');

      const job = queue.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.type).toBe('test');
      expect(job?.status).toBe(JobStatus.PENDING);
    });

    it('should add job with priority', async () => {
      const jobId = await queue.addJob('test', { data: 'test' }, {
        priority: QueuePriority.HIGH
      });

      const job = queue.getJob(jobId);
      expect(job?.priority).toBe(QueuePriority.HIGH);
    });

    it('should add job with metadata', async () => {
      const metadata = { userId: '123', videoId: '456' };
      const jobId = await queue.addJob('test', { data: 'test' }, {
        metadata
      });

      const job = queue.getJob(jobId);
      expect(job?.metadata).toEqual(metadata);
    });

    it('should emit job:added event', async () => {
      const handler = jest.fn();
      queue.on('job:added', handler);

      await queue.addJob('test', { data: 'test' });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerProcessor()', () => {
    it('should register processor for job type', () => {
      const processor = jest.fn().mockResolvedValue({ success: true });
      
      queue.registerProcessor('test', processor);

      // Processor should be registered (not directly testable, but won't throw)
      expect(() => queue.registerProcessor('test2', processor)).not.toThrow();
    });
  });

  describe('Job Processing', () => {
    it('should process job successfully', async () => {
      const processor = jest.fn().mockResolvedValue({ success: true });
      queue.registerProcessor('test', processor);

      const jobId = await queue.addJob('test', { data: 'test' });
      
      queue.start();

      // Aguardar processamento
      await new Promise(resolve => {
        queue.on('job:completed', () => resolve(null));
      });

      const job = queue.getJob(jobId);
      expect(job?.status).toBe(JobStatus.COMPLETED);
      expect(job?.result).toEqual({ success: true });
      expect(processor).toHaveBeenCalledTimes(1);
    });

    it('should retry failed jobs', async () => {
      let attempts = 0;
      const processor = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Processing failed');
        }
        return Promise.resolve({ success: true });
      });

      queue.registerProcessor('test', processor);

      const jobId = await queue.addJob('test', { data: 'test' });
      
      queue.start();

      // Aguardar processamento completo
      await new Promise(resolve => {
        queue.on('job:completed', () => resolve(null));
      });

      const job = queue.getJob(jobId);
      expect(job?.attempts).toBe(3);
      expect(job?.status).toBe(JobStatus.COMPLETED);
    });

    it('should mark job as failed after max retries', async () => {
      const processor = jest.fn().mockRejectedValue(new Error('Always fails'));
      queue.registerProcessor('test', processor);

      const jobId = await queue.addJob('test', { data: 'test' });
      
      queue.start();

      // Aguardar falha
      await new Promise(resolve => {
        queue.on('job:failed', () => resolve(null));
      });

      const job = queue.getJob(jobId);
      expect(job?.status).toBe(JobStatus.FAILED);
      expect(job?.attempts).toBe(3);
      expect(job?.error).toBeDefined();
    });

    it('should process jobs by priority', async () => {
      const processOrder: string[] = [];
      const processor = jest.fn().mockImplementation((job) => {
        processOrder.push(job.id);
        return Promise.resolve({ success: true });
      });

      queue.registerProcessor('test', processor);

      // Adicionar jobs com diferentes prioridades
      const job1 = await queue.addJob('test', { data: '1' }, { priority: QueuePriority.LOW });
      const job2 = await queue.addJob('test', { data: '2' }, { priority: QueuePriority.URGENT });
      const job3 = await queue.addJob('test', { data: '3' }, { priority: QueuePriority.HIGH });

      queue.start();

      // Aguardar todos os jobs
      await new Promise(resolve => {
        let completed = 0;
        queue.on('job:completed', () => {
          completed++;
          if (completed === 3) resolve(null);
        });
      });

      // URGENT deve ser processado primeiro, depois HIGH, depois LOW
      expect(processOrder[0]).toBe(job2);
      expect(processOrder[1]).toBe(job3);
      expect(processOrder[2]).toBe(job1);
    });

    it('should respect maxConcurrent limit', async () => {
      let concurrentJobs = 0;
      let maxConcurrent = 0;

      const processor = jest.fn().mockImplementation(async () => {
        concurrentJobs++;
        maxConcurrent = Math.max(maxConcurrent, concurrentJobs);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        concurrentJobs--;
        return { success: true };
      });

      queue.registerProcessor('test', processor);

      // Adicionar 5 jobs
      for (let i = 0; i < 5; i++) {
        await queue.addJob('test', { data: i });
      }

      queue.start();

      await new Promise(resolve => {
        queue.on('queue:drained', () => resolve(null));
      });

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('cancelJob()', () => {
    it('should cancel pending job', async () => {
      const jobId = await queue.addJob('test', { data: 'test' });

      const cancelled = await queue.cancelJob(jobId);
      expect(cancelled).toBe(true);

      const job = queue.getJob(jobId);
      expect(job?.status).toBe(JobStatus.CANCELLED);
    });

    it('should not cancel processing job', async () => {
      const processor = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
      });

      queue.registerProcessor('test', processor);

      const jobId = await queue.addJob('test', { data: 'test' });
      queue.start();

      // Aguardar job começar a processar
      await new Promise(resolve => {
        queue.on('job:started', () => resolve(null));
      });

      const cancelled = await queue.cancelJob(jobId);
      expect(cancelled).toBe(false);

      queue.stop();
    });
  });

  describe('retryJob()', () => {
    it('should retry failed job', async () => {
      const processor = jest.fn().mockRejectedValue(new Error('Fail'));
      queue.registerProcessor('test', processor);

      const jobId = await queue.addJob('test', { data: 'test' }, { maxAttempts: 1 });
      
      queue.start();

      await new Promise(resolve => {
        queue.on('job:failed', () => resolve(null));
      });

      queue.stop();

      const retried = await queue.retryJob(jobId);
      expect(retried).toBe(true);

      const job = queue.getJob(jobId);
      expect(job?.status).toBe(JobStatus.PENDING);
      expect(job?.attempts).toBe(0);
    });
  });

  describe('getJobsByStatus()', () => {
    it('should return jobs by status', async () => {
      await queue.addJob('test', { data: '1' });
      await queue.addJob('test', { data: '2' });
      
      const pending = queue.getJobsByStatus(JobStatus.PENDING);
      expect(pending).toHaveLength(2);

      const completed = queue.getJobsByStatus(JobStatus.COMPLETED);
      expect(completed).toHaveLength(0);
    });
  });

  describe('getStats()', () => {
    it('should return queue statistics', async () => {
      await queue.addJob('test', { data: '1' });
      await queue.addJob('test', { data: '2' });

      const stats = queue.getStats();

      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(2);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it('should calculate hit rate correctly', async () => {
      const processor = jest.fn().mockResolvedValue({ success: true });
      queue.registerProcessor('test', processor);

      await queue.addJob('test', { data: '1' });
      await queue.addJob('test', { data: '2' });

      queue.start();

      await new Promise(resolve => {
        let completed = 0;
        queue.on('job:completed', () => {
          completed++;
          if (completed === 2) resolve(null);
        });
      });

      const stats = queue.getStats();
      expect(stats.completed).toBe(2);
    });
  });

  describe('clearCompleted()', () => {
    it('should clear completed jobs', async () => {
      const processor = jest.fn().mockResolvedValue({ success: true });
      queue.registerProcessor('test', processor);

      await queue.addJob('test', { data: '1' });
      await queue.addJob('test', { data: '2' });

      queue.start();

      await new Promise(resolve => {
        queue.on('queue:drained', () => resolve(null));
      });

      const cleared = await queue.clearCompleted();
      expect(cleared).toBe(2);

      const stats = queue.getStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('Events', () => {
    it('should emit job:started event', async () => {
      const handler = jest.fn();
      queue.on('job:started', handler);

      const processor = jest.fn().mockResolvedValue({ success: true });
      queue.registerProcessor('test', processor);

      await queue.addJob('test', { data: 'test' });
      queue.start();

      await new Promise(resolve => {
        queue.on('job:completed', () => resolve(null));
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit queue:empty event', async () => {
      const handler = jest.fn();
      queue.on('queue:empty', handler);

      queue.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(handler).toHaveBeenCalled();
    });

    it('should emit queue:drained event', async () => {
      const handler = jest.fn();
      queue.on('queue:drained', handler);

      const processor = jest.fn().mockResolvedValue({ success: true });
      queue.registerProcessor('test', processor);

      await queue.addJob('test', { data: 'test' });
      queue.start();

      await new Promise(resolve => {
        queue.on('queue:drained', () => resolve(null));
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Singleton', () => {
    afterEach(async () => {
      await resetQueue();
    });

    it('should return same instance', () => {
      const queue1 = getQueue();
      const queue2 = getQueue();

      expect(queue1).toBe(queue2);
    });

    it('should reset singleton', async () => {
      const queue1 = getQueue();
      await resetQueue();
      const queue2 = getQueue();

      expect(queue1).not.toBe(queue2);
    });
  });
});
