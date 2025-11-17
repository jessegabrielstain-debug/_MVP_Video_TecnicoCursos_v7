
/**
 * 🎨 Animaker Canvas Editor
 * Canvas interativo com elementos editáveis (drag, resize, rotate)
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  MousePointer2, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle,
  Triangle,
  RotateCcw,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Move3D
} from 'lucide-react'
import { AnimakerElement, AnimakerSlide } from '@/lib/pptx-parser-animaker'

interface AnimakerCanvasEditorProps {
  slide: AnimakerSlide
  selectedElements: string[]
  onElementsChange: (elements: AnimakerElement[]) => void
  onSelectionChange: (selectedIds: string[]) => void
  zoom: number
  onZoomChange: (zoom: number) => void
}

interface DragState {
  isDragging: boolean
  dragStart: { x: number; y: number }
  elementStart: { x: number; y: number }
  elementId: string | null
}

interface ResizeState {
  isResizing: boolean
  resizeStart: { x: number; y: number }
  elementStart: { x: number; y: number; width: number; height: number }
  elementId: string | null
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null
}

export function AnimakerCanvasEditor({
  slide,
  selectedElements,
  onElementsChange,
  onSelectionChange,
  zoom,
  onZoomChange
}: AnimakerCanvasEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    elementStart: { x: 0, y: 0 },
    elementId: null
  })
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizeStart: { x: 0, y: 0 },
    elementStart: { x: 0, y: 0, width: 0, height: 0 },
    elementId: null,
    handle: null
  })
  const [showGrid, setShowGrid] = useState(true)
  const [tool, setTool] = useState<'select' | 'text' | 'image' | 'shape'>('select')

  // Canvas dimensions (16:9 aspect ratio)
  const canvasWidth = 1280
  const canvasHeight = 720

  // Handle element selection
  const handleElementClick = useCallback((elementId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const newSelection = selectedElements.includes(elementId)
        ? selectedElements.filter(id => id !== elementId)
        : [...selectedElements, elementId]
      onSelectionChange(newSelection)
    } else {
      // Single select
      onSelectionChange([elementId])
    }
  }, [selectedElements, onSelectionChange])

  // Handle canvas click (deselect all)
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onSelectionChange([])
    }
  }, [onSelectionChange])

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((elementId: string, event: React.MouseEvent) => {
    event.preventDefault()
    
    const element = slide.elements.find(el => el.id === elementId)
    if (!element || element.metadata.locked) return

    setDragState({
      isDragging: true,
      dragStart: { x: event.clientX, y: event.clientY },
      elementStart: { x: element.position.x, y: element.position.y },
      elementId
    })
  }, [slide.elements])

  // Handle mouse move
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (dragState.isDragging && dragState.elementId) {
      const deltaX = (event.clientX - dragState.dragStart.x) / zoom
      const deltaY = (event.clientY - dragState.dragStart.y) / zoom
      
      const newX = Math.max(0, Math.min(canvasWidth - 50, dragState.elementStart.x + deltaX))
      const newY = Math.max(0, Math.min(canvasHeight - 50, dragState.elementStart.y + deltaY))
      
      updateElementPosition(dragState.elementId, newX, newY)
    }
    
    if (resizeState.isResizing && resizeState.elementId && resizeState.handle) {
      const deltaX = (event.clientX - resizeState.resizeStart.x) / zoom
      const deltaY = (event.clientY - resizeState.resizeStart.y) / zoom
      
      handleResize(resizeState.elementId, resizeState.handle, deltaX, deltaY)
    }
  }, [dragState, resizeState, zoom])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      elementStart: { x: 0, y: 0 },
      elementId: null
    })
    
    setResizeState({
      isResizing: false,
      resizeStart: { x: 0, y: 0 },
      elementStart: { x: 0, y: 0, width: 0, height: 0 },
      elementId: null,
      handle: null
    })
  }, [])

  // Add event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Update element position
  const updateElementPosition = (elementId: string, x: number, y: number) => {
    const updatedElements = slide.elements.map(element =>
      element.id === elementId
        ? { ...element, position: { ...element.position, x, y } }
        : element
    )
    onElementsChange(updatedElements)
  }

  // Update element size
  const updateElementSize = (elementId: string, width: number, height: number) => {
    const updatedElements = slide.elements.map(element =>
      element.id === elementId
        ? { ...element, position: { ...element.position, width: Math.max(20, width), height: Math.max(20, height) } }
        : element
    )
    onElementsChange(updatedElements)
  }

  // Handle resize
  const handleResize = (elementId: string, handle: string, deltaX: number, deltaY: number) => {
    const element = slide.elements.find(el => el.id === elementId)
    if (!element) return

    let newWidth = resizeState.elementStart.width
    let newHeight = resizeState.elementStart.height
    let newX = element.position.x
    let newY = element.position.y

    switch (handle) {
      case 'se': // Bottom-right
        newWidth = resizeState.elementStart.width + deltaX
        newHeight = resizeState.elementStart.height + deltaY
        break
      case 'sw': // Bottom-left
        newWidth = resizeState.elementStart.width - deltaX
        newHeight = resizeState.elementStart.height + deltaY
        newX = resizeState.elementStart.x + deltaX
        break
      case 'ne': // Top-right
        newWidth = resizeState.elementStart.width + deltaX
        newHeight = resizeState.elementStart.height - deltaY
        newY = resizeState.elementStart.y + deltaY
        break
      case 'nw': // Top-left
        newWidth = resizeState.elementStart.width - deltaX
        newHeight = resizeState.elementStart.height - deltaY
        newX = resizeState.elementStart.x + deltaX
        newY = resizeState.elementStart.y + deltaY
        break
      case 'e': // Right
        newWidth = resizeState.elementStart.width + deltaX
        break
      case 'w': // Left
        newWidth = resizeState.elementStart.width - deltaX
        newX = resizeState.elementStart.x + deltaX
        break
      case 's': // Bottom
        newHeight = resizeState.elementStart.height + deltaY
        break
      case 'n': // Top
        newHeight = resizeState.elementStart.height - deltaY
        newY = resizeState.elementStart.y + deltaY
        break
    }

    // Apply constraints
    newWidth = Math.max(20, Math.min(canvasWidth - newX, newWidth))
    newHeight = Math.max(20, Math.min(canvasHeight - newY, newHeight))

    const updatedElements = slide.elements.map(element =>
      element.id === elementId
        ? {
            ...element,
            position: {
              ...element.position,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight
            }
          }
        : element
    )
    onElementsChange(updatedElements)
  }

  // Handle resize mouse down
  const handleResizeMouseDown = (elementId: string, handle: string, event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    
    const element = slide.elements.find(el => el.id === elementId)
    if (!element) return

    setResizeState({
      isResizing: true,
      resizeStart: { x: event.clientX, y: event.clientY },
      elementStart: {
        x: element.position.x,
        y: element.position.y,
        width: element.position.width,
        height: element.position.height
      },
      elementId,
      handle: handle as 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
    })
  }

  // Add new element
  const addElement = (type: 'text' | 'image' | 'shape') => {
    const newElement: AnimakerElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: type === 'text' ? 'Novo Texto' : type === 'image' ? '/images/placeholder.jpg' : '',
      position: {
        x: canvasWidth / 2 - 100,
        y: canvasHeight / 2 - 50,
        width: type === 'text' ? 200 : 100,
        height: type === 'text' ? 50 : 100
      },
      style: {
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: type === 'shape' ? '#007bff' : 'transparent'
      },
      animation: {
        type: 'fadeIn',
        duration: 1000,
        delay: 0,
        easing: 'ease-in-out'
      },
      interactive: {
        clickable: true
      },
      metadata: {
        originalIndex: slide.elements.length,
        slideId: slide.id,
        elementId: `new_${type}_${Date.now()}`,
        visible: true,
        locked: false
      }
    }

    const updatedElements = [...slide.elements, newElement]
    onElementsChange(updatedElements)
    onSelectionChange([newElement.id])
    setTool('select')
  }

  // Delete selected elements
  const deleteSelectedElements = () => {
    const updatedElements = slide.elements.filter(el => !selectedElements.includes(el.id))
    onElementsChange(updatedElements)
    onSelectionChange([])
  }

  // Duplicate selected elements
  const duplicateSelectedElements = () => {
    const selectedElementsData = slide.elements.filter(el => selectedElements.includes(el.id))
    const duplicatedElements = selectedElementsData.map(element => ({
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: {
        ...element.position,
        x: element.position.x + 20,
        y: element.position.y + 20
      }
    }))

    const updatedElements = [...slide.elements, ...duplicatedElements]
    onElementsChange(updatedElements)
    onSelectionChange(duplicatedElements.map(el => el.id))
  }

  // Toggle element visibility
  const toggleElementVisibility = (elementId: string) => {
    const updatedElements = slide.elements.map(element =>
      element.id === elementId
        ? { ...element, metadata: { ...element.metadata, visible: !element.metadata.visible } }
        : element
    )
    onElementsChange(updatedElements)
  }

  // Toggle element lock
  const toggleElementLock = (elementId: string) => {
    const updatedElements = slide.elements.map(element =>
      element.id === elementId
        ? { ...element, metadata: { ...element.metadata, locked: !element.metadata.locked } }
        : element
    )
    onElementsChange(updatedElements)
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          {/* Left tools */}
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg bg-gray-700 p-1">
              <Button
                size="sm"
                variant={tool === 'select' ? 'default' : 'ghost'}
                onClick={() => setTool('select')}
              >
                <MousePointer2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={tool === 'text' ? 'default' : 'ghost'}
                onClick={() => addElement('text')}
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={tool === 'image' ? 'default' : 'ghost'}
                onClick={() => addElement('image')}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={tool === 'shape' ? 'default' : 'ghost'}
                onClick={() => addElement('shape')}
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Actions */}
            {selectedElements.length > 0 && (
              <div className="flex items-center space-x-2 ml-4">
                <Button size="sm" variant="ghost" onClick={duplicateSelectedElements}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={deleteSelectedElements}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right tools */}
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-300 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button size="sm" variant="ghost" onClick={() => onZoomChange(Math.min(3, zoom + 0.25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Badge variant="outline" className="text-gray-300">
              {canvasWidth} × {canvasHeight}
            </Badge>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden bg-gray-900 relative">
        <div className="w-full h-full flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl cursor-crosshair"
            style={{
              width: canvasWidth * zoom,
              height: canvasHeight * zoom,
              transform: `scale(1)`,
              transformOrigin: 'center'
            }}
            onClick={handleCanvasClick}
          >
            {/* Grid */}
            {showGrid && (
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`
                }}
              />
            )}
            
            {/* Background */}
            <div
              className="absolute inset-0"
              style={{
                background: slide.background.type === 'gradient' 
                  ? slide.background.value 
                  : slide.background.value,
                opacity: slide.background.opacity || 1
              }}
            />

            {/* Elements */}
            {slide.elements.map(element => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={selectedElements.includes(element.id)}
                zoom={zoom}
                onSelect={(e) => handleElementClick(element.id, e)}
                onMouseDown={(e) => handleMouseDown(element.id, e)}
                onResizeMouseDown={(handle, e) => handleResizeMouseDown(element.id, handle, e)}
                onToggleVisibility={() => toggleElementVisibility(element.id)}
                onToggleLock={() => toggleElementLock(element.id)}
              />
            ))}
            
            {/* Selection Info */}
            {selectedElements.length > 0 && (
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded text-sm">
                {selectedElements.length} elemento(s) selecionado(s)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Canvas Element Component
interface CanvasElementProps {
  element: AnimakerElement
  isSelected: boolean
  zoom: number
  onSelect: (event: React.MouseEvent) => void
  onMouseDown: (event: React.MouseEvent) => void
  onResizeMouseDown: (handle: string, event: React.MouseEvent) => void
  onToggleVisibility: () => void
  onToggleLock: () => void
}

function CanvasElement({
  element,
  isSelected,
  zoom,
  onSelect,
  onMouseDown,
  onResizeMouseDown,
  onToggleVisibility,
  onToggleLock
}: CanvasElementProps) {
  const { position, style, type, content, metadata } = element

  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x * zoom,
    top: position.y * zoom,
    width: position.width * zoom,
    height: position.height * zoom,
    fontSize: (style.fontSize || 18) * zoom,
    fontFamily: style.fontFamily || 'Arial',
    color: style.color || '#000000',
    backgroundColor: style.backgroundColor || 'transparent',
    border: isSelected ? '2px solid #007bff' : style.borderColor ? `${style.borderWidth || 1}px solid ${style.borderColor}` : 'none',
    borderRadius: (style.borderRadius || 0) * zoom,
    opacity: metadata.visible ? (style.opacity || 1) : 0.5,
    cursor: metadata.locked ? 'not-allowed' : 'move',
    transform: style.rotation ? `rotate(${style.rotation}deg)` : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    userSelect: 'none',
    pointerEvents: metadata.visible ? 'auto' : 'none'
  }

  const renderContent = () => {
    switch (type) {
      case 'text':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 8 * zoom,
              wordBreak: 'break-word'
            }}
          >
            {content}
          </div>
        )
      case 'image':
        return (
          <img
            src={content}
            alt="Element"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: (style.borderRadius || 0) * zoom
            }}
            draggable={false}
          />
        )
      case 'shape':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: style.backgroundColor || '#007bff',
              borderRadius: (style.borderRadius || 0) * zoom
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Element */}
      <div
        style={elementStyle}
        onClick={onSelect}
        onMouseDown={onMouseDown}
      >
        {renderContent()}
        
        {/* Lock/Visibility indicators */}
        {(metadata.locked || !metadata.visible) && (
          <div className="absolute top-1 right-1 flex space-x-1">
            {metadata.locked && (
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <Lock className="w-2 h-2 text-white" />
              </div>
            )}
            {!metadata.visible && (
              <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                <EyeOff className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Handles */}
      {isSelected && !metadata.locked && (
        <>
          {/* Corner handles */}
          <ResizeHandle
            position={{ 
              left: (position.x - 4) * zoom, 
              top: (position.y - 4) * zoom 
            }}
            cursor="nw-resize"
            onMouseDown={(e) => onResizeMouseDown('nw', e)}
          />
          <ResizeHandle
            position={{ 
              left: (position.x + position.width - 4) * zoom, 
              top: (position.y - 4) * zoom 
            }}
            cursor="ne-resize"
            onMouseDown={(e) => onResizeMouseDown('ne', e)}
          />
          <ResizeHandle
            position={{ 
              left: (position.x - 4) * zoom, 
              top: (position.y + position.height - 4) * zoom 
            }}
            cursor="sw-resize"
            onMouseDown={(e) => onResizeMouseDown('sw', e)}
          />
          <ResizeHandle
            position={{ 
              left: (position.x + position.width - 4) * zoom, 
              top: (position.y + position.height - 4) * zoom 
            }}
            cursor="se-resize"
            onMouseDown={(e) => onResizeMouseDown('se', e)}
          />

          {/* Side handles */}
          <ResizeHandle
            position={{ 
              left: (position.x + position.width / 2 - 4) * zoom, 
              top: (position.y - 4) * zoom 
            }}
            cursor="n-resize"
            onMouseDown={(e) => onResizeMouseDown('n', e)}
          />
          <ResizeHandle
            position={{ 
              left: (position.x + position.width / 2 - 4) * zoom, 
              top: (position.y + position.height - 4) * zoom 
            }}
            cursor="s-resize"
            onMouseDown={(e) => onResizeMouseDown('s', e)}
          />
          <ResizeHandle
            position={{ 
              left: (position.x - 4) * zoom, 
              top: (position.y + position.height / 2 - 4) * zoom 
            }}
            cursor="w-resize"
            onMouseDown={(e) => onResizeMouseDown('w', e)}
          />
          <ResizeHandle
            position={{ 
              left: (position.x + position.width - 4) * zoom, 
              top: (position.y + position.height / 2 - 4) * zoom 
            }}
            cursor="e-resize"
            onMouseDown={(e) => onResizeMouseDown('e', e)}
          />
        </>
      )}
    </>
  )
}

// Resize Handle Component
interface ResizeHandleProps {
  position: { left: number; top: number }
  cursor: string
  onMouseDown: (event: React.MouseEvent) => void
}

function ResizeHandle({ position, cursor, onMouseDown }: ResizeHandleProps) {
  return (
    <div
      className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm"
      style={{
        left: position.left,
        top: position.top,
        cursor,
        zIndex: 1000
      }}
      onMouseDown={onMouseDown}
    />
  )
}
