export const dynamic = 'force-dynamic';

/**
 * 📊 Timeline Analytics API - Detailed Usage Statistics
 * Sprint 44 - Analytics and insights for timeline usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

// Types for analytics data structures
interface Track {
  type: string;
  clips?: Clip[];
  keyframes?: unknown[];
  effects?: unknown[];
}

interface Clip {
  startTime: number;
  duration: number;
  effects?: unknown[];
}

interface TimelineSettings {
  quality?: '4k' | 'hd' | 'sd';
  [key: string]: unknown;
}

// Helper interface to match Prisma output
interface TimelineData {
  id: string;
  version: number;
  totalDuration: number | null;
  tracks: Prisma.JsonValue;
  settings: Prisma.JsonValue;
  updatedAt: Date;
}

interface TimelineSnapshot {
  id: string;
  timelineId: string;
  version: number;
  createdAt: Date;
  createdBy: string;
}

interface TrackDistribution {
  [trackType: string]: number;
}

interface AnalyticsSummary {
  overview: {
    version: number;
    totalDuration: number;
    tracksCount: number;
    clipsCount: number;
    keyframesCount: number;
    snapshotsCount: number;
  };
  trackDistribution: TrackDistribution;
  averages: {
    clipsPerTrack: number;
    keyframesPerTrack: number;
  };
  settings: TimelineSettings;
  lastUpdated: Date;
}

interface UsageStats {
  totalEdits: number;
  uniqueEditors: number;
  currentVersion: number;
  averageEditInterval: number;
  editHistory: Array<{
    version: number;
    timestamp: Date;
    changeSize: number;
  }>;
  firstEdit?: Date;
  lastEdit?: Date;
}

interface PerformanceMetrics {
  complexity: {
    score: number;
    level: string;
    totalElements: number;
    breakdown: {
      tracks: number;
      clips: number;
      keyframes: number;
      effects: number;
    };
  };
  performance: {
    averageClipDuration: number;
    overlapDetected: boolean;
    overlapCount: number;
    estimatedRenderTime: string;
  };
  optimization: {
    suggestions: string[];
  };
}

interface EditingPatterns {
  editingSessions: {
    total: number;
    hourlyDistribution: Record<number, number>;
    dailyDistribution: Record<number, number>;
    peakActivity: {
      hour: string;
      day: string;
    };
  };
  patterns: {
    averageSessionLength: string;
    preferredTools: string;
    commonOperations: string;
  };
}

type AnalyticsData = AnalyticsSummary | UsageStats | PerformanceMetrics | EditingPatterns | Record<string, never>;

/**
 * GET - Get analytics for timeline
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
    const type = searchParams.get('type') || 'summary';

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: 'projectId é obrigatório' },
        { status: 400 }
      );
    }

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

    const timeline = await prisma.timeline.findUnique({
      where: { projectId },
    });

    if (!timeline) {
      return NextResponse.json(
        { success: false, message: 'Timeline não encontrada' },
        { status: 404 }
      );
    }

    let analytics: AnalyticsData = {};

    switch (type) {
      case 'summary':
        analytics = await getTimelineSummary(timeline, projectId);
        break;

      case 'usage':
        analytics = await getUsageStats(projectId);
        break;

      case 'performance':
        analytics = await getPerformanceMetrics(timeline);
        break;

      case 'editing_patterns':
        analytics = await getEditingPatterns(projectId);
        break;

      default:
        return NextResponse.json(
          { success: false, message: `Tipo de analytics desconhecido: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    logger.error('Erro ao gerar analytics', error instanceof Error ? error : new Error(String(error))
, { component: 'API: v1/timeline/multi-track/analytics' });
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, message: 'Erro ao gerar analytics', error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Timeline Summary Analytics
 */
