/**
 * Alert Manager
 * Gerenciador centralizado de alertas do sistema
 */

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';
export type AlertType = string;

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  userId?: string;
  orgId?: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  
  async create(alert: Omit<Alert, 'id' | 'createdAt' | 'resolved'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      resolved: false,
    };
    
    this.alerts.set(newAlert.id, newAlert);
    return newAlert;
  }
  
  async get(alertId: string): Promise<Alert | null> {
    return this.alerts.get(alertId) || null;
  }
  
  async list(filters?: Partial<Pick<Alert, 'type' | 'resolved' | 'userId' | 'orgId'>>): Promise<Alert[]> {
    let results = Array.from(this.alerts.values());
    
    if (filters) {
      if (filters.type) results = results.filter(a => a.type === filters.type);
      if (filters.resolved !== undefined) results = results.filter(a => a.resolved === filters.resolved);
      if (filters.userId) results = results.filter(a => a.userId === filters.userId);
      if (filters.orgId) results = results.filter(a => a.orgId === filters.orgId);
    }
    
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentAlerts(options: { organizationId: string; severity?: AlertSeverity; type?: AlertType; limit?: number }): Promise<Alert[]> {
    let results = Array.from(this.alerts.values()).filter(a => a.orgId === options.organizationId);
    
    if (options.severity) results = results.filter(a => a.severity === options.severity);
    if (options.type) results = results.filter(a => a.type === options.type);
    
    return results
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, options.limit || 50);
  }

  async getAlertStatistics(orgId: string, startDate: Date, endDate: Date): Promise<any> {
    const alerts = Array.from(this.alerts.values()).filter(a => 
      a.orgId === orgId && 
      a.createdAt >= startDate && 
      a.createdAt <= endDate
    );

    const bySeverity = alerts.reduce((acc, curr) => {
      acc[curr.severity] = (acc[curr.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = alerts.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: alerts.length,
      bySeverity,
      byType,
      resolved: alerts.filter(a => a.resolved).length,
      unresolved: alerts.filter(a => !a.resolved).length
    };
  }
  
  async resolve(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    return true;
  }
  
  async delete(alertId: string): Promise<boolean> {
    return this.alerts.delete(alertId);
  }
  
  async deleteAll(filters?: Partial<Pick<Alert, 'resolved' | 'userId' | 'orgId'>>): Promise<number> {
    const toDelete = await this.list(filters);
    toDelete.forEach(alert => this.alerts.delete(alert.id));
    return toDelete.length;
  }
}

export const alertManager = new AlertManager();
