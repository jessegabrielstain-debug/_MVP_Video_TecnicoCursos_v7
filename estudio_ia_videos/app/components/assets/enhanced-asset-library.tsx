
'use client'

/**
 * 🖼️ ENHANCED ASSET LIBRARY - Sprint 18
 * Biblioteca expandida de assets com categorias e busca
 */

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Download,
  Upload,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Eye,
  Heart,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Shapes,
  Palette,
  User,
  Building,
  Shield,
  Zap,
  Sparkles,
  Crown
} from 'lucide-react'

interface Asset {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'icon' | 'template' | 'shape' | 'text-style'
  category: string
  tags: string[]
  url: string
  thumbnail: string
  duration?: number // para vídeos e áudios
  size: string
  format: string
  isPremium: boolean
  isFavorite: boolean
  downloads: number
  rating: number
  author: string
  license: 'free' | 'premium' | 'royalty-free'
  createdAt: string
}

interface AssetCategory {
  id: string
  name: string
  icon: React.ReactNode
  count: number
}

const SORT_OPTION_ITEMS = [
  { value: 'name', label: 'Nome' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'rating', label: 'Avaliação' },
  { value: 'date', label: 'Data' }
] as const

type SortOption = typeof SORT_OPTION_ITEMS[number]['value']

const isSortOption = (value: string): value is SortOption =>
  SORT_OPTION_ITEMS.some((option) => option.value === value)

const SAMPLE_ASSETS: Asset[] = [
  // Templates NR
  {
    id: 'template-nr12',
    name: 'NR-12 Máquinas e Equipamentos',
    type: 'template',
    category: 'nr-templates',
    tags: ['NR-12', 'segurança', 'máquinas', 'equipamentos'],
    url: '/templates/nr12-template.json',
    thumbnail: '/templates/thumbs/nr12.jpg',
    size: '2.1 MB',
    format: 'JSON',
    isPremium: false,
    isFavorite: true,
    downloads: 1247,
    rating: 4.8,
    author: 'Estúdio IA',
    license: 'free',
    createdAt: '2024-09-15'
  },
  {
    id: 'template-nr33',
    name: 'NR-33 Espaços Confinados',
    type: 'template',
    category: 'nr-templates',
    tags: ['NR-33', 'espaços', 'confinados', 'segurança'],
    url: '/templates/nr33-template.json',
    thumbnail: '/templates/thumbs/nr33.jpg',
    size: '1.8 MB',
    format: 'JSON',
    isPremium: false,
    isFavorite: false,
    downloads: 856,
    rating: 4.6,
    author: 'Estúdio IA',
    license: 'free',
    createdAt: '2024-09-10'
  },
  // Ícones de Segurança
  {
    id: 'icon-helmet',
    name: 'Capacete de Segurança',
    type: 'icon',
    category: 'safety-icons',
    tags: ['capacete', 'segurança', 'proteção', 'EPI'],
    url: '/icons/helmet.svg',
    thumbnail: '/icons/helmet.svg',
    size: '8 KB',
    format: 'SVG',
    isPremium: false,
    isFavorite: true,
    downloads: 2341,
    rating: 4.9,
    author: 'Safety Icons Co',
    license: 'free',
    createdAt: '2024-08-20'
  },
  {
    id: 'icon-warning',
    name: 'Sinal de Alerta',
    type: 'icon',
    category: 'safety-icons',
    tags: ['alerta', 'warning', 'perigo', 'atenção'],
    url: '/icons/warning.svg',
    thumbnail: '/icons/warning.svg',
    size: '6 KB',
    format: 'SVG',
    isPremium: false,
    isFavorite: false,
    downloads: 1876,
    rating: 4.7,
    author: 'Safety Icons Co',
    license: 'free',
    createdAt: '2024-08-18'
  },
  // Imagens de Background
  {
    id: 'bg-industrial',
    name: 'Fábrica Industrial',
    type: 'image',
    category: 'backgrounds',
    tags: ['industrial', 'fábrica', 'background', 'workplace'],
    url: '/images/industrial-bg.jpg',
    thumbnail: '/images/thumbs/industrial-bg.jpg',
    size: '4.2 MB',
    format: 'JPG',
    isPremium: true,
    isFavorite: false,
    downloads: 567,
    rating: 4.5,
    author: 'Industrial Photos',
    license: 'premium',
    createdAt: '2024-09-01'
  },
  // Áudios
  {
    id: 'audio-corporate',
    name: 'Música Corporativa Inspiradora',
    type: 'audio',
    category: 'music',
    tags: ['corporativa', 'inspiradora', 'background', 'motivacional'],
    url: '/audio/corporate-music.mp3',
    thumbnail: '/audio/thumbs/corporate.jpg',
    duration: 180,
    size: '6.8 MB',
    format: 'MP3',
    isPremium: true,
    isFavorite: true,
    downloads: 834,
    rating: 4.6,
    author: 'Corporate Sounds',
    license: 'royalty-free',
    createdAt: '2024-08-25'
  },
  // Vídeos
  {
    id: 'video-workplace',
    name: 'Ambiente de Trabalho Seguro',
    type: 'video',
    category: 'stock-videos',
    tags: ['workplace', 'segurança', 'trabalho', 'escritório'],
    url: '/videos/workplace-safe.mp4',
    thumbnail: '/videos/thumbs/workplace.jpg',
    duration: 45,
    size: '28.5 MB',
    format: 'MP4',
    isPremium: true,
    isFavorite: false,
    downloads: 234,
    rating: 4.3,
    author: 'Workplace Videos',
    license: 'premium',
    createdAt: '2024-09-05'
  }
]

const CATEGORIES: AssetCategory[] = [
  { id: 'all', name: 'Todos', icon: <Grid3X3 className="h-4 w-4" />, count: 156 },
  { id: 'nr-templates', name: 'Templates NR', icon: <Shield className="h-4 w-4" />, count: 12 },
  { id: 'safety-icons', name: 'Ícones Segurança', icon: <Shapes className="h-4 w-4" />, count: 45 },
  { id: 'backgrounds', name: 'Backgrounds', icon: <ImageIcon className="h-4 w-4" />, count: 23 },
  { id: 'avatars', name: 'Avatares 3D', icon: <User className="h-4 w-4" />, count: 18 },
  { id: 'stock-videos', name: 'Vídeos Stock', icon: <Video className="h-4 w-4" />, count: 34 },
  { id: 'music', name: 'Música', icon: <Music className="h-4 w-4" />, count: 67 },
  { id: 'corporate', name: 'Corporativo', icon: <Building className="h-4 w-4" />, count: 89 }
]

interface EnhancedAssetLibraryProps {
  onAssetSelect?: (asset: Asset) => void
  onAssetPreview?: (asset: Asset) => void
}

export default function EnhancedAssetLibrary({ 
  onAssetSelect, 
  onAssetPreview 
}: EnhancedAssetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [assets, setAssets] = useState<Asset[]>(SAMPLE_ASSETS)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Filtrar assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory
    const matchesPremium = !showPremiumOnly || asset.isPremium
    const matchesFavorites = !showFavoritesOnly || asset.isFavorite
    
    return matchesSearch && matchesCategory && matchesPremium && matchesFavorites
  })

  // Ordenar assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'downloads':
        return b.downloads - a.downloads
      case 'rating':
        return b.rating - a.rating
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })

  const handleAssetClick = (asset: Asset) => {
    onAssetSelect?.(asset)
    toast.success(`${asset.name} adicionado ao projeto`)
  }

  const handleAssetPreview = (asset: Asset) => {
    onAssetPreview?.(asset)
  }

  const toggleFavorite = (assetId: string) => {
    setAssets(prev => prev.map(asset =>
      asset.id === assetId ? { ...asset, isFavorite: !asset.isFavorite } : asset
    ))
  }

  const playAudio = (assetId: string, audioUrl: string) => {
    if (playingAudio === assetId) {
      // Pause current audio
      audioRef.current?.pause()
      setPlayingAudio(null)
    } else {
      // Play new audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setPlayingAudio(assetId)
      }
    }
  }

  const formatFileSize = (size: string) => size
  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTypeIcon = (type: Asset['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      case 'icon': return <Shapes className="h-4 w-4" />
      case 'template': return <FileText className="h-4 w-4" />
      case 'shape': return <Shapes className="h-4 w-4" />
      case 'text-style': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Biblioteca de Assets</h2>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => {
              const { value } = e.target
              if (isSortOption(value)) {
                setSortBy(value)
              }
            }}
            className="p-2 border rounded"
          >
            {SORT_OPTION_ITEMS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant={showPremiumOnly ? 'default' : 'outline'}
            onClick={() => setShowPremiumOnly(!showPremiumOnly)}
          >
            <Crown className="h-4 w-4 mr-1" />
            Premium
          </Button>

          <Button
            size="sm"
            variant={showFavoritesOnly ? 'default' : 'outline'}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Heart className="h-4 w-4 mr-1" />
            Favoritos
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-56 border-r bg-gray-50">
          <ScrollArea className="h-full p-4">
            <div className="space-y-1">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon}
                  <span className="ml-2">{category.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Assets Grid/List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedAssets.map((asset) => (
                  <Card
                    key={asset.id}
                    className="cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => handleAssetClick(asset)}
                  >
                    <div className="relative aspect-square">
                      {asset.type === 'video' ? (
                        <div className="w-full h-full bg-gray-100 rounded-t-lg flex items-center justify-center relative">
                          <Video className="h-8 w-8 text-gray-400" />
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                            {formatDuration(asset.duration)}
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAssetPreview(asset)
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : asset.type === 'audio' ? (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 rounded-t-lg flex items-center justify-center relative">
                          <Music className="h-8 w-8 text-white" />
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                            {formatDuration(asset.duration)}
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              playAudio(asset.id, asset.url)
                            }}
                          >
                            {playingAudio === asset.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-t-lg flex items-center justify-center">
                          {getTypeIcon(asset.type)}
                        </div>
                      )}

                      {/* Premium Badge */}
                      {asset.isPremium && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}

                      {/* Favorite Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(asset.id)
                        }}
                      >
                        <Heart className={`h-4 w-4 ${asset.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>

                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{asset.author}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{asset.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Download className="h-3 w-3" />
                          {asset.downloads}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs">
                          {asset.format}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedAssets.map((asset) => (
                  <Card
                    key={asset.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => handleAssetClick(asset)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          {getTypeIcon(asset.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{asset.name}</h3>
                            {asset.isPremium && (
                              <Badge className="bg-yellow-500">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground truncate">{asset.author}</p>
                          
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {asset.rating}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {asset.downloads}
                            </span>
                            <Badge variant="outline">{asset.format}</Badge>
                            <span>{formatFileSize(asset.size)}</span>
                            {asset.duration && <span>{formatDuration(asset.duration)}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {asset.type === 'audio' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                playAudio(asset.id, asset.url)
                              }}
                            >
                              {playingAudio === asset.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(asset.id)
                            }}
                          >
                            <Heart className={`h-4 w-4 ${asset.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>

                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {sortedAssets.length === 0 && (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum asset encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar sua busca ou filtros
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        onError={() => setPlayingAudio(null)}
      />
    </div>
  )
}
