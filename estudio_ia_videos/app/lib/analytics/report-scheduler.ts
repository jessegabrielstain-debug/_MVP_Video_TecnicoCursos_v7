import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { ReportGenerator, ReportType } from './report-generator';
import { logger } from '@/lib/logger';

export interface ScheduledReport {
  id: string;
  type: ReportType;
  schedule: string; // 'daily' | 'weekly' | 'monthly'
  recipients: string[];
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  organizationId?: string;
  createdAt: Date;
}

export interface SchedulerStats {
  totalScheduled: number;
  activeReports: number;
  lastExecution?: Date;
  failedExecutions: number;
}

export class ReportScheduler {
  
  async getScheduledReports(organizationId?: string): Promise<ScheduledReport[]> {
    const reports = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'report_schedule',
        ...(organizationId && { 
          eventData: {
            path: ['organizationId'],
            equals: organizationId
          }
        })
      },
      orderBy: { createdAt: 'desc' }
    });

    return reports.map(r => {
      const data = r.eventData as Record<string, unknown>;
      return {
        id: r.id,
        type: (data.type as ReportType) || 'performance',
        schedule: (data.schedule as string) || 'daily',
        recipients: (data.recipients as string[]) || [],
        isActive: (data.isActive as boolean) ?? true,
        lastRun: data.lastRun ? new Date(data.lastRun as string) : undefined,
        nextRun: data.nextRun ? new Date(data.nextRun as string) : undefined,
        organizationId: (data.organizationId as string) || undefined,
        createdAt: r.createdAt
      };
    });
  }

  async getSchedulerStats(): Promise<SchedulerStats> {
    const reports = await this.getScheduledReports();
    
    // Get execution logs
    const executions = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'report_execution',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    const failedExecutions = await prisma.analyticsEvent.count({
      where: {
        eventType: 'report_execution',
        eventData: {
          path: ['status'],
          equals: 'error'
        },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    return {
      totalScheduled: reports.length,
      activeReports: reports.filter(r => r.isActive).length,
      lastExecution: executions[0]?.createdAt,
      failedExecutions
    };
  }

  async runScheduledReports(): Promise<{ processed: number, errors: number }> {
    const reports = await this.getScheduledReports();
    const activeReports = reports.filter(r => r.isActive);
    const generator = new ReportGenerator();
    let processed = 0;
    let errors = 0;

    for (const report of activeReports) {
      try {
        // Check if it's time to run
        if (this.shouldRun(report)) {
          await generator.generateReport(report.type, report.organizationId);
          
          // Update last run
          await this.updateReportData(report.id, {
            lastRun: new Date().toISOString(),
            nextRun: this.calculateNextRun(report.schedule).toISOString()
          });

          // Log execution
          await prisma.analyticsEvent.create({
            data: {
              eventType: 'report_execution',
              eventData: {
                action: report.type,
                status: 'success',
                label: `Executed ${report.type} report`,
                organizationId: report.organizationId,
                reportId: report.id
              }
            }
          });
          
          processed++;
        }
      } catch (error) {
        logger.error(`Failed to run report ${report.id}:`, error instanceof Error ? error : new Error(String(error)), { component: 'ReportScheduler' });
        errors++;
        
        await prisma.analyticsEvent.create({
          data: {
            eventType: 'report_execution',
            eventData: {
              action: report.type,
              status: 'error',
              label: `Failed execution`,
              organizationId: report.organizationId,
              reportId: report.id,
              error: error instanceof Error ? error.message : String(error)
            }
          }
        });
      }
    }

    return { processed, errors };
  }

  async toggleReportStatus(reportId: string, isActive: boolean): Promise<void> {
    await this.updateReportData(reportId, { isActive });
  }

  async deleteScheduledReport(reportId: string): Promise<void> {
    await prisma.analyticsEvent.delete({
      where: { id: reportId }
    });
  }

  // Helper methods

  private async updateReportData(id: string, updates: Record<string, unknown>): Promise<void> {
    const report = await prisma.analyticsEvent.findUnique({ where: { id } });
    if (!report) return;

    const currentData = (report.eventData as Record<string, unknown>) || {};
    
    await prisma.analyticsEvent.update({
      where: { id },
      data: {
        eventData: {
          ...currentData,
          ...updates
        } as Prisma.InputJsonValue
      }
    });
  }

  private shouldRun(report: ScheduledReport): boolean {
    if (!report.nextRun) return true; // First run
    return new Date() >= report.nextRun;
  }

  private calculateNextRun(schedule: string): Date {
    const now = new Date();
    const next = new Date(now);
    
    switch (schedule) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(8, 0, 0, 0);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        next.setHours(8, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(8, 0, 0, 0);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }
    
    return next;
  }
}
