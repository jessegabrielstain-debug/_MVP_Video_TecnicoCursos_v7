// TODO: Fix timeline multi-track types
/**
 * 🎬 Timeline Restore API - Rollback to Previous Versions
 * Sprint 43 - Timeline version restore
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { AnalyticsTracker } from '@/lib/analytics/analytics-tracker';
import { logger } from '@/lib/logger';
/**
 * POST - Restore timeline to a specific snapshot version
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { snapshotId, projectId } = body;

    if (!snapshotId) {
      return NextResponse.json(
        { success: false, message: 'snapshotId é obrigatório' },
        { status: 400 }
      );
    }

    logger.info(`⏪ Restaurando timeline do snapshot ${snapshotId}...`, { component: 'API: v1/timeline/multi-track/restore' });

    // Get snapshot
    const snapshot = await prisma.timelineSnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        timeline: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!snapshot) {
      return NextResponse.json(
        { success: false, message: 'Snapshot não encontrado' },
        { status: 404 }
      );
    }

    // Verify user has access
    if (snapshot.timeline.project.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Create a backup snapshot of current state before restoring
    const currentTimeline = snapshot.timeline;
    const backupSnapshot = await prisma.timelineSnapshot.create({
      data: {
        timelineId: currentTimeline.id,
        version: currentTimeline.version,
        tracks: currentTimeline.tracks as any,
        settings: currentTimeline.settings as any,
        totalDuration: currentTimeline.totalDuration || 0,
        createdBy: session.user.id,
        description: `Auto-backup antes de restaurar v${snapshot.version}`,
      },
    });

    logger.info(`💾 Backup automático criado: ${backupSnapshot.id}`, { component: 'API: v1/timeline/multi-track/restore' });

    // Restore timeline from snapshot
    const restoredTimeline = await prisma.timeline.update({
      where: { id: snapshot.timelineId },
      data: {
        tracks: snapshot.tracks as any,
        settings: snapshot.settings as any,
        totalDuration: snapshot.totalDuration || 0,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    logger.info(`✅ Timeline restaurada para v${snapshot.version} (nova versão: v${restoredTimeline.version})`, { component: 'API: v1/timeline/multi-track/restore' });

    const orgId = getOrgId(session.user) || (session.user as any).currentOrgId || undefined;

    // Track analytics
    await AnalyticsTracker.trackTimelineEdit({
      userId: session.user.id,
      projectId: snapshot.timeline.projectId,
      action: 'restore',
      trackCount: Array.isArray(snapshot.tracks) ? snapshot.tracks.length : 0,
      totalDuration: snapshot.totalDuration || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: restoredTimeline.id,
        projectId: restoredTimeline.projectId,
        version: restoredTimeline.version,
        restoredFromVersion: snapshot.version,
        backupSnapshotId: backupSnapshot.id,
        tracks: restoredTimeline.tracks,
        settings: restoredTimeline.settings,
        totalDuration: restoredTimeline.totalDuration,
        updatedAt: restoredTimeline.updatedAt.toISOString(),
      },
      message: `Timeline restaurada para versão ${snapshot.version}`,
    });

  } catch (error: unknown) {
    logger.error('❌ Erro ao restaurar timeline', { component: 'API: v1/timeline/multi-track/restore', error: error instanceof Error ? error : new Error(String(error)) });
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Erro ao restaurar timeline', error: message },
      { status: 500 }
    );
  }
}


