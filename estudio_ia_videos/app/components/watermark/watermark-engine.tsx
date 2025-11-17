
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Type, 
  Image as ImageIcon, 
  Move, 
  RotateCw, 
  Palette, 
  Eye, 
  Download,
  Upload,
  Wand2,
  Copy,
  Trash2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface WatermarkConfig {
  type: 'text' | 'image' | 'logo'
  content: string
  position: {
    x: number
    y: number
  }
  size: number
  opacity: number
  rotation: number
  color: string
  fontFamily: string
  fontWeight: 'normal' | 'bold' | 'lighter'
  backgroundColor: string
  backgroundOpacity: number
  borderRadius: number
  padding: number
  blendMode: React.CSSProperties['mixBlendMode']
  animation: {
    enabled: boolean
    type: 'fade' | 'slide' | 'pulse' | 'rotate'
    duration: number
    delay: number
  }
  shadow: {
    enabled: boolean
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }
}

interface WatermarkEngineProps {
  onApply?: (config: WatermarkConfig) => void
  previewMode?: boolean
  videoPreview?: string
}

const defaultWatermarkConfig: WatermarkConfig = {
  type: 'text',
  content: 'Estúdio IA',
  position: { x: 85, y: 90 },
  size: 20,
  opacity: 0.8,
  rotation: 0,
  color: '#ffffff',
  fontFamily: 'Arial',
  fontWeight: 'bold',
  backgroundColor: '#000000',
  backgroundOpacity: 0.3,
  borderRadius: 4,
  padding: 8,
  blendMode: 'normal',
  animation: {
    enabled: false,
    type: 'fade',
    duration: 2000,
    delay: 0
  },
  shadow: {
    enabled: true,
    color: '#000000',
    blur: 4,
    offsetX: 2,
    offsetY: 2
  }
}

const fontFamilies = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
  'Verdana', 'Courier New', 'Impact', 'Comic Sans MS'
]

const blendModes: WatermarkConfig['blendMode'][] = [
  'normal', 'multiply', 'screen', 'overlay', 'soft-light',
  'hard-light', 'color-dodge', 'color-burn', 'difference', 'exclusion'
]

const animationTypes = [
  { value: 'fade', label: 'Fade In/Out' },
  { value: 'slide', label: 'Slide' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'rotate', label: 'Rotate' }
]

