/**
 * 🔔 Notifications API - Main Notifications Management
 * Handles CRUD operations for notifications with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase, supabaseAdmin } from '@/lib/services'
import { fromUntypedTable } from '@/lib/supabase/server'
import type { NotificationRow } from '@/types/database'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Helper para acessar tabela notifications com tipagem
function notificationsTable() {
  return fromUntypedTable<NotificationRow>(supabaseAdmin, 'notifications')
}

// Validation schemas
const NotificationCreateSchema = z.object({
  type: z.enum(['info', 'success', 'warning', 'error', 'render', 'collaboration', 'system']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  category: z.string().min(1).max(50),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  expires_at: z.string().datetime().optional(),
  project_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  actions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['button', 'link']),
    action: z.string(),
    url: z.string().url().optional(),
    style: z.enum(['primary', 'secondary', 'danger']).optional()
  })).optional()
})

const NotificationQuerySchema = z.object({
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.enum(['unread', 'read', 'archived', 'all']).default('all'),
  timeRange: z.enum(['1h', '24h', '7d', '30d']).optional(),
  projectId: z.string().uuid().optional(),
  limit: z.string().transform(val => parseInt(val)).default('50'),
  offset: z.string().transform(val => parseInt(val)).default('0')
})

// Helper function to get time range filter
function getTimeRangeFilter(timeRange?: string) {
  if (!timeRange) return null
  
  const now = new Date()
  const ranges = {
    '1h': new Date(now.getTime() - 60 * 60 * 1000),
    '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  return ranges[timeRange as keyof typeof ranges]
}

// Get notification statistics
async function getNotificationStats(userId: string, filters: z.infer<typeof NotificationQuerySchema>) {
  try {
    let query = notificationsTable()
      .select('id, type, priority, status')
      .eq('user_id', userId)

    // Apply filters
    if (filters.timeRange) {
      const timeFilter = getTimeRangeFilter(filters.timeRange)
      if (timeFilter) {
        query = query.gte('created_at', timeFilter.toISOString())
      }
    }

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    const { data: notificationsData, error } = await query

    if (error) throw error

    const notifications = (notificationsData || []) as NotificationRow[]

    const total = notifications.length
    const unread = notifications.filter((n) => n.status === 'unread').length

    // Group by type
    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by priority
    const byPriority = notifications.reduce((acc, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Recent activity (last 24 hours)
    const recentFilter = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentActivity = notifications.filter((n) => 
      new Date(n.created_at) > recentFilter
    ).length

    return {
      total,
      unread,
      by_type: byType,
      by_priority: byPriority,
      recent_activity: recentActivity
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error getting notification stats', err, { component: 'API: notifications' })
    return {
      total: 0,
      unread: 0,
      by_type: {},
      by_priority: {},
      recent_activity: 0
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
      type: searchParams.get('type'),
      category: searchParams.get('category'),
      priority: searchParams.get('priority'),
      status: searchParams.get('status') || 'all',
      timeRange: searchParams.get('timeRange'),
      projectId: searchParams.get('projectId'),
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0'
    }

    const validatedParams = NotificationQuerySchema.parse(queryParams)

    // Build query
    let query = notificationsTable()
      .select('*')
      .eq('user_id', session.user.id)

    // Apply filters
    if (validatedParams.type) {
      const types = validatedParams.type.split(',')
      query = query.in('type', types)
    }

    if (validatedParams.category) {
      query = query.eq('category', validatedParams.category)
    }

    if (validatedParams.priority) {
      const priorities = validatedParams.priority.split(',')
      query = query.in('priority', priorities)
    }

    if (validatedParams.status !== 'all') {
      query = query.eq('status', validatedParams.status)
    }

    if (validatedParams.timeRange) {
      const timeFilter = getTimeRangeFilter(validatedParams.timeRange)
      if (timeFilter) {
        query = query.gte('created_at', timeFilter.toISOString())
      }
    }

    if (validatedParams.projectId) {
      query = query.eq('project_id', validatedParams.projectId)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1)

    const { data: notifications, error } = await query

    if (error) throw error

    // Get statistics
    const stats = await getNotificationStats(session.user.id, validatedParams)

    return NextResponse.json({
      success: true,
      data: notifications || [],
      stats,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        total: stats.total
      }
    })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Notifications API error', err, { component: 'API: notifications' })
    
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
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = NotificationCreateSchema.parse(body)

    // Create notification
    const { data: notification, error } = await notificationsTable()
      .insert({
        ...validatedData,
        user_id: session.user.id,
        status: 'unread',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Create notification API error', err, { component: 'API: notifications' })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid notification data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
