
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Search, 
  Clock, 
  Users, 
  BookOpen,
  Zap,
  Shield,
  HardHat,
  AlertTriangle,
  Star,
  TrendingUp,
  Award,
  Target,
  Filter
} from 'lucide-react'
import { NRTemplate } from '../lib/nr-templates'
import { toast } from 'react-hot-toast'

interface NRTemplateLibraryProps {
  onTemplateSelect: (template: NRTemplate) => void
  userProfile?: {
    role?: string
    experience?: 'beginner' | 'intermediate' | 'advanced'
    industry?: string
  }
}

export default function NRTemplateLibrary({
  onTemplateSelect,
  userProfile
}: NRTemplateLibraryProps) {
  const [templates, setTemplates] = useState<NRTemplate[]>([])
  const [recommendations, setRecommendations] = useState<NRTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNR, setSelectedNR] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  interface NRStats { total: number; byNR: Record<string, number>; topCategories: string[]; totalDuration: number; }
  const [stats, setStats] = useState<NRStats | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, selectedNR, selectedCategory])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (userProfile) {
        params.append('profile', encodeURIComponent(JSON.stringify(userProfile)))
      }

      const response = await fetch(`/api/templates/nr?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.templates)
        setStats(data.stats)
        
        if (data.recommendations) {
          setRecommendations(data.recommendations)
        }
      } else {
        toast.error('Erro ao carregar templates')
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Erro na conexão')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (!templates.length) return

    // Em produção, faria nova requisição à API com filtros
    // Aqui aplicamos filtros localmente para demonstração
    const filtered = templates.filter(template => {
      if (searchTerm && !template.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !template.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false
      }
      if (selectedNR !== 'all' && template.nr !== selectedNR) return false
      if (selectedCategory !== 'all' && template.category !== selectedCategory) return false
      return true
    })

    // Simular atualização dos templates filtrados
  }

  const selectTemplate = async (template: NRTemplate) => {
    try {
      const response = await fetch('/api/templates/nr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          user_profile: userProfile
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Template ${template.nr} selecionado!`)
        onTemplateSelect(data.template)
      } else {
        toast.error('Erro ao selecionar template')
      }
    } catch (error) {
      console.error('Error selecting template:', error)
      toast.error('Erro na conexão')
    }
  }

  const getNRIcon = (nr: string) => {
    const icons = {
      'NR-10': <Zap className="w-5 h-5" />,
      'NR-35': <HardHat className="w-5 h-5" />,
      'NR-33': <Shield className="w-5 h-5" />
    }
    return icons[nr as keyof typeof icons] || <BookOpen className="w-5 h-5" />
  }

  const getNRColor = (nr: string) => {
    const colors = {
      'NR-10': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'NR-35': 'bg-orange-100 text-orange-800 border-orange-200', 
      'NR-33': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[nr as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getDifficultyBadge = (duration: number, certificationHours?: number) => {
    if (duration <= 30) return { label: 'Básico', color: 'bg-green-100 text-green-800' }
    if (duration <= 60) return { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Avançado', color: 'bg-red-100 text-red-800' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando biblioteca de templates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Biblioteca de Templates NR</h3>
          <p className="text-sm text-gray-600">
            {stats && `${stats.total} templates disponíveis • ${stats.totalDuration} minutos de conteúdo`}
          </p>
        </div>

        {userProfile && (
          <div className="text-right">
            <Badge variant="outline" className="text-xs">
              {userProfile.role} • {userProfile.experience}
            </Badge>
            {userProfile.industry && (
              <p className="text-xs text-gray-500 mt-1">{userProfile.industry}</p>
            )}
          </div>
        )}
      </div>

      {/* Estatísticas rápidas */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.byNR['NR-10'] || 0}</div>
              <div className="text-sm text-gray-600">Templates NR-10</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.byNR['NR-35'] || 0}</div>
              <div className="text-sm text-gray-600">Templates NR-35</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.byNR['NR-33'] || 0}</div>
              <div className="text-sm text-gray-600">Templates NR-33</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar templates por título, palavras-chave ou conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Select value={selectedNR} onValueChange={setSelectedNR}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="NR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas NRs</SelectItem>
              <SelectItem value="NR-10">NR-10</SelectItem>
              <SelectItem value="NR-35">NR-35</SelectItem>
              <SelectItem value="NR-33">NR-33</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="Segurança Elétrica">Segurança Elétrica</SelectItem>
              <SelectItem value="Trabalho em Altura">Trabalho em Altura</SelectItem>
              <SelectItem value="Espaços Confinados">Espaços Confinados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Todos ({templates.length})
          </TabsTrigger>
          {recommendations.length > 0 && (
            <TabsTrigger value="recommended">
              <Star className="w-4 h-4 mr-1" />
              Recomendados ({recommendations.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="popular">
            <TrendingUp className="w-4 h-4 mr-1" />
            Populares
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => selectTemplate(template)}
                getNRIcon={getNRIcon}
                getNRColor={getNRColor}
                getDifficultyBadge={getDifficultyBadge}
              />
            ))}
          </div>
        </TabsContent>

        {recommendations.length > 0 && (
          <TabsContent value="recommended">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-blue-900 mb-2">
                🎯 Templates Recomendados para Você
              </h4>
              <p className="text-sm text-blue-700">
                Baseado no seu perfil: {userProfile?.experience} • {userProfile?.industry}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => selectTemplate(template)}
                  getNRIcon={getNRIcon}
                  getNRColor={getNRColor}
                  getDifficultyBadge={getDifficultyBadge}
                  recommended={true}
                />
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="popular">
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Templates populares baseados no uso da comunidade</p>
            <p className="text-sm">Em breve disponível</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente do card de template
interface TemplateCardProps {
  template: NRTemplate
  onSelect: () => void
  getNRIcon: (nr: string) => React.ReactNode
  getNRColor: (nr: string) => string
  getDifficultyBadge: (duration: number, hours?: number) => { label: string; color: string }
  recommended?: boolean
}

function TemplateCard({
  template,
  onSelect,
  getNRIcon,
  getNRColor,
  getDifficultyBadge,
  recommended = false
}: TemplateCardProps) {
  const difficultyBadge = getDifficultyBadge(template.duration_minutes, template.certification_hours)

  return (
    <Card className="h-full hover:shadow-lg transition-all cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getNRColor(template.nr)}`}>
              {getNRIcon(template.nr)}
            </div>
            <Badge variant="outline" className={getNRColor(template.nr)}>
              {template.nr}
            </Badge>
            {recommended && <Star className="w-4 h-4 text-blue-500" />}
          </div>
          
          <Badge variant="outline" className={difficultyBadge.color}>
            {difficultyBadge.label}
          </Badge>
        </div>
        
        <CardTitle className="text-lg leading-tight">{template.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Métricas principais */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{template.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{template.slides.length} slides</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Geral</span>
            </div>
          </div>

          {/* Certificação */}
          {template.certification_hours && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                Certificação: {template.certification_hours}h
              </span>
            </div>
          )}

          {/* Target audience */}
          <div className="text-xs text-gray-500">
            <Target className="w-3 h-3 inline mr-1" />
            {template.target_audience}
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-1">
            {template.keywords.slice(0, 3).map((keyword, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {template.keywords.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.keywords.length - 3}
              </Badge>
            )}
          </div>

          {/* Ação */}
          <Button className="w-full" size="sm">
            Usar Template
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
