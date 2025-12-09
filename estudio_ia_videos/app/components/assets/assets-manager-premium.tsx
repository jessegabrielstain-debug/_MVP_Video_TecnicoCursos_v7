// TODO: Verificar módulo assets-manager e fixar tipos
/**
 * 🎨 Assets Manager Premium - Interface Completa de Gerenciamento
 * Unsplash (50M+ imagens), Freesound (música/SFX), uploads customizados
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Search,
  Filter,
  Download,
  Heart,
  Upload,
  Image as ImageIcon,
  Music,
  Video,
  Type,
  Star,
  Grid3X3,
  List,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Plus,
  Eye,
  Trash2,
  FolderPlus,
  Share2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { assetsManager, AssetItem, AssetCollection, SearchFilters, SEARCH_PRESETS } from '../../lib/assets-manager'
import { cn } from '../../lib/utils'
import Image from 'next/image'

const ASSET_TYPES: readonly AssetItem['type'][] = ['image', 'audio', 'video', 'font', 'template']
const isAssetType = (value: string): value is AssetItem['type'] =>
  ASSET_TYPES.includes(value as AssetItem['type'])

const ORIENTATION_OPTIONS = ['landscape', 'portrait', 'square'] as const
type OrientationOption = (typeof ORIENTATION_OPTIONS)[number]
const isOrientationOption = (value: string): value is OrientationOption =>
  ORIENTATION_OPTIONS.includes(value as OrientationOption)

const LICENSE_OPTIONS = ['all', 'free', 'creative-commons', 'royalty-free'] as const
type LicenseFilterOption = (typeof LICENSE_OPTIONS)[number]
const isLicenseFilterOption = (value: string): value is LicenseFilterOption =>
  LICENSE_OPTIONS.includes(value as LicenseFilterOption)

const QUALITY_OPTIONS = ['all', 'high', 'medium', 'low'] as const
type QualityFilterOption = (typeof QUALITY_OPTIONS)[number]
const isQualityFilterOption = (value: string): value is QualityFilterOption =>
  QUALITY_OPTIONS.includes(value as QualityFilterOption)

const formatImageDimensions = (asset: AssetItem) => {
  if (asset.type !== 'image') {
    return null
  }
  const width = asset.width ?? undefined
  const height = asset.height ?? undefined
  if (!width && !height) {
    return 'N/A'
  }
  return `${width ?? 'N/A'}x${height ?? 'N/A'}`
}

const formatAudioDuration = (asset: AssetItem) => {
  if (asset.type !== 'audio' || typeof asset.duration !== 'number') {
    return null
  }
  return `${Math.round(asset.duration)}s`
}

interface AssetsManagerPremiumProps {
  onAssetSelect?: (asset: AssetItem) => void
  selectedAssets?: string[]
  multiSelect?: boolean
  filterType?: 'image' | 'audio' | 'video' | 'font' | 'template'
}

export default function AssetsManagerPremium({ 
  onAssetSelect, 
  selectedAssets = [],
  multiSelect = false,
  filterType 
}: AssetsManagerPremiumProps) {
  
  // Estados principais
  const [activeTab, setActiveTab] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AssetItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  
  // Filtros
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    type: filterType,
    license: 'all',
    safeSearch: true
  })

  const updateFilters = (updater: (current: SearchFilters) => SearchFilters) => {
    setFilters(updater)
  }

  const handleTypeFilterChange = (value: string) => {
    updateFilters((prev) => ({
      ...prev,
      type: value === 'all' ? undefined : isAssetType(value) ? value : prev.type
    }))
  }

  const handleOrientationFilterChange = (value: string) => {
    updateFilters((prev) => ({
      ...prev,
      orientation: value === 'all' ? undefined : isOrientationOption(value) ? value : prev.orientation
    }))
  }

  const handleLicenseFilterChange = (value: string) => {
    updateFilters((prev) => ({
      ...prev,
      license: isLicenseFilterOption(value) ? value : prev.license
    }))
  }

  const handleQualityFilterChange = (value: string) => {
    updateFilters((prev) => ({
      ...prev,
      quality:
        value === 'all'
          ? undefined
          : isQualityFilterOption(value)
          ? (value as Exclude<QualityFilterOption, 'all'>)
          : prev.quality
    }))
  }
  
  // View modes
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Assets customizados e coleções
  const [customAssets, setCustomAssets] = useState<AssetItem[]>([])
  const [collections, setCollections] = useState<AssetCollection[]>([])
  const [favoriteAssets, setFavoriteAssets] = useState<string[]>([])
  
  // Upload
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Audio player
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playingProgress, setPlayingProgress] = useState(0)

  // Carregamento inicial
  useEffect(() => {
    loadInitialData()
  }, [])

  // Busca com debounce
  const searchDebounceRef = useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (searchQuery.trim()) {
      clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = setTimeout(() => {
        performSearch(searchQuery)
      }, 500)
    } else {
      setSearchResults([])
      setTotalResults(0)
    }
  }, [searchQuery, filters])

  // Carregar dados iniciais
  const loadInitialData = async () => {
    try {
      const manager = assetsManager
      const collections = await manager.getAllCollections()
      const favorites = await manager.getFavorites('current-user')
      
      setCollections([]) // Mock collections por enquanto
      setFavoriteAssets(Array.isArray(favorites) ? favorites : [])
      
      // Carregar busca padrão se não há filtro específico
      if (!filterType) {
        performSearch('background corporate')
      }
    } catch (error) {
      logger.error('Erro ao carregar dados', error instanceof Error ? error : new Error(String(error)), { component: 'AssetsManagerPremium' })
    }
  }

  // Executar busca
  const performSearch = async (query: string, page = 1) => {
    if (!query.trim() && !filters.type) return
    
    try {
      setIsSearching(true)
      
      const result = await assetsManager.searchAll(query || 'background')
      
      if (page === 1) {
        setSearchResults(Array.isArray(result) ? result : [])
      } else {
        setSearchResults(prev => [...prev, ...(Array.isArray(result) ? result : [])])
      }
      
      setTotalResults(Array.isArray(result) ? result.length : 0)
      setHasMore(false)
      setCurrentPage(page)
      
    } catch (error) {
      logger.error('Erro na busca', error instanceof Error ? error : new Error(String(error)), { component: 'AssetsManagerPremium', query, page })
    } finally {
      setIsSearching(false)
    }
  }

  // Aplicar preset de busca
  const applyPreset = (presetKey: string) => {
    const preset = SEARCH_PRESETS[presetKey as keyof typeof SEARCH_PRESETS]
    if (preset) {
      setSearchQuery(preset.query)
      setFilters((prev: any) => ({ ...prev, ...preset.filters } as SearchFilters))
    }
  }

  // Upload de arquivo
  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return
    
    try {
      setIsUploading(true)
      const file = files[0]
      
      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const assetData = {
        id: `custom-${Date.now()}`,
        title: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'audio' as 'image' | 'audio' | 'video' | 'font' | 'template',
        category: selectedCategory,
        url: URL.createObjectURL(file)
      }
      const uploadedAsset = await assetsManager.uploadCustomAsset(file, assetData)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      setCustomAssets(prev => [uploadedAsset, ...prev])
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
      
    } catch (error) {
      logger.error('Erro no upload', error instanceof Error ? error : new Error(String(error)), { component: 'AssetsManagerPremium' })
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Reproduzir/pausar áudio
  const toggleAudioPlayback = async (asset: AssetItem) => {
    if (!audioRef.current) return
    
    if (currentlyPlaying === asset.id) {
      audioRef.current.pause()
      setCurrentlyPlaying(null)
    } else {
      if (audioRef.current.src !== asset.url) {
        audioRef.current.src = asset.url
      }
      
      try {
        await audioRef.current.play()
        setCurrentlyPlaying(asset.id)
      } catch (error) {
        logger.error('Erro ao reproduzir áudio', error instanceof Error ? error : new Error(String(error)), { component: 'AssetsManagerPremium', assetId: asset.id })
      }
    }
  }

  // Favoritar asset
  const toggleFavorite = async (assetId: string) => {
    try {
      if (favoriteAssets.includes(assetId)) {
        await assetsManager.removeFromFavorites(assetId, 'current-user')
        setFavoriteAssets(prev => prev.filter(id => id !== assetId))
      } else {
        await assetsManager.addToFavorites(assetId, 'current-user')
        setFavoriteAssets(prev => [...prev, assetId])
      }
    } catch (error) {
      logger.error('Erro ao alterar favoritos', error instanceof Error ? error : new Error(String(error)), { component: 'AssetsManagerPremium', assetId })
    }
  }

  // Selecionar asset
  const handleAssetSelect = (asset: AssetItem) => {
    if (onAssetSelect) {
      onAssetSelect(asset)
    }
  }

  // Carregar mais resultados
  const loadMore = () => {
    if (hasMore && !isSearching) {
      performSearch(searchQuery, currentPage + 1)
    }
  }

  // Componente de asset individual
  const AssetCard = ({ asset }: { asset: AssetItem }) => {
    const isSelected = selectedAssets.includes(asset.id)
    const isFavorite = favoriteAssets.includes(asset.id)
    const isPlaying = currentlyPlaying === asset.id

    const imageDimensions = formatImageDimensions(asset)
    const audioDuration = formatAudioDuration(asset)

    return (
      <Card 
        className={cn(
          "group cursor-pointer transition-all hover:shadow-lg",
          isSelected && "ring-2 ring-primary",
          viewMode === 'list' && "flex-row"
        )}
        onClick={() => handleAssetSelect(asset)}
      >
        <div className={cn(
          "relative",
          viewMode === 'grid' ? "aspect-video" : "w-32 h-20"
        )}>
          
          {/* Thumbnail */}
          {asset.type === 'image' && (
            <Image
              src={asset.thumbnailUrl || asset.url}
              alt={asset.title}
              fill
              className="object-cover rounded-t-lg"
              sizes={viewMode === 'grid' ? "300px" : "128px"}
            />
          )}
          
          {asset.type === 'audio' && (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 rounded-t-lg flex items-center justify-center">
              <Music className="h-12 w-12 text-white" />
            </div>
          )}
          
          {asset.type === 'video' && (
            <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 rounded-t-lg flex items-center justify-center">
              <Video className="h-12 w-12 text-white" />
            </div>
          )}

          {/* Overlay de ações */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-center justify-center gap-2">
            
            {/* Play button para áudio */}
            {asset.type === 'audio' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleAudioPlayback(asset)
                }}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}

            {/* Preview button */}
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                window.open(asset.url, '_blank')
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* Download button */}
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                const a = document.createElement('a')
                a.href = asset.url
                a.download = asset.title
                a.click()
              }}
            >
              <Download className="h-4 w-4" />
            </Button>

          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge variant="secondary" className="text-xs">
              {asset.source}
            </Badge>
            {asset.license === 'free' && (
              <Badge variant="default" className="text-xs bg-green-500">
                FREE
              </Badge>
            )}
          </div>

          {/* Favorito */}
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "absolute top-2 right-2 opacity-0 group-hover:opacity-100",
              isFavorite && "opacity-100 text-red-500"
            )}
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite(asset.id)
            }}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>

        </div>

        {/* Informações */}
        <CardContent className={cn("p-3", viewMode === 'list' && "flex-1")}>
          <h3 className="font-medium text-sm truncate mb-1">{asset.title}</h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{asset.type}</span>
            {asset.favorites && asset.favorites > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {asset.favorites}
              </span>
            )}
          </div>

          {/* Metadados específicos */}
          <div className="mt-2 text-xs text-muted-foreground">
            {imageDimensions && <span>{imageDimensions}</span>}
            {audioDuration && <span>{audioDuration}</span>}
          </div>

          {/* Tags */}
          {viewMode === 'list' && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {asset.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Assets Manager Premium</h1>
          <p className="text-text-muted mt-1">
            50M+ imagens Unsplash, música Freesound, uploads customizados
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="collections">
            <FolderPlus className="h-4 w-4 mr-2" />
            Coleções
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart className="h-4 w-4 mr-2" />
            Favoritos
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Star className="h-4 w-4 mr-2" />
            Meus Assets
          </TabsTrigger>
        </TabsList>

        {/* Busca */}
        <TabsContent value="search" className="space-y-6">
          
          {/* Barra de busca e filtros */}
          <Card>
            <CardContent className="p-4 space-y-4">
              
              {/* Busca principal */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar assets: 'corporate training', 'nature landscape', 'ambient music'..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => performSearch(searchQuery)} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                </Button>
              </div>

              {/* Presets de busca */}
              <div className="flex flex-wrap gap-2">
                <Label className="text-sm">Presets populares:</Label>
                {Object.entries(SEARCH_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(key)}
                  >
                    {key.replace('-', ' ')}
                  </Button>
                ))}
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={filters.type || 'all'} onValueChange={handleTypeFilterChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="image">Imagens</SelectItem>
                      <SelectItem value="audio">Áudio</SelectItem>
                      <SelectItem value="video">Vídeos</SelectItem>
                      <SelectItem value="font">Fontes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Orientação</Label>
                  <Select value={filters.orientation || 'all'} onValueChange={handleOrientationFilterChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="landscape">Paisagem</SelectItem>
                      <SelectItem value="portrait">Retrato</SelectItem>
                      <SelectItem value="square">Quadrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Licença</Label>
                  <Select value={filters.license || 'all'} onValueChange={handleLicenseFilterChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="creative-commons">Creative Commons</SelectItem>
                      <SelectItem value="royalty-free">Royalty Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Qualidade</Label>
                  <Select value={filters.quality || 'all'} onValueChange={handleQualityFilterChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.safeSearch}
                    onCheckedChange={(checked) => setFilters((prev: any) => ({ ...prev, safeSearch: checked }))}
                    id="safe-search"
                  />
                  <Label htmlFor="safe-search" className="text-xs">Safe Search</Label>
                </div>

              </div>

            </CardContent>
          </Card>

          {/* Resultados */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Resultados da Busca</CardTitle>
                    <CardDescription>
                      {totalResults.toLocaleString()} assets encontrados
                    </CardDescription>
                  </div>
                  
                  <Badge variant="outline">
                    {searchResults.length} carregados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                
                {/* Grid/List de assets */}
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                    : "space-y-4"
                )}>
                  {searchResults.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="text-center mt-6">
                    <Button onClick={loadMore} disabled={isSearching}>
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        'Carregar Mais'
                      )}
                    </Button>
                  </div>
                )}

              </CardContent>
            </Card>
          )}

          {/* Estado vazio */}
          {!isSearching && searchResults.length === 0 && searchQuery && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou usar termos diferentes
                </p>
                <Button onClick={() => setSearchQuery('')} variant="outline">
                  Limpar Busca
                </Button>
              </CardContent>
            </Card>
          )}

        </TabsContent>

        {/* Upload */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Assets Customizados
              </CardTitle>
              <CardDescription>
                Envie seus próprios assets para usar nos projetos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Area de upload */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  "hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  handleFileUpload(e.dataTransfer.files)
                }}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Arraste arquivos aqui ou clique para selecionar
                </h3>
                <p className="text-muted-foreground mb-4">
                  Suporta imagens, áudio, vídeo (máx. 100MB)
                </p>
                <Button variant="outline">
                  Selecionar Arquivos
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,audio/*,video/*,.pdf,.zip"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />

              {/* Progresso do upload */}
              {isUploading && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription className="space-y-2">
                    <div className="flex justify-between">
                      <span>Enviando...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Configurações de upload */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="negócios">Negócios</SelectItem>
                      <SelectItem value="educação">Educação</SelectItem>
                      <SelectItem value="nr-training">NR Training</SelectItem>
                      <SelectItem value="backgrounds">Backgrounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Assets customizados recentes */}
          {customAssets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assets Enviados Recentemente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {customAssets.slice(0, 8).map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </TabsContent>

        {/* Outras tabs... */}
        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <CardTitle>Coleções</CardTitle>
              <CardDescription>Organize seus assets em coleções temáticas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Funcionalidade de coleções será implementada em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Assets Favoritos</CardTitle>
              <CardDescription>Seus assets marcados como favoritos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                {favoriteAssets.length === 0 
                  ? 'Nenhum asset favoritado ainda' 
                  : `${favoriteAssets.length} assets favoritos`
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Meus Assets Customizados</CardTitle>
              <CardDescription>Assets que você enviou</CardDescription>
            </CardHeader>
            <CardContent>
              {customAssets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum asset customizado ainda
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {customAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Audio player oculto */}
      <audio
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
            setPlayingProgress(progress)
          }
        }}
      />

    </div>
  )
}
