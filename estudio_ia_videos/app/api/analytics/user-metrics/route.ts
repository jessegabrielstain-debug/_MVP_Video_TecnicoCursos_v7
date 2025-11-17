/**
 * 👤 User Metrics API - Personal Analytics and Usage Statistics
 * Provides comprehensive user-specific metrics and activity data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase, supabaseAdmin } from '@/lib/services'
import type { RenderJob } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schema
const UserMetricsQuerySchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d', '90d']).default('24h'),
  userId: z.string().optional(),
  includeActivity: z.string().transform(val => val === 'true').default('true'),
  includePatterns: z.string().transform(val => val === 'true').default('false')
})

// Helper function to get time range filter
function getTimeRangeFilter(timeRange: string) {
  const now = new Date()
  const ranges = {
    '1h': new Date(now.getTime() - 60 * 60 * 1000),
    '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  }
  return ranges[timeRange as keyof typeof ranges] || ranges['24h']
}

// Get user project statistics
async function getUserProjectStats(userId: string, timeRange: Date) {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, status, project_type, created_at, updated_at, metadata')
      .eq('owner_id', userId)
      .gte('created_at', timeRange.toISOString())

    if (error) throw error

    const total = projects?.length || 0
    const completed = projects?.filter(p => p.status === 'completed').length || 0
    const active = projects?.filter(p => p.status === 'active').length || 0

    // Calculate average project duration for completed projects
    const completedProjects = projects?.filter(p => p.status === 'completed') || []
    const durations = completedProjects.map(p => {
      const start = new Date(p.created_at).getTime()
      const end = new Date(p.updated_at).getTime()
      return (end - start) / (1000 * 60 * 60 * 24) // Convert to days
    })

    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0

    // Get favorite project types
    const projectTypeCounts = projects?.reduce((acc, project) => {
      const type = project.project_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const favoriteProjectTypes = Object.entries(projectTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total_projects: total,
      completed_projects: completed,
      active_projects: active,
      avg_project_duration: Math.round(avgDuration * 100) / 100,
      favorite_project_types: favoriteProjectTypes
    }
  } catch (error) {
    console.error('Error getting user project stats:', error)
    return {
      total_projects: 0,
      completed_projects: 0,
      active_projects: 0,
      avg_project_duration: 0,
      favorite_project_types: []
    }
  }
}

// Get user render statistics
async function getUserRenderStats(userId: string, timeRange: Date) {
  try {
    const { data: renders, error } = await supabaseAdmin
      .from('render_jobs')
      .select('id, status, created_at, completed_at, render_time_seconds')
      .eq('user_id', userId)
      .gte('created_at', timeRange.toISOString())

    if (error) throw error

    const typedRenders: RenderJob[] = (renders || []) as RenderJob[]
    const completedRenders = typedRenders.filter(r => r.status === 'completed')
    const totalRenderTime = completedRenders.reduce((sum, render) => {
      return sum + (render.render_time_seconds || 0)
    }, 0)

    return {
      total_render_time: totalRenderTime,
      completed_renders: completedRenders.length
    }
  } catch (error) {
    console.error('Error getting user render stats:', error)
    return {
      total_render_time: 0,
      completed_renders: 0
    }
  }
}

// Get collaboration statistics
async function getCollaborationStats(userId: string) {
  try {
    // Projects owned by user
    const { data: ownedProjects, error: ownedError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('owner_id', userId)

    if (ownedError) throw ownedError

    // Projects where user is a collaborator
    const { data: collaborations, error: collabError } = await supabaseAdmin
      .from('project_collaborators')
      .select('project_id, role')
      .eq('user_id', userId)

    if (collabError) throw collabError

    // Projects shared by user (where user is owner and has collaborators)
    const { data: sharedProjects, error: sharedError } = await supabaseAdmin
      .from('project_collaborators')
      .select('project_id')
      .in('project_id', ownedProjects?.map(p => p.id) || [])

    if (sharedError) throw sharedError

    const uniqueSharedProjects = new Set(sharedProjects?.map(p => p.project_id) || [])

    return {
      owned_projects: ownedProjects?.length || 0,
      collaborated_projects: collaborations?.length || 0,
      shared_projects: uniqueSharedProjects.size
    }
  } catch (error) {
    console.error('Error getting collaboration stats:', error)
    return {
      owned_projects: 0,
      collaborated_projects: 0,
      shared_projects: 0
    }
  }
}

// Get recent activity
async function getRecentActivity(userId: string, timeRange: Date, limit: number = 20) {
  try {
    const { data: activities, error } = await supabaseAdmin
      .from('analytics_events')
      .select('id, category, action, metadata, created_at, project_id')
      .eq('user_id', userId)
      .gte('created_at', timeRange.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return activities?.map(activity => ({
      id: activity.id,
      type: activity.category,
      action: activity.action,
      timestamp: activity.created_at,
      metadata: activity.metadata,
      project_id: activity.project_id
    })) || []
  } catch (error) {
    console.error('Error getting recent activity:', error)
    return []
  }
}

// Get usage patterns (if requested)
async function getUsagePatterns(userId: string, timeRange: Date) {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('analytics_events')
      .select('created_at, action, category')
      .eq('user_id', userId)
      .gte('created_at', timeRange.toISOString())

    if (error) throw error

    // Calculate most active hours
    const hourCounts = new Array(24).fill(0)
    events?.forEach(event => {
      const hour = new Date(event.created_at).getHours()
      hourCounts[hour]++
    })

    const mostActiveHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour)

    // Calculate preferred features
    const featureCounts = events?.reduce((acc, event) => {
      const feature = `${event.category}_${event.action}`
      acc[feature] = (acc[feature] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const preferredFeatures = Object.entries(featureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([feature]) => feature)

    // ✅ REAL - Calculate average session duration
    // Group events by session (same user, events within 30min of each other)
    const sessionDurations: number[] = []
    if (events && events.length > 1) {
      const sortedEvents = [...events].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      let sessionStart = new Date(sortedEvents[0].created_at).getTime()
      let lastEventTime = sessionStart
      
      for (let i = 1; i < sortedEvents.length; i++) {
        const eventTime = new Date(sortedEvents[i].created_at).getTime()
        const timeSinceLastEvent = (eventTime - lastEventTime) / 1000 // seconds
        
        if (timeSinceLastEvent > 1800) { // 30 min gap = new session
          sessionDurations.push((lastEventTime - sessionStart) / 1000) // seconds
          sessionStart = eventTime
        }
        lastEventTime = eventTime
      }
      
      // Add last session
      sessionDurations.push((lastEventTime - sessionStart) / 1000)
    }
    
    const avgSessionDuration = sessionDurations.length > 0 
      ? Math.round(sessionDurations.reduce((sum, dur) => sum + dur, 0) / sessionDurations.length)
      : 0

    return {
      most_active_hours: mostActiveHours,
      preferred_features: preferredFeatures,
      avg_session_duration: avgSessionDuration
    }
  } catch (error) {
    console.error('Error getting usage patterns:', error)
    return {
      most_active_hours: [],
      preferred_features: [],
      avg_session_duration: 0
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      timeRange: searchParams.get('timeRange') || '24h',
      userId: searchParams.get('userId'),
      includeActivity: searchParams.get('includeActivity') || 'true',
      includePatterns: searchParams.get('includePatterns') || 'false'
    }

    const validatedParams = UserMetricsQuerySchema.parse(queryParams)
    
    // Determine target user (admin can view other users, regular users only themselves)
    let targetUserId = session.user.id
    if (validatedParams.userId && validatedParams.userId !== session.user.id) {
      // Check if current user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (userError || userData?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Admin access required to view other user metrics' },
          { status: 403 }
        )
      }
      
      targetUserId = validatedParams.userId
    }

    const timeRangeFilter = getTimeRangeFilter(validatedParams.timeRange)

    // Gather user metrics
    const [
      projectStats,
      renderStats,
      collaborationStats,
      recentActivity,
      usagePatterns
    ] = await Promise.all([
      getUserProjectStats(targetUserId, timeRangeFilter),
      getUserRenderStats(targetUserId, timeRangeFilter),
      getCollaborationStats(targetUserId),
      validatedParams.includeActivity ? getRecentActivity(targetUserId, timeRangeFilter) : [],
      validatedParams.includePatterns ? getUsagePatterns(targetUserId, timeRangeFilter) : null
    ])

    const userMetrics = {
      ...projectStats,
      ...renderStats,
      collaboration_stats: collaborationStats,
      ...(validatedParams.includeActivity && { recent_activity: recentActivity }),
      ...(validatedParams.includePatterns && usagePatterns && { usage_patterns: usagePatterns })
    }

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
    })

  } catch (error) {
    console.error('User metrics API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}