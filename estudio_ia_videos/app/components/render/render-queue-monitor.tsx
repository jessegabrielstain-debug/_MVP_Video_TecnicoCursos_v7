

'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { 
  Play, 
  Pause, 
  X, 
  Clock, 
  DollarSign, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Eye,
  BarChart3
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface RenderJob {
  id: string
  stage: 'queued' | 'processing' | 'composing' | 'uploading' | 'complete' | 'failed'
  progress: number
  current_step: string
  eta_seconds?: number
  cost_so_far: number
  output_url?: string
  thumbnail_url?: string
  error?: string
}

interface QueueStats {
  total_jobs: number
  queued: number
  processing: number
  completed: number
  failed: number
  average_render_time: number
  success_rate: number
  worker_capacity: {
    total: number
    available: number
    busy: number
  }
}

export default function RenderQueueMonitor() {
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Polling for job updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(async () => {
      await Promise.all([
        fetchQueueStats(),
        fetchActiveJobs()
      ])
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial load
  useEffect(() => {
    fetchQueueStats()
    fetchActiveJobs()
  }, [])

  const fetchQueueStats = async () => {
    try {
      const response = await fetch('/api/render/queue-stats')
      const result = await response.json()
      
      if (result.success) {
        setQueueStats(result.data)
      }
    } catch (error) {
      logger.error('Error fetching queue stats', error instanceof Error ? error : new Error(String(error)), { component: 'RenderQueueMonitor' })
    }
  }

  const fetchActiveJobs = async () => {
    try {
      // Simulate fetching user jobs - in production, implement user-specific endpoint
      const mockJobs: RenderJob[] = [
        {
          id: 'job-1',
          stage: 'processing',
          progress: 65,
          current_step: 'Rendering 3D avatar with lip-sync',
          eta_seconds: 45,
          cost_so_far: 0.35
        },
        {
          id: 'job-2',
          stage: 'complete',
          progress: 100,
          current_step: 'Render completed successfully',
          cost_so_far: 0.85,
          output_url: 'https://cdn.estudio-ia.com/renders/job-2.mp4',
          thumbnail_url: 'https://miro.medium.com/v2/resize:fit:1400/1*hyTsMqvcXD70uo7jGzrZjQ.png'
        },
        {
          id: 'job-3',
          stage: 'queued',
          progress: 0,
          current_step: 'Waiting in queue (position #2)',
          cost_so_far: 0
        }
      ]
      
      setJobs(mockJobs)
    } catch (error) {
      logger.error('Error fetching jobs', error instanceof Error ? error : new Error(String(error)), { component: 'RenderQueueMonitor' })
    }
  }

  const handleCancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/render/status/${jobId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Job cancelado com sucesso')
        fetchActiveJobs()
      } else {
        toast.error(result.error || 'Erro ao cancelar job')
      }
    } catch (error) {
      logger.error('Error cancelling job', error instanceof Error ? error : new Error(String(error)), { component: 'RenderQueueMonitor' })
      toast.error('Erro ao cancelar job')
    }
  }

  const handleDownload = (job: RenderJob) => {
    if (job.output_url) {
      window.open(job.output_url, '_blank')
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'queued': return 'bg-gray-100 text-gray-700'
      case 'processing': return 'bg-blue-100 text-blue-700'
      case 'composing': return 'bg-purple-100 text-purple-700'
      case 'uploading': return 'bg-orange-100 text-orange-700'
      case 'complete': return 'bg-green-100 text-green-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'queued': return <Clock className="w-4 h-4" />
      case 'processing': return <Activity className="w-4 h-4" />
      case 'composing': return <Play className="w-4 h-4" />
      case 'uploading': return <RefreshCw className="w-4 h-4" />
      case 'complete': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatETA = (seconds?: number) => {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      {queueStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jobs na Fila</p>
                  <p className="text-2xl font-bold">{queueStats.queued}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Processando</p>
                  <p className="text-2xl font-bold">{queueStats.processing}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold">{(queueStats.success_rate * 100).toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold">{Math.ceil(queueStats.average_render_time / 60)}m</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Jobs de Render
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso dos seus vídeos em tempo real
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Auto-refresh
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchQueueStats()
                  fetchActiveJobs()
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 space-y-3">
                {/* Job Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStageIcon(job.stage)}
                    <div>
                      <p className="font-medium">Job {job.id.slice(-8)}</p>
                      <p className="text-sm text-gray-600">{job.current_step}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStageColor(job.stage)}>
                      {job.stage === 'processing' ? 'Processando' :
                       job.stage === 'queued' ? 'Na Fila' :
                       job.stage === 'composing' ? 'Compondo' :
                       job.stage === 'uploading' ? 'Enviando' :
                       job.stage === 'complete' ? 'Completo' :
                       job.stage === 'failed' ? 'Falha' : job.stage}
                    </Badge>
                    
                    {job.stage === 'complete' && job.output_url && (
                      <Button size="sm" onClick={() => handleDownload(job)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {job.stage === 'complete' && job.thumbnail_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(job.thumbnail_url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {['queued', 'processing'].includes(job.stage) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelJob(job.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {job.stage !== 'complete' && job.stage !== 'failed' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso</span>
                      <span>{job.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>
                )}

                {/* Job Details */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>${job.cost_so_far.toFixed(3)}</span>
                    </div>
                    
                    {job.eta_seconds && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>ETA: {formatETA(job.eta_seconds)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {job.stage === 'complete' && 'Concluído'}
                    {job.stage === 'failed' && job.error && `Erro: ${job.error}`}
                  </div>
                </div>

                {/* Error Details */}
                {job.stage === 'failed' && job.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900">Erro no Processamento</span>
                    </div>
                    <p className="text-sm text-red-700">{job.error}</p>
                  </div>
                )}

                {/* Completed Job Actions */}
                {job.stage === 'complete' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Vídeo pronto para download
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {job.thumbnail_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(job.thumbnail_url, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          onClick={() => handleDownload(job)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {jobs.length === 0 && (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhum job ativo</h3>
                <p className="text-gray-600 mb-4">
                  Seus jobs de render aparecerão aqui quando iniciados
                </p>
                <Button variant="outline" onClick={fetchActiveJobs}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Queue Health Status */}
      {queueStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Workers Disponíveis</span>
                  <span className="font-medium">
                    {queueStats.worker_capacity.available}/{queueStats.worker_capacity.total}
                  </span>
                </div>
                <Progress 
                  value={(queueStats.worker_capacity.available / queueStats.worker_capacity.total) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                  <span className="font-medium text-green-600">
                    {(queueStats.success_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={queueStats.success_rate * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tempo Médio</span>
                  <span className="font-medium">
                    {Math.ceil(queueStats.average_render_time / 60)}min
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Para vídeos de 60-90 segundos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
