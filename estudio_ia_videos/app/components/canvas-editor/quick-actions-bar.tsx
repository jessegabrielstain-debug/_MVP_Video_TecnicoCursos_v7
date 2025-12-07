
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  AlignLeft,
  AlignCenter, 
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Scissors,
  Group,
  Ungroup
} from 'lucide-react'

interface CanvasObject {
  id?: string;
  set?: (props: any) => void;
  [key: string]: any;
}

interface QuickActionsBarProps {
  selectedObjects: CanvasObject[]
  canUndo: boolean
  canRedo: boolean
  zoom: number
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen: () => void
  onAlign: (type: string) => void
  onLock: () => void
  onUnlock: () => void
  onToggleVisibility: () => void
  onCopy: () => void
  onCut: () => void
  onGroup: () => void
  onUngroup: () => void
}

export function QuickActionsBar({
  selectedObjects,
  canUndo,
  canRedo,
  zoom,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onAlign,
  onLock,
  onUnlock,
  onToggleVisibility,
  onCopy,
  onCut,
  onGroup,
  onUngroup
}: QuickActionsBarProps) {
  
  const hasSelection = selectedObjects.length > 0
  const multipleSelection = selectedObjects.length > 1
  const isLocked = selectedObjects.every(obj => obj.lockMovementX && obj.lockMovementY)
  const isVisible = selectedObjects.every(obj => obj.visible !== false)
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-1">
        
        {/* Undo/Redo */}
        <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            title="Diminuir zoom"
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Badge variant="outline" className="text-xs min-w-[50px] justify-center">
            {Math.round(zoom)}%
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            title="Aumentar zoom"
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onFitToScreen}
            title="Ajustar à tela"
            className="h-8 w-8 p-0"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Alignment Tools */}
        {hasSelection && (
          <div className="flex gap-1 px-2 border-r border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAlign('left')}
              title="Alinhar à esquerda"
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAlign('center')}
              title="Centralizar horizontalmente"
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAlign('right')}
              title="Alinhar à direita"
              className="h-8 w-8 p-0"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAlign('top')}
              title="Alinhar ao topo"
              className="h-8 w-8 p-0"
            >
              <AlignVerticalJustifyStart className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAlign('middle')}
              title="Centralizar verticalmente"
              className="h-8 w-8 p-0"
            >
              <AlignVerticalJustifyCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAlign('bottom')}
              title="Alinhar à base"
              className="h-8 w-8 p-0"
            >
              <AlignVerticalJustifyEnd className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Object Controls */}
        {hasSelection && (
          <div className="flex gap-1 px-2 border-r border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={isLocked ? onUnlock : onLock}
              title={isLocked ? "Desbloquear" : "Bloquear"}
              className="h-8 w-8 p-0"
            >
              {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              title={isVisible ? "Ocultar" : "Mostrar"}
              className="h-8 w-8 p-0"
            >
              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        )}
        
        {/* Edit Actions */}
        {hasSelection && (
          <div className="flex gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              title="Copiar (Ctrl+C)"
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCut}
              title="Recortar (Ctrl+X)"
              className="h-8 w-8 p-0"
            >
              <Scissors className="h-4 w-4" />
            </Button>
            
            {multipleSelection && (
              <>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onGroup}
                  title="Agrupar (Ctrl+G)"
                  className="h-8 w-8 p-0"
                >
                  <Group className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {selectedObjects.some(obj => obj.type === 'group') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUngroup}
                title="Desagrupar (Ctrl+Shift+G)"
                className="h-8 w-8 p-0"
              >
                <Ungroup className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        {/* Selection Info */}
        {hasSelection && (
          <div className="flex items-center gap-2 px-2 border-l border-gray-200 dark:border-gray-700">
            <Badge variant="secondary" className="text-xs">
              {selectedObjects.length} selecionado{selectedObjects.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}
        
      </div>
    </div>
  )
}

// Hook para integrar com canvas
export function useQuickActions(canvas: any) {
  const [selectedObjects, setSelectedObjects] = useState<CanvasObject[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [zoom, setZoom] = useState(100)
  
  useEffect(() => {
    if (!canvas) return
    
    const handleSelectionChanged = () => {
      const selection = canvas.getActiveObjects ? canvas.getActiveObjects() : []
      setSelectedObjects(selection)
    }
    
    const handleZoomChanged = () => {
      const currentZoom = canvas.getZoom ? canvas.getZoom() : 1
      setZoom(Math.round(currentZoom * 100))
    }
    
    if (canvas.on) {
      canvas.on('selection:created', handleSelectionChanged)
      canvas.on('selection:updated', handleSelectionChanged)
      canvas.on('selection:cleared', handleSelectionChanged)
      canvas.on('canvas:zoom', handleZoomChanged)
    }
    
    return () => {
      if (canvas.off) {
        canvas.off('selection:created', handleSelectionChanged)
        canvas.off('selection:updated', handleSelectionChanged)
        canvas.off('selection:cleared', handleSelectionChanged)
        canvas.off('canvas:zoom', handleZoomChanged)
      }
    }
  }, [canvas])
  
  const actions = {
    onUndo: () => {
      if (canvas?.undo) canvas.undo()
    },
    onRedo: () => {
      if (canvas?.redo) canvas.redo()
    },
    onZoomIn: () => {
      if (canvas?.setZoom) {
        const currentZoom = canvas.getZoom() || 1
        canvas.setZoom(Math.min(currentZoom * 1.1, 5))
      }
    },
    onZoomOut: () => {
      if (canvas?.setZoom) {
        const currentZoom = canvas.getZoom() || 1
        canvas.setZoom(Math.max(currentZoom * 0.9, 0.1))
      }
    },
    onFitToScreen: () => {
      if (canvas?.setZoom) {
        canvas.setZoom(1)
        if (canvas.centerObject) {
          // Centralizar canvas
        }
      }
    },
    onAlign: (type: string) => {
      if (!canvas || selectedObjects.length === 0) return
      
      // Implementar alinhamento baseado no tipo
      console.log('Aligning objects:', type, selectedObjects)
    },
    onLock: () => {
      selectedObjects.forEach(obj => {
        if (obj.set) {
          obj.set({
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true
          })
        }
      })
      if (canvas?.renderAll) canvas.renderAll()
    },
    onUnlock: () => {
      selectedObjects.forEach(obj => {
        if (obj.set) {
          obj.set({
            lockMovementX: false,
            lockMovementY: false,
            lockScalingX: false,
            lockScalingY: false,
            lockRotation: false
          })
        }
      })
      if (canvas?.renderAll) canvas.renderAll()
    },
    onToggleVisibility: () => {
      selectedObjects.forEach(obj => {
        if (obj.set) {
          obj.set({ visible: !obj.visible })
        }
      })
      if (canvas?.renderAll) canvas.renderAll()
    },
    onCopy: () => {
      // Implementar cópia
      console.log('Copying objects:', selectedObjects)
    },
    onCut: () => {
      // Implementar recorte
      console.log('Cutting objects:', selectedObjects)
    },
    onGroup: () => {
      if (canvas?.group && selectedObjects.length > 1) {
        // Implementar agrupamento
        console.log('Grouping objects:', selectedObjects)
      }
    },
    onUngroup: () => {
      if (canvas?.ungroup) {
        // Implementar desagrupamento
        console.log('Ungrouping objects:', selectedObjects)
      }
    }
  }
  
  return {
    selectedObjects,
    canUndo,
    canRedo,
    zoom,
    ...actions
  }
}
