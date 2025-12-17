// TODO: Fixar fabric.getInstance() com tipos corretos
'use client'

/**
 * 🎨 Advanced Canvas Editor - Sprint 27
 * Features: Undo/Redo, Layers, Advanced Editing
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
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
  ArrowDown
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

interface CanvasEditorProps {
  width?: number
  height?: number
  initialSlide?: Record<string, unknown>
  onSave?: (data: Record<string, unknown>) => void
}

export default function AdvancedCanvasEditorSprint27({
  width = 1920,
  height = 1080,
  initialSlide,
  onSave
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
        logger.error('Failed to load Fabric.js:', error instanceof Error ? error : new Error(String(error)), { component: 'AdvancedCanvasEditorSprint27' })
        toast.error('Falha ao carregar editor')
      }
    }
    loadFabric()
  }, [])

  /**
   * Initialize canvas
   */
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || canvas || !fabric) return

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    })

    // Events
    newCanvas.on('object:modified', () => {
      saveHistory()
      updateLayers()
    })

    newCanvas.on('object:added', () => {
      updateLayers()
    })

    newCanvas.on('object:removed', () => {
      updateLayers()
    })

    newCanvas.on('selection:created', (e: any) => {
      if (e.selected && e.selected[0]) {
        // @ts-ignore
        setSelectedLayer(e.selected[0].id || null)
      }
    })

    newCanvas.on('selection:updated', (e: any) => {
      if (e.selected && e.selected[0]) {
        // @ts-ignore
        setSelectedLayer(e.selected[0].id || null)
      }
    })

    newCanvas.on('selection:cleared', () => {
      setSelectedLayer(null)
    })

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
  }, [width, height, initialSlide])

  /**
   * Load slide data
   */
  const loadSlideData = (canvas: Fabric.Canvas, slide: Record<string, unknown>) => {
    if (!canvas || !fabric) return

    try {
      // Load background
      if (slide.backgroundImage && typeof slide.backgroundImage === 'string') {
        // @ts-ignore
        fabric.Image.fromURL(slide.backgroundImage, (img: any) => {
          img.scaleToWidth(width)
          img.scaleToHeight(height)
          img.selectable = false
          canvas.add(img)
          canvas.sendObjectToBack(img)
        })
      }

      // Load objects
      if (Array.isArray(slide.elements)) {
        slide.elements.forEach((element: any) => {
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
      logger.error('Error loading slide:', error instanceof Error ? error : new Error(String(error)), { component: 'AdvancedCanvasEditorSprint27' })
      toast.error('Erro ao carregar slide')
    }
  }

  /**
   * Save history for undo/redo
   */
  const saveHistory = useCallback(() => {
    if (!canvas) return

    // @ts-ignore
    const json = JSON.stringify(canvas.toJSON(['id']))
    
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
   * Update layers list
   */
  const updateLayers = useCallback(() => {
    if (!canvas) return

    const objects = canvas.getObjects()
    const newLayers: Layer[] = objects.map((obj: Fabric.Object, index: number) => {
      // Fabric objects may have custom id property
      type ObjectWithId = Fabric.Object & { id?: string };
      const objWithId = obj as ObjectWithId;
      return {
        id: objWithId.id || `layer-${index}`,
        name: obj.type === 'i-text' ? `Texto ${index + 1}` : `${obj.type} ${index + 1}`,
        object: obj,
        visible: obj.visible !== false,
        locked: obj.selectable === false,
        order: index
      };
    })

    setLayers(newLayers)
  }, [canvas])

  /**
   * Add text
   */
  const addText = useCallback(() => {
    if (!canvas || !fabric) return

    const text = new fabric.IText('Novo Texto', {
      left: 100,
      top: 100,
      fontSize: 40,
      fill: '#000000',
      fontFamily: 'Arial',
      id: generateId()
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    saveHistory()
    toast.success('Texto adicionado')
  }, [canvas])

  /**
   * Add image
   */
  const addImage = useCallback(() => {
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
            img.scaleToWidth(400)
            img.set({
              left: 100,
              top: 100,
              // @ts-ignore
              id: generateId()
            })
            canvas.add(img)
            canvas.setActiveObject(img)
            canvas.renderAll()
            saveHistory()
            toast.success('Imagem adicionada')
          })
        }
      }
      reader.readAsDataURL(file)
    }
    
    input.click()
  }, [canvas])

  /**
   * Delete selected
   */
  const deleteSelected = useCallback(() => {
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.remove(activeObject)
      canvas.renderAll()
      saveHistory()
      toast.success('Objeto removido')
    }
  }, [canvas])

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (layer && canvas) {
      layer.object.set('visible', !layer.object.visible)
      canvas.renderAll()
      updateLayers()
    }
  }

  /**
   * Toggle layer lock
   */
  const toggleLayerLock = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (layer && canvas) {
      layer.object.set('selectable', !layer.object.selectable)
      layer.object.set('evented', !layer.object.evented)
      canvas.renderAll()
      updateLayers()
    }
  }

  /**
   * Move layer up
   */
  const moveLayerUp = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (layer && canvas) {
      canvas.bringObjectForward(layer.object)
      canvas.renderAll()
      updateLayers()
    }
  }

  /**
   * Move layer down
   */
  const moveLayerDown = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (layer && canvas) {
      canvas.sendObjectBackwards(layer.object)
      canvas.renderAll()
      updateLayers()
    }
  }

  /**
   * Export canvas
   */
  const exportCanvas = useCallback(() => {
    if (!canvas) return

    const data = {
      // @ts-ignore
      json: canvas.toJSON(['id']),
      // @ts-ignore
      png: canvas.toDataURL({ format: 'png', quality: 1 }),
      svg: canvas.toSVG()
    }

    if (onSave) {
      onSave(data)
    }

    toast.success('Canvas exportado')
  }, [canvas, onSave])

  /**
   * Generate unique ID
   */
  const generateId = () => {
    return `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Toolbar */}
      <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-4">
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
          onClick={() => {
            setActiveTool('text')
            addText()
          }}
          title="Adicionar Texto"
        >
          <Type className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTool === 'image' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => {
            setActiveTool('image')
            addImage()
          }}
          title="Adicionar Imagem"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={deleteSelected}
          title="Deletar"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Desfazer"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Desfazer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Refazer"
          >
            <Redo2 className="h-4 w-4 mr-2" />
            Refazer
          </Button>
          <div className="flex-1" />
          <Button
            variant="default"
            size="sm"
            onClick={exportCanvas}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-700 flex items-center justify-center p-8">
          <div className="shadow-2xl">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>

      {/* Layers Panel */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold flex items-center text-white">
            <Layers className="h-5 w-5 mr-2" />
            Camadas
          </h3>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {layers.slice().reverse().map((layer) => (
            <div
              key={layer.id}
              className={`p-3 rounded-lg border ${
                selectedLayer === layer.id
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 bg-gray-900'
              } hover:border-primary/50 cursor-pointer transition-colors`}
              onClick={() => {
                if (canvas && layer.object.selectable) {
                  canvas.setActiveObject(layer.object)
                  canvas.renderAll()
                  setSelectedLayer(layer.id)
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white truncate flex-1">
                  {layer.name}
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLayerVisibility(layer.id)
                    }}
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLayerLock(layer.id)
                    }}
                  >
                    {layer.locked ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveLayerUp(layer.id)
                    }}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveLayerDown(layer.id)
                    }}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
