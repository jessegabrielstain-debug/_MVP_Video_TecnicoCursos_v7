import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  computeBasicStats,
  computePerformanceMetrics,
  computeErrorAnalysis,
  computeQueueStats,
  computeErrorCategories,
  BasicRenderJob
} from '@/lib/analytics/render-core'
import getInMemoryCache from '@/lib/in-memory-cache'
import { RenderStatsQuerySchema, type RenderStatsQuery } from '@/lib/validation/schemas'

const MAX_ROWS = 5000
const cache = getInMemoryCache({ ttl: 30000 })

type TimeRange = RenderStatsQuery['timeRange']

type RenderJobRow = Omit<BasicRenderJob, 'render_settings'> & {
  user_id?: string
  project_type?: string
  render_settings: Record<string, unknown>
}

type RenderJobWithProject = {
  id: string
  created_at: string
  started_at: string | null
  completed_at: string | null
  status: string
  error_message: string | null
  render_settings: Record<string, unknown>
  projects: {
    user_id: string
    type: string
  } | null
}

type RenderStatsPayload = {
  metadata: {
    generated_at: string
    time_range: TimeRange
    filters: {
      userId: string | null
      projectType: string | null
      status: RenderStatsQuery['status']
    }
    row_count: number
    truncated: boolean
  }
  basic_stats: ReturnType<typeof computeBasicStats>
  queue_stats: ReturnType<typeof computeQueueStats>
  performance_metrics?: ReturnType<typeof computePerformanceMetrics>
  error_analysis?: ReturnType<typeof computeErrorAnalysis>
  error_categories?: ReturnType<typeof computeErrorCategories>
}

function getTimeRangeFilter(range: TimeRange): Date {
  const now = Date.now()
  const ranges: Record<TimeRange, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  }
  const delta = ranges[range] ?? ranges['24h']
  return new Date(now - delta)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cacheKey = req.url
  const cached = cache.get<RenderStatsPayload>(cacheKey)
  if (cached) {
    const response = NextResponse.json(cached)
    response.headers.set('X-Cache', 'HIT')
    return response
  }

  const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = RenderStatsQuerySchema.safeParse(queryParams)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const params = parsed.data
  const admin = supabaseAdmin
  let query = admin
    .from('render_jobs')
    .select(
      'id, created_at, started_at, completed_at, status, error_message, render_settings, projects!inner(user_id, type)',
      { count: 'exact' }
    )
    .gte('created_at', getTimeRangeFilter(params.timeRange).toISOString())
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS)

  if (params.userId) {
    query = query.eq('projects.user_id', params.userId)
  }

  if (params.projectType) {
    query = query.eq('projects.type', params.projectType)
  }

  if (params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data, error, count } = await query

  if (error) {
    logger.error('Supabase error while fetching render jobs', error instanceof Error ? error : new Error(JSON.stringify(error)), { component: 'API: analytics/render-stats' })
    return NextResponse.json({ error: 'Failed to fetch render jobs' }, { status: 500 })
  }

  const rawJobs = (data as unknown) as RenderJobWithProject[]
  
  const jobs: RenderJobRow[] = rawJobs.map(job => ({
    id: job.id,
    created_at: job.created_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
    status: job.status,
    error_message: job.error_message,
    render_settings: job.render_settings,
    user_id: job.projects?.user_id,
    project_type: job.projects?.type
  }))

  const totalCount = typeof count === 'number' ? count : jobs.length
  const truncated = totalCount > jobs.length || jobs.length === MAX_ROWS

  // Cast to BasicRenderJob for compute functions - the render_settings type difference is negligible for metrics
  const jobsForCompute = jobs as unknown as BasicRenderJob[]
  const basicStats = computeBasicStats(jobsForCompute)
  const queueStats = computeQueueStats(jobsForCompute)
  const performanceMetrics = params.includePerformance ? computePerformanceMetrics(jobsForCompute) : undefined
  const errorAnalysis = params.includeErrors ? computeErrorAnalysis(jobsForCompute) : undefined
  const errorCategories = params.includeErrors ? computeErrorCategories(jobsForCompute) : undefined

  const payload: RenderStatsPayload = {
    metadata: {
      generated_at: new Date().toISOString(),
      time_range: params.timeRange,
      filters: {
        userId: params.userId ?? null,
        projectType: params.projectType ?? null,
        status: params.status
      },
      row_count: jobs.length,
      truncated
    },
    basic_stats: basicStats,
    queue_stats: queueStats,
    ...(performanceMetrics && { performance_metrics: performanceMetrics }),
    ...(errorAnalysis && { error_analysis: errorAnalysis }),
    ...(errorCategories && { error_categories: errorCategories })
  }

  cache.set(cacheKey, payload)

  const response = NextResponse.json(payload)
  response.headers.set('X-Cache', 'MISS')
  return response
}