async function getTimelineSummary(timeline: TimelineData, projectId: string): Promise<AnalyticsSummary> {
  const tracks = (timeline.tracks as unknown as Track[]) || [];
  
  // Calculate basic metrics
  const totalClips = tracks.reduce((sum: number, track: Track) => 
    sum + (track.clips?.length || 0), 0
  );

  const trackTypes = tracks.reduce((acc: TrackDistribution, track: Track) => {
    acc[track.type] = (acc[track.type] || 0) + 1;
    return acc;
  }, {} as TrackDistribution);

  const avgClipsPerTrack = tracks.length > 0 ? totalClips / tracks.length : 0;

  const totalKeyframes = tracks.reduce((sum: number, track: Track) => 
    sum + (track.keyframes?.length || 0), 0
  );

  // Get snapshot count
  const snapshotCount = await prisma.timelineSnapshot.count({
    where: { timeline: { projectId } },
  });

  return {
    overview: {
      version: timeline.version,
      totalDuration: timeline.totalDuration || 0,
      tracksCount: tracks.length,
      clipsCount: totalClips,
      keyframesCount: totalKeyframes,
      snapshotsCount: snapshotCount,
    },
    trackDistribution: trackTypes,
    averages: {
      clipsPerTrack: Math.round(avgClipsPerTrack * 100) / 100,
      keyframesPerTrack: tracks.length > 0 
        ? Math.round((totalKeyframes / tracks.length) * 100) / 100 
        : 0,
    },
    settings: (timeline.settings as unknown as TimelineSettings) || {},
    lastUpdated: timeline.updatedAt,
  };
}

/**
 * Usage Statistics
 */
