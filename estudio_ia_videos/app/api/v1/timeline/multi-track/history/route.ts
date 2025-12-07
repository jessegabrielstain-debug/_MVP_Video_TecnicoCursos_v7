// TODO: Fix timeline multi-track types
export const dynamic = 'force-dynamic';

/**
 * 🎬 Timeline History API - Version Management
 * Sprint 43 - Timeline version history and rollback
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET - Retrieve timeline history (all versions)
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
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: 'projectId é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`📜 Buscando histórico de timeline do projeto ${projectId}...`);

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

    // Get current timeline
    const currentTimeline = await prisma.timeline.findUnique({
      where: { projectId },
    });

    if (!currentTimeline) {
      return NextResponse.json(
        { success: false, message: 'Timeline não encontrada' },
        { status: 404 }
      );
    }

    // Get timeline snapshots (history)
    const snapshots = await prisma.timelineSnapshot.findMany({
      where: { timelineId: currentTimeline.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.timelineSnapshot.count({
      where: { timelineId: currentTimeline.id },
    });

    console.log(`✅ ${snapshots.length} versões encontradas`);

    return NextResponse.json({
      success: true,
      data: {
        currentVersion: currentTimeline.version,
        history: snapshots.map((snapshot: any) => ({
          id: snapshot.id,
          version: snapshot.version,
          createdAt: snapshot.createdAt.toISOString(),
          createdBy: snapshot.createdBy,
          description: snapshot.description,
          tracksCount: Array.isArray(snapshot.tracks) ? snapshot.tracks.length : 0,
          totalDuration: snapshot.totalDuration,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + snapshots.length < total,
        },
      },
      message: 'Histórico de timeline recuperado',
    });

  } catch (error: unknown) {
    console.error('❌ Erro ao buscar histórico:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar histórico', error: message },
      { status: 500 }
    );
  }
}


