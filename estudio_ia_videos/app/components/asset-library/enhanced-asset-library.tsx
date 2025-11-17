
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Search, Filter, Grid, List, Download, Heart, 
  Star, Play, Pause, Volume2, Image as ImageIcon,
  Video, Music, FileText, Shapes, Palette,
  Upload, Folder, Tag, Clock, TrendingUp
} from 'lucide-react'
import Image from 'next/image'

interface Asset {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'template' | 'shape' | 'animation'
  category: string
  tags: string[]
  url: string
  thumbnail?: string
  duration?: number
  size?: string
  downloads: number
  rating: number
  premium: boolean
  trending: boolean
  recent: boolean
  favorite?: boolean
  description?: string
  author?: string
  license?: string
}

interface AssetCategory {
  id: string
  name: string
  icon: React.ReactNode
  count: number
  color: string
}

const SORT_OPTIONS = ['popular', 'recent', 'name', 'rating'] as const
type SortOption = (typeof SORT_OPTIONS)[number]

const isSortOption = (value: string): value is SortOption => {
  return SORT_OPTIONS.includes(value as SortOption)
}

const EnhancedAssetLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [showOnlyPremium, setShowOnlyPremium] = useState(false)
  
  // Mock asset data
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1',
      name: 'NR-12 Safety Equipment',
      type: 'image',
      category: 'safety',
      tags: ['nr12', 'equipment', 'safety', 'machinery'],
      url: '/nr12-eletrico.jpg',
      thumbnail: '/nr12-eletrico.jpg',
      downloads: 1250,
      rating: 4.8,
      premium: false,
      trending: true,
      recent: false,
      description: 'Professional safety equipment illustration for NR-12 training',
      author: 'Safety Studio',
      license: 'Commercial Use'
    },
    {
      id: '2',
      name: 'Industrial Workshop',
      type: 'video',
      category: 'workplace',
      tags: ['industrial', 'workshop', 'factory', 'training'],
      url: '/placeholder-video.mp4',
      thumbnail: '/nr33-thumb.jpg',
      duration: 45,
      downloads: 890,
      rating: 4.6,
      premium: true,
      trending: false,
      recent: true,
      description: 'HD video of modern industrial workshop environment',
      author: 'Industrial Media',
      license: 'Premium License'
    },
    {
      id: '3',
      name: 'Professional Narration - Male',
      type: 'audio',
      category: 'voice',
      tags: ['narration', 'male', 'professional', 'portuguese'],
      url: '/sample-audio.mp3',
      duration: 30,
      downloads: 2100,
      rating: 4.9,
      premium: true,
      trending: true,
      recent: false,
      description: 'Professional male voice for training narrations',
      author: 'Voice Pro',
      license: 'Premium License'
    },
    {
      id: '4',
      name: 'NR-35 Training Template',
      type: 'template',
      category: 'templates',
      tags: ['nr35', 'height', 'safety', 'template'],
      url: '/nr35-template.json',
      thumbnail: '/nr35-thumb.jpg',
      downloads: 670,
      rating: 4.7,
      premium: false,
      trending: false,
      recent: true,
      description: 'Complete training template for working at height (NR-35)',
      author: 'Training Templates',
      license: 'Open License'
    },
    {
      id: '5',
      name: 'Arrow Animations Pack',
      type: 'animation',
      category: 'animations',
      tags: ['arrows', 'directions', 'animated', 'indicators'],
      url: '/arrow-animations.json',
      downloads: 1580,
      rating: 4.5,
      premium: false,
      trending: false,
      recent: false,
      description: 'Pack of animated arrows for highlighting and directions',
      author: 'Animation Studio',
      license: 'Creative Commons'
    }
  ])
  
  const categories: AssetCategory[] = [
    { id: 'all', name: 'All Assets', icon: <Folder className="h-4 w-4" />, count: assets.length, color: 'bg-gray-500' },
    { id: 'image', name: 'Images', icon: <ImageIcon className="h-4 w-4" />, count: assets.filter(a => a.type === 'image').length, color: 'bg-blue-500' },
    { id: 'video', name: 'Videos', icon: <Video className="h-4 w-4" />, count: assets.filter(a => a.type === 'video').length, color: 'bg-purple-500' },
    { id: 'audio', name: 'Audio', icon: <Music className="h-4 w-4" />, count: assets.filter(a => a.type === 'audio').length, color: 'bg-green-500' },
    { id: 'template', name: 'Templates', icon: <FileText className="h-4 w-4" />, count: assets.filter(a => a.type === 'template').length, color: 'bg-orange-500' },
    { id: 'animation', name: 'Animations', icon: <Shapes className="h-4 w-4" />, count: assets.filter(a => a.type === 'animation').length, color: 'bg-pink-500' }
  ]
  
  // Get filtered and sorted assets
  const filteredAssets = assets
    .filter(asset => {
      if (selectedCategory !== 'all' && asset.type !== selectedCategory) return false
      if (showOnlyFavorites && !asset.favorite) return false
      if (showOnlyPremium && !asset.premium) return false
      if (searchTerm && !asset.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) return false
      if (filterTags.length > 0 && !filterTags.every(tag => asset.tags.includes(tag))) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads
        case 'recent':
          return (b.recent ? 1 : 0) - (a.recent ? 1 : 0)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating':
          return b.rating - a.rating
        default:
          return 0
      }
    })
  
  // Get all available tags
  const allTags = Array.from(new Set(assets.flatMap(asset => asset.tags)))
  
  // Toggle favorite
  const toggleFavorite = (assetId: string) => {
    setAssets(assets.map(asset => 
      asset.id === assetId 
        ? { ...asset, favorite: !asset.favorite }
        : asset
    ))
  }
  
  // Download asset
  const downloadAsset = (asset: Asset) => {
    setAssets(assets.map(a => 
      a.id === asset.id 
        ? { ...a, downloads: a.downloads + 1 }
        : a
    ))
    // In real implementation, this would trigger actual download
    console.log('Downloading asset:', asset.name)
  }
  
  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r overflow-y-auto">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search assets..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Categories */}
        <div className="p-4 border-b">
          <Label className="text-sm font-semibold mb-3 block">Categories</Label>
          <div className="space-y-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded ${category.color}`}></div>
                  {category.icon}
                  <span>{category.name}</span>
                  <span className="ml-auto text-xs text-gray-500">{category.count}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Filters */}
        <div className="p-4 border-b">
          <Label className="text-sm font-semibold mb-3 block">Filters</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="favorites"
                checked={showOnlyFavorites}
                onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="favorites" className="text-sm flex items-center">
                <Heart className="h-3 w-3 mr-1" />
                Favorites Only
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="premium"
                checked={showOnlyPremium}
                onChange={(e) => setShowOnlyPremium(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="premium" className="text-sm flex items-center">
                <Star className="h-3 w-3 mr-1" />
                Premium Only
              </label>
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div className="p-4">
          <Label className="text-sm font-semibold mb-3 block">Popular Tags</Label>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 15).map(tag => (
              <Badge
                key={tag}
                variant={filterTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  if (filterTags.includes(tag)) {
                    setFilterTags(filterTags.filter(t => t !== tag))
                  } else {
                    setFilterTags([...filterTags, tag])
                  }
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Asset Library</h1>
            <Badge variant="secondary">{filteredAssets.length} assets</Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label className="text-sm">Sort:</Label>
              <select
                value={sortBy}
                onChange={(e) => {
                  const value = e.target.value
                  if (!isSortOption(value)) {
                    return
                  }

                  setSortBy(value)
                }}
                className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Most Recent</option>
                <option value="name">Name A-Z</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
            
            <div className="flex border rounded">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Asset
            </Button>
          </div>
        </div>
        
        {/* Assets Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredAssets.map(asset => (
                <Card key={asset.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    {/* Asset Preview */}
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                      {asset.type === 'image' && asset.thumbnail && (
                        <Image
                          src={asset.thumbnail}
                          alt={asset.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      )}
                      
                      {asset.type === 'video' && asset.thumbnail && (
                        <>
                          <Image
                            src={asset.thumbnail}
                            alt={asset.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        </>
                      )}
                      
                      {asset.type === 'audio' && (
                        <div className="flex items-center justify-center h-full">
                          <Volume2 className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {asset.type === 'template' && asset.thumbnail && (
                        <Image
                          src={asset.thumbnail}
                          alt={asset.name}
                          fill
                          className="object-cover"
                        />
                      )}
                      
                      {asset.type === 'animation' && (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-400 to-pink-400">
                          <Shapes className="h-12 w-12 text-white" />
                        </div>
                      )}
                      
                      {/* Overlay badges */}
                      <div className="absolute top-2 left-2 flex space-x-1">
                        {asset.premium && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        {asset.trending && (
                          <Badge variant="destructive" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                        {asset.recent && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </div>
                      
                      {/* Duration for video/audio */}
                      {asset.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(asset.duration)}
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(asset.id)
                          }}
                        >
                          <Heart className={`h-3 w-3 ${asset.favorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Asset Info */}
                    <div className="p-4">
                      <h3 className="font-semibold truncate mb-1">{asset.name}</h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{asset.description}</p>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs">{asset.rating}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {asset.downloads.toLocaleString()} downloads
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {asset.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => downloadAsset(asset)}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Use Asset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // List view
            <div className="space-y-4">
              {filteredAssets.map(asset => (
                <Card key={asset.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        {asset.thumbnail ? (
                          <Image
                            src={asset.thumbnail}
                            alt={asset.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {asset.type === 'audio' && <Volume2 className="h-6 w-6 text-gray-400" />}
                            {asset.type === 'animation' && <Shapes className="h-6 w-6 text-gray-400" />}
                            {asset.type === 'template' && <FileText className="h-6 w-6 text-gray-400" />}
                          </div>
                        )}
                      </div>
                      
                      {/* Asset Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{asset.name}</h3>
                          <div className="flex items-center space-x-2">
                            {asset.premium && (
                              <Badge variant="default" className="text-xs">Premium</Badge>
                            )}
                            {asset.trending && (
                              <Badge variant="destructive" className="text-xs">Trending</Badge>
                            )}
                            {asset.recent && (
                              <Badge variant="secondary" className="text-xs">New</Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-2">{asset.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span>{asset.rating}</span>
                            </div>
                            <span>{asset.downloads.toLocaleString()} downloads</span>
                            {asset.duration && <span>{formatDuration(asset.duration)}</span>}
                            {asset.author && <span>by {asset.author}</span>}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFavorite(asset.id)}
                            >
                              <Heart className={`h-4 w-4 ${asset.favorite ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => downloadAsset(asset)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Use
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {filteredAssets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500 mb-2">No assets found</h3>
              <p className="text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedAssetLibrary
