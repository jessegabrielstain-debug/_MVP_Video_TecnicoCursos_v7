/**
 * Application Metrics Module
 * 
 * Provides custom metrics collection for monitoring and observability.
 * In-memory metrics with Prometheus-style export.
 */

// ============================================================================
// Types
// ============================================================================

export type MetricType = 'counter' | 'gauge' | 'histogram'

export interface MetricLabels {
  [key: string]: string | number
}

interface MetricValue {
  value: number
  labels: MetricLabels
  timestamp: number
}

interface HistogramBucket {
  le: number // less than or equal
  count: number
}

interface HistogramValue {
  buckets: HistogramBucket[]
  sum: number
  count: number
  labels: MetricLabels
  timestamp: number
}

// ============================================================================
// In-memory Storage
// ============================================================================

const counters = new Map<string, MetricValue[]>()
const gauges = new Map<string, MetricValue[]>()
const histograms = new Map<string, HistogramValue[]>()

// Legacy counters (for backward compatibility)
let uploadRequestsTotal = 0
let uploadErrorsTotal = 0

// Default histogram buckets (in seconds)
const DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

// ============================================================================
// Core Metric Functions
// ============================================================================

/**
 * Increment a counter metric
 */
export function incrementCounter(
  name: string,
  labels: MetricLabels = {},
  value: number = 1
): void {
  const existing = counters.get(name) || []
  const labelKey = JSON.stringify(labels)
  
  const existingEntry = existing.find(e => JSON.stringify(e.labels) === labelKey)
  if (existingEntry) {
    existingEntry.value += value
    existingEntry.timestamp = Date.now()
  } else {
    existing.push({ value, labels, timestamp: Date.now() })
    counters.set(name, existing)
  }
}

/**
 * Set a gauge metric
 */
export function setGauge(
  name: string,
  value: number,
  labels: MetricLabels = {}
): void {
  const existing = gauges.get(name) || []
  const labelKey = JSON.stringify(labels)
  
  const existingEntry = existing.find(e => JSON.stringify(e.labels) === labelKey)
  if (existingEntry) {
    existingEntry.value = value
    existingEntry.timestamp = Date.now()
  } else {
    existing.push({ value, labels, timestamp: Date.now() })
    gauges.set(name, existing)
  }
}

/**
 * Observe a histogram value
 */
export function observeHistogram(
  name: string,
  value: number,
  labels: MetricLabels = {},
  buckets: number[] = DEFAULT_BUCKETS
): void {
  const existing = histograms.get(name) || []
  const labelKey = JSON.stringify(labels)
  
  const existingEntry = existing.find(e => JSON.stringify(e.labels) === labelKey)
  if (existingEntry) {
    existingEntry.sum += value
    existingEntry.count += 1
    existingEntry.timestamp = Date.now()
    
    // Update bucket counts
    for (const bucket of existingEntry.buckets) {
      if (value <= bucket.le) {
        bucket.count += 1
      }
    }
  } else {
    const newBuckets = buckets.map(le => ({
      le,
      count: value <= le ? 1 : 0
    }))
    // Add +Inf bucket
    newBuckets.push({ le: Infinity, count: 1 })
    
    existing.push({
      buckets: newBuckets,
      sum: value,
      count: 1,
      labels,
      timestamp: Date.now()
    })
    histograms.set(name, existing)
  }
}

/**
 * Timer utility for measuring duration
 */
export function startTimer() {
  const start = process.hrtime.bigint()
  return {
    /**
     * End timer and record to histogram
     */
    observeDuration(name: string, labels: MetricLabels = {}, buckets?: number[]): number {
      const end = process.hrtime.bigint()
      const durationMs = Number(end - start) / 1_000_000
      const durationSeconds = durationMs / 1000
      observeHistogram(name, durationSeconds, labels, buckets)
      return durationMs
    },
    /**
     * Get elapsed milliseconds without recording
     */
    elapsed(): number {
      const end = process.hrtime.bigint()
      return Number(end - start) / 1_000_000
    }
  }
}

// ============================================================================
// Legacy Functions (Backward Compatibility)
// ============================================================================

export function incUploadRequest() {
  uploadRequestsTotal++
  incrementCounter('app_upload_requests_total')
}

export function incUploadError() {
  uploadErrorsTotal++
  incrementCounter('app_upload_errors_total')
}

// ============================================================================
// Pre-defined Application Metrics
// ============================================================================

