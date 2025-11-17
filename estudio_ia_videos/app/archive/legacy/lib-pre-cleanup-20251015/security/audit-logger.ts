
/**
 * 📝 AUDIT LOGGER - Sprint 44
 * Registro de ações críticas
 */

import { prisma } from '@/lib/db'

export type AuditAction =
  | 'voice_created'
  | 'voice_deleted'
  | 'compliance_checked'
  | 'compliance_overridden'
  | 'certificate_minted'
  | 'review_requested'
  | 'review_approved'
  | 'review_rejected'
  | 'project_published'
  | 'data_exported'
  | 'data_deleted'

export interface AuditLogEntry {
  action: AuditAction
  userId: string
  organizationId?: string
  resourceId?: string
  resourceType?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  /**
   * Registrar ação de auditoria
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId,
          resourceId: entry.resourceId,
          resource: entry.resourceType || 'unknown',
          organizationId: entry.organizationId || 'default-org',
          metadata: entry.metadata || undefined,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent
        }
      })
    } catch (error) {
      console.error('Erro ao registrar audit log:', error)
      // Não falhar a operação principal se auditoria falhar
    }
  }

  /**
   * Buscar logs de auditoria
   */
  static async getLogs(filters: {
    userId?: string
    action?: AuditAction
    resourceId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }): Promise<any[]> {
    const where: any = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.action) where.action = filters.action
    if (filters.resourceId) where.resourceId = filters.resourceId
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100
    })
  }
}
