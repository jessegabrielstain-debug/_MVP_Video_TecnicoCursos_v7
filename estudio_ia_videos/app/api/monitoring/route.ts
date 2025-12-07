/**
 * 📊 Monitoring API
 * 
 * Endpoints para monitoramento em tempo real, métricas e alertas
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { realTimeMonitor, SystemMetric } from '@/lib/monitoring/real-time-monitor'
import { Logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

const logger = new Logger('MonitoringAPI')

// Schema para filtros de métricas
const MetricsFilterSchema = z.object({
  limit: z.number().min(1).max(1000).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  metrics: z.array(z.string()).optional()
})

// Schema para filtros de alertas
const AlertsFilterSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  type: z.enum(['warning', 'error', 'critical']).optional(),
  category: z.enum(['performance', 'system', 'application', 'security']).optional(),
  resolved: z.boolean().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
})

/**
 * GET /api/monitoring
 * Obter métricas de monitoramento e status do sistema
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    // Validar autenticação (admin apenas)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      )
    }

    switch (endpoint) {
      case 'health':
        return handleHealthCheck()
      
      case 'metrics':
        return handleGetMetrics(searchParams)
      
      case 'alerts':
        return handleGetAlerts(searchParams)
      
      case 'dashboard':
        return handleGetDashboard()
      
      case 'stats':
        return handleGetStats()
      
      default:
        return handleGetOverview()
    }

  } catch (error) {
    logger.error('Monitoring API error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/monitoring
 * Operações de controle do monitoramento
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Validar autenticação (admin apenas)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      )
    }

    const body = await request.json()

    switch (action) {
      case 'resolve-alert':
        return handleResolveAlert(body)
      
      case 'start-monitoring':
        return handleStartMonitoring()
      
      case 'stop-monitoring':
        return handleStopMonitoring()
      
      case 'trigger-alert':
        return handleTriggerAlert(body)
      
      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Monitoring POST error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * Health check
 */
async function handleHealthCheck(): Promise<NextResponse> {
  const healthStatus = realTimeMonitor.getHealthStatus()
  
  return NextResponse.json({
    success: true,
    data: {
      status: healthStatus.status,
      score: healthStatus.score,
      issues: healthStatus.issues,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    }
  })
}

/**
 * Obter métricas
 */
async function handleGetMetrics(searchParams: URLSearchParams): Promise<NextResponse> {
  const filterParams = {
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    metrics: searchParams.get('metrics')?.split(',') || undefined
  }

  const filterResult = MetricsFilterSchema.safeParse(filterParams)
  if (!filterResult.success) {
    return NextResponse.json(
      { 
        error: 'Parâmetros de filtro inválidos',
        details: filterResult.error.errors
      },
      { status: 400 }
    )
  }

  const filters = filterResult.data

  // Obter métricas do monitor
  const metrics = realTimeMonitor.getMetrics(filters.limit)
  
  // Filtrar por data se especificado
  let filteredMetrics: (SystemMetric | Record<string, unknown>)[] = metrics
  if (filters.from || filters.to) {
    const fromTime = filters.from ? new Date(filters.from).getTime() : 0
    const toTime = filters.to ? new Date(filters.to).getTime() : Date.now()
    
    filteredMetrics = metrics.filter(m => 
      m.timestamp >= fromTime && m.timestamp <= toTime
    )
  }

  // Filtrar métricas específicas se especificado
  if (filters.metrics) {
    filteredMetrics = (filteredMetrics as SystemMetric[]).map(m => {
      const filtered: Record<string, unknown> = { timestamp: m.timestamp }
      
      for (const metricPath of filters.metrics!) {
        const parts = metricPath.split('.')
        let source: Record<string, unknown> = m as unknown as Record<string, unknown>
        let target: Record<string, unknown> = filtered
        
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i]
          if (!target[part]) target[part] = {}
          source = source[part] as Record<string, unknown>
          target = target[part] as Record<string, unknown>
        }
        
        const lastPart = parts[parts.length - 1]
        if (source && lastPart in source) {
          target[lastPart] = source[lastPart]
        }
      }
      
      return filtered
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      metrics: filteredMetrics,
      total: filteredMetrics.length,
      latest: realTimeMonitor.getLatestMetrics()
    }
  })
}