export function WatermarkEngine({ onApply, previewMode = true, videoPreview }: WatermarkEngineProps) {
  const [config, setConfig] = useState<WatermarkConfig>(defaultWatermarkConfig)
  const [presets, setPresets] = useState<WatermarkConfig[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Carregar presets salvos
    const savedPresets = localStorage.getItem('watermark_presets')
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets))
    }
  }, [])

  const updateConfig = (updates: Partial<WatermarkConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Imagem muito grande. Máximo 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        updateConfig({ 
          type: 'image',
          content: result
        })
        toast.success('Imagem carregada com sucesso!')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!previewRef.current) return
    
    setIsDragging(true)
    const rect = previewRef.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !previewRef.current) return

    const rect = previewRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    updateConfig({
      position: {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      }
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const savePreset = () => {
    const name = prompt('Nome do preset:')
    if (name) {
      const newPresets = [...presets, { ...config, content: name }]
      setPresets(newPresets)
      localStorage.setItem('watermark_presets', JSON.stringify(newPresets))
      toast.success('Preset salvo!')
    }
  }

  const loadPreset = (preset: WatermarkConfig) => {
    setConfig(preset)
    toast.success('Preset carregado!')
  }

  const deletePreset = (index: number) => {
    const newPresets = presets.filter((_, i) => i !== index)
    setPresets(newPresets)
    localStorage.setItem('watermark_presets', JSON.stringify(newPresets))
    toast.success('Preset removido!')
  }

  const getWatermarkStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${config.position.x}%`,
      top: `${config.position.y}%`,
      transform: `translate(-50%, -50%) rotate(${config.rotation}deg)`,
      opacity: config.opacity,
      fontSize: `${config.size}px`,
      color: config.color,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
      backgroundColor: `${config.backgroundColor}${Math.round(config.backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
      padding: `${config.padding}px`,
      borderRadius: `${config.borderRadius}px`,
      mixBlendMode: config.blendMode,
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      pointerEvents: 'all',
      zIndex: 10
    }

    if (config.shadow.enabled) {
      baseStyle.textShadow = `${config.shadow.offsetX}px ${config.shadow.offsetY}px ${config.shadow.blur}px ${config.shadow.color}`
    }

    return baseStyle
  }

  const getAnimationClass = () => {
    if (!config.animation.enabled) return ''
    
    switch (config.animation.type) {
      case 'fade':
        return 'animate-pulse'
      case 'pulse':
        return 'animate-ping'
      case 'rotate':
        return 'animate-spin'
      default:
        return ''
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Watermark Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex gap-2">
                  <Button onClick={() => onApply?.(config)} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Aplicar
                  </Button>
                </div>
              </div>
              
              <div 
                ref={previewRef}
                className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {videoPreview ? (
                  <video 
                    src={videoPreview} 
                    className="w-full h-full object-cover"
                    muted
                    loop
                    autoPlay
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Preview do Watermark</p>
                    </div>
                  </div>
                )}
                
                {/* Watermark Overlay */}
                <motion.div
                  style={getWatermarkStyle()}
                  className={`${getAnimationClass()} inline-block`}
                  onMouseDown={handleMouseDown}
                  animate={config.animation.enabled ? {
                    opacity: [config.opacity * 0.5, config.opacity, config.opacity * 0.5],
                  } : {}}
                  transition={config.animation.enabled ? {
                    duration: config.animation.duration / 1000,
                    repeat: Infinity,
                    delay: config.animation.delay / 1000
                  } : {}}
                >
                  {config.type === 'text' ? (
                    config.content || 'Watermark'
                  ) : config.type === 'image' && config.content ? (
                    <img 
                      src={config.content} 
                      alt="Watermark" 
                      className="max-w-none"
                      style={{ 
                        width: `${config.size}px`, 
                        height: 'auto' 
                      }}
                    />
                  ) : (
                    'Logo'
                  )}
                </motion.div>
                
                {/* Grid Helper */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="style">Estilo</TabsTrigger>
                  <TabsTrigger value="effects">Efeitos</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  {/* Type Selection */}
                  <div>
                    <Label>Tipo</Label>
                    <Select value={config.type} onValueChange={(value: 'text' | 'image') => updateConfig({ type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center gap-2">
                            <Type className="h-4 w-4" />
                            Texto
                          </div>
                        </SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Imagem
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content */}
                  {config.type === 'text' ? (
                    <div>
                      <Label>Texto</Label>
                      <Textarea
                        value={config.content}
                        onChange={(e) => updateConfig({ content: e.target.value })}
                        placeholder="Digite o texto do watermark"
                        className="min-h-[100px]"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label>Upload de Imagem</Label>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Escolher Imagem
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Posição X (%)</Label>
                      <Slider
                        value={[config.position.x]}
                        onValueChange={([value]) => updateConfig({ position: { ...config.position, x: value } })}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Posição Y (%)</Label>
                      <Slider
                        value={[config.position.y]}
                        onValueChange={([value]) => updateConfig({ position: { ...config.position, y: value } })}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="style" className="space-y-4">
                  {/* Size and Opacity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tamanho</Label>
                      <Slider
                        value={[config.size]}
                        onValueChange={([value]) => updateConfig({ size: value })}
                        min={8}
                        max={72}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Opacidade</Label>
                      <Slider
                        value={[config.opacity]}
                        onValueChange={([value]) => updateConfig({ opacity: value })}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cor do Texto</Label>
                      <Input
                        type="color"
                        value={config.color}
                        onChange={(e) => updateConfig({ color: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Cor de Fundo</Label>
                      <Input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Typography (for text) */}
                  {config.type === 'text' && (
                    <>
                      <div>
                        <Label>Fonte</Label>
                        <Select value={config.fontFamily} onValueChange={(value) => updateConfig({ fontFamily: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontFamilies.map(font => (
                              <SelectItem key={font} value={font}>{font}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Peso da Fonte</Label>
                        <Select value={config.fontWeight} onValueChange={(value: string) => updateConfig({ fontWeight: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Negrito</SelectItem>
                            <SelectItem value="lighter">Leve</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="effects" className="space-y-4">
                  {/* Rotation */}
                  <div>
                    <Label>Rotação (graus)</Label>
                    <Slider
                      value={[config.rotation]}
                      onValueChange={([value]) => updateConfig({ rotation: value })}
                      min={-180}
                      max={180}
                      step={5}
                    />
                  </div>

                  {/* Blend Mode */}
                  <div>
                    <Label>Modo de Mesclagem</Label>
                    <Select value={config.blendMode} onValueChange={(value) => updateConfig({ blendMode: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {blendModes.map(mode => (
                          <SelectItem key={mode} value={mode}>
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Background Opacity */}
                  <div>
                    <Label>Opacidade do Fundo</Label>
                    <Slider
                      value={[config.backgroundOpacity]}
                      onValueChange={([value]) => updateConfig({ backgroundOpacity: value })}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                  </div>

                  {/* Border Radius */}
                  <div>
                    <Label>Borda Arredondada</Label>
                    <Slider
                      value={[config.borderRadius]}
                      onValueChange={([value]) => updateConfig({ borderRadius: value })}
                      min={0}
                      max={50}
                      step={1}
                    />
                  </div>

                  {/* Shadow */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Sombra</Label>
                      <Switch
                        checked={config.shadow.enabled}
                        onCheckedChange={(checked) => updateConfig({ 
                          shadow: { ...config.shadow, enabled: checked }
                        })}
                      />
                    </div>
                    {config.shadow.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Desfoque</Label>
                          <Slider
                            value={[config.shadow.blur]}
                            onValueChange={([value]) => updateConfig({ 
                              shadow: { ...config.shadow, blur: value }
                            })}
                            min={0}
                            max={20}
                            step={1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Cor</Label>
                          <Input
                            type="color"
                            value={config.shadow.color}
                            onChange={(e) => updateConfig({ 
                              shadow: { ...config.shadow, color: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Animation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Animação</Label>
                      <Switch
                        checked={config.animation.enabled}
                        onCheckedChange={(checked) => updateConfig({ 
                          animation: { ...config.animation, enabled: checked }
                        })}
                      />
                    </div>
                    {config.animation.enabled && (
                      <>
                        <div>
                          <Label className="text-xs">Tipo</Label>
                          <Select 
                            value={config.animation.type} 
                            onValueChange={(value: string) => updateConfig({ 
                              animation: { ...config.animation, type: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {animationTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Duração (ms)</Label>
                          <Slider
                            value={[config.animation.duration]}
                            onValueChange={([value]) => updateConfig({ 
                              animation: { ...config.animation, duration: value }
                            })}
                            min={500}
                            max={5000}
                            step={100}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="presets" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Presets Salvos</h3>
                    <Button onClick={savePreset} size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Salvar Atual
                    </Button>
                  </div>
                  
                  <div className="grid gap-2">
                    {presets.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Nenhum preset salvo ainda
                      </p>
                    ) : (
                      presets.map((preset, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{preset.content}</p>
                            <p className="text-sm text-gray-500">
                              {preset.type} • {Math.round(preset.opacity * 100)}% opacidade
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => loadPreset(preset)}
                              size="sm"
                              variant="outline"
                            >
                              Carregar
                            </Button>
                            <Button
                              onClick={() => deletePreset(index)}
                              size="sm"
                              variant="outline"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
