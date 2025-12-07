/**
 * 🔄 API Pipeline Integrado TTS → Avatar → Vídeo
 * 
 * Endpoints para processamento completo do pipeline
 * Performance target: <30s para vídeo de 1min
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { integratedPipeline, PipelineInput } from '@/lib/pipeline/integrated-pipeline'
import { Logger } from '@/lib/logger'

const logger = new Logger('PipelineAPI')

// Schemas de validação
const PipelineInputSchema = z.object({
  text: z.string().min(1).max(10000),
  voice_config: z.object({
    engine: z.enum(['elevenlabs', 'google', 'azure', 'aws']),
    voice_id: z.string(),
    settings: z.record(z.unknown()).optional()
  }),
  avatar_config: z.object({
    model_url: z.string().url(),
    animations: z.array(z.string()).optional(),
    materials: z.array(z.unknown()).optional(),
    lighting: z.unknown().optional(),
    camera: z.unknown().optional(),
    environment: z.unknown().optional()
  }),
  render_settings: z.object({
    width: z.number().min(480).max(4096),
    height: z.number().min(360).max(2160),
    fps: z.number().min(15).max(60),
    quality: z.enum(['low', 'medium', 'high', 'ultra']),
    format: z.enum(['webm', 'mp4', 'gif']),
    duration_limit: z.number().optional()
  }),
  options: z.object({
    cache_enabled: z.boolean().optional(),
    priority_processing: z.boolean().optional(),
    quality_optimization: z.boolean().optional(),
    real_time_preview: z.boolean().optional()
  }).optional()
})

const PrioritySchema = z.enum(['low', 'normal', 'high', 'urgent'])

/**
 * POST /api/pipeline
 * Criar novo job no pipeline integrado
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Validar entrada
    const body = await request.json()
    const validatedInput = PipelineInputSchema.parse(body.input)
    const priority = body.priority ? PrioritySchema.parse(body.priority) : 'normal'

    // Verificar limites do usuário
    const userLimits = await checkUserLimits(user.id, supabase)
    if (!userLimits.canProcess) {
      return NextResponse.json(
        { 
          error: 'Limite de processamento atingido',
          details: userLimits
        },
        { status: 429 }
      )
    }

    // Criar job no pipeline
    const jobId = await integratedPipeline.createJob(
      user.id,
      validatedInput,
      priority
    )

    // Log da criação
    logger.info('Pipeline job created via API', {
      jobId,
      userId: user.id,
      priority,
      textLength: validatedInput.text.length,
      engine: validatedInput.voice_config.engine,
      quality: validatedInput.render_settings.quality
    })

    // Salvar log no Supabase
    await supabase.from('api_logs').insert({
      endpoint: '/api/pipeline',
      method: 'POST',
      user_id: user.id,
      request_data: {
        job_id: jobId,
        text_length: validatedInput.text.length,
        engine: validatedInput.voice_config.engine,
        priority
      },
      response_status: 201,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: 'queued',
      message: 'Job criado com sucesso no pipeline',
      estimated_completion: new Date(Date.now() + 30000).toISOString(), // 30s estimado
      queue_position: integratedPipeline.getQueueStatus().queued_jobs
    }, { status: 201 })

  } catch (error) {
    logger.error('Pipeline creation failed', error instanceof Error ? error : new Error(String(error)))

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados de entrada inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pipeline
 * Obter status da fila e estatísticas
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obter status da fila
    const queueStatus = integratedPipeline.getQueueStatus()

    // Obter estatísticas do usuário
    const userStats = await getUserStats(user.id, supabase)

    // Obter estatísticas gerais (apenas para admins)
    const isAdmin = await checkAdminPermission(user.id, supabase)
    const generalStats = isAdmin ? await getGeneralStats(supabase) : null

    return NextResponse.json({
      success: true,
      queue_status: queueStatus,
      user_stats: userStats,
      general_stats: generalStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to get pipeline status', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Verificar limites do usuário
 */