async function getUsageStats(projectId: string): Promise<UsageStats> {
  // Get timeline history
  const timeline = await prisma.timeline.findUnique({
    where: { projectId },
  });

  if (!timeline) {
    return {
      totalEdits: 0,
      uniqueEditors: 0,
      currentVersion: 0,
      averageEditInterval: 0,
      editHistory: [],
    };
  }

  const snapshots = await prisma.timelineSnapshot.findMany({
    where: { timelineId: timeline.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }) as TimelineSnapshot[];

  // Calculate edit frequency
  const editTimes = snapshots.map((s: TimelineSnapshot) => s.createdAt.getTime());
  const intervals = editTimes.slice(1).map((time: number, i: number) => 
    editTimes[i] - time
  );

  const avgEditInterval = intervals.length > 0
    ? intervals.reduce((sum: number, int: number) => sum + int, 0) / intervals.length
    : 0;

  // Get unique editors
  const uniqueEditors = new Set(snapshots.map((s: TimelineSnapshot) => s.createdBy));

  // Calculate version growth
  const versionChanges = snapshots.map((s: TimelineSnapshot, i: number) => ({
    version: s.version,
    timestamp: s.createdAt,
    changeSize: i < snapshots.length - 1 
      ? Math.abs(s.version - snapshots[i + 1].version) 
      : 0,
  }));

  return {
    totalEdits: snapshots.length,
    uniqueEditors: uniqueEditors.size,
    currentVersion: timeline.version as number,
    averageEditInterval: Math.round(avgEditInterval / 1000 / 60), // minutes
    editHistory: versionChanges.slice(0, 10),
    firstEdit: snapshots[snapshots.length - 1]?.createdAt,
    lastEdit: snapshots[0]?.createdAt,
  };
}

/**
 * Performance Metrics
 */
async function getPerformanceMetrics(timeline: TimelineData): Promise<PerformanceMetrics> {
  const tracks = (timeline.tracks as unknown as Track[]) || [];
  const settings = (timeline.settings as unknown as TimelineSettings) || {};
  
  // Calculate complexity score
  const totalElements = tracks.reduce((sum: number, track: Track) => 
    sum + (track.clips?.length || 0) + (track.keyframes?.length || 0) + (track.effects?.length || 0), 
    0
  );

  let complexityScore = 0;
  if (totalElements < 50) complexityScore = 1; // Low
  else if (totalElements < 150) complexityScore = 2; // Medium
  else if (totalElements < 300) complexityScore = 3; // High
  else complexityScore = 4; // Very High

  // Analyze clip durations
  const allClips = tracks.flatMap((track: Track) => track.clips || []);
  const clipDurations = allClips.map((clip: Clip) => clip.duration || 0);
  const avgClipDuration = clipDurations.length > 0
    ? clipDurations.reduce((sum: number, dur: number) => sum + dur, 0) / clipDurations.length
    : 0;

  // Check for overlaps (performance issue)
  let overlapCount = 0;
  tracks.forEach((track: Track) => {
    const clips = (track.clips || []).sort((a: Clip, b: Clip) => a.startTime - b.startTime);
    for (let i = 0; i < clips.length - 1; i++) {
      const current = clips[i];
      const next = clips[i + 1];
      if (current.startTime + current.duration > next.startTime) {
        overlapCount++;
      }
    }
  });

  // Estimate render time (simplified)
  const estimatedRenderTime = Math.round(
    ((timeline.totalDuration || 0) / 60) * 
    (1 + (complexityScore * 0.5)) * 
    (settings.quality === '4k' ? 3 : settings.quality === 'hd' ? 2 : 1)
  );

  const effectsCount = tracks.reduce((sum: number, t: Track) => 
    sum + (t.clips?.reduce((s: number, c: Clip) => s + (c.effects?.length || 0), 0) || 0), 0
  );

  return {
    complexity: {
      score: complexityScore,
      level: ['Low', 'Medium', 'High', 'Very High'][complexityScore - 1] || 'Unknown',
      totalElements,
      breakdown: {
        tracks: tracks.length,
        clips: allClips.length,
        keyframes: tracks.reduce((sum: number, t: Track) => sum + (t.keyframes?.length || 0), 0),
        effects: effectsCount,
      },
    },
    performance: {
      averageClipDuration: Math.round(avgClipDuration * 100) / 100,
      overlapDetected: overlapCount > 0,
      overlapCount,
      estimatedRenderTime: `${estimatedRenderTime} min`,
    },
    optimization: {
      suggestions: [
        overlapCount > 0 ? 'Resolver sobreposições de clips para melhor performance' : null,
        totalElements > 200 ? 'Considerar dividir em múltiplas timelines' : null,
        allClips.length > 100 ? 'Agrupar clips similares para melhor organização' : null,
      ].filter((suggestion): suggestion is string => suggestion !== null),
    },
  };
}

/**
 * Editing Patterns Analysis
 */
async function getEditingPatterns(projectId: string): Promise<EditingPatterns> {
  const timeline = await prisma.timeline.findUnique({
    where: { projectId },
  });

  if (!timeline) {
    return {
      editingSessions: {
        total: 0,
        hourlyDistribution: {},
        dailyDistribution: {},
        peakActivity: {
          hour: 'N/A',
          day: 'N/A',
        },
      },
      patterns: {
        averageSessionLength: 'N/A',
        preferredTools: 'N/A',
        commonOperations: 'N/A',
      },
    };
  }

  const snapshots = await prisma.timelineSnapshot.findMany({
    where: { timelineId: timeline.id },
    orderBy: { createdAt: 'asc' },
    take: 100,
  }) as TimelineSnapshot[];

  // Analyze editing patterns
  const hourlyDistribution: Record<number, number> = {};
  const dailyDistribution: Record<number, number> = {};

  snapshots.forEach((snapshot: TimelineSnapshot) => {
    const date = new Date(snapshot.createdAt);
    const hour = date.getHours();
    const day = date.getDay();

    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    dailyDistribution[day] = (dailyDistribution[day] || 0) + 1;
  });

  // Find most active periods
  const peakHourEntry = Object.entries(hourlyDistribution)
    .sort(([, a], [, b]) => b - a)[0];

  const peakDayEntry = Object.entries(dailyDistribution)
    .sort(([, a], [, b]) => b - a)[0];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return {
    editingSessions: {
      total: snapshots.length,
      hourlyDistribution,
      dailyDistribution,
      peakActivity: {
        hour: peakHourEntry ? `${peakHourEntry[0]}:00` : 'N/A',
        day: peakDayEntry ? dayNames[parseInt(peakDayEntry[0])] : 'N/A',
      },
    },
    patterns: {
      averageSessionLength: 'N/A', // Would need session tracking
      preferredTools: 'N/A', // Would need tool usage tracking
      commonOperations: 'N/A', // Would need operation tracking
    },
  };
}


