/**
 * Audit Logger
 * Logger de auditoria para ações de billing
 */

export interface AuditLog {
  id: string;
  userId: string;
  orgId?: string;
  organizationId?: string; // Alias for orgId
  action: string;
  resource: string;
  resourceId?: string;
  status?: string;
  description?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  userEmail?: string;
  userName?: string;
}

export interface AuditLogFilters {
  userId?: string;
  orgId?: string;
  organizationId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogResult {
  logs: AuditLog[];
  total: number;
}

export class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs = 10000;
  
  log(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const log: AuditLog = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    this.logs.push(log);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
  
  async getLogs(filters?: AuditLogFilters): Promise<AuditLogResult> {
    let results = [...this.logs];
    
    if (filters) {
      if (filters.userId) results = results.filter(l => l.userId === filters.userId);
      
      const orgId = filters.orgId || filters.organizationId;
      if (orgId) results = results.filter(l => l.orgId === orgId || l.organizationId === orgId);
      
      if (filters.action) results = results.filter(l => l.action === filters.action);
      if (filters.resource) results = results.filter(l => l.resource === filters.resource);
      
      if (filters.startDate) {
        results = results.filter(l => l.timestamp >= filters.startDate!);
      }
      
      if (filters.endDate) {
        results = results.filter(l => l.timestamp <= filters.endDate!);
      }
    }
    
    // Sort by timestamp desc
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const total = results.length;
    
    // Pagination
    if (filters?.offset !== undefined && filters?.limit !== undefined) {
      results = results.slice(filters.offset, filters.offset + filters.limit);
    } else if (filters?.limit !== undefined) {
      results = results.slice(0, filters.limit);
    }
    
    return { logs: results, total };
  }
  
  clear(): void {
    this.logs = [];
  }
}

export const auditLogger = new AuditLogger();
export const getAuditLogs = (filters?: AuditLogFilters) => 
  auditLogger.getLogs(filters);
