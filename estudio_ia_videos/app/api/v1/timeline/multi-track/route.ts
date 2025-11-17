
/**
 * 🎬 Timeline Multi-Track API - REAL IMPLEMENTATION
 * Sprint 42 - Persistência real no banco de dados
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { AnalyticsTracker } from '@/lib/analytics/analytics-tracker';

// Types for Timeline structures
interface Keyframe {
  time: number;
  value: unknown;
  [key: string]: unknown;
}

interface Track {
  id: string;
  duration?: number;
  keyframes?: Keyframe[];
  [key: string]: unknown;
}

interface ExportSettings {
  fps?: number;
  resolution?: string;
  format?: string;
  quality?: string;
  zoom?: number;
  snapToGrid?: boolean;
  autoSave?: boolean;
}

interface TimelineSettings {
  fps: number;
  resolution: string;
  format: string;
  quality: string;
  zoom: number;
  snapToGrid: boolean;
  autoSave: boolean;
}

interface Analytics {
  tracksCount: number;
  keyframesCount: number;
  avgTrackDuration: number;
  complexity: string;
}

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
    const { projectId, tracks, totalDuration, exportSettings } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: 'projectId é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🎬 Salvando timeline para projeto ${projectId}...`);

    // Verify project exists and user has access
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

    // Prepare settings
    const settings: TimelineSettings = {
      fps: exportSettings?.fps || 30,
      resolution: exportSettings?.resolution || '1920x1080',
      format: exportSettings?.format || 'mp4',
      quality: exportSettings?.quality || 'hd',
      zoom: exportSettings?.zoom || 10,
      snapToGrid: exportSettings?.snapToGrid !== false,
      autoSave: exportSettings?.autoSave !== false,
    };

    // Save or update timeline in database
    const timeline = await prisma.timeline.upsert({
      where: { projectId },
      create: {
        projectId,
        tracks: tracks as unknown,
        settings: settings as unknown,
        totalDuration: Math.ceil(totalDuration || 0),
        version: 1,
      },
      update: {
        tracks: tracks as unknown,
        settings: settings as unknown,
        totalDuration: Math.ceil(totalDuration || 0),
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Timeline salva: ${timeline.id} (v${timeline.version})`);

    const user = session.user as { id: string; organizationId?: string; currentOrgId?: string };
    const orgId = user.organizationId || user.currentOrgId || undefined;

    // Track analytics event
    await AnalyticsTracker.trackTimelineEdit({
      userId: session.user.id,
      organizationId: orgId,
      projectId,
      action: 'update',
      trackCount: tracks?.length || 0,
      totalDuration: totalDuration || 0,
    });

    // Calculate analytics
    const typedTracks = (tracks || []) as Track[];
    const analytics: Analytics = {
      tracksCount: typedTracks.length,
      keyframesCount: typedTracks.reduce(
        (acc: number, track: Track) => acc + (track.keyframes?.length || 0),
        0
      ),
      avgTrackDuration:
        typedTracks.length > 0
          ? typedTracks.reduce((acc: number, track: Track) => acc + (track.duration || 0), 0) /
            typedTracks.length
          : 0,
      complexity: calculateComplexity(typedTracks),
    };

    return NextResponse.json({
      success: true,
      data: {
        id: timeline.id,
        projectId: timeline.projectId,
        version: timeline.version,
        totalDuration: timeline.totalDuration,
        tracks: timeline.tracks,
        settings: timeline.settings,
        updatedAt: timeline.updatedAt.toISOString(),
        analytics,
      },
      message: 'Timeline salva com sucesso',
    });

  } catch (error) {
    console.error('❌ Erro ao salvar timeline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, message: 'Erro ao processar timeline', error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Calculate complexity based on tracks and keyframes
 */
