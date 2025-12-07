'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Project = {
  id: string
  title: string
  description: string
  status: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

type Slide = {
  id: string
  title: string
  content: string
  duration: number
  order_index: number
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        // Carregar projeto
        const projRes = await fetch(`/app/api/projects/${projectId}`, {
          cache: 'no-store',
        })
        if (!projRes.ok) throw new Error(`Projeto não encontrado (${projRes.status})`)
        const projData = await projRes.json()
        if (!mounted) return
        setProject(projData.project)

        // Carregar slides
        const slidesRes = await fetch(`/app/api/slides?projectId=${projectId}`, {
          cache: 'no-store',
        })
        if (!slidesRes.ok) throw new Error(`Falha ao carregar slides (${slidesRes.status})`)
        const slidesData = await slidesRes.json()
        if (!mounted) return
        setSlides(slidesData.slides ?? [])
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Erro desconhecido')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [projectId])

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-gray-600">Carregando projeto...</p>
      </main>
    )
  }

  if (error || !project) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-4">
          <Link href="/app/projects" className="text-blue-600 hover:underline text-sm">
            ← Voltar para projetos
          </Link>
        </div>
        <p className="text-sm text-red-600">{error || 'Projeto não encontrado'}</p>
      </main>
    )
  }

  const nrNumber = project.settings?.nr_number
  const slideCount = project.settings?.slide_count
  const duration = project.settings?.duration_seconds
  const primaryColor = project.settings?.template_config?.primary_color || '#3B82F6'

  return (
    <main className="mx-auto max-w-5xl p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/app/projects" className="text-blue-600 hover:underline text-sm">
          ← Voltar para projetos
        </Link>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{project.title}</h1>
            {project.description && (
              <p className="text-gray-700 mb-4">{project.description}</p>
            )}
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center px-3 py-1 rounded text-sm border"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                {project.status}
              </span>
              {nrNumber && (
                <span className="inline-flex items-center px-3 py-1 rounded text-sm bg-gray-100 text-gray-800">
                  {nrNumber}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/editor?projectId=${project.id}`}
            className="px-4 py-2 rounded border hover:bg-gray-50 text-sm font-medium"
          >
            Abrir no Editor
          </Link>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-white">
          <dt className="text-sm text-gray-600 mb-1">Slides</dt>
          <dd className="text-2xl font-semibold">{slides.length}</dd>
          {slideCount && <p className="text-xs text-gray-500 mt-1">({slideCount} planejados)</p>}
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <dt className="text-sm text-gray-600 mb-1">Duração</dt>
          <dd className="text-2xl font-semibold">
            {duration ? `${Math.round(duration / 60)}min` : 'N/A'}
          </dd>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <dt className="text-sm text-gray-600 mb-1">Criado</dt>
          <dd className="text-sm font-medium">
            {new Date(project.created_at).toLocaleDateString('pt-BR')}
          </dd>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <dt className="text-sm text-gray-600 mb-1">Atualizado</dt>
          <dd className="text-sm font-medium">
            {new Date(project.updated_at).toLocaleDateString('pt-BR')}
          </dd>
        </div>
      </div>

      {/* Slides Preview */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Slides ({slides.length})</h2>
        {slides.length === 0 ? (
          <p className="text-sm text-gray-600">
            Nenhum slide ainda. <Link href={`/editor?projectId=${project.id}`} className="text-blue-600 hover:underline">Adicione no editor</Link>.
          </p>
        ) : (
          <div className="grid gap-3">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                      <h3 className="text-lg font-medium">{slide.title || 'Sem título'}</h3>
                    </div>
                    {slide.content && (
                      <p className="text-sm text-gray-700 line-clamp-2">{slide.content}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {slide.duration}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="mt-8 flex gap-3">
        <Link
          href={`/editor?projectId=${project.id}`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          Editar Slides
        </Link>
        <Link
          href={`/app/api/projects/${project.id}`}
          className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
          target="_blank"
        >
          Ver JSON
        </Link>
      </div>
    </main>
  )
}