/**
 * Obter alertas
 */
async function handleGetAlerts(searchParams: URLSearchParams): Promise<NextResponse> {
  const filterParams = {
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    type: (searchParams.get('type') as 'warning' | 'error' | 'critical') || undefined,
    category: (searchParams.get('category') as 'performance' | 'system' | 'application' | 'security') || undefined,
    resolved: searchParams.get('resolved') ? searchParams.get('resolved') === 'true' : undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined
  }

  const filterResult = AlertsFilterSchema.safeParse(filterParams)
  if (!filterResult.success) {
    return NextResponse.json(
      { 
        error: 'Parâmetros de filtro inválidos',
        details: filterResult.error.errors
      },
      { status: 400 }
    )
  }

  const filters = filterResult.data

  // Obter alertas do monitor
  let alerts = realTimeMonitor.getAlerts(filters.resolved)

  // Aplicar filtros
  if (filters.type) {
    alerts = alerts.filter(a => a.type === filters.type)
  }

  if (filters.category) {
    alerts = alerts.filter(a => a.category === filters.category)
  }

  if (filters.from || filters.to) {
    const fromTime = filters.from ? new Date(filters.from).getTime() : 0
    const toTime = filters.to ? new Date(filters.to).getTime() : Date.now()
    
    alerts = alerts.filter(a => {
      const alertTime = a.timestamp instanceof Date ? a.timestamp.getTime() : Number(a.timestamp)
      return alertTime >= fromTime && alertTime <= toTime
    })
  }

  // Limitar resultados
  if (filters.limit) {
    alerts = alerts.slice(-filters.limit)
  }

  // Estatísticas dos alertas
  const stats = {
    total: alerts.length,
    by_type: {
      warning: alerts.filter(a => a.type === 'warning').length,
      error: alerts.filter(a => a.type === 'error').length,
      critical: alerts.filter(a => a.type === 'critical').length
    },
    by_category: {
      performance: alerts.filter(a => a.category === 'performance').length,
      system: alerts.filter(a => a.category === 'system').length,
      application: alerts.filter(a => a.category === 'application').length,
      security: alerts.filter(a => a.category === 'security').length
    },
    resolved: alerts.filter(a => a.resolved).length,
    unresolved: alerts.filter(a => !a.resolved).length
  }

  return NextResponse.json({
    success: true,
    data: {
      alerts,
      stats
    }
  })
}

/**
 * Obter dados do dashboard
 */
async function handleGetDashboard(): Promise<NextResponse> {
  const latestMetrics = realTimeMonitor.getLatestMetrics()
  const recentMetrics = realTimeMonitor.getMetrics(60) // Últimos 60 pontos
  const recentAlerts = realTimeMonitor.getAlerts().slice(-10) // Últimos 10 alertas
  const healthStatus = realTimeMonitor.getHealthStatus()

  // Calcular tendências
  const trends = calculateTrends(recentMetrics)

  return NextResponse.json({
    success: true,
    data: {
      current: latestMetrics,
      trends,
      recent_alerts: recentAlerts,
      health: healthStatus,
      summary: {
        total_requests: recentMetrics.reduce((sum, m) => sum + (m.application?.throughput || 0), 0),
        average_response_time: recentMetrics.length > 0 
          ? recentMetrics.reduce((sum, m) => sum + (m.application?.response_time || 0), 0) / recentMetrics.length 
          : 0,
        error_rate: latestMetrics?.application?.error_rate || 0,
        cache_hit_rate: latestMetrics?.cache?.hit_rate || 0,
        active_jobs: latestMetrics?.application?.concurrent_jobs || 0
      }
    }
  })
}

/**
 * Obter estatísticas gerais
 */
