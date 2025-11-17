
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Sparkles, Palette, Layers, Zap, Eye, Settings,
  Play, Square, RotateCcw, Download, Save, Share2,
  Wand2, Star, Brush, Film, Camera, Lightbulb
} from 'lucide-react'

interface EffectConfig {
  id: string
  name: string
  type: 'particle' | 'transition' | 'filter' | 'motion'
  enabled: boolean
  intensity: number
  params: Record<string, unknown>
}

interface VideoEffect {
  id: string
  name: string
  category: string
  description: string
  thumbnail: string
  premium: boolean
  config: EffectConfig
}

export default function VideoEffectsEngine() {
  const [selectedEffect, setSelectedEffect] = useState<VideoEffect | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [effects, setEffects] = useState<VideoEffect[]>([])
  const [activeEffects, setActiveEffects] = useState<EffectConfig[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    loadEffects()
    initializeCanvas()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const loadEffects = async () => {
    try {
      const response = await fetch('/api/v2/video-effects/list')
      if (response.ok) {
        const data = await response.json()
        setEffects(data.effects)
      }
    } catch (error) {
      console.error('Error loading effects:', error)
      // Use mock data
      setEffects(mockEffects)
    }
  }

  const initializeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 450

    // Start animation loop
    animateCanvas(ctx, canvas)
  }

  const animateCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#1e40af')
    gradient.addColorStop(1, '#7c3aed')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply active effects
    activeEffects.forEach(effect => {
      applyEffect(ctx, canvas, effect)
    })

    // Continue animation if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(() => animateCanvas(ctx, canvas))
    }
  }

  const applyEffect = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, effect: EffectConfig) => {
    switch (effect.type) {
      case 'particle':
        drawParticles(ctx, canvas, effect)
        break
      case 'transition':
        drawTransition(ctx, canvas, effect)
        break
      case 'filter':
        applyFilter(ctx, canvas, effect)
        break
      case 'motion':
        drawMotionGraphics(ctx, canvas, effect)
        break
    }
  }

  const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, effect: EffectConfig) => {
    const particleCount = Math.floor(effect.intensity * 100)
    const time = Date.now() * 0.001

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.sin(time + i * 0.1) * 0.5 + 0.5) * canvas.width
      const y = (Math.cos(time + i * 0.15) * 0.5 + 0.5) * canvas.height
      const size = 2 + Math.sin(time + i) * 2

      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time + i) * 0.2})`
      ctx.fill()
    }
  }

  const drawTransition = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, effect: EffectConfig) => {
    const time = Date.now() * 0.002
    const progress = (Math.sin(time) + 1) * 0.5

    ctx.save()
    ctx.globalAlpha = effect.intensity
    
    // Wipe transition effect
    const wipePosition = progress * canvas.width
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(0, 0, wipePosition, canvas.height)
    
    ctx.restore()
  }

  const applyFilter = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, effect: EffectConfig) => {
    // Color overlay filter
    ctx.save()
    ctx.globalAlpha = effect.intensity * 0.3
    ctx.fillStyle = effect.params.color || '#ff6b6b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
  }

  const drawMotionGraphics = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, effect: EffectConfig) => {
    const time = Date.now() * 0.003
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 50 + Math.sin(time) * 20

    ctx.save()
    ctx.globalAlpha = effect.intensity
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  const toggleEffect = (effect: VideoEffect) => {
    const existingIndex = activeEffects.findIndex(e => e.id === effect.id)
    
    if (existingIndex >= 0) {
      // Remove effect
      setActiveEffects(prev => prev.filter(e => e.id !== effect.id))
    } else {
      // Add effect
      setActiveEffects(prev => [...prev, { ...effect.config, enabled: true }])
    }
  }

  const updateEffectParam = (effectId: string, param: string, value: any) => {
    setActiveEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? { ...effect, params: { ...effect.params, [param]: value } }
        : effect
    ))
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx && canvas) {
        animateCanvas(ctx, canvas)
      }
    }
  }

  const exportWithEffects = async () => {
    try {
      const response = await fetch('/api/v2/video-effects/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effects: activeEffects,
          projectId: 'current-project' // Get from context
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Export started:', result)
      }
    } catch (error) {
      console.error('Error exporting with effects:', error)
    }
  }

  // Mock effects data
  const mockEffects: VideoEffect[] = [
    {
      id: 'particles-1',
      name: 'Partículas de Energia',
      category: 'Partículas',
      description: 'Efeito de partículas energéticas flutuantes',
      thumbnail: '/effects/particles-energy.jpg',
      premium: false,
      config: {
        id: 'particles-1',
        name: 'Partículas de Energia',
        type: 'particle',
        enabled: false,
        intensity: 0.5,
        params: { color: '#ffffff', speed: 1, count: 50 }
      }
    },
    {
      id: 'transition-1',
      name: 'Transição Wipe',
      category: 'Transições',
      description: 'Transição suave tipo wipe lateral',
      thumbnail: '/effects/transition-wipe.jpg',
      premium: false,
      config: {
        id: 'transition-1',
        name: 'Transição Wipe',
        type: 'transition',
        enabled: false,
        intensity: 1,
        params: { direction: 'left', duration: 1000 }
      }
    },
    {
      id: 'filter-1',
      name: 'Filtro Cinematográfico',
      category: 'Filtros',
      description: 'Correção de cor estilo cinema',
      thumbnail: '/effects/filter-cinematic.jpg',
      premium: true,
      config: {
        id: 'filter-1',
        name: 'Filtro Cinematográfico',
        type: 'filter',
        enabled: false,
        intensity: 0.6,
        params: { color: '#ff6b6b', saturation: 1.2, contrast: 1.1 }
      }
    },
    {
      id: 'motion-1',
      name: 'Gráficos em Movimento',
      category: 'Motion Graphics',
      description: 'Elementos gráficos animados',
      thumbnail: '/effects/motion-graphics.jpg',
      premium: true,
      config: {
        id: 'motion-1',
        name: 'Gráficos em Movimento',
        type: 'motion',
        enabled: false,
        intensity: 0.8,
        params: { speed: 1, scale: 1, rotation: 0 }
      }
    }
  ]

  const currentEffects = effects.length > 0 ? effects : mockEffects

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Advanced Video Effects
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Engine avançado de efeitos visuais cinematográficos
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={togglePlayback}>
            {isPlaying ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? 'Pausar' : 'Visualizar'}
          </Button>
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={exportWithEffects}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Preview Canvas */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Preview em Tempo Real</span>
                <Badge variant={isPlaying ? "default" : "secondary"}>
                  {isPlaying ? 'Reproduzindo' : 'Pausado'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Visualização dos efeitos aplicados - {activeEffects.length} efeitos ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-w-full"
                  style={{ aspectRatio: '16/9' }}
                />
                
                {/* Overlay Controls */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button size="sm" variant="ghost" onClick={togglePlayback}>
                          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <span className="text-white text-sm">00:15 / 02:30</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-xs">
                          {activeEffects.length} efeitos
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          4K Ready
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Effect Timeline */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Film className="h-5 w-5" />
                <span>Timeline de Efeitos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeEffects.map((effect, index) => (
                  <div key={effect.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{effect.name}</p>
                      <p className="text-xs text-gray-500">Intensidade: {Math.round(effect.intensity * 100)}%</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {activeEffects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum efeito aplicado</p>
                    <p className="text-sm">Selecione efeitos na biblioteca para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Effects Library */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wand2 className="h-5 w-5" />
                <span>Biblioteca</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="premium">Premium</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  {currentEffects.map((effect) => (
                    <div key={effect.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{effect.name}</h4>
                          {effect.premium && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={activeEffects.some(e => e.id === effect.id) ? "default" : "outline"}
                          onClick={() => toggleEffect(effect)}
                        >
                          {activeEffects.some(e => e.id === effect.id) ? 'Remover' : 'Aplicar'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {effect.description}
                      </p>
                      
                      {activeEffects.some(e => e.id === effect.id) && (
                        <div className="space-y-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                          <Label className="text-xs">Intensidade</Label>
                          <Slider
                            value={[activeEffects.find(e => e.id === effect.id)?.intensity ? activeEffects.find(e => e.id === effect.id)!.intensity * 100 : 50]}
                            onValueChange={([value]) => 
                              updateEffectParam(effect.id, 'intensity', value / 100)
                            }
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="premium" className="space-y-3">
                  {currentEffects.filter(e => e.premium).map((effect) => (
                    <div key={effect.id} className="space-y-2 p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{effect.name}</h4>
                        <Badge variant="default" className="text-xs bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {effect.description}
                      </p>
                      <Button size="sm" className="w-full" onClick={() => toggleEffect(effect)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Aplicar Efeito
                      </Button>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Effect Controls */}
          {selectedEffect && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações</span>
                </CardTitle>
                <CardDescription>{selectedEffect.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Intensidade</Label>
                    <Slider
                      value={[selectedEffect.config.intensity * 100]}
                      onValueChange={([value]) => 
                        setSelectedEffect(prev => prev ? {
                          ...prev,
                          config: { ...prev.config, intensity: value / 100 }
                        } : null)
                      }
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Efeito Ativo</Label>
                    <Switch
                      checked={selectedEffect.config.enabled}
                      onCheckedChange={(checked) =>
                        setSelectedEffect(prev => prev ? {
                          ...prev,
                          config: { ...prev.config, enabled: checked }
                        } : null)
                      }
                    />
                  </div>

                  {selectedEffect.config.type === 'particle' && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Cor das Partículas</Label>
                        <Input
                          type="color"
                          value={selectedEffect.config.params.color || '#ffffff'}
                          onChange={(e) => updateEffectParam(selectedEffect.id, 'color', e.target.value)}
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Velocidade</Label>
                        <Slider
                          value={[selectedEffect.config.params.speed * 100 || 50]}
                          onValueChange={([value]) => updateEffectParam(selectedEffect.id, 'speed', value / 100)}
                          max={200}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t space-y-2">
                    <Button size="sm" variant="outline" className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Preset
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Render Time</span>
                  <Badge variant="secondary">+15%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">File Size</span>
                  <Badge variant="secondary">+8%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Quality</span>
                  <Badge variant="default">Excelente</Badge>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Usar menos efeitos para renderização mais rápida
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

const updateEffectParam = (effectId: string, param: string, value: any) => {
  // This would be implemented to update effect parameters
  console.log(`Updating effect ${effectId}, param ${param} to:`, value)
}
