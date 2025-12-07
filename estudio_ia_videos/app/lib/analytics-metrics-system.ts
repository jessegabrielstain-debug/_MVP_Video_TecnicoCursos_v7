/**
 * Analytics Metrics System
 * Sistema central de métricas e KPIs
 */

import { createClient } from '@supabase/supabase-js';

export type EventType = string;
export type MetricCategory = string;

export const AggregationPeriod = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;

export type AggregationPeriod = typeof AggregationPeriod[keyof typeof AggregationPeriod];

interface MetricDefinition {
  [key: string]: any;
}

// Removed duplicate MetricValue interface

export interface AnalyticsEvent {
  id: string;
  type: string;
  userId?: string;
  timestamp: Date;
  properties?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface PerformanceStats {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  avg_duration_ms: number;
}

export interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface FunnelStep {
  name: string;
  event: string;
}

export interface FunnelResult {
  name: string;
  steps: FunnelStep[];
  results: {
    step: string;
    count: number;
    conversionRate: number;
  }[];
}

export interface TrackEventInput {
  type: string;
  properties?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EventFilters {
  types?: string[];
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  limit?: number;
}

export interface MetricFilters {
  startDate?: Date;
  endDate?: Date;
}

export interface ABTestConfig {
  name: string;
  variants: string[];
  metric: string;
  startDate: Date;
  endDate: Date;
}

export interface CohortAnalysisResult {
  cohortPeriod: string;
  metric: string;
  cohorts: unknown[];
  note: string;
}

export interface ABTestResult {
  name: string;
  variants: {
    name: string;
    conversions: number;
    total: number;
    rate: number;
  }[];
  winner?: string;
}

export class AnalyticsMetricsSystem {
  private static instance: AnalyticsMetricsSystem;
  private supabase;

  private constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  static getInstance(): AnalyticsMetricsSystem {
    if (!AnalyticsMetricsSystem.instance) {
      AnalyticsMetricsSystem.instance = new AnalyticsMetricsSystem();
    }
    return AnalyticsMetricsSystem.instance;
  }

