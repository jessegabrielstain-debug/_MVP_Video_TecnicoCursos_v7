import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ReportPeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface ReportData {
  period: ReportPeriod;
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    avgDuration: number;
    errorRate: number;
  };
  breakdown: {
    byCategory: Array<{ category: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  };
  performance: {
    p95Duration: number;
    slowestEndpoints: Array<{ endpoint: string; duration: number }>;
  };
}

export class ReportGenerator {
  
  public getDateRange(type: ReportType, date: Date = new Date()): ReportPeriod {
    let start: Date;
    let end: Date;
    let label: string;

    switch (type) {
      case 'daily':
        start = startOfDay(date);
        end = endOfDay(date);
        label = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        start = startOfWeek(date);
        end = endOfWeek(date);
        label = `Week ${getWeekNumber(date)} ${date.getFullYear()}`;
        break;
      case 'monthly':
        start = startOfMonth(date);
        end = endOfMonth(date);
        label = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        break;
      default:
        start = startOfDay(date);
        end = endOfDay(date);
        label = 'Custom';
    }

    return { start, end, label };
  }

  async generateReport(type: ReportType, organizationId?: string, date: Date = new Date()): Promise<ReportData> {
    const period = this.getDateRange(type, date);
    
    // Base query conditions
    const whereClause = Prisma.sql`
      created_at >= ${period.start} 
      AND created_at <= ${period.end}
      ${organizationId ? Prisma.sql`AND organization_id = ${organizationId}` : Prisma.sql``}
    `;

    // 1. Summary Stats
    const summaryStats = await prisma.$queryRaw<Array<{ count: bigint, avg_duration: number }>>`
      SELECT 
        COUNT(*) as count,
        AVG((event_data->>'duration')::numeric) as avg_duration
      FROM analytics_events
      WHERE ${whereClause}
    `;

    const uniqueUsers = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT user_id) as count
      FROM analytics_events
      WHERE ${whereClause}
    `;

    const errorStats = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE ${whereClause}
      AND event_data->>'status' = 'error'
    `;

    const totalEvents = Number(summaryStats[0]?.count || 0);
    const errorCount = Number(errorStats[0]?.count || 0);

    // 2. Breakdown by Category
    const byCategory = await prisma.$queryRaw<Array<{ category: string, count: bigint }>>`
      SELECT 
        event_data->>'category' as category,
        COUNT(*) as count
      FROM analytics_events
      WHERE ${whereClause}
      GROUP BY event_data->>'category'
      ORDER BY count DESC
      LIMIT 10
    `;

    // 3. Breakdown by Status
    const byStatus = await prisma.$queryRaw<Array<{ status: string, count: bigint }>>`
      SELECT 
        event_data->>'status' as status,
        COUNT(*) as count
      FROM analytics_events
      WHERE ${whereClause}
      GROUP BY event_data->>'status'
    `;

    // 4. Top Actions
    const topActions = await prisma.$queryRaw<Array<{ action: string, count: bigint }>>`
      SELECT 
        event_data->>'action' as action,
        COUNT(*) as count
      FROM analytics_events
      WHERE ${whereClause}
      GROUP BY event_data->>'action'
      ORDER BY count DESC
      LIMIT 10
    `;

    // 5. Performance (p95)
    // Note: percentile_cont requires more complex query or extension, using simple approx here or just max/avg
    const performanceStats = await prisma.$queryRaw<Array<{ p95: number }>>`
      SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (event_data->>'duration')::numeric) as p95
      FROM analytics_events
      WHERE ${whereClause}
      AND event_data->>'duration' IS NOT NULL
    `;

    const slowestEndpoints = await prisma.$queryRaw<Array<{ endpoint: string, duration: number }>>`
      SELECT 
        event_data->'metadata'->>'endpoint' as endpoint,
        AVG((event_data->>'duration')::numeric) as duration
      FROM analytics_events
      WHERE ${whereClause}
      AND event_data->'metadata'->>'endpoint' IS NOT NULL
      GROUP BY event_data->'metadata'->>'endpoint'
      ORDER BY duration DESC
      LIMIT 5
    `;

