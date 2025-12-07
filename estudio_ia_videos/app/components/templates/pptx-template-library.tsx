'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Search,
  Filter,
  Star,
  StarOff,
  Eye,
  Download,
  Share2,
  Copy,
  Edit,
  Trash2,
  Plus,
  Wand2,
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  Video,
  Mic,
  Clock,
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  Zap,
  Crown,
  Sparkles,
  PlayCircle,
  FileText,
  Presentation,
  BookOpen,
  TrendingUp,
  Building,
  Lightbulb,
  Camera,
  Music,
  Film,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'

// Template Categories
const TEMPLATE_CATEGORIES = [
  { id: 'business', name: 'Negócios', icon: Briefcase, color: '#3b82f6' },
  { id: 'education', name: 'Educação', icon: GraduationCap, color: '#10b981' },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp, color: '#f59e0b' },
  { id: 'creative', name: 'Criativo', icon: Palette, color: '#8b5cf6' },
  { id: 'corporate', name: 'Corporativo', icon: Building, color: '#6b7280' },
  { id: 'personal', name: 'Pessoal', icon: Heart, color: '#ec4899' },
  { id: 'tech', name: 'Tecnologia', icon: Monitor, color: '#06b6d4' },
  { id: 'healthcare', name: 'Saúde', icon: Heart, color: '#ef4444' }
]

// Template Types
const TEMPLATE_TYPES = [
  { id: 'presentation', name: 'Apresentação', icon: Presentation },
  { id: 'course', name: 'Curso', icon: BookOpen },
  { id: 'explainer', name: 'Explicativo', icon: Lightbulb },
  { id: 'promo', name: 'Promocional', icon: Sparkles },
  { id: 'tutorial', name: 'Tutorial', icon: PlayCircle },
  { id: 'testimonial', name: 'Depoimento', icon: Users }
]

interface PPTXTemplate {
  id: string
  name: string
  description: string
  category: string
  type: string
  thumbnail: string
  previewUrl?: string
  tags: string[]
  isPremium: boolean
  isPopular: boolean
  isFavorite: boolean
  rating: number
  downloads: number
  duration: number // estimated duration in seconds
  slideCount: number
  features: string[]
  colorScheme: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  fonts: string[]
  animations: string[]
  audioIncluded: boolean
  avatarCompatible: boolean
  customizable: boolean
  createdAt: string
  updatedAt: string
  author: {
    name: string
    avatar: string
    verified: boolean
  }
}

interface TemplateFilters {
  category: string
  type: string
  duration: 'any' | 'short' | 'medium' | 'long' // <2min, 2-10min, >10min
  isPremium: boolean | null
  hasAudio: boolean | null
  hasAvatar: boolean | null
  rating: number
}

interface PPTXTemplateLibraryProps {
  onSelectTemplate: (template: PPTXTemplate) => void
  onPreviewTemplate: (template: PPTXTemplate) => void
  userPlan?: 'free' | 'pro' | 'enterprise'
}

