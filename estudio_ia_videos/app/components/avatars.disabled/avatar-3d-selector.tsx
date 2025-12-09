

'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'
import { 
  Users, 
  Play, 
  Crown, 
  Search,
  Filter,
  Volume2,
  Settings,
  Sparkles,
  User,
  Briefcase,
  Heart
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Avatar3D {
  id: string
  name: string
  type: 'realistic' | 'cartoon' | 'mascot'
  gender: 'male' | 'female' | 'neutral'
  ethnicity: string
  profession: string
  is_premium: boolean
  default_voice: string
}

export default function Avatar3DSelector({ 
  onAvatarSelect,
  selectedAvatarId 
}: {
  onAvatarSelect: (avatar: Avatar3D) => void
  selectedAvatarId?: string
}) {
  const [avatars, setAvatars] = useState<Avatar3D[]>([])
  const [filteredAvatars, setFilteredAvatars] = useState<Avatar3D[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: 'all',
    gender: 'all',
    profession: 'all',
    premium: 'all'
  })
  const [previewAudio, setPreviewAudio] = useState<string | null>(null)

  useEffect(() => {
    fetchAvatars()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [avatars, searchTerm, filters])

  const fetchAvatars = async () => {
    try {
      const response = await fetch('/api/avatars/3d-render')
      const result = await response.json()
      
      if (result.success) {
        setAvatars(result.data.avatars)
        setFilteredAvatars(result.data.avatars)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      logger.error('Error fetching avatars:', error instanceof Error ? error : new Error(String(error)), { component: 'Avatar3DSelector' })
      toast.error('Erro ao carregar avatares')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = avatars

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(avatar => 
        avatar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        avatar.profession.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(avatar => avatar.type === filters.type)
    }

    // Gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(avatar => avatar.gender === filters.gender)
    }

    // Profession filter
    if (filters.profession !== 'all') {
      filtered = filtered.filter(avatar => avatar.profession === filters.profession)
    }

    // Premium filter
    if (filters.premium !== 'all') {
      const isPremium = filters.premium === 'premium'
      filtered = filtered.filter(avatar => avatar.is_premium === isPremium)
    }

    setFilteredAvatars(filtered)
  }

  const handleAvatarClick = (avatar: Avatar3D) => {
    onAvatarSelect(avatar)
    toast.success(`Avatar ${avatar.name} selecionado!`)
  }

  const handleVoicePreview = async (avatar: Avatar3D) => {
    try {
      setPreviewAudio(avatar.id)
      
      // Generate preview TTS
      const response = await fetch('/api/tts/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Olá! Eu sou ${avatar.name}, e vou te ajudar com o treinamento de segurança do trabalho.`,
          voice: avatar.default_voice,
          speed: 1.0
        })
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          setPreviewAudio(null)
          URL.revokeObjectURL(audioUrl)
        }
        
        await audio.play()
        
      } else {
        throw new Error('Failed to generate preview')
      }
      
    } catch (error) {
      logger.error('Voice preview error:', error instanceof Error ? error : new Error(String(error)), { component: 'Avatar3DSelector' })
      toast.error('Erro ao reproduzir prévia da voz')
      setPreviewAudio(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'realistic': return <User className="w-4 h-4" />
      case 'cartoon': return <Sparkles className="w-4 h-4" />
      case 'mascot': return <Heart className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'realistic': return 'Realista'
      case 'cartoon': return 'Animado'
      case 'mascot': return 'Mascote'
      default: return type
    }
  }

  const getProfessionLabel = (profession: string) => {
    switch (profession) {
      case 'instructor': return 'Instrutor'
      case 'engineer': return 'Engenheiro'
      case 'supervisor': return 'Supervisor'
      case 'worker': return 'Trabalhador'
      case 'mascot': return 'Mascote'
      default: return profession
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando avatares 3D...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Biblioteca de Avatares 3D
          </CardTitle>
          <CardDescription>
            Escolha o avatar ideal para seu treinamento de segurança
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar avatares..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select 
              value={filters.type} 
              onValueChange={(value) => setFilters({...filters, type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="realistic">Realista</SelectItem>
                <SelectItem value="cartoon">Animado</SelectItem>
                <SelectItem value="mascot">Mascote</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.gender} 
              onValueChange={(value) => setFilters({...filters, gender: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="neutral">Neutro</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.profession} 
              onValueChange={(value) => setFilters({...filters, profession: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Profissão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="instructor">Instrutor</SelectItem>
                <SelectItem value="engineer">Engenheiro</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="worker">Trabalhador</SelectItem>
                <SelectItem value="mascot">Mascote</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.premium} 
              onValueChange={(value) => setFilters({...filters, premium: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="free">Gratuitos</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredAvatars.length} de {avatars.length} avatares
          </div>
        </CardContent>
      </Card>

      {/* Avatars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAvatars.map((avatar) => (
          <Card 
            key={avatar.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedAvatarId === avatar.id ? 'ring-2 ring-blue-500 border-blue-200' : ''
            }`}
            onClick={() => handleAvatarClick(avatar)}
          >
            <CardContent className="pt-4">
              {/* Avatar Preview */}
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                {/* 3D Avatar Preview would go here - using placeholder for now */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  {getTypeIcon(avatar.type)}
                  <span className="text-white font-bold text-xl ml-1">
                    {avatar.name.charAt(0)}
                  </span>
                </div>
                
                {avatar.is_premium && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-900">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>

              {/* Avatar Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">{avatar.name}</h3>
                  <p className="text-sm text-gray-600">
                    {getProfessionLabel(avatar.profession)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(avatar.type)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {avatar.gender === 'male' ? 'Masculino' : 
                     avatar.gender === 'female' ? 'Feminino' : 'Neutro'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Brasileiro
                  </Badge>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVoicePreview(avatar)
                    }}
                    disabled={previewAudio === avatar.id}
                  >
                    {previewAudio === avatar.id ? (
                      <>
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1" />
                        Reproduzindo
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 mr-1" />
                        Voz
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Avatar customization modal would open here
                      toast('Personalização em desenvolvimento')
                    }}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>

                {selectedAvatarId === avatar.id && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Avatar Selecionado
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Pronto para usar no editor de vídeos
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAvatars.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Nenhum avatar encontrado</h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros de busca
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setFilters({
                  type: 'all',
                  gender: 'all', 
                  profession: 'all',
                  premium: 'all'
                })
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Avatar Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estatísticas da Biblioteca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {avatars.filter(a => a.type === 'realistic').length}
              </div>
              <p className="text-xs text-gray-600">Realistas</p>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {avatars.filter(a => a.type === 'cartoon').length}
              </div>
              <p className="text-xs text-gray-600">Animados</p>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-600">
                {avatars.filter(a => a.type === 'mascot').length}
              </div>
              <p className="text-xs text-gray-600">Mascotes</p>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {avatars.filter(a => a.is_premium).length}
              </div>
              <p className="text-xs text-gray-600">Premium</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
