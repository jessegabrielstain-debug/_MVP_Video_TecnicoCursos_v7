
'use client'

/**
 * 📊 DASHBOARD OVERVIEW - Visão Geral Principal
 * Dashboard centralizado com KPIs, gráficos e funcionalidades rápidas
 */

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatCard, StatsOverview } from '@/components/ui/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Upload,
  Users,
  Video,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Play,
  Download,
  Share2,
  Eye,
  Heart,
  Zap,
  Crown,
  Star,
  FileVideo,
  Image,
  Volume2,
  Mic,
  Settings,
  ArrowRight,
  MoreHorizontal,
  Sparkles,
  Calendar,
  Activity,
  Target
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/services'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Mock data (substituir por dados reais das APIs)
const mockStats = {
  overview: {
    totalProjects: 156,
    completedProjects: 89,
    processingProjects: 12,
    totalViews: 12847,
    totalDownloads: 3421,
    avgProcessingTime: 8.4,
    successRate: 94.2,
    storageUsed: 67.8
  },
  recentProjects: [
    {
      id: '1',
      name: 'NR-12 Segurança em Máquinas',
      status: 'completed',
      type: 'pptx',
      createdAt: '2024-09-24T10:30:00Z',
      duration: 180,
      views: 247,
      thumbnail: '/api/projects/1/thumbnail'
    },
    {
      id: '2', 
      name: 'Treinamento NR-35 Altura',
      status: 'processing',
      type: 'talking-photo',
      createdAt: '2024-09-24T08:15:00Z',
      duration: 0,
      views: 0,
      thumbnail: '/api/projects/2/thumbnail'
    },
    {
      id: '3',
      name: 'NR-10 Segurança Elétrica',
      status: 'draft',
      type: 'pptx',
      createdAt: '2024-09-23T16:45:00Z',
      duration: 0,
      views: 0,
      thumbnail: '/api/projects/3/thumbnail'
    }
  ],
  quickActions: [
    {
      id: 'upload-pptx',
      title: 'Upload PPTX',
      description: 'Enviar apresentação PowerPoint',
      icon: Upload,
      href: '/pptx-upload',
      color: 'primary',
      status: 'active'
    },
    {
      id: 'canvas-professional',
      title: 'Canvas Editor Professional',
      description: 'Editor profissional com Fabric.js + GSAP',
      icon: Star,
      href: '/canvas-editor-professional',
      color: 'primary',
      status: 'active',
      featured: true
    },
    {
      id: 'tts-audio-studio',
      title: 'TTS & Audio Studio Premium',
      description: 'ElevenLabs + Voice Cloning + Timeline',
      icon: Mic,
      href: '/tts-audio-studio',
      color: 'gradient',
      status: 'active',
      featured: true,
      badge: 'SPRINT 3'
    },
    {
      id: 'talking-photo',
      title: 'Talking Photo',
      description: 'Criar avatar falante',
      icon: Image,
      href: '/talking-photo',
      color: 'accent',
      status: 'active'
    },
    {
      id: 'effects-library',
      title: 'Effects Library Hollywood',
      description: 'GSAP + Three.js + Lottie Animations',
      icon: Sparkles,
      href: '/effects-library',
      color: 'gradient',
      status: 'active',
      featured: true,
      badge: 'SPRINT 4'
    },
    {
      id: 'editor',
      title: 'Editor PPTX',
      description: 'Editar apresentações',
      icon: FileVideo,
      href: '/pptx-editor',
      color: 'warning',
      status: 'partial'
    }
  ]
}

