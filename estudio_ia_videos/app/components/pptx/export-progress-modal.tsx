
/**
 * 📊 Modal de Progresso de Exportação
 * Acompanhar renderização em tempo real
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Logger } from '@/lib/logger'
import { 
  Play, 
  Download, 
  X, 
  Clock, 
  FileVideo,
  CheckCircle,
  AlertCircle,
  Loader,
  Mic,
  Volume2,
  Sparkles
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  jobId: string | null
  onComplete?: (videoUrl: string) => void
}

interface JobStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  outputUrl?: string
  error?: string
  estimatedTimeRemaining?: number
  timeline: {
    totalDuration: number
    scenesCount: number
    hasNarration: boolean
    hasMusic: boolean
  }
}

export function ExportProgressModal({ isOpen, onClose, jobId, onComplete }: Props) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [currentStep, setCurrentStep] = useState('')

  useEffect(() => {
    if (!jobId || !isOpen) return

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/v1/render/status/${jobId}`)
        const data = await response.json()
        
        if (data.success) {
          setJobStatus(data.job)
          
          // Definir step atual baseado no progresso
          if (data.job.progress < 20) {
            setCurrentStep('Inicializando renderização...')
          } else if (data.job.progress < 40) {
            setCurrentStep('Gerando narração TTS...')
          } else if (data.job.progress < 60) {
            setCurrentStep('Processando slides...')
          } else if (data.job.progress < 80) {
            setCurrentStep('Aplicando transições...')
          } else if (data.job.progress < 95) {
            setCurrentStep('Finalizando vídeo...')
          } else {
            setCurrentStep('Concluído!')
          }
          
          if (data.job.status === 'completed') {
            toast.success('🎉 Vídeo renderizado com sucesso!')
            onComplete?.(data.job.outputUrl)
          } else if (data.job.status === 'error') {
            toast.error(`❌ Erro: ${data.job.error}`)
          }
        }
      } catch (error) {
        const logger = new Logger('ExportProgress')
        logger.error('Error polling status', error instanceof Error ? error : undefined)
      }
    }

    // Poll inicial
    pollStatus()
    
    // Poll a cada 2 segundos se estiver processando
    const interval = setInterval(() => {
      if (jobStatus?.status === 'processing' || jobStatus?.status === 'pending') {
        pollStatus()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobId, isOpen, jobStatus?.status, onComplete])

  const handleDownload = () => {
    if (jobStatus?.outputUrl) {
      window.open(jobStatus.outputUrl, '_blank')
      toast.success('📥 Download iniciado!')
    }
  }

  const handleCancel = async () => {
    if (jobId && jobStatus?.status === 'processing') {
      try {
        await fetch(`/api/v1/render/status/${jobId}`, { method: 'DELETE' })
        toast.success('🛑 Renderização cancelada')
        onClose()
      } catch (error) {
        toast.error('❌ Erro ao cancelar')
      }
    } else {
      onClose()
    }
  }

  const getStatusIcon = () => {
    switch (jobStatus?.status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileVideo className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (jobStatus?.status) {
      case 'pending': return 'bg-yellow-500'
      case 'processing': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {getStatusIcon()}
            <span className="ml-2">Renderização de Vídeo</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {jobStatus && (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor()} text-white text-sm px-4 py-2`}
                >
                  {jobStatus.status.toUpperCase()}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">{jobStatus.progress}%</span>
                </div>
                <Progress value={jobStatus.progress} className="w-full h-3" />
                <div className="text-xs text-gray-600 text-center">
                  {currentStep}
                </div>
              </div>

              {/* Timeline Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duração:</span>
                  <span className="font-medium">{jobStatus.timeline.totalDuration}s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Slides:</span>
                  <span className="font-medium">{jobStatus.timeline.scenesCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Mic className="h-3 w-3 mr-1" />
                    Narração:
                  </span>
                  <span className="font-medium">
                    {jobStatus.timeline.hasNarration ? '✅ Sim' : '❌ Não'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Volume2 className="h-3 w-3 mr-1" />
                    Música:
                  </span>
                  <span className="font-medium">
                    {jobStatus.timeline.hasMusic ? '✅ Sim' : '❌ Não'}
                  </span>
                </div>
              </div>

              {/* Tempo Estimado */}
              {jobStatus.estimatedTimeRemaining && jobStatus.status === 'processing' && (
                <div className="text-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Tempo estimado restante: {jobStatus.estimatedTimeRemaining}s
                </div>
              )}

              {/* Error Display */}
              {jobStatus.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {jobStatus.error}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {jobStatus.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-green-800 font-medium">
                    Vídeo renderizado com sucesso!
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Seu vídeo está pronto para download
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-center space-x-3">
                {jobStatus.status === 'completed' ? (
                  <>
                    <Button 
                      onClick={handleDownload}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download MP4
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Fechar
                    </Button>
                  </>
                ) : jobStatus.status === 'error' ? (
                  <>
                    <Button variant="outline" onClick={onClose}>
                      Fechar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={handleCancel}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Minimizar
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
