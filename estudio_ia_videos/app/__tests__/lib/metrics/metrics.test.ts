/**
 * Tests for app/lib/metrics.ts
 */

import {
  incrementCounter,
  setGauge,
  observeHistogram,
  startTimer,
  renderPrometheus,
  getMetricsJson,
  resetMetrics,
  renderMetrics,
  apiMetrics,
  dbMetrics,
  ttsMetrics,
  avatarMetrics,
} from '../../../lib/metrics'

describe('Metrics Module', () => {
  beforeEach(() => {
    resetMetrics()
  })

  describe('Counter Metrics', () => {
    it('should increment counter without labels', () => {
      incrementCounter('test_counter')
      incrementCounter('test_counter')
      incrementCounter('test_counter')

      const metrics = getMetricsJson()
      expect(metrics.counters['test_counter']).toBeDefined()
      expect(metrics.counters['test_counter'][0].value).toBe(3)
    })

    it('should increment counter with labels', () => {
      incrementCounter('http_requests', { method: 'GET', status: '200' })
      incrementCounter('http_requests', { method: 'GET', status: '200' })
      incrementCounter('http_requests', { method: 'POST', status: '201' })

      const metrics = getMetricsJson()
      const entries = metrics.counters['http_requests']
      
      expect(entries).toHaveLength(2)
      
      const getEntry = entries.find(e => 
        e.labels.method === 'GET' && e.labels.status === '200'
      )
      expect(getEntry?.value).toBe(2)
      
      const postEntry = entries.find(e => 
        e.labels.method === 'POST' && e.labels.status === '201'
      )
      expect(postEntry?.value).toBe(1)
    })

    it('should increment by custom value', () => {
      incrementCounter('bytes_processed', {}, 100)
      incrementCounter('bytes_processed', {}, 50)

      const metrics = getMetricsJson()
      expect(metrics.counters['bytes_processed'][0].value).toBe(150)
    })
  })

  describe('Gauge Metrics', () => {
    it('should set gauge value', () => {
      setGauge('queue_size', 10)
      
      const metrics = getMetricsJson()
      expect(metrics.gauges['queue_size'][0].value).toBe(10)
    })

    it('should update gauge value', () => {
      setGauge('active_connections', 5)
      setGauge('active_connections', 8)
      setGauge('active_connections', 3)

      const metrics = getMetricsJson()
      expect(metrics.gauges['active_connections'][0].value).toBe(3)
    })

    it('should track multiple gauges with labels', () => {
      setGauge('pool_connections', 5, { pool: 'primary' })
      setGauge('pool_connections', 3, { pool: 'replica' })

      const metrics = getMetricsJson()
      const entries = metrics.gauges['pool_connections']
      
      expect(entries).toHaveLength(2)
    })
  })

  describe('Histogram Metrics', () => {
    it('should observe histogram values', () => {
      observeHistogram('request_duration', 0.05)
      observeHistogram('request_duration', 0.2)
      observeHistogram('request_duration', 1.5)

      const metrics = getMetricsJson()
      const histogram = metrics.histograms['request_duration'][0]
      
      expect(histogram.count).toBe(3)
      expect(histogram.sum).toBeCloseTo(1.75, 2)
    })

    it('should track buckets correctly', () => {
      // Use default buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
      observeHistogram('latency', 0.03) // <= 0.05
      observeHistogram('latency', 0.15) // <= 0.25
      observeHistogram('latency', 0.8)  // <= 1

      const metrics = getMetricsJson()
      const histogram = metrics.histograms['latency'][0]
      
      // Find bucket for 0.05 - should have 1 (only 0.03)
      const bucket005 = histogram.buckets.find(b => b.le === 0.05)
      expect(bucket005?.count).toBe(1)
      
      // Find bucket for 0.25 - should have 2 (0.03 and 0.15)
      const bucket025 = histogram.buckets.find(b => b.le === 0.25)
      expect(bucket025?.count).toBe(2)
      
      // Find bucket for 1 - should have 3 (all values)
      const bucket1 = histogram.buckets.find(b => b.le === 1)
      expect(bucket1?.count).toBe(3)
    })

    it('should track histogram with labels', () => {
      observeHistogram('db_query_duration', 0.01, { operation: 'select' })
      observeHistogram('db_query_duration', 0.05, { operation: 'select' })
      observeHistogram('db_query_duration', 0.1, { operation: 'insert' })

      const metrics = getMetricsJson()
      const histograms = metrics.histograms['db_query_duration']
      
      expect(histograms).toHaveLength(2)
    })
  })

  describe('Timer Utility', () => {
    it('should measure elapsed time', async () => {
      const timer = startTimer()
      
      // Wait a small amount
      await new Promise(resolve => setTimeout(resolve, 15))
      
      const elapsed = timer.elapsed()
      expect(elapsed).toBeGreaterThanOrEqual(8) // mais tolerante 
      expect(elapsed).toBeLessThan(100)
    })

    it('should observe duration to histogram', async () => {
      const timer = startTimer()
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      timer.observeDuration('operation_duration', { type: 'test' })

      const metrics = getMetricsJson()
      const histogram = metrics.histograms['operation_duration'][0]
      
      expect(histogram.count).toBe(1)
      expect(histogram.sum).toBeGreaterThan(0)
    })
  })

  describe('Prometheus Export', () => {
    it('should render prometheus format', () => {
      incrementCounter('test_requests', { method: 'GET' }, 5)
      setGauge('test_gauge', 42)

      const output = renderPrometheus()
      
      expect(output).toContain('# TYPE test_requests counter')
      expect(output).toContain('test_requests{method="GET"} 5')
      expect(output).toContain('# TYPE test_gauge gauge')
      expect(output).toContain('test_gauge 42')
    })

    it('should include system metrics', () => {
      const output = renderPrometheus()
      
      expect(output).toContain('app_uptime_seconds')
      expect(output).toContain('app_build_info')
    })

    it('should escape label values', () => {
      incrementCounter('test_metric', { path: '/api/test?foo="bar"' })

      const output = renderPrometheus()
      
      expect(output).toContain('path="/api/test?foo=\\"bar\\""')
    })
  })

  describe('Pre-defined Metrics', () => {
    it('should track render metrics', () => {
      renderMetrics.jobsTotal('completed')
      renderMetrics.jobsTotal('completed')
      renderMetrics.jobsTotal('failed')
      renderMetrics.queueSize(5)
      renderMetrics.activeJobs(2)
      renderMetrics.jobDuration(30, 'mp4')

      const metrics = getMetricsJson()
      
      const jobsCounter = metrics.counters['render_jobs_total']
      expect(jobsCounter).toBeDefined()
      
      const queueGauge = metrics.gauges['render_queue_size']
      expect(queueGauge[0].value).toBe(5)
    })

    it('should track API metrics', () => {
      apiMetrics.requestsTotal('GET', '/api/test', 200)
      apiMetrics.requestDuration(0.1, 'GET', '/api/test')
      apiMetrics.errorsTotal('validation', '/api/test')

      const metrics = getMetricsJson()
      
      expect(metrics.counters['api_requests_total']).toBeDefined()
      expect(metrics.counters['api_errors_total']).toBeDefined()
      expect(metrics.histograms['api_request_duration_seconds']).toBeDefined()
    })

    it('should track database metrics', () => {
      dbMetrics.queriesTotal('select', 'users')
      dbMetrics.queryDuration(0.005, 'select', 'users')
      dbMetrics.connectionPoolSize(10, 5)

      const metrics = getMetricsJson()
      
      expect(metrics.counters['db_queries_total']).toBeDefined()
      expect(metrics.gauges['db_pool_active_connections']).toBeDefined()
      expect(metrics.gauges['db_pool_idle_connections']).toBeDefined()
    })

    it('should track TTS metrics', () => {
      ttsMetrics.requestsTotal('elevenlabs', 'success')
      ttsMetrics.duration(2.5, 'elevenlabs')
      ttsMetrics.charactersProcessed(500, 'elevenlabs')

      const metrics = getMetricsJson()
      
      expect(metrics.counters['tts_requests_total']).toBeDefined()
      expect(metrics.histograms['tts_duration_seconds']).toBeDefined()
      expect(metrics.counters['tts_characters_total']).toBeDefined()
    })

    it('should track avatar metrics', () => {
      avatarMetrics.rendersTotal('heygen', 'success')
      avatarMetrics.duration(45, 'heygen')

      const metrics = getMetricsJson()
      
      expect(metrics.counters['avatar_renders_total']).toBeDefined()
      expect(metrics.histograms['avatar_render_duration_seconds']).toBeDefined()
    })
  })

  describe('Reset Metrics', () => {
    it('should clear all metrics', () => {
      incrementCounter('counter1')
      setGauge('gauge1', 10)
      observeHistogram('histogram1', 0.5)

      resetMetrics()

      const metrics = getMetricsJson()
      expect(Object.keys(metrics.counters)).toHaveLength(0)
      expect(Object.keys(metrics.gauges)).toHaveLength(0)
      expect(Object.keys(metrics.histograms)).toHaveLength(0)
    })
  })
})