export default function DashboardOverview() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Simular carregamento de dados
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        console.error('Erro ao carregar sessão do usuário:', error)
      } finally {
        if (isMounted) {
          setAuthLoading(false)
        }
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

  const stats = [
    {
      title: 'Total de Projetos',
      value: mockStats.overview.totalProjects,
      description: 'Projetos criados na plataforma',
      icon: FileVideo,
      color: 'primary' as const,
      trend: {
        value: 12.5,
        label: 'vs mês anterior',
        isPositive: true
      }
    },
    {
      title: 'Projetos Concluídos',
      value: mockStats.overview.completedProjects,
      description: 'Vídeos finalizados e prontos',
      icon: CheckCircle,
      color: 'success' as const,
      trend: {
        value: 8.2,
        label: 'vs mês anterior',
        isPositive: true
      }
    },
    {
      title: 'Total de Visualizações',
      value: mockStats.overview.totalViews.toLocaleString(),
      description: 'Visualizações em todos os vídeos',
      icon: Eye,
      color: 'accent' as const,
      trend: {
        value: 15.7,
        label: 'vs mês anterior',
        isPositive: true
      }
    },
    {
      title: 'Taxa de Sucesso',
      value: `${mockStats.overview.successRate}%`,
      description: 'Processamentos bem-sucedidos',
      icon: Target,
      color: 'warning' as const,
      trend: {
        value: 2.1,
        label: 'vs mês anterior',
        isPositive: true
      }
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'processing': return 'warning'
      case 'draft': return 'secondary'
      case 'error': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'processing': return 'Processando'
      case 'draft': return 'Rascunho'
      case 'error': return 'Erro'
      default: return status
    }
  }

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'pptx': return FileVideo
      case 'talking-photo': return Image
      case 'avatar-3d': return Users
      case 'tts': return Volume2
      default: return Video
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">
            Bem-vindo de volta, {user?.user_metadata?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuário'}! 👋
          </h1>
          <p className="text-text-secondary mt-2">
            Aqui está um resumo das suas atividades no estúdio.
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Projeto
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {mockStats.quickActions.map((action) => {
              const Icon = action.icon
              return (
                <DropdownMenuItem key={action.id} asChild>
                  <Link href={action.href} className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <div className="flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-xs text-text-muted">{action.description}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        action.status === 'active' && "text-success border-success/20",
                        action.status === 'partial' && "text-warning border-warning/20"
                      )}
                    >
                      {action.status === 'active' ? '✓' : '◐'}
                    </Badge>
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Overview */}
      <StatsOverview 
        stats={stats} 
        loading={loading}
        columns={4}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Recent Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Projetos Recentes</CardTitle>
                  <CardDescription>Seus últimos trabalhos</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects">
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockStats.recentProjects.map((project) => {
                  const Icon = getProjectIcon(project.type)
                  return (
                    <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{project.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(project.status)}`}>
                            {getStatusText(project.status)}
                          </Badge>
                          {project.views > 0 && (
                            <div className="flex items-center gap-1 text-xs text-text-muted">
                              <Eye className="h-3 w-3" />
                              {project.views}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
                <CardDescription>Performance e disponibilidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Taxa de Sucesso</span>
                    <span className="text-sm text-success font-semibold">
                      {mockStats.overview.successRate}%
                    </span>
                  </div>
                  <Progress value={mockStats.overview.successRate} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uso de Armazenamento</span>
                    <span className="text-sm text-warning font-semibold">
                      {mockStats.overview.storageUsed}%
                    </span>
                  </div>
                  <Progress value={mockStats.overview.storageUsed} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 rounded-lg bg-bg-secondary">
                    <Clock className="h-5 w-5 mx-auto text-accent mb-1" />
                    <p className="text-xs text-text-muted">Tempo Médio</p>
                    <p className="font-semibold">{mockStats.overview.avgProcessingTime}min</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-bg-secondary">
                    <CheckCircle className="h-5 w-5 mx-auto text-success mb-1" />
                    <p className="text-xs text-text-muted">Processando</p>
                    <p className="font-semibold">{mockStats.overview.processingProjects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="text-center py-12">
            <FileVideo className="h-12 w-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gerenciamento de Projetos</h3>
            <p className="text-text-muted mb-6">
              Vista detalhada dos projetos em desenvolvimento
            </p>
            <Button asChild>
              <Link href="/projects">
                Ver Todos os Projetos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics Avançados</h3>
            <p className="text-text-muted mb-6">
              Métricas detalhadas e relatórios de performance
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/admin/metrics">
                  Métricas Admin
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/pptx-metrics">
                  Métricas PPTX
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          
          {/* Quick Actions Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {mockStats.quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.id} href={action.href}>
                  <Card className={cn(
                    "group hover:shadow-lg transition-all duration-200 cursor-pointer",
                    "hover:scale-[1.02]",
                    action.featured && "ring-2 ring-purple-500/20 bg-gradient-to-br from-purple-50/5 to-pink-50/5"
                  )}>
                    <CardContent className="p-6 relative">
                      {action.featured && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                            NOVO
                          </Badge>
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          action.featured 
                            ? "bg-gradient-to-r from-purple-600/10 to-pink-600/10"
                            : `bg-${action.color}/10`
                        )}>
                          <Icon className={cn(
                            "h-6 w-6",
                            action.featured 
                              ? "text-purple-600"
                              : `text-${action.color}`
                          )} />
                        </div>
                        <div>
                          <h3 className={cn(
                            "font-semibold",
                            action.featured && "text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text"
                          )}>
                            {action.title}
                          </h3>
                          <p className="text-sm text-text-muted">{action.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                action.status === 'active' && "text-success border-success/20",
                                action.status === 'partial' && "text-warning border-warning/20",
                                action.featured && "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none"
                              )}
                            >
                              {action.featured ? 'Sprint 2' : (action.status === 'active' ? 'Ativo' : 'Parcial')}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-text-muted group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Additional Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ferramentas Avançadas
              </CardTitle>
              <CardDescription>Acesse funcionalidades especializadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                
                <Button variant="outline" className="justify-start gap-3 h-auto p-4" asChild>
                  <Link href="/admin/configuracoes">
                    <Settings className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Configurações</p>
                      <p className="text-xs text-text-muted">Admin do sistema</p>
                    </div>
                  </Link>
                </Button>

                <Button variant="outline" className="justify-start gap-3 h-auto p-4" asChild>
                  <Link href="/render-studio">
                    <Zap className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Render Studio</p>
                      <p className="text-xs text-text-muted">Processamento avançado</p>
                    </div>
                  </Link>
                </Button>

                <Button variant="outline" className="justify-start gap-3 h-auto p-4" asChild>
                  <Link href="/enterprise">
                    <Crown className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Enterprise</p>
                      <p className="text-xs text-text-muted">Recursos corporativos</p>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
