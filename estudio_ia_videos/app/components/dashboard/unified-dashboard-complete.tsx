'use client'

/**
 * 🚀 DASHBOARD UNIFICADO COMPLETO - Estúdio IA de Vídeos
 * Interface única integrando todos os módulos:
 * - PPTX Studio (Importação)
 * - Editor de Vídeo (Canvas)
 * - Avatar 3D (Geração)
 * - TTS (Text-to-Speech)
 * - Render (Pipeline)
 * - Export (MP4)
 * 
 * Fluxo Completo: Importar → Editar → Renderizar → Exportar → Salvar
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Upload,
  Video,
  FileText,
  Play,
  Download,
  Settings,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Mic,
  User,
  Palette,
  Film,
  Save,
  Share2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  PlayCircle,
  StopCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Interfaces
interface Project {
  id: string
  name: string
  type: 'pptx' | 'template-nr' | 'talking-photo' | 'custom'
  status: 'draft' | 'processing' | 'completed' | 'error'
  createdAt: string
  updatedAt: string
  thumbnail?: string
}

interface UnifiedWorkflow {
  projectId: string
  currentStep: 'import' | 'edit' | 'avatar' | 'tts' | 'render' | 'export' | 'complete'
  steps: {
    import: { status: 'pending' | 'processing' | 'completed' | 'error', data?: any }
    edit: { status: 'pending' | 'processing' | 'completed' | 'error', data?: any }
    avatar: { status: 'pending' | 'processing' | 'completed' | 'error', data?: any }
    tts: { status: 'pending' | 'processing' | 'completed' | 'error', data?: any }
    render: { status: 'pending' | 'processing' | 'completed' | 'error', data?: any }
    export: { status: 'pending' | 'processing' | 'completed' | 'error', data?: any }
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    userId: string
    totalDuration?: number
    outputUrl?: string
  }
}

// Hook para gerenciar workflows
function useUnifiedWorkflow() {
  const [workflows, setWorkflows] = useState<Map<string, UnifiedWorkflow>>(new Map())
  const [loading, setLoading] = useState(false)

  const createProject = useCallback(async (data: {
    name: string
    type: 'pptx' | 'template-nr' | 'talking-photo' | 'custom'
    source: { type: 'upload' | 'template' | 'blank', data?: any }
  }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create project')

      const result = await response.json()
      setWorkflows(prev => new Map(prev.set(result.project.id, result.workflow)))
      
      toast.success('Projeto criado com sucesso!')
      return result

    } catch (error) {
      toast.error('Erro ao criar projeto')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProject = useCallback(async (projectId: string, action: string, data?: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/unified', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, action, data })
      })

      if (!response.ok) throw new Error('Failed to update project')

      const result = await response.json()
      setWorkflows(prev => new Map(prev.set(projectId, result.workflow)))
      
      toast.success(`${action} executado com sucesso!`)
      return result

    } catch (error) {
      toast.error(`Erro ao executar ${action}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getWorkflow = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/unified?projectId=${projectId}`)
      if (!response.ok) throw new Error('Failed to get workflow')

      const result = await response.json()
      setWorkflows(prev => new Map(prev.set(projectId, result.workflow)))
      return result.workflow

    } catch (error) {
      console.error('Error getting workflow:', error)
      return null
    }
  }, [])

  return {
    workflows,
    loading,
    createProject,
    updateProject,
    getWorkflow
  }
}

// Componente principal
export default function UnifiedDashboard() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { workflows, loading, createProject, updateProject, getWorkflow } = useUnifiedWorkflow()

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState('projects')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Estados para criação de projeto
  const [newProject, setNewProject] = useState({
    name: '',
    type: 'pptx' as const,
    source: { type: 'blank' as const, data: null }
  })

  // Estados para edição
  const [editorData, setEditorData] = useState({
    slides: [],
    timeline: [],
    assets: []
  })

  // Estados para avatar e TTS
  const [avatarConfig, setAvatarConfig] = useState({
    model: 'default',
    voice: 'pt-BR-female',
    script: ''
  })

  // Carregar projetos
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

  useEffect(() => {
    if (user?.id) {
      void loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  // Handlers
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Nome do projeto é obrigatório')
      return
    }

    try {
      const result = await createProject(newProject)
      setProjects(prev => [...prev, result.project])
      setShowCreateDialog(false)
      setNewProject({ name: '', type: 'pptx', source: { type: 'blank', data: null } })
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleFileUpload = async (file: File, projectId?: string) => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    if (projectId) formData.append('projectId', projectId)

    try {
      let endpoint = '/api/files/upload'
      if (file.name.endsWith('.pptx')) {
        endpoint = '/api/pptx/upload'
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      toast.success('Arquivo enviado com sucesso!')
      
      if (projectId) {
        await updateProject(projectId, 'edit', { import: result })
      }

      return result

    } catch (error) {
      toast.error('Erro no upload do arquivo')
      throw error
    }
  }

  const handleStepExecution = async (projectId: string, step: string, data?: any) => {
    try {
      await updateProject(projectId, step, data)
      await getWorkflow(projectId) // Refresh workflow status
    } catch (error) {
      console.error(`Error executing ${step}:`, error)
    }
  }

  // Render step status
  const renderStepStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  // Render workflow progress
  const renderWorkflowProgress = (workflow: UnifiedWorkflow) => {
    const steps = ['import', 'edit', 'avatar', 'tts', 'render', 'export']
    const completedSteps = steps.filter(step => workflow.steps[step as keyof typeof workflow.steps]?.status === 'completed').length
    const progress = (completedSteps / steps.length) * 100

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progresso do Projeto</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
        
        <div className="grid grid-cols-3 gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
              {renderStepStatus(workflow.steps[step as keyof typeof workflow.steps]?.status || 'pending')}
              <span className="text-xs capitalize">{step}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Acesso Necessário</CardTitle>
            <CardDescription>Faça login para acessar o Estúdio IA de Vídeos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Estúdio IA de Vídeos</h1>
              <Badge variant="secondary">Versão Unificada</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="render">Renderização</TabsTrigger>
            <TabsTrigger value="export">Exportação</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const workflow = workflows.get(project.id)
                return (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Tipo: {project.type} • Criado em {new Date(project.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {workflow && renderWorkflowProgress(workflow)}
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProject(project)
                            setActiveTab('editor')
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStepExecution(project.id, 'render')}
                          disabled={loading}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Renderizar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStepExecution(project.id, 'export')}
                          disabled={loading}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Exportar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-6">
            {selectedProject ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Canvas Editor */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Editor de Canvas</CardTitle>
                    <CardDescription>Edite slides, adicione elementos e configure o layout</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Film className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">Canvas Editor</p>
                        <p className="text-sm text-gray-400">Arraste elementos aqui</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Slide
                      </Button>
                      <Button size="sm" variant="outline">
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Mídia
                      </Button>
                      <Button size="sm" variant="outline">
                        <Palette className="w-4 h-4 mr-1" />
                        Temas
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Controls Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle>Controles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Avatar Configuration */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Avatar 3D</label>
                      <Select value={avatarConfig.model} onValueChange={(value) => 
                        setAvatarConfig(prev => ({ ...prev, model: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Avatar Padrão</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Voice Configuration */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Voz TTS</label>
                      <Select value={avatarConfig.voice} onValueChange={(value) => 
                        setAvatarConfig(prev => ({ ...prev, voice: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR-female">Feminina (PT-BR)</SelectItem>
                          <SelectItem value="pt-BR-male">Masculina (PT-BR)</SelectItem>
                          <SelectItem value="en-US-female">Female (EN-US)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Script */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Script</label>
                      <Textarea
                        placeholder="Digite o texto que o avatar irá falar..."
                        value={avatarConfig.script}
                        onChange={(e) => setAvatarConfig(prev => ({ ...prev, script: e.target.value }))}
                        rows={4}
                      />
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button 
                        className="w-full" 
                        onClick={() => handleStepExecution(selectedProject.id, 'edit', editorData)}
                        disabled={loading}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Edição
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleStepExecution(selectedProject.id, 'avatar', avatarConfig)}
                        disabled={loading}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Gerar Avatar
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleStepExecution(selectedProject.id, 'tts', { 
                          text: avatarConfig.script, 
                          voice: avatarConfig.voice 
                        })}
                        disabled={loading}
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Gerar Áudio
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Edit className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um Projeto</h3>
                    <p className="text-gray-500">Escolha um projeto na aba "Projetos" para começar a editar</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Render Tab */}
          <TabsContent value="render" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline de Renderização</CardTitle>
                <CardDescription>Monitore o processo de renderização dos seus vídeos</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedProject && workflows.get(selectedProject.id) ? (
                  <div className="space-y-6">
                    {renderWorkflowProgress(workflows.get(selectedProject.id)!)}
                    
                    <div className="flex space-x-4">
                      <Button 
                        onClick={() => handleStepExecution(selectedProject.id, 'render')}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Iniciar Renderização
                      </Button>
                      <Button variant="outline" disabled={loading}>
                        <StopCircle className="w-4 h-4 mr-2" />
                        Pausar
                      </Button>
                      <Button variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar Status
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Projeto Selecionado</h3>
                    <p className="text-gray-500">Selecione um projeto para visualizar o status da renderização</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exportação de Vídeos</CardTitle>
                <CardDescription>Configure e exporte seus vídeos em diferentes formatos</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedProject ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Formato</label>
                        <Select defaultValue="mp4">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mp4">MP4 (Recomendado)</SelectItem>
                            <SelectItem value="webm">WebM</SelectItem>
                            <SelectItem value="mov">MOV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Qualidade</label>
                        <Select defaultValue="1080p">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4k">4K (3840x2160)</SelectItem>
                            <SelectItem value="1080p">Full HD (1920x1080)</SelectItem>
                            <SelectItem value="720p">HD (1280x720)</SelectItem>
                            <SelectItem value="480p">SD (854x480)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button 
                        onClick={() => handleStepExecution(selectedProject.id, 'export', {
                          format: 'mp4',
                          quality: '1080p'
                        })}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Vídeo
                      </Button>
                      <Button variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar
                      </Button>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Download className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Projeto Selecionado</h3>
                    <p className="text-gray-500">Selecione um projeto para configurar a exportação</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Projeto</DialogTitle>
            <DialogDescription>
              Escolha o tipo de projeto e configure as opções iniciais
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Projeto</label>
              <Input
                placeholder="Digite o nome do projeto..."
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Projeto</label>
              <Select 
                value={newProject.type} 
                onValueChange={(value: string) => setNewProject(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pptx">PowerPoint (PPTX)</SelectItem>
                  <SelectItem value="template-nr">Template NR</SelectItem>
                  <SelectItem value="talking-photo">Talking Photo</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fonte</label>
              <Select 
                value={newProject.source.type} 
                onValueChange={(value: string) => setNewProject(prev => ({ 
                  ...prev, 
                  source: { ...prev.source, type: value } 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Projeto em Branco</SelectItem>
                  <SelectItem value="upload">Upload de Arquivo</SelectItem>
                  <SelectItem value="template">Usar Template</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newProject.source.type === 'upload' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Arquivo</label>
                <Input
                  type="file"
                  accept=".pptx,.pdf,.mp4,.mov"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setNewProject(prev => ({ 
                        ...prev, 
                        source: { ...prev.source, data: file } 
                      }))
                    }
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProject} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Projeto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}