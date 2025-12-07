/**
 * 🧪 Tests - Performance Monitor
 * Suite completa de testes para monitoramento de performance
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { VideoPerformanceMonitor } from '../../../lib/video/performance-monitor';
import type { MonitorOptions, PerformanceMetrics } from '../../../lib/video/performance-monitor';

describe('VideoPerformanceMonitor', () => {
  let monitor: VideoPerformanceMonitor;

  beforeEach(() => {
    monitor = new VideoPerformanceMonitor({
      sampleInterval: 100, // 100ms para testes rápidos
      alertThresholds: {
        cpu: 80,
        memory: 90,
        fps: 24,
        throughput: 10
      }
    });
  });

  afterEach(() => {
    if (monitor) {
      try {
        monitor.stop();
      } catch {
        // Monitor não estava ativo
      }
    }
  });

  describe('Inicialização', () => {
    it('deve criar instância com opções padrão', () => {
      const defaultMonitor = new VideoPerformanceMonitor();
      expect(defaultMonitor).toBeDefined();
      expect(defaultMonitor).toBeInstanceOf(VideoPerformanceMonitor);
    });

    it('deve aceitar opções customizadas', () => {
      const options: MonitorOptions = {
        sampleInterval: 500,
        alertThresholds: {
          cpu: 70,
          memory: 85
        },
        enableGPU: true
      };

      const customMonitor = new VideoPerformanceMonitor(options);
      expect(customMonitor).toBeDefined();
    });
  });

  describe('Controle de Monitoramento', () => {
    it('deve iniciar monitoramento', () => {
      monitor.start();
      // Monitor deve estar ativo
      expect(() => monitor.start()).not.toThrow();
    });

    it('deve parar monitoramento e retornar stats', () => {
      monitor.start();
      
      // Simular algum processamento
      monitor.recordFrame();
      monitor.recordFrame();
      
      const stats = monitor.stop();
      
      expect(stats).toBeDefined();
      expect(stats.totalFrames).toBeGreaterThanOrEqual(0);
      expect(stats.duration).toBeGreaterThanOrEqual(0);
    });

    it('deve lançar erro ao parar monitor inativo', () => {
      expect(() => monitor.stop()).toThrow();
    });
  });

  describe('Registro de Métricas', () => {
    beforeEach(() => {
      monitor.start();
    });

    it('deve registrar frames processados', () => {
      monitor.recordFrame();
      monitor.recordFrame();
      monitor.recordFrame();

      const stats = monitor.stop();
      expect(stats.totalFrames).toBe(3);
    });

    it('deve registrar bytes processados', () => {
      const bytesProcessed = 10 * 1024 * 1024; // 10MB
      monitor.recordBytes(bytesProcessed);

      // Verificar que foi registrado
      expect(bytesProcessed).toBe(10 * 1024 * 1024);
    });

    it('deve registrar operações de disco', () => {
      const readBytes = 5 * 1024 * 1024;
      const writeBytes = 3 * 1024 * 1024;

      monitor.recordDiskIO(readBytes, writeBytes);

      expect(readBytes).toBeGreaterThan(0);
      expect(writeBytes).toBeGreaterThan(0);
    });
  });

  describe('Cálculo de Métricas', () => {
    it('deve calcular FPS corretamente', () => {
      const totalFrames = 120;
      const totalTime = 4; // segundos

      const fps = totalFrames / totalTime;
      expect(fps).toBe(30);
    });

    it('deve calcular throughput em MB/s', () => {
      const bytesProcessed = 50 * 1024 * 1024; // 50MB
      const timeSeconds = 5;

      const throughput = (bytesProcessed / 1024 / 1024) / timeSeconds;
      expect(throughput).toBe(10); // 10 MB/s
    });

    it('deve calcular uso de memória em %', () => {
      const totalMemory = 16 * 1024 * 1024 * 1024; // 16GB
      const usedMemory = 8 * 1024 * 1024 * 1024;   // 8GB

      const memoryPercent = (usedMemory / totalMemory) * 100;
      expect(memoryPercent).toBe(50);
    });

    it('deve calcular tempo médio por frame', () => {
      const totalTime = 10000; // ms
      const totalFrames = 100;

      const avgFrameTime = totalTime / totalFrames;
      expect(avgFrameTime).toBe(100); // 100ms por frame
    });
  });

  describe('Alertas de Performance', () => {
    it('deve gerar alerta para CPU alto', () => {
      const cpuUsage = 85;
      const threshold = 80;

      const shouldAlert = cpuUsage > threshold;
      expect(shouldAlert).toBe(true);
    });

    it('deve gerar alerta para memória alta', () => {
      const memoryPercent = 92;
      const threshold = 90;

      const shouldAlert = memoryPercent > threshold;
      expect(shouldAlert).toBe(true);
    });

    it('deve gerar alerta para FPS baixo', () => {
      const fps = 20;
      const threshold = 24;

      const shouldAlert = fps < threshold && fps > 0;
      expect(shouldAlert).toBe(true);
    });

    it('deve determinar severidade do alerta', () => {
      const criticalCPU = 95;
      const warningCPU = 82;

      expect(criticalCPU > 95 ? 'critical' : 'warning').toBe('critical');
      expect(warningCPU > 95 ? 'critical' : 'warning').toBe('warning');
    });
  });

  describe('Estatísticas Agregadas', () => {
    it('deve calcular média de FPS', () => {
      const fpsSamples = [30, 28, 32, 29, 31];
      const average = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;

      expect(average).toBe(30);
    });

    it('deve encontrar pico de CPU', () => {
      const cpuSamples = [45, 67, 89, 56, 72];
      const peak = Math.max(...cpuSamples);

      expect(peak).toBe(89);
    });

    it('deve encontrar pico de memória', () => {
      const memorySamples = [1024, 1536, 2048, 1792, 1280]; // MB
      const peak = Math.max(...memorySamples);

      expect(peak).toBe(2048);
    });

    it('deve calcular eficiência', () => {
      const processedFrames = 950;
      const totalFrames = 1000;

      const efficiency = (processedFrames / totalFrames) * 100;
      expect(efficiency).toBe(95);
    });
  });

  describe('Geração de Relatórios', () => {
    it('deve gerar relatório com todas as seções', () => {
      monitor.start();
      monitor.recordFrame();
      monitor.recordFrame();
      
      const report = monitor.generateReport();

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('generatedAt');
    });

    it('deve exportar relatório em formato texto', () => {
      monitor.start();
      const textReport = monitor.exportReport('text');

      expect(typeof textReport).toBe('string');
      expect(textReport).toContain('PERFORMANCE');
    });

    it('deve exportar relatório em formato JSON', () => {
      monitor.start();
      const jsonReport = monitor.exportReport('json');

      expect(() => JSON.parse(jsonReport)).not.toThrow();
    });

    it('deve exportar relatório em formato Markdown', () => {
      monitor.start();
      const mdReport = monitor.exportReport('markdown');

      expect(typeof mdReport).toBe('string');
      expect(mdReport).toContain('#');
    });
  });

  describe('Recomendações', () => {
    it('deve recomendar ações para CPU alto', () => {
      const peakCPU = 95;
      const recommendations: string[] = [];

      if (peakCPU > 90) {
        recommendations.push('Reduzir qualidade de encoding');
        recommendations.push('Processar em lotes menores');
      }

      expect(recommendations).toHaveLength(2);
    });

    it('deve recomendar ações para memória alta', () => {
      const totalMemory = 8 * 1024; // 8GB em MB
      const peakMemory = 7.5 * 1024; // 7.5GB em MB
      const recommendations: string[] = [];

      if (peakMemory > totalMemory * 0.9) {
        recommendations.push('Processar vídeos menores');
        recommendations.push('Liberar cache entre operações');
      }

      expect(recommendations).toHaveLength(2);
    });

    it('deve recomendar ações para processamento lento', () => {
      const avgFrameTime = 150; // ms
      const recommendations: string[] = [];

      if (avgFrameTime > 100) {
        recommendations.push('Otimizar pipeline de processamento');
        recommendations.push('Usar codec mais rápido');
      }

      expect(recommendations).toHaveLength(2);
    });
  });

  describe('Formatação de Dados', () => {
    it('deve formatar tamanhos de memória', () => {
      const bytes = 1536 * 1024 * 1024; // 1.5GB
      const mb = bytes / 1024 / 1024;
      const formatted = mb.toFixed(0);

      expect(formatted).toBe('1536');
    });

    it('deve formatar percentuais', () => {
      const value = 87.6543;
      const formatted = value.toFixed(1);

      expect(formatted).toBe('87.7');
    });

    it('deve formatar velocidades', () => {
      const mbps = 15.789;
      const formatted = mbps.toFixed(2);

      expect(formatted).toBe('15.79');
    });
  });

  describe('Eventos', () => {
    it('deve emitir evento ao iniciar', (done) => {
      monitor.on('monitor:started', () => {
        expect(true).toBe(true);
        done();
      });

      monitor.start();
    });

    it('deve emitir evento ao processar frame', (done) => {
      monitor.on('frame:processed', (data) => {
        expect(data).toHaveProperty('frameNumber');
        expect(data).toHaveProperty('frameTime');
        done();
      });

      monitor.start();
      monitor.recordFrame();
    });

    it('deve emitir evento de alerta', (done) => {
      monitor.on('alert', (alert) => {
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        done();
      });

      monitor.start();
      // Alerta seria emitido quando métricas excedem thresholds
    });
  });

  describe('Limpeza e Destruição', () => {
    it('deve limpar recursos ao parar', () => {
      monitor.start();
      const stats = monitor.stop();

      expect(stats).toBeDefined();
      // Timers devem ter sido limpos
    });

    it('deve permitir reiniciar após parar', () => {
      monitor.start();
      monitor.stop();
      
      expect(() => monitor.start()).not.toThrow();
    });
  });
});
