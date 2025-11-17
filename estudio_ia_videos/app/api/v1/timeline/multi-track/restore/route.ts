/**
 * 🎬 Timeline Restore API - Rollback to Previous Versions
 * Sprint 43 - Timeline version restore
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { AnalyticsTracker } from '@/lib/analytics/analytics-tracker';

// Type-safe helper extraindo organizationId
const getOrgId = (user: unknown): string | undefined => {
  const u = user as { currentOrgId?: string; organizationId?: string };
  return u.currentOrgId || u.organizationId || undefined;
};

// Type-safe helper verificando admin
const isAdmin = (user: unknown): boolean => {
  return ((user as { isAdmin?: boolean }).isAdmin) === true;
};
// Type-safe helper extraindo organizationId
const getOrgId = (user: unknown): string | undefined => {
  const u = user as { currentOrgId?: string; organizationId?: string };
  return u.currentOrgId || u.organizationId || undefined;
};

// Type-safe helper verificando admin
const isAdmin = (user: unknown): boolean => {
  return ((user as { isAdmin?: boolean }).isAdmin) === true;
};
/**
 * POST - Restore timeline to a specific snapshot version
 */

const getUserId = (user: unknown): string => ((user as { id?: string }).id || '');
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
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

    console.log(`⏪ Restaurando timeline do snapshot ${snapshotId}...`);

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
        tracks: currentTimeline.tracks as unknown,
        settings: currentTimeline.settings as unknown,
        totalDuration: currentTimeline.totalDuration,
        createdBy: session.user.id,
        description: `Auto-backup antes de restaurar v${snapshot.version}`,
      },
    });

    console.log(`💾 Backup automático criado: ${backupSnapshot.id}`);

    // Restore timeline from snapshot
    const restoredTimeline = await prisma.timeline.update({
      where: { id: snapshot.timelineId },
      data: {
        tracks: snapshot.tracks as unknown,
        settings: snapshot.settings as unknown,
        totalDuration: snapshot.totalDuration,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Timeline restaurada para v${snapshot.version} (nova versão: v${restoredTimeline.version})`);

    const orgId = getOrgId(session.user) || session.user.currentOrgId || undefined;

    // Track analytics
    await AnalyticsTracker.trackTimelineEdit({
      userId: session.user.id,
      organizationId: orgId,
      projectId: snapshot.timeline.projectId,
      action: 'restore',
      trackCount: Array.isArray(snapshot.tracks) ? snapshot.tracks.length : 0,
      totalDuration: snapshot.totalDuration,
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

  } catch (error: any) {
    console.error('❌ Erro ao restaurar timeline:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao restaurar timeline', error: error.message },
      { status: 500 }
    );
  }
}
