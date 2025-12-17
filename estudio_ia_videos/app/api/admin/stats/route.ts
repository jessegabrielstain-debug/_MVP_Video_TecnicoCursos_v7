export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { logger } from '@/lib/logger'
import { supabaseAdmin } from '@/lib/supabase/server'

async function isAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) {
    return false
  }

  const { data } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return data?.role === 'admin'
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await isAdmin(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      totalProjects,
      projectsLast24h,
      renderSummary,
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).then(r => r.count || 0),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }).then(r => r.count || 0),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }).gte('updated_at', last24h.toISOString()).then(r => r.count || 0),
      getRenderJobSummary(last24h),
    ])

    // Placeholder for storage stats as we don't have a file_uploads table
    const usedStorage = 0
    const totalStorageBytes = BigInt(500) * BigInt(1024) * BigInt(1024) * BigInt(1024) // 500GB default quota

    const usedStorageNumber = 0
    const storageUtilization = 0

    // Placeholder for active sessions
    const activeSessions = 0

    return NextResponse.json({
      totalUsers,
      activeSessions,
      totalProjects,
      projectsLast24h,
      usedStorage: usedStorageNumber,
      usedStorageBytes: usedStorage.toString(),
      totalStorageBytes: totalStorageBytes.toString(),
      storageUtilization,
      renderJobs: renderSummary,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    logger.error('Failed to fetch stats', error instanceof Error ? error : new Error(String(error))
    , { component: 'API: admin/stats' })
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

async function getRenderJobSummary(since: Date) {
  const [total, processing, failed, completed] = await Promise.all([
    supabaseAdmin.from('render_jobs').select('*', { count: 'exact', head: true }).then(r => r.count || 0),
    supabaseAdmin.from('render_jobs').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing', 'queued']).then(r => r.count || 0),
    supabaseAdmin.from('render_jobs').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('updated_at', since.toISOString()).then(r => r.count || 0),
    supabaseAdmin.from('render_jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('updated_at', since.toISOString()).then(r => r.count || 0),
  ])

  return {
    total,
    processing,
    failedLast24h: failed,
    completedLast24h: completed,
  }
}

