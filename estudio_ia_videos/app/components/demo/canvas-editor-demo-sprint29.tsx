// TODO: Fixar tipo unknown no ReactNode do loading
'use client'

/**
 * 🎨 Canvas Editor Demo - Sprint 29
 * SSR-safe demo page for Canvas Editor
 */

import React, { useState } from 'react'
import { logger } from '@/lib/logger'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

// Dynamic import with SSR disabled for Canvas Editor
const CanvasEditorSSRFixed = dynamic(
  () => import('@/components/canvas/canvas-editor-ssr-fixed'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Canvas Editor...</p>
        </div>
      </div>
    )
  }
) as React.ComponentType<any>

export default function CanvasEditorDemoSprint29() {
  const [canvasData, setCanvasData] = useState<any>(null)

  const handleSave = (data: Record<string, any>) => {
    setCanvasData(data)
    logger.debug('Canvas data saved', { component: 'CanvasEditorDemoSprint29', data })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canvas Editor - Sprint 29</h1>
          <p className="text-gray-600 mt-1">
            Editor de canvas com suporte SSR, gestos mobile e performance otimizada
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            SSR Safe
          </Badge>
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Mobile Gestures
          </Badge>
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Production Ready
          </Badge>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              SSR/Hydration Safe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Canvas carregado apenas no client-side, evitando erros de hidratação do Next.js
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Mobile Gestures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Suporte a pinch-zoom, pan e rotação em dispositivos touch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Performance Optimized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Fabric.js carregado dinamicamente com lazy loading e caching
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Canvas Editor */}
      <Card className="p-4">
        <CanvasEditorSSRFixed
          width={1920}
          height={1080}
          onSave={handleSave}
          enableMobileGestures={true}
        />
      </Card>

      {/* Saved Data Preview */}
      {canvasData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              Dados Salvos (Preview)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-48">
              {JSON.stringify(canvasData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Instruções de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Desktop:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Adicione textos e formas usando os botões da barra lateral</li>
              <li>Use undo/redo para desfazer e refazer ações</li>
              <li>Ajuste o zoom com os botões + e -</li>
              <li>Exporte o canvas como PNG</li>
              <li>Salve os dados do canvas</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Mobile:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Use dois dedos para dar zoom (pinch)</li>
              <li>Arraste com um dedo para mover objetos</li>
              <li>Toque em um objeto para selecioná-lo</li>
              <li>Interface responsiva otimizada para touch</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Testes E2E:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Execute: <code className="bg-gray-100 px-2 py-1 rounded">yarn playwright test</code></li>
              <li>Relatório HTML: <code className="bg-gray-100 px-2 py-1 rounded">yarn playwright show-report</code></li>
              <li>Cobertura mínima: 80% nos módulos críticos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
