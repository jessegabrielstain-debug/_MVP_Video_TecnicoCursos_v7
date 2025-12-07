import { jobManager } from '@/lib/render/job-manager';
import { computeBasicStats, computePerformanceMetrics, computeQueueStats, computeErrorCategories, BasicRenderJob } from '@/lib/analytics/render-core';
import { metricsCollector } from '@/lib/monitoring/metrics';

export interface DashboardData {
  render: {
    basic: ReturnType<typeof computeBasicStats>;
    performance: ReturnType<typeof computePerformanceMetrics>;
    queue: ReturnType<typeof computeQueueStats>;
    errors: ReturnType<typeof computeErrorCategories>;
  };
  system: {
    metrics: ReturnType<typeof metricsCollector.getMetrics>;
  };
  timestamp: string;
}

export async function getDashboardData(): Promise<DashboardData> {
  // 1. Get Render Metrics (DB-backed)
  // Fetch last 1000 jobs for stats window
  const jobs = await jobManager.listJobs(undefined, 1000);
  
  const basicJobs: BasicRenderJob[] = jobs.map(j => ({
      id: j.id,
      status: j.status,
      created_at: j.createdAt.toISOString(),
      started_at: j.startedAt?.toISOString() || null,
      completed_at: j.completedAt?.toISOString() || null,
      error_message: j.error || null,
      render_settings: null 
  }));

  const basic = computeBasicStats(basicJobs);
  const performance = computePerformanceMetrics(basicJobs);
  const queue = computeQueueStats(basicJobs);
  const errors = computeErrorCategories(basicJobs);

  // 2. Get System Metrics (In-memory)
  const systemMetrics = metricsCollector.getMetrics();

  return {
    render: {
      basic,
      performance,
      queue,
      errors
    },
    system: {
      metrics: systemMetrics
    },
    timestamp: new Date().toISOString()
  };
}
