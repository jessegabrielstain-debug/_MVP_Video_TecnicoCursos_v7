// TODO: Fix timeline multi-track types
/**
 * 🤝 Timeline Collaboration API - Real-time Collaboration
 * Sprint 44 - Multi-user timeline editing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST - Lock/Unlock track for editing
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
    const { projectId, trackId, action } = body;

    if (!projectId || !trackId || !action) {
      return NextResponse.json(
        { success: false, message: 'projectId, trackId e action são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['lock', 'unlock'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'action deve ser "lock" ou "unlock"' },
        { status: 400 }
      );
    }

    console.log(`🔒 ${action.toUpperCase()} track ${trackId} no projeto ${projectId}...`);

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    if (action === 'lock') {
      // Check if track is already locked by another user
      const existingLock = await prisma.timelineTrackLock.findFirst({
        where: {
          projectId,
          trackId,
          userId: { not: session.user.id },
        },
      });

      if (existingLock) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Track já está bloqueada por outro usuário',
            lockedBy: existingLock.userId,
            lockedAt: existingLock.createdAt,
          },
          { status: 409 }
        );
      }

      // Create or update lock
      const lock = await prisma.timelineTrackLock.upsert({
        where: {
          projectId_trackId_userId: {
            projectId,
            trackId,
            userId: session.user.id,
          },
        },
        create: {
          projectId,
          trackId,
          userId: session.user.id,
        },
        update: {
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Track bloqueada: ${lock.id}`);

      return NextResponse.json({
        success: true,
        data: {
          id: lock.id,
          trackId: lock.trackId,
          userId: lock.userId,
          lockedAt: lock.createdAt.toISOString(),
        },
        message: 'Track bloqueada com sucesso',
      });

    } else {
      // Unlock - remove lock
      await prisma.timelineTrackLock.deleteMany({
        where: {
          projectId,
          trackId,
          userId: session.user.id,
        },
      });

      console.log(`✅ Track desbloqueada: ${trackId}`);

      return NextResponse.json({
        success: true,
        data: {
          trackId,
          userId: session.user.id,
          unlockedAt: new Date().toISOString(),
        },
        message: 'Track desbloqueada com sucesso',
      });
    }

  } catch (error: unknown) {
    console.error('❌ Erro ao gerenciar lock:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Erro ao processar lock', error: message },
      { status: 500 }
    );
  }
}

/**
 * GET - Get all active locks and presence for a project
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: 'projectId é obrigatório' },
        { status: 400 }
      );
    }

    // Get all active locks
    const locks = await prisma.timelineTrackLock.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Get active users (presence)
    const activeUsers = await prisma.timelinePresence.findMany({
      where: {
        projectId,
        lastSeenAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        locks: locks.map((lock: any) => ({
          id: lock.id,
          trackId: lock.trackId,
          userId: lock.userId,
          userName: lock.user.name,
          userImage: lock.user.avatarUrl,
          lockedAt: lock.createdAt.toISOString(),
        })),
        activeUsers: activeUsers.map((presence: any) => ({
          userId: presence.userId,
          userName: presence.user.name,
          userImage: presence.user.avatarUrl,
          lastSeenAt: presence.lastSeenAt.toISOString(),
          currentTrackId: presence.currentTrackId,
        })),
      },
    });

  } catch (error: unknown) {
    console.error('❌ Erro ao buscar locks:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar informações de colaboração', error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update user presence (heartbeat)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, currentTrackId } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: 'projectId é obrigatório' },
        { status: 400 }
      );
    }

    // Update or create presence
    const presence = await prisma.timelinePresence.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
      create: {
        projectId,
        userId: session.user.id,
        currentTrackId: currentTrackId || null,
        lastSeenAt: new Date(),
      },
      update: {
        currentTrackId: currentTrackId || null,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: presence.userId,
        lastSeenAt: presence.lastSeenAt.toISOString(),
      },
      message: 'Presença atualizada',
    });

  } catch (error: unknown) {
    console.error('❌ Erro ao atualizar presença:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar presença', error: message },
      { status: 500 }
    );
  }
}


