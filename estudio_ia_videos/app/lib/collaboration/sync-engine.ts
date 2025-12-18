/**
 * Sync Engine - Sistema de sincronização em tempo real
 * Implementa estratégia básica de conflito resolution usando locks e versionamento
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface SyncChange {
  id: string;
  projectId: string;
  userId: string;
  elementId: string;
  changeType: 'update' | 'delete' | 'move' | 'add';
  data: Record<string, unknown>;
  timestamp: Date;
  version: number;
}

export interface ConflictInfo {
  elementId: string;
  conflictType: 'concurrent_edit' | 'delete_edit' | 'version_mismatch';
  localVersion: number;
  serverVersion: number;
  localChange: Record<string, unknown>;
  serverChange: Record<string, unknown>;
}

export class SyncEngine {
  /**
   * Aplicar mudança com verificação de conflito
   */
  async applyChange(change: SyncChange): Promise<{ success: boolean; conflict?: ConflictInfo; merged?: boolean }> {
    try {
      // Verificar se elemento está bloqueado por outro usuário
      const lock = await prisma.timelineTrackLock.findFirst({
        where: {
          projectId: change.projectId,
          trackId: change.elementId,
          userId: { not: change.userId }
        }
      });

      if (lock) {
        logger.warn('Elemento bloqueado por outro usuário', {
          elementId: change.elementId,
          lockedBy: lock.userId,
          requestedBy: change.userId
        });
        return {
          success: false,
          conflict: {
            elementId: change.elementId,
            conflictType: 'concurrent_edit',
            localVersion: change.version,
            serverVersion: change.version,
            localChange: change.data,
            serverChange: {}
          }
        };
      }

      // Verificar versão do elemento (se aplicável)
      const element = await prisma.timelineElement.findUnique({
        where: { id: change.elementId }
      });

      if (element && change.version < (element.updatedAt.getTime() / 1000)) {
        // Versão desatualizada - conflito detectado
        return {
          success: false,
          conflict: {
            elementId: change.elementId,
            conflictType: 'version_mismatch',
            localVersion: change.version,
            serverVersion: Math.floor(element.updatedAt.getTime() / 1000),
            localChange: change.data,
            serverChange: element.properties as Record<string, unknown>
          }
        };
      }

      // Aplicar mudança
      await this.executeChange(change);

      return { success: true, merged: false };
    } catch (error) {
      logger.error('Erro ao aplicar mudança', error instanceof Error ? error : new Error(String(error)), {
        changeId: change.id,
        elementId: change.elementId
      });
      throw error;
    }
  }

  /**
   * Executar mudança no banco de dados
   */
  private async executeChange(change: SyncChange): Promise<void> {
    switch (change.changeType) {
      case 'update':
        await prisma.timelineElement.update({
          where: { id: change.elementId },
          data: {
            properties: change.data as Record<string, unknown>,
            updatedAt: new Date()
          }
        });
        break;

      case 'delete':
        await prisma.timelineElement.delete({
          where: { id: change.elementId }
        });
        break;

      case 'move':
        await prisma.timelineElement.update({
          where: { id: change.elementId },
          data: {
            startTime: change.data.startTime as number,
            duration: change.data.duration as number,
            updatedAt: new Date()
          }
        });
        break;

      case 'add':
        await prisma.timelineElement.create({
          data: {
            id: change.elementId,
            trackId: change.data.trackId as string,
            projectId: change.projectId,
            startTime: change.data.startTime as number,
            duration: change.data.duration as number,
            type: change.data.type as string,
            content: change.data.content as string,
            properties: (change.data.properties || {}) as Record<string, unknown>
          }
        });
        break;
    }
  }

  /**
   * Resolver conflito usando estratégia "last-write-wins" ou merge manual
   */
  async resolveConflict(
    conflict: ConflictInfo,
    resolution: 'accept_local' | 'accept_remote' | 'merge',
    userId: string
  ): Promise<{ success: boolean }> {
    try {
      if (resolution === 'accept_local') {
        // Aplicar mudança local
        await prisma.timelineElement.update({
          where: { id: conflict.elementId },
          data: {
            properties: conflict.localChange,
            updatedAt: new Date()
          }
        });
      } else if (resolution === 'accept_remote') {
        // Manter mudança remota (já está no servidor)
        // Não fazer nada
      } else if (resolution === 'merge') {
        // Merge manual - combinar propriedades não conflitantes
        const merged = {
          ...conflict.serverChange,
          ...conflict.localChange,
          // Propriedades conflitantes mantêm a versão local
        };
        await prisma.timelineElement.update({
          where: { id: conflict.elementId },
          data: {
            properties: merged,
            updatedAt: new Date()
          }
        });
      }

      logger.info('Conflito resolvido', {
        elementId: conflict.elementId,
        resolution,
        resolvedBy: userId
      });

      return { success: true };
    } catch (error) {
      logger.error('Erro ao resolver conflito', error instanceof Error ? error : new Error(String(error)), {
        elementId: conflict.elementId
      });
      throw error;
    }
  }

  /**
   * Obter versão atual do elemento
   */
  async getElementVersion(elementId: string): Promise<number> {
    const element = await prisma.timelineElement.findUnique({
      where: { id: elementId },
      select: { updatedAt: true }
    });

    return element ? Math.floor(element.updatedAt.getTime() / 1000) : 0;
  }
}

export const syncEngine = new SyncEngine();
