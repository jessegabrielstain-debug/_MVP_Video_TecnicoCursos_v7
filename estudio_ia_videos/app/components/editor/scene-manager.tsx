
/**
 * 🎬 Scene Manager - Gerenciamento de Slides
 * Painel lateral para navegação e edição de slides/cenas
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Clock,
  Type,
  Image as ImageIcon,
  Layers
} from 'lucide-react'
import { UnifiedSlide } from '@/lib/types-unified-v2'

interface SceneManagerProps {
  scenes: UnifiedSlide[]
  currentScene: number
  onSceneSelect: (sceneIndex: number) => void
  onSceneUpdate: (sceneIndex: number, updates: Partial<UnifiedSlide>) => void
  onSceneAdd?: () => void
  onSceneDelete?: (sceneIndex: number) => void
  onSceneDuplicate?: (sceneIndex: number) => void
}

export function SceneManager({
  scenes,
  currentScene,
  onSceneSelect,
  onSceneUpdate,
  onSceneAdd,
  onSceneDelete,
  onSceneDuplicate
}: SceneManagerProps) {
  const [editingTitle, setEditingTitle] = useState<number | null>(null)

  const handleTitleEdit = (sceneIndex: number, newTitle: string) => {
    onSceneUpdate(sceneIndex, { title: newTitle })
    setEditingTitle(null)
  }

  const renderSceneCard = (scene: UnifiedSlide, index: number) => {
    const isActive = index === currentScene
    const elementCounts = scene.elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return (
      <Card 
        key={scene.id}
        className={`mb-3 cursor-pointer transition-all ${
          isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => onSceneSelect(index)}
      >
        <CardContent className="p-3">
          {/* Scene preview */}
          <div className="aspect-video bg-gray-200 rounded mb-2 flex items-center justify-center relative overflow-hidden">
            {/* Simplified preview */}
            <div className="text-center">
              <Layers className="w-8 h-8 text-gray-400 mb-1" />
              <div className="text-xs text-gray-600">
                {scene.elements.length} elementos
              </div>
            </div>
            
            {/* Scene number */}
            <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>
          </div>

          {/* Scene info */}
          <div className="space-y-2">
            {/* Title */}
            {editingTitle === index ? (
              <Input
                defaultValue={scene.title}
                className="text-sm h-8"
                onBlur={(e) => handleTitleEdit(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleEdit(index, e.currentTarget.value)
                  }
                  if (e.key === 'Escape') {
                    setEditingTitle(null)
                  }
                }}
                autoFocus
              />
            ) : (
              <h4 
                className="font-medium text-sm truncate cursor-pointer hover:text-blue-600"
                onDoubleClick={() => setEditingTitle(index)}
                title={scene.title}
              >
                {scene.title}
              </h4>
            )}

            {/* Duration */}
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {scene.duration}s
            </div>

            {/* Element counts */}
            {Object.keys(elementCounts).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(elementCounts).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="text-xs px-1 py-0 h-5">
                    {type === 'text' && <Type className="w-3 h-3 mr-1" />}
                    {type === 'image' && <ImageIcon className="w-3 h-3 mr-1" />}
                    {type === 'shape' && <Layers className="w-3 h-3 mr-1" />}
                    {count}
                  </Badge>
                ))}
              </div>
            )}

            {/* Scene actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Toggle visibility (if supported)
                  }}
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center space-x-1">
                {onSceneDuplicate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSceneDuplicate(index)
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                )}

                {onSceneDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (scenes.length > 1) {
                        onSceneDelete(index)
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Cenas</h3>
          <Badge variant="secondary" className="text-xs">
            {scenes.length} slide{scenes.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {onSceneAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSceneAdd}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Cena
          </Button>
        )}
      </div>

      {/* Scene list */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {scenes.map((scene, index) => renderSceneCard(scene, index))}
        </div>
      </ScrollArea>

      {/* Footer info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Duração total:</span>
            <span>{scenes.reduce((acc, scene) => acc + (scene.duration || 0), 0)}s</span>
          </div>
          <div className="flex justify-between">
            <span>Elementos totais:</span>
            <span>{scenes.reduce((acc, scene) => acc + scene.elements.length, 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SceneManager