  async trackEvent(type: string, properties?: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<AnalyticsEvent> {
    const event = {
      event_type: type,
      event_data: { properties, metadata },
      created_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('analytics_events')
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(`Failed to track event: ${error.message}`);

    return {
      id: data.id,
      type: data.event_type,
      userId: data.user_id,
      timestamp: new Date(data.created_at),
      properties: data.event_data?.properties,
      metadata: data.event_data?.metadata,
    };
  }

  async trackEventsBatch(events: TrackEventInput[]): Promise<AnalyticsEvent[]> {
    const dbEvents = events.map(e => ({
      event_type: e.type,
      event_data: { properties: e.properties, metadata: e.metadata },
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await this.supabase
      .from('analytics_events')
      .insert(dbEvents)
      .select();

    if (error) throw new Error(`Failed to track events batch: ${error.message}`);

    return data.map(d => ({
      id: d.id,
      type: d.event_type,
      userId: d.user_id,
      timestamp: new Date(d.created_at),
      properties: d.event_data?.properties,
      metadata: d.event_data?.metadata,
    }));
  }

  async getEvents(filters: EventFilters): Promise<AnalyticsEvent[]> {
    let query = this.supabase.from('analytics_events').select('*');

    if (filters.types) query = query.in('event_type', filters.types);
    if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
    if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get events: ${error.message}`);

    return data.map(d => ({
      id: d.id,
      type: d.event_type,
      userId: d.user_id,
      timestamp: new Date(d.created_at),
      properties: d.event_data?.properties,
      metadata: d.event_data?.metadata,
    }));
  }

  async getMetrics(filters: MetricFilters): Promise<MetricValue[]> {
    // Basic implementation fetching from analytics_events
    // This assumes we store metrics as events with 'metric_record' type
    let query = this.supabase.from('analytics_events')
      .select('*')
      .eq('event_type', 'metric_record');

    if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
    if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());
    
    const { data, error } = await query;
    if (error) return [];

    return data.map((d: { event_data: { value: number; labels: Record<string, string> }; created_at: string }) => ({
      value: d.event_data?.value || 0,
      timestamp: new Date(d.created_at),
      labels: d.event_data?.labels
    }));
  }

  async createConversionFunnel(name: string, steps: FunnelStep[], startDate: Date, endDate: Date): Promise<FunnelResult> {
    // Basic funnel implementation
    const funnelResults = [];
    let previousCount = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const { count, error } = await this.supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', step.event)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      const currentCount = count || 0;
      const conversionRate = i === 0 ? 100 : (previousCount > 0 ? (currentCount / previousCount) * 100 : 0);
      
      funnelResults.push({
        step: step.name,
        count: currentCount,
        conversionRate: Math.round(conversionRate * 100) / 100
      });
      
      previousCount = currentCount;
    }

    return { name, steps, results: funnelResults };
  }

  async performCohortAnalysis(cohortPeriod: string, metric: string, startDate: Date, endDate: Date, periods: number): Promise<CohortAnalysisResult> {
    // Simplified cohort analysis (just returning structure for now as real SQL cohort is complex)
    // In a real scenario, this would be a complex SQL query or a call to a dedicated analytics service (Mixpanel/PostHog)
    return { 
      cohortPeriod, 
      metric, 
      cohorts: [], 
      note: "Cohort analysis requires advanced SQL aggregation not yet implemented in MVP" 
    };
  }

  async createABTest(config: ABTestConfig): Promise<ABTestResult> {
    // Store A/B test config in a 'experiments' table or similar (using analytics_events for now)
    const event = {
      event_type: 'ab_test_created',
      event_data: config,
      created_at: new Date().toISOString(),
    };
    
    await this.supabase.from('analytics_events').insert(event).select().single();
    
    // Return empty result structure for now
    return {
      name: config.name,
      variants: config.variants.map(v => ({
        name: v,
        conversions: 0,
        total: 0,
        rate: 0
      })),
      winner: undefined
    };
  }

  async getABTestResults(testName: string): Promise<ABTestResult> {
    // Fetch results based on test name
    return { 
      name: testName, 
      variants: [], 
      winner: undefined 
    };
  }

  async calculateUsageStats(period: AggregationPeriod, startDate: Date, endDate: Date): Promise<Record<string, number>> {
    // Example: Count events by type
    const { data, error } = await this.supabase
      .from('analytics_events')
      .select('event_type')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw new Error(`Failed to calculate usage stats: ${error.message}`);

    const stats: Record<string, number> = {};
    data.forEach((row: { event_type: string }) => {
      stats[row.event_type] = (stats[row.event_type] || 0) + 1;
    });

    return stats;
  }

  async calculatePerformanceStats(period: AggregationPeriod, startDate: Date, endDate: Date): Promise<PerformanceStats> {
    // Example: Render job stats
    const { data, error } = await this.supabase
      .from('render_jobs')
      .select('status, duration_ms')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw new Error(`Failed to calculate performance stats: ${error.message}`);

    const total = data.length;
    const completed = data.filter((j: { status: string }) => j.status === 'completed');
    const failed = data.filter((j: { status: string }) => j.status === 'failed');
    const avgDuration = completed.reduce((acc: number, j: { duration_ms?: number }) => acc + (j.duration_ms || 0), 0) / (completed.length || 1);

    return {
      total_jobs: total,
      completed_jobs: completed.length,
      failed_jobs: failed.length,
      avg_duration_ms: avgDuration,
    };
  }
  
  // Methods from previous version to keep compatibility if used elsewhere
  defineMetric(definition: MetricDefinition): void {}
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {}
  getMetric(name: string): MetricValue[] { return []; }
  getAllMetrics(): Map<string, MetricValue[]> { return new Map(); }
  clearMetrics(): void {}
}

export const metricsSystem = AnalyticsMetricsSystem.getInstance();
