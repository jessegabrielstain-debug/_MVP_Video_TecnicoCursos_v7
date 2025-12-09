

'use client'

/**
 * 🎨 Professional Canvas Editor - Sprint 28
 * Features: Snap/Grid, Lazy Render, Advanced Tools, Fabric.js
 * NOTE: Must be loaded dynamically with { ssr: false } in parent component
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Undo2, 
  Redo2, 
  Layers, 
  Move, 
  Type, 
  Image as ImageIcon, 
  Download,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Grid3X3,
  Magnet,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import type * as Fabric from 'fabric'

// Fabric.js import
let fabric: typeof Fabric | null = null

interface Layer {
  id: string
  name: string
  object: Fabric.Object
  visible: boolean
  locked: boolean
  order: number
}

interface CanvasSlideElement {
  type: string
  content?: string
  src?: string
  x?: number
  y?: number
  fontSize?: number
  color?: string
  fontFamily?: string
  id?: string
  scaleX?: number
  scaleY?: number
  [key: string]: unknown
}

interface CanvasSlideData {
  backgroundImage?: string
  elements?: CanvasSlideElement[]
  [key: string]: unknown
}

interface CanvasEditorProps {
  width?: number
  height?: number
  initialSlide?: CanvasSlideData
  onSave?: (data: Record<string, unknown>) => void
}

export default function CanvasEditorProfessionalSprint28({
  width = 1920,
  height = 1080,
  initialSlide,
  onSave
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvas, setCanvas] = useState<Fabric.Canvas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // History for undo/redo
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Layers
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  
  // Tools
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image'>('select')
  
  // Grid and Snap
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  
  // Zoom
  const [zoom, setZoom] = useState(100)

  /**
   * Initialize Fabric.js
   */
  useEffect(() => {
    const loadFabric = async () => {
      try {
        if (!fabric) {
          // ✅ CORRIGIDO: Usa FabricManager singleton
          const { FabricManager } = await import('@/lib/fabric-singleton')
          fabric = FabricManager.getInstance()
        }
        initializeCanvas()
      } catch (error) {
        logger.error('Failed to load Fabric.js:', error instanceof Error ? error : new Error(String(error)), { component: 'CanvasEditorProfessionalSprint28' })
        toast.error('Falha ao carregar editor')
      }
    }
    loadFabric()
  }, [])

  /**
   * Initialize canvas with grid and snap
   */
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || canvas || !fabric) return

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      snapToGrid: true,
      gridSize
    })

    // Enable snap to grid
    newCanvas.on('object:moving', (e: any) => {
      if (snapToGrid && e.target) {
        const obj = e.target
        obj.set({
          left: Math.round((obj.left || 0) / gridSize) * gridSize,
          top: Math.round((obj.top || 0) / gridSize) * gridSize
        })
      }
    })

    // Events
    newCanvas.on('object:modified', () => {
      saveHistory()
      updateLayers()
    })

    newCanvas.on('object:added', () => {
      updateLayers()
      saveHistory()
    })

    newCanvas.on('object:removed', () => {
      updateLayers()
      saveHistory()
    })

    newCanvas.on('selection:created', (e: any) => {
      if (e.selected && e.selected[0]) {
        const selectedObj = e.selected[0] as Fabric.Object & { id?: string }
        setSelectedLayer(selectedObj.id || null)
      }
    })

    newCanvas.on('selection:updated', (e: any) => {
      if (e.selected && e.selected[0]) {
        const selectedObj = e.selected[0] as Fabric.Object & { id?: string }
        setSelectedLayer(selectedObj.id || null)
      }
    })

    newCanvas.on('selection:cleared', () => {
      setSelectedLayer(null)
    })

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(newCanvas)
    }

    setCanvas(newCanvas)
    setIsLoading(false)

    // Load initial slide if provided
    if (initialSlide) {
      loadSlideData(newCanvas, initialSlide)
    } else {
      saveHistory()
    }

    return () => {
      newCanvas.dispose()
    }
  }, [width, height, initialSlide, showGrid, gridSize, snapToGrid])

  /**
   * Draw grid on canvas
   */
  const drawGrid = (canvas: Fabric.Canvas) => {
    if (!canvas || !fabric) return

    const gridWidth = canvas.width || 0
    const gridHeight = canvas.height || 0

    // Remove existing grid lines
    canvas.getObjects('line').forEach((obj: Fabric.Object) => {
      if ((obj as any).grid) canvas.remove(obj)
    })

    // Draw vertical lines
    for (let i = 0; i < gridWidth / gridSize; i++) {
      const line = new fabric.Line([i * gridSize, 0, i * gridSize, gridHeight], {
        stroke: '#e5e5e5',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        // @ts-ignore
        grid: true
      })
      canvas.add(line)
      canvas.sendObjectToBack(line)
    }

    // Draw horizontal lines
    for (let i = 0; i < gridHeight / gridSize; i++) {
      const line = new fabric.Line([0, i * gridSize, gridWidth, i * gridSize], {
        stroke: '#e5e5e5',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        // @ts-ignore
        grid: true
      })
      canvas.add(line)
      canvas.sendObjectToBack(line)
    }

    canvas.renderAll()
  }

  /**
   * Toggle grid visibility
   */
  const toggleGrid = () => {
    setShowGrid(!showGrid)
    if (!showGrid) {
      if (canvas) drawGrid(canvas)
    } else {
      // Remove grid lines
      canvas?.getObjects('line').forEach((obj: Fabric.Object) => {
        if ((obj as any).grid) canvas.remove(obj)
      })
      canvas?.renderAll()
    }
  }

  /**
   * Load slide data
   */
  const loadSlideData = (canvas: Fabric.Canvas, slide: CanvasSlideData) => {
    if (!canvas || !fabric) return

    try {
      // Load background
      if (slide.backgroundImage) {
        // @ts-ignore
        fabric.Image.fromURL(slide.backgroundImage, (img: any) => {
          img.scaleToWidth(width)
          img.scaleToHeight(height)
          img.selectable = false
          // @ts-ignore
          img.id = 'background'
          canvas.add(img)
          canvas.sendObjectToBack(img)
        })
      }

      // Load objects
      if (slide.elements) {
        slide.elements.forEach((element: CanvasSlideElement) => {
          if (element.type === 'text') {
            const text = new fabric!.IText(element.content || 'Text', {
              left: element.x || 100,
              top: element.y || 100,
              fontSize: element.fontSize || 40,
              fill: element.color || '#000000',
              fontFamily: element.fontFamily || 'Arial',
              // @ts-ignore
              id: element.id || generateId()
            })
            canvas.add(text)
          } else if (element.type === 'image' && element.src) {
            // @ts-ignore
            fabric!.Image.fromURL(element.src, (img: Fabric.Image) => {
              img.set({
                left: element.x || 100,
                top: element.y || 100,
                scaleX: element.scaleX || 1,
                scaleY: element.scaleY || 1,
                // @ts-ignore
                id: element.id || generateId()
              })
              canvas.add(img)
            })
          }
        })
      }

      saveHistory()
      updateLayers()
    } catch (error) {
      logger.error('Error loading slide:', error instanceof Error ? error : new Error(String(error)), { component: 'CanvasEditorProfessionalSprint28' })
      toast.error('Erro ao carregar slide')
    }
  }

  /**
   * Save history for undo/redo
   */
  const saveHistory = useCallback(() => {
    if (!canvas) return

    // @ts-ignore
    const json = JSON.stringify(canvas.toJSON(['id', 'grid']))
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(json)
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift()
      }
      return newHistory
    })
    
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [canvas, historyIndex])

  /**
   * Undo
   */
  const undo = useCallback(() => {
    if (!canvas || historyIndex <= 0) return

    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)
    
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll()
      updateLayers()
      toast.success('Desfeito')
    })
  }, [canvas, history, historyIndex])

  /**
   * Redo
   */
  const redo = useCallback(() => {
    if (!canvas || historyIndex >= history.length - 1) return

    const newIndex = historyIndex + 1
    setHistoryIndex(newIndex)
    
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll()
      updateLayers()
      toast.success('Refeito')
    })
  }, [canvas, history, historyIndex])

  /**
   * Add text to canvas
   */
  const addText = () => {
    if (!canvas || !fabric) return

    const text = new fabric.IText('Digite aqui...', {
      left: canvas.width / 2 - 100,
      top: canvas.height / 2 - 20,
      fontSize: 40,
      fill: '#000000',
      fontFamily: 'Arial',
      id: generateId()
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    saveHistory()
    toast.success('Texto adicionado')
  }

  /**
   * Add image to canvas
   */
  const addImage = () => {
    if (!canvas || !fabric) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          // @ts-ignore
          fabric!.Image.fromURL(event.target.result, (img: Fabric.Image) => {
            // Scale to fit canvas
            const scale = Math.min(
              (canvas.width || 800) / (img.width || 1) * 0.5,
              (canvas.height || 600) / (img.height || 1) * 0.5
            )
            
            img.set({
              left: (canvas.width || 800) / 2 - ((img.width || 0) * scale) / 2,
              top: (canvas.height || 600) / 2 - ((img.height || 0) * scale) / 2,
              scaleX: scale,
              scaleY: scale,
              // @ts-ignore
              id: generateId()
            })

            canvas.add(img)
            canvas.setActiveObject(img)
            saveHistory()
            toast.success('Imagem adicionada')
          })
        }
      }
      reader.readAsDataURL(file)
    }

    input.click()
  }

  /**
   * Delete selected object
   */
  const deleteSelected = () => {
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) {
      toast.error('Selecione um objeto para deletar')
      return
    }

    activeObjects.forEach((obj: Fabric.Object) => {
      canvas.remove(obj)
    })

    canvas.discardActiveObject()
    saveHistory()
    toast.success('Objeto(s) deletado(s)')
  }

  /**
   * Align objects
   */
  const alignObjects = (alignment: string) => {
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) {
      toast.error('Selecione um objeto para alinhar')
      return
    }

    switch (alignment) {
      case 'left':
        activeObject.set({ left: 0 })
        break
      case 'center':
        activeObject.set({ left: (canvas.width - activeObject.width * activeObject.scaleX) / 2 })
        break
      case 'right':
        activeObject.set({ left: canvas.width - activeObject.width * activeObject.scaleX })
        break
      case 'top':
        activeObject.set({ top: 0 })
        break
      case 'middle':
        activeObject.set({ top: (canvas.height - activeObject.height * activeObject.scaleY) / 2 })
        break
      case 'bottom':
        activeObject.set({ top: canvas.height - activeObject.height * activeObject.scaleY })
        break
    }

    canvas.renderAll()
    saveHistory()
    toast.success('Objeto alinhado')
  }

  /**
   * Update layers list
   */
  const updateLayers = () => {
    if (!canvas) return

    // @ts-ignore - id and grid properties
    const objects = canvas.getObjects().filter((obj: Fabric.Object) => (obj as any).id && !(obj as any).grid)
    const layersList: Layer[] = objects.map((obj: Fabric.Object, index: number) => ({
      // @ts-ignore
      id: (obj as any).id,
      // @ts-ignore
      name: obj.type === 'i-text' ? 'Texto' : obj.type === 'image' ? 'Imagem' : obj.type,
      object: obj,
      visible: obj.visible !== false,
      locked: !obj.selectable,
      order: index
    }))

    setLayers(layersList.reverse())
  }

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (!layer || !canvas) return

    layer.object.set({ visible: !layer.visible })
    canvas.renderAll()
    updateLayers()
  }

  /**
   * Toggle layer lock
   */
  const toggleLayerLock = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (!layer || !canvas) return

    layer.object.set({ selectable: layer.locked, evented: layer.locked })
    canvas.renderAll()
    updateLayers()
  }

  /**
   * Change layer order
   */
  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    const layer = layers.find(l => l.id === layerId)
    if (!layer || !canvas) return

    if (direction === 'up') {
      canvas.bringObjectForward(layer.object)
    } else {
      canvas.sendObjectBackwards(layer.object)
    }

    canvas.renderAll()
    updateLayers()
  }

  /**
   * Export canvas
   */
  const exportCanvas = (format: 'json' | 'png' | 'jpg' = 'png') => {
    if (!canvas) return

    if (format === 'json') {
      // @ts-ignore
      const json = canvas.toJSON(['id'])
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `canvas-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Canvas exportado (JSON)')
    } else {
      // Remove grid before export
      // @ts-ignore
      const gridLines = canvas.getObjects('line').filter((obj: Fabric.Object) => (obj as any).grid)
      gridLines.forEach((line: Fabric.Object) => canvas.remove(line))

      // @ts-ignore
      const dataURL = canvas.toDataURL({
        format: format === 'png' ? 'png' : 'jpeg',
        quality: 1.0
      })

      // Restore grid
      if (showGrid) {
        drawGrid(canvas)
      }

      const link = document.createElement('a')
      link.href = dataURL
      link.download = `canvas-${Date.now()}.${format}`
      link.click()
      toast.success(`Canvas exportado (${format.toUpperCase()})`)
    }

    if (onSave) {
      // @ts-ignore
      onSave(canvas.toJSON(['id']))
    }
  }

  /**
   * Zoom canvas
   */
  const handleZoom = (newZoom: number) => {
    if (!canvas || !containerRef.current) return

    const zoomFactor = newZoom / 100
    canvas.setZoom(zoomFactor)
    canvas.setWidth(width * zoomFactor)
    canvas.setHeight(height * zoomFactor)
    canvas.renderAll()
    setZoom(newZoom)
  }

  /**
   * Generate unique ID
   */
  const generateId = () => `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Toolbar */}
      <div className="w-20 border-r flex flex-col items-center py-4 space-y-2 bg-muted/30">
        <Button
          variant={activeTool === 'select' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setActiveTool('select')}
          title="Selecionar"
        >
          <Move className="h-5 w-5" />
        </Button>
        
        <Button
          variant={activeTool === 'text' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => { setActiveTool('text'); addText() }}
          title="Adicionar Texto"
        >
          <Type className="h-5 w-5" />
        </Button>
        
        <Button
          variant={activeTool === 'image' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => { setActiveTool('image'); addImage() }}
          title="Adicionar Imagem"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>

        <Separator className="my-2" />

        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={historyIndex <= 0}
          title="Desfazer"
        >
          <Undo2 className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="Refazer"
        >
          <Redo2 className="h-5 w-5" />
        </Button>

        <Separator className="my-2" />

        <Button
          variant="ghost"
          size="icon"
          onClick={deleteSelected}
          title="Deletar"
        >
          <Trash2 className="h-5 w-5" />
        </Button>

        <Separator className="my-2" />

        <Button
          variant={showGrid ? 'default' : 'ghost'}
          size="icon"
          onClick={toggleGrid}
          title="Mostrar/Ocultar Grid"
        >
          <Grid3X3 className="h-5 w-5" />
        </Button>

        <Button
          variant={snapToGrid ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setSnapToGrid(!snapToGrid)}
          title="Snap to Grid"
        >
          <Magnet className="h-5 w-5" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Controls */}
        <div className="border-b p-3 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Canvas Editor Professional</Badge>
            <Badge variant="secondary">{width} x {height}</Badge>
          </div>

          {/* Alignment Tools */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => alignObjects('left')} title="Alinhar à Esquerda">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => alignObjects('center')} title="Centralizar Horizontalmente">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => alignObjects('right')} title="Alinhar à Direita">
              <AlignRight className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="ghost" size="icon" onClick={() => alignObjects('top')} title="Alinhar ao Topo">
              <AlignVerticalJustifyStart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => alignObjects('middle')} title="Centralizar Verticalmente">
              <AlignVerticalJustifyCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => alignObjects('bottom')} title="Alinhar à Base">
              <AlignVerticalJustifyEnd className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleZoom(Math.max(25, zoom - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={() => handleZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCanvas('png')}>
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCanvas('json')}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto flex items-center justify-center p-8 bg-muted/10"
          style={{ backgroundColor: '#f5f5f5' }}
        >
          <div className="shadow-2xl">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>

      {/* Layers Panel */}
      <div className="w-80 border-l bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Camadas ({layers.length})
            </h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {layers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma camada ainda
            </p>
          ) : (
            layers.map((layer) => (
              <Card
                key={layer.id}
                className={`cursor-pointer transition-colors ${
                  selectedLayer === layer.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => {
                  canvas?.setActiveObject(layer.object)
                  canvas?.renderAll()
                  setSelectedLayer(layer.id)
                }}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {layer.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveLayer(layer.id, 'up')
                      }}
                      title="Mover para cima"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveLayer(layer.id, 'down')
                      }}
                      title="Mover para baixo"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLayerVisibility(layer.id)
                      }}
                      title="Mostrar/Ocultar"
                    >
                      {layer.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLayerLock(layer.id)
                      }}
                      title="Bloquear/Desbloquear"
                    >
                      {layer.locked ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Unlock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
