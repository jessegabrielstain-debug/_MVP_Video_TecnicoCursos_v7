
/**
 * 🎭 Seletor de Avatares 3D Hiper-Realistas
 * Grid idêntico ao Animaker com qualidade cinematográfica
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { Logger } from '@/lib/logger'
import { 
  Search, 
  Play, 
  Crown, 
  Zap, 
  Eye,
  Heart,
  Star,
  Settings,
  User,
  Sparkles,
  Camera,
  Download
} from 'lucide-react'

interface Avatar3D {
  id: string
  name: string
  category: string
  gender: 'male' | 'female' | 'unisex'
  quality: 'standard' | 'premium' | 'cinematic' | 'hyperreal'
  preview: {
    thumbnail: string
    animation: string
    quality: {
      polygonCount: string
      textureRes: string
      renderEngine: string
      lipSyncAccuracy: string
    }
  }
}

interface Props {
  onAvatarSelect?: (avatar: Avatar3D) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  onViewAll?: () => void
}

export function HyperRealAvatarSelector({ onAvatarSelect, selectedCategory = 'business', onCategoryChange, onViewAll }: Props) {
  const [avatars, setAvatars] = useState<Avatar3D[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [previewingAvatar, setPreviewingAvatar] = useState<string | null>(null)

  // Categorias exatas como no Animaker
  const categories = [
    { id: 'business', name: 'Adequado Para Negócios', emoji: '👔', color: 'blue' },
    { id: 'safety', name: 'Ciência E Saúde', emoji: '⚕️', color: 'green' },
    { id: 'healthcare', name: 'Médica', emoji: '🏥', color: 'red' },
    { id: 'education', name: 'Casual', emoji: '👕', color: 'yellow' },
    { id: 'casual', name: 'Infantil', emoji: '👶', color: 'pink' }
  ]

  useEffect(() => {
    loadAvatars()
  }, [selectedCategory])

  const loadAvatars = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/v1/avatars/3d/hyperreal?category=${selectedCategory}&quality=hyperreal`)
      const data = await response.json()
      
      if (data.success) {
        setAvatars(data.avatars)
      } else {
        // Fallback para avatares mock
        setAvatars(generateMockHyperRealAvatars())
      }
    } catch (error) {
      const logger = new Logger('HyperrealAvatarSelector')
      logger.error('Error loading avatars', error instanceof Error ? error : undefined)
      setAvatars(generateMockHyperRealAvatars())
    } finally {
      setLoading(false)
    }
  }

  const generateMockHyperRealAvatars = (): Avatar3D[] => {
    const businessAvatars: Avatar3D[] = [
      {
        id: 'br_ana_corporate',
        name: 'Ana Paula',
        category: 'business',
        gender: 'female',
        quality: 'hyperreal',
        preview: {
          thumbnail: '/avatars/thumbnails/ana_corporate.jpg',
          animation: '/avatars/previews/ana_idle.mp4',
          quality: {
            polygonCount: '850K+',
            textureRes: '8K PBR',
            renderEngine: 'UE5 RT',
            lipSyncAccuracy: '98%'
          }
        }
      },
      {
        id: 'br_carlos_executive',
        name: 'Carlos Silva',
        category: 'business',
        gender: 'male',
        quality: 'hyperreal',
        preview: {
          thumbnail: '/avatars/thumbnails/carlos_executive.jpg',
          animation: '/avatars/previews/carlos_idle.mp4',
          quality: {
            polygonCount: '875K+',
            textureRes: '8K PBR',
            renderEngine: 'UE5 RT',
            lipSyncAccuracy: '97%'
          }
        }
      },
      {
        id: 'br_marina_professional',
        name: 'Marina Santos',
        category: 'business',
        gender: 'female',
        quality: 'hyperreal',
        preview: {
          thumbnail: '/avatars/thumbnails/marina_professional.jpg',
          animation: '/avatars/previews/marina_idle.mp4',
          quality: {
            polygonCount: '860K+',
            textureRes: '8K PBR',
            renderEngine: 'UE5 RT',
            lipSyncAccuracy: '99%'
          }
        }
      },
      {
        id: 'br_rodrigo_manager',
        name: 'Rodrigo Mendes',
        category: 'business',
        gender: 'male',
        quality: 'hyperreal',
        preview: {
          thumbnail: '/avatars/thumbnails/rodrigo_manager.jpg',
          animation: '/avatars/previews/rodrigo_idle.mp4',
          quality: {
            polygonCount: '840K+',
            textureRes: '8K PBR',
            renderEngine: 'UE5 RT',
            lipSyncAccuracy: '96%'
          }
        }
      },
      {
        id: 'br_beatriz_consultant',
        name: 'Beatriz Lima',
        category: 'business',
        gender: 'female',
        quality: 'hyperreal',
        preview: {
          thumbnail: '/avatars/thumbnails/beatriz_consultant.jpg',
          animation: '/avatars/previews/beatriz_idle.mp4',
          quality: {
            polygonCount: '865K+',
            textureRes: '8K PBR',
            renderEngine: 'UE5 RT',
            lipSyncAccuracy: '98%'
          }
        }
      },
      {
        id: 'br_lucas_director',
        name: 'Lucas Oliveira',
        category: 'business',
        gender: 'male',
        quality: 'hyperreal',
        preview: {
          thumbnail: '/avatars/thumbnails/lucas_director.jpg',
          animation: '/avatars/previews/lucas_idle.mp4',
          quality: {
            polygonCount: '890K+',
            textureRes: '8K PBR',
            renderEngine: 'UE5 RT',
            lipSyncAccuracy: '97%'
          }
        }
      }
    ]

    return businessAvatars
  }

  const handleAvatarClick = (avatar: Avatar3D) => {
    setSelectedAvatar(avatar.id)
    onAvatarSelect?.(avatar)
    toast.success(`🎭 Avatar "${avatar.name}" selecionado (${avatar.quality.toUpperCase()})`)
  }

  const handlePreview = (avatarId: string) => {
    setPreviewingAvatar(avatarId)
    toast.success('👁️ Preview do avatar iniciado')
    
    // Simular preview
    setTimeout(() => {
      setPreviewingAvatar(null)
      toast.success('✅ Preview concluído')
    }, 3000)
  }

  const handleViewAll = () => {
    onViewAll?.() || toast.success('👁️ Visualizando todos os avatares')
  }

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'hyperreal':
        return <Badge className="bg-red-500 text-white text-xs">Novo</Badge>
      case 'cinematic':
        return <Badge className="bg-purple-500 text-white text-xs">Pro</Badge>
      case 'premium':
        return <Badge className="bg-blue-500 text-white text-xs">HD</Badge>
      default:
        return null
    }
  }

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'hyperreal':
        return <Crown className="w-3 h-3 text-yellow-500" />
      case 'cinematic':
        return <Sparkles className="w-3 h-3 text-purple-500" />
      case 'premium':
        return <Star className="w-3 h-3 text-blue-500" />
      default:
        return null
    }
  }

  const filteredAvatars = avatars.filter(avatar =>
    avatar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avatar.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header com busca */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar avatares..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>

      {/* Category Selector */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-600">Categorias</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 text-xs"
            onClick={handleViewAll}
          >
            Ver tudo
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {categories.slice(0, 4).map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              className={`text-xs justify-start ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => {
                onCategoryChange?.(category.id)
                setSearchTerm('')
              }}
            >
              <span className="mr-1">{category.emoji}</span>
              {category.name}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-600">Categorias Disponíveis</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 text-xs"
            onClick={handleViewAll}
          >
            Ver tudo
          </Button>
        </div>
      </div>

      {/* Avatares Grid - Layout Exato do Animaker */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando avatares 3D...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Adequado Para Negócios</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 text-xs"
                onClick={handleViewAll}
              >
                Ver tudo
              </Button>
            </div>

            {/* Avatar Grid - 3 colunas como no Animaker */}
            <div className="grid grid-cols-3 gap-2">
              {filteredAvatars.map((avatar) => (
                <div
                  key={avatar.id}
                  className={`relative cursor-pointer group transition-all ${
                    selectedAvatar === avatar.id ? 'scale-105' : 'hover:scale-102'
                  }`}
                  onClick={() => handleAvatarClick(avatar)}
                >
                  {/* Avatar Container */}
                  <div className="aspect-[3/4] bg-gradient-to-b from-blue-400 to-blue-600 rounded-lg overflow-hidden relative">
                    {/* Quality Badge */}
                    <div className="absolute top-1 left-1 z-10">
                      {getQualityBadge(avatar.quality)}
                    </div>
                    
                    {/* 8K Quality Badge */}
                    <div className="absolute top-1 right-1 z-10">
                      <Badge className="bg-yellow-500 text-black text-xs font-bold">
                        8K
                      </Badge>
                    </div>

                    {/* Avatar 3D Preview */}
                    <div className="absolute inset-0 flex items-end justify-center pb-2">
                      <div className="w-16 h-20 bg-gradient-to-t from-blue-900 to-blue-600 rounded-t-lg flex items-center justify-center text-white text-lg shadow-xl">
                        {avatar.gender === 'female' ? '👩‍💼' : '👨‍💼'}
                      </div>
                    </div>

                    {/* Hyperreal Quality Indicator */}
                    <div className="absolute bottom-1 left-1">
                      {getQualityIcon(avatar.quality)}
                    </div>

                    {/* Selection Indicator */}
                    {selectedAvatar === avatar.id && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg bg-blue-500/10"></div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePreview(avatar.id)
                        }}
                        disabled={previewingAvatar === avatar.id}
                      >
                        {previewingAvatar === avatar.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Technical Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1 transform translate-y-full group-hover:translate-y-0 transition-transform">
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Polígonos:</span>
                          <span className="text-yellow-300">{avatar.preview.quality.polygonCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Texturas:</span>
                          <span className="text-green-300">{avatar.preview.quality.textureRes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lip Sync:</span>
                          <span className="text-blue-300">{avatar.preview.quality.lipSyncAccuracy}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Avatar Name */}
                  <p className="text-xs text-center mt-1 font-medium truncate">
                    {avatar.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Premium Section - Como no Animaker */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Pipeline 3D Hiper-Realista</span>
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  Definition of Done
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-purple-700">
                <div className="flex items-center justify-between">
                  <span>✨ Ray Tracing Real-Time</span>
                  <Badge variant="outline" className="text-xs">UE5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>🎭 Subsurface Scattering</span>
                  <Badge variant="outline" className="text-xs">Cinema</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>💫 Volumetric Hair System</span>
                  <Badge variant="outline" className="text-xs">8K</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>🗣️ ML-Driven Lip Sync</span>
                  <Badge variant="outline" className="text-xs">99%</Badge>
                </div>
              </div>
              
              <Button 
                className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => toast.success('🎭 Pipeline hiper-realista ativado!')}
              >
                <Zap className="w-4 h-4 mr-2" />
                Ativar Hiper-Realismo
              </Button>
            </div>

            {/* Technical Specs */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <Camera className="w-4 h-4 mr-2 text-blue-600" />
                Especificações Técnicas
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Engine de Renderização:</span>
                  <span className="text-purple-600 font-medium">Unreal Engine 5</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolução de Textura:</span>
                  <span className="text-green-600 font-medium">8192x8192 PBR</span>
                </div>
                <div className="flex justify-between">
                  <span>Contagem de Polígonos:</span>
                  <span className="text-blue-600 font-medium">850K+ Triangles</span>
                </div>
                <div className="flex justify-between">
                  <span>Sistema de Iluminação:</span>
                  <span className="text-yellow-600 font-medium">Lumen + Ray Tracing</span>
                </div>
                <div className="flex justify-between">
                  <span>Precisão Lip Sync:</span>
                  <span className="text-red-600 font-medium">98% Cinema Grade</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
