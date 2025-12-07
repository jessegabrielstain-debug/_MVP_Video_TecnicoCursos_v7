'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type NRTemplate = {
  nr_number: string
  title: string
  objective: string
  keywords: string[]
  difficulty_level: string
  estimated_duration_minutes: number
  template_config: {
    primary_color: string
    secondary_color: string
    slide_count: number
    topics: string[]
  }
  created_at: string
  updated_at: string
}

export default function NRTemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const nrNumber = params.nr as string

  const [template, setTemplate] = useState<NRTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const res = await fetch(`/app/api/nr-templates/${nrNumber}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`Template não encontrado (${res.status})`)
        const data = await res.json()
        if (!mounted) return
        setTemplate(data.template)
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
  }, [nrNumber])

  async function handleCreateProject() {
    if (!template) return
    setCreating(true)
    try {
      const res = await fetch('/app/api/projects/from-nr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nr_number: template.nr_number }),
      })
      if (!res.ok) throw new Error('Falha ao criar projeto')
      const data = await res.json()
      router.push(`/app/projects/${data.project.id}`)
    } catch (e: any) {
      alert(`Erro: ${e?.message || 'Desconhecido'}`)
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-gray-600">Carregando template...</p>
      </main>
    )
  }

  if (error || !template) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-4">
          <Link href="/app/nr-templates" className="text-blue-600 hover:underline text-sm">
            ← Voltar para catálogo
          </Link>
        </div>
        <p className="text-sm text-red-600">{error || 'Template não encontrado'}</p>
      </main>
    )
  }

  const config = template.template_config
  const slideCount = config?.slide_count || 0
  const topics = config?.topics || []
  const primaryColor = config?.primary_color || '#3B82F6'
  const secondaryColor = config?.secondary_color || '#10B981'

  return (
    <main className="mx-auto max-w-4xl p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/app/nr-templates" className="text-blue-600 hover:underline text-sm">
          ← Voltar para catálogo
        </Link>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded text-sm font-semibold border-2"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                {template.nr_number}
              </span>
              <span
                className="inline-flex items-center px-3 py-1 rounded text-xs bg-gray-100 text-gray-700"
              >
                {template.difficulty_level}
              </span>
            </div>
            <h1 className="text-3xl font-semibold mb-3">{template.title}</h1>
            <p className="text-gray-700 text-lg">{template.objective}</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-white">
          <dt className="text-sm text-gray-600 mb-1">Slides</dt>
          <dd className="text-2xl font-semibold">{slideCount}</dd>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <dt className="text-sm text-gray-600 mb-1">Duração Estimada</dt>
          <dd className="text-2xl font-semibold">{template.estimated_duration_minutes}min</dd>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <dt className="text-sm text-gray-600 mb-1">Tópicos</dt>
          <dd className="text-2xl font-semibold">{topics.length}</dd>
        </div>
      </div>

      {/* Keywords */}
      {template.keywords.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Palavras-chave</h2>
          <div className="flex flex-wrap gap-2">
            {template.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center px-3 py-1 rounded text-sm bg-gray-100 text-gray-800"
              >
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Color Scheme */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Esquema de Cores</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-12 h-12 rounded border"
              style={{ backgroundColor: primaryColor }}
            />
            <div>
              <p className="text-xs text-gray-600">Primária</p>
              <p className="text-sm font-mono">{primaryColor}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-12 h-12 rounded border"
              style={{ backgroundColor: secondaryColor }}
            />
            <div>
              <p className="text-xs text-gray-600">Secundária</p>
              <p className="text-sm font-mono">{secondaryColor}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Topics */}
      {topics.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            Estrutura do Curso ({topics.length} tópicos → {slideCount} slides)
          </h2>
          <div className="border rounded-lg bg-white">
            {topics.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 border-b last:border-b-0"
              >
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {idx + 1}
                </span>
                <p className="flex-1 text-gray-900 pt-1">{topic}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Ao criar o projeto, cada tópico gerará automaticamente 1 slide.
          </p>
        </section>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCreateProject}
          disabled={creating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-sm font-semibold"
        >
          {creating ? 'Criando projeto...' : 'Criar Projeto a partir deste Template'}
        </button>
        <Link
          href={`/app/api/nr-templates/${template.nr_number}`}
          className="px-6 py-3 border rounded-lg hover:bg-gray-50 text-sm"
          target="_blank"
        >
          Ver JSON
        </Link>
      </div>

      {/* Footer Info */}
      <footer className="mt-8 pt-6 border-t text-sm text-gray-600">
        <p>
          Template criado em {new Date(template.created_at).toLocaleDateString('pt-BR')} •
          Última atualização: {new Date(template.updated_at).toLocaleDateString('pt-BR')}
        </p>
      </footer>
    </main>
  )
}
