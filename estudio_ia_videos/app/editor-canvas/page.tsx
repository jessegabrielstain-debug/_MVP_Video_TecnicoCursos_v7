'use client'

import React from 'react'
import dynamicImport from 'next/dynamic'

// Importação dinâmica para evitar problemas de SSR com fabric.js
const ProfessionalCanvasEditorV3 = dynamicImport(
  () => import('@/components/canvas-editor-pro/professional-canvas-editor-v3').then(m => m.default),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Editor de Canvas...</p>
        </div>
      </div>
    )
  }
)

export default function EditorCanvasPage() {
  const handleExportTimeline = (timelineData: unknown) => {
    console.log('Timeline exported:', timelineData)
  }

  const handleSceneUpdate = (sceneData: unknown) => {
    console.log('Scene updated:', sceneData)
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
export const dynamic = 'force-dynamic'
