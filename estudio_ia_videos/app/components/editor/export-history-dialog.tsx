'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Download, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Video,
  ExternalLink,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RenderJob {
  id: string
  projectId: string
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress?: number
  createdAt: string
  completedAt?: string
  outputUrl?: string
  error?: string
  config?: {
    quality?: string
    resolution?: string
    format?: string
    test?: boolean
  }
}

interface ExportHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportHistoryDialog({ open, onOpenChange }: ExportHistoryDialogProps) {
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/render/jobs')
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchJobs()
      // Poll for updates every 5 seconds while dialog is open
      const interval = setInterval(fetchJobs, 5000)
      return () => clearInterval(interval)
    }
  }, [open, fetchJobs])

  const getStatusIcon = (status: RenderJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
      case 'queued':
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />
    }
  }

  const getStatusBadge = (job: RenderJob) => {
    const variants: Record<RenderJob['status'], string> = {
      pending: 'bg-yellow-900/30 text-yellow-300 border-yellow-600',
      queued: 'bg-yellow-900/30 text-yellow-300 border-yellow-600',
      processing: 'bg-blue-900/30 text-blue-300 border-blue-600',
      completed: 'bg-green-900/30 text-green-300 border-green-600',
      failed: 'bg-red-900/30 text-red-300 border-red-600',
      cancelled: 'bg-gray-900/30 text-gray-300 border-gray-600',
    }
    
    const labels: Record<RenderJob['status'], string> = {
      pending: 'Pendente',
      queued: 'Na Fila',
      processing: `Processando ${job.progress ? `${job.progress}%` : ''}`,
      completed: 'Concluído',
      failed: 'Falhou',
      cancelled: 'Cancelado',
    }

    return (
      <Badge variant="outline" className={cn('text-xs', variants[job.status])}>
        {labels[job.status]}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const handleDownload = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Histórico de Exportações
          </DialogTitle>
          <DialogDescription>
            Veja o status e baixe seus vídeos exportados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchJobs}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-600 rounded-md text-sm text-red-300">
            {error}
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          {loading && jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <span>Carregando...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Video className="h-12 w-12 mb-4 opacity-50" />
              <span className="text-lg font-medium">Nenhuma exportação ainda</span>
              <span className="text-sm">Seus vídeos exportados aparecerão aqui.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getStatusIcon(job.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {job.id.substring(0, 8)}...
                          </span>
                          {getStatusBadge(job)}
                          {job.config?.test && (
                            <Badge variant="outline" className="text-xs bg-purple-900/30 text-purple-300 border-purple-600">
                              Rascunho
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(job.createdAt)}
                          {job.config?.resolution && ` • ${job.config.resolution}`}
                          {job.config?.format && ` • ${job.config.format.toUpperCase()}`}
                        </div>
                        {job.error && (
                          <div className="text-xs text-red-400 mt-1 truncate">
                            {job.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {job.status === 'completed' && job.outputUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(job.outputUrl!)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {job.status === 'processing' && job.progress !== undefined && (
                    <div className="mt-3">
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
