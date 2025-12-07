// @ts-nocheck
// TODO: Backup - fix types
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Project = {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/app/api/projects', {
          headers: { 'x-user-id': 'demo-user' },
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`Falha ao carregar projetos (${res.status})`)
        const data = await res.json()
        if (!mounted) return
        setProjects(data.projects ?? [])
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
  }, [])

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Projetos (mock)</h1>
        <p className="text-sm text-gray-600">Listando projetos criados via NR (usuário demo).</p>
      </header>

      {loading && <p className="text-sm text-gray-600">Carregando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-medium">{p.title}</h2>
                  {p.description && (
                    <p className="text-sm text-gray-700 mt-1 line-clamp-3">{p.description}</p>
                  )}
                </div>
                <span className="text-xs px-2 py-1 rounded border">{p.status}</span>
              </div>
              <dl className="mt-3 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between"><dt>Criado</dt><dd>{new Date(p.created_at).toLocaleString('pt-BR')}</dd></div>
                <div className="flex justify-between"><dt>Atualizado</dt><dd>{new Date(p.updated_at).toLocaleString('pt-BR')}</dd></div>
              </dl>
              <div className="mt-3 flex gap-3 text-sm">
                <Link className="text-blue-600 hover:underline" href={`/app/api/projects/${p.id}`}>Ver JSON</Link>
                <Link className="border px-3 py-1 rounded hover:bg-gray-50" href={`/editor?projectId=${p.id}`}>Abrir no editor</Link>
              </div>
            </li>
          ))}
          {projects.length === 0 && (
            <li className="text-sm text-gray-600">Nenhum projeto. Crie um pela página de NRs.</li>
          )}
        </ul>
      )}
    </main>
  )
}
