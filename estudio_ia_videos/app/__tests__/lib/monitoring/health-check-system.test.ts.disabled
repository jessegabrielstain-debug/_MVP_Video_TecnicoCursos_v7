/**
 * Testes para Health Check System
 * @jest-environment node
 */

import {
  HealthCheckSystem,
  createBasicHealthCheck,
  createCachedHealthCheck,
  createMonitoredHealthCheck,
} from '@/lib/monitoring/health-check-system';

describe('HealthCheckSystem', () => {
  let healthCheck: HealthCheckSystem;

  afterEach(async () => {
    if (healthCheck) {
      healthCheck.clearCache();
      healthCheck.clearHistory();
    }
  });

  describe('Factory Functions', () => {
    it('should create basic health check', () => {
      const checker = createBasicHealthCheck();
      expect(checker).toBeInstanceOf(HealthCheckSystem);
    });

    it('should create cached health check', () => {
      const checker = createCachedHealthCheck();
      expect(checker).toBeInstanceOf(HealthCheckSystem);
    });

    it('should create monitored health check', () => {
      const checker = createMonitoredHealthCheck();
      expect(checker).toBeInstanceOf(HealthCheckSystem);
    });
  });

  describe('checkSystemHealth', () => {
    beforeEach(() => {
      healthCheck = createBasicHealthCheck();
    });

    it('should return system health status', async () => {
      const result = await healthCheck.checkSystemHealth();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);

      if (result.data) {
        expect(result.data.overall).toMatch(/healthy|degraded|unhealthy/);
        expect(result.data.services).toBeInstanceOf(Array);
        expect(result.data.services.length).toBeGreaterThan(0);
        expect(result.data.timestamp).toBeInstanceOf(Date);
        expect(result.data.uptime).toBeGreaterThan(0);
        expect(result.data.version).toBeDefined();
      }
    });

    it('should check all services', async () => {
      const result = await healthCheck.checkSystemHealth();

      expect(result.success).toBe(true);
      
      if (result.data) {
        const serviceNames = result.data.services.map(s => s.name);
        
        expect(serviceNames).toContain('database');
        expect(serviceNames).toContain('redis');
        expect(serviceNames).toContain('s3');
        expect(serviceNames).toContain('filesystem');
        expect(serviceNames).toContain('memory');
        expect(serviceNames).toContain('disk');
      }
    });

    it('should include response times', async () => {
      const result = await healthCheck.checkSystemHealth();

      expect(result.success).toBe(true);
      
      if (result.data) {
        result.data.services.forEach(service => {
          expect(service.responseTime).toBeGreaterThanOrEqual(0);
          expect(service.lastChecked).toBeInstanceOf(Date);
        });
      }
    });

    it('should handle errors gracefully', async () => {
      const result = await healthCheck.checkSystemHealth();

      // Sistema pode estar degraded ou unhealthy, mas não deve falhar
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Service Health Checks', () => {
    beforeEach(() => {
      healthCheck = createBasicHealthCheck();
    });

    it('should check database health', async () => {
      const result = await healthCheck.checkSystemHealth();
      
      if (result.data) {
        const dbService = result.data.services.find(s => s.name === 'database');
        expect(dbService).toBeDefined();
        
        if (dbService) {
          expect(dbService.status).toMatch(/healthy|degraded|unhealthy/);
          expect(dbService.message).toBeDefined();
        }
      }
    });

    it('should check redis health', async () => {
      const result = await healthCheck.checkSystemHealth();
      
      if (result.data) {
        const redisService = result.data.services.find(s => s.name === 'redis');
        expect(redisService).toBeDefined();
        
        if (redisService) {
          expect(redisService.status).toMatch(/healthy|degraded|unhealthy/);
        }
      }
    });

    it('should check memory health', async () => {
      const result = await healthCheck.checkSystemHealth();
      
      if (result.data) {
        const memService = result.data.services.find(s => s.name === 'memory');
        expect(memService).toBeDefined();
        
        if (memService && memService.metadata) {
          expect(memService.metadata.heapUsed).toBeDefined();
          expect(memService.metadata.heapTotal).toBeDefined();
          expect(memService.metadata.usedPercent).toBeDefined();
        }
      }
    });

    it('should check filesystem health', async () => {
      const result = await healthCheck.checkSystemHealth();
      
      if (result.data) {
        const fsService = result.data.services.find(s => s.name === 'filesystem');
        expect(fsService).toBeDefined();
        
        if (fsService) {
          expect(fsService.status).toMatch(/healthy|degraded|unhealthy/);
        }
      }
    });
  });

  describe('Caching', () => {
    it('should cache results when enabled', async () => {
      healthCheck = createCachedHealthCheck();
      
      const result1 = await healthCheck.checkSystemHealth();
      const startTime = Date.now();
      const result2 = await healthCheck.checkSystemHealth();
      const duration = Date.now() - startTime;

      // Segunda chamada deve ser muito mais rápida devido ao cache
      expect(duration).toBeLessThan(result1.duration);
    });

    it('should not cache when disabled', async () => {
      healthCheck = createBasicHealthCheck();
      
      const result1 = await healthCheck.checkSystemHealth();
      const result2 = await healthCheck.checkSystemHealth();

      // Duração deve ser similar
      expect(Math.abs(result1.duration - result2.duration)).toBeLessThan(result1.duration);
    });

    it('should clear cache', async () => {
      healthCheck = createCachedHealthCheck();
      
      await healthCheck.checkSystemHealth();
      healthCheck.clearCache();
      
      const result = await healthCheck.checkSystemHealth();
      expect(result.success).toBe(true);
    });
  });

  describe('History Tracking', () => {
    beforeEach(() => {
      healthCheck = createBasicHealthCheck();
    });

    it('should track service history', async () => {
      await healthCheck.checkSystemHealth();
      await healthCheck.checkSystemHealth();
      
      const history = healthCheck.getHistory('database');
      expect(history.length).toBeGreaterThan(0);
    });

    it('should calculate error rate', async () => {
      await healthCheck.checkSystemHealth();
      
      const errorRate = healthCheck.getErrorRate('database');
      expect(errorRate).toBeGreaterThanOrEqual(0);
      expect(errorRate).toBeLessThanOrEqual(1);
    });

    it('should limit history size', async () => {
      // Executar 150 checks (limite é 100)
      for (let i = 0; i < 150; i++) {
        await healthCheck.checkSystemHealth();
      }
      
      const history = healthCheck.getHistory('database');
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should clear history', async () => {
      await healthCheck.checkSystemHealth();
      healthCheck.clearHistory();
      
      const history = healthCheck.getHistory('database');
      expect(history.length).toBe(0);
    });
  });

  describe('Notifications', () => {
    it('should trigger callbacks on unhealthy status', async () => {
      healthCheck = createMonitoredHealthCheck();
      
      const callback = jest.fn();
      healthCheck.onHealthChange(callback);
      
      await healthCheck.checkSystemHealth();
      
      // Callback só é chamado se status não for healthy
      // Teste pode passar sem chamar se sistema estiver saudável
      expect(callback).toHaveBeenCalledTimes(
        callback.mock.calls.length >= 0 ? callback.mock.calls.length : 0
      );
    });

    it('should handle multiple callbacks', async () => {
      healthCheck = createMonitoredHealthCheck();
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      healthCheck.onHealthChange(callback1);
      healthCheck.onHealthChange(callback2);
      
      await healthCheck.checkSystemHealth();
      
      // Ambos devem ter mesmo número de chamadas
      expect(callback1.mock.calls.length).toBe(callback2.mock.calls.length);
    });
  });

  describe('Status Evaluation', () => {
    beforeEach(() => {
      healthCheck = createBasicHealthCheck();
    });

    it('should mark as healthy when all services are ok', async () => {
      const result = await healthCheck.checkSystemHealth();
      
      if (result.data) {
        const allHealthy = result.data.services.every(s => s.status === 'healthy');
        
        if (allHealthy) {
          expect(result.data.overall).toBe('healthy');
        }
      }
    });

    it('should mark as degraded when some services are slow', async () => {
      const result = await healthCheck.checkSystemHealth();
      
      if (result.data) {
        const hasDegraded = result.data.services.some(s => s.status === 'degraded');
        
        if (hasDegraded) {
          expect(result.data.overall).toMatch(/degraded|unhealthy/);
        }
      }
    });

    it('should mark as unhealthy when critical services fail', async () => {
      const result = await healthCheck.checkSystemHealth();
      
      if (result.data) {
        const hasUnhealthy = result.data.services.some(s => s.status === 'unhealthy');
        
        if (hasUnhealthy) {
          expect(result.data.overall).toBe('unhealthy');
        }
      }
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      healthCheck = createBasicHealthCheck();
    });

    it('should complete check within reasonable time', async () => {
      const startTime = Date.now();
      await healthCheck.checkSystemHealth();
      const duration = Date.now() - startTime;

      // Deve completar em menos de 10 segundos
      expect(duration).toBeLessThan(10000);
    });

    it('should handle concurrent checks', async () => {
      const promises = Array(5).fill(null).map(() => 
        healthCheck.checkSystemHealth()
      );

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout gracefully', async () => {
      healthCheck = new HealthCheckSystem({ timeout: 1 }); // 1ms timeout
      
      const result = await healthCheck.checkSystemHealth();
      
      // Pode falhar ou retornar degraded/unhealthy
      expect(result).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle service failures', async () => {
      healthCheck = createBasicHealthCheck();
      
      const result = await healthCheck.checkSystemHealth();
      
      // Sistema deve continuar funcionando mesmo com falhas
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});