async function handleGetStats(): Promise<NextResponse> {
  // Buscar estatísticas do banco
  const { data: systemStats } = await (supabase as any)
    .from('system_stats')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: ttsStats } = await (supabase as any)
    .from('tts_jobs')
    .select('status, engine, processing_time')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const { data: renderStats } = await supabase
    .from('render_jobs')
    .select('status, duration_ms')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  // Calcular estatísticas
  const stats = {
    system: systemStats || {},
    tts: {
      total_jobs: ttsStats?.length || 0,
      completed_jobs: ttsStats?.filter((j: any) => j.status === 'completed').length || 0,
      failed_jobs: ttsStats?.filter((j: any) => j.status === 'failed').length || 0,
      average_processing_time: ttsStats?.length 
        ? ttsStats.reduce((sum: number, j: any) => sum + (j.processing_time || 0), 0) / ttsStats.length 
        : 0,
      engines: {
        elevenlabs: ttsStats?.filter((j: any) => j.engine === 'elevenlabs').length || 0,
        google: ttsStats?.filter((j: any) => j.engine === 'google').length || 0,
        azure: ttsStats?.filter((j: any) => j.engine === 'azure').length || 0,
        aws: ttsStats?.filter((j: any) => j.engine === 'aws').length || 0
      }
    },
    avatar: {
      total_renders: renderStats?.length || 0,
      completed_renders: renderStats?.filter(j => j.status === 'completed').length || 0,
      failed_renders: renderStats?.filter(j => j.status === 'failed').length || 0,
      average_render_time: renderStats?.length 
        ? renderStats.reduce((sum, j) => sum + (j.duration_ms || 0), 0) / renderStats.length 
        : 0,
      average_quality_score: 0
    }
  }

  return NextResponse.json({
    success: true,
    data: stats
  })
}

/**
 * Obter visão geral
 */
async function handleGetOverview(): Promise<NextResponse> {
  const healthStatus = realTimeMonitor.getHealthStatus()
  const latestMetrics = realTimeMonitor.getLatestMetrics()
  const recentAlerts = realTimeMonitor.getAlerts(false).slice(-5) // 5 alertas não resolvidos

  return NextResponse.json({
    success: true,
    data: {
      health: healthStatus,
      current_metrics: latestMetrics,
      active_alerts: recentAlerts,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Resolver alerta
 */
async function handleResolveAlert(body: { alertId?: string }): Promise<NextResponse> {
  const { alertId } = body

  if (!alertId) {
    return NextResponse.json(
      { error: 'Alert ID é obrigatório' },
      { status: 400 }
    )
  }

  await realTimeMonitor.resolveAlert(alertId)

  return NextResponse.json({
    success: true,
    message: 'Alerta resolvido com sucesso'
  })
}

/**
 * Iniciar monitoramento
 */
async function handleStartMonitoring(): Promise<NextResponse> {
  realTimeMonitor.start()

  return NextResponse.json({
    success: true,
    message: 'Monitoramento iniciado'
  })
}

/**
 * Parar monitoramento
 */
async function handleStopMonitoring(): Promise<NextResponse> {
  realTimeMonitor.stop()

  return NextResponse.json({
    success: true,
    message: 'Monitoramento parado'
  })
}

/**
 * Disparar alerta de teste
 */
async function handleTriggerAlert(body: { type?: string; category?: string; title?: string; message?: string }): Promise<NextResponse> {
  const { type, category, title, message } = body

  realTimeMonitor.emit('alert.test', {
    type: (type as 'warning' | 'error' | 'critical') || 'warning',
    category: (category as 'performance' | 'system' | 'application' | 'security') || 'system',
    title: title || 'Test Alert',
    message: message || 'This is a test alert'
  })

  return NextResponse.json({
    success: true,
    message: 'Alerta de teste disparado'
  })
}

/**
 * Calcular tendências
 */
function calculateTrends(metrics: SystemMetric[]): Record<string, number> {
  if (metrics.length < 2) return {}

  const latest = metrics[metrics.length - 1]
  const previous = metrics[metrics.length - 2]

  return {
    cpu: ((latest.cpu - previous.cpu) / previous.cpu) * 100,
    memory: ((latest.memory - previous.memory) / previous.memory) * 100,
    activeConnections: ((latest.activeConnections - previous.activeConnections) / previous.activeConnections) * 100,
    requestsPerSecond: ((latest.requestsPerSecond - previous.requestsPerSecond) / previous.requestsPerSecond) * 100
  }
}
