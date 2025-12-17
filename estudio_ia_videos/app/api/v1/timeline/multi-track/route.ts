/**
 * 🎬 Timeline Multi-Track API - REAL IMPLEMENTATION
 * Sprint 42 - Persistência real no banco de dados
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { AnalyticsTracker } from '@/lib/analytics/analytics-tracker';
import { logger } from '@/lib/logger';
import { toJsonValue } from '@/lib/prisma-helpers';

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
  [key: string]: unknown;
}

interface Analytics {
  tracksCount: number;
  keyframesCount: number;
  avgTrackDuration: number;
  complexity: string;
}

// Helper interface for Supabase responses
interface Project {
  id: string;
  user_id: string;
}

interface ProjectCollaborator {
  role: string;
}

interface TimelineRecord {
  id: string;
  project_id: string;
  version: number;
  tracks: unknown; // JSON
  settings: unknown; // JSON
  total_duration: number;
  created_at: string;
  updated_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    logger.info(`🎬 Salvando timeline para projeto ${projectId}...`, { component: 'API: v1/timeline/multi-track' })

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, message: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    const projectData = project as Project;

    // Check permission
    let hasPermission = projectData.user_id === user.id;
    if (!hasPermission) {
        const { data: collaborator } = await supabase
            .from('project_collaborators')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();
        
        if (collaborator && ['owner', 'editor'].includes((collaborator as ProjectCollaborator).role)) {
            hasPermission = true;
        }
    }

    if (!hasPermission) {
        return NextResponse.json(
            { success: false, message: 'Sem permissão para editar este projeto' },
            { status: 403 }
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
    // First check if timeline exists
    const { data: existingTimeline } = await supabase
        .from('timelines')
        .select('id, version')
        .eq('project_id', projectId)
        .single();

    let timeline: TimelineRecord;
    
    if (existingTimeline) {
        const { data, error } = await supabase
            .from('timelines')
            .update({
                tracks: tracks,
                settings: toJsonValue(settings),
                total_duration: Math.ceil(totalDuration || 0),
                version: (existingTimeline as TimelineRecord).version + 1,
                updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId)
            .select()
            .single();
        
        if (error) throw error;
        timeline = data as TimelineRecord;
    } else {
        const { data, error } = await supabase
            .from('timelines')
            .insert({
                project_id: projectId,
                tracks: tracks,
                settings: toJsonValue(settings),
                total_duration: Math.ceil(totalDuration || 0),
                version: 1
            })
            .select()
            .single();
            
        if (error) throw error;
        timeline = data as TimelineRecord;
    }

    logger.info(`✅ Timeline salva: ${timeline.id} (v${timeline.version})`, { component: 'API: v1/timeline/multi-track' });

    // Track analytics event
    await AnalyticsTracker.trackTimelineEdit({
      userId: user.id,
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
        projectId: timeline.project_id,
        version: timeline.version,
        totalDuration: timeline.total_duration,
        tracks: timeline.tracks,
        settings: timeline.settings,
        updatedAt: timeline.updated_at,
        analytics,
      },
      message: 'Timeline salva com sucesso',
    });

  } catch (error) {
    logger.error('❌ Erro ao salvar timeline', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/timeline/multi-track' });
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
    const supabase = getSupabaseForRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    logger.info(`🎬 Carregando timeline do projeto ${projectId}...`, { component: 'API: v1/timeline/multi-track' });

    // Load timeline from database
    const { data: timelineData, error } = await supabase
      .from('timelines')
      .select(`
        *,
        projects:project_id (
            id,
            name,
            status,
            user_id
        )
      `)
      .eq('project_id', projectId)
      .single();

    if (error || !timelineData) {
      return NextResponse.json(
        { success: false, message: 'Timeline não encontrada' },
        { status: 404 }
      );
    }

    // Type assertion for the joined query result
    const timeline = timelineData as unknown as TimelineRecord & { projects: { id: string; name: string; status: string; user_id: string } };
    const project = timeline.projects;

    // Check access
    let hasPermission = project.user_id === user.id;
    if (!hasPermission) {
        const { data: collaborator } = await supabase
            .from('project_collaborators')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();
        
        if (collaborator && ['owner', 'editor'].includes((collaborator as ProjectCollaborator).role)) {
            hasPermission = true;
        }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      );
    }

    logger.info(`✅ Timeline carregada: ${timeline.id} (v${timeline.version})`, { component: 'API: v1/timeline/multi-track' });

    return NextResponse.json({
      success: true,
      data: {
        id: timeline.id,
        projectId: timeline.project_id,
        projectName: project.name,
        tracks: timeline.tracks,
        settings: timeline.settings,
        totalDuration: timeline.total_duration,
        version: timeline.version,
        createdAt: timeline.created_at,
        updatedAt: timeline.updated_at,
      },
      message: 'Timeline carregada com sucesso',
    });

  } catch (error) {
    logger.error('❌ Erro ao carregar timeline', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/timeline/multi-track' });
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, message: 'Erro ao carregar timeline', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
    // Reusing POST logic for now as it handles upsert
    return POST(request);
}

/**
 * DELETE - Remove timeline
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    logger.info(`🗑️ Deletando timeline do projeto ${projectId}...`, { component: 'API: v1/timeline/multi-track' });

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    const projectData = project as Project;

    // Check permission (only owner can delete timeline?)
    // Let's assume editors can too for now, or stick to owner
    let hasPermission = projectData.user_id === user.id;
    if (!hasPermission) {
        const { data: collaborator } = await supabase
            .from('project_collaborators')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();
        
        if (collaborator && ['owner', 'editor'].includes((collaborator as ProjectCollaborator).role)) {
            hasPermission = true;
        }
    }

    if (!hasPermission) {
        return NextResponse.json(
            { success: false, message: 'Sem permissão para deletar timeline' },
            { status: 403 }
        );
    }

    // Delete timeline
    const { error: deleteError } = await supabase
      .from('timelines')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) throw deleteError;

    logger.info(`✅ Timeline deletada para projeto: ${projectId}`, { component: 'API: v1/timeline/multi-track' });

    return NextResponse.json({
      success: true,
      message: 'Timeline deletada com sucesso',
      data: {
        projectId: projectId,
      },
    });

  } catch (error) {
    logger.error('❌ Erro ao deletar timeline', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/timeline/multi-track' });
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
    const supabase = getSupabaseForRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    logger.info(`🔧 Atualizando parcialmente timeline do projeto ${projectId}...`, { component: 'API: v1/timeline/multi-track' });

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    const projectData = project as Project;

    // Check permission
    let hasPermission = projectData.user_id === user.id;
    if (!hasPermission) {
        const { data: collaborator } = await supabase
            .from('project_collaborators')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();
        
        if (collaborator && ['owner', 'editor'].includes((collaborator as ProjectCollaborator).role)) {
            hasPermission = true;
        }
    }

    if (!hasPermission) {
        return NextResponse.json(
            { success: false, message: 'Sem permissão para editar este projeto' },
            { status: 403 }
        );
    }

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (tracks !== undefined) {
      updateData.tracks = tracks;
    }

    if (settings !== undefined) {
      updateData.settings = settings;
    }

    if (totalDuration !== undefined) {
      updateData.total_duration = Math.ceil(totalDuration);
    }

    // Update timeline
    // We need to increment version manually or fetch first. 
    // Let's fetch first to be safe and get current version
    const { data: currentTimeline } = await supabase
        .from('timelines')
        .select('version')
        .eq('project_id', projectId)
        .single();
    
    if (currentTimeline) {
        updateData.version = ((currentTimeline as TimelineRecord).version || 0) + 1;
    }

    const { data: timeline, error: updateError } = await supabase
      .from('timelines')
      .update(updateData)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) throw updateError;

    const timelineRecord = timeline as TimelineRecord;

    logger.info(`✅ Timeline parcialmente atualizada: ${timelineRecord.id} (v${timelineRecord.version})`, { component: 'API: v1/timeline/multi-track' });

    // Track analytics event
    await AnalyticsTracker.trackTimelineEdit({
      userId: user.id,
      projectId,
      action: 'partial_update',
      trackCount: tracks?.length || 0,
      totalDuration: timelineRecord.total_duration,
    });

    // Calculate analytics for response
    const typedTracks = (timelineRecord.tracks || []) as Track[];
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
        id: timelineRecord.id,
        projectId: timelineRecord.project_id,
        version: timelineRecord.version,
        totalDuration: timelineRecord.total_duration,
        tracks: timelineRecord.tracks,
        settings: timelineRecord.settings,
        updatedAt: timelineRecord.updated_at,
        analytics,
      },
      message: 'Timeline atualizada parcialmente com sucesso',
    });

  } catch (error) {
    logger.error('❌ Erro ao atualizar parcialmente timeline', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/timeline/multi-track' });
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, message: 'Erro ao processar atualização parcial', error: errorMessage },
      { status: 500 }
    );
  }
}


