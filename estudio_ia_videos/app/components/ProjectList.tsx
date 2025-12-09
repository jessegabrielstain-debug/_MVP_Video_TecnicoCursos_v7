'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

interface Project {
  id: string
  title: string
  description: string
  status: string
  created_at: string
}

interface Slide {
  id: string
  project_id: string
  title: string
  content: string
  duration: number
  order_index: number
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchSlides(selectedProject)
    }
  }, [selectedProject])

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (error) {
      logger.error('Erro ao carregar projetos', error instanceof Error ? error : new Error(String(error)), { component: 'ProjectList' })
    } finally {
      setLoading(false)
    }
  }

  async function fetchSlides(projectId: string) {
    try {
      const res = await fetch(`/api/slides?projectId=${projectId}`)
      const data = await res.json()
      setSlides(data.slides || [])
    } catch (error) {
      logger.error('Erro ao carregar slides', error instanceof Error ? error : new Error(String(error)), { component: 'ProjectList', projectId })
    }
  }

  async function createProject() {
    const title = prompt('Título do projeto:')
    if (!title) return

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: 'Novo projeto criado via dashboard' }),
      })
      const data = await res.json()
      if (data.project) {
        await fetchProjects()
        // Registrar evento
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'project_created',
            eventData: { projectId: data.project.id, title },
          }),
        })
      }
    } catch (error) {
      logger.error('Erro ao criar projeto', error instanceof Error ? error : new Error(String(error)), { component: 'ProjectList' })
    }
  }

  async function createSlide() {
    if (!selectedProject) {
      alert('Selecione um projeto primeiro')
      return
    }

    const title = prompt('Título do slide:')
    if (!title) return

    try {
      const res = await fetch('/api/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          title,
          content: 'Conteúdo do slide',
          duration: 5,
          orderIndex: slides.length,
        }),
      })
      const data = await res.json()
      if (data.slide) {
        await fetchSlides(selectedProject)
        // Registrar evento
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'slide_created',
            eventData: { projectId: selectedProject, slideId: data.slide.id, title },
          }),
        })
      }
    } catch (error) {
      logger.error('Erro ao criar slide', error instanceof Error ? error : new Error(String(error)), { component: 'ProjectList', projectId: selectedProject })
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Carregando projetos...</div>
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* Coluna Esquerda: Projetos */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Projetos ({projects.length})</h2>
          <button
            onClick={createProject}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Novo Projeto
          </button>
        </div>
        
        {projects.length === 0 ? (
          <p className="text-gray-500">Nenhum projeto encontrado</p>
        ) : (
          <div className="space-y-2">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => setSelectedProject(proj.id)}
                className={`p-3 border rounded cursor-pointer transition ${
                  selectedProject === proj.id
                    ? 'bg-blue-100 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <h3 className="font-semibold">{proj.title}</h3>
                <p className="text-sm text-gray-600">{proj.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Status: {proj.status} | Criado: {new Date(proj.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coluna Direita: Slides */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Slides {selectedProject ? `(${slides.length})` : ''}
          </h2>
          {selectedProject && (
            <button
              onClick={createSlide}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Novo Slide
            </button>
          )}
        </div>
        
        {!selectedProject ? (
          <p className="text-gray-500">Selecione um projeto para ver os slides</p>
        ) : slides.length === 0 ? (
          <p className="text-gray-500">Nenhum slide encontrado</p>
        ) : (
          <div className="space-y-2">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className="p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">
                    #{idx + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{slide.title}</h3>
                    <p className="text-sm text-gray-600">{slide.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Duração: {slide.duration}s
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
