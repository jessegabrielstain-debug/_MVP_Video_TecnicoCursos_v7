
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/services'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Plus,
  FileVideo,
  Clock,
  Play,
  Download,
  Share2,
  Trash2,
  Settings,
  User,
  LogOut,
  BarChart3,
  Zap,
  Upload,
  BookOpen,
  Building,
  Database,
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
  Link2
} from 'lucide-react'
import PRDFeaturesShowcase from './prd-features-showcase'
import NextFeaturesPanel from './next-features-panel'
import { ImageFallback } from '../ui/image-fallback'
import { useRenderCounter } from '@/lib/debug-utils'

interface VideoProject {
  id: string
  name: string
  status: 'draft' | 'processing' | 'completed' | 'error'
  createdAt: string
  updatedAt: string
  duration: number
  slidesCount: number
  thumbnail: string
  videoUrl?: string
}

export default function DashboardHome() {
  // Debug monitoring
  useRenderCounter('DashboardHome')
  
  const router = useRouter()
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data } = await supabase.auth.getUser()
      if (!isMounted) return
      const authUser = data.user ?? null
      setUser(authUser)

      if (authUser) {
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url')
            .eq('id', authUser.id)
            .maybeSingle()

          if (!isMounted) return
          setDisplayName(profile?.full_name ?? authUser.user_metadata?.name ?? authUser.email ?? null)
          setAvatarUrl(profile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null)
        } catch (error) {
          console.error('Erro ao carregar perfil do usuário:', error)
          setDisplayName(authUser.user_metadata?.name ?? authUser.email ?? null)
          setAvatarUrl(authUser.user_metadata?.avatar_url ?? null)
        }
      } else {
        setDisplayName(null)
        setAvatarUrl(null)
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

  // Simular carregamento de projetos
  useEffect(() => {
    const loadProjects = async () => {
      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dados mock dos projetos
      const mockProjects: VideoProject[] = [
        {
          id: '1',
          name: 'NR-12: Segurança em Máquinas',
          status: 'completed',
          createdAt: '2024-08-29T10:30:00Z',
          updatedAt: '2024-08-29T11:15:00Z',
          duration: 240,
          slidesCount: 8,
          thumbnail: '/images/nr12-thumb.jpg',
          videoUrl: '/videos/nr12-complete.mp4'
        },
        {
          id: '2',
          name: 'NR-35: Trabalho em Altura',
          status: 'processing',
          createdAt: '2024-08-29T14:20:00Z',
          updatedAt: '2024-08-29T14:25:00Z',
          duration: 180,
          slidesCount: 6,
          thumbnail: '/images/nr35-thumb.jpg'
        },
        {
          id: '3',
          name: 'NR-33: Espaços Confinados',
          status: 'draft',
          createdAt: '2024-08-28T16:45:00Z',
          updatedAt: '2024-08-28T16:45:00Z',
          duration: 0,
          slidesCount: 4,
          thumbnail: '/images/nr33-thumb.jpg'
        }
      ]
      
      setProjects(mockProjects)
      setLoading(false)
    }

    loadProjects()
  }, [])

  const handleSignOut = async () => {
    if (signingOut) return
    try {
      setSigningOut(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      router.replace('/login?reason=session_expired')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setSigningOut(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'processing':
        return 'Processando'
      case 'draft':
        return 'Rascunho'
      case 'error':
        return 'Erro'
      default:
        return 'Desconhecido'
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Estúdio IA</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.push('/editor')}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {displayName ?? user?.email ?? 'Usuário'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/ai')}
                  title="IA Avançada - Sprint 4"
                >
                  <Zap className="w-4 h-4 text-purple-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/templates')}
                  title="Biblioteca de Templates"
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/whitelabel')}
                  title="White Label"
                >
                  <Building className="w-4 h-4 text-orange-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/admin/metrics')}
                  title="Admin Dashboard"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/optimization')}
                  title="Centro de Otimização"
                >
                  <Zap className="w-4 h-4 text-blue-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/enterprise')}
                  title="Enterprise Studio - Sprint 9"
                  className="bg-purple-50 text-purple-600 hover:bg-purple-100"
                >
                  <Crown className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="sr-only">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{projects.length}</span>
                <FileVideo className="w-5 h-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vídeos Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'completed').length}
                </span>
                <Zap className="w-5 h-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tempo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {Math.floor(projects.reduce((sum, p) => sum + p.duration, 0) / 60)}
                </span>
                <span className="text-sm text-gray-500">min</span>
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Em Processamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'processing').length}
                </span>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sprint 7 - Optimization Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cache Hit Rate</p>
                  <p className="text-xl font-bold text-blue-600">87.3%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+5.2%</span>
                  </div>
                </div>
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tempo Médio PPTX</p>
                  <p className="text-xl font-bold text-green-600">1.2s</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">-23%</span>
                  </div>
                </div>
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Templates Cached</p>
                  <p className="text-xl font-bold text-purple-600">28</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Database className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-purple-500">42MB</span>
                  </div>
                </div>
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Otimização Geral</p>
                  <p className="text-xl font-bold text-orange-600">94%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">Excelente</span>
                  </div>
                </div>
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sprint 8 - IA Generativa & Automação */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sprint 8 - IA Generativa & Automação</h2>
              <p className="text-gray-600 text-sm">Recursos avançados de inteligência artificial e automação</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Content AI Studio */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => router.push('/ai-generative')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Content AI Studio</h3>
                    <p className="text-sm text-gray-600">IA Generativa Avançada</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Scripts Gerados</span>
                    <span className="font-semibold text-purple-600">47</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Qualidade Média</span>
                    <span className="font-semibold text-green-600">89%</span>
                  </div>
                </div>
                <Badge className="w-full justify-center">
                  <Brain className="h-3 w-3 mr-2" />
                  IA Generativa Ativa
                </Badge>
              </CardContent>
            </Card>

            {/* Workflow Automation */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => router.push('/automation')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Automação</h3>
                    <p className="text-sm text-gray-600">Workflows Inteligentes</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Workflows Ativos</span>
                    <span className="font-semibold text-blue-600">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                    <span className="font-semibold text-green-600">96%</span>
                  </div>
                </div>
                <Badge className="w-full justify-center" variant="secondary">
                  <Activity className="h-3 w-3 mr-2" />
                  Pipeline Automático
                </Badge>
              </CardContent>
            </Card>

            {/* External Integrations */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => router.push('/integrations')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Integrações</h3>
                    <p className="text-sm text-gray-600">YouTube, Vimeo, LMS</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conexões Ativas</span>
                    <span className="font-semibold text-green-600">4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Publicações</span>
                    <span className="font-semibold text-blue-600">156</span>
                  </div>
                </div>
                <Badge className="w-full justify-center" variant="outline">
                  <Share2 className="h-3 w-3 mr-2" />
                  Multi-Plataforma
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Features Panel */}
        <div className="mb-8">
          <NextFeaturesPanel />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-blue-50 hover:border-blue-200"
              onClick={() => router.push('/editor')}
            >
              <Plus className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <p className="font-medium">Novo Projeto</p>
                <p className="text-xs text-gray-500">Criar do zero</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-orange-50 hover:border-orange-200"
              onClick={() => router.push('/templates')}
            >
              <BookOpen className="w-8 h-8 text-orange-600" />
              <div className="text-center">
                <p className="font-medium">Templates NR</p>
                <p className="text-xs text-gray-500">NR-10, NR-35, NR-33</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-purple-50 hover:border-purple-200 relative"
              onClick={() => router.push('/pptx-studio')}
            >
              <Badge className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs">
                🚀 NOVO
              </Badge>
              <Upload className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <p className="font-medium">PPTX Studio Animaker</p>
                <p className="text-xs text-gray-500">Editor Timeline Profissional</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-green-50 hover:border-green-200 relative"
              onClick={() => router.push('/pptx-editor-real')}
            >
              <div className="absolute top-2 right-2">
                <Badge className="bg-green-600 text-white text-xs">REAL</Badge>
              </div>
              <Play className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <p className="font-medium">Editor Real + TTS</p>
                <p className="text-xs text-gray-500">Renderização real com TTS</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-emerald-50 hover:border-emerald-200 relative"
              onClick={() => router.push('/pptx-upload-real')}
            >
              <div className="absolute top-2 right-2">
                <Badge className="bg-emerald-600 text-white text-xs">IA</Badge>
              </div>
              <Upload className="w-8 h-8 text-emerald-600" />
              <div className="text-center">
                <p className="font-medium">Upload PPTX Real</p>
                <p className="text-xs text-gray-500">Processamento IA avançado</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-purple-50 hover:border-purple-200 relative"
              onClick={() => router.push('/pptx-animaker-clone')}
            >
              <div className="absolute top-2 right-2">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">CLONE</Badge>
              </div>
              <Crown className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <p className="font-medium">Animaker Clone</p>
                <p className="text-xs text-gray-500">Layout 100% idêntico + 3D</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-indigo-50 hover:border-indigo-200 relative"
              onClick={() => router.push('/pptx-upload-production')}
            >
              <div className="absolute top-2 right-2">
                <Badge className="bg-indigo-600 text-white text-xs">SPRINT 1</Badge>
              </div>
              <Upload className="w-8 h-8 text-indigo-600" />
              <div className="text-center">
                <p className="font-medium">Upload Production</p>
                <p className="text-xs text-gray-500">S3 + Processing Real</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-green-50 hover:border-green-200"
              onClick={() => router.push('/templates')}
            >
              <FileVideo className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <p className="font-medium">Templates NR</p>
                <p className="text-xs text-gray-500">Usar modelo pronto</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-purple-50 hover:border-purple-200"
              onClick={() => router.push('/ai')}
            >
              <Zap className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <p className="font-medium">IA Avançada</p>
                <p className="text-xs text-gray-500">GPT-4 & Otimização</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-blue-50 hover:border-blue-200"
              onClick={() => router.push('/optimization')}
            >
              <Database className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <p className="font-medium">Otimização</p>
                <p className="text-xs text-gray-500">Cache & Performance</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-purple-50 hover:border-purple-200 relative"
              onClick={() => router.push('/avatar-studio-vidnoz')}
            >
              <div className="absolute top-2 right-2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs">VIDNOZ</Badge>
              </div>
              <Heart className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <p className="font-medium">Avatar 3D Pro</p>
                <p className="text-xs text-gray-500">Vidnoz Talking Head</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col gap-3 hover:bg-orange-50 hover:border-orange-200"
              onClick={() => router.push('/whitelabel')}
            >
              <Building className="w-8 h-8 text-orange-600" />
              <div className="text-center">
                <p className="font-medium">White Label</p>
                <p className="text-xs text-gray-500">Personalizar marca</p>
              </div>
            </Button>
          </div>
        </div>

        {/* PRD Features Showcase */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Sprint 8 - Implementação Completa do PRD
              </h2>
              <p className="text-sm text-gray-600">Todas as funcionalidades do Product Requirements Document</p>
            </div>
            <Button 
              onClick={() => router.push('/studio-prd')}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Testar PRD Completo
            </Button>
          </div>
          <PRDFeaturesShowcase />
        </div>

        {/* Sprint 11 - Nova Geração */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sprint 11 - Funcionalidades de Nova Geração</h2>
              <p className="text-gray-600 text-sm">IA avançada, voice cloning, 3D imersivo e certificados digitais</p>
            </div>
            <Badge className="bg-yellow-500 text-yellow-900 animate-pulse">
              <Star className="h-3 w-3 mr-1" />
              NOVO
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {/* IA Generativa Avançada */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => router.push('/ai-advanced')}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">IA Avançada</h3>
                    <p className="text-xs text-gray-600">GPT-4o, Claude, Llama</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                    5 Modelos
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Voice Cloning */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => router.push('/voice-cloning')}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Voice Cloning</h3>
                    <p className="text-xs text-gray-600">Clone sua voz</p>
                  </div>
                  <Badge className="bg-pink-100 text-pink-800 text-xs">
                    Personalizado
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 3D Environments */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => router.push('/3d-environments-advanced')}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">3D Imersivo</h3>
                    <p className="text-xs text-gray-600">Ambientes realistas</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    Ray Tracing
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Native */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => router.push('/mobile-native')}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Smartphone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">App Mobile</h3>
                    <p className="text-xs text-gray-600">PWA+ Nativo</p>
                  </div>
                  <Badge className="bg-cyan-100 text-cyan-800 text-xs">
                    Offline
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Avatar 3D Vidnoz Studio */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group relative" onClick={() => router.push('/avatar-studio-vidnoz')}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl group-hover:scale-110 transition-transform relative">
                    <Heart className="h-6 w-6 text-white" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Vidnoz Studio</h3>
                    <p className="text-xs text-gray-600">Avatar 3D Falante</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs">
                    <Crown className="h-2 w-2 mr-1" />
                    Hiper-real
                  </Badge>
                </div>
                <div className="absolute top-1 right-1">
                  <Badge className="bg-yellow-500 text-yellow-900 text-xs px-1 py-0.5 animate-bounce">
                    NEW
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* certificados digitais Certificates */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => router.push('/certificados digitais-certificates')}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">certificados digitais</h3>
                    <p className="text-xs text-gray-600">Certificados NFT</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    Verificável
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Featured Avatar 3D Section */}
          <div className="mt-8 mb-8">
            <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-2xl shadow-xl">
                      <Heart className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Vidnoz Talking Head Studio</h3>
                      <p className="text-gray-600 text-lg">Avatares 3D Hiper-realistas com Tecnologia Vidnoz</p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold px-4 py-2">
                      <Crown className="h-4 w-4 mr-2" />
                      TECNOLOGIA VIDNOZ
                    </Badge>
                    <Badge className="bg-purple-600 text-white text-center">
                      99% Lip Sync
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="bg-white/70 rounded-lg p-4 shadow">
                      <div className="text-3xl font-bold text-purple-600">6</div>
                      <div className="text-sm text-gray-600">Avatares Premium</div>
                      <div className="text-xs text-gray-500">Brasileiros Diversos</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/70 rounded-lg p-4 shadow">
                      <div className="text-3xl font-bold text-blue-600">8K</div>
                      <div className="text-sm text-gray-600">Ultra HD</div>
                      <div className="text-xs text-gray-500">Qualidade Cinema</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/70 rounded-lg p-4 shadow">
                      <div className="text-3xl font-bold text-green-600">99%</div>
                      <div className="text-sm text-gray-600">Lip Sync</div>
                      <div className="text-xs text-gray-500">Precisão Perfeita</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
                  <Button 
                    onClick={() => router.push('/avatar-studio-hyperreal')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all px-8 py-3 text-lg"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Studio Básico
                  </Button>
                  <Button 
                    onClick={() => router.push('/avatar-studio-vidnoz')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all px-8 py-3 text-lg"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Vidnoz Studio PRO
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://www.vidnoz.com/talking-head.html', '_blank')}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50 px-6 py-3 text-lg"
                  >
                    <Link2 className="h-5 w-5 mr-2" />
                    Vidnoz Original
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                    Implementação completa baseada em engenharia reversa do sistema Vidnoz. 
                    Mesmo motor, mesma qualidade, interface otimizada para o mercado brasileiro.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Projetos Recentes</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Simular navegação para página de todos os projetos
                alert('Página "Todos os Projetos" em desenvolvimento. Em breve você poderá ver todos os seus projetos organizados!');
              }}
            >
              Ver Todos
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {project.slidesCount} slides • {formatDuration(project.duration)}
                      </CardDescription>
                    </div>
                    <Badge className={`ml-2 ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="aspect-video rounded-lg mb-4 relative overflow-hidden">
                    <ImageFallback 
                      src={project.thumbnail}
                      alt={`Thumbnail para ${project.name}`}
                      fill={true}
                      className="object-cover rounded-lg"
                      fallbackIcon="image"
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Criado em {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {project.status === 'completed' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Simular visualização de vídeo
                            alert(`Visualizando vídeo: ${project.name}\n\nEm breve você poderá assistir aos vídeos diretamente no player integrado!`);
                          }}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Visualizar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Simular download
                            alert(`Iniciando download de: ${project.name}\n\nEm breve você poderá fazer download em vários formatos (MP4, WebM, GIF)!`);
                          }}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </>
                    )}
                    
                    {project.status === 'draft' && (
                      <Button 
                        size="sm" 
                        onClick={() => router.push(`/editor?project=${project.id}`)}
                      >
                        Continuar Edição
                      </Button>
                    )}
                    
                    {project.status === 'processing' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Processando...
                      </div>
                    )}
                    
                    <Button size="sm" variant="ghost" className="ml-auto">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {projects.length === 0 && (
            <Card className="p-12 text-center">
              <FileVideo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum projeto ainda</h3>
              <p className="text-gray-600 mb-6">
                Crie seu primeiro vídeo de treinamento com IA
              </p>
              <Button onClick={() => router.push('/editor')}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Projeto
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
    </>
  )
}
