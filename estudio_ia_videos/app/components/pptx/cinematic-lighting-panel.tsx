
/**
 * 🎬 Painel de Iluminação Cinematográfica
 * Controles profissionais de iluminação 3D
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { 
  Sun, 
  Lightbulb, 
  Palette,
  Eye,
  Camera,
  Aperture,
  Zap,
  Settings,
  Sparkles
} from 'lucide-react'

interface LightingSetup {
  keyLight: {
    intensity: number
    color: string
    angle: number
    softness: number
  }
  fillLight: {
    intensity: number
    color: string
    angle: number
    softness: number
  }
  rimLight: {
    intensity: number
    color: string
    angle: number
    softness: number
  }
  ambient: {
    intensity: number
    color: string
    temperature: number
  }
  environment: string
  hdri: string
}

type LightGroup = 'keyLight' | 'fillLight' | 'rimLight' | 'ambient'
type LightingPresetName = 'corporate' | 'safety' | 'medical' | 'cinematic'
type PresetOption = 'custom' | LightingPresetName

const PRESET_OPTIONS: readonly PresetOption[] = ['custom', 'corporate', 'safety', 'medical', 'cinematic']
const isPresetOption = (value: string): value is PresetOption =>
  PRESET_OPTIONS.includes(value as PresetOption)

interface Props {
  onLightingChange?: (setup: LightingSetup) => void
  sceneType?: 'corporate' | 'safety' | 'medical' | 'educational'
}

export function CinematicLightingPanel({ onLightingChange, sceneType = 'corporate' }: Props) {
  const [lighting, setLighting] = useState<LightingSetup>({
    keyLight: {
      intensity: 80,
      color: '#fff5e6',
      angle: 45,
      softness: 70
    },
    fillLight: {
      intensity: 40,
      color: '#e6f3ff',
      angle: -30,
      softness: 85
    },
    rimLight: {
      intensity: 60,
      color: '#ffffff',
      angle: 135,
      softness: 50
    },
    ambient: {
      intensity: 25,
      color: '#f0f4f8',
      temperature: 6500
    },
    environment: 'studio_professional',
    hdri: 'studio_lighting_4k'
  })

  const [selectedPreset, setSelectedPreset] = useState<PresetOption>('custom')

  // Presets de iluminação cinematográfica
  const lightingPresets: Record<LightingPresetName, {
    name: string
    description: string
    setup: LightingSetup
  }> = {
    corporate: {
      name: 'Corporativo Premium',
      description: 'Iluminação profissional para ambiente empresarial',
      setup: {
        keyLight: { intensity: 85, color: '#fff5e6', angle: 45, softness: 70 },
        fillLight: { intensity: 45, color: '#e6f3ff', angle: -30, softness: 85 },
        rimLight: { intensity: 65, color: '#ffffff', angle: 135, softness: 50 },
        ambient: { intensity: 25, color: '#f0f4f8', temperature: 6500 },
        environment: 'corporate_office',
        hdri: 'office_lighting_8k'
      }
    },
    safety: {
      name: 'Segurança Industrial',
      description: 'Iluminação clara e autoritativa para treinamentos',
      setup: {
        keyLight: { intensity: 90, color: '#ffffff', angle: 60, softness: 60 },
        fillLight: { intensity: 50, color: '#ffe6e6', angle: -45, softness: 80 },
        rimLight: { intensity: 70, color: '#ffcc00', angle: 120, softness: 45 },
        ambient: { intensity: 30, color: '#f5f5f5', temperature: 7000 },
        environment: 'industrial_floor',
        hdri: 'warehouse_lighting_4k'
      }
    },
    medical: {
      name: 'Ambiente Médico',
      description: 'Iluminação suave e confiável para saúde',
      setup: {
        keyLight: { intensity: 75, color: '#f8f9fa', angle: 30, softness: 90 },
        fillLight: { intensity: 55, color: '#e3f2fd', angle: -60, softness: 95 },
        rimLight: { intensity: 40, color: '#e8f5e8', angle: 150, softness: 80 },
        ambient: { intensity: 35, color: '#fafafa', temperature: 6000 },
        environment: 'medical_room',
        hdri: 'hospital_lighting_4k'
      }
    },
    cinematic: {
      name: 'Cinema Hollywoodiano',
      description: 'Iluminação dramática estilo filme',
      setup: {
        keyLight: { intensity: 95, color: '#fff8dc', angle: 35, softness: 40 },
        fillLight: { intensity: 25, color: '#1e3a8a', angle: -50, softness: 70 },
        rimLight: { intensity: 85, color: '#fbbf24', angle: 140, softness: 30 },
        ambient: { intensity: 15, color: '#1f2937', temperature: 3200 },
        environment: 'cinematic_studio',
        hdri: 'cinema_lighting_8k'
      }
    }
  }

  const handlePresetChange = (presetName: PresetOption) => {
    if (presetName === 'custom') {
      setSelectedPreset('custom')
      return
    }

    const preset = lightingPresets[presetName]
    if (preset) {
      setLighting(preset.setup)
      setSelectedPreset(presetName)
      onLightingChange?.(preset.setup)
      toast.success(`💡 Preset "${preset.name}" aplicado`)
    }
  }

  const applyLightingUpdate = (updater: (current: LightingSetup) => LightingSetup | null) => {
    let didUpdate = false
    setLighting((current) => {
      const updated = updater(current)
      if (!updated) {
        return current
      }
      didUpdate = true
      onLightingChange?.(updated)
      return updated
    })
    if (didUpdate) {
      setSelectedPreset('custom')
    }
  }

  const updateLightParameter = <L extends LightGroup, P extends keyof LightingSetup[L]>(
    lightType: L,
    parameter: P,
    value: LightingSetup[L][P]
  ) => {
    applyLightingUpdate((current) => {
      const segment = current[lightType]
      if (typeof segment !== 'object' || segment === null) {
        return null
      }
      return {
        ...current,
        [lightType]: {
          ...segment,
          [parameter]: value
        }
      }
    })
  }

  const handleHdriChange = (value: LightingSetup['hdri']) => {
    applyLightingUpdate((current) => ({
      ...current,
      hdri: value
    }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sun className="h-5 w-5 mr-2 text-yellow-500" />
          Iluminação Cinematográfica
          <Badge className="ml-2 bg-yellow-100 text-yellow-800">
            Hollywood Grade
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preset Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Presets de Iluminação</label>
          <Select
            value={selectedPreset}
            onValueChange={(value) => {
              if (!isPresetOption(value)) {
                return
              }
              handlePresetChange(value)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Personalizado</SelectItem>
              <SelectItem value="corporate">Corporativo Premium</SelectItem>
              <SelectItem value="safety">Segurança Industrial</SelectItem>
              <SelectItem value="medical">Ambiente Médico</SelectItem>
              <SelectItem value="cinematic">Cinema Hollywoodiano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Light Controls */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
            Luz Principal (Key Light)
          </h4>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Intensidade</span>
                <span className="text-yellow-600 font-medium">{lighting.keyLight.intensity}%</span>
              </div>
              <Slider
                value={[lighting.keyLight.intensity]}
                onValueChange={([value]) => updateLightParameter('keyLight', 'intensity', value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ângulo</span>
                <span className="text-blue-600 font-medium">{lighting.keyLight.angle}°</span>
              </div>
              <Slider
                value={[lighting.keyLight.angle]}
                onValueChange={([value]) => updateLightParameter('keyLight', 'angle', value)}
                min={-180}
                max={180}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Suavidade</span>
                <span className="text-purple-600 font-medium">{lighting.keyLight.softness}%</span>
              </div>
              <Slider
                value={[lighting.keyLight.softness]}
                onValueChange={([value]) => updateLightParameter('keyLight', 'softness', value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Ambiente HDRI */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Ambiente HDRI</label>
          <Select 
            value={lighting.hdri} 
            onValueChange={handleHdriChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="studio_lighting_8k">Studio Professional 8K</SelectItem>
              <SelectItem value="office_lighting_8k">Escritório Moderno 8K</SelectItem>
              <SelectItem value="warehouse_lighting_4k">Galpão Industrial 4K</SelectItem>
              <SelectItem value="hospital_lighting_4k">Hospital Clean 4K</SelectItem>
              <SelectItem value="cinema_lighting_8k">Cinema Dramático 8K</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Live Preview */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <Camera className="h-4 w-4 mr-2 text-purple-600" />
            Preview em Tempo Real
          </h4>
          
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
            {/* Simulated avatar with lighting */}
            <div className="text-6xl filter drop-shadow-lg">👨‍💼</div>
            
            {/* Lighting effects overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(${lighting.keyLight.angle}deg, 
                  rgba(255,255,255,${lighting.keyLight.intensity/200}) 0%, 
                  transparent 70%)`
              }}
            ></div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Preview Completo
          </Button>
        </div>

        {/* Technical Info */}
        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
          <div className="font-medium mb-1">💡 Tecnologia Cinematográfica:</div>
          <div>• Ray Tracing: Reflexos e sombras realistas</div>
          <div>• Global Illumination: Iluminação indireta natural</div>
          <div>• Subsurface Scattering: Pele com translucidez real</div>
          <div>• Volumetric Lighting: Raios de luz volumétricos</div>
        </div>
      </CardContent>
    </Card>
  )
}
