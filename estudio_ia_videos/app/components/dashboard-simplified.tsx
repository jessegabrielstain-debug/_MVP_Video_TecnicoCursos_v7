

'use client'

/**
* 🚨 DASHBOARD ULTRA SIMPLIFICADO - Sem hooks complexos, sem loops
*/

import { useEffect, useMemo, useState } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Plus,
  FileVideo,
  Clock,
  Play,
  Download,
  Share2,
  Settings,
  User,
  LogOut,
  BarChart3,
  Upload,
  BookOpen,
  Building,
  TrendingUp,
  Activity,
  Target,
  Sparkles,
  Star,
  Mic,
  Globe,
  Shield,
  Brain,
  Heart,
  Volume2,
  Smartphone,
  Crown,
  Workflow,
  Link2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  Zap
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/services'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const MOCK_PROJECTS = [
  {
    id: '1',
    name: 'NR-12 Segurança em Máquinas',
    description: 'Treinamento sobre operação segura de equipamentos',
    status: 'completed' as const,
    duration: 180,
    slidesCount: 15,
    totalSlides: 15,
    thumbnailUrl: 'https://i.imgur.com/nr12-seguranca.jpg',
    videoUrl: 'https://example.com/video1.mp4',
    views: 124,
    downloads: 34,
    createdAt: '2024-09-20T10:30:00Z',
    updatedAt: '2024-09-20T14:30:00Z'
  },
  {
    id: '2',
    name: 'NR-35 Trabalho em Altura',
    description: 'Procedimentos de segurança para trabalhos elevados',
    status: 'processing' as const,
    duration: 240,
    slidesCount: 20,
    totalSlides: 25,
    thumbnailUrl: 'https://i.imgur.com/nr35-altura.jpg',
    videoUrl: null,
    views: 45,
    downloads: 8,
    createdAt: '2024-09-20T08:15:00Z',
    updatedAt: '2024-09-20T12:45:00Z'
  },
  {
    id: '3',
    name: 'NR-10 Segurança Elétrica',
    description: 'Prevenção de acidentes em instalações elétricas',
    status: 'draft' as const,
    duration: 0,
    slidesCount: 0,
    totalSlides: 18,
    thumbnailUrl: 'https://i.imgur.com/nr10-eletrica.jpg',
    videoUrl: null,
    views: 0,
    downloads: 0,
    createdAt: '2024-09-20T09:00:00Z',
    updatedAt: '2024-09-20T09:00:00Z'
  }
]

const MOCK_METRICS = {
  overview: {
    totalProjects: 15,
    completedProjects: 8,
    processingProjects: 3,
    totalDuration: 2850,
    totalViews: 1247,
    totalDownloads: 342,
    avgProcessingTime: 12
  },
  projectStatus: [
    { status: 'completed', count: 8 },
    { status: 'processing', count: 3 },
    { status: 'draft', count: 4 }
  ],
  performance: {
    avgProcessingTime: 12,
    successRate: 94,
    cacheHitRate: 87
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    archived: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  }
  
  const labels = {
    completed: 'Concluído',
    processing: 'Processando',
    draft: 'Rascunho',
    error: 'Erro',
    archived: 'Arquivado'
  }
  
  return (
    <Badge className={variants[status as keyof typeof variants] || variants.draft}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

export default function DashboardSimplified() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        logger.error('Erro ao carregar sessão do usuário', error instanceof Error ? error : new Error(String(error)), { component: 'DashboardSimplified' })
      }
    }

    void loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase])
  
  const filteredProjects = MOCK_PROJECTS.filter(project => 
    activeFilter === 'all' || project.status === activeFilter
  )

  const handleCreateProject = () => {
    logger.info('Creating new project', { component: 'DashboardSimplified' })
    // Simple navigation without complex routing
    window.location.href = '/pptx/upload'
  }

  const handleProjectClick = (projectId: string) => {
    logger.info('Opening project', { projectId, component: 'DashboardSimplified' })
    // Simple navigation without complex routing
    window.location.href = `/project/${projectId}`
  }

  const handleSignOut = async () => {
    if (signingOut) return
    try {
      setSigningOut(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      window.location.href = '/login?reason=session_expired'
    } catch (error) {
      logger.error('Erro ao encerrar sessão', error instanceof Error ? error : new Error(String(error)), { component: 'DashboardSimplified' })
    } finally {
      setSigningOut(false)
    }
  }

  const displayName = user?.user_metadata?.name ?? user?.email ?? 'Usuário'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <FileVideo className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Estúdio IA
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dashboard Simplificado - Safe Mode
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="h-4 w-4 text-green-500" />
                Ultra Safe Mode
              </div>
              
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Usuário</p>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={signingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? 'Saindo...' : 'Sair'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Totais</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_METRICS.overview.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {MOCK_METRICS.overview.completedProjects} concluídos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_METRICS.overview.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_METRICS.overview.totalDownloads}</div>
              <p className="text-xs text-muted-foregreen">
                Total de downloads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_METRICS.performance.successRate}%</div>
              <p className="text-xs text-green-600">
                Processamento bem-sucedido
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Project Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Meus Projetos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie seus vídeos de treinamento
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleCreateProject}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'Todos', count: MOCK_PROJECTS.length },
            { key: 'completed', label: 'Concluídos', count: MOCK_PROJECTS.filter(p => p.status === 'completed').length },
            { key: 'processing', label: 'Processando', count: MOCK_PROJECTS.filter(p => p.status === 'processing').length },
            { key: 'draft', label: 'Rascunhos', count: MOCK_PROJECTS.filter(p => p.status === 'draft').length }
          ].map(filter => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.key)}
              className="gap-2"
            >
              {filter.label}
              <Badge variant="secondary" className="text-xs">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Card 
              key={project.id}
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:shadow-blue-100 dark:hover:shadow-blue-900/20"
              onClick={() => handleProjectClick(project.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Project Stats */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{Math.floor(project.duration / 60)}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileVideo className="h-4 w-4 text-gray-400" />
                    <span>{project.slidesCount} slides</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span>{project.views}</span>
                  </div>
                </div>

                {/* Progress Bar (para projetos em processamento) */}
                {project.status === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Processando...</span>
                      <span>{Math.floor((project.slidesCount / project.totalSlides) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(project.slidesCount / project.totalSlides) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between pt-2">
                  <div className="flex gap-2">
                    {project.status === 'completed' && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Play className="h-3 w-3" />
                          Visualizar
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Download className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {project.status === 'processing' && (
                      <Button size="sm" variant="outline" className="gap-1" disabled>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Processando
                      </Button>
                    )}
                    {project.status === 'draft' && (
                      <Button size="sm" variant="outline" className="gap-1">
                        <Settings className="h-3 w-3" />
                        Editar
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="gap-1">
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {activeFilter === 'all' 
                ? 'Comece criando seu primeiro projeto de vídeo'
                : `Nenhum projeto com status "${activeFilter}" encontrado`
              }
            </p>
            <Button
              onClick={handleCreateProject}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Primeiro Projeto
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

