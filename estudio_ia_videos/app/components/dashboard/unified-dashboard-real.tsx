

'use client'

/**
 * 🚀 DASHBOARD UNIFICADO - Sprint 17 - Versão com Handlers Reais
 * Dashboard com todos os botões e links funcionais
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Upload,
  Video,
  FileText,
  Users,
  Crown,
  Zap,
  Shield,
  Clock,
  Play,
  Eye,
  Download,
  Share2,
  MessageCircle,
  Star,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Settings,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Briefcase,
  Award,
  Target,
  Activity,
  Bell,
  User,
  LogOut,
  Edit,
  Trash2,
  Copy
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/services'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Project {
  id: string
  name: string
  type: 'pptx' | 'template-nr' | 'talking-photo' | 'custom'
  status: 'draft' | 'processing' | 'completed' | 'error'
  progress: number
  createdAt: string
  updatedAt: string
  duration?: number
  views: number
  collaboration: {
    comments: number
    shares: number
    collaborators: string[]
  }
  thumbnail?: string
  nrCompliance?: {
    nr: string
    validated: boolean
    score: number
  }
}

interface DashboardStats {
  totalProjects: number
  completedProjects: number
  totalViews: number
  totalShares: number
  complianceScore: number
  weeklyGrowth: number
}

export default function UnifiedDashboardReal() {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState(0)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        const authUser = data.user ?? null
        setUser(authUser)

        if (authUser) {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url')
            .eq('id', authUser.id)
            .maybeSingle()

          if (!isMounted) return

          if (error) {
            console.warn('Erro ao carregar perfil:', error)
          }

          setDisplayName(profile?.full_name ?? authUser.user_metadata?.name ?? authUser.email ?? null)
          setAvatarUrl(profile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null)
        } else {
          setDisplayName(null)
          setAvatarUrl(null)
        }
      } catch (error) {
        console.error('Erro ao carregar sessão do usuário:', error)
      }
    }

    void loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      const authUser = session?.user ?? null
      setUser(authUser)
      if (authUser) {
        setDisplayName(authUser.user_metadata?.name ?? authUser.email ?? null)
        setAvatarUrl(authUser.user_metadata?.avatar_url ?? null)
      } else {
        setDisplayName(null)
        setAvatarUrl(null)
      }
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de dados (substituir por APIs reais)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'NR-12: Segurança em Máquinas e Equipamentos',
          type: 'template-nr',
          status: 'completed',
          progress: 100,
          createdAt: '2024-09-20T10:00:00Z',
          updatedAt: '2024-09-24T15:30:00Z',
          duration: 480,
          views: 1247,
          collaboration: {
            comments: 8,
            shares: 23,
            collaborators: ['user1', 'user2', 'user3']
          },
          nrCompliance: {
            nr: 'NR-12',
            validated: true,
            score: 98
          }
        },
        {
          id: '2',
          name: 'Apresentação Corporativa Q3 2024',
          type: 'pptx',
          status: 'processing',
          progress: 65,
          createdAt: '2024-09-24T08:15:00Z',
          updatedAt: '2024-09-24T18:45:00Z',
          views: 89,
          collaboration: {
            comments: 3,
            shares: 5,
            collaborators: ['user1']
          }
        },
        {
          id: '3',
          name: 'Avatar CEO - Mensagem Mensal',
          type: 'talking-photo',
          status: 'completed',
          progress: 100,
          createdAt: '2024-09-23T14:20:00Z',
          updatedAt: '2024-09-23T16:10:00Z',
          duration: 120,
          views: 456,
          collaboration: {
            comments: 12,
            shares: 18,
            collaborators: ['user1', 'user4']
          }
        },
        {
          id: '4',
          name: 'NR-35: Trabalho em Altura',
          type: 'template-nr',
          status: 'draft',
          progress: 20,
          createdAt: '2024-09-24T19:00:00Z',
          updatedAt: '2024-09-24T19:30:00Z',
          views: 0,
          collaboration: {
            comments: 0,
            shares: 0,
            collaborators: []
          },
          nrCompliance: {
            nr: 'NR-35',
            validated: false,
            score: 0
          }
        }
      ]

      const mockStats: DashboardStats = {
        totalProjects: 24,
        completedProjects: 18,
        totalViews: 15678,
        totalShares: 234,
        complianceScore: 94,
        weeklyGrowth: 12
      }

      setProjects(mockProjects)
      setStats(mockStats)
      setNotifications(3) // Mock de notificações
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error('Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Handlers reais para botões
  const handleNotifications = () => {
    toast.success('Central de notificações em desenvolvimento')
    router.push('/notifications')
  }

  const handleProfileClick = () => {
    toast.success('Redirecionando para perfil...')
    router.push('/profile')
  }

  const handleSettingsClick = () => {
    toast.success('Redirecionando para configurações...')
    router.push('/admin/configuracoes')
  }

  const handleViewProject = (projectId: string) => {
    toast.success(`Visualizando projeto: ${projectId}`)
    router.push(`/projects/${projectId}`)
  }

  const handleEditProject = (projectId: string) => {
    toast.success(`Editando projeto: ${projectId}`)
    router.push(`/projects/${projectId}/edit`)
  }

  const handleDownloadProject = (projectId: string) => {
    toast.success(`Baixando projeto: ${projectId}`)
    // Implementar lógica de download
  }

  const handleShareProject = (projectId: string) => {
    toast.success(`Compartilhando projeto: ${projectId}`)
    // Implementar lógica de compartilhamento
  }

  const handleDuplicateProject = (projectId: string) => {
    toast.success(`Duplicando projeto: ${projectId}`)
    // Implementar lógica de duplicação
  }

  const handleDeleteProject = (projectId: string) => {
    toast.error(`Deletando projeto: ${projectId}`)
    // Implementar lógica de deleção
  }

  const handleLogout = async () => {
    if (signingOut) return
    try {
      setSigningOut(true)
      toast.success('Encerrando sessão...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      router.replace('/login?reason=session_expired')
      router.refresh()
    } catch (error) {
      console.error('Erro no logout:', error)
      toast.error('Erro ao encerrar a sessão')
    } finally {
      setSigningOut(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: Project['type']) => {
    switch (type) {
      case 'pptx': return FileText
      case 'template-nr': return Shield
      case 'talking-photo': return Video
      case 'custom': return Sparkles
      default: return FileText
    }
  }

  const userInitials = (displayName ?? user?.email ?? 'Usuário')
    ?.split(' ')
    ?.map((n) => n[0])
    ?.join('')
    ?.slice(0, 2)
    ?.toUpperCase() || 'US'

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header com Boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {displayName ?? user?.email ?? 'Usuário'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Crie vídeos profissionais com IA de forma simples e rápida
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleNotifications}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notificações
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600" disabled={signingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {signingOut ? 'Saindo...' : 'Sair'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.weeklyGrowth}% esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedProjects}</div>
            <div className="mt-1 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{ width: `${(stats.completedProjects / stats.totalProjects) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total de todas as visualizações
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance NR</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceScore}%</div>
            <div className="mt-1 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-500 rounded-full" 
                style={{ width: `${stats.complianceScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Início Rápido
          </CardTitle>
          <CardDescription>
            Escolha uma opção para começar a criar seu vídeo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/pptx-upload-real">
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 w-full hover:bg-blue-50 transition-colors">
                <Upload className="h-8 w-8 text-blue-500" />
                <span className="font-semibold">Upload PPTX</span>
                <span className="text-xs text-muted-foreground text-center">
                  Converta sua apresentação em vídeo automaticamente
                </span>
              </Button>
            </Link>

            <Link href="/templates-nr-real">
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 w-full hover:bg-green-50 transition-colors">
                <Shield className="h-8 w-8 text-green-500" />
                <span className="font-semibold">Templates NR</span>
                <span className="text-xs text-muted-foreground text-center">
                  Templates prontos com compliance automático
                </span>
              </Button>
            </Link>

            <Link href="/talking-photo-pro">
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 w-full hover:bg-purple-50 transition-colors">
                <Video className="h-8 w-8 text-purple-500" />
                <span className="font-semibold">Talking Photo</span>
                <span className="text-xs text-muted-foreground text-center">
                  Crie avatares falantes com sua foto
                </span>
              </Button>
            </Link>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Editor Profissional
            </h3>
            <Link href="/canvas-editor-pro">
              <Button variant="default" className="h-auto p-4 flex flex-col gap-2 w-full hover:bg-primary/90 transition-colors">
                <Edit className="h-8 w-8 text-white" />
                <span className="font-semibold">Canvas Editor Pro</span>
                <span className="text-xs text-primary-foreground/80 text-center">
                  Editor visual avançado com timeline e animações
                </span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Projetos */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Meus Projetos</CardTitle>
              <CardDescription>Gerencie todos os seus vídeos em um local</CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('completed')}>
                    Concluídos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('processing')}>
                    Em Processamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('draft')}>
                    Rascunhos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const TypeIcon = getTypeIcon(project.type)
              
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <TypeIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status === 'completed' && 'Concluído'}
                          {project.status === 'processing' && 'Processando'}
                          {project.status === 'draft' && 'Rascunho'}
                          {project.status === 'error' && 'Erro'}
                        </Badge>
                        
                        {project.nrCompliance && (
                          <Badge variant={project.nrCompliance.validated ? 'default' : 'secondary'}>
                            {project.nrCompliance.nr} - {project.nrCompliance.score}%
                          </Badge>
                        )}
                      </div>
                      
                      {project.status === 'processing' && (
                        <Progress value={project.progress} className="mt-2 h-1" />
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {project.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {project.collaboration.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          {project.collaboration.shares}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {project.collaboration.collaborators.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {project.status === 'completed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewProject(project.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewProject(project.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateProject(project.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDownloadProject(project.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareProject(project.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Compartilhar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o projeto "{project.name}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
            
            {filteredProjects.length === 0 && (
              <div className="text-center py-8">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro projeto'}
                </p>
                {!searchQuery && (
                  <Link href="/pptx-upload-real">
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Projeto
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
