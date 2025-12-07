// TODO: Alinhar Avatar3D com AvatarDefinition do pipeline

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Slider } from '../ui/slider'
import { 
  User, 
  Crown, 
  Play, 
  Star, 
  Filter,
  Palette,
  Settings2,
  Sparkles
} from 'lucide-react'
import Image from 'next/image'
import { avatar3DPipeline } from '../../lib/avatar-3d-pipeline'

// Interface compatível com pipeline hiper-realista
interface Avatar3D {
  id: string
  name: string
  category: 'business' | 'healthcare' | 'education' | 'casual' | 'safety'
  gender: 'male' | 'female' | 'unisex'
  ethnicity: 'caucasian' | 'afro' | 'asian' | 'latino' | 'mixed'
  age: 'young' | 'adult' | 'senior'
  quality: 'standard' | 'premium' | 'cinematic' | 'hyperreal'
  features: {
    facialDetails: 'high' | 'ultra' | 'cinematic'
    skinTexture: 'procedural' | 'scanned' | 'photogrammetry'
    hairSystem: 'strand' | 'cards' | 'volumetric'
    lipSyncAccuracy: number
  }
  appearance?: Record<string, unknown> // For backward compatibility
  specializations?: string[]
  premium?: boolean
  model_quality?: string
  popularity_score?: number
}

interface AvatarCustomization {
  avatar_base_id: string
  pose_style?: 'dinamico' | 'estatico' | 'interativo'
  expression_intensity?: 'suave' | 'moderado' | 'intenso'
  gesture_frequency?: 'baixa' | 'media' | 'alta'
  eye_contact_level?: 'direto' | 'natural' | 'ocasional'
}

interface Avatar3DSelectorProps {
  onAvatarSelect: (avatar: Avatar3D, customization?: AvatarCustomization) => void
  selectedAvatar?: Avatar3D
  contentType?: 'nr' | 'corporate' | 'general'
}

const POSE_STYLE_OPTIONS = ['dinamico', 'estatico', 'interativo'] as const
type PoseStyleOption = typeof POSE_STYLE_OPTIONS[number]

const isPoseStyleOption = (value: string): value is PoseStyleOption => {
  return POSE_STYLE_OPTIONS.some(option => option === value)
}

const GESTURE_FREQUENCY_OPTIONS = ['baixa', 'media', 'alta'] as const
type GestureFrequencyOption = typeof GESTURE_FREQUENCY_OPTIONS[number]

const isGestureFrequencyOption = (value: string): value is GestureFrequencyOption => {
  return GESTURE_FREQUENCY_OPTIONS.some(option => option === value)
}

const EYE_CONTACT_OPTIONS = ['direto', 'natural', 'ocasional'] as const
type EyeContactOption = typeof EYE_CONTACT_OPTIONS[number]

const isEyeContactOption = (value: string): value is EyeContactOption => {
  return EYE_CONTACT_OPTIONS.some(option => option === value)
}

const intensityToSliderValue = (
  intensity: AvatarCustomization['expression_intensity'] | undefined
): 1 | 2 | 3 => {
  if (intensity === 'suave') {
    return 1
  }

  if (intensity === 'intenso') {
    return 3
  }

  return 2
}

const sliderValueToIntensity = (
  value: number
): NonNullable<AvatarCustomization['expression_intensity']> => {
  if (value <= 1) {
    return 'suave'
  }

  if (value >= 3) {
    return 'intenso'
  }

  return 'moderado'
}

const mapToAvatar3D = (def: any): Avatar3D => ({
  id: def.id,
  name: def.name,
  category: (def.metadata?.category as any) || 'business',
  gender: def.gender === 'male' ? 'male' : 'female',
  ethnicity: (def.metadata?.ethnicity as any) || 'caucasian',
  age: 'adult',
  quality: def.engine === 'ue5' || def.engine === 'heygen' ? 'hyperreal' : 'standard',
  features: {
    facialDetails: 'high',
    skinTexture: 'scanned',
    hairSystem: 'strand',
    lipSyncAccuracy: 95
  },
  model_quality: 'High',
  appearance: def.metadata
})

