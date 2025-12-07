// TODO: Fixar CanvasData e FabricCanvas tipos

'use client'

/**
 * 🚀 Canvas Editor Professional V3 - World-Class Implementation
 * Complete integration of performance engine, modern UI, and smart guides
 * Sprint 22 - Canvas Editor Pro Melhorias Críticas
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'react-hot-toast'

// Import our new components
import CanvasEngine from './core/canvas-engine'
import { usePerformanceMonitor, usePerformanceAlerts } from './core/performance-monitor'
import { useCanvasCache } from './core/cache-manager'
import { CanvasThemeProvider, useCanvasTheme, ThemeUtils } from './ui/theme-provider'
import QuickActionsBar from './ui/quick-actions-bar'
import SmartGuides from './ui/smart-guides'

import {
  Palette,
  Layers,
  Settings,
  Zap,
  Monitor,
  Cpu,
  HardDrive,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  Image as ImageIcon,
  Type,
  Square,
  Circle,
  Download,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface FabricObject {
  id?: string
  type?: string
  name?: string
  visible?: boolean
  lockMovementX?: boolean
  lockMovementY?: boolean
  opacity?: number
  zIndex?: number
  toObject: () => Record<string, unknown>
  set: (key: string, value: unknown) => void
  [key: string]: unknown
}

interface FabricEvent {
  selected?: FabricObject[]
  target?: FabricObject
  [key: string]: unknown
}

interface FabricCanvas {
  on: (event: string, handler: (e: FabricEvent) => void) => void
  off: (event: string, handler?: (e: FabricEvent) => void) => void
  getObjects: () => FabricObject[]
  getWidth: () => number
  getHeight: () => number
  getZoom: () => number
  backgroundColor?: string | unknown
  add: (object: FabricObject) => void
  setActiveObject: (object: FabricObject) => void
  getActiveObject: () => FabricObject | null
  renderAll: () => void
  toJSON: () => Record<string, unknown>
  [key: string]: unknown
}

interface CanvasData {
  objects: Array<{
    id: string
    type: string
    properties: Record<string, unknown>
    visible: boolean
    locked: boolean
  }>
  dimensions: { width: number; height: number }
  backgroundColor: string | unknown
  zoom: number
  timestamp: number
}

interface CanvasObject {
  id: string
  type: 'text' | 'image' | 'shape' | 'group'
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  layer: number
  data?: FabricObject
}

interface ProfessionalCanvasEditorProps {
  width?: number
  height?: number
  backgroundColor?: string
  onExportTimeline?: (timeline: CanvasData) => void
  onSceneUpdate?: (sceneData: CanvasData) => void
  initialObjects?: CanvasObject[]
}

function ProfessionalCanvasEditorCore({
  width = 1920,
  height = 1080,
  backgroundColor = '#ffffff',
  onExportTimeline,
  onSceneUpdate,
  initialObjects = []
}: ProfessionalCanvasEditorProps) {
  const { theme } = useCanvasTheme()
  
  // Canvas state
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null)
  const [selectedObjects, setSelectedObjects] = useState<CanvasObject[]>([])
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>(initialObjects)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Performance monitoring
  const { startMonitoring, getMetrics } = usePerformanceMonitor()
  const metrics = getMetrics()
  const alerts = usePerformanceAlerts(metrics)
  
  // Cache management
  const { getCacheStats } = useCanvasCache()
  const cacheStats = getCacheStats()
  
  // UI state
  const [activeTab, setActiveTab] = useState('canvas')
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)
  const [guideOptions, setGuideOptions] = useState({
    snapToGrid: true,
    snapToObjects: true,
    showGrid: true,
    showRulers: true,
    gridSize: 20,
    snapDistance: 10,
    showMeasurements: true
  })

  // Canvas ready handler
  const handleCanvasReady = useCallback((fabricCanvas: FabricCanvas) => {
    setCanvas(fabricCanvas)
    startMonitoring(fabricCanvas)
    
    // Setup canvas event listeners
    fabricCanvas.on('selection:created', (e: FabricEvent) => {
      updateSelectedObjects(e.selected || [])
    })
    
    fabricCanvas.on('selection:updated', (e: FabricEvent) => {
      updateSelectedObjects(e.selected || [])
    })
    
    fabricCanvas.on('selection:cleared', () => {
      setSelectedObjects([])
    })
    
    fabricCanvas.on('object:modified', (e: FabricEvent) => {
      const data = getCanvasData()
      if (data) onSceneUpdate?.(data)
    })
    
    // Zoom tracking
    fabricCanvas.on('mouse:wheel', () => {
      setZoomLevel(Math.round(fabricCanvas.getZoom() * 100))
    })
    
    toast.success('Canvas Editor Pro iniciado', { 
      icon: '🚀',
      duration: 3000 
    })
  }, [startMonitoring, onSceneUpdate])

  // Update selected objects
  const updateSelectedObjects = useCallback((fabricObjects: FabricObject[]) => {
    const objects = fabricObjects.map(obj => ({
      id: obj.id || `obj_${Date.now()}`,
      type: (obj.type as 'text' | 'image' | 'shape' | 'group') || 'shape',
      name: obj.name || `${obj.type} ${obj.id}`,
      visible: obj.visible !== false,
      locked: obj.lockMovementX || obj.lockMovementY || false,
      opacity: obj.opacity || 1,
      layer: obj.zIndex || 0,
      data: obj
    }))
    setSelectedObjects(objects)
  }, [])

  // Get canvas data for export
  const getCanvasData = useCallback((): CanvasData | null => {
    if (!canvas) return null
    
    return {
      objects: canvas.getObjects().map((obj: FabricObject) => ({
        id: obj.id || '',
        type: obj.type || 'unknown',
        properties: obj.toObject(),
        visible: obj.visible || true,
        locked: !!(obj.lockMovementX || obj.lockMovementY)
      })),
      dimensions: { width: canvas.getWidth(), height: canvas.getHeight() },
      backgroundColor: canvas.backgroundColor,
      zoom: canvas.getZoom(),
      timestamp: Date.now()
    }
  }, [canvas])

  // Quick actions handler
  const handleQuickAction = useCallback((actionId: string, params?: unknown) => {
    if (!canvas) return
    
    switch (actionId) {
      case 'add-text':
        const text = new ((window as Window & { fabric?: unknown }).fabric as any).Textbox('Click to edit', {
          left: 100,
          top: 100,
          fontFamily: 'Arial',
          fontSize: 24,
          fill: theme.colors.text
        }) as any
        text.id = `text_${Date.now()}`
        canvas.add(text)
        canvas.setActiveObject(text)
        break
        
      case 'add-rectangle':
        const rect = new ((window as Window & { fabric?: unknown }).fabric as any).Rect({
          left: 100,
          top: 100,
          width: 200,
          height: 100,
          fill: theme.colors.accent,
          stroke: theme.colors.border,
          strokeWidth: 2
        }) as any
        rect.id = `rect_${Date.now()}`
        canvas.add(rect)
        canvas.setActiveObject(rect)
        break
        
      case 'add-circle':
        const circle = new ((window as Window & { fabric?: unknown }).fabric as any).Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: theme.colors.accent,
          stroke: theme.colors.border,
          strokeWidth: 2
        }) as any
        circle.id = `circle_${Date.now()}`
        canvas.add(circle)
        canvas.setActiveObject(circle)
        break
        
      case 'export':
        const data = getCanvasData()
        if (data) {
          onExportTimeline?.(data)
          toast.success('Canvas exportado para timeline!')
        }
        break
        
      case 'save':
        const saveData = canvas.toJSON()
        localStorage.setItem('canvas-save', JSON.stringify(saveData))
        toast.success('Canvas salvo!')
        break
        
      case 'preview':
        setIsPlaying(!isPlaying)
        toast.success(isPlaying ? 'Preview pausado' : 'Preview iniciado')
        break
        
      case 'toggle-grid':
        setGuideOptions(prev => ({ ...prev, showGrid: params as boolean }))
        break
        
      case 'toggle-rulers':
        setGuideOptions(prev => ({ ...prev, showRulers: params as boolean }))
        break
        
      default:
        console.log('Action not handled:', actionId, params)
    }
    
    canvas.renderAll()
  }, [canvas, theme.colors, getCanvasData, onExportTimeline, isPlaying])

  // Performance optimization based on alerts
  useEffect(() => {
    if (alerts.length > 0) {
      const criticalAlerts = alerts.filter(alert => 
        alert.includes('Low FPS') || alert.includes('High memory')
      )
      
      if (criticalAlerts.length > 0) {
        setShowPerformancePanel(true)
        toast.error(`Performance Alert: ${criticalAlerts[0]}`, {
          duration: 5000,
          icon: '⚠️'
        })
      }
    }
  }, [alerts])

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Quick Actions Bar */}
      <QuickActionsBar
        canvas={canvas}
        onAction={handleQuickAction}
        selectedObjects={selectedObjects}
        canUndo={canUndo}
        canRedo={canRedo}
        zoomLevel={zoomLevel}
      />

      <div className="flex-1 flex overflow-hidden mt-16">
        {/* Left Sidebar - Tools & Properties */}
        <div 
          className="w-80 border-r bg-white/95 backdrop-blur-sm overflow-y-auto"
          style={{ 
            backgroundColor: theme.colors.sidebar,
            borderColor: theme.colors.border 
          }}
        >
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value)
            if (value === 'layers') {
              toast.success('🔧 Gerenciador de camadas ativo!')
            } else if (value === 'canvas') {
              toast.success('🎨 Ferramentas do canvas ativas!')
            } else if (value === 'assets') {
              toast.success('📁 Biblioteca de assets ativa!')
            } else if (value === 'perf') {
              toast.success('📊 Monitor de performance ativo!')
            }
          }}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="layers">Camadas</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="perf">Perf</TabsTrigger>
            </TabsList>
            
            {/* Canvas Tools */}
            <TabsContent value="canvas" className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Ferramentas de Desenho
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction('add-text')}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Adicionar Texto
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction('add-rectangle')}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Retângulo
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction('add-circle')}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Círculo
                  </Button>
                </CardContent>
              </Card>
              
              {/* Canvas Settings */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Tamanho da Grade</Label>
                    <Slider
                      value={[guideOptions.gridSize]}
                      onValueChange={([value]) => 
                        setGuideOptions(prev => ({ ...prev, gridSize: value }))
                      }
                      min={10}
                      max={100}
                      step={5}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Distância de Snap</Label>
                    <Slider
                      value={[guideOptions.snapDistance]}
                      onValueChange={([value]) => 
                        setGuideOptions(prev => ({ ...prev, snapDistance: value }))
                      }
                      min={5}
                      max={50}
                      step={5}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layers Panel */}
            <TabsContent value="layers" className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Objetos ({canvasObjects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {canvasObjects.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum objeto no canvas</p>
                      <p className="text-xs">Use as ferramentas para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {canvasObjects.map((obj, index) => (
                        <div
                          key={obj.id}
                          className={`p-2 rounded border text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            selectedObjects.some(s => s.id === obj.id) 
                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                          onClick={() => {
                            if (canvas && obj.data) {
                              canvas.setActiveObject(obj.data)
                              canvas.renderAll()
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {obj.type === 'text' && <Type className="h-3 w-3" />}
                              {obj.type === 'image' && <ImageIcon className="h-3 w-3" />}
                              {obj.type === 'shape' && <Square className="h-3 w-3" />}
                              <span className="truncate">{obj.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(obj.opacity * 100)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Selection Properties */}
              {selectedObjects.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Propriedades ({selectedObjects.length} selecionado)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Opacidade</Label>
                      <Slider
                        value={[selectedObjects[0]?.opacity * 100 || 100]}
                        onValueChange={([value]) => {
                          if (canvas) {
                            const activeObj = canvas.getActiveObject()
                            if (activeObj) {
                              activeObj.set('opacity', value / 100)
                              canvas.renderAll()
                            }
                          }
                        }}
                        min={0}
                        max={100}
                        step={5}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Assets Panel */}
            <TabsContent value="assets" className="p-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Biblioteca de Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Assets em desenvolvimento</p>
                    <p className="text-xs">Integração com APIs externas</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Panel */}
            <TabsContent value="perf" className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Performance Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>FPS: {metrics.fps.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-3 w-3 text-blue-500" />
                      <span>Render: {metrics.renderTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3 w-3 text-purple-500" />
                      <span>Mem: {metrics.memoryUsage.toFixed(1)}MB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-3 w-3 text-orange-500" />
                      <span>Obj: {metrics.objectCount}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Cache Hit Rate</span>
                      <span>{cacheStats.hits > 0 
                        ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)
                        : 0}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Cache Size</span>
                      <span>{(cacheStats.totalSize / 1024 / 1024).toFixed(1)}MB</span>
                    </div>
                  </div>
                  
                  {alerts.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        {alerts.map((alert, index) => (
                          <Alert key={index} className="py-2">
                            <AlertTriangle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              {alert}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
          {/* Canvas Container */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative">
              <CanvasEngine
                width={width}
                height={height}
                backgroundColor={backgroundColor}
                onCanvasReady={handleCanvasReady}
                enableGPUAcceleration={true}
              />
              
              {/* Smart Guides Overlay */}
              <SmartGuides
                canvas={canvas as any}
                options={guideOptions}
                onOptionsChange={setGuideOptions}
              />
            </div>
          </div>

          {/* Canvas Info Overlay */}
          <div className="absolute bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono">
            <div>Canvas: {width}×{height}</div>
            <div>Theme: {ThemeUtils.getThemeName(theme.mode)}</div>
            <div>Objects: {metrics.objectCount}</div>
            {isPlaying && (
              <div className="flex items-center gap-1 text-green-400">
                <Play className="h-3 w-3" />
                Preview Mode
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Export & Actions */}
        <div 
          className="w-60 border-l bg-white/95 backdrop-blur-sm overflow-y-auto"
          style={{ 
            backgroundColor: theme.colors.sidebar,
            borderColor: theme.colors.border 
          }}
        >
          <div className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export & Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleQuickAction('export')}
                  disabled={!canvas}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Timeline
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleQuickAction('preview')}
                  disabled={!canvas}
                >
                  {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isPlaying ? 'Pause' : 'Preview'}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleQuickAction('save')}
                  disabled={!canvas}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Salvar Canvas
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Engine
                    </span>
                    <Badge variant="secondary">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3 text-blue-500" />
                      Performance
                    </span>
                    <Badge variant={metrics.fps > 45 ? 'default' : 'destructive'}>
                      {metrics.fps > 45 ? 'Optimal' : 'Warning'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      GPU
                    </span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component with theme provider
export default function ProfessionalCanvasEditorV3(props: ProfessionalCanvasEditorProps) {
  return (
    <CanvasThemeProvider defaultTheme="pro">
      <ProfessionalCanvasEditorCore {...props} />
    </CanvasThemeProvider>
  )
}

