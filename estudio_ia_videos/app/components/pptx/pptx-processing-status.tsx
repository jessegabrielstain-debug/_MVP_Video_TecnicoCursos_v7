
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Video,
  Zap
} from 'lucide-react'
import { Logger } from '@/lib/logger'

const logger = new Logger('PPTXProcessingStatus')

interface ProcessingStage {
  id: string
  name: string
  status: 'pending' | 'active' | 'completed' | 'error'
  progress: number
  duration?: number
}

interface ProcessingStatusProps {
  uploadId?: string
  onComplete?: (result: Record<string, unknown>) => void
  onError?: (error: string) => void
}

export default function PPTXProcessingStatus({ 
  uploadId, 
  onComplete, 
  onError 
}: ProcessingStatusProps) {
  const [stages, setStages] = useState<ProcessingStage[]>([
    {
      id: 'upload',
      name: 'Upload para S3',
      status: 'pending',
      progress: 0
    },
    {
      id: 'extraction',
      name: 'Extração de Conteúdo',
      status: 'pending',
      progress: 0
    },
    {
      id: 'images',
      name: 'Processamento de Imagens',
      status: 'pending',
      progress: 0
    },
    {
      id: 'timeline',
      name: 'Geração de Timeline',
      status: 'pending',
      progress: 0
    },
    {
      id: 'finalization',
      name: 'Finalização',
      status: 'pending',
      progress: 0
    }
  ])

  const [overallProgress, setOverallProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('upload')
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  useEffect(() => {
    if (!uploadId) return

    // Simulate real-time processing updates
    const simulateProcessing = async () => {
      const stageSequence = ['upload', 'extraction', 'images', 'timeline', 'finalization']
      
      for (let i = 0; i < stageSequence.length; i++) {
        const stageId = stageSequence[i]
        
        // Mark current stage as active
        setCurrentStage(stageId)
        setStages(prev => prev.map(stage => 
          stage.id === stageId 
            ? { ...stage, status: 'active' }
            : stage
        ))

        // Simulate stage progress
        await new Promise(resolve => {
          let progress = 0
          const progressInterval = setInterval(() => {
            progress += Math.random() * 15
            progress = Math.min(progress, 100)
            
            setStages(prev => prev.map(stage => 
              stage.id === stageId 
                ? { ...stage, progress: Math.round(progress) }
                : stage
            ))

            if (progress >= 100) {
              setStages(prev => prev.map(stage => 
                stage.id === stageId 
                  ? { ...stage, status: 'completed', progress: 100 }
                  : stage
              ))
              
              clearInterval(progressInterval)
              resolve(void 0)
            }
          }, Math.random() * 300 + 100)
        })

        // Update overall progress
        const completedStages = i + 1
        const totalStages = stageSequence.length
        setOverallProgress(Math.round((completedStages / totalStages) * 100))
      }

      // Processing complete
      setTimeout(() => {
        if (onComplete) {
          onComplete({
            success: true,
            uploadId,
            processingTime: Date.now() - startTime,
            stages: stages.map(s => ({ ...s, status: 'completed' }))
          })
        }
      }, 500)
    }

    simulateProcessing().catch(error => {
      logger.error('Processing simulation error', error instanceof Error ? error : undefined)
      if (onError) {
        onError('Erro durante o processamento')
      }
    })
  }, [uploadId])

  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case 'upload': return <Zap className="w-4 h-4" />
      case 'extraction': return <FileText className="w-4 h-4" />
      case 'images': return <ImageIcon className="w-4 h-4" />
      case 'timeline': return <Video className="w-4 h-4" />
      case 'finalization': return <CheckCircle2 className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'active':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${seconds}s`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            Processamento em Andamento
          </span>
          <Badge variant="outline" className="text-xs">
            {formatTime(elapsedTime)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Stage Details */}
        <div className="space-y-3">
          {stages.map((stage) => (
            <div key={stage.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(stage.status)}
                  <span className="text-sm font-medium">
                    {stage.name}
                  </span>
                  {stage.status === 'active' && (
                    <Badge variant="secondary" className="text-xs">
                      Em andamento
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {stage.progress}%
                </span>
              </div>
              
              {stage.status === 'active' && (
                <Progress value={stage.progress} className="h-1" />
              )}
            </div>
          ))}
        </div>

        {/* Current Activity */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 text-sm">
            {getStageIcon(currentStage)}
            <span className="text-muted-foreground">
              {stages.find(s => s.id === currentStage)?.name}...
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
