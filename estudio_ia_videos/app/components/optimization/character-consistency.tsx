

'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Switch } from '../ui/switch'
import { 
  User, 
  Lock, 
  Shuffle, 
  Eye, 
  Settings,
  Save,
  Upload,
  Download,
  Palette,
  Camera,
  Lightbulb
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CharacterCard {
  id: string
  name: string
  avatar_id: string
  visual_seed: number
  appearance: {
    style: AppearanceStyle
    age: AppearanceAge
    build: AppearanceBuild
    clothing: AppearanceClothing
  }
  camera_settings: {
    angle: CameraAngle
    height: CameraHeight
    movement: CameraMovement
  }
  lighting: {
    setup: LightingSetup
    direction: LightingDirection
    intensity: number
  }
  consistency_enabled: boolean
  used_in_scenes: string[]
}

const APPEARANCE_STYLES = ['realistic', 'animated', 'cartoon'] as const
type AppearanceStyle = (typeof APPEARANCE_STYLES)[number]

const APPEARANCE_AGES = ['young', 'adult', 'senior'] as const
type AppearanceAge = (typeof APPEARANCE_AGES)[number]

const APPEARANCE_BUILDS = ['slim', 'average', 'sturdy'] as const
type AppearanceBuild = (typeof APPEARANCE_BUILDS)[number]

const APPEARANCE_CLOTHING = ['casual', 'business', 'safety-gear', 'uniform'] as const
type AppearanceClothing = (typeof APPEARANCE_CLOTHING)[number]

const CAMERA_ANGLES = ['close', 'medium', 'wide'] as const
type CameraAngle = (typeof CAMERA_ANGLES)[number]

const CAMERA_HEIGHTS = ['low', 'eye-level', 'high'] as const
type CameraHeight = (typeof CAMERA_HEIGHTS)[number]

const CAMERA_MOVEMENTS = ['static', 'subtle', 'dynamic'] as const
type CameraMovement = (typeof CAMERA_MOVEMENTS)[number]

const LIGHTING_SETUPS = ['natural', 'studio', 'dramatic', 'soft'] as const
type LightingSetup = (typeof LIGHTING_SETUPS)[number]

const LIGHTING_DIRECTIONS = ['front', 'side', 'back', 'mixed'] as const
type LightingDirection = (typeof LIGHTING_DIRECTIONS)[number]

const createGuard = <T extends readonly string[]>(options: T) =>
  (value: string): value is T[number] => options.includes(value as T[number])

const isAppearanceStyle = createGuard(APPEARANCE_STYLES)
const isAppearanceAge = createGuard(APPEARANCE_AGES)
const isAppearanceBuild = createGuard(APPEARANCE_BUILDS)
const isAppearanceClothing = createGuard(APPEARANCE_CLOTHING)
const isCameraAngle = createGuard(CAMERA_ANGLES)
const isCameraHeight = createGuard(CAMERA_HEIGHTS)
const isCameraMovement = createGuard(CAMERA_MOVEMENTS)
const isLightingSetup = createGuard(LIGHTING_SETUPS)
const isLightingDirection = createGuard(LIGHTING_DIRECTIONS)

export default function CharacterConsistency() {
  const [characterCards, setCharacterCards] = useState<CharacterCard[]>([
    {
      id: 'char-1',
      name: 'Carlos - Instrutor Principal',
      avatar_id: 'instructor-male-sp',
      visual_seed: 42,
      appearance: {
        style: 'realistic',
        age: 'adult',
        build: 'average',
        clothing: 'safety-gear'
      },
      camera_settings: {
        angle: 'medium',
        height: 'eye-level',
        movement: 'subtle'
      },
      lighting: {
        setup: 'studio',
        direction: 'front',
        intensity: 0.8
      },
      consistency_enabled: true,
      used_in_scenes: ['Cena 01', 'Cena 05', 'Cena 08']
    }
  ])

  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const handleCreateCharacter = () => {
    const newCard: CharacterCard = {
      id: `char-${Date.now()}`,
      name: 'Novo Personagem',
      avatar_id: 'instructor-female-rj',
      visual_seed: Math.floor(Math.random() * 1000000),
      appearance: {
        style: 'realistic',
        age: 'adult',
        build: 'average',
        clothing: 'business'
      },
      camera_settings: {
        angle: 'medium',
        height: 'eye-level',
        movement: 'subtle'
      },
      lighting: {
        setup: 'natural',
        direction: 'front',
        intensity: 0.7
      },
      consistency_enabled: true,
      used_in_scenes: []
    }

    setCharacterCards([...characterCards, newCard])
    setSelectedCard(newCard.id)
    setIsEditing(true)
    toast.success('Novo personagem criado!')
  }

  const handleSaveCharacter = (cardId: string) => {
    setIsEditing(false)
    toast.success('Configurações de personagem salvas!')
    
    // In production, save to database
    logger.debug('Saving character card', { component: 'CharacterConsistency', cardId })
  }

  const handleGeneratePreview = async (card: CharacterCard) => {
    try {
      toast('Gerando preview do personagem...')
      
      // Simulate avatar generation with consistency settings
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Preview gerado! Verificando consistência...')
      
    } catch (error) {
      logger.error('Preview generation error', error instanceof Error ? error : new Error(String(error)), { component: 'CharacterConsistency', cardId: card.id })
      toast.error('Erro ao gerar preview')
    }
  }

  const handleApplyToScenes = async (card: CharacterCard) => {
    try {
      toast(`Aplicando consistência para ${card.used_in_scenes.length} cenas...`)
      
      // Simulate applying character settings to all scenes
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Consistência aplicada a todas as cenas!')
      
    } catch (error) {
      logger.error('Apply consistency error', error instanceof Error ? error : new Error(String(error)), { component: 'CharacterConsistency', cardId: card.id })
      toast.error('Erro ao aplicar consistência')
    }
  }

  const updateCharacterCard = (cardId: string, updates: Partial<CharacterCard>) => {
    setCharacterCards(cards => 
      cards.map(card => 
        card.id === cardId ? { ...card, ...updates } : card
      )
    )
  }

  const selectedCharacter = characterCards.find(card => card.id === selectedCard)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Consistência de Personagem
          </CardTitle>
          <CardDescription>
            Mantenha aparência consistente dos avatares entre cenas usando seed locking
          </CardDescription>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreateCharacter}>
              <User className="w-4 h-4 mr-2" />
              Novo Personagem
            </Button>
            
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Importar Config
            </Button>
            
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Tudo
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Character Cards List */}
        <div className="space-y-4">
          <h3 className="font-semibold">Personagens Criados</h3>
          
          {characterCards.map((card) => (
            <Card 
              key={card.id}
              className={`cursor-pointer transition-all ${
                selectedCard === card.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedCard(card.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{card.name}</h4>
                    <p className="text-xs text-gray-600">
                      Seed: {card.visual_seed}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {card.consistency_enabled ? (
                      <Lock className="w-4 h-4 text-green-600" />
                    ) : (
                      <Shuffle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {card.appearance.style}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {card.camera_settings.angle}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {card.lighting.setup}
                  </Badge>
                </div>

                <div className="text-xs text-gray-500">
                  {card.used_in_scenes.length} cenas usando este personagem
                </div>
              </CardContent>
            </Card>
          ))}

          {characterCards.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Nenhum personagem criado
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Character Editor */}
        <div className="lg:col-span-2">
          {selectedCharacter ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedCharacter.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      {isEditing ? 'Visualizar' : 'Editar'}
                    </Button>
                    
                    <Button 
                      size="sm"
                      onClick={() => handleGeneratePreview(selectedCharacter)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Personagem</Label>
                      <Input 
                        value={selectedCharacter.name}
                        onChange={(e) => updateCharacterCard(selectedCharacter.id, { name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Seed Visual (Consistência)</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="number"
                          value={selectedCharacter.visual_seed}
                          onChange={(e) => updateCharacterCard(selectedCharacter.id, { 
                            visual_seed: parseInt(e.target.value) || 0 
                          })}
                          disabled={!isEditing}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateCharacterCard(selectedCharacter.id, {
                            visual_seed: Math.floor(Math.random() * 1000000)
                          })}
                          disabled={!isEditing}
                        >
                          <Shuffle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ativar Consistência Visual</Label>
                      <p className="text-xs text-gray-600">
                        Garante mesma aparência em todas as cenas
                      </p>
                    </div>
                    <Switch 
                      checked={selectedCharacter.consistency_enabled}
                      onCheckedChange={(checked) => updateCharacterCard(selectedCharacter.id, {
                        consistency_enabled: checked
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <Separator />

                {/* Appearance Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Aparência
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Estilo</Label>
                      <select 
                        value={selectedCharacter.appearance.style}
                        onChange={(e) => {
                          const { value } = e.target
                          if (!isAppearanceStyle(value)) {
                            return
                          }
                          updateCharacterCard(selectedCharacter.id, {
                            appearance: { ...selectedCharacter.appearance, style: value }
                          })
                        }}
                        disabled={!isEditing}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="realistic">Realista</option>
                        <option value="animated">Animado</option>
                        <option value="cartoon">Cartoon</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Idade</Label>
                      <select 
                        value={selectedCharacter.appearance.age}
                        onChange={(e) => {
                          const { value } = e.target
                          if (!isAppearanceAge(value)) {
                            return
                          }
                          updateCharacterCard(selectedCharacter.id, {
                            appearance: { ...selectedCharacter.appearance, age: value }
                          })
                        }}
                        disabled={!isEditing}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="young">Jovem</option>
                        <option value="adult">Adulto</option>
                        <option value="senior">Sênior</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Físico</Label>
                      <select 
                        value={selectedCharacter.appearance.build}
                        onChange={(e) => {
                          const { value } = e.target
                          if (!isAppearanceBuild(value)) {
                            return
                          }
                          updateCharacterCard(selectedCharacter.id, {
                            appearance: { ...selectedCharacter.appearance, build: value }
                          })
                        }}
                        disabled={!isEditing}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="slim">Magro</option>
                        <option value="average">Médio</option>
                        <option value="sturdy">Robusto</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Vestimenta</Label>
                      <select 
                        value={selectedCharacter.appearance.clothing}
                        onChange={(e) => {
                          const { value } = e.target
                          if (!isAppearanceClothing(value)) {
                            return
                          }
                          updateCharacterCard(selectedCharacter.id, {
                            appearance: { ...selectedCharacter.appearance, clothing: value }
                          })
                        }}
                        disabled={!isEditing}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="casual">Casual</option>
                        <option value="business">Social</option>
                        <option value="safety-gear">EPI</option>
                        <option value="uniform">Uniforme</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Camera Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Configurações de Câmera
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Enquadramento</Label>
                      <select 
                        value={selectedCharacter.camera_settings.angle}
                        onChange={(e) => {
                          const { value } = e.target
                          if (!isCameraAngle(value)) {
                            return
                          }
                          updateCharacterCard(selectedCharacter.id, {
                            camera_settings: { ...selectedCharacter.camera_settings, angle: value }
                          })
                        }}
                        disabled={!isEditing}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="close">Primeiro Plano</option>
                        <option value="medium">Plano Médio</option>
                        <option value="wide">Plano Geral</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Altura da Câmera</Label>
                      <select 
                        value={selectedCharacter.camera_settings.height}
                        onChange={(e) => {
                          const { value } = e.target
                          if (!isCameraHeight(value)) {
                            return
                          }
                          updateCharacterCard(selectedCharacter.id, {
                            camera_settings: { ...selectedCharacter.camera_settings, height: value }
                          })
                        }}
                        disabled={!isEditing}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="low">Contra-plongée</option>
                        <option value="eye-level">Altura dos Olhos</option>
                        <option value="high">Plongée</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Movimento</Label>
                      <select 
                        value={selectedCharacter.camera_settings.movement}
                        onChange={(e) => {
                          const { value } = e.target
                          if (!isCameraMovement(value)) {
                            return
                          }
                          updateCharacterCard(selectedCharacter.id, {
                            camera_settings: { ...selectedCharacter.camera_settings, movement: value }
                          })
                        }}
                        disabled={!isEditing}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="static">Estático</option>
                        <option value="subtle">Sutil</option>
                        <option value="dynamic">Dinâmico</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Lighting Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Iluminação
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Setup de Luz</Label>
                      <select 
                        value={selectedCharacter.lighting.setup}
                        onChange={(e) => {
                          const { value } = e.target
                          if (!isLightingSetup(value)) {
                            return
                          }
                          updateCharacterCard(selectedCharacter.id, {
                            lighting: { ...selectedCharacter.lighting, setup: value }
                          })
                        }}
                        disabled={!isEditing}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="natural">Natural</option>
                        <option value="studio">Estúdio</option>
                        <option value="dramatic">Dramática</option>
                        <option value="soft">Suave</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Direção</Label>
                      <select 
                        value={selectedCharacter.lighting.direction}
                        onChange={(e) => {
                          const { value } = e.target
                          if (!isLightingDirection(value)) {
                            return
                          }
                          updateCharacterCard(selectedCharacter.id, {
                            lighting: { ...selectedCharacter.lighting, direction: value }
                          })
                        }}
                        disabled={!isEditing}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="front">Frontal</option>
                        <option value="side">Lateral</option>
                        <option value="back">Contra-luz</option>
                        <option value="mixed">Mista</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Intensidade</Label>
                      <Input 
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={selectedCharacter.lighting.intensity}
                        onChange={(e) => updateCharacterCard(selectedCharacter.id, {
                          lighting: { ...selectedCharacter.lighting, intensity: parseFloat(e.target.value) }
                        })}
                        disabled={!isEditing}
                      />
                      <div className="text-xs text-gray-600 text-center">
                        {(selectedCharacter.lighting.intensity * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  {isEditing ? (
                    <Button 
                      onClick={() => handleSaveCharacter(selectedCharacter.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => handleGeneratePreview(selectedCharacter)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Gerar Preview
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => handleApplyToScenes(selectedCharacter)}
                        disabled={selectedCharacter.used_in_scenes.length === 0}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Aplicar às Cenas ({selectedCharacter.used_in_scenes.length})
                      </Button>
                    </>
                  )}
                </div>

                {/* Usage Statistics */}
                {selectedCharacter.used_in_scenes.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Uso do Personagem</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.used_in_scenes.map((sceneId) => (
                        <Badge key={sceneId} variant="outline" className="bg-blue-100 text-blue-700">
                          {sceneId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Selecione um Personagem</h3>
                <p className="text-gray-600 mb-4">
                  Escolha um personagem para editar suas configurações
                </p>
                <Button onClick={handleCreateCharacter}>
                  <User className="w-4 h-4 mr-2" />
                  Criar Primeiro Personagem
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dicas de Consistência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h5 className="font-medium text-green-900">✅ Melhores Práticas</h5>
              <ul className="space-y-1 text-green-800">
                <li>• Use o mesmo seed para todas as cenas</li>
                <li>• Mantenha configurações de câmera similares</li>
                <li>• Aplique iluminação consistente</li>
                <li>• Teste preview antes de render final</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-blue-900">💡 Otimizações</h5>
              <ul className="space-y-1 text-blue-800">
                <li>• Character cards reduzem tempo de setup</li>
                <li>• Seed locking melhora qualidade visual</li>
                <li>• Presets aceleram configuração</li>
                <li>• Batch processing economiza custos</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-orange-900">⚠️ Atenção</h5>
              <ul className="space-y-1 text-orange-800">
                <li>• Mudanças de seed alteram aparência</li>
                <li>• Teste sempre em resolução baixa primeiro</li>
                <li>• Backup das configurações importantes</li>
                <li>• Monitor custos em projetos longos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
