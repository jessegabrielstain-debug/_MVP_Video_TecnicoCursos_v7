/**
 * ⚡ Timeline Bulk Operations API - Batch Processing
 * Sprint 44 - Mass operations on timeline elements
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

// Types for Timeline structures
interface Clip {
  id: string;
  startTime: number;
  duration?: number;
  effects?: Effect[];
  [key: string]: unknown;
}

interface Effect {
  type: string;
  [key: string]: unknown;
}

interface Track {
  id: string;
  clips?: Clip[];
  [key: string]: unknown;
}

interface BulkTargets {
  trackIds?: string[];
  clipIds?: string[];
}

interface BulkData {
  timeOffset?: number;
  targetTrackId?: string;
  settings?: Record<string, unknown>;
  effect?: Effect;
}

interface BulkResult {
  deletedCount?: number;
  remainingCount?: number;
  tracksAffected?: number;
  duplicatedCount?: number;
  timeOffset?: number;
  movedCount?: number;
  targetTrackId?: string;
  updatedCount?: number;
  settings?: Record<string, unknown>;
  affectedClips?: number;
  effect?: string;
}

/**
 * POST - Execute bulk operations
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
    const { projectId, operation, targets, data } = body;

    if (!projectId || !operation || !targets) {
      return NextResponse.json(
        { success: false, message: 'projectId, operation e targets são obrigatórios' },
        { status: 400 }
      );
    }

    logger.info(`⚡ Executando operação em lote: ${operation}...`, {
      component: 'API: v1/timeline/multi-track/bulk',
      projectId,
      operation
    });

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

    // Get timeline
    const timeline = await prisma.timeline.findUnique({
      where: { projectId },
    });

    if (!timeline) {
      return NextResponse.json(
        { success: false, message: 'Timeline não encontrada' },
        { status: 404 }
      );
    }

    let result: BulkResult = {};
    let updatedTracks = (timeline.tracks as unknown) as Track[];

    switch (operation) {
      case 'delete_tracks':
        // Delete multiple tracks
        const trackIdsToDelete = targets.trackIds || [];
        updatedTracks = updatedTracks.filter((track: Track) => 
          !trackIdsToDelete.includes(track.id)
        );
        result = {
          deletedCount: trackIdsToDelete.length,
          remainingCount: updatedTracks.length,
        };
        break;

      case 'delete_clips':
        // Delete multiple clips
        const clipIdsToDelete = targets.clipIds || [];
        updatedTracks = updatedTracks.map((track: Track) => ({
          ...track,
          clips: track.clips?.filter((clip: Clip) => 
            !clipIdsToDelete.includes(clip.id)
          ) || [],
        }));
        const originalTracks = (timeline.tracks as unknown) as Track[];
        result = {
          deletedCount: clipIdsToDelete.length,
          tracksAffected: updatedTracks.filter((t: Track) => 
            t.clips?.length !== originalTracks
              .find((ot: Track) => ot.id === t.id)?.clips?.length
          ).length,
        };
        break;

      case 'duplicate_clips':
        // Duplicate multiple clips
        const clipIdsToDuplicate = targets.clipIds || [];
        const offset = data?.timeOffset || 5; // seconds
        
        updatedTracks = updatedTracks.map((track: Track) => {
          const newClips: Clip[] = [];
          track.clips?.forEach((clip: Clip) => {
            if (clipIdsToDuplicate.includes(clip.id)) {
              newClips.push({
                ...clip,
                id: `${clip.id}_copy_${Date.now()}`,
                startTime: clip.startTime + offset,
              });
            }
          });
          return {
            ...track,
            clips: [...(track.clips || []), ...newClips],
          };
        });
        
        result = {
          duplicatedCount: clipIdsToDuplicate.length,
          timeOffset: offset,
        };
        break;

      case 'move_clips':
        // Move multiple clips to different track
        const clipIdsToMove = targets.clipIds || [];
        const targetTrackId = data?.targetTrackId;
        
        if (!targetTrackId) {
          return NextResponse.json(
            { success: false, message: 'targetTrackId é obrigatório para move_clips' },
            { status: 400 }
          );
        }

        const clipsToMove: Clip[] = [];
        updatedTracks = updatedTracks.map((track: Track) => {
          const remainingClips = track.clips?.filter((clip: Clip) => {
            if (clipIdsToMove.includes(clip.id)) {
              clipsToMove.push(clip);
              return false;
            }
            return true;
          }) || [];
          
          return { ...track, clips: remainingClips };
        });

        // Add clips to target track
        updatedTracks = updatedTracks.map((track: Track) => {
          if (track.id === targetTrackId) {
            return {
              ...track,
              clips: [...(track.clips || []), ...clipsToMove],
            };
          }
          return track;
        });

        result = {
          movedCount: clipsToMove.length,
          targetTrackId,
        };
        break;

      case 'update_settings':
        // Update settings for multiple tracks
        const trackIdsToUpdate = targets.trackIds || [];
        const settings = data?.settings || {};
        
        updatedTracks = updatedTracks.map((track: Track) => {
          if (trackIdsToUpdate.includes(track.id)) {
            return {
              ...track,
              ...settings,
            };
          }
          return track;
        });

        result = {
          updatedCount: trackIdsToUpdate.length,
          settings,
        };
        break;

      case 'apply_effect':
        // Apply effect to multiple clips
        const clipIdsForEffect = targets.clipIds || [];
        const effect = data?.effect;
        
        if (!effect) {
          return NextResponse.json(
            { success: false, message: 'effect é obrigatório para apply_effect' },
            { status: 400 }
          );
        }

        updatedTracks = updatedTracks.map((track: Track) => ({
          ...track,
          clips: track.clips?.map((clip: Clip) => {
            if (clipIdsForEffect.includes(clip.id)) {
              return {
                ...clip,
                effects: [...(clip.effects || []), effect],
              };
            }
            return clip;
          }) || [],
        }));

        result = {
          affectedClips: clipIdsForEffect.length,
          effect: effect.type,
        };
        break;

      default:
        return NextResponse.json(
          { success: false, message: `Operação desconhecida: ${operation}` },
          { status: 400 }
        );
    }

    // Update timeline
    const updatedTimeline = await prisma.timeline.update({
      where: { projectId },
      data: {
        tracks: updatedTracks as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    logger.info(`✅ Operação em lote concluída: ${operation}`, {
      component: 'API: v1/timeline/multi-track/bulk',
      projectId,
      operation
    });

    return NextResponse.json({
      success: true,
      data: {
        operation,
        result,
        timeline: {
          id: updatedTimeline.id,
          version: updatedTimeline.version,
          tracksCount: updatedTracks.length,
          updatedAt: updatedTimeline.updatedAt.toISOString(),
        },
      },
      message: `Operação ${operation} executada com sucesso`,
    });

  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('❌ Erro em operação em lote:', {
      component: 'API: v1/timeline/multi-track/bulk',
      error: normalizedError
    });
    const errorMessage = normalizedError.message;
    return NextResponse.json(
      { success: false, message: 'Erro ao executar operação em lote', error: errorMessage },
      { status: 500 }
    );
  }
}