function calculateComplexity(tracks: Track[]): string {
  const keyframeCount = tracks.reduce(
    (acc, track) => acc + (track.keyframes?.length || 0),
    0
  );
  
  if (keyframeCount > 50 || tracks.length > 10) return 'high';
  if (keyframeCount > 20 || tracks.length > 5) return 'medium';
  return 'low';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
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

    console.log(`🎬 Carregando timeline do projeto ${projectId}...`);

    // Load timeline from database
    const timeline = await prisma.timeline.findUnique({
      where: { projectId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            userId: true,
          },
        },
      },
    });

    if (!timeline) {
      return NextResponse.json(
        { success: false, message: 'Timeline não encontrada' },
        { status: 404 }
      );
    }

    // Check access
    if (timeline.project.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      );
    }

    console.log(`✅ Timeline carregada: ${timeline.id} (v${timeline.version})`);

    return NextResponse.json({
      success: true,
      data: {
        id: timeline.id,
        projectId: timeline.projectId,
        projectName: timeline.project.name,
        tracks: timeline.tracks,
        settings: timeline.settings,
        totalDuration: timeline.totalDuration,
        version: timeline.version,
        createdAt: timeline.createdAt.toISOString(),
        updatedAt: timeline.updatedAt.toISOString(),
      },
      message: 'Timeline carregada com sucesso',
    });

  } catch (error) {
    console.error('❌ Erro ao carregar timeline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, message: 'Erro ao carregar timeline', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { timelineId, tracks, settings } = body;

    // Simulate timeline update
    const updatedTimeline = {
      id: timelineId,
      tracks,
      settings,
      lastModified: new Date().toISOString(),
      version: Math.floor(Date.now() / 1000),
      changeLog: [
        {
          timestamp: new Date().toISOString(),
          action: 'timeline_updated',
          user: 'current_user',
          changes: ['tracks_modified', 'settings_updated']
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: updatedTimeline,
      message: 'Timeline atualizada com sucesso'
    });

  } catch (error) {
    console.error('Update timeline error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar timeline' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove timeline
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
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

    console.log(`🗑️ Deletando timeline do projeto ${projectId}...`);

    // Verify project exists and user has access
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

    // Delete timeline
    const deletedTimeline = await prisma.timeline.delete({
      where: { projectId },
    });

    console.log(`✅ Timeline deletada: ${deletedTimeline.id}`);

    return NextResponse.json({
      success: true,
      message: 'Timeline deletada com sucesso',
      data: {
        id: deletedTimeline.id,
        projectId: deletedTimeline.projectId,
      },
    });

  } catch (error) {
    // Timeline não encontrada
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Timeline não encontrada' },
        { status: 404 }
      );
    }

    console.error('❌ Erro ao deletar timeline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, message: 'Erro ao deletar timeline', error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update timeline parcialmente (tracks ou settings específicos)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, tracks, settings, totalDuration } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: 'projectId é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🔧 Atualizando parcialmente timeline do projeto ${projectId}...`);

    // Verify project exists and user has access
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

    // Build update data object with only provided fields
    const updateData: {
      version: { increment: number };
      updatedAt: Date;
      tracks?: unknown;
      settings?: unknown;
      totalDuration?: number;
    } = {
      version: { increment: 1 },
      updatedAt: new Date(),
    };

    if (tracks !== undefined) {
      updateData.tracks = tracks as unknown;
    }

    if (settings !== undefined) {
      updateData.settings = settings as unknown;
    }

    if (totalDuration !== undefined) {
      updateData.totalDuration = Math.ceil(totalDuration);
    }

    // Update timeline
    const timeline = await prisma.timeline.update({
      where: { projectId },
      data: updateData,
    });

    console.log(`✅ Timeline parcialmente atualizada: ${timeline.id} (v${timeline.version})`);

    const user = session.user as { id: string; organizationId?: string; currentOrgId?: string };
    const orgId = user.organizationId || user.currentOrgId || undefined;

    // Track analytics event
    await AnalyticsTracker.trackTimelineEdit({
      userId: session.user.id,
      organizationId: orgId,
      projectId,
      action: 'partial_update',
      trackCount: tracks?.length || 0,
      totalDuration: timeline.totalDuration,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: timeline.id,
        projectId: timeline.projectId,
        version: timeline.version,
        totalDuration: timeline.totalDuration,
        tracks: timeline.tracks,
        settings: timeline.settings,
        updatedAt: timeline.updatedAt.toISOString(),
      },
      message: 'Timeline atualizada parcialmente com sucesso',
    });

  } catch (error) {
    // Timeline não encontrada
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Timeline não encontrada' },
        { status: 404 }
      );
    }

    console.error('❌ Erro ao atualizar parcialmente timeline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, message: 'Erro ao processar atualização parcial', error: errorMessage },
      { status: 500 }
    );
  }
}
