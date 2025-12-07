// @ts-nocheck
// TODO: Backup - fix types
'use client'

import { useMemo, useState, useTransition, useRef } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Project } from '@/lib/projects'
import type { Slide } from '@/lib/slides'
import { updateSlidesAction } from './actions'

interface SlideEditorProps {
  project: Project
  slides: Slide[]
}

interface EditableSlide {
  id: string
  title: string
  duration: number | null
  order_index: number
  contentSummary: string
}

const sanitizeDuration = (value: string): number | null => {
  if (value.trim() === '') {
    return null
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) {
    return null
  }

  return Math.round(parsed)
}

const summarizeContent = (content: Slide['content']): string => {
  if (content == null) {
    return 'Sem conteúdo estruturado.'
  }

  if (typeof content === 'string') {
    return content.slice(0, 200)
  }

  try {
    const serialized = JSON.stringify(content)
    return serialized.length > 200 ? `${serialized.slice(0, 200)}…` : serialized
  } catch {
    return 'Conteúdo não pôde ser exibido.'
  }
}

const normalizeForComparison = (slides: EditableSlide[]) =>
  slides.map((slide) => ({
    id: slide.id,
    title: slide.title.trim(),
    duration: slide.duration ?? null,
    order_index: slide.order_index,
  }))

export function SlideEditor({ project, slides }: SlideEditorProps) {
  const sortedSlides = useMemo(
    () =>
      [...slides]
        .sort((a, b) => a.order_index - b.order_index)
        .map<EditableSlide>((slide) => ({
          id: slide.id,
          title: slide.title ?? '',
          duration: slide.duration,
          order_index: slide.order_index,
          contentSummary: summarizeContent(slide.content),
        })),
    [slides]
  )

  const [editableSlides, setEditableSlides] = useState<EditableSlide[]>(sortedSlides)
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string | null }>({
    type: 'idle',
    message: null,
  })
  const [isPending, startTransition] = useTransition()
  const initialSnapshotRef = useRef(JSON.stringify(normalizeForComparison(sortedSlides)))

  const hasChanges = useMemo(() => {
    const currentSnapshot = JSON.stringify(normalizeForComparison(editableSlides))
    return currentSnapshot !== initialSnapshotRef.current
  }, [editableSlides])

  const moveSlide = (id: string, direction: 1 | -1) => {
    setEditableSlides((current) => {
      const ordered = [...current].sort((a, b) => a.order_index - b.order_index)
      const index = ordered.findIndex((slide) => slide.id === id)
      if (index === -1) {
        return current
      }

      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= ordered.length) {
        return current
      }

      const reordered = [...ordered]
      const [moved] = reordered.splice(index, 1)
      reordered.splice(targetIndex, 0, moved)

      return reordered.map((slide, newIndex) => ({
        ...slide,
        order_index: newIndex,
      }))
    })
  }

  const handleTitleChange = (id: string, value: string) => {
    setEditableSlides((current) =>
      current.map((slide) => (slide.id === id ? { ...slide, title: value } : slide))
    )
  }

  const handleDurationChange = (id: string, value: string) => {
    setEditableSlides((current) =>
      current.map((slide) => (slide.id === id ? { ...slide, duration: sanitizeDuration(value) } : slide))
    )
  }

  const resetChanges = () => {
    setEditableSlides(sortedSlides)
    setStatus({ type: 'idle', message: null })
    initialSnapshotRef.current = JSON.stringify(normalizeForComparison(sortedSlides))
  }

  const handleSave = () => {
    setStatus({ type: 'idle', message: null })
    const payload = normalizeForComparison(editableSlides)

    startTransition(async () => {
      const result = await updateSlidesAction({
        projectId: project.id,
        slides: payload.map((slide) => ({
          ...slide,
          duration: slide.duration ?? null,
        })),
      })

      if (result.ok) {
        initialSnapshotRef.current = JSON.stringify(payload)
        setStatus({ type: 'success', message: result.message })
      } else {
        setStatus({ type: 'error', message: result.message })
      }
    })
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Editor de slides</h1>
          <Badge>{project.status}</Badge>
        </div>
        <p className="text-muted-foreground">
          Ajuste títulos, duração e ordem dos slides. Após salvar, o pipeline de renderização reutilizará
          essas informações para gerar o vídeo final.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <div className="font-medium">Projeto:</div>
          <div>{project.name}</div>
        </div>
        {project.description ? (
          <div className="text-muted-foreground">{project.description}</div>
        ) : null}
        <div className="text-xs text-muted-foreground">
          Slides carregados: {editableSlides.length}. Última atualização: {new Date(project.updated_at).toLocaleString('pt-BR')}
        </div>
      </div>

      {status.type !== 'idle' && status.message ? (
        <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
          <AlertTitle className="flex items-center gap-2">
            {status.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            {status.type === 'success' ? 'Alterações salvas' : 'Não foi possível salvar'}
          </AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4">
        {editableSlides.map((slide, index) => (
          <article key={slide.id} className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-base font-semibold">
                  {index + 1}
                </span>
                <span>ID: {slide.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveSlide(slide.id, -1)}
                  disabled={index === 0 || isPending}
                  aria-label="Mover slide para cima"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveSlide(slide.id, 1)}
                  disabled={index === editableSlides.length - 1 || isPending}
                  aria-label="Mover slide para baixo"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`title-${slide.id}`}>Título do slide</Label>
                <Input
                  id={`title-${slide.id}`}
                  value={slide.title}
                  onChange={(event) => handleTitleChange(slide.id, event.target.value)}
                  placeholder={`Slide ${index + 1}`}
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor={`duration-${slide.id}`}>Duração (segundos)</Label>
                <Input
                  id={`duration-${slide.id}`}
                  type="number"
                  min={0}
                  step={1}
                  value={slide.duration ?? ''}
                  onChange={(event) => handleDurationChange(slide.id, event.target.value)}
                  placeholder="Ex: 8"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <Label>Resumo do conteúdo</Label>
              <p className="mt-1 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                {slide.contentSummary}
              </p>
            </div>
          </article>
        ))}
      </div>

      {editableSlides.length === 0 ? (
        <Alert>
          <AlertTitle>Nenhum slide encontrado</AlertTitle>
          <AlertDescription>
            Assim que o parser processar o PPTX, os slides aparecerão aqui para edição.
          </AlertDescription>
        </Alert>
      ) : null}

      <footer className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={!hasChanges || isPending}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando…
            </span>
          ) : (
            'Salvar alterações'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={resetChanges} disabled={!hasChanges || isPending}>
          Desfazer alterações
        </Button>
        {!hasChanges && status.type !== 'success' ? (
          <span className="text-sm text-muted-foreground">Nenhuma alteração pendente.</span>
        ) : null}
      </footer>
    </section>
  )
}
