/**
 * 🧑‍💼 AVATAR 3D MODULE
 * Módulo de configuração de Avatar 3D para o Studio Unificado
 */

'use client'

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { 
  User, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Eye, 
  Palette, 
  Sliders,
  Download,
  Upload,
  Sparkles,
  Volume2,
  Camera,
  Monitor
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

import type { UnifiedProject, Avatar3DConfig } from '@/lib/stores/unified-project-store'

interface Avatar3DModuleProps {
  project: UnifiedProject
  onAvatarUpdate: (avatar: Avatar3DConfig) => void
  onExecuteStep: (data: any) => Promise<void>
}

interface AvatarPreset {
  id: string
  name: string
  gender: 'male' | 'female' | 'unisex'
  ethnicity: string
  age: string
  thumbnailUrl: string
  model: string
  description: string
  quality: Avatar3DConfig['quality']
}

const avatarPresets: AvatarPreset[] = [
  {
    id: 'avatar-1',
    name: 'Ana Silva',
    gender: 'female',
    ethnicity: 'brasileira',
    age: '30-35',
    thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20brazilian%20woman%20avatar%20business%20attire%20friendly%20smile&image_size=square',
    model: 'ana-silva-v2',
    description: 'Apresentadora profissional brasileira',
    quality: 'premium'
  },
  {
    id: 'avatar-2',
    name: 'Carlos Santos',
    gender: 'male',
    ethnicity: 'brasileiro',
    age: '35-40',
    thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20brazilian%20man%20avatar%20business%20suit%20confident%20expression&image_size=square',
    model: 'carlos-santos-v2',
    description: 'Apresentador executivo brasileiro',
    quality: 'premium'
  },
  {
    id: 'avatar-3',
    name: 'Maria Oliveira',
    gender: 'female',
    ethnicity: 'brasileira',
    age: '25-30',
    thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young%20brazilian%20woman%20avatar%20casual%20professional%20modern%20style&image_size=square',
    model: 'maria-oliveira-v2',
    description: 'Apresentadora jovem e moderna',
    quality: 'standard'
  },
  {
    id: 'avatar-4',
    name: 'João Costa',
    gender: 'male',
    ethnicity: 'brasileiro',
    age: '40-45',
    thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=mature%20brazilian%20man%20avatar%20professor%20style%20glasses%20wise%20expression&image_size=square',
    model: 'joao-costa-v2',
    description: 'Apresentador experiente e confiável',
    quality: 'cinematic'
  }
]

export default function Avatar3DModule({ 
  project, 
  onAvatarUpdate, 
  onExecuteStep 
}: Avatar3DModuleProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarPreset | null>(null)
  const [avatarConfig, setAvatarConfig] = useState<Avatar3DConfig>(
    project.avatar || {
      id: '',
      name: '',
      model: '',
      gender: 'female',
      ethnicity: 'brasileira',
      age: '30-35',
      quality: 'premium',
      customization: {
        pose_style: 'dinamico',
        expression_intensity: 'moderado',
        gesture_frequency: 'media',
        eye_contact_level: 'direto'
      }
    }
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Update avatar config when project changes
  useEffect(() => {
    if (project.avatar) {
      setAvatarConfig(project.avatar)
      const preset = avatarPresets.find(p => p.id === project.avatar?.id)
      if (preset) {
        setSelectedAvatar(preset)
      }
    }
  }, [project.avatar])

  // Handle avatar selection
  const handleAvatarSelect = (preset: AvatarPreset) => {
    setSelectedAvatar(preset)
    const newConfig: Avatar3DConfig = {
      id: preset.id,
      name: preset.name,
      model: preset.model,
      gender: preset.gender,
      ethnicity: preset.ethnicity,
      age: preset.age,
      quality: preset.quality,
      customization: avatarConfig.customization
    }
    setAvatarConfig(newConfig)
    onAvatarUpdate(newConfig)
  }

  // Handle customization changes
  const updateCustomization = (key: string, value: string) => {
    const newConfig = {
      ...avatarConfig,
      customization: {
        ...avatarConfig.customization,
        [key]: value
      }
    }
    setAvatarConfig(newConfig)
    onAvatarUpdate(newConfig)
  }

  // Handle quality change
  const updateQuality = (quality: Avatar3DConfig['quality']) => {
    const newConfig = { ...avatarConfig, quality }
    setAvatarConfig(newConfig)
    onAvatarUpdate(newConfig)
  }

  // Generate avatar preview
  const generatePreview = async () => {
    if (!selectedAvatar) return

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate generation progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch('/api/avatars/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: selectedAvatar.id,
          config: avatarConfig,
          type: 'preview',
          text: 'Olá! Este é um teste do avatar 3D. Como você pode ver, eu posso falar de forma natural e expressiva.'
        })
      })

      if (!response.ok) {
        throw new Error('Falha na geração do preview')
      }

      const { previewUrl: url } = await response.json()
      setPreviewUrl(url)
      setGenerationProgress(100)
      
      toast.success('Preview gerado com sucesso!')

    } catch (error: any) {
      logger.error('Preview generation error', error instanceof Error ? error : new Error(String(error)), { component: 'Avatar3DModule' })
      toast.error('Erro ao gerar preview: ' + error.message)
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationProgress(0), 2000)
    }
  }

  // Handle execute step
  const handleExecuteStep = async () => {
    if (!selectedAvatar) {
      toast.error('Selecione um avatar primeiro')
      return
    }

    try {
      await onExecuteStep({
        avatar: avatarConfig,
        slides: project.slides,
        settings: {
          generateLipSync: true,
          includeGestures: true,
          backgroundRemoval: true
        }
      })
      toast.success('Avatar configurado! Prosseguindo para TTS...')
    } catch (error: any) {
      toast.error('Erro ao configurar avatar: ' + error.message)
    }
  }

  // Render avatar grid
  const renderAvatarGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {avatarPresets.map((preset) => (
        <Card 
          key={preset.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedAvatar?.id === preset.id 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => handleAvatarSelect(preset)}
        >
          <CardContent className="p-4">
            <div className="aspect-square mb-3 overflow-hidden rounded-lg">
              <img 
                src={preset.thumbnailUrl} 
                alt={preset.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{preset.name}</h4>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {preset.gender === 'male' ? 'Masculino' : 'Feminino'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {preset.age}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-600 line-clamp-2">
                {preset.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge 
                  variant={preset.quality === 'cinematic' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {preset.quality === 'standard' ? 'Padrão' :
                   preset.quality === 'premium' ? 'Premium' :
                   preset.quality === 'cinematic' ? 'Cinematic' : 'Hyperreal'}
                </Badge>
                
                {selectedAvatar?.id === preset.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Render customization panel
  const renderCustomizationPanel = () => {
    if (!selectedAvatar) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sliders className="w-5 h-5" />
            <span>Personalização</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="behavior" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="quality">Qualidade</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="behavior" className="space-y-4 mt-4">
              <div>
                <Label>Estilo de Pose</Label>
                <Select 
                  value={avatarConfig.customization?.pose_style || 'dinamico'}
                  onValueChange={(value) => updateCustomization('pose_style', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinamico">Dinâmico</SelectItem>
                    <SelectItem value="estatico">Estático</SelectItem>
                    <SelectItem value="interativo">Interativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Intensidade da Expressão</Label>
                <Select 
                  value={avatarConfig.customization?.expression_intensity || 'moderado'}
                  onValueChange={(value) => updateCustomization('expression_intensity', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suave">Suave</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="intenso">Intenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Frequência de Gestos</Label>
                <Select 
                  value={avatarConfig.customization?.gesture_frequency || 'media'}
                  onValueChange={(value) => updateCustomization('gesture_frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nível de Contato Visual</Label>
                <Select 
                  value={avatarConfig.customization?.eye_contact_level || 'direto'}
                  onValueChange={(value) => updateCustomization('eye_contact_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direto">Direto</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="ocasional">Ocasional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="quality" className="space-y-4 mt-4">
              <div>
                <Label>Qualidade de Renderização</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['standard', 'premium', 'cinematic', 'hyperreal'] as const).map((quality) => (
                    <Button
                      key={quality}
                      variant={avatarConfig.quality === quality ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateQuality(quality)}
                      className="justify-start"
                    >
                      {quality === 'standard' ? 'Padrão' :
                       quality === 'premium' ? 'Premium' :
                       quality === 'cinematic' ? 'Cinematic' : 'Hyperreal'}
                    </Button>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {avatarConfig.quality === 'standard' && 'Qualidade básica, renderização rápida'}
                    {avatarConfig.quality === 'premium' && 'Alta qualidade, boa para apresentações profissionais'}
                    {avatarConfig.quality === 'cinematic' && 'Qualidade cinematográfica, ideal para produções premium'}
                    {avatarConfig.quality === 'hyperreal' && 'Máxima qualidade, fotorrealismo avançado'}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Configurações Avançadas</h4>
                  <p className="text-sm text-blue-700">
                    Estas configurações serão aplicadas durante a geração do vídeo final.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Sincronização Labial</Label>
                    <Badge variant="outline">Automático</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Remoção de Fundo</Label>
                    <Badge variant="outline">Ativado</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Gestos Automáticos</Label>
                    <Badge variant="outline">Ativado</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Expressões Faciais</Label>
                    <Badge variant="outline">Dinâmicas</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  // Render preview panel
  const renderPreviewPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Monitor className="w-5 h-5" />
          <span>Preview do Avatar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isGenerating && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Gerando preview...</span>
              <span className="text-sm text-gray-500">{generationProgress}%</span>
            </div>
            <Progress value={generationProgress} />
          </div>
        )}
        
        {previewUrl ? (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video 
                src={previewUrl}
                controls
                className="w-full h-full object-cover"
                poster={selectedAvatar?.thumbnailUrl}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={generatePreview}
                disabled={isGenerating}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Regenerar
              </Button>
            </div>
          </div>
        ) : selectedAvatar ? (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <img 
                src={selectedAvatar.thumbnailUrl}
                alt={selectedAvatar.name}
                className="w-32 h-32 object-cover rounded-full"
              />
            </div>
            
            <Button
              onClick={generatePreview}
              disabled={isGenerating}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Preview
            </Button>
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Selecione um avatar</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Avatar Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Seleção de Avatar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderAvatarGrid()}
        </CardContent>
      </Card>

      {/* Configuration and Preview */}
      {selectedAvatar && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderCustomizationPanel()}
          {renderPreviewPanel()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button 
          variant="outline"
          onClick={generatePreview}
          disabled={!selectedAvatar || isGenerating}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        
        <Button 
          onClick={handleExecuteStep}
          disabled={!selectedAvatar}
        >
          <Zap className="w-4 h-4 mr-2" />
          Continuar para TTS
        </Button>
      </div>
    </div>
  )
}