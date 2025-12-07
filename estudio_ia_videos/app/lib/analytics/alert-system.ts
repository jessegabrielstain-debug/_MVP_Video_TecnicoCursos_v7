import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type AlertType = 'performance' | 'error' | 'usage' | 'security' | 'system';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    timeWindow: number; // minutes
  };
  channels: string[];
  cooldown: number; // minutes
  isActive: boolean;
}

export interface Alert {
  id: string;
  ruleId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  value: number;
  threshold: number;
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt: Date;
  organizationId?: string;
  userId?: string;
}

export interface EvaluationResult {
  evaluated: number;
  triggered: number;
  alerts: Alert[];
}

export class AlertSystem {
  
  async evaluateAlerts(organizationId?: string): Promise<EvaluationResult> {
    // 1. Fetch active rules
    const rules = await this.getActiveRules(organizationId);
    const alerts: Alert[] = [];

    // 2. Evaluate each rule
    for (const rule of rules) {
      const triggered = await this.evaluateRule(rule);
      if (triggered) {
        alerts.push(triggered);
      }
    }

    return {
      evaluated: rules.length,
      triggered: alerts.length,
      alerts
    };
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = await prisma.analyticsEvent.findUnique({ where: { id: alertId } });
    if (!alert) return;

    const currentData = (alert.eventData as Record<string, unknown>) || {};
    
    await prisma.analyticsEvent.update({
      where: { id: alertId },
      data: {
        eventData: {
          ...currentData,
          status: 'acknowledged',
          acknowledgedBy: userId,
          acknowledgedAt: new Date().toISOString()
        } as Prisma.InputJsonValue
      }
    });
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    const alert = await prisma.analyticsEvent.findUnique({ where: { id: alertId } });
    if (!alert) return;

    const currentData = (alert.eventData as Record<string, unknown>) || {};
    
    await prisma.analyticsEvent.update({
      where: { id: alertId },
      data: {
        eventData: {
          ...currentData,
          status: 'resolved',
          resolvedBy: userId,
          resolvedAt: new Date().toISOString()
        } as Prisma.InputJsonValue
      }
    });
  }

  private async getActiveRules(organizationId?: string): Promise<AlertRule[]> {
    const rules = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'alert_rule',
        eventData: {
          path: ['status'],
          equals: 'active'
        },
        ...(organizationId && { 
          eventData: {
            path: ['organizationId'],
            equals: organizationId
          }
        })
      }
    });

    return rules.map(r => {
      const data = r.eventData as Record<string, unknown>;
      return {
        id: r.id,
        name: (data.title as string) || 'Unnamed Rule',
        type: (data.type as AlertType) || 'system',
        severity: (data.severity as AlertSeverity) || 'info',
        condition: (data.condition as AlertRule['condition']) || { metric: 'unknown', operator: 'gt', threshold: 0, timeWindow: 15 },
        channels: (data.channels as string[]) || [],
        cooldown: (data.cooldown as number) || 15,
        isActive: (data.status === 'active')
      };
    });
  }

  private async evaluateRule(rule: AlertRule): Promise<Alert | null> {
    const timeWindowStart = new Date(Date.now() - rule.condition.timeWindow * 60 * 1000);
    let currentValue = 0;

    try {
      if (rule.condition.metric === 'error_rate') {
        // Count recent errors in analytics events
        currentValue = await prisma.analyticsEvent.count({
          where: {
            eventType: 'error',
            createdAt: { gte: timeWindowStart }
          }
        });
      } 
      else if (rule.condition.metric === 'job_failure_rate') {
        // Calculate failure rate of render jobs in the window
        const totalJobs = await prisma.renderJob.count({
          where: { createdAt: { gte: timeWindowStart } }
        });
        
        if (totalJobs > 0) {
          const failedJobs = await prisma.renderJob.count({
            where: { 
              status: 'failed',
              createdAt: { gte: timeWindowStart } 
            }
          });
          currentValue = (failedJobs / totalJobs) * 100; // Percentage
        }
      }
      else if (rule.condition.metric === 'avg_render_duration') {
        // Calculate average duration of completed jobs
        const aggregations = await prisma.renderJob.aggregate({
          _avg: { durationMs: true },
          where: {
            status: 'completed',
            createdAt: { gte: timeWindowStart }
          }
        });
        currentValue = (aggregations._avg.durationMs || 0) / 1000; // Seconds
      }

      if (this.checkThreshold(currentValue, rule.condition.operator, rule.condition.threshold)) {
        return await this.createAlertFromRule(rule, currentValue);
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
    }

    return null;
  }

  private checkThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private async createAlertFromRule(rule: AlertRule, value: number): Promise<Alert | null> {
    // Check cooldown
    const lastAlert = await prisma.analyticsEvent.findFirst({
      where: {
        eventType: 'alert',
        eventData: {
          path: ['ruleId'],
          equals: rule.id
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (lastAlert) {
      const lastAlertTime = lastAlert.createdAt.getTime();
      const cooldownMs = rule.cooldown * 60 * 1000;
      if (Date.now() - lastAlertTime < cooldownMs) {
        // Cooldown active, don't create alert
        return null;
      }
    }

    const alertData = {
      ruleId: rule.id,
      type: rule.type,
      severity: rule.severity,
      title: `Alert: ${rule.name}`,
      message: `${rule.condition.metric} is ${value} (Threshold: ${rule.condition.operator} ${rule.condition.threshold})`,
      value,
      threshold: rule.condition.threshold,
      status: 'active',
      triggeredAt: new Date().toISOString()
    };

    const alert = await prisma.analyticsEvent.create({
      data: {
        eventType: 'alert',
        eventData: alertData as Prisma.InputJsonValue
      }
    });

    return {
      id: alert.id,
      ...alertData,
      triggeredAt: new Date(alertData.triggeredAt),
      status: 'active'
    } as Alert;
  }
}

export const alertSystem = new AlertSystem();