    return {
      period,
      summary: {
        totalEvents,
        uniqueUsers: Number(uniqueUsers[0]?.count || 0),
        avgDuration: Math.round(Number(summaryStats[0]?.avg_duration || 0)),
        errorRate: totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0
      },
      breakdown: {
        byCategory: byCategory.map(i => ({ category: i.category || 'unknown', count: Number(i.count) })),
        byStatus: byStatus.map(i => ({ status: i.status || 'unknown', count: Number(i.count) })),
        topActions: topActions.map(i => ({ action: i.action || 'unknown', count: Number(i.count) }))
      },
      performance: {
        p95Duration: Math.round(Number(performanceStats[0]?.p95 || 0)),
        slowestEndpoints: slowestEndpoints.map(i => ({ endpoint: i.endpoint || 'unknown', duration: Math.round(Number(i.duration)) }))
      }
    };
  }

  async generateHTMLReport(data: ReportData | Record<string, unknown>): Promise<string> {
    // Cast to ReportData if it matches structure, otherwise use generic rendering
    const report = data as ReportData;
    const isStructured = report.summary && report.breakdown;

    const css = `
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        h2 { color: #444; margin-top: 2rem; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
        .card { background: #f9fafb; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb; }
        .card-value { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
        .card-label { font-size: 0.875rem; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; }
        .footer { margin-top: 3rem; font-size: 0.875rem; color: #9ca3af; text-align: center; }
      </style>
    `;

    if (!isStructured) {
      return `
        <!DOCTYPE html>
        <html>
        <head><title>Analytics Report</title>${css}</head>
        <body>
          <h1>Analytics Report</h1>
          <p>Generated at: ${new Date().toLocaleString()}</p>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report - ${report.period.label}</title>
        ${css}
      </head>
      <body>
        <h1>Analytics Report</h1>
        <p class="text-gray-500">Period: ${report.period.label} (${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()})</p>
        
        <div class="summary-grid">
          <div class="card">
            <div class="card-value">${report.summary.totalEvents.toLocaleString()}</div>
            <div class="card-label">Total Events</div>
          </div>
          <div class="card">
            <div class="card-value">${report.summary.uniqueUsers.toLocaleString()}</div>
            <div class="card-label">Unique Users</div>
          </div>
          <div class="card">
            <div class="card-value">${report.summary.avgDuration}ms</div>
            <div class="card-label">Avg Duration</div>
          </div>
          <div class="card">
            <div class="card-value">${report.summary.errorRate.toFixed(2)}%</div>
            <div class="card-label">Error Rate</div>
          </div>
        </div>

        <h2>Top Categories</h2>
        <table>
          <thead><tr><th>Category</th><th>Count</th></tr></thead>
          <tbody>
            ${report.breakdown.byCategory.map(i => `<tr><td>${i.category}</td><td>${i.count.toLocaleString()}</td></tr>`).join('')}
          </tbody>
        </table>

        <h2>Top Actions</h2>
        <table>
          <thead><tr><th>Action</th><th>Count</th></tr></thead>
          <tbody>
            ${report.breakdown.topActions.map(i => `<tr><td>${i.action}</td><td>${i.count.toLocaleString()}</td></tr>`).join('')}
          </tbody>
        </table>

        <h2>Performance Issues</h2>
        <p>P95 Duration: <strong>${report.performance.p95Duration}ms</strong></p>
        <table>
          <thead><tr><th>Endpoint</th><th>Avg Duration</th></tr></thead>
          <tbody>
            ${report.performance.slowestEndpoints.map(i => `<tr><td>${i.endpoint}</td><td>${i.duration}ms</td></tr>`).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated by Estudio IA Videos Analytics • ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
  }
}

function getWeekNumber(d: Date): number {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
