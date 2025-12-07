// Simple in-memory metrics collector (per-process, not suitable for distributed setups without shared store)

export interface MetricsSnapshot {
  rate_limit_hits: number
  errors_total: number
  errors_by_code: Record<string, number>
  uptime_ms: number
}

interface Metrics {
  rate_limit_hits: number
  errors: Record<string, number>
  startTime: number
}

type GlobalWithMetrics = typeof globalThis & {
  __metrics?: Metrics
}

const getMetrics = (): Metrics => {
  const g = globalThis as GlobalWithMetrics
  if (!g.__metrics) {
    g.__metrics = {
      rate_limit_hits: 0,
      errors: {},
      startTime: Date.now()
    }
  }
  return g.__metrics
}

export function recordRateLimitHit() {
  const m = getMetrics()
  m.rate_limit_hits += 1
}

export function recordError(code: string) {
  const m = getMetrics()
  m.errors[code] = (m.errors[code] || 0) + 1
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const m = getMetrics()
  return {
    rate_limit_hits: m.rate_limit_hits,
    errors_total: Object.values(m.errors).reduce((a, b) => a + b, 0),
    errors_by_code: { ...m.errors },
    uptime_ms: Date.now() - m.startTime
  }
}

export function resetMetrics() {
  const g = globalThis as GlobalWithMetrics
  g.__metrics = {
    rate_limit_hits: 0,
    errors: {},
    startTime: Date.now()
  }
}