// Mock templates data
const MOCK_TEMPLATES: PPTXTemplate[] = [
  {
    id: 'modern-business-pitch',
    name: 'Pitch Moderno de Negócios',
    description: 'Template profissional para apresentações de negócios com design clean e animações suaves',
    category: 'business',
    type: 'presentation',
    thumbnail: '/templates/modern-business.jpg',
    tags: ['negócios', 'pitch', 'moderno', 'profissional'],
    isPremium: false,
    isPopular: true,
    isFavorite: false,
    rating: 4.8,
    downloads: 2341,
    duration: 300, // 5 minutes
    slideCount: 12,
    features: ['Animações suaves', 'Gráficos inclusos', 'Cores personalizáveis'],
    colorScheme: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#f59e0b',
      background: '#ffffff'
    },
    fonts: ['Inter', 'Poppins'],
    animations: ['fade', 'slide', 'zoom'],
    audioIncluded: true,
    avatarCompatible: true,
    customizable: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-10-01',
    author: {
      name: 'Design Pro',
      avatar: '/avatars/designer1.jpg',
      verified: true
    }
  },
  {
    id: 'educational-course',
    name: 'Curso Educacional Interativo',
    description: 'Template ideal para criação de cursos online com elementos interativos e didáticos',
    category: 'education',
    type: 'course',
    thumbnail: '/templates/educational.jpg',
    tags: ['educação', 'curso', 'interativo', 'didático'],
    isPremium: true,
    isPopular: true,
    isFavorite: true,
    rating: 4.9,
    downloads: 1876,
    duration: 720, // 12 minutes
    slideCount: 20,
    features: ['Quizzes interativos', 'Animações educativas', 'Avatar professor'],
    colorScheme: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#f59e0b',
      background: '#f8fafc'
    },
    fonts: ['Open Sans', 'Montserrat'],
    animations: ['bounce', 'slide', 'fade'],
    audioIncluded: true,
    avatarCompatible: true,
    customizable: true,
    createdAt: '2024-02-10',
    updatedAt: '2024-09-25',
    author: {
      name: 'EduDesign',
      avatar: '/avatars/educator1.jpg',
      verified: true
    }
  },
  {
    id: 'creative-portfolio',
    name: 'Portfólio Criativo',
    description: 'Showcase seus trabalhos criativos com este template vibrante e dinâmico',
    category: 'creative',
    type: 'presentation',
    thumbnail: '/templates/creative-portfolio.jpg',
    tags: ['criativo', 'portfólio', 'arte', 'design'],
    isPremium: false,
    isPopular: false,
    isFavorite: false,
    rating: 4.6,
    downloads: 987,
    duration: 240, // 4 minutes
    slideCount: 15,
    features: ['Galeria de imagens', 'Transições artísticas', 'Música de fundo'],
    colorScheme: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#ec4899',
      background: '#1f2937'
    },
    fonts: ['Playfair Display', 'Source Sans Pro'],
    animations: ['artistic', 'zoom', 'rotate'],
    audioIncluded: true,
    avatarCompatible: false,
    customizable: true,
    createdAt: '2024-03-05',
    updatedAt: '2024-09-15',
    author: {
      name: 'Creative Studio',
      avatar: '/avatars/creative1.jpg',
      verified: false
    }
  },
  {
    id: 'tech-explainer',
    name: 'Explicativo de Tecnologia',
    description: 'Template técnico para explicar conceitos complexos de forma simples e visual',
    category: 'tech',
    type: 'explainer',
    thumbnail: '/templates/tech-explainer.jpg',
    tags: ['tecnologia', 'explicativo', 'técnico', 'visual'],
    isPremium: true,
    isPopular: true,
    isFavorite: false,
    rating: 4.7,
    downloads: 1456,
    duration: 480, // 8 minutes
    slideCount: 16,
    features: ['Diagramas técnicos', 'Animações explicativas', 'Código destacado'],
    colorScheme: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#f59e0b',
      background: '#0f172a'
    },
    fonts: ['JetBrains Mono', 'Inter'],
    animations: ['slide', 'fade', 'code-highlight'],
    audioIncluded: true,
    avatarCompatible: true,
    customizable: true,
    createdAt: '2024-01-20',
    updatedAt: '2024-10-05',
    author: {
      name: 'Tech Visuals',
      avatar: '/avatars/tech1.jpg',
      verified: true
    }
  }
]

