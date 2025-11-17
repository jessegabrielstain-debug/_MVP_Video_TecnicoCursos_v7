
/**
 * 🎨 Canvas Editor v2.0 - WYSIWYG Real
 * Canvas com drag-and-drop real, resize handles, multi-seleção e editing inline
 */

'use client'

import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect } from 'react'
import { UnifiedSlide, UnifiedElement, EditorState, EditorEvent } from '@/lib/types-unified-v2'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Move, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock,
  Eye,
  EyeOff,
  Square,
  Circle,
  Type,
  Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'

interface CanvasEditorProps {
  slide?: UnifiedSlide | null
  selectedElements: string[]
  editorState: EditorState
  onElementSelect: (elementIds: string[]) => void
  onElementUpdate: (elementId: string, updates: Partial<UnifiedElement>) => void
  onElementDelete: (elementIds: string[]) => void
  onElementAdd: (element: Partial<UnifiedElement>) => void
  onEventEmit?: (event: EditorEvent) => void
}

interface DragState {
  isDragging: boolean
  elementId: string
  startMousePos: { x: number; y: number }
  startElementPos: { x: number; y: number }
  dragType: 'move' | 'resize'
  resizeHandle?: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
}

interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
  active: boolean
}

export interface CanvasEditorHandle {
  addElement: (type: string) => void;
  deleteSelectedElements: () => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  selectAll: () => void;
  clearSelection: () => void;
}

