
/**
 * 🎨 NR TEMPLATES GALLERY ENHANCED
 * Galeria aprimorada com 15 templates NR e filtros avançados
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock, Award, BookOpen, Search, Filter, Grid, List,
  CheckCircle2, Star, TrendingUp, Users, Play,
  Download, Share2, Heart, ExternalLink
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

interface NRTemplate {
  id: string
  nr: string
  title: string
  description: string
  category: string
  duration: number
  thumbnailUrl: string
  certification: {
    validityMonths: number
    requiredScore: number
  }
  compliance: {
    keywords: string[]
    requiredElements: string[]
  }
  stats?: {
    views: number
    uses: number
    rating: number
    reviews: number
  }
}

export default function NRTemplatesGalleryEnhanced() {
  const [templates, setTemplates] = useState<NRTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 60])
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'duration'>('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/templates/nr/expanded')
      if (!response.ok) throw new Error('Erro ao buscar templates')
      
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      logger.error('Error fetching templates', error instanceof Error ? error : new Error(String(error)), { component: 'NRTemplatesGalleryEnhanced' })
      toast.error('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = useMemo(() => {
    let filtered = templates

    // Filtrar por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchLower) ||
        t.nr.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.compliance.keywords.some(k => k.toLowerCase().includes(searchLower))
      )
    }

    // Filtrar por categoria
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Filtrar por duração (em minutos)
    filtered = filtered.filter(t => {
      const durationMinutes = t.duration / 60
      return durationMinutes >= durationRange[0] && durationMinutes <= durationRange[1]
    })

    // Ordenar
    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.stats?.uses || 0) - (a.stats?.uses || 0))
    } else if (sortBy === 'duration') {
      filtered.sort((a, b) => a.duration - b.duration)
    }

    return filtered
  }, [templates, searchTerm, selectedCategory, durationRange, sortBy])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(templates.map(t => t.category)))
    return ['all', ...cats]
  }, [templates])

  const toggleFavorite = (templateId: string) => {
    setFavorites(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  const handleUseTemplate = async (template: NRTemplate) => {
    try {
      const projectName = prompt(`Nome do projeto (baseado em ${template.nr}):`)
      if (!projectName) return

      const response = await fetch('/api/templates/nr/expanded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          projectName
        })
      })

      if (!response.ok) throw new Error('Erro ao criar projeto')

      const data = await response.json()
      toast.success('Projeto criado com sucesso!')
      
      // Redirecionar para o editor (simulado)
      logger.info('Redirecionando para editor', { component: 'NRTemplatesGalleryEnhanced', projectId: data.project.id })
    } catch (error) {
      logger.error('Error using template', error instanceof Error ? error : new Error(String(error)), { component: 'NRTemplatesGalleryEnhanced' })
      toast.error('Erro ao criar projeto')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600">Carregando templates NR...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Templates de Normas Regulamentadoras</h1>
              <p className="text-gray-600 mt-1">15 templates prontos para treinamentos de segurança do trabalho</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2 bg-green-50 text-green-700 border-green-300">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {filteredTemplates.length} disponíveis
            </Badge>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {/* Busca */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar templates, NR, palavras-chave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'Todas as Categorias' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar */}
            <div>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Mais Populares</SelectItem>
                  <SelectItem value="recent">Mais Recentes</SelectItem>
                  <SelectItem value="duration">Duração</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtro de Duração */}
          <div className="mt-4">
            <Label className="text-sm text-gray-700 mb-2 block">
              Duração: {durationRange[0]} - {durationRange[1]} minutos
            </Label>
            <Slider
              value={durationRange}
              onValueChange={(v: any) => setDurationRange(v)}
              min={0}
              max={60}
              step={5}
              className="w-full"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2"
              >
                <Grid className="w-4 h-4" />
                Grade
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                Lista
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              {filteredTemplates.length} template(s) encontrado(s)
            </p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
                data-testid="nr-template-card"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-indigo-100">
                  <Image
                    src={template.thumbnailUrl || '/images/nr-templates/default.jpg'}
                    alt={template.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    data-testid="template-thumbnail"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* NR Badge */}
                  <Badge className="absolute top-3 left-3 bg-blue-600 text-white">
                    {template.nr}
                  </Badge>

                  {/* Favorite */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm hover:bg-white/40"
                    onClick={() => toggleFavorite(template.id)}
                  >
                    <Heart
                      className={`w-5 h-5 ${favorites.includes(template.id) ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                  </Button>

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2" data-testid="template-title">
                    {template.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Category */}
                  <Badge variant="outline" className="bg-purple-50 text-purple-700" data-testid="template-category">
                    {template.category}
                  </Badge>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span data-testid="template-duration">{Math.round(template.duration / 60)}min</span>
                    </div>
                    {template.stats && (
                      <>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{template.stats.uses}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{template.stats.rating.toFixed(1)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Certification Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Award className="w-4 h-4 text-green-600" />
                    <span>Validade: {template.certification.validityMonths} meses</span>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 gap-2"
                    data-testid="use-template-button"
                  >
                    <Play className="w-4 h-4" />
                    Usar Template
                  </Button>
                  <Button variant="outline" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-lg transition-shadow"
                data-testid="nr-template-card"
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="relative w-32 h-20 flex-shrink-0 rounded overflow-hidden">
                    <Image
                      src={template.thumbnailUrl || '/images/nr-templates/default.jpg'}
                      alt={template.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                      data-testid="template-thumbnail"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge className="mb-2">{template.nr}</Badge>
                        <h3 className="font-semibold text-lg" data-testid="template-title">{template.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-1">{template.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(template.id)}
                      >
                        <Heart
                          className={`w-5 h-5 ${favorites.includes(template.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                        />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700" data-testid="template-category">
                        {template.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span data-testid="template-duration">{Math.round(template.duration / 60)}min</span>
                      </div>
                      {template.stats && (
                        <>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{template.stats.uses}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{template.stats.rating.toFixed(1)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUseTemplate(template)}
                    className="gap-2"
                    data-testid="use-template-button"
                  >
                    <Play className="w-4 h-4" />
                    Usar Template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros ou busca
            </p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setDurationRange([0, 60])
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
