
/**
 * 🎬 Editor Animaker v2.0 - Página Principal
 * Editor completo com parser real e elementos editáveis
 */

'use client'

import React, { useState } from 'react'
import { EnhancedPPTXUploaderV2 } from '@/components/pptx/enhanced-pptx-uploader-v2'
import { AnimakerEditorV2, type AnimakerProjectSnapshot } from '@/components/editor/animaker-editor-v2'
import { UnifiedParseResult } from '@/lib/types-unified-v2'

type EditorState = 'upload' | 'editor' | 'export'

interface ProjectData extends UnifiedParseResult {
  fileInfo: {
    name: string
    size: number
    type?: string
    s3Key: string
  }
}

export default function EditorAnimakerPageV2() {
  const [currentState, setCurrentState] = useState<EditorState>('upload')
  const [projectData, setProjectData] = useState<ProjectData | null>(null)

  const handleAnalysisComplete = (data: ProjectData) => {
    console.log('🎬 Dados do projeto carregados:', {
      slides: data.slides.length,
      totalElements: data.statistics.totalElements,
      editableElements: data.statistics.editableElements,
      elementsByType: data.statistics.elementsByType
    })

    setProjectData(data)
    setCurrentState('editor')
  }

  const handleBackToUpload = () => {
    setProjectData(null)
    setCurrentState('upload')
  }

  const handleSaveProject = (data: AnimakerProjectSnapshot) => {
    console.log('💾 Salvando projeto v2:', data)
    // TODO: Salvar no banco de dados ou localStorage
  }

  const handleExportProject = () => {
    setCurrentState('export')
    console.log('🎬 Iniciando renderização v2...')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentState === 'upload' && (
        <EnhancedPPTXUploaderV2
          onAnalysisComplete={handleAnalysisComplete}
          onCancel={() => window.history.back()}
        />
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
