
/**
 * SPRINT 34 - AUDIT LOGGING SYSTEM
 * Comprehensive activity tracking for compliance and security
 */

import { prisma } from '../db';

export type AuditAction =
  // Authentication
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed_login'
  | 'auth.password_change'
  | 'auth.sso_login'
  // User management
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.role_change'
  // Project operations
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'project.share'
  | 'project.publish'
  | 'project.export'
  // Template operations
  | 'template.create'
  | 'template.update'
  | 'template.delete'
  | 'template.use'
  // System operations
  | 'system.settings_change'
  | 'system.config_change'
  | 'system.api_key_create'
  | 'system.api_key_delete'
  // Security events
  | 'security.permission_denied'
  | 'security.suspicious_activity'
  | 'security.data_export';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  userName?: string;
  userEmail?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  timestamp?: Date;
}

export interface AuditLogQuery {
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Audit Logger Service
 */
export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const logEntry = {
        action: entry.action,
        userId: entry.userId,
        userName: entry.userName,
        userEmail: entry.userEmail,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        resourceName: entry.resourceName,
        details: entry.details,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        success: entry.success,
        errorMessage: entry.errorMessage,
        timestamp: entry.timestamp || new Date(),
      };

      // Store in database (we'll need to create AuditLog model in Prisma)
      // For now, we'll use Analytics table as a workaround
      await prisma.analytics.create({
        data: {
          userId: entry.userId || 'system',
          eventType: entry.action,
          eventData: logEntry,
          timestamp: logEntry.timestamp,
        },
      });

      // Also log to console for immediate visibility
      console.log('[AUDIT]', JSON.stringify(logEntry, null, 2));

      // In production, also send to ELK Stack
      if (process.env.NODE_ENV === 'production') {
        // Send to Logstash
        const { logger } = await import('../elk/logstash-config');
        await logger.info('Audit log entry', { audit: logEntry });
      }
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging should not break application flow
    }
  }

  /**
   * Query audit logs
   */
  static async query(params: AuditLogQuery): Promise<any[]> {
    const where: any = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.action) {
      where.eventType = params.action;
    }

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        where.timestamp.gte = params.startDate;
      }
      if (params.endDate) {
        where.timestamp.lte = params.endDate;
      }
    }

    const logs = await prisma.analytics.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0,
    });

    return logs.map((log: any) => log.eventData);
  }

  /**
   * Get audit summary for a user
   */
  static async getUserSummary(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.query({
      userId,
      startDate,
      limit: 1000,
    });

    // Aggregate stats
    const summary = {
      totalActions: logs.length,
      successfulActions: logs.filter((l: any) => l.success).length,
      failedActions: logs.filter((l: any) => !l.success).length,
      actionsByType: {} as Record<string, number>,
      recentActions: logs.slice(0, 10),
    };

    logs.forEach((log: any) => {
      const action = log.action;
      summary.actionsByType[action] = (summary.actionsByType[action] || 0) + 1;
    });

    return summary;
  }

  /**
   * Export audit logs for compliance
   */
  static async exportLogs(params: AuditLogQuery): Promise<string> {
    const logs = await this.query({...params, limit: 10000});

    // Export as CSV
    const headers = [
      'Timestamp',
      'Action',
      'User',
      'Resource Type',
      'Resource ID',
      'Success',
      'IP Address',
      'Details',
    ];

    const rows = logs.map((log: any) => [
      log.timestamp?.toISOString() || '',
      log.action || '',
      log.userEmail || log.userId || '',
      log.resourceType || '',
      log.resourceId || '',
      log.success ? 'Yes' : 'No',
      log.ipAddress || '',
      JSON.stringify(log.details || {}),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }
}

/**
 * Convenience functions for common audit events
 */
export const auditLog = {
  // Authentication
  login: (userId: string, email: string, ipAddress?: string) =>
    AuditLogger.log({
      action: 'auth.login',
      userId,
      userEmail: email,
      ipAddress,
      success: true,
    }),

  failedLogin: (email: string, ipAddress?: string, reason?: string) =>
    AuditLogger.log({
      action: 'auth.failed_login',
      userEmail: email,
      ipAddress,
      success: false,
      errorMessage: reason,
    }),

  // Project operations
  projectCreate: (userId: string, projectId: string, projectName: string) =>
    AuditLogger.log({
      action: 'project.create',
      userId,
      resourceType: 'project',
      resourceId: projectId,
      resourceName: projectName,
      success: true,
    }),

  projectUpdate: (userId: string, projectId: string, changes: Record<string, unknown>) =>
    AuditLogger.log({
      action: 'project.update',
      userId,
      resourceType: 'project',
      resourceId: projectId,
      details: { changes },
      success: true,
    }),

  projectDelete: (userId: string, projectId: string, projectName: string) =>
    AuditLogger.log({
      action: 'project.delete',
      userId,
      resourceType: 'project',
      resourceId: projectId,
      resourceName: projectName,
      success: true,
    }),

  // User management
  roleChange: (adminId: string, targetUserId: string, oldRole: string, newRole: string) =>
    AuditLogger.log({
      action: 'user.role_change',
      userId: adminId,
      resourceType: 'user',
      resourceId: targetUserId,
      details: { oldRole, newRole },
      success: true,
    }),

  // Security events
  permissionDenied: (userId: string, action: string, resource?: string) =>
    AuditLogger.log({
      action: 'security.permission_denied',
      userId,
      details: { attemptedAction: action, resource },
      success: false,
    }),
};
