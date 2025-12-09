

'use client'

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Monitor,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Video,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'

interface SystemStatus {
  queue: {
    total_jobs: number
    queued: number
    processing: number
    completed: number
    failed: number
    avg_wait_time: number
    throughput_per_hour: number
  }
  workers: {
    isRunning: boolean
    cpu_usage: number
    memory_usage: number
    gpu_usage: number
  }
  performance: {
    total_renders_today: number
    avg_render_time_per_slide: number
    success_rate_24h: number
    cost_efficiency: number
  }
  system: {
    status: string
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    temperature: string
  }
}

export default function RealTimeMonitor() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/v1/render/live-status')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data.data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      logger.error('Error fetching system status', error instanceof Error ? error : new Error(String(error)), { component: 'RealTimeMonitor' })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto refresh
  useEffect(() => {
    fetchSystemStatus()
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemStatus, 5000) // Update every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!systemStatus) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Erro ao carregar status</h3>
          <Button onClick={fetchSystemStatus} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { queue, workers, performance, system } = systemStatus

  return (
    <div className="space-y-6">
      
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-600" />
            Monitor em Tempo Real
          </h2>
          <p className="text-muted-foreground">
            Status do sistema de renderização • Última atualização: {' '}
            {lastUpdate?.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={system.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {system.status === 'healthy' ? '🟢 Sistema Saudável' : '🔴 Problemas Detectados'}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pausar' : 'Auto-refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSystemStatus}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Queue Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fila de Render</p>
                <p className="text-2xl font-bold text-orange-600">{queue.queued}</p>
                <p className="text-xs text-muted-foreground">
                  {queue.processing} processando
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Tempo médio</span>
                <span>{queue.avg_wait_time}s</span>
              </div>
              <Progress value={Math.min(100, (queue.queued / 10) * 100)} className="h-1" />
            </div>
          </CardContent>
        </Card>

        {/* Processing Power */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPU + GPU</p>
                <p className="text-2xl font-bold text-blue-600">
                  {((workers.cpu_usage + workers.gpu_usage) / 2 * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {workers.isRunning ? 'Workers ativos' : 'Workers inativos'}
                </p>
              </div>
              <Cpu className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>CPU</span>
                <span>{(workers.cpu_usage * 100).toFixed(0)}%</span>
              </div>
              <Progress value={workers.cpu_usage * 100} className="h-1" />
              <div className="flex justify-between text-xs">
                <span>GPU</span>
                <span>{(workers.gpu_usage * 100).toFixed(0)}%</span>
              </div>
              <Progress value={workers.gpu_usage * 100} className="h-1" />
            </div>
          </CardContent>
        </Card>

        {/* Performance Today */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Renders Hoje</p>
                <p className="text-2xl font-bold text-green-600">{performance.total_renders_today}</p>
                <p className="text-xs text-muted-foreground">
                  {(performance.success_rate_24h * 100).toFixed(1)}% sucesso
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Tempo médio/slide</span>
                <span>{performance.avg_render_time_per_slide}s</span>
              </div>
              <Progress value={performance.success_rate_24h * 100} className="h-1" />
            </div>
          </CardContent>
        </Card>

        {/* Cost Efficiency */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eficiência</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(performance.cost_efficiency * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Custo-benefício
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Custo hoje</span>
                <span>$12.85</span>
              </div>
              <Progress value={performance.cost_efficiency * 100} className="h-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Recursos do Sistema
            </CardTitle>
            <CardDescription>
              Monitoramento em tempo real do hardware
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* CPU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">CPU</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {(system.cpu_usage * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={system.cpu_usage * 100} className="h-2" />
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Memória</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {(system.memory_usage * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={system.memory_usage * 100} className="h-2" />
            </div>

            {/* GPU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">GPU</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {(workers.gpu_usage * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={workers.gpu_usage * 100} className="h-2" />
            </div>

            {/* Disk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">Armazenamento</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {(system.disk_usage * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={system.disk_usage * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tendências de Performance
            </CardTitle>
            <CardDescription>
              Métricas das últimas 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Render Throughput */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Throughput/Hora</span>
                <span className="text-sm text-muted-foreground">{queue.throughput_per_hour}</span>
              </div>
              <div className="h-12 bg-muted rounded flex items-end gap-1 p-1">
                {[8, 12, 15, 11, 9, 14, 16, 13, 10, 12, 18, 20].map((value, index) => (
                  <div
                    key={index}
                    className="bg-blue-500 rounded-sm flex-1"
                    style={{ height: `${(value / 20) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Success Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de Sucesso</span>
                <span className="text-sm text-green-600 font-semibold">
                  {(performance.success_rate_24h * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={performance.success_rate_24h * 100} className="h-2" />
            </div>

            {/* Cost Efficiency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Eficiência de Custo</span>
                <span className="text-sm text-purple-600 font-semibold">
                  {(performance.cost_efficiency * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={performance.cost_efficiency * 100} className="h-2" />
            </div>

            {/* Quality Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qualidade Média</span>
                <span className="text-sm text-emerald-600 font-semibold">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Jobs Ativos
          </CardTitle>
          <CardDescription>
            Renderizações em andamento no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queue.processing > 0 ? (
            <div className="space-y-4">
              {/* Mock active jobs */}
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium">Projeto NR-12 Completo</p>
                      <p className="text-sm text-muted-foreground">
                        Slide 3/8 • Renderizando avatar 3D
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">67%</p>
                    <p className="text-xs text-muted-foreground">~2m restantes</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium">Segurança Industrial</p>
                      <p className="text-sm text-muted-foreground">
                        Slide 1/5 • Gerando narração TTS
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">23%</p>
                    <p className="text-xs text-muted-foreground">~4m restantes</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nenhum job ativo</h3>
              <p className="text-sm text-muted-foreground">
                Todos os renders foram concluídos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Today's Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estatísticas de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de Renders</span>
              <span className="font-semibold">{performance.total_renders_today}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
              <span className="font-semibold text-green-600">
                {(performance.success_rate_24h * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tempo Médio/Slide</span>
              <span className="font-semibold">{performance.avg_render_time_per_slide}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Custo Total</span>
              <span className="font-semibold">$12.85</span>
            </div>
          </CardContent>
        </Card>

        {/* Queue Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saúde da Fila</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Jobs Concluídos</span>
              <span className="font-semibold text-green-600">{queue.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Jobs com Erro</span>
              <span className="font-semibold text-red-600">{queue.failed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Throughput/h</span>
              <span className="font-semibold">{queue.throughput_per_hour}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tempo de Espera</span>
              <span className="font-semibold">{queue.avg_wait_time}s</span>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saúde do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status Geral</span>
              <Badge className="bg-green-100 text-green-700">
                {system.status === 'healthy' ? 'Saudável' : 'Problemas'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Temperatura</span>
              <span className="font-semibold">
                {system.temperature === 'normal' ? '🟢 Normal' : '🟡 Elevada'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uso de Disco</span>
              <span className="font-semibold">{(system.disk_usage * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Latência</span>
              <span className="font-semibold">12ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {system.cpu_usage > 0.8 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Uso elevado de CPU detectado ({(system.cpu_usage * 100).toFixed(0)}%). 
            Os tempos de renderização podem estar mais lentos que o normal.
          </AlertDescription>
        </Alert>
      )}

      {queue.queued > 5 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Fila com {queue.queued} jobs pendentes. 
            Considere processar em lotes ou durante horários de menor movimento.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

