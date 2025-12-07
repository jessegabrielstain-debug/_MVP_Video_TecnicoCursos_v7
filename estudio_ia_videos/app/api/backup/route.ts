import { NextRequest, NextResponse } from 'next/server';
import { backupRecoverySystem as backupSystem } from '@/lib/backup-recovery-system';

/**
 * API de Backup e Recuperação
 * 
 * Endpoints:
 * - GET /api/backup - Lista backups
 * - POST /api/backup - Cria backup
 * - GET /api/backup/:id - Info de backup específico
 * - POST /api/backup/:id/restore - Restaura backup
 * - DELETE /api/backup/cleanup - Remove backups antigos
 */

/**
 * GET /api/backup
 * Lista todos os backups disponíveis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('id');

    // Se ID especificado, retorna info de backup específico
    if (backupId) {
      const backup = backupSystem.getBackupInfo(backupId);
      
      if (!backup) {
        return NextResponse.json(
          { error: 'Backup não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({ backup });
    }

    // Lista todos os backups
    const backups = backupSystem.listBackups();

    return NextResponse.json({
      backups,
      total: backups.length,
      summary: {
        completed: backups.filter(b => b.status === 'completed').length,
        failed: backups.filter(b => b.status === 'failed').length,
        pending: backups.filter(b => b.status === 'pending').length
      }
    });
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return NextResponse.json(
      { error: 'Erro ao listar backups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backup
 * Cria novo backup completo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, backupId, overwrite, dryRun } = body;

    // Restaurar backup
    if (action === 'restore' && backupId) {
      await backupSystem.restoreBackup({
        backupId,
        overwrite: overwrite || false,
        dryRun: dryRun || false
      });

      return NextResponse.json({
        message: dryRun ? 'Dry run concluído' : 'Backup restaurado com sucesso',
        backupId
      });
    }

    // Criar novo backup
    const metadata = await backupSystem.createFullBackup();

    return NextResponse.json({
      message: 'Backup criado com sucesso',
      backup: metadata
    });
  } catch (error) {
    console.error('Erro ao processar backup:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar backup' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/backup
 * Remove backups antigos
 */
export async function DELETE() {
  try {
    const deleted = await backupSystem.cleanupOldBackups();

    return NextResponse.json({
      message: `${deleted} backup(s) antigo(s) removido(s)`,
      deleted
    });
  } catch (error) {
    console.error('Erro ao limpar backups:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar backups' },
      { status: 500 }
    );
  }
}

