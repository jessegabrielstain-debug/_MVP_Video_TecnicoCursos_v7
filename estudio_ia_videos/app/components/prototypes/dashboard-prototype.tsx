
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play,
  FileText,
  Users,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  Calendar,
  Clock,
  Star,
  Zap,
  Shield,
  Video,
  Upload,
  Edit3,
  TrendingUp
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Project {
  id: string
  name: string
  type: string
  status: 'draft' | 'processing' | 'ready' | 'published'
  progress: number
  duration: string
  createdAt: string
  thumbnail: string
  compliance: number
}

interface DashboardPrototypeProps {
  onCreateProject?: () => void
  onOpenProject?: (project: Project) => void
}

const PROJECT_FILTER_OPTIONS = ['all', 'draft', 'ready'] as const
type ProjectFilterOption = (typeof PROJECT_FILTER_OPTIONS)[number]
const isProjectFilterOption = (value: string): value is ProjectFilterOption =>
  PROJECT_FILTER_OPTIONS.includes(value as ProjectFilterOption)

export function DashboardPrototype({ onCreateProject, onOpenProject }: DashboardPrototypeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<ProjectFilterOption>('all')
  
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'NR-12 Segurança em Máquinas',
      type: 'Treinamento de Segurança',
      status: 'ready',
      progress: 100,
      duration: '4:30',
      createdAt: '2025-09-25',
      thumbnail: '/nr12-intro.jpg',
      compliance: 95
    },
    {
      id: '2',
      name: 'NR-35 Trabalho em Altura',
      type: 'Curso Completo',
      status: 'processing',
      progress: 65,
      duration: '8:45',
      createdAt: '2025-09-24',
      thumbnail: '/nr35-thumb.jpg',
      compliance: 88
    },
    {
      id: '3',
      name: 'NR-33 Espaços Confinados',
      type: 'Módulo Básico',
      status: 'draft',
      progress: 30,
      duration: '6:20',
      createdAt: '2025-09-23',
      thumbnail: '/nr33-thumb.jpg',
      compliance: 72
    }
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      processing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      published: 'bg-blue-100 text-blue-800'
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <Play className="h-4 w-4" />
      case 'processing':
        return <Zap className="h-4 w-4 animate-pulse" />
      case 'draft':
        return <Edit3 className="h-4 w-4" />
      case 'published':
        return <Video className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleCreateProject = () => {
    toast.success('Criando novo projeto...')
    onCreateProject?.()
  }

  const handleOpenProject = (project: Project) => {
    toast.success(`Abrindo projeto: ${project.name}`)
    onOpenProject?.(project)
  }

  const handleQuickAction = (action: string) => {
    toast.success(`Ação executada: ${action}`)
  }

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Unificado</h1>
          <p className="text-gray-600">Gerencie todos os seus projetos de vídeos IA</p>
        </div>
        <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Projetos</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                +20% este mês
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vídeos Prontos</p>
                <p className="text-3xl font-bold text-green-600">8</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <Shield className="h-4 w-4 mr-1" />
                92% compliance médio
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Processamento</p>
                <p className="text-3xl font-bold text-yellow-600">3</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                Tempo médio: 5 min
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visualizações</p>
                <p className="text-3xl font-bold text-purple-600">1.2k</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                +35% engajamento
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button 
              variant="outline" 
              className="flex flex-col h-20 bg-blue-50 hover:bg-blue-100"
              onClick={() => handleQuickAction('Upload PPTX')}
            >
              <Upload className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-xs">Upload PPTX</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col h-20 bg-green-50 hover:bg-green-100"
              onClick={() => handleQuickAction('Template NR')}
            >
              <Shield className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-xs">Template NR</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col h-20 bg-purple-50 hover:bg-purple-100"
              onClick={() => handleQuickAction('Avatar 3D')}
            >
              <Users className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-xs">Avatar 3D</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col h-20 bg-orange-50 hover:bg-orange-100"
              onClick={() => handleQuickAction('Editor Canvas')}
            >
              <Edit3 className="h-6 w-6 text-orange-600 mb-2" />
              <span className="text-xs">Editor Canvas</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col h-20 bg-pink-50 hover:bg-pink-100"
              onClick={() => handleQuickAction('Analytics')}
            >
              <BarChart3 className="h-6 w-6 text-pink-600 mb-2" />
              <span className="text-xs">Analytics</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col h-20 bg-teal-50 hover:bg-teal-100"
              onClick={() => handleQuickAction('Configurações')}
            >
              <Settings className="h-6 w-6 text-teal-600 mb-2" />
              <span className="text-xs">Configurações</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Meus Projetos</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar projetos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select 
                value={filterStatus}
                onChange={(e) => {
                  const { value } = e.target
                  if (!isProjectFilterOption(value)) {
                    return
                  }
                  setFilterStatus(value)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="draft">Rascunhos</option>
                <option value="ready">Prontos</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  {/* Project Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                    <Video className="h-12 w-12 text-white opacity-50" />
                  </div>
                  
                  {/* Project Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.type}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusIcon(project.status)}
                        <span className="ml-1 capitalize">{project.status}</span>
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-600">{project.compliance}%</span>
                      </div>
                    </div>
                    
                    {project.status === 'processing' && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso:</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{project.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleOpenProject(project)}
                      >
                        {project.status === 'ready' ? 'Visualizar' : 'Continuar'}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum projeto encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Tente ajustar os filtros de busca' : 'Crie seu primeiro projeto de vídeo IA'}
              </p>
              <Button onClick={handleCreateProject}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Projeto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center">
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Dashboard Protótipo - Totalmente Navegável
        </Badge>
      </div>
    </div>
  )
}
