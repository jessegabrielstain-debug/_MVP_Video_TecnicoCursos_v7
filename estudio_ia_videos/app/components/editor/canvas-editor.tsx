
/**
 * 🎨 Canvas Editor - Drag & Drop WYSIWYG
 * Canvas principal com suporte a drag-and-drop, redimensionamento e seleção múltipla
 */

'use client'

import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect } from 'react'
import { UnifiedSlide, UnifiedElement } from '@/lib/types-unified'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Move, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react'

// Função utilitária para obter propriedades de posição com fallbacks
const getElementPosition = (element: UnifiedElement) => ({
  x: element.x ?? element.style?.position?.x ?? 0,
  y: element.y ?? element.style?.position?.y ?? 0,
  width: element.width ?? element.style?.position?.width ?? 100,
  height: element.height ?? element.style?.position?.height ?? 50,
  zIndex: element.zIndex ?? 1
})

interface CanvasEditorProps {
  slide?: UnifiedSlide | null
  selectedElements: string[]
  onElementSelect: (elementIds: string[]) => void
  onElementUpdate: (elementId: string, updates: Partial<UnifiedElement>) => void
  zoom: number
}

interface DragState {
  isDragging: boolean
  elementId: string
  startPos: { x: number; y: number }
  initialPos: { x: number; y: number }
}

interface ResizeState {
  isResizing: boolean
  elementId: string
  handle: string
  startPos: { x: number; y: number }
  initialSize: { width: number; height: number }
  initialPos: { x: number; y: number }
}

export interface CanvasEditorRef {
  selectAll: () => void
  deleteSelected: () => void
  copySelected: () => void
  pasteElements: () => void
}