async function checkUserLimits(userId: string, supabase: SupabaseClient) {
  try {
    // Verificar jobs ativos
    const { data: activeJobs } = await supabase
      .from('pipeline_jobs')
      .select('job_id')
      .eq('user_id', userId)
      .in('status', ['queued', 'processing'])

    // Verificar jobs nas últimas 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentJobs } = await supabase
      .from('pipeline_jobs')
      .select('job_id')
      .eq('user_id', userId)
      .gte('created_at', yesterday)

    // Verificar plano do usuário
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('plan, limits')
      .eq('user_id', userId)
      .single()

    const plan = userProfile?.plan || 'free'
    const limits = userProfile?.limits || getDefaultLimits(plan)

    const canProcess = (
      (activeJobs?.length || 0) < limits.concurrent_jobs &&
      (recentJobs?.length || 0) < limits.daily_jobs
    )

    return {
      canProcess,
      activeJobs: activeJobs?.length || 0,
      recentJobs: recentJobs?.length || 0,
      limits,
      plan
    }

  } catch (error) {
    logger.error('Failed to check user limits', error instanceof Error ? error : new Error(String(error)), { userId })
    return {
      canProcess: true, // Permitir em caso de erro
      activeJobs: 0,
      recentJobs: 0,
      limits: getDefaultLimits('free'),
      plan: 'free'
    }
  }
}

/**
 * Obter limites padrão por plano
 */
function getDefaultLimits(plan: string) {
  const limits = {
    free: { concurrent_jobs: 1, daily_jobs: 10, max_duration: 60 },
    basic: { concurrent_jobs: 2, daily_jobs: 50, max_duration: 300 },
    pro: { concurrent_jobs: 5, daily_jobs: 200, max_duration: 1800 },
    enterprise: { concurrent_jobs: 10, daily_jobs: 1000, max_duration: 3600 }
  }

  return limits[plan as keyof typeof limits] || limits.free
}

/**
 * Obter estatísticas do usuário
 */
async function getUserStats(userId: string, supabase: SupabaseClient) {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Jobs por status
    const { data: jobsByStatus } = await supabase
      .from('pipeline_jobs')
      .select('status')
      .eq('user_id', userId)

    // Jobs recentes
    const { data: recentJobs } = await supabase
      .from('pipeline_jobs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false })
      .limit(10)

    // Tempo médio de processamento
    const { data: completedJobs } = await supabase
      .from('pipeline_jobs')
      .select('created_at, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', lastWeek)

    const avgProcessingTime = completedJobs?.length ? 
      completedJobs.reduce((sum, job) => {
        const start = new Date(job.created_at).getTime()
        const end = new Date(job.completed_at).getTime()
        return sum + (end - start)
      }, 0) / completedJobs.length : 0

    // Agrupar por status
    const statusCounts = jobsByStatus?.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      total_jobs: jobsByStatus?.length || 0,
      jobs_by_status: statusCounts,
      recent_jobs: recentJobs || [],
      average_processing_time: Math.round(avgProcessingTime),
      success_rate: statusCounts.completed ? 
        (statusCounts.completed / (jobsByStatus?.length || 1)) * 100 : 0
    }

  } catch (error) {
    logger.error('Failed to get user stats', error instanceof Error ? error : new Error(String(error)), { userId })
    return {
      total_jobs: 0,
      jobs_by_status: {},
      recent_jobs: [],
      average_processing_time: 0,
      success_rate: 0
    }
  }
}

/**
 * Verificar permissão de admin
 */
async function checkAdminPermission(userId: string, supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    return data?.role === 'admin'
  } catch {
    return false
  }
}

/**
 * Obter estatísticas gerais (apenas admins)
 */
async function getGeneralStats(supabase: SupabaseClient) {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Total de jobs
    const { count: totalJobs } = await supabase
      .from('pipeline_jobs')
      .select('*', { count: 'exact', head: true })

    // Jobs nas últimas 24h
    const { count: recentJobs } = await supabase
      .from('pipeline_jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday)

    // Jobs por engine
    const { data: jobsByEngine } = await supabase
      .from('pipeline_jobs')
      .select('input_data')
      .gte('created_at', yesterday)

    const engineCounts = jobsByEngine?.reduce((acc, job) => {
      const engine = job.input_data?.voice_config?.engine || 'unknown'
      acc[engine] = (acc[engine] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Performance médio
    const { data: performanceData } = await supabase
      .from('pipeline_jobs')
      .select('output_data')
      .eq('status', 'completed')
      .gte('created_at', yesterday)

    const avgPerformance = performanceData?.length ?
      performanceData.reduce((sum, job) => {
        return sum + (job.output_data?.processing_stats?.total_time || 0)
      }, 0) / performanceData.length : 0

    return {
      total_jobs: totalJobs || 0,
      recent_jobs: recentJobs || 0,
      jobs_by_engine: engineCounts,
      average_performance: Math.round(avgPerformance),
      system_health: 'healthy' // Implementar verificação real
    }

  } catch (error) {
    logger.error('Failed to get general stats', error instanceof Error ? error : new Error(String(error)))
    return {
      total_jobs: 0,
      recent_jobs: 0,
      jobs_by_engine: {},
      average_performance: 0,
      system_health: 'unknown'
    }
  }
}
