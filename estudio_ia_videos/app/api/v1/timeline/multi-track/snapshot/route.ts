/**
 * 🎬 Timeline Snapshot API - Save and Restore Versions
 * Sprint 43 - Timeline version snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';

/**
 * POST - Create snapshot of current timeline
 */
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
    const { projectId, description } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: 'projectId é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`📸 Criando snapshot de timeline do projeto ${projectId}...`);

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
    const timeline = await prisma.timeline.findUnique({
      where: { projectId },
    });

    if (!timeline) {
      return NextResponse.json(
        { success: false, message: 'Timeline não encontrada' },
        { status: 404 }
      );
    }

    // Create snapshot
    const snapshot = await prisma.timelineSnapshot.create({
      data: {
        timelineId: timeline.id,
        version: timeline.version,
        tracks: timeline.tracks as unknown,
        settings: timeline.settings as unknown,
        totalDuration: timeline.totalDuration,
        createdBy: session.user.id,
        description: description || `Snapshot v${timeline.version}`,
      },
    });

    console.log(`✅ Snapshot criado: ${snapshot.id} (v${snapshot.version})`);

    return NextResponse.json({
      success: true,
      data: {
        id: snapshot.id,
        version: snapshot.version,
        description: snapshot.description,
        createdAt: snapshot.createdAt.toISOString(),
        tracksCount: Array.isArray(timeline.tracks) ? timeline.tracks.length : 0,
        totalDuration: timeline.totalDuration,
      },
      message: 'Snapshot criado com sucesso',
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar snapshot:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao criar snapshot', error: error.message },
      { status: 500 }
    );
  }
}
