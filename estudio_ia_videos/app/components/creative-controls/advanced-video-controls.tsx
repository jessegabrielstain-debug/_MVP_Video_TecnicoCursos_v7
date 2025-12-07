

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { 
  Palette, 
  Camera, 
  Lightbulb,
  Sliders,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  Film,
  Gauge,
  Layers,
  Settings
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CreativeControls {
  realism_slider: number // 0-100 (0=cartoon, 100=photorealistic)
  camera_presets: {
    shot_type: 'close' | 'medium' | 'wide' | 'custom'
    angle: 'straight' | 'low' | 'high' | 'dutch'
    movement: 'static' | 'pan' | 'zoom' | 'track'
    focus: 'sharp' | 'soft' | 'dramatic'
  }
  lighting_setup: {
    mood: 'natural' | 'dramatic' | 'soft' | 'corporate' | 'industrial'
    direction: 'key' | 'fill' | 'rim' | 'mixed'
    intensity: number
    color_temperature: number // Kelvin
  }
  style_modifiers: {
    saturation: number
    contrast: number
    brightness: number
    film_grain: number
    motion_blur: boolean
    depth_of_field: number
  }
  advanced_settings: {
    character_consistency: boolean
    scene_transitions: boolean
    auto_framing: boolean
    quality_upscaling: boolean
  }
}

export default function AdvancedVideoControls({ 
  onControlsChange 
}: {
  onControlsChange: (controls: CreativeControls) => void
}) {
  const [controls, setControls] = useState<CreativeControls>({
    realism_slider: 75,
    camera_presets: {
      shot_type: 'medium',
      angle: 'straight',
      movement: 'static',
      focus: 'sharp'
    },
    lighting_setup: {
      mood: 'corporate',
      direction: 'mixed',
      intensity: 0.8,
      color_temperature: 5600
    },
    style_modifiers: {
      saturation: 1.0,
      contrast: 1.0,
      brightness: 1.0,
      film_grain: 0.0,
      motion_blur: false,
      depth_of_field: 0.3
    },
    advanced_settings: {
      character_consistency: true,
      scene_transitions: true,
      auto_framing: true,
      quality_upscaling: false
    }
  })

  const [presets] = useState<{
    name: string;
    description: string;
    controls: Partial<CreativeControls>;
  }[]>([
    {
      name: 'Treinamento Corporativo',
      description: 'Profissional, claro e objetivo',
      controls: {
        realism_slider: 85,
        camera_presets: { shot_type: 'medium', angle: 'straight', movement: 'static', focus: 'sharp' },
        lighting_setup: { mood: 'corporate', direction: 'mixed', intensity: 0.8, color_temperature: 5600 },
        style_modifiers: { saturation: 0.9, contrast: 1.1, brightness: 1.0, film_grain: 0.0, motion_blur: false, depth_of_field: 0.2 }
      }
    },
    {
      name: 'Segurança Industrial',
      description: 'Sério, dramático para alertas',
      controls: {
        realism_slider: 90,
        camera_presets: { shot_type: 'close', angle: 'low', movement: 'static', focus: 'dramatic' },
        lighting_setup: { mood: 'dramatic', direction: 'key', intensity: 0.9, color_temperature: 4800 },
        style_modifiers: { saturation: 1.2, contrast: 1.3, brightness: 0.9, film_grain: 0.1, motion_blur: false, depth_of_field: 0.4 }
      }
    },
    {
      name: 'Cartoon Educativo',
      description: 'Divertido e acessível',
      controls: {
        realism_slider: 15,
        camera_presets: { shot_type: 'medium', angle: 'straight', movement: 'pan', focus: 'soft' },
        lighting_setup: { mood: 'soft', direction: 'fill', intensity: 0.7, color_temperature: 6500 },
        style_modifiers: { saturation: 1.4, contrast: 0.9, brightness: 1.1, film_grain: 0.0, motion_blur: false, depth_of_field: 0.1 }
      }
    }
  ])

  const updateControls = (updates: Partial<CreativeControls>) => {
    const newControls = { ...controls, ...updates }
    setControls(newControls)
    onControlsChange(newControls)
  }

  const applyPreset = (preset: { name: string; controls: Partial<CreativeControls> }) => {
    const newControls = { 
      ...controls, 
      ...preset.controls,
      advanced_settings: controls.advanced_settings // Keep advanced settings
    }
    setControls(newControls)
    onControlsChange(newControls)
    toast.success(`Preset "${preset.name}" aplicado!`)
  }

  const resetToDefaults = () => {
    const defaultControls: CreativeControls = {
      realism_slider: 75,
      camera_presets: {
        shot_type: 'medium',
        angle: 'straight',
        movement: 'static',
        focus: 'sharp'
      },
      lighting_setup: {
        mood: 'natural',
        direction: 'mixed',
        intensity: 0.7,
        color_temperature: 5600
      },
      style_modifiers: {
        saturation: 1.0,
        contrast: 1.0,
        brightness: 1.0,
        film_grain: 0.0,
        motion_blur: false,
        depth_of_field: 0.3
      },
      advanced_settings: {
        character_consistency: true,
        scene_transitions: true,
        auto_framing: true,
        quality_upscaling: false
      }
    }
    
    setControls(defaultControls)
    onControlsChange(defaultControls)
    toast.success('Configurações resetadas!')
  }

  const getRealismLabel = (value: number) => {
    if (value < 25) return 'Cartoon'
    if (value < 50) return 'Animado'
    if (value < 75) return 'Semi-realista'
    return 'Fotorrealista'
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Controles Criativos Avançados
          </CardTitle>
          <CardDescription>
            Ajuste fino para qualidade visual e estilo dos vídeos
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <h4 className="font-medium">Presets Rápidos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {presets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => applyPreset(preset)}
                >
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{preset.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Realism Slider */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Controle de Realismo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Nível de Realismo</Label>
              <Badge variant="outline">{getRealismLabel(controls.realism_slider)}</Badge>
            </div>
            
            <Slider
              value={[controls.realism_slider]}
              onValueChange={([value]) => updateControls({ realism_slider: value })}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>Cartoon</span>
              <span>Animado</span>
              <span>Semi-realista</span>
              <span>Fotorrealista</span>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{getRealismLabel(controls.realism_slider)} ({controls.realism_slider}%)</strong>
                {controls.realism_slider < 25 && ' - Ideal para conteúdo educativo divertido'}
                {controls.realism_slider >= 25 && controls.realism_slider < 50 && ' - Equilibrio entre diversão e seriedade'}
                {controls.realism_slider >= 50 && controls.realism_slider < 75 && ' - Profissional com toque humano'}
                {controls.realism_slider >= 75 && ' - Máximo realismo para treinamentos sérios'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Configurações de Câmera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Enquadramento</Label>
              <Select 
                value={controls.camera_presets.shot_type}
                onValueChange={(value: string) => updateControls({
                  camera_presets: { ...controls.camera_presets, shot_type: value as CreativeControls['camera_presets']['shot_type'] }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="close">Primeiro Plano</SelectItem>
                  <SelectItem value="medium">Plano Médio</SelectItem>
                  <SelectItem value="wide">Plano Geral</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ângulo da Câmera</Label>
              <Select 
                value={controls.camera_presets.angle}
                onValueChange={(value: string) => updateControls({
                  camera_presets: { ...controls.camera_presets, angle: value as CreativeControls['camera_presets']['angle'] }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">Reto</SelectItem>
                  <SelectItem value="low">Contra-plongée</SelectItem>
                  <SelectItem value="high">Plongée</SelectItem>
                  <SelectItem value="dutch">Ângulo Holandês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Movimento</Label>
              <Select 
                value={controls.camera_presets.movement}
                onValueChange={(value: string) => updateControls({
                  camera_presets: { ...controls.camera_presets, movement: value as CreativeControls['camera_presets']['movement'] }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Estático</SelectItem>
                  <SelectItem value="pan">Panorâmica</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="track">Travelling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Foco</Label>
              <Select 
                value={controls.camera_presets.focus}
                onValueChange={(value: string) => updateControls({
                  camera_presets: { ...controls.camera_presets, focus: value as CreativeControls['camera_presets']['focus'] }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sharp">Nítido</SelectItem>
                  <SelectItem value="soft">Suave</SelectItem>
                  <SelectItem value="dramatic">Dramático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lighting Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Setup de Iluminação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Mood da Iluminação</Label>
                <Select 
                  value={controls.lighting_setup.mood}
                  onValueChange={(value: string) => updateControls({
                    lighting_setup: { ...controls.lighting_setup, mood: value as CreativeControls['lighting_setup']['mood'] }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="dramatic">Dramática</SelectItem>
                    <SelectItem value="soft">Suave</SelectItem>
                    <SelectItem value="corporate">Corporativa</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Direção da Luz</Label>
                <Select 
                  value={controls.lighting_setup.direction}
                  onValueChange={(value: string) => updateControls({
                    lighting_setup: { ...controls.lighting_setup, direction: value as CreativeControls['lighting_setup']['direction'] }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="key">Key Light</SelectItem>
                    <SelectItem value="fill">Fill Light</SelectItem>
                    <SelectItem value="rim">Rim Light</SelectItem>
                    <SelectItem value="mixed">Setup Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Intensidade</Label>
                <Slider
                  value={[controls.lighting_setup.intensity * 100]}
                  onValueChange={([value]) => updateControls({
                    lighting_setup: { ...controls.lighting_setup, intensity: value / 100 }
                  })}
                  max={100}
                  min={10}
                  step={5}
                />
                <div className="text-xs text-gray-600 text-center">
                  {(controls.lighting_setup.intensity * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Temperatura de Cor (Kelvin)</Label>
              <Slider
                value={[controls.lighting_setup.color_temperature]}
                onValueChange={([value]) => updateControls({
                  lighting_setup: { ...controls.lighting_setup, color_temperature: value }
                })}
                max={8000}
                min={2700}
                step={100}
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>2700K (Quente)</span>
                <span className="font-medium">{controls.lighting_setup.color_temperature}K</span>
                <span>8000K (Frio)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style Modifiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Modificadores de Estilo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Saturação</Label>
                <Slider
                  value={[controls.style_modifiers.saturation * 100]}
                  onValueChange={([value]) => updateControls({
                    style_modifiers: { ...controls.style_modifiers, saturation: value / 100 }
                  })}
                  max={200}
                  min={0}
                  step={5}
                />
                <div className="text-xs text-gray-600 text-center">
                  {(controls.style_modifiers.saturation * 100).toFixed(0)}%
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contraste</Label>
                <Slider
                  value={[controls.style_modifiers.contrast * 100]}
                  onValueChange={([value]) => updateControls({
                    style_modifiers: { ...controls.style_modifiers, contrast: value / 100 }
                  })}
                  max={200}
                  min={50}
                  step={5}
                />
                <div className="text-xs text-gray-600 text-center">
                  {(controls.style_modifiers.contrast * 100).toFixed(0)}%
                </div>
              </div>

              <div className="space-y-2">
                <Label>Brilho</Label>
                <Slider
                  value={[controls.style_modifiers.brightness * 100]}
                  onValueChange={([value]) => updateControls({
                    style_modifiers: { ...controls.style_modifiers, brightness: value / 100 }
                  })}
                  max={150}
                  min={50}
                  step={5}
                />
                <div className="text-xs text-gray-600 text-center">
                  {(controls.style_modifiers.brightness * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Granulação do Filme</Label>
                <Slider
                  value={[controls.style_modifiers.film_grain * 100]}
                  onValueChange={([value]) => updateControls({
                    style_modifiers: { ...controls.style_modifiers, film_grain: value / 100 }
                  })}
                  max={50}
                  min={0}
                  step={1}
                />
                <div className="text-xs text-gray-600 text-center">
                  {(controls.style_modifiers.film_grain * 100).toFixed(0)}%
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profundidade de Campo</Label>
                <Slider
                  value={[controls.style_modifiers.depth_of_field * 100]}
                  onValueChange={([value]) => updateControls({
                    style_modifiers: { ...controls.style_modifiers, depth_of_field: value / 100 }
                  })}
                  max={100}
                  min={0}
                  step={5}
                />
                <div className="text-xs text-gray-600 text-center">
                  {(controls.style_modifiers.depth_of_field * 100).toFixed(0)}%
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Motion Blur</Label>
                  <p className="text-xs text-gray-600">Desfoque de movimento</p>
                </div>
                <Switch 
                  checked={controls.style_modifiers.motion_blur}
                  onCheckedChange={(checked) => updateControls({
                    style_modifiers: { ...controls.style_modifiers, motion_blur: checked }
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações Avançadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Consistência de Personagem</Label>
                  <p className="text-xs text-gray-600">Mantém aparência entre cenas</p>
                </div>
                <Switch 
                  checked={controls.advanced_settings.character_consistency}
                  onCheckedChange={(checked) => updateControls({
                    advanced_settings: { ...controls.advanced_settings, character_consistency: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Transições de Cena</Label>
                  <p className="text-xs text-gray-600">Transições suaves automáticas</p>
                </div>
                <Switch 
                  checked={controls.advanced_settings.scene_transitions}
                  onCheckedChange={(checked) => updateControls({
                    advanced_settings: { ...controls.advanced_settings, scene_transitions: checked }
                  })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Enquadramento</Label>
                  <p className="text-xs text-gray-600">Ajuste automático de framing</p>
                </div>
                <Switch 
                  checked={controls.advanced_settings.auto_framing}
                  onCheckedChange={(checked) => updateControls({
                    advanced_settings: { ...controls.advanced_settings, auto_framing: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Upscaling de Qualidade</Label>
                  <p className="text-xs text-gray-600">IA para melhoria de resolução</p>
                </div>
                <Switch 
                  checked={controls.advanced_settings.quality_upscaling}
                  onCheckedChange={(checked) => updateControls({
                    advanced_settings: { ...controls.advanced_settings, quality_upscaling: checked }
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => toast('Preview gerado com os controles atuais!')}>
          <Eye className="w-4 h-4 mr-2" />
          Gerar Preview
        </Button>
        
        <Button variant="outline" onClick={() => toast('Configurações salvas como preset!')}>
          <Save className="w-4 h-4 mr-2" />
          Salvar como Preset
        </Button>
        
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar
        </Button>
      </div>

      {/* Impact Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview de Impacto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h5 className="font-medium text-blue-900">Qualidade Visual</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Realismo</span>
                  <span className="font-medium">{getRealismLabel(controls.realism_slider)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profissionalismo</span>
                  <span className="font-medium">
                    {controls.lighting_setup.mood === 'corporate' ? 'Alto' : 
                     controls.lighting_setup.mood === 'natural' ? 'Médio' : 'Criativo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-green-900">Performance</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Tempo de Render</span>
                  <span className="font-medium">
                    {controls.advanced_settings.quality_upscaling ? '+20%' : 'Normal'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Custo Estimado</span>
                  <span className="font-medium">
                    {controls.realism_slider > 80 ? '+15%' : 'Padrão'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-purple-900">Adequação</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Treinamento NR</span>
                  <span className="font-medium">
                    {controls.lighting_setup.mood === 'corporate' && controls.realism_slider > 70 ? 'Excelente' : 'Boa'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Engajamento</span>
                  <span className="font-medium">
                    {controls.realism_slider < 50 ? 'Alto' : 'Profissional'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
