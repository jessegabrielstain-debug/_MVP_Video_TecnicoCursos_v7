'use client'

import React from 'react'
import {
  Badge
} from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Layers,
  Loader2,
  RefreshCcw,
  SlidersHorizontal
} from 'lucide-react'

interface ProjectStats {
  totalDuration: number
  imagesExtracted: number
  autoNarration: boolean
  processingCompletedAt?: string | null
}

interface ProjectSlideSummary {
  id: string
  slideNumber: number
  title: string | null
  content: string | null
  duration: number
}

export interface ProjectOverview {
  id: string
  name: string
  status: string
  fileName?: string | null
  totalSlides: number
  createdAt: string
  updatedAt: string
  stats: ProjectStats
  slides: ProjectSlideSummary[]
}

interface ProjectManagerProps {
  project?: ProjectOverview | null
  isLoading: boolean
  error?: string | null
  onRefresh?: () => void
  onSlideUpdate?: (slideId: string, updates: { duration?: number; transition?: string; notes?: string }) => Promise<void> | void
}

const formatDuration = (seconds: number) => {
  if (!seconds || Number.isNaN(seconds)) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  const pad = remainder.toString().padStart(2, '0')
  return `${minutes}m ${pad}s`
}

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  project,
  isLoading,
  error,
  onRefresh,
  onSlideUpdate
}) => {
  const [editingSlideId, setEditingSlideId] = React.useState<string | null>(null)
  const [updatePayload, setUpdatePayload] = React.useState<{ duration?: number; transition?: string; notes?: string }>({})
  const [isUpdatingSlide, setIsUpdatingSlide] = React.useState(false)

  const beginSlideEdit = (slideId: string, current: { duration: number; transition?: string; notes?: string }) => {
    setEditingSlideId(slideId)
    setUpdatePayload({
      duration: current.duration,
      transition: current.transition,
      notes: current.notes
    })
  }

  const commitSlideUpdate = async () => {
    if (!editingSlideId || !onSlideUpdate) {
      setEditingSlideId(null)
      return
    }

    setIsUpdatingSlide(true)
    try {
      await onSlideUpdate(editingSlideId, updatePayload)
    } finally {
      setIsUpdatingSlide(false)
      setEditingSlideId(null)
      setUpdatePayload({})
    }
  }

  if (isLoading) {
    return (
      <Card className="border-dashed border-primary/40">
        <CardContent className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Carregando detalhes do projeto...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-10 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <div className="text-center space-y-1">
            <h3 className="text-base font-semibold text-red-600">
              Não foi possível carregar o projeto
            </h3>
            <p className="text-sm text-red-500 max-w-sm">
              {error}
            </p>
          </div>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Tentar novamente
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!project) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-2">
          <Layers className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="text-base font-semibold">Nenhum projeto carregado</h3>
          <p className="text-sm text-muted-foreground">
            Faça upload de um PPTX para visualizar os detalhes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {project.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {project.fileName ?? 'Projeto importado'}
            </p>
          </div>
          <Badge variant="outline" className="uppercase tracking-wide">
            {project.status}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="p-3 rounded-lg border bg-muted/40 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Slides
            </p>
            <p className="text-lg font-semibold">{project.totalSlides}</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/40 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Duração total
            </p>
            <p className="text-lg font-semibold">
              {formatDuration(project.stats.totalDuration)}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/40 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Imagens extraídas
            </p>
            <p className="text-lg font-semibold">
              {project.stats.imagesExtracted}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/40 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Processado em
            </p>
            <p className="text-xs font-medium">
              {formatDateTime(project.stats.processingCompletedAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Layers className="h-4 w-4 text-primary" />
            Slides extraídos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Visualize rapidamente os principais conteúdos identificados no PPTX
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingSlideId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Ajustar slide
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Duração (segundos)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={updatePayload.duration ?? 0}
                      onChange={e => setUpdatePayload(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className="mt-1 w-full rounded border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Transição</label>
                    <input
                      type="text"
                      value={updatePayload.transition ?? ''}
                      onChange={e => setUpdatePayload(prev => ({ ...prev, transition: e.target.value }))}
                      className="mt-1 w-full rounded border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Notas</label>
                    <textarea
                      value={updatePayload.notes ?? ''}
                      onChange={e => setUpdatePayload(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full rounded border p-2 text-sm resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingSlideId(null)} disabled={isUpdatingSlide}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={commitSlideUpdate} disabled={isUpdatingSlide} className="gap-2">
                    {isUpdatingSlide ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando
                      </>
                    ) : (
                      <>Salvar</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {project.slides.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Nenhum slide extraído.
            </div>
          ) : (
            project.slides.slice(0, 8).map(slide => (
              <div
                key={slide.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Slide {slide.slideNumber}
                    </p>
                    <h4 className="text-sm font-medium">
                      {slide.title || 'Sem título'}
                    </h4>
                    {slide.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {slide.content}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(slide.duration)}
                    </span>
                    {onSlideUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => {
                          const slideWithTransition = slide as { id: string; duration: number; notes?: string; transition?: string };
                          beginSlideEdit(slide.id, {
                            duration: slide.duration,
                            transition: slideWithTransition.transition,
                            notes: slide.notes
                          })
                        }}
                      >
                        <SlidersHorizontal className="h-3 w-3" /> Ajustar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {project.slides.length > 8 && (
            <p className="text-xs text-muted-foreground text-center">
              Exibindo 8 de {project.slides.length} slides
            </p>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <CheckCircle className="h-3 w-3 text-green-500" />
        Última atualização: {formatDateTime(project.updatedAt)}
      </div>
    </div>
  )
}
