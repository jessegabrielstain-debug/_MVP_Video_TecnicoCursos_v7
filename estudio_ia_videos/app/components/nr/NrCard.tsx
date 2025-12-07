'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Template = {
  nr_number: string
  title: string
  description: string
  slide_count: number
  duration_seconds: number
  template_config: { primary_color: string; secondary_color: string; typography: string }
}

export function NrCard({ t }: { t: Template }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/app/api/projects/from-nr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({ nr_number: t.nr_number }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Falha ao criar projeto (${res.status})`)
      }
      const { project } = await res.json()
      router.push(`/app/projects?created=${encodeURIComponent(project.id)}`)
    } catch (e: any) {
      setError(e?.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <li className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          <span className="font-bold">{t.nr_number}</span> — {t.title}
        </h2>
        <span
          className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded"
          style={{ background: t.template_config.secondary_color + '22', color: t.template_config.secondary_color }}
        >
          {t.slide_count} slides · {Math.round(t.duration_seconds / 60)} min
        </span>
      </div>
      <p className="text-sm text-gray-700 mt-2 line-clamp-3">{t.description}</p>
      <div className="mt-3 flex items-center gap-3">
        <Link
          href={`/app/api/nr-templates/${t.nr_number}`}
          className="text-blue-600 hover:underline text-sm"
        >
          Ver JSON
        </Link>
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? 'Criando…' : 'Criar projeto'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  )
}
