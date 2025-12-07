'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Star, 
  Download, 
  Search, 
  Filter,
  Eye,
  Clock,
  Award,
  Briefcase,
  Shield,
  Users,
  Building,
  Zap
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Template {
  id: string
  name: string
  description: string
  category: 'seguranca' | 'treinamento' | 'corporativo' | 'apresentacao' | 'relatorio'
  thumbnail: string
  rating: number
  downloads: number
  isPremium: boolean
  tags: string[]
  createdAt: string
  slides: number
  duration: string
}

interface TemplateLibraryProps {
  onTemplateSelect?: (template: Template) => void
}

export function TemplateLibrary({ onTemplateSelect }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [isLoading, setIsLoading] = useState(true)

  // Templates mock data - em produção viria de uma API
  const mockTemplates: Template[] = [
    {
      id: 'tpl-001',
      name: 'NR-35 Trabalho em Altura',
      description: 'Template completo para treinamento de trabalho em altura conforme NR-35',
      category: 'seguranca',
      thumbnail: '/templates/nr35-thumb.jpg',
      rating: 4.8,
      downloads: 1250,
      isPremium: true,
      tags: ['NR-35', 'Altura', 'Segurança', 'Treinamento'],
      createdAt: '2024-10-01',
      slides: 45,
      duration: '25 min'
    },
    {
      id: 'tpl-002',
      name: 'NR-10 Segurança Elétrica',
      description: 'Apresentação profissional sobre segurança em instalações elétricas',
      category: 'seguranca',
      thumbnail: '/templates/nr10-thumb.jpg',
      rating: 4.9,
      downloads: 980,
      isPremium: true,
      tags: ['NR-10', 'Elétrica', 'Segurança'],
      createdAt: '2024-09-28',
      slides: 38,
      duration: '20 min'
    },
    {
      id: 'tpl-003',
      name: 'Integração de Novos Funcionários',
      description: 'Template para apresentação de boas-vindas e integração corporativa',
      category: 'treinamento',
      thumbnail: '/templates/integracao-thumb.jpg',
      rating: 4.6,
      downloads: 750,
      isPremium: false,
      tags: ['Integração', 'RH', 'Corporativo'],
      createdAt: '2024-10-05',
      slides: 28,
      duration: '15 min'
    },
    {
      id: 'tpl-004',
      name: 'Relatório Executivo Mensal',
      description: 'Template profissional para relatórios executivos e dashboards',
      category: 'relatorio',
      thumbnail: '/templates/relatorio-thumb.jpg',
      rating: 4.7,
      downloads: 1100,
      isPremium: false,
      tags: ['Relatório', 'Executivo', 'Dashboard'],
      createdAt: '2024-09-30',
      slides: 22,
      duration: '12 min'
    },
    {
      id: 'tpl-005',
      name: 'Apresentação Corporativa Premium',
      description: 'Template elegante para apresentações institucionais e comerciais',
      category: 'corporativo',
      thumbnail: '/templates/corporativo-thumb.jpg',
      rating: 4.5,
      downloads: 650,
      isPremium: true,
      tags: ['Corporativo', 'Institucional', 'Premium'],
      createdAt: '2024-10-03',
      slides: 35,
      duration: '18 min'
    },
    {
      id: 'tpl-006',
      name: 'NR-12 Segurança em Máquinas',
      description: 'Template especializado para treinamento em segurança de máquinas',
      category: 'seguranca',
      thumbnail: '/templates/nr12-thumb.jpg',
      rating: 4.8,
      downloads: 890,
      isPremium: true,
      tags: ['NR-12', 'Máquinas', 'Segurança'],
      createdAt: '2024-09-25',
      slides: 42,
      duration: '22 min'
    }
  ]

  useEffect(() => {
    // Simular carregamento de templates
    const loadTemplates = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTemplates(mockTemplates)
      setFilteredTemplates(mockTemplates)
      setIsLoading(false)
    }

    loadTemplates()
  }, [])

  useEffect(() => {
    // Filtrar templates por busca e categoria
    let filtered = templates

    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (selectedCategory !== 'todos') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    setFilteredTemplates(filtered)
  }, [searchQuery, selectedCategory, templates])

  const categories = [
    { id: 'todos', name: 'Todos', icon: FileText, count: templates.length },
    { id: 'seguranca', name: 'Segurança', icon: Shield, count: templates.filter(t => t.category === 'seguranca').length },
    { id: 'treinamento', name: 'Treinamento', icon: Users, count: templates.filter(t => t.category === 'treinamento').length },
    { id: 'corporativo', name: 'Corporativo', icon: Building, count: templates.filter(t => t.category === 'corporativo').length },
    { id: 'relatorio', name: 'Relatórios', icon: Briefcase, count: templates.filter(t => t.category === 'relatorio').length },
  ]

  const getCategoryIcon = (category: Template['category']) => {
    switch (category) {
      case 'seguranca': return Shield
      case 'treinamento': return Users
      case 'corporativo': return Building
      case 'relatorio': return Briefcase
      default: return FileText
    }
  }

  const handleTemplateSelect = (template: Template) => {
    toast.success(`Template "${template.name}" selecionado!`)
    if (onTemplateSelect) {
      onTemplateSelect(template)
    }
  }

  const handleTemplatePreview = (template: Template) => {
    toast(`Visualizando template "${template.name}"`, { icon: 'ℹ️' })
    // Implementar preview modal
  }

  const handleTemplateDownload = (template: Template) => {
    toast.success(`Baixando template "${template.name}"`)
    // Implementar download
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blue-600" />
            Biblioteca de Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando templates...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blue-600" />
            Biblioteca de Templates ({filteredTemplates.length})
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {templates.filter(t => !t.isPremium).length} Gratuitos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Busca e Filtros */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar templates por nome, descrição ou tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categorias */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center space-x-1"
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Grid de Templates */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-medium text-gray-700 mb-2">Nenhum template encontrado</h3>
            <p className="text-sm text-gray-500">
              Tente ajustar os filtros ou termos de busca
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const CategoryIcon = getCategoryIcon(template.category)
              return (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    {/* Header do Template */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon className="h-4 w-4 text-blue-600" />
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      {template.isPremium && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    {/* Thumbnail Placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-400" />
                    </div>

                    {/* Informações do Template */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {template.description}
                      </p>
                    </div>

                    {/* Estatísticas */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{template.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="h-3 w-3" />
                          <span>{template.downloads}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{template.slides}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{template.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleTemplateSelect(template)}
                        className="flex-1"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Usar Template
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTemplatePreview(template)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTemplateDownload(template)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}