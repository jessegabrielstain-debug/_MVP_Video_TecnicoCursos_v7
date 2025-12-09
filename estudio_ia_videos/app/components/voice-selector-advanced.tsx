'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Volume2, 
  Play, 
  Pause, 
  Search, 
  Filter, 
  Star,
  MapPin,
  User,
  Zap,
  Crown,
  Heart
} from 'lucide-react'
import { VoiceRegional } from '../lib/voice-library-advanced'
import { toast } from 'react-hot-toast'

interface VoiceStats {
  total: number;
  premium: number;
  byRegion: Record<string, number>;
}

interface AdvancedVoiceSelectorProps {
  selectedVoiceId: string
  onVoiceSelect: (voiceId: string) => void
  contentType?: 'technical' | 'corporate' | 'training' | 'safety'
  nr?: string
  showRecommendations?: boolean
}

export default function AdvancedVoiceSelector({
  selectedVoiceId,
  onVoiceSelect,
  contentType,
  nr,
  showRecommendations = true
}: AdvancedVoiceSelectorProps) {
  const [voices, setVoices] = useState<VoiceRegional[]>([])
  const [recommendations, setRecommendations] = useState<VoiceRegional[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  
  // Filtros
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)

  const [stats, setStats] = useState<VoiceStats | null>(null)

  useEffect(() => {
    loadVoices()
    if (showRecommendations && (contentType || nr)) {
      loadRecommendations()
    }
  }, [contentType, nr])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, selectedGender, selectedRegion, selectedSpecialty, showPremiumOnly])

  const loadVoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/voices/advanced')
      const data = await response.json()
      
      if (data.success) {
        setVoices(data.voices)
        setStats(data.stats)
      } else {
        toast.error('Erro ao carregar vozes')
      }
    } catch (error) {
      logger.error('Error loading voices', error instanceof Error ? error : new Error(String(error)), { component: 'AdvancedVoiceSelector' })
      toast.error('Erro na conexão')
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/voices/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, nr })
      })
      
      const data = await response.json()
      if (data.success) {
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      logger.error('Error loading recommendations', error instanceof Error ? error : new Error(String(error)), { contentType, nr, component: 'AdvancedVoiceSelector' })
    }
  }

  const applyFilters = () => {
    if (!voices.length) return

    const params = new URLSearchParams()
    if (selectedGender !== 'all') params.append('gender', selectedGender)
    if (selectedRegion !== 'all') params.append('region', selectedRegion)
    if (selectedSpecialty !== 'all') params.append('specialty', selectedSpecialty)
    if (showPremiumOnly) params.append('premium', 'true')

    // Para demonstração, aplicamos filtros localmente
    // Em produção, faria nova requisição à API
    const filtered = voices.filter(voice => {
      if (searchTerm && !voice.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      if (selectedGender !== 'all' && voice.gender !== selectedGender) return false
      if (selectedRegion !== 'all' && voice.region !== selectedRegion) return false
      if (selectedSpecialty !== 'all' && voice.specialty !== selectedSpecialty) return false
      if (showPremiumOnly && !voice.premium) return false
      return true
    })

    // Atualizar estado com vozes filtradas (simulado)
    // Em implementação real, faria nova call para API
  }

  const playVoiceSample = async (voiceId: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null)
      return
    }

    setPlayingVoice(voiceId)
    
    // Simular reprodução de amostra de voz
    setTimeout(() => {
      setPlayingVoice(null)
      toast.success('Sample de voz reproduzido')
    }, 3000)
  }

  const getRegionIcon = (region: string) => {
    const icons = {
      'sul': '🌾',
      'sudeste': '🏙️', 
      'nordeste': '🌴',
      'norte': '🌳',
      'centro-oeste': '🌻',
      'nacional': '🇧🇷'
    }
    return icons[region as keyof typeof icons] || '📍'
  }

  const getSpecialtyColor = (specialty: string) => {
    const colors = {
      'technical': 'bg-blue-100 text-blue-800',
      'corporate': 'bg-gray-100 text-gray-800',
      'friendly': 'bg-green-100 text-green-800',
      'authoritative': 'bg-red-100 text-red-800',
      'educational': 'bg-purple-100 text-purple-800'
    }
    return colors[specialty as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando biblioteca de vozes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Biblioteca de Vozes Avançada</h3>
          <p className="text-sm text-gray-600">
            {stats && `${stats.total} vozes disponíveis • ${stats.premium} premium`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Português BR
          </Badge>
          {stats && (
            <Badge variant="secondary" className="text-xs">
              {Object.values(stats.byRegion as Record<string, number>).length} regiões
            </Badge>
          )}
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, região ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Select value={selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="neutral">Neutro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regiões</SelectItem>
              <SelectItem value="sul">Sul</SelectItem>
              <SelectItem value="sudeste">Sudeste</SelectItem>
              <SelectItem value="nordeste">Nordeste</SelectItem>
              <SelectItem value="norte">Norte</SelectItem>
              <SelectItem value="centro-oeste">Centro-Oeste</SelectItem>
              <SelectItem value="nacional">Nacional</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Especialidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="technical">Técnica</SelectItem>
              <SelectItem value="corporate">Corporativa</SelectItem>
              <SelectItem value="friendly">Amigável</SelectItem>
              <SelectItem value="authoritative">Autoridade</SelectItem>
              <SelectItem value="educational">Educativa</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showPremiumOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPremiumOnly(!showPremiumOnly)}
          >
            <Crown className="w-4 h-4 mr-1" />
            Premium
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="text-sm">
            Todas ({voices.length})
          </TabsTrigger>
          {showRecommendations && (
            <TabsTrigger value="recommended" className="text-sm">
              <Star className="w-4 h-4 mr-1" />
              Recomendadas ({recommendations.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="favorites" className="text-sm">
            <Heart className="w-4 h-4 mr-1" />
            Favoritas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {voices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                isSelected={selectedVoiceId === voice.id}
                isPlaying={playingVoice === voice.id}
                onSelect={() => onVoiceSelect(voice.id)}
                onPlay={() => playVoiceSample(voice.id)}
                getRegionIcon={getRegionIcon}
                getSpecialtyColor={getSpecialtyColor}
              />
            ))}
          </div>
        </TabsContent>

        {showRecommendations && (
          <TabsContent value="recommended" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                🎯 Vozes Recomendadas {nr && `para ${nr}`}
              </h4>
              <p className="text-sm text-blue-700">
                Selecionadas especialmente para {contentType === 'technical' ? 'conteúdo técnico' : 
                contentType === 'corporate' ? 'apresentações corporativas' :
                contentType === 'safety' ? 'treinamentos de segurança' :
                'treinamentos educacionais'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((voice) => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  isSelected={selectedVoiceId === voice.id}
                  isPlaying={playingVoice === voice.id}
                  onSelect={() => onVoiceSelect(voice.id)}
                  onPlay={() => playVoiceSample(voice.id)}
                  getRegionIcon={getRegionIcon}
                  getSpecialtyColor={getSpecialtyColor}
                  recommended={true}
                />
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="favorites">
          <div className="text-center py-8 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Suas vozes favoritas aparecerão aqui</p>
            <p className="text-sm">Clique no ❤️ para adicionar vozes aos favoritos</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente do card de voz
interface VoiceCardProps {
  voice: VoiceRegional
  isSelected: boolean
  isPlaying: boolean
  onSelect: () => void
  onPlay: () => void
  getRegionIcon: (region: string) => string
  getSpecialtyColor: (specialty: string) => string
  recommended?: boolean
}

function VoiceCard({
  voice,
  isSelected,
  isPlaying,
  onSelect,
  onPlay,
  getRegionIcon,
  getSpecialtyColor,
  recommended = false
}: VoiceCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{voice.name}</h4>
              {voice.premium && <Crown className="w-4 h-4 text-yellow-500" />}
              {recommended && <Star className="w-4 h-4 text-blue-500" />}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <span>{getRegionIcon(voice.region)}</span>
              <span>{voice.accent}</span>
              <User className="w-3 h-3" />
              <span>{voice.gender === 'male' ? 'M' : voice.gender === 'female' ? 'F' : 'N'}</span>
              <span>•</span>
              <span>{voice.age_group}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              <Badge variant="outline" className={`text-xs ${getSpecialtyColor(voice.specialty)}`}>
                {voice.specialty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {voice.tone}
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onPlay()
            }}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>

        {isSelected && (
          <div className="text-xs text-blue-600 font-medium">
            ✓ Voz selecionada
          </div>
        )}
      </CardContent>
    </Card>
  )
}
