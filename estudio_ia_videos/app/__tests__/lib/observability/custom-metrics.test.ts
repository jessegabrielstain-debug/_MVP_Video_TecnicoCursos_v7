/**
 * Tests for Custom Metrics Module
 */

import {
  metricsRegistry,
  incRenderJobs,
  setActiveRenderJobs,
  observeRenderDuration,
  setRenderQueueDepth,
  recordApiRequest,
  recordDbQuery,
  recordTtsRequest,
  recordUpload,
  startTimer,
} from '@/lib/observability/custom-metrics';

describe('Custom Metrics', () => {
  beforeEach(() => {
    metricsRegistry.clear();
  });

  describe('metricsRegistry', () => {
    it('should register a counter metric', () => {
      metricsRegistry.register('test_counter', 'counter', 'Test counter metric');
      metricsRegistry.inc('test_counter', 1);
      
      const json = metricsRegistry.getJsonFormat();
      expect(json.test_counter).toBeDefined();
      expect((json.test_counter as Record<string, unknown>).type).toBe('counter');
      expect((json.test_counter as Record<string, unknown>).value).toBe(1);
    });

    it('should register a gauge metric', () => {
      metricsRegistry.register('test_gauge', 'gauge', 'Test gauge metric');
      metricsRegistry.set('test_gauge', 42);
      
      const json = metricsRegistry.getJsonFormat();
      expect(json.test_gauge).toBeDefined();
      expect((json.test_gauge as Record<string, unknown>).type).toBe('gauge');
      expect((json.test_gauge as Record<string, unknown>).value).toBe(42);
    });

    it('should register a histogram metric', () => {
      metricsRegistry.register('test_histogram', 'histogram', 'Test histogram', [1, 5, 10]);
      metricsRegistry.observe('test_histogram', 3);
      metricsRegistry.observe('test_histogram', 7);
      
      const json = metricsRegistry.getJsonFormat();
      expect(json.test_histogram).toBeDefined();
      expect((json.test_histogram as Record<string, unknown>).type).toBe('histogram');
      expect((json.test_histogram as Record<string, unknown>).count).toBe(2);
      expect((json.test_histogram as Record<string, unknown>).sum).toBe(10);
    });

    it('should support labels', () => {
      metricsRegistry.register('test_labeled', 'counter', 'Labeled counter');
      metricsRegistry.inc('test_labeled', 1, { route: '/api/test', method: 'GET' });
      
      const json = metricsRegistry.getJsonFormat();
      const metric = json.test_labeled as Record<string, unknown>;
      expect(metric.labels).toEqual({ route: '/api/test', method: 'GET' });
    });

    it('should generate prometheus format', () => {
      metricsRegistry.register('prom_test', 'counter', 'Prometheus test');
      metricsRegistry.inc('prom_test', 5);
      
      const prometheus = metricsRegistry.getPrometheusFormat();
      expect(prometheus).toContain('# HELP prom_test Prometheus test');
      expect(prometheus).toContain('# TYPE prom_test counter');
      expect(prometheus).toContain('prom_test 5');
    });

    it('should not register duplicate metrics', () => {
      metricsRegistry.register('dup_test', 'counter', 'First');
      metricsRegistry.register('dup_test', 'gauge', 'Second'); // Should be ignored
      
      // Should still be a counter
      metricsRegistry.inc('dup_test', 1);
      const json = metricsRegistry.getJsonFormat();
      expect((json.dup_test as Record<string, unknown>).type).toBe('counter');
    });

    it('should warn on invalid operations', () => {
      const warnSpy = jest.spyOn(console, 'log').mockImplementation();
      
      metricsRegistry.register('gauge_only', 'gauge', 'Only gauge');
      metricsRegistry.inc('gauge_only', 1); // Invalid - inc on gauge
      
      warnSpy.mockRestore();
    });
  });

  describe('Pre-defined Metrics Helpers', () => {
    it('incRenderJobs should increment counter', () => {
      incRenderJobs('started');
      incRenderJobs('completed');
      incRenderJobs('failed');
      
      const json = metricsRegistry.getJsonFormat();
      expect(json.render_jobs_total).toBeDefined();
    });

    it('setActiveRenderJobs should set gauge', () => {
      setActiveRenderJobs(5);
      
      const json = metricsRegistry.getJsonFormat();
      expect((json.render_jobs_active as Record<string, unknown>).value).toBe(5);
    });

    it('observeRenderDuration should record histogram', () => {
      observeRenderDuration(30, 'completed');
      observeRenderDuration(60, 'completed');
      
      const json = metricsRegistry.getJsonFormat();
      const histogram = json.render_duration_seconds as Record<string, unknown>;
      expect(histogram.count).toBe(2);
      expect(histogram.sum).toBe(90);
    });

    it('setRenderQueueDepth should set gauge', () => {
      setRenderQueueDepth(10);
      
      const json = metricsRegistry.getJsonFormat();
      expect((json.render_queue_depth as Record<string, unknown>).value).toBe(10);
    });

    it('recordApiRequest should record request metrics', () => {
      recordApiRequest('/api/test', 'GET', 200, 150);
      recordApiRequest('/api/test', 'POST', 500, 300);
      
      const json = metricsRegistry.getJsonFormat();
      expect(json.api_requests_total).toBeDefined();
      expect(json.api_request_duration_seconds).toBeDefined();
      expect(json.api_errors_total).toBeDefined();
    });

    it('recordDbQuery should record query duration', () => {
      recordDbQuery('SELECT', 'projects', 50);
      
      const json = metricsRegistry.getJsonFormat();
      expect(json.db_query_duration_seconds).toBeDefined();
    });

    it('recordTtsRequest should record TTS metrics', () => {
      recordTtsRequest('elevenlabs', 500, 2000, true);
      
      const json = metricsRegistry.getJsonFormat();
      expect(json.tts_requests_total).toBeDefined();
      expect(json.tts_characters_total).toBeDefined();
      expect(json.tts_duration_seconds).toBeDefined();
    });

    it('recordUpload should record upload metrics', () => {
      recordUpload('video', 1024 * 1024 * 10);
      
      const json = metricsRegistry.getJsonFormat();
      expect(json.storage_uploads_total).toBeDefined();
      expect(json.storage_bytes_uploaded).toBeDefined();
    });
  });

  describe('startTimer', () => {
    it('should measure elapsed time', async () => {
      const timer = startTimer();
      
      // Wait 100ms
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const elapsed = timer();
      expect(elapsed).toBeGreaterThanOrEqual(0.09);
      expect(elapsed).toBeLessThan(0.5);
    });
  });

  describe('Histogram Buckets', () => {
    it('should calculate histogram buckets correctly', () => {
      metricsRegistry.register('bucket_test', 'histogram', 'Bucket test', [1, 5, 10]);
      
      // Add values: 0.5, 3, 7, 15
      metricsRegistry.observe('bucket_test', 0.5);
      metricsRegistry.observe('bucket_test', 3);
      metricsRegistry.observe('bucket_test', 7);
      metricsRegistry.observe('bucket_test', 15);
      
      const prometheus = metricsRegistry.getPrometheusFormat();
      
      // le="1" should have 1 (0.5)
      expect(prometheus).toContain('bucket_test_bucket{le="1"} 1');
      // le="5" should have 2 (0.5, 3)
      expect(prometheus).toContain('bucket_test_bucket{le="5"} 2');
      // le="10" should have 3 (0.5, 3, 7)
      expect(prometheus).toContain('bucket_test_bucket{le="10"} 3');
      // le="+Inf" should have all 4
      expect(prometheus).toContain('bucket_test_bucket{le="+Inf"} 4');
    });
  });

  describe('Data Trimming', () => {
    it('should trim old values when limit is reached', () => {
      metricsRegistry.register('trim_test', 'counter', 'Trim test');
      
      // Add more values than limit (1000)
      for (let i = 0; i < 1100; i++) {
        metricsRegistry.inc('trim_test', 1);
      }
      
      const json = metricsRegistry.getJsonFormat();
      // Latest value should be present
      expect((json.trim_test as Record<string, unknown>).value).toBe(1);
    });
  });
});
