

'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Slider } from '../ui/slider'
import { 
  Volume2, 
  Play, 
  Pause,
  MapPin, 
  Crown,
  Heart,
  Star,
  Filter
} from 'lucide-react'
import { BrazilianRegionalTTS, BrazilianVoiceRegional } from '../../lib/tts/brazilian-regional-tts'

interface BrazilianVoiceSelectorProps {
  onVoiceSelect: (voice: BrazilianVoiceRegional, settings: VoiceSettings) => void
  selectedVoice?: BrazilianVoiceRegional
  contentType?: 'nr' | 'treinamento' | 'apresentacao' | 'marketing'
  targetAudience?: string
}

const voiceEmotions = ['neutro', 'animado', 'serio', 'preocupado'] as const
type VoiceEmotion = typeof voiceEmotions[number]

const isVoiceEmotion = (value: string): value is VoiceEmotion =>
  voiceEmotions.some((emotion) => emotion === value)

interface VoiceSettings {
  speed: number
  emotion: VoiceEmotion
  regional_expressions: boolean
  emphasis_level: number
}

export default function BrazilianVoiceSelector({ 
  onVoiceSelect, 
  selectedVoice, 
  contentType = 'treinamento',
  targetAudience = 'funcionarios' 
}: BrazilianVoiceSelectorProps) {
  
  const [voices, setVoices] = useState<BrazilianVoiceRegional[]>([])
  const [filteredVoices, setFilteredVoices] = useState<BrazilianVoiceRegional[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    speed: 1.0,
    emotion: 'neutro',
    regional_expressions: true,
    emphasis_level: 5
  })

  useEffect(() => {
    // Carregar vozes recomendadas para o tipo de conteúdo
    const recommended = BrazilianRegionalTTS.getRecommendedVoiceForContent(contentType, targetAudience)
    setVoices(BrazilianRegionalTTS.REGIONAL_VOICES)
    setFilteredVoices(recommended)
  }, [contentType, targetAudience])

  const handleRegionFilter = (region: string) => {
    setSelectedRegion(region)
    applyFilters(region, selectedGender)
  }

  const handleGenderFilter = (gender: string) => {
    setSelectedGender(gender)
    applyFilters(selectedRegion, gender)
  }

  const applyFilters = (region: string, gender: string) => {
    let filtered = voices

    if (region !== 'all') {
      filtered = filtered.filter(v => v.region.name === region)
    }

    if (gender !== 'all') {
      filtered = filtered.filter(v => v.characteristics.gender === gender)
    }

    // Ordenar por tier gratuito primeiro, depois por qualidade
    filtered.sort((a, b) => {
      if (a.pricing_tier === 'gratuito' && b.pricing_tier !== 'gratuito') return -1
      if (b.pricing_tier === 'gratuito' && a.pricing_tier !== 'gratuito') return 1
      
      const qualityOrder = { 'studio': 3, 'premium': 2, 'standard': 1 }
      return qualityOrder[b.audio_quality.neural_quality] - qualityOrder[a.audio_quality.neural_quality]
    })

    setFilteredVoices(filtered)
  }

  const handlePlayVoice = async (voice: BrazilianVoiceRegional) => {
    setPlayingVoice(voice.id)
    
    try {
      // Simular preview da voz
      const audio = new Audio('/sounds/voice-preview-placeholder.mp3')
      audio.play()
      
      setTimeout(() => {
        setPlayingVoice(null)
      }, 3000)
    } catch (error) {
      logger.error('Erro ao reproduzir preview', error instanceof Error ? error : new Error(String(error)), { component: 'BrazilianVoiceSelector' })
      setPlayingVoice(null)
    }
  }

  const handleVoiceSelection = (voice: BrazilianVoiceRegional) => {
    onVoiceSelect(voice, voiceSettings)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-blue-500" />
            Vozes Regionais Brasileiras
          </h3>
          <p className="text-sm text-muted-foreground">
            Escolha uma voz com sotaque regional autêntico ({filteredVoices.length} disponíveis)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedRegion} onValueChange={handleRegionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por região" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🇧🇷 Todas as Regiões</SelectItem>
            <SelectItem value="Sudeste">🏙️ Sudeste</SelectItem>
            <SelectItem value="Nordeste">🌅 Nordeste</SelectItem>
            <SelectItem value="Sul">🌾 Sul</SelectItem>
            <SelectItem value="Norte">🌳 Norte</SelectItem>
            <SelectItem value="Centro-Oeste">🌱 Centro-Oeste</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedGender} onValueChange={handleGenderFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Gênero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">👥 Todos</SelectItem>
            <SelectItem value="masculino">👨 Masculino</SelectItem>
            <SelectItem value="feminino">👩 Feminino</SelectItem>
            <SelectItem value="neutro">⚡ Neutro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Vozes */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVoices.map((voice) => (
            <Card 
              key={voice.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedVoice?.id === voice.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleVoiceSelection(voice)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{voice.display_name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {voice.pricing_tier === 'gratuito' && (
                      <Badge variant="secondary" className="text-xs">Grátis</Badge>
                    )}
                    {voice.pricing_tier === 'premium' && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
                <CardDescription className="text-xs flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {voice.region.state} • {voice.region.accent_description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                {/* Características */}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {voice.characteristics.age_group}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {voice.characteristics.tone}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {voice.audio_quality.neural_quality}
                  </Badge>
                </div>
                
                {/* Especialidades */}
                <div className="text-xs text-muted-foreground">
                  <strong>Especialidades:</strong> {voice.specialties.content_types.join(', ')}
                </div>
                
                {/* Preview Text */}
                <div className="bg-muted/50 rounded p-2 text-xs italic">
                  "{voice.preview_text}"
                </div>
                
                {/* Ações */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayVoice(voice)
                    }}
                    disabled={playingVoice === voice.id}
                  >
                    {playingVoice === voice.id ? (
                      <Pause className="h-3 w-3 mr-1" />
                    ) : (
                      <Play className="h-3 w-3 mr-1" />
                    )}
                    {playingVoice === voice.id ? 'Tocando...' : 'Ouvir'}
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVoiceSelection(voice)
                    }}
                    className="flex-1"
                  >
                    Selecionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Configurações de Voz */}
      {selectedVoice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações de Voz</CardTitle>
            <CardDescription>
              Ajuste os parâmetros para {selectedVoice.display_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Velocidade */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Velocidade</label>
                <span className="text-sm text-muted-foreground">{voiceSettings.speed}x</span>
              </div>
              <Slider
                value={[voiceSettings.speed]}
                onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, speed: value[0] }))}
                max={2.0}
                min={0.5}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5x (Lento)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Rápido)</span>
              </div>
            </div>

            {/* Emoção */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Emoção</label>
              <Select 
                value={voiceSettings.emotion}
                onValueChange={(value) => {
                  if (isVoiceEmotion(value)) {
                    setVoiceSettings(prev => ({ ...prev, emotion: value }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutro">😐 Neutro</SelectItem>
                  <SelectItem value="animado">😊 Animado</SelectItem>
                  <SelectItem value="serio">🧐 Sério</SelectItem>
                  <SelectItem value="preocupado">😟 Preocupado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expressões Regionais */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Expressões Regionais</label>
                <p className="text-xs text-muted-foreground">Usar gírias e expressões típicas da região</p>
              </div>
              <Button
                variant={voiceSettings.regional_expressions ? "default" : "outline"}
                size="sm"
                onClick={() => setVoiceSettings(prev => ({ 
                  ...prev, 
                  regional_expressions: !prev.regional_expressions 
                }))}
              >
                {voiceSettings.regional_expressions ? 'Ativado' : 'Desativado'}
              </Button>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  )
}

