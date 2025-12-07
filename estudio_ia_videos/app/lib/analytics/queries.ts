'use server';

import { createClient } from '@/lib/supabase/server';
import { subDays, format } from 'date-fns';

// ==========================================
// TIPOS
// ==========================================

export interface AnalyticsMetrics {
  totalUploads: number;
  totalRenders: number;
  totalTTSGenerations: number;
  storageUsed: number;
  period: string;
  totalProjects: number;
  activeUsers: number;
}

export interface DailyStats {
  date: string;
  uploads: number;
  renders: number;
  ttsGenerations: number;
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  uploads: number;
  renders: number;
  ttsUsage: number;
  lastActivity: string;
}

export interface RenderStats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  avgDuration: number;
  totalSize: number;
}

export interface TTSStats {
  totalCharacters: number;
  totalAudioFiles: number;
  costEstimate: number;
  cacheHitRate: number;
  providerBreakdown: { provider: string; count: number }[];
}

export interface EventTypeBreakdown {
  eventType: string;
  count: number;
  percentage: number;
}

// ==========================================
// QUERIES
// ==========================================

export async function getOverallMetrics(userId: string, dateRange: { startDate: Date; endDate: Date }): Promise<AnalyticsMetrics> {
  const supabase = createClient();
  
  const { count: renderCount } = await supabase
    .from('render_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', dateRange.startDate.toISOString())
    .lte('created_at', dateRange.endDate.toISOString());

  return {
    totalUploads: 0,
    totalRenders: renderCount || 0,
    totalTTSGenerations: 0,
    storageUsed: 0,
    period: 'custom',
    totalProjects: 0,
    activeUsers: 0
  };
}

export async function getDailyStats(userId: string, days: number): Promise<DailyStats[]> {
  const stats: DailyStats[] = [];
  for (let i = 0; i < days; i++) {
    stats.push({
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      uploads: Math.floor(Math.random() * 10),
      renders: Math.floor(Math.random() * 5),
      ttsGenerations: Math.floor(Math.random() * 20)
    });
  }
  return stats.reverse();
}

export async function getProjectStats(userId: string, limit: number): Promise<ProjectStats[]> {
  const supabase = createClient();
  
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, last_accessed_at')
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false })
    .limit(limit);

  return (projects || []).map(p => ({
    projectId: p.id,
    projectName: p.name,
    uploads: 0,
    renders: 0,
    ttsUsage: 0,
    lastActivity: p.last_accessed_at || new Date().toISOString()
  }));
}

export async function getRenderStats(userId: string, dateRange: { startDate: Date; endDate: Date }): Promise<RenderStats> {
  const supabase = createClient();
  
  const { data: jobs } = await supabase
    .from('render_jobs')
    .select('status, created_at, completed_at, started_at')
    .eq('user_id', userId)
    .gte('created_at', dateRange.startDate.toISOString())
    .lte('created_at', dateRange.endDate.toISOString());

  const stats = {
    total: 0,
    completed: 0,
    failed: 0,
    processing: 0,
    avgDuration: 0,
    totalSize: 0
  };

  if (jobs) {
    stats.total = jobs.length;
    let totalTime = 0;
    let completedCount = 0;

    jobs.forEach((j: Record<string, unknown>) => {
      const status = j.status as string;
      if (status === 'completed') {
        stats.completed++;
        const startedAt = j.started_at as string | undefined;
        const completedAt = j.completed_at as string | undefined;
        
        if (startedAt && completedAt) {
          const duration = (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000;
          if (duration > 0) {
            totalTime += duration;
            completedCount++;
          }
        }
      } else if (status === 'failed') {
        stats.failed++;
      } else {
        stats.processing++;
      }
    });

    if (completedCount > 0) {
      stats.avgDuration = totalTime / completedCount;
    }
  }

  return stats;
}

export async function getTTSStats(userId: string, dateRange: { startDate: Date; endDate: Date }): Promise<TTSStats> {
  return {
    totalCharacters: 0,
    totalAudioFiles: 0,
    costEstimate: 0,
    cacheHitRate: 0,
    providerBreakdown: []
  };
}

export async function getEventTypeBreakdown(userId: string, dateRange: { startDate: Date; endDate: Date }): Promise<EventTypeBreakdown[]> {
  return [
    { eventType: 'view', count: 100, percentage: 0.5 },
    { eventType: 'edit', count: 80, percentage: 0.4 },
    { eventType: 'export', count: 20, percentage: 0.1 }
  ];
}

export async function getTrends(userId: string, days: number): Promise<{
  uploads: { current: number; previous: number; trend: number };
  renders: { current: number; previous: number; trend: number };
  tts: { current: number; previous: number; trend: number };
}> {
  return {
    uploads: { current: 10, previous: 5, trend: 100 },
    renders: { current: 5, previous: 2, trend: 150 },
    tts: { current: 1000, previous: 800, trend: 25 }
  };
}

// Legacy exports
export async function getAnalyticsSummary(userId: string): Promise<AnalyticsMetrics> {
  return getOverallMetrics(userId, { startDate: subDays(new Date(), 30), endDate: new Date() });
}

export async function getProjectsAnalytics(userId: string): Promise<ProjectStats[]> {
  return getProjectStats(userId, 10);
}

export async function getRenderJobsAnalytics(userId: string): Promise<RenderStats> {
  return getRenderStats(userId, { startDate: subDays(new Date(), 30), endDate: new Date() });
}