/** Render pipeline metrics */
export const renderMetrics = {
  jobsTotal: (status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled') =>
    incrementCounter('render_jobs_total', { status }),
  
  jobDuration: (durationSeconds: number, format: string) =>
    observeHistogram('render_duration_seconds', durationSeconds, { format }, 
      [1, 5, 10, 30, 60, 120, 300, 600]),
  
  queueSize: (size: number) =>
    setGauge('render_queue_size', size),
  
  activeJobs: (count: number) =>
    setGauge('render_active_jobs', count),
}

/** API metrics */
export const apiMetrics = {
  requestsTotal: (method: string, path: string, status: number) =>
    incrementCounter('api_requests_total', { method, path, status: String(status) }),
  
  requestDuration: (durationSeconds: number, method: string, path: string) =>
    observeHistogram('api_request_duration_seconds', durationSeconds, { method, path },
      [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]),
  
  errorsTotal: (type: string, path: string) =>
    incrementCounter('api_errors_total', { type, path }),
}

/** Database metrics */
export const dbMetrics = {
  queriesTotal: (operation: string, table: string) =>
    incrementCounter('db_queries_total', { operation, table }),
  
  queryDuration: (durationSeconds: number, operation: string, table: string) =>
    observeHistogram('db_query_duration_seconds', durationSeconds, { operation, table },
      [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5]),
  
  connectionPoolSize: (active: number, idle: number) => {
    setGauge('db_pool_active_connections', active)
    setGauge('db_pool_idle_connections', idle)
  },
}

/** TTS metrics */
export const ttsMetrics = {
  requestsTotal: (provider: string, status: 'success' | 'error') =>
    incrementCounter('tts_requests_total', { provider, status }),
  
  duration: (durationSeconds: number, provider: string) =>
    observeHistogram('tts_duration_seconds', durationSeconds, { provider },
      [0.5, 1, 2, 5, 10, 30]),
  
  charactersProcessed: (count: number, provider: string) =>
    incrementCounter('tts_characters_total', { provider }, count),
}

/** Avatar metrics */
export const avatarMetrics = {
  rendersTotal: (provider: string, status: 'success' | 'error') =>
    incrementCounter('avatar_renders_total', { provider, status }),
  
  duration: (durationSeconds: number, provider: string) =>
    observeHistogram('avatar_render_duration_seconds', durationSeconds, { provider },
      [5, 10, 30, 60, 120, 300]),
}

// ============================================================================
// Export Functions
// ============================================================================

/** Helper to format labels for Prometheus */
function formatLabels(labels: MetricLabels): string {
  const entries = Object.entries(labels)
  if (entries.length === 0) return ''
  
  const formatted = entries
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`)
    .join(',')
  
  return `{${formatted}}`
}

/**
 * Render metrics in Prometheus text format
 */
export function renderPrometheus(): string {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
  const uptime = process.uptime()
  
  const lines: string[] = [
    // System metrics
    '# HELP app_uptime_seconds Application uptime in seconds',
    '# TYPE app_uptime_seconds gauge',
    `app_uptime_seconds ${uptime.toFixed(0)}`,
    '# HELP app_build_info Build info',
    '# TYPE app_build_info gauge',
    `app_build_info{version="${version}"} 1`,
    '# HELP app_storage_provider Storage provider selected',
    '# TYPE app_storage_provider gauge',
    `app_storage_provider{provider="${provider}"} 1`,
    // Legacy upload metrics
    '# HELP app_upload_requests_total Total upload requests',
    '# TYPE app_upload_requests_total counter',
    `app_upload_requests_total ${uploadRequestsTotal}`,
    '# HELP app_upload_errors_total Total upload errors',
    '# TYPE app_upload_errors_total counter',
    `app_upload_errors_total ${uploadErrorsTotal}`,
    '',
  ]
  
  // Export counters
  for (const [name, values] of counters) {
    if (name.startsWith('app_upload')) continue // Already handled above
    lines.push(`# TYPE ${name} counter`)
    for (const v of values) {
      const labelStr = formatLabels(v.labels)
      lines.push(`${name}${labelStr} ${v.value}`)
    }
  }
  
  // Export gauges
  for (const [name, values] of gauges) {
    lines.push(`# TYPE ${name} gauge`)
    for (const v of values) {
      const labelStr = formatLabels(v.labels)
      lines.push(`${name}${labelStr} ${v.value}`)
    }
  }
  
  // Export histograms
  for (const [name, values] of histograms) {
    lines.push(`# TYPE ${name} histogram`)
    for (const v of values) {
      const labelStr = formatLabels(v.labels)
      
      // Bucket lines
      for (const bucket of v.buckets) {
        const le = bucket.le === Infinity ? '+Inf' : bucket.le
        lines.push(`${name}_bucket${formatLabels({ ...v.labels, le: String(le) })} ${bucket.count}`)
      }
      
      lines.push(`${name}_sum${labelStr} ${v.sum}`)
      lines.push(`${name}_count${labelStr} ${v.count}`)
    }
  }
  
  return lines.join('\n')
}

/**
 * Get all metrics as JSON (for debugging/APIs)
 */
export function getMetricsJson(): {
  system: {
    uptime: number
    version: string
    provider: string
  }
  counters: Record<string, MetricValue[]>
  gauges: Record<string, MetricValue[]>
  histograms: Record<string, HistogramValue[]>
} {
  return {
    system: {
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      provider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),
    },
    counters: Object.fromEntries(counters),
    gauges: Object.fromEntries(gauges),
    histograms: Object.fromEntries(histograms),
  }
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics(): void {
  counters.clear()
  gauges.clear()
  histograms.clear()
  uploadRequestsTotal = 0
  uploadErrorsTotal = 0
}

