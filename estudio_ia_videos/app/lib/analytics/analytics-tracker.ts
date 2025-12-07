/**
 * Analytics Tracker
 * Sistema de tracking de eventos de analytics
 */

export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export interface FunnelAnalysisParams {
  organizationId?: string;
  startDate: Date;
  endDate: Date;
}

export interface ProviderPerformanceParams {
  category: 'tts' | 'render';
  organizationId?: string;
  startDate: Date;
  endDate: Date;
}

export interface SummaryParams {
  organizationId?: string;
  startDate: Date;
  endDate: Date;
}

export interface FunnelData {
  funnel: Array<{ stage: string; count: number; dropoff: number }>;
  conversionRates?: Record<string, number>;
}

export interface SummaryData {
  totalEvents: number;
  avgDuration: number;
  successRate: number;
  errorRate?: number;
}

export interface ProviderPerformance {
  provider: string;
  totalRequests: number;
  successRate: number;
  errorRate: number;
  avgLatency: number;
}

export class AnalyticsTracker {
  private buffer: AnalyticsEvent[] = [];
  
  track(event: string, properties?: Record<string, unknown>, userId?: string) {
    console.log('[Analytics] Track event:', event, properties);
    
    this.buffer.push({
      event,
      userId,
      properties,
      timestamp: new Date(),
    });
  }
  
  async flush(): Promise<void> {
    console.log('[Analytics] Flushing', this.buffer.length, 'events');
    this.buffer = [];
  }
  
  pageView(path: string, userId?: string) {
    this.track('page_view', { path }, userId);
  }
  
  identify(userId: string, traits?: Record<string, unknown>) {
    console.log('[Analytics] Identify user:', userId, traits);
  }

  static async trackTimelineEdit(data: {
    projectId: string;
    version?: number;
    tracksCount?: number;
    trackCount?: number;
    totalDuration?: number;
    userId: string;
    action?: string;
  }) {
    console.log('[Analytics] Timeline Edit:', data);
    // In a real implementation, this would save to the database
  }

  static async getFunnelAnalysis(params: FunnelAnalysisParams): Promise<FunnelData> {
    // Placeholder - retorna dados simulados
    return {
      funnel: [
        { stage: 'upload', count: 100, dropoff: 0 },
        { stage: 'edit', count: 85, dropoff: 15 },
        { stage: 'tts', count: 70, dropoff: 15 },
        { stage: 'render', count: 60, dropoff: 10 },
        { stage: 'download', count: 55, dropoff: 5 },
      ],
      conversionRates: {
        upload_to_edit: 0.85,
        edit_to_tts: 0.82,
        tts_to_render: 0.86,
        render_to_download: 0.92,
        overall: 0.55,
      }
    };
  }

  static async getProviderPerformance(params: ProviderPerformanceParams): Promise<ProviderPerformance[]> {
    // Placeholder - retorna dados simulados
    if (params.category === 'tts') {
      return [
        { provider: 'elevenlabs', totalRequests: 100, successRate: 98, errorRate: 2, avgLatency: 1200 },
        { provider: 'azure', totalRequests: 50, successRate: 99, errorRate: 1, avgLatency: 800 },
        { provider: 'google', totalRequests: 30, successRate: 97, errorRate: 3, avgLatency: 600 },
      ];
    }
    return [
      { provider: 'local', totalRequests: 200, successRate: 95, errorRate: 5, avgLatency: 30000 },
    ];
  }

  static async getSummary(params: SummaryParams): Promise<SummaryData> {
    // Placeholder - retorna dados simulados
    return {
      totalEvents: 500,
      avgDuration: 45000, // ms
      successRate: 92,
      errorRate: 8, // 100 - successRate
    };
  }
}

export const analyticsTracker = new AnalyticsTracker();