export const CanvasEditor = forwardRef<CanvasEditorRef, CanvasEditorProps>(
  ({ slide, selectedElements, onElementSelect, onElementUpdate, zoom }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [dragState, setDragState] = useState<DragState | null>(null)
    const [resizeState, setResizeState] = useState<ResizeState | null>(null)
    const [clipboard, setClipboard] = useState<UnifiedElement[]>([])
    const [guidesVisible, setGuidesVisible] = useState(false)

    // Dimensões do canvas baseadas no zoom
    const canvasWidth = (1920 * zoom) / 100
    const canvasHeight = (1080 * zoom) / 100

    // Expor métodos via ref
    useImperativeHandle(ref, () => ({
      selectAll: () => {
        if (slide) {
          onElementSelect(slide.elements.map(el => el.id))
        }
      },
      deleteSelected: () => {
        if (slide) {
          selectedElements.forEach(elementId => {
            const elementIndex = slide.elements.findIndex(el => el.id === elementId)
            if (elementIndex !== -1) {
              // Remover elemento da lista
              const updatedElements = slide.elements.filter(el => el.id !== elementId)
              // Aqui você precisaria notificar o componente pai sobre a remoção
            }
          })
          onElementSelect([])
        }
      },
      copySelected: () => {
        if (slide) {
          const elementsToCopy = slide.elements.filter(el => selectedElements.includes(el.id))
          setClipboard(elementsToCopy)
        }
      },
      pasteElements: () => {
        if (clipboard.length > 0) {
          clipboard.forEach((element, index) => {
            const pos = getElementPosition(element)
            const newElement = {
              ...element,
              id: `${element.id}_copy_${Date.now()}_${index}`,
              x: pos.x + 20,
              y: pos.y + 20
            }
            // Aqui você precisaria adicionar o elemento à lista
          })
        }
      }
    }), [slide, selectedElements, clipboard, onElementSelect])

    // Handlers de mouse
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLElement>, elementId: string) => {
      e.stopPropagation()
      
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const element = slide?.elements.find(el => el.id === elementId)
      if (!element) return

      // Verificar se é um handle de redimensionamento
      const target = e.target as HTMLElement
      if (target.dataset.handle) {
        const pos = getElementPosition(element)
        setResizeState({
          isResizing: true,
          elementId,
          handle: target.dataset.handle,
          startPos: { x: e.clientX, y: e.clientY },
          initialSize: { width: pos.width, height: pos.height },
          initialPos: { x: pos.x, y: pos.y }
        })
        return
      }

      // Iniciar drag
      const pos = getElementPosition(element)
      setDragState({
        isDragging: true,
        elementId,
        startPos: { x: e.clientX, y: e.clientY },
        initialPos: { x: pos.x, y: pos.y }
      })

      // Selecionar elemento
      if (!selectedElements.includes(elementId)) {
        if (e.ctrlKey || e.metaKey) {
          onElementSelect([...selectedElements, elementId])
        } else {
          onElementSelect([elementId])
        }
      }
    }, [slide, selectedElements, onElementSelect])

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (dragState?.isDragging) {
        const deltaX = (e.clientX - dragState.startPos.x) * (100 / zoom)
        const deltaY = (e.clientY - dragState.startPos.y) * (100 / zoom)

        onElementUpdate(dragState.elementId, {
          x: Math.max(0, Math.min(1920 - 100, dragState.initialPos.x + deltaX)),
          y: Math.max(0, Math.min(1080 - 100, dragState.initialPos.y + deltaY))
        })
      }

      if (resizeState?.isResizing) {
        const deltaX = (e.clientX - resizeState.startPos.x) * (100 / zoom)
        const deltaY = (e.clientY - resizeState.startPos.y) * (100 / zoom)

        let updates: Partial<UnifiedElement> = {}

        switch (resizeState.handle) {
          case 'se':
            updates = {
              width: Math.max(20, resizeState.initialSize.width + deltaX),
              height: Math.max(20, resizeState.initialSize.height + deltaY)
            }
            break
          case 'sw':
            updates = {
              x: Math.max(0, resizeState.initialPos.x + deltaX),
              width: Math.max(20, resizeState.initialSize.width - deltaX),
              height: Math.max(20, resizeState.initialSize.height + deltaY)
            }
            break
          case 'ne':
            updates = {
              y: Math.max(0, resizeState.initialPos.y + deltaY),
              width: Math.max(20, resizeState.initialSize.width + deltaX),
              height: Math.max(20, resizeState.initialSize.height - deltaY)
            }
            break
          case 'nw':
            updates = {
              x: Math.max(0, resizeState.initialPos.x + deltaX),
              y: Math.max(0, resizeState.initialPos.y + deltaY),
              width: Math.max(20, resizeState.initialSize.width - deltaX),
              height: Math.max(20, resizeState.initialSize.height - deltaY)
            }
            break
        }

        onElementUpdate(resizeState.elementId, updates)
      }
    }, [dragState, resizeState, onElementUpdate, zoom])

    const handleMouseUp = useCallback(() => {
      setDragState(null)
      setResizeState(null)
    }, [])

    // Event listeners
    useEffect(() => {
      if (dragState?.isDragging || resizeState?.isResizing) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [dragState, resizeState, handleMouseMove, handleMouseUp])

    // Click no canvas para deselecionar
    const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onElementSelect([])
      }
    }

    // Renderizar elemento
    const renderElement = (element: UnifiedElement) => {
      const isSelected = selectedElements.includes(element.id)
      const pos = getElementPosition(element)
      const scaledX = (pos.x * zoom) / 100
      const scaledY = (pos.y * zoom) / 100
      const scaledWidth = (pos.width * zoom) / 100
      const scaledHeight = (pos.height * zoom) / 100

      const baseStyle = {
        position: 'absolute' as const,
        left: scaledX,
        top: scaledY,
        width: scaledWidth,
        height: scaledHeight,
        zIndex: element.zIndex,
        cursor: 'move',
        userSelect: 'none' as const
      }

      let content: React.ReactNode

      switch (element.type) {
        case 'text':
          content = (
            <div
              style={{
                ...baseStyle,
                fontSize: ((element.properties.fontSize || 16) * zoom) / 100,
                fontFamily: element.properties.fontFamily,
                color: element.properties.color,
                fontWeight: element.properties.fontWeight,
                textAlign: element.properties.textAlign,
                display: 'flex',
                alignItems: 'center',
                justifyContent: element.properties.textAlign === 'center' ? 'center' : 'flex-start',
                padding: '8px',
                wordBreak: 'break-word',
                overflow: 'hidden'
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
            >
              {element.properties.text}
            </div>
          )
          break

        case 'image':
          content = (
            <div
              style={{
                ...baseStyle,
                backgroundImage: `url(${element.properties.src})`,
                backgroundSize: element.properties.fit || 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                border: '2px solid transparent',
                borderRadius: element.properties.borderRadius || 0
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
            />
          )
          break

        case 'video':
          content = (
            <div
              style={{
                ...baseStyle,
                backgroundColor: '#f0f0f0',
                border: '2px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1" />
                </div>
                <span className="text-sm text-gray-600">Vídeo</span>
              </div>
            </div>
          )
          break

        case 'shape':
          const shapeStyle = {
            ...baseStyle,
            backgroundColor: element.properties.fill,
            border: `${element.properties.strokeWidth || 0}px solid ${element.properties.stroke || 'transparent'}`,
            borderRadius: element.properties.borderRadius || 0,
            opacity: element.properties.opacity || 1
          }

          content = (
            <div
              style={shapeStyle}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
            />
          )
          break

        default:
          content = (
            <div
              style={{
                ...baseStyle,
                border: '2px dashed #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9f9f9'
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
            >
              <span className="text-sm text-gray-500">{element.type}</span>
            </div>
          )
      }

      return (
        <React.Fragment key={element.id}>
          {content}
          
          {/* Selection handles */}
          {isSelected && (
            <div
              style={{
                position: 'absolute',
                left: scaledX - 4,
                top: scaledY - 4,
                width: scaledWidth + 8,
                height: scaledHeight + 8,
                border: '2px solid #3b82f6',
                pointerEvents: 'none',
                zIndex: 9999
              }}
            >
              {/* Resize handles */}
              <div
                data-handle="nw"
                style={{
                  position: 'absolute',
                  top: -4,
                  left: -4,
                  width: 8,
                  height: 8,
                  backgroundColor: '#3b82f6',
                  cursor: 'nw-resize',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              />
              <div
                data-handle="ne"
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 8,
                  height: 8,
                  backgroundColor: '#3b82f6',
                  cursor: 'ne-resize',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              />
              <div
                data-handle="sw"
                style={{
                  position: 'absolute',
                  bottom: -4,
                  left: -4,
                  width: 8,
                  height: 8,
                  backgroundColor: '#3b82f6',
                  cursor: 'sw-resize',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              />
              <div
                data-handle="se"
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 8,
                  height: 8,
                  backgroundColor: '#3b82f6',
                  cursor: 'se-resize',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              />
            </div>
          )}
        </React.Fragment>
      )
    }

    if (!slide) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">Nenhuma cena selecionada</p>
            <p className="text-sm">Selecione uma cena para começar a editar</p>
          </div>
        </div>
      )
    }

    return (
      <div className="h-full flex items-center justify-center overflow-auto">
        <div
          ref={canvasRef}
          className="relative bg-white shadow-lg border"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            minWidth: canvasWidth,
            minHeight: canvasHeight
          }}
          onClick={handleCanvasClick}
        >
          {/* Background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: slide.background?.color || '#ffffff',
              backgroundImage: slide.background?.image ? `url(${slide.background.image})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Grid (opcional) */}
          {guidesVisible && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #ccc 1px, transparent 1px),
                  linear-gradient(to bottom, #ccc 1px, transparent 1px)
                `,
                backgroundSize: `${20 * zoom / 100}px ${20 * zoom / 100}px`
              }}
            />
          )}

          {/* Elementos */}
          {slide.elements
            .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
            .map(renderElement)}
        </div>
      </div>
    )
  }
)

CanvasEditor.displayName = 'CanvasEditor'
