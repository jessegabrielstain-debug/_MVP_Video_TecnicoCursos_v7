
'use client'

/**
 * 🎨 Canvas Editor - SSR Fixed
 * Sprint 29 - Production Ready Canvas Editor
 * Features: SSR/hydration safe, mobile gestures, performance optimized
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ZoomIn,
  ZoomOut,
  Save,
  Upload,
  Smartphone
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Fabric.js - dynamic import for SSR safety
let fabric: any = null

interface Layer {
  id: string
  name: string
  object: any
  visible: boolean
  locked: boolean
  order: number
}

interface CanvasEditorProps {
  width?: number
  height?: number
  initialData?: any
  onSave?: (data: any) => void
  enableMobileGestures?: boolean
}

export default function CanvasEditorSSRFixed({
  width = 1920,
  height = 1080,
  initialData,
  onSave,
  enableMobileGestures = true
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvas, setCanvas] = useState<unknown>(null)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // History for undo/redo
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Layers
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  
  // Tools
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image' | 'shape'>('select')
  
  // Grid and Snap
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  
  // Zoom
  const [zoom, setZoom] = useState(100)
  
  // Mobile gesture tracking
  const touchStartRef = useRef<{ x: number; y: number; distance: number } | null>(null)

  /**
   * SSR SAFETY: Initialize client-side only
   */
  useEffect(() => {
    setIsClient(true)
    setIsMobile(window.innerWidth < 768)
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /**
   * Initialize Fabric.js only on client
   */
  useEffect(() => {
    if (!isClient) return

    const loadFabric = async () => {
      try {
        if (!fabric) {
          // ✅ CORRIGIDO: Usa FabricManager singleton
          const { default: FabricManager } = await import('@/lib/fabric-singleton')
          fabric = await FabricManager.getInstance()
        }
        initializeCanvas()
      } catch (error) {
        console.error('Failed to load Fabric.js:', error)
        toast.error('Falha ao carregar editor')
        setIsLoading(false)
      }
    }

    loadFabric()

    return () => {
      if (canvas) {
        canvas.dispose()
      }
    }
  }, [isClient])

  /**
   * Initialize canvas with grid and snap
   */
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || canvas || !fabric) return

    try {
      const newCanvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true
      })

      // Enable snap to grid
      newCanvas.on('object:moving', (e: any) => {
        if (snapToGrid) {
          const obj = e.target
          obj.set({
            left: Math.round(obj.left / gridSize) * gridSize,
            top: Math.round(obj.top / gridSize) * gridSize
          })
        }
      })

      // Track modifications for history
      newCanvas.on('object:modified', () => {
        saveHistory(newCanvas)
        updateLayers(newCanvas)
      })

      newCanvas.on('object:added', () => {
        updateLayers(newCanvas)
        saveHistory(newCanvas)
      })

      newCanvas.on('object:removed', () => {
        updateLayers(newCanvas)
        saveHistory(newCanvas)
      })

      newCanvas.on('selection:created', (e: any) => {
        if (e.selected && e.selected[0]) {
          setSelectedLayer(e.selected[0].id || null)
        }
      })

      newCanvas.on('selection:updated', (e: any) => {
        if (e.selected && e.selected[0]) {
          setSelectedLayer(e.selected[0].id || null)
        }
      })

      newCanvas.on('selection:cleared', () => {
        setSelectedLayer(null)
      })

      // Mobile gestures
      if (enableMobileGestures && isMobile) {
        setupMobileGestures(newCanvas)
      }

      // Load initial data
      if (initialData) {
        loadCanvasData(newCanvas, initialData)
      }

      // Draw grid
      if (showGrid) {
        drawGrid(newCanvas)
      }

      setCanvas(newCanvas)
      setIsLoading(false)
      toast.success('Editor carregado com sucesso!')
    } catch (error) {
      console.error('Canvas initialization error:', error)
      toast.error('Erro ao inicializar editor')
      setIsLoading(false)
    }
  }, [width, height, snapToGrid, gridSize, showGrid, enableMobileGestures, isMobile, initialData])

  /**
   * Setup mobile gestures (pinch zoom, pan, rotate)
   */
  const setupMobileGestures = (canvas: any) => {
    const canvasEl = canvas.upperCanvasEl

    // Touch start
    canvasEl.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        touchStartRef.current = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
          distance
        }
      }
    })

    // Touch move - pinch zoom
    canvasEl.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartRef.current) {
        e.preventDefault()
        
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        
        const scale = currentDistance / touchStartRef.current.distance
        const newZoom = Math.max(10, Math.min(500, zoom * scale))
        
        setZoom(Math.round(newZoom))
        canvas.setZoom(newZoom / 100)
        canvas.renderAll()
        
        touchStartRef.current.distance = currentDistance
      }
    })

    // Touch end
    canvasEl.addEventListener('touchend', () => {
      touchStartRef.current = null
    })

    toast.success('Gestos mobile ativados!')
  }

  /**
   * Draw grid on canvas
   */
  const drawGrid = (canvas: any) => {
    if (!fabric) return

    const gridLines: any[] = []

    // Vertical lines
    for (let i = 0; i < width / gridSize; i++) {
      const line = new fabric.Line([i * gridSize, 0, i * gridSize, height], {
        stroke: '#e0e0e0',
        selectable: false,
        evented: false,
        excludeFromExport: true
      })
      gridLines.push(line)
    }

    // Horizontal lines
    for (let i = 0; i < height / gridSize; i++) {
      const line = new fabric.Line([0, i * gridSize, width, i * gridSize], {
        stroke: '#e0e0e0',
        selectable: false,
        evented: false,
        excludeFromExport: true
      })
      gridLines.push(line)
    }

    gridLines.forEach(line => canvas.add(line))
    canvas.sendToBack(...gridLines)
  }

  /**
   * Save history state
   */
  const saveHistory = (canvas: any) => {
    if (!canvas) return

    const json = JSON.stringify(canvas.toJSON())
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(json)
    
    // Keep last 50 states
    if (newHistory.length > 50) {
      newHistory.shift()
    }
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  /**
   * Update layers list
   */
  const updateLayers = (canvas: any) => {
    if (!canvas) return

    const objects = canvas.getObjects().filter((obj: any) => !obj.excludeFromExport)
    const newLayers: Layer[] = objects.map((obj: any, index: number) => ({
      id: obj.id || `layer-${index}`,
      name: obj.type || 'Object',
      object: obj,
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      order: index
    }))

    setLayers(newLayers)
  }

  /**
   * Load canvas data
   */
  const loadCanvasData = (canvas: any, data: any) => {
    if (!canvas) return

    try {
      canvas.loadFromJSON(data, () => {
        canvas.renderAll()
        updateLayers(canvas)
        saveHistory(canvas)
        toast.success('Dados carregados!')
      })
    } catch (error) {
      console.error('Load data error:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  /**
   * Undo
   */
  const handleUndo = () => {
    if (!canvas || historyIndex <= 0) return

    const newIndex = historyIndex - 1
    const json = history[newIndex]
    
    canvas.loadFromJSON(json, () => {
      canvas.renderAll()
      updateLayers(canvas)
      setHistoryIndex(newIndex)
    })
  }

  /**
   * Redo
   */
  const handleRedo = () => {
    if (!canvas || historyIndex >= history.length - 1) return

    const newIndex = historyIndex + 1
    const json = history[newIndex]
    
    canvas.loadFromJSON(json, () => {
      canvas.renderAll()
      updateLayers(canvas)
      setHistoryIndex(newIndex)
    })
  }

  /**
   * Add text
   */
  const handleAddText = () => {
    if (!canvas || !fabric) return

    const text = new fabric.IText('Clique para editar', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 32,
      fill: '#000000'
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    toast.success('Texto adicionado!')
  }

  /**
   * Add rectangle
   */
  const handleAddRectangle = () => {
    if (!canvas || !fabric) return

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      fill: '#3b82f6',
      rx: 10,
      ry: 10
    })

    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
    toast.success('Retângulo adicionado!')
  }

  /**
   * Add circle
   */
  const handleAddCircle = () => {
    if (!canvas || !fabric) return

    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: '#10b981'
    })

    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
    toast.success('Círculo adicionado!')
  }

  /**
   * Delete selected
   */
  const handleDelete = () => {
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.remove(activeObject)
      canvas.renderAll()
      toast.success('Objeto removido!')
    }
  }

  /**
   * Toggle grid
   */
  const handleToggleGrid = () => {
    setShowGrid(!showGrid)
    
    if (!canvas) return
    
    const objects = canvas.getObjects()
    objects.forEach((obj: any) => {
      if (obj.excludeFromExport) {
        canvas.remove(obj)
      }
    })
    
    if (!showGrid) {
      drawGrid(canvas)
    }
    
    canvas.renderAll()
  }

  /**
   * Zoom controls
   */
  const handleZoomIn = () => {
    const newZoom = Math.min(500, zoom + 10)
    setZoom(newZoom)
    if (canvas) {
      canvas.setZoom(newZoom / 100)
      canvas.renderAll()
    }
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(10, zoom - 10)
    setZoom(newZoom)
    if (canvas) {
      canvas.setZoom(newZoom / 100)
      canvas.renderAll()
    }
  }

  /**
   * Export canvas
   */
  const handleExport = () => {
    if (!canvas) return

    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      })

      const link = document.createElement('a')
      link.download = `canvas-export-${Date.now()}.png`
      link.href = dataURL
      link.click()

      toast.success('Canvas exportado!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erro ao exportar')
    }
  }

  /**
   * Save canvas data
   */
  const handleSave = () => {
    if (!canvas) return

    try {
      const data = canvas.toJSON()
      onSave?.(data)
      toast.success('Canvas salvo!')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Erro ao salvar')
    }
  }

  /**
   * SSR SAFETY: Render nothing on server
   */
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Toolbar */}
      <Card className="lg:w-64 flex-shrink-0">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Ferramentas
            {isMobile && (
              <Badge variant="secondary" className="ml-auto">
                <Smartphone className="w-3 h-3 mr-1" />
                Mobile
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="flex-1"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="flex-1"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddText}
              className="w-full"
            >
              <Type className="w-4 h-4 mr-2" />
              Adicionar Texto
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRectangle}
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Adicionar Retângulo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCircle}
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Adicionar Círculo
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Selecionado
            </Button>
          </div>

          <Separator />

          {/* Grid controls */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Grade e Alinhamento</Label>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Mostrar Grade</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleGrid}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Snap to Grid</span>
              <Button
                variant={snapToGrid ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSnapToGrid(!snapToGrid)}
              >
                <Magnet className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Zoom */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Zoom: {zoom}%</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="flex-1"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="flex-1"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Export/Save */}
          <div className="space-y-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PNG
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Canvas Container */}
      <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Inicializando canvas...</p>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center overflow-auto"
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Layers Panel */}
      <Card className="lg:w-64 flex-shrink-0">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Camadas ({layers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {layers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma camada adicionada
            </p>
          ) : (
            layers.map((layer) => (
              <div
                key={layer.id}
                className={`flex items-center gap-2 p-2 rounded border ${
                  selectedLayer === layer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="text-sm flex-1 truncate">{layer.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    layer.object.set('visible', !layer.visible)
                    canvas?.renderAll()
                    updateLayers(canvas)
                  }}
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
