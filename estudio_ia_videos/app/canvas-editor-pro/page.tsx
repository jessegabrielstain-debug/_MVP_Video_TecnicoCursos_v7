'use client'

import React from 'react'
import dynamicImport from 'next/dynamic'

// Importação dinâmica para evitar problemas de SSR com fabric.js
const ProfessionalCanvasEditorV3 = dynamicImport(
  () => import('@/components/canvas-editor-pro/professional-canvas-editor-v3'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Canvas Editor...</p>
        </div>
      </div>
    )
  }
)

export default function CanvasEditorProPage() {
  const handleExportTimeline = (timelineData: unknown) => {
    console.log('Timeline exported:', timelineData)
    // Aqui seria integrado com o sistema de timeline do PPTX
  }

  const handleSceneUpdate = (sceneData: unknown) => {
    console.log('Scene updated:', sceneData)
    // Aqui seria sincronizado com o sistema de cenas
  }

  return (
    <div className="min-h-screen">
      <ProfessionalCanvasEditorV3
        width={1920}
        height={1080}
        backgroundColor="#ffffff"
        onExportTimeline={handleExportTimeline}
        onSceneUpdate={handleSceneUpdate}
        initialObjects={[]}
      />
    </div>
  )
}

