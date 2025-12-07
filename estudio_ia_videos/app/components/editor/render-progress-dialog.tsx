'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRenderProgress } from '@/hooks/use-render-progress'

interface RenderProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string | null
  onComplete?: (url: string) => void
}

export function RenderProgressDialog({ 
  open, 
  onOpenChange, 
  jobId,
  onComplete 
}: RenderProgressDialogProps) {
  const progress = useRenderProgress({
    jobId: open ? jobId : null, // Only poll when dialog is open
    onComplete: (url) => {
      onComplete?.(url)
    },
  })

  const getStatusInfo = () => {
    if (!progress) {
      return {
        icon: <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />,
        title: 'Iniciando...',
        description: 'Preparando a renderização do vídeo.',
      }
    }

    switch (progress.status) {
      case 'pending':
      case 'queued':
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />,
          title: 'Na Fila',
          description: 'Seu vídeo está aguardando para ser processado.',
        }
      case 'processing':
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-blue-400" />,
          title: 'Processando...',
          description: `Renderizando seu vídeo (${progress.progress}% concluído).`,
        }
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-green-400" />,
          title: 'Concluído!',
          description: 'Seu vídeo está pronto para download.',
        }
      case 'failed':
      case 'cancelled':
        return {
          icon: <XCircle className="h-8 w-8 text-red-400" />,
          title: progress.status === 'cancelled' ? 'Cancelado' : 'Falhou',
          description: progress.error || 'Ocorreu um erro durante a renderização.',
        }
      default:
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />,
          title: 'Processando...',
          description: 'Aguarde enquanto seu vídeo é gerado.',
        }
    }
  }

  const statusInfo = getStatusInfo()
  const isComplete = progress?.status === 'completed'
  const isFailed = progress?.status === 'failed' || progress?.status === 'cancelled'
  const isProcessing = !isComplete && !isFailed

  const handleDownload = () => {
    if (progress?.outputUrl) {
      window.open(progress.outputUrl, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Exportação de Vídeo</DialogTitle>
          <DialogDescription>
            {jobId ? `Job ID: ${jobId.substring(0, 12)}...` : 'Iniciando...'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-8">
          {statusInfo.icon}
          <h3 className="mt-4 text-lg font-semibold">{statusInfo.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            {statusInfo.description}
          </p>

          {isProcessing && progress && (
            <div className="w-full mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>
          )}

          {isComplete && progress?.outputUrl && (
            <div className="flex gap-2 mt-6">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Vídeo
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          )}

          {isFailed && (
            <Button variant="outline" className="mt-6" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