const CanvasEditorV2 = forwardRef<CanvasEditorHandle, CanvasEditorProps>(({
  slide,
  selectedElements,
  editorState,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementAdd,
  onEventEmit
}, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: '',
    startMousePos: { x: 0, y: 0 },
    startElementPos: { x: 0, y: 0 },
    dragType: 'move'
  })
  
  const [selectionBox, setSelectionBox] = useState<SelectionBox>({
    startX: 0, startY: 0, endX: 0, endY: 0, active: false
  })
  
  const [editingText, setEditingText] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null)

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    addElement: (type: string) => handleAddElement(type),
    deleteSelectedElements: () => handleDeleteSelected(),
    copySelectedElements: () => handleCopySelected(),
    pasteElements: () => handlePaste(),
    selectAll: () => handleSelectAll(),
    clearSelection: () => onElementSelect([])
  }))

  // Obter elementos visíveis e ordenados
  const visibleElements = slide?.elements.filter(el => el.visible !== false) || []
  const sortedElements = [...visibleElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
  
  // Canvas config com fallback
  const canvasConfig = editorState.canvas || { 
    showGrid: false, 
    gridSize: 20, 
    width: 1920, 
    height: 1080,
    zoom: 100,
    snapToGrid: true,
    snapDistance: 5,
    showRulers: false
  }

  // Handlers de mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / (canvasConfig.zoom / 100)
    const y = (e.clientY - rect.top) / (canvasConfig.zoom / 100)

    // Verificar se clicou em um elemento
    const clickedElement = findElementAtPosition(x, y)
    
    if (clickedElement) {
      const isSelected = selectedElements.includes(clickedElement.id)
      
      if (e.shiftKey || e.metaKey) {
        // Multi-seleção
        if (isSelected) {
          onElementSelect(selectedElements.filter(id => id !== clickedElement.id))
        } else {
          onElementSelect([...selectedElements, clickedElement.id])
        }
      } else if (!isSelected) {
        onElementSelect([clickedElement.id])
      }

      // Iniciar drag se elemento selecionado
      if (isSelected || !e.shiftKey) {
        setDragState({
          isDragging: true,
          elementId: clickedElement.id,
          startMousePos: { x: e.clientX, y: e.clientY },
          startElementPos: { x: clickedElement.x, y: clickedElement.y },
          dragType: 'move'
        })
      }
    } else {
      // Iniciar seleção de área
      if (!e.shiftKey && !e.metaKey) {
        onElementSelect([])
      }
      
      setSelectionBox({
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        active: true
      })
    }

    // Fechar menu de contexto
    setContextMenu(null)
  }, [selectedElements, onElementSelect, editorState.canvas?.zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return

    if (dragState.isDragging && dragState.elementId) {
      // Arrastar elemento
      const deltaX = (e.clientX - dragState.startMousePos.x) / (canvasConfig.zoom / 100)
      const deltaY = (e.clientY - dragState.startMousePos.y) / (canvasConfig.zoom / 100)

      const newX = dragState.startElementPos.x + deltaX
      const newY = dragState.startElementPos.y + deltaY

      // Snap to grid se habilitado
      let snapX = newX
      let snapY = newY
      
      if (canvasConfig.snapToGrid) {
        snapX = Math.round(newX / canvasConfig.gridSize) * canvasConfig.gridSize
        snapY = Math.round(newY / canvasConfig.gridSize) * canvasConfig.gridSize
      }

      onElementUpdate(dragState.elementId, { x: snapX, y: snapY })
      
      // Atualizar todos os elementos selecionados se múltipla seleção
      if (selectedElements.length > 1 && selectedElements.includes(dragState.elementId)) {
        selectedElements.forEach(elementId => {
          if (elementId !== dragState.elementId) {
            const element = visibleElements.find(el => el.id === elementId)
            if (element) {
              onElementUpdate(elementId, { 
                x: element.x + deltaX, 
                y: element.y + deltaY 
              })
            }
          }
        })
      }

    } else if (selectionBox.active) {
      // Atualizar caixa de seleção
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / (canvasConfig.zoom / 100)
      const y = (e.clientY - rect.top) / (canvasConfig.zoom / 100)
      
      setSelectionBox(prev => ({
        ...prev,
        endX: x,
        endY: y
      }))
    }
  }, [dragState, selectionBox, selectedElements, onElementUpdate, editorState.canvas?.zoom, visibleElements])

  const handleMouseUp = useCallback(() => {
    if (selectionBox.active) {
      // Finalizar seleção de área
      const selectedIds = findElementsInSelection(selectionBox)
      onElementSelect(selectedIds)
      setSelectionBox(prev => ({ ...prev, active: false }))
    }

    setDragState(prev => ({ ...prev, isDragging: false }))
    
    // Emitir evento de atualização
    if (onEventEmit) {
      onEventEmit({
        type: 'element_update',
        data: { selectedElements },
        timestamp: Date.now()
      })
    }
  }, [selectionBox, onElementSelect, selectedElements, onEventEmit])

  // Context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / (canvasConfig.zoom / 100)
    const y = (e.clientY - rect.top) / (canvasConfig.zoom / 100)

    const clickedElement = findElementAtPosition(x, y)
    
    if (clickedElement) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        elementId: clickedElement.id
      })
    }
  }, [editorState.canvas?.zoom])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedElements.length > 0) {
            handleDeleteSelected()
          }
          break
        case 'c':
          if (e.metaKey || e.ctrlKey) {
            handleCopySelected()
          }
          break
        case 'v':
          if (e.metaKey || e.ctrlKey) {
            handlePaste()
          }
          break
        case 'a':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            handleSelectAll()
          }
          break
        case 'Escape':
          onElementSelect([])
          setEditingText(null)
          setContextMenu(null)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedElements])

  // Utility functions
  const findElementAtPosition = (x: number, y: number): UnifiedElement | null => {
    // Buscar de trás para frente (elementos com maior z-index primeiro)
    for (let i = sortedElements.length - 1; i >= 0; i--) {
      const element = sortedElements[i]
      if (x >= element.x && x <= element.x + element.width &&
          y >= element.y && y <= element.y + element.height) {
        return element
      }
    }
    return null
  }

  const findElementsInSelection = (box: SelectionBox): string[] => {
    const minX = Math.min(box.startX, box.endX)
    const maxX = Math.max(box.startX, box.endX)
    const minY = Math.min(box.startY, box.endY)
    const maxY = Math.max(box.startY, box.endY)

    return visibleElements
      .filter(element => {
        const elementCenterX = element.x + element.width / 2
        const elementCenterY = element.y + element.height / 2
        return elementCenterX >= minX && elementCenterX <= maxX &&
               elementCenterY >= minY && elementCenterY <= maxY
      })
      .map(element => element.id)
  }

  // Action handlers
  const handleAddElement = (type: string) => {
    const newElement: Partial<UnifiedElement> = {
      type: type as UnifiedElement['type'],
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 50 : 100,
      zIndex: Math.max(...visibleElements.map(el => el.zIndex || 0)) + 1,
      visible: true,
      locked: false,
      content: type === 'text' ? 'Novo texto' : null,
      style: {
        position: { x: 100, y: 100, width: 100, height: 100 },
        fontSize: type === 'text' ? 16 : undefined,
        backgroundColor: type === 'shape' ? '#3b82f6' : undefined
      },
      animations: [],
      properties: {}
    }

    onElementAdd(newElement)
  }

  const handleDeleteSelected = () => {
    if (selectedElements.length > 0) {
      onElementDelete(selectedElements)
    }
  }

  const handleCopySelected = () => {
    // TODO: Implementar copy to clipboard
    console.log('Copying elements:', selectedElements)
  }

  const handlePaste = () => {
    // TODO: Implementar paste from clipboard
    console.log('Pasting elements')
  }

  const handleSelectAll = () => {
    onElementSelect(visibleElements.map(el => el.id))
  }

  // Render element
  const renderElement = (element: UnifiedElement) => {
    const isSelected = selectedElements.includes(element.id)
    const transform = `scale(${canvasConfig.zoom / 100})`

    return (
      <div
        key={element.id}
        className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
          element.locked ? 'cursor-not-allowed' : ''
        }`}
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          zIndex: element.zIndex || 0,
          opacity: element.style.opacity || 1,
          transform: element.style.rotation ? `rotate(${element.style.rotation}deg)` : undefined,
          pointerEvents: element.locked ? 'none' : 'auto'
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (element.type === 'text') {
            setEditingText(element.id)
          }
        }}
      >
        {/* Render content based on type */}
        {element.type === 'text' && (
          editingText === element.id ? (
            <Input
              defaultValue={element.content || ''}
              className="w-full h-full border-none bg-transparent p-0"
              style={{
                fontSize: element.style.fontSize,
                fontFamily: element.style.fontFamily,
                color: element.style.color,
                textAlign: element.style.textAlign,
                fontWeight: element.style.fontWeight,
                fontStyle: element.style.fontStyle
              }}
              onBlur={(e) => {
                onElementUpdate(element.id, { content: e.target.value })
                setEditingText(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onElementUpdate(element.id, { content: e.currentTarget.value })
                  setEditingText(null)
                }
              }}
              autoFocus
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-2 select-none"
              style={{
                fontSize: element.style.fontSize,
                fontFamily: element.style.fontFamily,
                color: element.style.color,
                backgroundColor: element.style.backgroundColor,
                textAlign: element.style.textAlign,
                fontWeight: element.style.fontWeight,
                fontStyle: element.style.fontStyle,
                wordWrap: 'break-word',
                overflow: 'hidden'
              }}
            >
              {element.content || 'Texto'}
            </div>
          )
        )}

        {element.type === 'shape' && (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: element.style.backgroundColor || '#3b82f6',
              borderColor: element.style.borderColor,
              borderWidth: element.style.borderWidth,
              borderRadius: element.properties?.shape === 'circle' ? '50%' : '0'
            }}
          />
        )}

        {element.type === 'image' && element.properties?.src && (
          <div className="w-full h-full relative overflow-hidden">
            <Image
              src={element.properties.src}
              alt={element.properties.alt || 'Imagem'}
              fill
              className="object-cover"
              draggable={false}
              onError={(e) => {
                console.error('Erro ao carregar imagem:', element.properties?.src)
                // Fallback para placeholder
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-image.png'
              }}
            />
          </div>
        )}

        {/* Selection handles */}
        {isSelected && !element.locked && (
          <>
            {/* Resize handles */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 cursor-nw-resize" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 cursor-ne-resize" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 cursor-sw-resize" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 cursor-se-resize" />
            
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 cursor-n-resize" />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 cursor-s-resize" />
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 cursor-w-resize" />
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 cursor-e-resize" />
          </>
        )}

        {/* Element badges */}
        {(element.locked || !element.visible) && (
          <div className="absolute -top-6 left-0 flex space-x-1">
            {element.locked && <Lock className="w-4 h-4 text-red-500" />}
            {!element.visible && <EyeOff className="w-4 h-4 text-gray-500" />}
          </div>
        )}
      </div>
    )
  }

  // Render grid
  const renderGrid = () => {
    if (!canvasConfig.showGrid) return null

    const gridSize = canvasConfig.gridSize
    const canvasWidth = canvasConfig.width
    const canvasHeight = canvasConfig.height

    const lines = []
    
    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasHeight}
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.5"
        />
      )
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={canvasWidth}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.5"
        />
      )
    }

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        width={canvasWidth}
        height={canvasHeight}
      >
        {lines}
      </svg>
    )
  }

  // Render selection box
  const renderSelectionBox = () => {
    if (!selectionBox.active) return null

    const minX = Math.min(selectionBox.startX, selectionBox.endX)
    const maxX = Math.max(selectionBox.startX, selectionBox.endX)
    const minY = Math.min(selectionBox.startY, selectionBox.endY)
    const maxY = Math.max(selectionBox.startY, selectionBox.endY)

    return (
      <div
        className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
        style={{
          left: minX,
          top: minY,
          width: maxX - minX,
          height: maxY - minY
        }}
      />
    )
  }

  return (
    <div className="relative w-full h-full overflow-auto bg-gray-100">
      {/* Canvas container */}
      <div
        ref={canvasRef}
        className="relative bg-white shadow-lg mx-auto my-8 cursor-crosshair"
        style={{
          width: canvasConfig.width,
          height: canvasConfig.height,
          transform: `scale(${canvasConfig.zoom / 100})`,
          transformOrigin: 'top left'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {/* Grid */}
        {renderGrid()}

        {/* Elements */}
        {sortedElements.map(renderElement)}

        {/* Selection box */}
        {renderSelectionBox()}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-lg border py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <Button variant="ghost" size="sm" className="w-full justify-start px-3">
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start px-3">
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start px-3">
            <Lock className="w-4 h-4 mr-2" />
            Bloquear
          </Button>
        </div>
      )}

      {/* Floating toolbar for selected elements */}
      {selectedElements.length > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg border p-2 flex items-center space-x-2 z-40">
          <Badge variant="secondary">{selectedElements.length} selecionado(s)</Badge>
          
          <Button variant="outline" size="sm" onClick={handleCopySelected}>
            <Copy className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
            <Trash2 className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm">
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Quick add toolbar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg border p-2 flex items-center space-x-2 z-40">
        <Button variant="outline" size="sm" onClick={() => handleAddElement('text')}>
          <Type className="w-4 h-4 mr-2" />
          Texto
        </Button>
        
        <Button variant="outline" size="sm" onClick={() => handleAddElement('shape')}>
          <Square className="w-4 h-4 mr-2" />
          Forma
        </Button>
        
        <Button variant="outline" size="sm" onClick={() => handleAddElement('image')}>
          <ImageIcon className="w-4 h-4 mr-2" />
          Imagem
        </Button>
      </div>
    </div>
  )
})

CanvasEditorV2.displayName = 'CanvasEditorV2'

export { CanvasEditorV2 }
export default CanvasEditorV2
