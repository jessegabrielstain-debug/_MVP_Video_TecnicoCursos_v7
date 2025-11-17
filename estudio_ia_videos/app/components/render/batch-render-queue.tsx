
'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription } from '../ui/alert'
import { ScrollArea } from '../ui/scroll-area'
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload,
  Settings, 
  Video, 
  Users,
  Eye,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  PlayCircle,
  StopCircle,
  RotateCcw,
  Zap,
  Film,
  Server,
  HardDrive
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BatchRenderJob {
  id: string
  name: string
  project: {
    name: string
    slides: number
    duration: number
  }
  status: 'queued' | 'rendering' | 'completed' | 'failed' | 'paused'
  progress: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
  estimatedTime?: number
  actualTime?: number
  startTime?: Date
  endTime?: Date
  outputSize?: number
  quality: string
  format: string
}

export default function BatchRenderQueue() {
  const [renderQueue, setRenderQueue] = useState<BatchRenderJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentlyRendering, setCurrentlyRendering] = useState<string | null>(null)
  const [queueSettings, setQueueSettings] = useState({
    maxConcurrent: 2,
    autoStart: true,
    priority: 'normal' as const
  })

  const addToQueue = useCallback((projectData: any) => {
    const newJob: BatchRenderJob = {
      id: `batch_${Date.now()}`,
      name: `${projectData.name || 'Untitled'} - ${new Date().toLocaleString()}`,
      project: {
        name: projectData.name || 'Untitled Project',
        slides: projectData.slides || 10,
        duration: projectData.duration || 60
      },
      status: 'queued',
      progress: 0,
      priority: queueSettings.priority,
      quality: 'high',
      format: 'mp4'
    }

    setRenderQueue(prev => [...prev, newJob])
    toast.success('✅ Projeto adicionado à fila de renderização')

    if (queueSettings.autoStart && !isProcessing) {
      processQueue()
    }
  }, [queueSettings, isProcessing])

  const processQueue = useCallback(async () => {
    if (isProcessing) return

    const queuedJobs = renderQueue.filter(job => job.status === 'queued')
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

    if (queuedJobs.length === 0) return

    setIsProcessing(true)

    for (const job of queuedJobs.slice(0, queueSettings.maxConcurrent)) {
      await processJob(job)
    }

    setIsProcessing(false)
  }, [renderQueue, queueSettings.maxConcurrent])

  const processJob = async (job: BatchRenderJob) => {
    try {
      setCurrentlyRendering(job.id)
      
      // Update job status
      setRenderQueue(prev => prev.map(j => 
        j.id === job.id 
          ? { ...j, status: 'rendering', startTime: new Date() }
          : j
      ))

      // Simulate rendering process
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        
        setRenderQueue(prev => prev.map(j => 
          j.id === job.id ? { ...j, progress } : j
        ))
      }

      // Complete job
      setRenderQueue(prev => prev.map(j => 
        j.id === job.id 
          ? { 
              ...j, 
              status: 'completed', 
              progress: 100, 
              endTime: new Date(),
              outputSize: Math.random() * 50 + 10 // Mock size
            }
          : j
      ))

      toast.success(`✅ ${job.name} renderizado com sucesso!`)

    } catch (error) {
      setRenderQueue(prev => prev.map(j => 
        j.id === job.id ? { ...j, status: 'failed' } : j
      ))
      toast.error(`❌ Falha na renderização: ${job.name}`)
    } finally {
      setCurrentlyRendering(null)
    }
  }

  const pauseJob = (jobId: string) => {
    setRenderQueue(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'paused' } : job
    ))
    toast.success('⏸️ Renderização pausada')
  }

  const resumeJob = (jobId: string) => {
    setRenderQueue(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'queued' } : job
    ))
    toast.success('▶️ Renderização retomada')
  }

  const removeJob = (jobId: string) => {
    setRenderQueue(prev => prev.filter(job => job.id !== jobId))
    toast.success('🗑️ Trabalho removido da fila')
  }

  const clearCompleted = () => {
    setRenderQueue(prev => prev.filter(job => job.status !== 'completed'))
    toast.success('🧹 Trabalhos concluídos removidos')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'normal': return 'text-blue-500'
      case 'low': return 'text-gray-500'
      default: return 'text-blue-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="h-4 w-4 text-orange-500" />
      case 'rendering': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    return `${bytes.toFixed(1)} MB`
  }

  const completedJobs = renderQueue.filter(job => job.status === 'completed').length
  const failedJobs = renderQueue.filter(job => job.status === 'failed').length
  const queuedJobs = renderQueue.filter(job => job.status === 'queued').length

  return (
    <div className="space-y-6">
      {/* Queue Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Na Fila</span>
            </div>
            <div className="text-2xl font-bold mt-1">{queuedJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Renderizando</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {renderQueue.filter(job => job.status === 'rendering').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Concluídos</span>
            </div>
            <div className="text-2xl font-bold mt-1">{completedJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Falharam</span>
            </div>
            <div className="text-2xl font-bold mt-1">{failedJobs}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="queue">Fila de Renderização</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Queue Management */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fila de Renderização</CardTitle>
                  <CardDescription>
                    Gerencie trabalhos de renderização em lote
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => addToQueue({ name: 'Projeto Demo', slides: 15, duration: 45 })}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Demo
                  </Button>
                  
                  {completedJobs > 0 && (
                    <Button
                      onClick={clearCompleted}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Concluídos
                    </Button>
                  )}
                  
                  <Button
                    onClick={processQueue}
                    disabled={isProcessing || queuedJobs === 0}
                    size="sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Iniciar Fila
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum trabalho na fila</p>
                  <p className="text-sm">Adicione projetos para renderização em lote</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {renderQueue.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(job.status)}
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{job.project.name}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={getPriorityColor(job.priority)}
                                  >
                                    {job.priority}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {job.format.toUpperCase()} • {job.quality}
                                  </Badge>
                                </div>
                                
                                <div className="text-sm text-muted-foreground mt-1">
                                  {job.project.slides} slides • {job.project.duration}s
                                  {job.outputSize && (
                                    <span> • {formatFileSize(job.outputSize)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {job.status === 'rendering' && (
                              <Progress value={job.progress} className="w-full mt-3" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {job.status === 'rendering' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => pauseJob(job.id)}
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {job.status === 'paused' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => resumeJob(job.id)}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {job.status === 'completed' && (
                              <Button 
                                size="sm" 
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </Button>
                            )}
                            
                            {job.status !== 'rendering' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => removeJob(job.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Fila</CardTitle>
              <CardDescription>
                Configure o comportamento da renderização em lote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Máximo de Renderizações Concorrentes</Label>
                <Select
                  value={queueSettings.maxConcurrent.toString()}
                  onValueChange={(value) => 
                    setQueueSettings(prev => ({ ...prev, maxConcurrent: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Sequencial</SelectItem>
                    <SelectItem value="2">2 - Balanceado</SelectItem>
                    <SelectItem value="3">3 - Performance</SelectItem>
                    <SelectItem value="4">4 - Máxima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade Padrão</Label>
                <Select
                  value={queueSettings.priority}
                  onValueChange={(value: string) => 
                    setQueueSettings(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Início Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Inicia renderização automaticamente ao adicionar trabalhos
                  </p>
                </div>
                <Button
                  variant={queueSettings.autoStart ? "default" : "outline"}
                  size="sm"
                  onClick={() => 
                    setQueueSettings(prev => ({ ...prev, autoStart: !prev.autoStart }))
                  }
                >
                  {queueSettings.autoStart ? 'Ativado' : 'Desativado'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
