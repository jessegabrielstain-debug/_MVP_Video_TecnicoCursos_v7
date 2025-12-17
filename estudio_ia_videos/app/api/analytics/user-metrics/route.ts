import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Interfaces for raw query results
interface ProjectQueryResult {
  id: string;
  status: string;
  type: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CollaboratorQueryResult {
  project_id: string;
  role: string;
}

interface SharedProjectQueryResult {
  id: string;
}

interface UserRoleQueryResult {
  role: string;
}

// Validation schema
const UserMetricsQuerySchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d', '90d']).default('24h'),
  userId: z.string().optional(),
  includeActivity: z.string().transform(val => val === 'true').default('true'),
  includePatterns: z.string().transform(val => val === 'true').default('false')
});

// Helper function to get time range filter
function getTimeRangeDate(timeRange: string): Date {
  const now = new Date();
  const ranges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  return new Date(now.getTime() - (ranges[timeRange] || ranges['24h']));
}

// Get user project statistics
async function getUserProjectStats(userId: string, timeRange: Date) {
  try {
    // Using raw query because 'type' is missing in Prisma schema
    const projects = await prisma.$queryRaw<ProjectQueryResult[]>`
      SELECT id, status, type, created_at, updated_at
      FROM projects
      WHERE user_id = ${userId}::uuid
      AND created_at >= ${timeRange}
    `;

    const projectsList = projects;
    const total = projectsList.length;
    const completed = projectsList.filter(p => p.status === 'completed').length;
    const active = projectsList.filter(p => p.status === 'active' || p.status === 'in-progress').length;

    // Calculate average project duration for completed projects
    const completedProjects = projectsList.filter(p => p.status === 'completed');
    const durations = completedProjects.map(p => {
      const start = new Date(p.created_at).getTime();
      const end = new Date(p.updated_at).getTime();
      return (end - start) / (1000 * 60 * 60 * 24); // Convert to days
    });

    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0;

    // Get favorite project types
    const projectTypeCounts = projectsList.reduce((acc: Record<string, number>, project) => {
      const type = project.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const favoriteProjectTypes = Object.entries(projectTypeCounts)
      .map(([type, count]) => ({ type, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_projects: total,
      completed_projects: completed,
      active_projects: active,
      avg_project_duration: Math.round(avgDuration * 100) / 100,
      favorite_project_types: favoriteProjectTypes
    };
  } catch (error) {
    logger.error('Error getting user project stats', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/user-metrics' });
    return {
      total_projects: 0,
      completed_projects: 0,
      active_projects: 0,
      avg_project_duration: 0,
      favorite_project_types: []
    };
  }
}

// Get user render statistics
async function getUserRenderStats(userId: string, timeRange: Date) {
  try {
    const renders = await prisma.renderJob.findMany({
      where: {
        project: { userId: userId },
        createdAt: { gte: timeRange }
      },
      select: {
        id: true,
        status: true,
        durationMs: true
      }
    });

    const completedRenders = renders.filter(r => r.status === 'completed');
    const totalRenderTime = completedRenders.reduce((sum, render) => {
      return sum + ((render.durationMs || 0) / 1000); // Convert ms to seconds
    }, 0);

    return {
      total_render_time: totalRenderTime,
      completed_renders: completedRenders.length
    };
  } catch (error) {
    logger.error('Error getting user render stats', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/user-metrics' });
    return {
      total_render_time: 0,
      completed_renders: 0
    };
  }
}

// Get collaboration statistics
async function getCollaborationStats(userId: string) {
  try {
    const ownedProjectsCount = await prisma.project.count({
      where: { userId: userId }
    });

    // ProjectCollaborator table is missing in Prisma schema, use raw query
    const collaborations = await prisma.$queryRaw<CollaboratorQueryResult[]>`
      SELECT project_id, role FROM project_collaborators WHERE user_id = ${userId}::uuid
    `;
    const collaborationsList = collaborations;

    // Shared projects (owned by user, has collaborators)
    const sharedProjects = await prisma.$queryRaw<SharedProjectQueryResult[]>`
      SELECT DISTINCT p.id 
      FROM projects p
      JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE p.user_id = ${userId}::uuid
    `;
    const sharedProjectsList = sharedProjects;

    return {
      owned_projects: ownedProjectsCount,
      collaborated_projects: collaborationsList.length,
      shared_projects: sharedProjectsList.length
    };
  } catch (error) {
    logger.error('Error getting collaboration stats', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/user-metrics' });
    return {
      owned_projects: 0,
      collaborated_projects: 0,
      shared_projects: 0
    };
  }
}

// Get recent activity
async function getRecentActivity(userId: string, timeRange: Date, limit: number = 20) {
  try {
    const activities = await prisma.analyticsEvent.findMany({
      where: {
        userId: userId,
        createdAt: { gte: timeRange }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        eventData: true,
        createdAt: true
      }
    });

    return activities.map(activity => {
      const data = activity.eventData as Record<string, any> || {};
      return {
        id: activity.id,
        type: activity.eventType,
        action: data.action || activity.eventType,
        timestamp: activity.createdAt,
        metadata: data,
        project_id: data.projectId || null
      };
    });
  } catch (error) {
    logger.error('Error getting recent activity', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/user-metrics' });
    return [];
  }
}

// Get usage patterns (if requested)
async function getUsagePatterns(userId: string, timeRange: Date) {
  try {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        userId: userId,
        createdAt: { gte: timeRange }
      },
      select: {
        createdAt: true,
        eventType: true,
        eventData: true
      }
    });

    // Calculate most active hours
    const hourCounts = new Array(24).fill(0);
    events.forEach(event => {
      const hour = new Date(event.createdAt).getHours();
      hourCounts[hour]++;
    });

    const mostActiveHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    // Calculate preferred features
    const featureCounts = events.reduce((acc: Record<string, number>, event) => {
      const data = event.eventData as Record<string, any> || {};
      const action = data.action || 'unknown';
      const feature = `${event.eventType}_${action}`;
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {});

    const preferredFeatures = Object.entries(featureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([feature]) => feature);

    // Calculate average session duration
    const sessionDurations: number[] = [];
    if (events.length > 1) {
      const sortedEvents = [...events].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      let sessionStart = new Date(sortedEvents[0].createdAt).getTime();
      let lastEventTime = sessionStart;
      
      for (let i = 1; i < sortedEvents.length; i++) {
        const eventTime = new Date(sortedEvents[i].createdAt).getTime();
        const timeSinceLastEvent = (eventTime - lastEventTime) / 1000; // seconds
        
        if (timeSinceLastEvent > 1800) { // 30 min gap = new session
          sessionDurations.push((lastEventTime - sessionStart) / 1000); // seconds
          sessionStart = eventTime;
        }
        lastEventTime = eventTime;
      }
      
      // Add last session
      sessionDurations.push((lastEventTime - sessionStart) / 1000);
    }
    
    const avgSessionDuration = sessionDurations.length > 0 
      ? Math.round(sessionDurations.reduce((sum, dur) => sum + dur, 0) / sessionDurations.length)
      : 0;

    return {
      most_active_hours: mostActiveHours,
      preferred_features: preferredFeatures,
      avg_session_duration: avgSessionDuration
    };
  } catch (error) {
    logger.error('Error getting usage patterns', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/user-metrics' });
    return {
      most_active_hours: [],
      preferred_features: [],
      avg_session_duration: 0
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      timeRange: searchParams.get('timeRange') || '24h',
      userId: searchParams.get('userId'),
      includeActivity: searchParams.get('includeActivity') || 'true',
      includePatterns: searchParams.get('includePatterns') || 'false'
    };

    const validatedParams = UserMetricsQuerySchema.parse(queryParams);
    
    let targetUserId = session.user.id;
    if (validatedParams.userId && validatedParams.userId !== session.user.id) {
      // Check if current user is admin
      const userRole = await prisma.$queryRaw<UserRoleQueryResult[]>`SELECT role FROM users WHERE id = ${session.user.id}::uuid`;
      const role = userRole[0]?.role;

      if (role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Admin access required to view other user metrics' },
          { status: 403 }
        );
      }
      
      targetUserId = validatedParams.userId;
    }

    const timeRangeDate = getTimeRangeDate(validatedParams.timeRange);

    const [
      projectStats,
      renderStats,
      collaborationStats,
      recentActivity,
      usagePatterns
    ] = await Promise.all([
      getUserProjectStats(targetUserId, timeRangeDate),
      getUserRenderStats(targetUserId, timeRangeDate),
      getCollaborationStats(targetUserId),
      validatedParams.includeActivity ? getRecentActivity(targetUserId, timeRangeDate) : [],
      validatedParams.includePatterns ? getUsagePatterns(targetUserId, timeRangeDate) : null
    ]);

    const userMetrics = {
      ...projectStats,
      ...renderStats,
      collaboration_stats: collaborationStats,
      ...(validatedParams.includeActivity && { recent_activity: recentActivity }),
      ...(validatedParams.includePatterns && usagePatterns && { usage_patterns: usagePatterns })
    };

    return NextResponse.json({
      success: true,
      data: userMetrics,
      metadata: {
        userId: targetUserId,
        timeRange: validatedParams.timeRange,
        generatedAt: new Date().toISOString(),
        includeActivity: validatedParams.includeActivity,
        includePatterns: validatedParams.includePatterns
      }
    });

  } catch (error) {
    logger.error('User metrics API error', error instanceof Error ? error : new Error(String(error)), { component: 'API: analytics/user-metrics' });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}