import { BasicStatsResult, PerformanceMetricsResult, QueueStatsResult, NormalizedErrorCategory } from '@/lib/analytics/render-core';

export function formatPrometheusMetrics(
  basic: BasicStatsResult,
  perf: PerformanceMetricsResult,
  queue: QueueStatsResult,
  errors: NormalizedErrorCategory[]
): string {
  const lines: string[] = [];

  const addMetric = (name: string, value: number, help: string, type: 'gauge' | 'counter', labels: Record<string, string> = {}) => {
    lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} ${type}`);
    const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
    lines.push(`${name}${labelStr ? `{${labelStr}}` : ''} ${value}`);
  };

  // Basic Stats
  addMetric('render_jobs_total', basic.total_renders, 'Total number of render jobs', 'counter');
  addMetric('render_jobs_successful_total', basic.successful_renders, 'Total successful render jobs', 'counter');
  addMetric('render_jobs_failed_total', basic.failed_renders, 'Total failed render jobs', 'counter');
  addMetric('render_duration_seconds_avg', basic.avg_render_time, 'Average render duration in seconds', 'gauge');
  addMetric('render_success_rate', basic.success_rate, 'Success rate percentage', 'gauge');

  // Performance
  addMetric('render_duration_seconds_p50', perf.p50_render_time || 0, '50th percentile render duration', 'gauge');
  addMetric('render_duration_seconds_p90', perf.p90_render_time || 0, '90th percentile render duration', 'gauge');
  addMetric('render_duration_seconds_p95', perf.p95_render_time || 0, '95th percentile render duration', 'gauge');

  // Queue
  addMetric('render_queue_length', queue.current_queue_length, 'Current number of jobs in queue', 'gauge');
  addMetric('render_jobs_processing', queue.processing_jobs, 'Current number of jobs being processed', 'gauge');
  addMetric('render_queue_wait_seconds_avg', queue.avg_wait_time, 'Average wait time in queue', 'gauge');

  // Errors
  errors.forEach(err => {
    addMetric('render_errors_total', err.count, 'Total errors by category', 'counter', { category: err.category });
  });

  return lines.join('\n');
}
