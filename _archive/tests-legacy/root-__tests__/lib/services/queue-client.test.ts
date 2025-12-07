/**
 * Testes unitários do Queue Client (BullMQ)
 */

import { queueClient } from '@/lib/services/queue-client';

describe('QueueClient', () => {
  const testQueueName = 'test-queue';

  afterAll(async () => {
    // Cleanup: fechar e limpar fila de teste
    await queueClient.cleanupQueue(testQueueName);
    await queueClient.close(testQueueName);
  });

  describe('Health Check', () => {
    it('deve retornar status healthy', async () => {
      const health = await queueClient.health();
      
      expect(health.status).toBe('healthy');
      expect(Array.isArray(health.queues)).toBe(true);
    });
  });

  describe('Job Management', () => {
    it('deve adicionar job à fila', async () => {
      const jobData = {
        message: 'Test job',
        timestamp: Date.now()
      };

      const job = await queueClient.addJob(
        testQueueName,
        'test-job-1',
        jobData
      );

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data).toEqual(jobData);
    });

    it('deve adicionar job com alta prioridade', async () => {
      const jobData = { message: 'High priority job' };

      const job = await queueClient.addJob(
        testQueueName,
        'high-priority-job',
        jobData,
        { priority: 'high' }
      );

      expect(job).toBeDefined();
      expect(job.opts?.priority).toBe(1); // high = 1
    });

    it('deve adicionar job com prioridade normal', async () => {
      const jobData = { message: 'Normal priority job' };

      const job = await queueClient.addJob(
        testQueueName,
        'normal-priority-job',
        jobData,
        { priority: 'normal' }
      );

      expect(job).toBeDefined();
      expect(job.opts?.priority).toBe(5); // normal = 5
    });

    it('deve adicionar job com baixa prioridade', async () => {
      const jobData = { message: 'Low priority job' };

      const job = await queueClient.addJob(
        testQueueName,
        'low-priority-job',
        jobData,
        { priority: 'low' }
      );

      expect(job).toBeDefined();
      expect(job.opts?.priority).toBe(10); // low = 10
    });
  });

  describe('Metrics', () => {
    it('deve retornar métricas da fila', async () => {
      const metrics = await queueClient.getMetrics(testQueueName);

      expect(metrics).toBeDefined();
      expect(typeof metrics.waiting).toBe('number');
      expect(typeof metrics.active).toBe('number');
      expect(typeof metrics.completed).toBe('number');
      expect(typeof metrics.failed).toBe('number');
      expect(typeof metrics.delayed).toBe('number');
      expect(typeof metrics.paused).toBe('boolean');
    });

    it('deve ter contadores não negativos', async () => {
      const metrics = await queueClient.getMetrics(testQueueName);

      expect(metrics.waiting).toBeGreaterThanOrEqual(0);
      expect(metrics.active).toBeGreaterThanOrEqual(0);
      expect(metrics.completed).toBeGreaterThanOrEqual(0);
      expect(metrics.failed).toBeGreaterThanOrEqual(0);
      expect(metrics.delayed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Job Processing', () => {
    it('deve processar jobs corretamente', async () => {
      const processedJobs: any[] = [];

      // Configurar processador
      queueClient.on(testQueueName, async (job) => {
        processedJobs.push(job.data);
        return { processed: true };
      });

      // Adicionar job
      await queueClient.addJob(
        testQueueName,
        'processing-test',
        { value: 123 }
      );

      // Aguardar processamento (timeout de 3s)
      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(processedJobs.length).toBeGreaterThan(0);
      expect(processedJobs[0].value).toBe(123);
    }, 5000);
  });

  describe('Cleanup', () => {
    it('deve limpar jobs completados e falhados', async () => {
      // Adicionar alguns jobs
      await queueClient.addJob(testQueueName, 'cleanup-1', { test: 1 });
      await queueClient.addJob(testQueueName, 'cleanup-2', { test: 2 });

      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Limpar
      await queueClient.cleanupQueue(testQueueName);

      const metrics = await queueClient.getMetrics(testQueueName);
      
      // Após cleanup, completed e failed devem estar limitados
      expect(metrics.completed).toBeLessThanOrEqual(100);
      expect(metrics.failed).toBeLessThanOrEqual(500);
    }, 5000);
  });

  describe('Queue Closure', () => {
    it('deve fechar fila sem erros', async () => {
      const tempQueueName = 'temp-queue-test';
      
      // Criar e adicionar job
      await queueClient.addJob(tempQueueName, 'temp-job', { test: true });
      
      // Fechar fila
      await expect(queueClient.close(tempQueueName)).resolves.not.toThrow();
    });
  });
});