export default function PPTXTemplateLibrary({ 
  onSelectTemplate, 
  onPreviewTemplate,
  userPlan = 'free' 
}: PPTXTemplateLibraryProps) {
  const [templates, setTemplates] = useState<PPTXTemplate[]>(MOCK_TEMPLATES)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<PPTXTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'name'>('popular')
  
  const [filters, setFilters] = useState<TemplateFilters>({
    category: 'all',
    type: 'all',
    duration: 'any',
    isPremium: null,
    hasAudio: null,
    hasAvatar: null,
    rating: 0
  })

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(template => template.category === activeCategory)
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(template => template.type === filters.type)
    }

    // Duration filter
    if (filters.duration !== 'any') {
      filtered = filtered.filter(template => {
        const duration = template.duration
        switch (filters.duration) {
          case 'short': return duration < 120
          case 'medium': return duration >= 120 && duration <= 600
          case 'long': return duration > 600
          default: return true
        }
      })
    }

    // Premium filter
    if (filters.isPremium !== null) {
      filtered = filtered.filter(template => template.isPremium === filters.isPremium)
    }

    // Audio filter
    if (filters.hasAudio !== null) {
      filtered = filtered.filter(template => template.audioIncluded === filters.hasAudio)
    }

    // Avatar filter
    if (filters.hasAvatar !== null) {
      filtered = filtered.filter(template => template.avatarCompatible === filters.hasAvatar)
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(template => template.rating >= filters.rating)
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads)
        break
      case 'recent':
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return filtered
  }, [templates, searchQuery, activeCategory, filters, sortBy])

  // Toggle favorite
  const toggleFavorite = (templateId: string) => {
    setFavorites(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
    
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    ))
  }

  // Handle template selection
  const handleSelectTemplate = (template: PPTXTemplate) => {
    if (template.isPremium && userPlan === 'free') {
      toast.error('Template premium requer plano Pro ou Enterprise')
      return
    }
    
    onSelectTemplate(template)
    toast.success(`Template "${template.name}" selecionado!`)
  }

  // Handle preview
  const handlePreview = (template: PPTXTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
    onPreviewTemplate(template)
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Template Card Component
  const TemplateCard = ({ template }: { template: PPTXTemplate }) => {
    const category = TEMPLATE_CATEGORIES.find(cat => cat.id === template.category)
    const type = TEMPLATE_TYPES.find(t => t.id === template.type)

    return (
      <motion.div
        className="group relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-200">
          {/* Template Thumbnail */}
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl opacity-20">
                {type?.icon && <type.icon />}
              </div>
            </div>
            
            {/* Overlay Badges */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {template.isPremium && (
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              {template.isPopular && (
                <Badge variant="secondary" className="bg-orange-500 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleFavorite(template.id)}
                  className="h-8 w-8 p-0"
                >
                  {template.isFavorite ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePreview(template)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <Button
                size="lg"
                onClick={() => handlePreview(template)}
                className="rounded-full h-16 w-16 p-0"
              >
                <PlayCircle className="h-8 w-8" />
              </Button>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Template Info */}
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                    {template.name}
                  </h3>
                  <div className="flex items-center ml-2 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {template.rating}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {template.description}
                </p>
              </div>

              {/* Template Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <FileText className="w-3 h-3 mr-1" />
                    {template.slideCount}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(template.duration)}
                  </span>
                  <span className="flex items-center">
                    <Download className="w-3 h-3 mr-1" />
                    {template.downloads}
                  </span>
                </div>
              </div>

              {/* Category and Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {category && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ color: category.color, borderColor: category.color }}
                    >
                      <category.icon className="w-3 h-3 mr-1" />
                      {category.name}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  {template.audioIncluded && (
                    <div title="Áudio incluído">
                      <Mic className="w-3 h-3 text-green-500" />
                    </div>
                  )}
                  {template.avatarCompatible && (
                    <div title="Compatível com avatar">
                      <Video className="w-3 h-3 text-blue-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleSelectTemplate(template)}
                className="w-full"
                size="sm"
                disabled={template.isPremium && userPlan === 'free'}
              >
                {template.isPremium && userPlan === 'free' ? (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Requer Pro
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Usar Template
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca de Templates</h2>
          <p className="text-muted-foreground">
            {filteredTemplates.length} templates encontrados
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as 'popular' | 'recent' | 'rating' | 'name')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Mais Popular</SelectItem>
              <SelectItem value="recent">Mais Recente</SelectItem>
              <SelectItem value="rating">Melhor Avaliado</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Layout className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto">
            <TabsTrigger value="all" className="flex items-center space-x-1">
              <Layout className="w-4 h-4" />
              <span>Todos</span>
            </TabsTrigger>
            {TEMPLATE_CATEGORIES.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex items-center space-x-1"
              >
                <category.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Advanced Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {TEMPLATE_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Duração</Label>
                <Select value={filters.duration} onValueChange={(value: string) => setFilters(prev => ({ ...prev, duration: value as 'any' | 'short' | 'medium' | 'long' }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="short">Curto (&lt;2min)</SelectItem>
                    <SelectItem value="medium">Médio (2-10min)</SelectItem>
                    <SelectItem value="long">Longo (&gt;10min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={filters.isPremium === true}
                  onCheckedChange={(checked) => setFilters(prev => ({ 
                    ...prev, 
                    isPremium: checked ? true : null 
                  }))}
                />
                <Label className="text-xs">Premium</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={filters.hasAudio === true}
                  onCheckedChange={(checked) => setFilters(prev => ({ 
                    ...prev, 
                    hasAudio: checked ? true : null 
                  }))}
                />
                <Label className="text-xs">Com Áudio</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={filters.hasAvatar === true}
                  onCheckedChange={(checked) => setFilters(prev => ({ 
                    ...prev, 
                    hasAvatar: checked ? true : null 
                  }))}
                />
                <Label className="text-xs">Avatar</Label>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    category: 'all',
                    type: 'all',
                    duration: 'any',
                    isPremium: null,
                    hasAudio: null,
                    hasAvatar: null,
                    rating: 0
                  })
                  setSearchQuery('')
                  setActiveCategory('all')
                }}
                className="h-8"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
      }>
        <AnimatePresence>
          {filteredTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros ou buscar por outros termos
          </p>
          <Button
            onClick={() => {
              setSearchQuery('')
              setActiveCategory('all')
              setFilters({
                category: 'all',
                type: 'all',
                duration: 'any',
                isPremium: null,
                hasAudio: null,
                hasAvatar: null,
                rating: 0
              })
            }}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Preview: {selectedTemplate?.name}</span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedTemplate && toggleFavorite(selectedTemplate.id)}
                >
                  {selectedTemplate?.isFavorite ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => selectedTemplate && handleSelectTemplate(selectedTemplate)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Usar Template
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Preview Area */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PlayCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Preview do template seria exibido aqui</p>
                </div>
              </div>
              
              {/* Template Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Slides</Label>
                  <p className="font-medium">{selectedTemplate.slideCount}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Duração</Label>
                  <p className="font-medium">{formatDuration(selectedTemplate.duration)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Avaliação</Label>
                  <p className="font-medium flex items-center">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {selectedTemplate.rating}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Downloads</Label>
                  <p className="font-medium">{selectedTemplate.downloads}</p>
                </div>
              </div>
              
              {/* Features */}
              <div>
                <Label className="text-xs text-muted-foreground">Features</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTemplate.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}