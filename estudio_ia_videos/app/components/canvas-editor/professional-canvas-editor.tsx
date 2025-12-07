// TODO: Fixar FabricManager loading/error propriedades
'use client'

/**
 * 🎨 PROFESSIONAL CANVAS EDITOR - Sprint 18
 * Editor de canvas profissional com Fabric.js, timeline e animações
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

// Import dos novos componentes
import { useCanvasCache } from './performance-cache'
import { AdvancedThemeProvider, useTheme, ThemeSelector } from '../ui/advanced-theme-provider'
import { useSmartGuides } from './smart-guides'
import { QuickActionsBar, useQuickActions } from './quick-actions-bar'

// Import do novo sistema Fabric singleton
import { FabricManager, useFabric } from '@/lib/fabric-singleton'
import EmergencyFixManager from '@/lib/emergency-fixes-improved'
import type * as Fabric from 'fabric'

// Fabric.js reference
let fabric: typeof Fabric | null = null
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Play,
  Pause,
  Square,
  RotateCw,
  Move,
  Type,
  Image as ImageIcon,
  Shapes,
  Layers,
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Palette,
  Settings,
  ZoomIn,
  ZoomOut,
  SkipBack,
  SkipForward,
  Volume2
} from 'lucide-react'

interface CanvasObject {
  id: string
  type: 'text' | 'image' | 'shape' | 'video'
  name: string
  visible: boolean
  locked: boolean
  animation?: {
    type: 'fadeIn' | 'slideIn' | 'zoomIn' | 'none'
    duration: number
    delay: number
  }
}

interface TimelineKeyframe {
  id: string
  time: number
  objectId: string
  properties: Record<string, unknown>
}

interface ExportSettings {
  format: 'mp4' | 'webm' | 'gif'
  quality: 'low' | 'medium' | 'high' | 'ultra'
  fps: 24 | 30 | 60
  duration: number
}

// Componente interno para usar os hooks de tema
function CanvasEditorCore() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<Fabric.Canvas | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(10) // segundos
  const [zoom, setZoom] = useState(100)
  const [objects, setObjects] = useState<CanvasObject[]>([])
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<TimelineKeyframe[]>([])
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'mp4',
    quality: 'high',
    fps: 30,
    duration: 10
  })

  // Usar os novos hooks
  const cache = useCanvasCache()
  const smartGuides = useSmartGuides(fabricCanvasRef.current)
  const quickActions = useQuickActions(fabricCanvasRef.current)
  const { colors, actualTheme } = useTheme()
  const { fabric: fabricInstance } = useFabric()
  const fabricLoading = false
  const fabricError = null

  // Atualizar referência global quando Fabric carregar
  useEffect(() => {
    if (fabricInstance) {
      fabric = fabricInstance
      
      // Inicializar sistema de emergência
      const emergencyManager = EmergencyFixManager.getInstance()
      emergencyManager.applyAllFixes()
    }
  }, [fabricInstance])

  // Inicializar Fabric.js Canvas
  useEffect(() => {
    if (fabricInstance && canvasRef.current && !fabricCanvasRef.current && fabric) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff'
      })

      // Event listeners
      canvas.on('selection:created', (e: Fabric.IEvent) => {
        if (e.selected && e.selected.length > 0) {
          // @ts-ignore
          const obj = e.selected[0] as Fabric.Object & { customId?: string }
          setSelectedObject(obj.customId || null)
        }
      })

      canvas.on('selection:cleared', () => {
        setSelectedObject(null)
      })

      fabricCanvasRef.current = canvas

      // Adicionar objetos de exemplo
      addSampleObjects(canvas)
    }

    return () => {
      fabricCanvasRef.current?.dispose()
    }
  }, [fabricInstance])

  const addSampleObjects = (canvas: Fabric.Canvas) => {
    if (!fabric) return
    
    // Texto de exemplo
    const text = new fabric.Text('Estúdio IA de Vídeos', {
      left: 100,
      top: 100,
      fontSize: 48,
      fontFamily: 'Arial',
      fill: '#333333'
    })
    // @ts-ignore
    text.customId = 'text-1'
    canvas.add(text)

    // Retângulo de exemplo
    const rect = new fabric.Rect({
      left: 100,
      top: 200,
      width: 200,
      height: 100,
      fill: '#4F46E5',
      rx: 10,
      ry: 10
    })
    // @ts-ignore
    rect.customId = 'rect-1'
    canvas.add(rect)

    // Círculo de exemplo
    const circle = new fabric.Circle({
      left: 400,
      top: 200,
      radius: 50,
      fill: '#EF4444'
    })
    // @ts-ignore
    circle.customId = 'circle-1'
    canvas.add(circle)

    // Atualizar lista de objetos
    setObjects([
      {
        id: 'text-1',
        type: 'text',
        name: 'Título Principal',
        visible: true,
        locked: false,
        animation: { type: 'fadeIn', duration: 1, delay: 0 }
      },
      {
        id: 'rect-1',
        type: 'shape',
        name: 'Retângulo Azul',
        visible: true,
        locked: false,
        animation: { type: 'slideIn', duration: 0.8, delay: 0.5 }
      },
      {
        id: 'circle-1',
        type: 'shape',
        name: 'Círculo Vermelho',
        visible: true,
        locked: false,
        animation: { type: 'zoomIn', duration: 0.6, delay: 1 }
      }
    ])
  }

  // Controles de reprodução
  const handlePlay = () => {
    setIsPlaying(true)
    toast.success('Iniciando reprodução da timeline')
    // Implementar lógica de reprodução
  }

  const handlePause = () => {
    setIsPlaying(false)
    toast('Reprodução pausada')
  }

  const handleStop = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    toast('Reprodução parada')
  }

  // Ferramentas de edição
  const addText = () => {
    if (!fabricCanvasRef.current || !fabric) return

    const text = new fabric.Text('Novo Texto', {
      left: 200,
      top: 200,
      fontSize: 32,
      fontFamily: 'Arial',
      fill: '#000000'
    })
    
    const id = `text-${Date.now()}`
    // @ts-ignore
    text.customId = id
    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)

    setObjects(prev => [...prev, {
      id,
      type: 'text',
      name: 'Novo Texto',
      visible: true,
      locked: false
    }])

    toast.success('Texto adicionado')
  }

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !fabricCanvasRef.current || !fabric) return

      const reader = new FileReader()
      reader.onload = (event) => {
        fabric.Image.fromURL(event.target?.result as string, (img: Fabric.Image) => {
          img.scaleToWidth(300)
          const id = `image-${Date.now()}`
          // @ts-ignore
          img.customId = id
          img.set({
            left: 100,
            top: 100
          })
          
          fabricCanvasRef.current?.add(img)
          fabricCanvasRef.current?.setActiveObject(img)
          
          setObjects(prev => [...prev, {
            id,
            type: 'image',
            name: file.name,
            visible: true,
            locked: false
          }])
          
          toast.success('Imagem adicionada')
        })
      }
      reader.readAsDataURL(file)
    }
    
    input.click()
  }

  const addShape = (type: 'rectangle' | 'circle' | 'triangle') => {
    if (!fabricCanvasRef.current || !fabric) return

    let shape: Fabric.Object
    const id = `${type}-${Date.now()}`

    switch (type) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: 200,
          top: 200,
          width: 150,
          height: 100,
          fill: '#4F46E5'
        })
        break
      case 'circle':
        shape = new fabric.Circle({
          left: 200,
          top: 200,
          radius: 75,
          fill: '#10B981'
        })
        break
      case 'triangle':
        shape = new fabric.Triangle({
          left: 200,
          top: 200,
          width: 150,
          height: 130,
          fill: '#F59E0B'
        })
        break
    }

    // @ts-ignore
    shape.customId = id
    fabricCanvasRef.current.add(shape)
    fabricCanvasRef.current.setActiveObject(shape)

    setObjects(prev => [...prev, {
      id,
      type: 'shape',
      name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      visible: true,
      locked: false
    }])

    toast.success(`${type} adicionado`)
  }

  // Controles de zoom
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 25, 500)
    setZoom(newZoom)
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(newZoom / 100)
      fabricCanvasRef.current.renderAll()
    }
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 25, 25)
    setZoom(newZoom)
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(newZoom / 100)
      fabricCanvasRef.current.renderAll()
    }
  }

  // Controles de objeto
  const toggleObjectVisibility = (objectId: string) => {
    setObjects(prev => prev.map(obj => 
      obj.id === objectId ? { ...obj, visible: !obj.visible } : obj
    ))
    
    if (fabricCanvasRef.current) {
      // @ts-ignore
      const obj = fabricCanvasRef.current.getObjects().find((o: Fabric.Object & { customId?: string }) => o.customId === objectId)
      if (obj) {
        obj.visible = !obj.visible
        fabricCanvasRef.current.renderAll()
      }
    }
  }

  const toggleObjectLock = (objectId: string) => {
    setObjects(prev => prev.map(obj => 
      obj.id === objectId ? { ...obj, locked: !obj.locked } : obj
    ))
    
    if (fabricCanvasRef.current) {
      // @ts-ignore
      const obj = fabricCanvasRef.current.getObjects().find((o: Fabric.Object & { customId?: string }) => o.customId === objectId)
      if (obj) {
        const isCurrentlyLocked = obj.selectable === false
        obj.selectable = isCurrentlyLocked
        obj.evented = isCurrentlyLocked
        fabricCanvasRef.current.renderAll()
      }
    }
  }

  const deleteObject = (objectId: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== objectId))
    
    if (fabricCanvasRef.current) {
      // @ts-ignore
      const obj = fabricCanvasRef.current.getObjects().find((o: Fabric.Object & { customId?: string }) => o.customId === objectId)
      if (obj) {
        fabricCanvasRef.current.remove(obj)
      }
    }
    
    toast.success('Objeto removido')
  }

  // Export
  const handleExport = async () => {
    if (!fabricCanvasRef.current) return
    
    toast.loading('Exportando vídeo...')
    
    try {
      // Simular processo de export
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      })
      
      const link = document.createElement('a')
      link.download = 'estudio-ia-video.png'
      link.href = dataURL
      link.click()
      
      toast.success('Vídeo exportado com sucesso!')
    } catch (error: unknown) {
      console.error(error)
      toast.error('Erro ao exportar vídeo')
    }
  }

  // Loading state
  if (fabricLoading || !fabricInstance) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Carregando Editor Canvas...</h2>
          <p className="text-muted-foreground">Inicializando ferramentas profissionais</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="h-screen flex flex-col"
      style={{ 
        backgroundColor: colors.background,
        color: colors.text 
      }}
    >
      {/* Smart Guides - Componente invisible mas funcional */}
      {smartGuides.component}
      
      {/* Quick Actions Bar - Posicionada no topo centro */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <QuickActionsBar {...quickActions} />
      </div>

      {/* Toolbar Superior */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ 
          backgroundColor: colors.toolbar,
          borderColor: colors.border 
        }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Canvas Editor Pro</h1>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePlay} disabled={isPlaying}>
              <Play className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handlePause} disabled={!isPlaying}>
              <Pause className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleStop}>
              <Square className="h-4 w-4" />
            </Button>
            
            <div className="mx-4 text-sm text-muted-foreground">
              {Math.floor(currentTime)}s / {totalDuration}s
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <ThemeSelector />
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center">{zoom}%</span>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button size="sm" onClick={handleExport} className="ml-4">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Painel Lateral Esquerdo */}
        <div 
          className="w-80 border-r"
          style={{ 
            backgroundColor: colors.sidebar,
            borderColor: colors.border 
          }}
        >
          <Tabs defaultValue="tools" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools" onClick={() => console.log('Ferramentas tab clicked')}>
                Ferramentas
              </TabsTrigger>
              <TabsTrigger value="layers" onClick={() => console.log('Camadas tab clicked')}>
                Camadas
              </TabsTrigger>
              <TabsTrigger value="assets" onClick={() => console.log('Assets tab clicked')}>
                Assets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={addText} className="h-20 flex flex-col">
                  <Type className="h-6 w-6 mb-1" />
                  Texto
                </Button>
                <Button variant="outline" onClick={addImage} className="h-20 flex flex-col">
                  <ImageIcon className="h-6 w-6 mb-1" />
                  Imagem
                </Button>
                <Button variant="outline" onClick={() => addShape('rectangle')} className="h-20 flex flex-col">
                  <Shapes className="h-6 w-6 mb-1" />
                  Retângulo
                </Button>
                <Button variant="outline" onClick={() => addShape('circle')} className="h-20 flex flex-col">
                  <Shapes className="h-6 w-6 mb-1" />
                  Círculo
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cor de Fundo</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 bg-white border rounded"></div>
                    <Input type="color" defaultValue="#ffffff" className="w-16 h-8" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layers" className="p-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {objects.map((obj) => (
                    <div
                      key={obj.id}
                      className={`flex items-center gap-2 p-2 rounded border ${
                        selectedObject === obj.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleObjectVisibility(obj.id)}
                        className="w-8 h-8 p-0"
                      >
                        {obj.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleObjectLock(obj.id)}
                        className="w-8 h-8 p-0"
                      >
                        {obj.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="font-medium text-sm">{obj.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {obj.type}
                        </Badge>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteObject(obj.id)}
                        className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="assets" className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Templates NR</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 rounded p-2 cursor-pointer hover:opacity-80">
                      <div className="text-white text-xs">NR-12</div>
                    </div>
                    <div className="aspect-video bg-gradient-to-br from-green-400 to-green-600 rounded p-2 cursor-pointer hover:opacity-80">
                      <div className="text-white text-xs">NR-33</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Ícones</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200">
                        <Settings className="h-6 w-6 text-gray-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Área do Canvas */}
        {/* Área Central - Canvas */}
        <div 
          className="flex-1 flex flex-col"
          style={{ backgroundColor: colors.canvas }}
        >
          <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="border"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: `scale(${Math.min(1, zoom / 100)})`
                }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="h-48 bg-gray-900 text-white p-4">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="font-medium">Timeline</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary">
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Volume2 className="h-4 w-4 ml-4" />
                <Slider
                  value={[75]}
                  max={100}
                  step={1}
                  className="w-20"
                />
              </div>
            </div>

            <div className="relative">
              {/* Timeline ruler */}
              <div className="flex border-b border-gray-700 pb-2 mb-2">
                {[...Array(Math.ceil(totalDuration))].map((_, i) => (
                  <div key={i} className="flex-1 text-xs text-gray-400">
                    {i}s
                  </div>
                ))}
              </div>

              {/* Timeline tracks */}
              <div className="space-y-2">
                {objects.map((obj) => (
                  <div key={obj.id} className="flex items-center">
                    <div className="w-24 text-xs truncate">{obj.name}</div>
                    <div className="flex-1 h-8 bg-gray-800 rounded relative">
                      {obj.animation && (
                        <div
                          className="absolute h-full bg-blue-500 rounded opacity-80"
                          style={{
                            left: `${(obj.animation.delay / totalDuration) * 100}%`,
                            width: `${(obj.animation.duration / totalDuration) * 100}%`
                          }}
                        >
                          <div className="p-1 text-xs">{obj.animation.type}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Playhead */}
              <div 
                className="absolute top-0 w-0.5 bg-red-500 h-full pointer-events-none"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Painel Lateral Direito */}
        <div 
          className="w-80 border-l"
          style={{ 
            backgroundColor: colors.sidebar,
            borderColor: colors.border 
          }}
        >
          <div className="p-4">
            <h3 className="font-medium mb-4">Propriedades</h3>
            
            {selectedObject ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input className="mt-1" defaultValue="Objeto Selecionado" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">X</label>
                    <Input type="number" className="mt-1" defaultValue="100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Y</label>
                    <Input type="number" className="mt-1" defaultValue="100" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Largura</label>
                    <Input type="number" className="mt-1" defaultValue="200" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Altura</label>
                    <Input type="number" className="mt-1" defaultValue="100" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Opacidade</label>
                  <Slider
                    defaultValue={[100]}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Animação</label>
                  <select className="mt-1 w-full p-2 border rounded">
                    <option value="none">Nenhuma</option>
                    <option value="fadeIn">Fade In</option>
                    <option value="slideIn">Slide In</option>
                    <option value="zoomIn">Zoom In</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Selecione um objeto para editar suas propriedades
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal com wrapper do tema
export default function ProfessionalCanvasEditor() {
  return (
    <AdvancedThemeProvider>
      <CanvasEditorCore />
    </AdvancedThemeProvider>
  )
}
