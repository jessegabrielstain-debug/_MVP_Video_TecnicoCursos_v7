/**
 * Analytics Configuration
 * Centraliza configurações do sistema de analytics
 */

export const analyticsConfig = {
  ENABLED: true,
  // Tracking
  enableTracking: true,
  trackingInterval: 5000, // ms
  batchSize: 50,
  
  // Performance
  performanceThreshold: 2000, // ms
  slowQueryThreshold: 1000, // ms
  
  // Alerts
  enableAlerts: true,
  alertRetentionDays: 30,
  maxAlertsPerHour: 100,
  ALERTS: {
    EMAIL_FROM: process.env.ALERT_EMAIL_FROM || 'alerts@example.com',
  },
  
  // Reports
  defaultReportFormat: 'json' as const,
  maxReportSize: 10 * 1024 * 1024, // 10MB
  reportRetentionDays: 90,
  REPORTS: {
    STORAGE_PATH: 'reports',
    EMAIL_FROM: process.env.REPORT_EMAIL_FROM || 'reports@example.com',
  },
  
  // Export
  allowedExportFormats: ['json', 'csv', 'xlsx'] as const,
  maxExportRows: 100000,
  
  // Real-time
  realtimeUpdateInterval: 1000, // ms
  maxRealtimeConnections: 100,
} as const;

export type AnalyticsConfig = typeof analyticsConfig;

export const ANALYTICS_CONFIG = analyticsConfig;

export function validateConfig(config: Partial<AnalyticsConfig> = {}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  // Basic validation logic
  if (config.trackingInterval && config.trackingInterval < 100) errors.push('Tracking interval too low');
  if (config.batchSize && config.batchSize < 1) errors.push('Batch size too low');
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function getEnvironmentInfo() {
  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      analytics: true,
      realtime: true,
      reports: true
    }
  };
}
