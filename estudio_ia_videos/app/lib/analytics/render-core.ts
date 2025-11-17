/**
 * Core puro de métricas de render para facilitar testes unitários.
 */

import type { RenderJobSettings } from '../queue/setup'

export interface BasicRenderJob {
  id: string
  status: string
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  render_settings?: RenderJobSettings | null
}

export interface BasicStatsResult {
  total_renders: number
  successful_renders: number
  failed_renders: number
  avg_render_time: number
  total_render_time: number
  success_rate: number
}

export function computeBasicStats(jobs: BasicRenderJob[]): BasicStatsResult {
  const total = jobs.length
  const successful = jobs.filter(j => j.status === 'completed').length
  const failed = jobs.filter(j => j.status === 'failed').length
  const completed = jobs.filter(j => j.status === 'completed' && j.started_at && j.completed_at)
  const times = completed.map(j => {
    const s = new Date(j.started_at as string).getTime()
    const e = new Date(j.completed_at as string).getTime()
    return e > s ? (e - s) / 1000 : 0
  }).filter(t => t > 0)
  const totalTime = times.reduce((a, b) => a + b, 0)
  const avg = times.length ? totalTime / times.length : 0
  return {
    total_renders: total,
    successful_renders: successful,
    failed_renders: failed,
    avg_render_time: Math.round(avg),
    total_render_time: totalTime,
    success_rate: total ? Math.round((successful / total) * 100) : 0
  }
}

export interface PerformanceMetricsResult {
  fastest_render: number
  slowest_render: number
  most_common_resolution: string
  most_common_format: string
  p50_render_time?: number
  p90_render_time?: number
  p95_render_time?: number
}

export function computePerformanceMetrics(jobs: BasicRenderJob[]): PerformanceMetricsResult {
  const completed = jobs.filter(j => j.status === 'completed' && j.started_at && j.completed_at)
  const times = completed.map(j => {
    const s = new Date(j.started_at as string).getTime()
    const e = new Date(j.completed_at as string).getTime()
    return e > s ? (e - s) / 1000 : 0
  }).filter(t => t > 0)
  const fastest = times.length ? Math.min(...times) : 0
  const slowest = times.length ? Math.max(...times) : 0

  const sorted = [...times].sort((a, b) => a - b)
  const pct = (p: number) => {
    if (!sorted.length) return 0
    const idx = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))
    return sorted[idx]
  }

  const resolutionCounts: Record<string, number> = {}
  const formatCounts: Record<string, number> = {}
  for (const j of completed) {
    const settings = j.render_settings
    const res = settings?.resolution ?? 'unknown'
    const fmt = settings?.format ?? 'unknown'
    resolutionCounts[res] = (resolutionCounts[res] || 0) + 1
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1
  }

  const mostCommonResolution = Object.entries(resolutionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
  const mostCommonFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  return {
    fastest_render: fastest,
    slowest_render: slowest,
    most_common_resolution: mostCommonResolution,
    most_common_format: mostCommonFormat,
    p50_render_time: pct(0.5),
    p90_render_time: pct(0.9),
    p95_render_time: pct(0.95)
  }
}

export interface ErrorAnalysisItem {
  error_type: string
  count: number
  last_occurrence: string
}

export function computeErrorAnalysis(jobs: BasicRenderJob[], limit = 10): ErrorAnalysisItem[] {
  const failed = jobs.filter(j => j.status === 'failed' && j.error_message)
  const groups: Record<string, ErrorAnalysisItem> = {}
  for (const j of failed) {
    const raw = j.error_message as string
    const type = (raw?.split(':')[0] || raw || 'unknown').trim()
    if (!groups[type]) {
      groups[type] = { error_type: type, count: 0, last_occurrence: j.created_at }
    }
    groups[type].count++
    if (new Date(j.created_at) > new Date(groups[type].last_occurrence)) {
      groups[type].last_occurrence = j.created_at
    }
  }
  return Object.values(groups).sort((a, b) => b.count - a.count).slice(0, limit)
}

export interface NormalizedErrorCategory {
  category: string
  count: number
  sample_errors: string[]
}

export function normalizeErrorMessage(msg: string): string {
  if (!msg) return 'unknown'
  const lower = msg.toLowerCase()
  if (lower.includes('ffmpeg')) return 'ffmpeg'
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('dns')) return 'network'
  if (lower.includes('s3') || lower.includes('storage') || lower.includes('bucket')) return 'storage'
  if (lower.includes('permission') || lower.includes('auth')) return 'auth'
  if (lower.includes('memory') || lower.includes('out of memory')) return 'resource'
  if (lower.includes('validation') || lower.includes('invalid')) return 'validation'
  if (lower.includes('timeout')) return 'timeout'
  return 'unknown'
}

export function computeErrorCategories(jobs: BasicRenderJob[], limit = 10): NormalizedErrorCategory[] {
  const failed = jobs.filter(j => j.status === 'failed' && j.error_message)
  const groups: Record<string, NormalizedErrorCategory> = {}
  for (const j of failed) {
    const raw = j.error_message as string
    const cat = normalizeErrorMessage(raw)
    if (!groups[cat]) {
      groups[cat] = { category: cat, count: 0, sample_errors: [] }
    }
    groups[cat].count++
    if (groups[cat].sample_errors.length < 3) {
      groups[cat].sample_errors.push(raw.slice(0, 200))
    }
  }
  return Object.values(groups)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export interface QueueStatsResult {
  current_queue_length: number
  processing_jobs: number
  avg_wait_time: number
  peak_queue_time: string
}

export function computeQueueStats(jobs: BasicRenderJob[]): QueueStatsResult {
  const pending = jobs.filter(j => j.status === 'queued')
  const processing = jobs.filter(j => j.status === 'processing')
  const started = jobs.filter(j => j.started_at)
  const waits = started.map(j => {
    const created = new Date(j.created_at).getTime()
    const startedAt = new Date(j.started_at as string).getTime()
    return startedAt > created ? (startedAt - created) / 1000 : 0
  }).filter(v => v > 0)
  const avgWait = waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : 0
  return {
    current_queue_length: pending.length,
    processing_jobs: processing.length,
    avg_wait_time: Math.round(avgWait),
    peak_queue_time: new Date().toISOString()
  }
}