export default function Avatar3DSelector({ onAvatarSelect, selectedAvatar, contentType = 'general' }: Avatar3DSelectorProps) {
  const [avatars, setAvatars] = useState<Avatar3D[]>([])
  const [filteredAvatars, setFilteredAvatars] = useState<Avatar3D[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('recommended')
  const [customization, setCustomization] = useState<AvatarCustomization | null>(null)
  const [previewMode, setPreviewMode] = useState<'grid' | 'detailed'>('grid')

  useEffect(() => {
    // Carregar avatares hiper-realistas
    const allAvatars = avatar3DPipeline.getAllAvatars().map(mapToAvatar3D)
    setAvatars(allAvatars)
    
    // Filtrar por categoria padrão
    const categoryMap: Record<string, string> = {
      'nr': 'safety',
      'corporate': 'business', 
      'general': 'business'
    }
    
    const recommendedDefs = avatar3DPipeline.getAvatarsByCategory(categoryMap[contentType] || 'business')
    const recommended = recommendedDefs.map(mapToAvatar3D)
    setFilteredAvatars(recommended)
  }, [contentType])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    
    let filteredDefs: any[] = []
    
    switch (category) {
      case 'recommended':
        // Recomendar baseado no tipo de conteúdo
        const categoryMap: Record<string, unknown> = {
          'nr': 'safety',
          'corporate': 'business', 
          'general': 'business'
        }
        filteredDefs = avatar3DPipeline.getAvatarsByCategory((categoryMap[contentType] as string) || 'business')
        break
      case 'technical':
        filteredDefs = avatar3DPipeline.getAvatarsByCategory('safety')
        break
      case 'professional':
        filteredDefs = avatar3DPipeline.getAvatarsByCategory('business')
        break
      case 'executive':
        filteredDefs = avatar3DPipeline.getAvatarsByCategory('business')
        break
      case 'instructor':
        filteredDefs = avatar3DPipeline.getAvatarsByCategory('education')
        break
      case 'all':
        filteredDefs = avatar3DPipeline.getAllAvatars()
        break
      default:
        filteredDefs = avatar3DPipeline.getAllAvatars()
    }
    
    setFilteredAvatars(filteredDefs.map(mapToAvatar3D))
  }

  const handleAvatarSelection = (avatar: Avatar3D) => {
    setCustomization({
      avatar_base_id: avatar.id,
      pose_style: 'dinamico',
      expression_intensity: 'moderado',
      gesture_frequency: 'media',
      eye_contact_level: 'natural'
    })
    onAvatarSelect(avatar, customization || undefined)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">🎭 Avatares 3D Hiper-Realistas</h3>
          <p className="text-sm text-muted-foreground">
            Qualidade cinematográfica com Ray Tracing UE5 ({filteredAvatars.length} disponíveis)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={previewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('grid')}
          >
            Grade
          </Button>
          <Button
            variant={previewMode === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('detailed')}
          >
            Detalhado
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommended">🎯 Recomendados</SelectItem>
            <SelectItem value="technical">🔧 Técnicos</SelectItem>
            <SelectItem value="professional">👔 Profissionais</SelectItem>
            <SelectItem value="executive">🏢 Executivos</SelectItem>
            <SelectItem value="instructor">👨‍🏫 Instrutores</SelectItem>
            <SelectItem value="all">📋 Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Avatares */}
      <Tabs defaultValue="select" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="select">Selecionar Avatar</TabsTrigger>
          <TabsTrigger value="customize">Personalizar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="select" className="space-y-4">
          <div className={previewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
            : "space-y-4"
          }>
            {filteredAvatars.map((avatar) => (
              <Card 
                key={avatar.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedAvatar?.id === avatar.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleAvatarSelection(avatar)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{avatar.name}</CardTitle>
                    {avatar.quality === 'hyperreal' && <Crown className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {avatar.gender}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {avatar.category}
                    </Badge>
                    <Badge className="bg-red-500 text-white text-xs">
                      {avatar.quality.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Avatar Preview Placeholder */}
                  <div className="relative aspect-[3/4] bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                    <User className="h-12 w-12 text-blue-400" />
                    <Badge className="absolute top-2 right-2 text-xs">
                      {avatar.model_quality}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Qualidade</span>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-red-500" />
                        <span className="text-red-600 font-bold">{avatar.quality.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Lip Sync: {avatar.features.lipSyncAccuracy}% • Textura: {avatar.features.skinTexture}
                    </div>
                    
                    {previewMode === 'detailed' && (
                      <div className="pt-2 border-t space-y-1">
                        <p className="text-xs"><strong>Detalhes Faciais:</strong> {avatar.features.facialDetails}</p>
                        <p className="text-xs"><strong>Sistema Capilar:</strong> {avatar.features.hairSystem}</p>
                        <p className="text-xs"><strong>Idade:</strong> {avatar.age}</p>
                        <p className="text-xs"><strong>Etnia:</strong> {avatar.ethnicity}</p>
                      </div>
                    )}
                  </div>
                  
                  <Button size="sm" className="w-full mt-3" variant="outline">
                    <Play className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="customize" className="space-y-6">
          {selectedAvatar ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Personalizar {selectedAvatar.name}
                </CardTitle>
                <CardDescription>
                  Ajuste as características do avatar para seu projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Estilo de Pose */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Estilo de Pose</label>
                  <Select
                    value={customization?.pose_style || 'dinamico'}
                    onValueChange={(value) =>
                      setCustomization(prev => {
                        if (!prev || !isPoseStyleOption(value)) {
                          return prev
                        }

                        return { ...prev, pose_style: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinamico">🎯 Dinâmico - Gestos expressivos</SelectItem>
                      <SelectItem value="estatico">📋 Estático - Postura formal</SelectItem>
                      <SelectItem value="interativo">🤝 Interativo - Engajamento alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Intensidade de Expressão */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Intensidade de Expressão: {customization?.expression_intensity || 'moderado'}
                  </label>
                  <Slider
                    value={[intensityToSliderValue(customization?.expression_intensity)]}
                    onValueChange={(value) => {
                      const nextValue = sliderValueToIntensity(value[0])
                      setCustomization(prev => (prev ? { ...prev, expression_intensity: nextValue } : null))
                    }}
                    max={3}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Suave</span>
                    <span>Moderado</span>
                    <span>Intenso</span>
                  </div>
                </div>

                {/* Frequência de Gestos */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Frequência de Gestos</label>
                  <Select
                    value={customization?.gesture_frequency || 'media'}
                    onValueChange={(value) =>
                      setCustomization(prev => {
                        if (!prev || !isGestureFrequencyOption(value)) {
                          return prev
                        }

                        return { ...prev, gesture_frequency: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">🤏 Baixa - Gestos mínimos</SelectItem>
                      <SelectItem value="media">✋ Média - Equilibrado</SelectItem>
                      <SelectItem value="alta">🙌 Alta - Muito expressivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contato Visual */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Nível de Contato Visual</label>
                  <Select
                    value={customization?.eye_contact_level || 'natural'}
                    onValueChange={(value) =>
                      setCustomization(prev => {
                        if (!prev || !isEyeContactOption(value)) {
                          return prev
                        }

                        return { ...prev, eye_contact_level: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direto">👁️ Direto - Olhar fixo na câmera</SelectItem>
                      <SelectItem value="natural">😊 Natural - Olhar variado</SelectItem>
                      <SelectItem value="ocasional">👀 Ocasional - Olhar sutil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={() => selectedAvatar && onAvatarSelect(selectedAvatar, customization || undefined)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Aplicar Personalização
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Selecione um avatar para personalizar</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

