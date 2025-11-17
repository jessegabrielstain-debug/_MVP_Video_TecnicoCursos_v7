'use client'

/**
 * 🎯 UNIFIED DASHBOARD - SIMPLE VERSION
 * Comprehensive dashboard integrating all system modules
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  Video, 
  Users, 
  Clock, 
  TrendingUp, 
  Activity,
  Play,
  Pause,
  Download,
  Eye,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react'

interface DashboardStats {
  totalProjects: number
  activeRenders: number
  completedToday: number
  totalViews: number
  avgRenderTime: number
  systemHealth: {
    cpu: number
    memory: number
    storage: number
    connections: number
  }
}

interface Project {
  id: string
  title: string
  status: 'draft' | 'rendering' | 'completed' | 'error'
  progress: number
  createdAt: string
  duration?: string
  views?: number
}

interface RenderJob {
  id: string
  projectId: string
  projectTitle: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  progress: number
  startedAt: string
  estimatedTime?: string
}

export default function UnifiedDashboardSimple() {
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadDashboardData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load unified stats
      const statsResponse = await fetch('/api/dashboard/unified-stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load recent projects
      const projectsResponse = await fetch('/api/projects?limit=5')
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData.projects || [])
      }

      // Load active render jobs
      const jobsResponse = await fetch('/api/render/jobs?status=active')
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        setRenderJobs(jobsData.jobs || [])
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'processing': case 'rendering': return 'bg-blue-500'
      case 'queued': case 'draft': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'processing': return 'Processando'
      case 'rendering': return 'Renderizando'
      case 'queued': return 'Na fila'
      case 'draft': return 'Rascunho'
      case 'error': return 'Erro'
      default: return status
    }
  }

  if (loading && !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Unificado</h1>
          <p className="text-muted-foreground">
            Visão geral completa do sistema de criação de vídeos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Auto-refresh
          </Button>
          <Button onClick={loadDashboardData} disabled={loading}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                Todos os projetos criados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renders Ativos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRenders}</div>
              <p className="text-xs text-muted-foreground">
                Em processamento agora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos Hoje</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">
                Vídeos finalizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRenderTime}min</div>
              <p className="text-xs text-muted-foreground">
                Por renderização
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="renders">Renders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Projetos Recentes</CardTitle>
                <CardDescription>Últimos projetos criados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {getStatusText(project.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Saúde do Sistema</CardTitle>
                  <CardDescription>Métricas de performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4" />
                        <span className="text-sm">CPU</span>
                      </div>
                      <span className="text-sm font-medium">{stats.systemHealth.cpu}%</span>
                    </div>
                    <Progress value={stats.systemHealth.cpu} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm">Memória</span>
                      </div>
                      <span className="text-sm font-medium">{stats.systemHealth.memory}%</span>
                    </div>
                    <Progress value={stats.systemHealth.memory} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="h-4 w-4" />
                        <span className="text-sm">Armazenamento</span>
                      </div>
                      <span className="text-sm font-medium">{stats.systemHealth.storage}%</span>
                    </div>
                    <Progress value={stats.systemHealth.storage} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wifi className="h-4 w-4" />
                        <span className="text-sm">Conexões</span>
                      </div>
                      <span className="text-sm font-medium">{stats.systemHealth.connections}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Projetos</CardTitle>
              <CardDescription>Gerencie seus projetos de vídeo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
                      <div>
                        <h3 className="font-medium">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Criado em {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        {project.duration && (
                          <p className="text-sm text-muted-foreground">
                            Duração: {project.duration}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {project.views && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>{project.views}</span>
                        </div>
                      )}
                      <Badge variant="outline">
                        {getStatusText(project.status)}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Renders Tab */}
        <TabsContent value="renders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs de Renderização</CardTitle>
              <CardDescription>Acompanhe o progresso dos renders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {renderJobs.map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{job.projectTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          Iniciado em {new Date(job.startedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {getStatusText(job.status)}
                      </Badge>
                    </div>
                    
                    {job.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                        {job.estimatedTime && (
                          <p className="text-sm text-muted-foreground">
                            Tempo estimado: {job.estimatedTime}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {renderJobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum job de renderização ativo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Métricas de desempenho do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
                    <p className="text-sm text-muted-foreground">Total de visualizações</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats?.avgRenderTime || 0}min</div>
                    <p className="text-sm text-muted-foreground">Tempo médio de render</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Métricas do sistema em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU</span>
                        <span>{stats.systemHealth.cpu}%</span>
                      </div>
                      <Progress value={stats.systemHealth.cpu} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memória</span>
                        <span>{stats.systemHealth.memory}%</span>
                      </div>
                      <Progress value={stats.systemHealth.memory} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Armazenamento</span>
                        <span>{stats.systemHealth.storage}%</span>
                      </div>
                      <Progress value={stats.systemHealth.storage} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}