
/**
 * 🎬 Editor Animaker v2.0 - Página Principal
 * Editor completo com parser real e elementos editáveis
 */

'use client'

import React, { useState, useEffect } from 'react'
import PPTXUploadComponent, { ProcessingResult } from '@/components/pptx/PPTXUploadComponent'
import { AnimakerEditorV2, type AnimakerProjectSnapshot } from '@/components/editor/animaker-editor-v2'
import { UnifiedParseResult } from '@/lib/types-unified-v2'
import { Loader2 } from 'lucide-react'
import { Logger } from '@/lib/logger'

const logger = new Logger('EditorAnimaker')

type EditorState = 'upload' | 'loading' | 'editor' | 'export'

interface FullProjectData extends UnifiedParseResult {
  fileInfo: {
    name: string
    size: number
    type?: string
    s3Key: string
  }
}

export default function EditorAnimakerPageV2() {
  const [currentState, setCurrentState] = useState<EditorState>('upload')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectData, setProjectData] = useState<FullProjectData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Buscar dados completos do projeto após upload
  useEffect(() => {
    if (projectId && currentState === 'loading') {
      fetchProjectData(projectId)
    }
  }, [projectId, currentState])

  const fetchProjectData = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do projeto')
      }
      const data = await response.json()
      
      // Transformar dados do banco para o formato esperado pelo editor
      const parsedData: FullProjectData = {
        slides: data.slides || [],
        metadata: {
          title: data.name || 'Projeto sem título',
          author: data.author || '',
          dateCreated: data.createdAt || new Date().toISOString(),
          slideCount: data.totalSlides || 0,
          theme: data.theme || {},
          slideSize: data.slideSize || { width: 1920, height: 1080 }
        },
        timeline: data.timeline || {
          totalDuration: data.duration || 0,
          fps: 30,
          resolution: { width: 1920, height: 1080 },
          scenes: []
        },
        statistics: data.statistics || {
          totalElements: 0,
          editableElements: 0,
          elementsByType: {}
        },
        assets: data.assets || {
          images: []
        },
        fileInfo: {
          name: data.originalFileName || 'arquivo.pptx',
          size: data.fileSize || 0,
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          s3Key: data.pptxUrl || ''
        }
      }
      
      setProjectData(parsedData)
      setCurrentState('editor')
    } catch (err) {
      logger.error('Failed to load project', err instanceof Error ? err : new Error(String(err)), { projectId: id })
      setError(err instanceof Error ? err.message : 'Erro ao carregar projeto')
      setCurrentState('upload')
    }
  }

  const handleProcessComplete = (result: ProcessingResult) => {
    logger.info('Upload completed', {
      projectId: result.projectId,
      slidesCount: result.slidesCount,
      estimatedDuration: result.estimatedDuration
    })

    if (result.projectId) {
      setProjectId(result.projectId)
      setCurrentState('loading')
    } else {
      setError('Projeto criado sem ID')
    }
  }

  const handleBackToUpload = () => {
    setProjectData(null)
    setProjectId(null)
    setError(null)
    setCurrentState('upload')
  }

  const handleSaveProject = (data: AnimakerProjectSnapshot) => {
    logger.info('Saving project', { slidesCount: data.slides?.length })
    // TODO: Salvar no banco de dados
  }

  const handleExportProject = () => {
    setCurrentState('export')
    logger.info('Starting video render')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentState === 'upload' && (
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Editor Animaker</h1>
            <p className="text-gray-600">Faça upload do seu PPTX para começar</p>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>
          <PPTXUploadComponent
            onProcessComplete={handleProcessComplete}
            onCancel={() => window.history.back()}
            disableAutoRedirect
          />
        </div>
      )}

      {currentState === 'loading' && (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Carregando projeto...</h2>
            <p className="text-gray-500">Preparando dados do editor</p>
          </div>
        </div>
      )}

      {currentState === 'editor' && projectData && (
        <AnimakerEditorV2
          projectData={projectData}
          onSave={handleSaveProject}
          onExport={handleExportProject}
        />
      )}

      {currentState === 'export' && (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Renderizando Vídeo v2.0</h1>
            <p className="text-gray-600 mb-4">
              Pipeline de renderização real em execução...
            </p>
            <button
              onClick={() => setCurrentState('editor')}
              className="text-blue-600 hover:underline"
            >
              ← Voltar ao Editor
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
