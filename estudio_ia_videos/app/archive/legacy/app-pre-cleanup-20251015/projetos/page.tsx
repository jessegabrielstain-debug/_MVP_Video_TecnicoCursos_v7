
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import LayoutWithNavigation from '../../components/layout/layout-with-navigation'
import CreateProjectModal from '../../components/project/create-project-modal'
import { useProjects, deleteProject } from '../../hooks/use-projects'
import { 
  Plus, 
  Search, 
  Filter, 
  FileVideo, 
  Clock, 
  Play, 
  Download, 
  Trash2, 
  Edit,
  MoreVertical,
  Loader2,
  Folder,
  Calendar,
  Eye,
  Grid3x3,
  List
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { AppBreadcrumbs } from '../../components/navigation/app-breadcrumbs'
import { EmptyState } from '../../components/ui/empty-state'
import { LoadingOverlay } from '../../components/ui/loading-overlay'
import { AdvancedFilters, FilterConfig, SortConfig } from '../../components/filters/advanced-filters'
import { useKeyboardNavigation } from '../../hooks/use-keyboard-navigation'

export default function ProjetosPage() {
  const router = useRouter()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'updatedAt', direction: 'desc' })

  // Keyboard navigation
  useKeyboardNavigation()

  // Real data from API
  const { projects, loading, error, refresh } = useProjects(statusFilter)

  const getStatusBadge = (status: string) => {
    const variants = {
      COMPLETED: { label: 'Concluído', className: 'bg-green-100 text-green-700 border-green-200' },
      PROCESSING: { label: 'Processando', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      DRAFT: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      ERROR: { label: 'Erro', className: 'bg-red-100 text-red-700 border-red-200' },
      ARCHIVED: { label: 'Arquivado', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    }
    const variant = variants[status as keyof typeof variants] || variants.DRAFT
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  const handleOpenEditor = (projectId: string) => {
    router.push(`/editor/${projectId}`)
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${projectName}"?`)) return

    try {
      await deleteProject(projectId)
      toast.success('Projeto excluído com sucesso')
      refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir projeto')
    }
  }

  const handleDownload = async (project: any) => {
    if (!project.videoUrl) {
      toast.error('Vídeo ainda não está disponível')
      return
    }

    try {
      // Open video URL in new tab for download
      window.open(project.videoUrl, '_blank')
      toast.success('Download iniciado')
    } catch (error) {
      toast.error('Erro ao baixar vídeo')
    }
  }

  // Configuração dos filtros
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Rascunho' },
        { value: 'processing', label: 'Processando' },
        { value: 'completed', label: 'Concluído' },
        { value: 'error', label: 'Com Erro' },
        { value: 'archived', label: 'Arquivado' }
      ]
    }
  ]

  const sortOptions = [
    { value: 'updatedAt', label: 'Data de modificação' },
    { value: 'createdAt', label: 'Data de criação' },
    { value: 'name', label: 'Nome' },
    { value: 'views', label: 'Visualizações' }
  ]

  // Filter and sort projects
  let filteredProjects = projects.filter((project: any) => {
    // Search filter
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false
    }
    
    // Advanced filters
    if (filters.status && project.status !== filters.status.toUpperCase()) {
      return false
    }

    return true
  })

  // Sort projects
  filteredProjects = [...filteredProjects].sort((a: any, b: any) => {
    const field = sortConfig.field
    const direction = sortConfig.direction === 'asc' ? 1 : -1

    if (field === 'name') {
      return direction * a.name.localeCompare(b.name)
    }
    
    const aValue = a[field] || 0
    const bValue = b[field] || 0
    
    if (aValue < bValue) return -direction
    if (aValue > bValue) return direction
    return 0
  })

  return (
    <LayoutWithNavigation>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          {/* Breadcrumbs */}
          <AppBreadcrumbs />
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Meus Projetos</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie todos os seus projetos de vídeo em um só lugar
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Projeto
              </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              {/* Search */}
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
              filters={filterConfigs}
              onFilterChange={setFilters}
              onSortChange={setSortConfig}
              activeFilters={filters}
              sortOptions={sortOptions}
            />
          </div>

          {/* Projects Grid/List */}
          <div className="relative min-h-[400px]">
            <LoadingOverlay visible={loading} message="Carregando projetos..." />
            
            {error ? (
              <EmptyState
                icon={Folder}
                title="Erro ao carregar projetos"
                description="Ocorreu um erro ao buscar seus projetos"
                action={{
                  label: 'Tentar novamente',
                  onClick: refresh
                }}
              />
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={Folder}
                title={searchQuery || Object.keys(filters).length > 0 ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
                description={
                  searchQuery || Object.keys(filters).length > 0
                    ? 'Tente ajustar sua busca ou filtros'
                    : 'Comece criando seu primeiro projeto de vídeo'
                }
                action={!searchQuery && Object.keys(filters).length === 0 ? {
                  label: 'Criar Primeiro Projeto',
                  onClick: () => setCreateModalOpen(true),
                  icon: Plus
                } : undefined}
              />
            ) : (
              <div className={viewMode === 'grid' ? 
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
                "space-y-4"
              }>
              {filteredProjects.map((project: any) => (
                <Card 
                  key={project.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div 
                    className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden"
                    onClick={() => handleOpenEditor(project.id)}
                  >
                    {project.thumbnailUrl ? (
                      <Image
                        src={project.thumbnailUrl}
                        alt={project.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileVideo className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="lg" variant="secondary">
                        <Play className="h-5 w-5 mr-2" />
                        Abrir Editor
                      </Button>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(project.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate mb-1">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditor(project.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {project.videoUrl && (
                            <DropdownMenuItem onClick={() => handleDownload(project)}>
                              <Download className="h-4 w-4 mr-2" />
                              Baixar Vídeo
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Meta Info */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(project.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <FileVideo className="h-4 w-4" />
                          <span>{project.totalSlides || 0} slides</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{project.duration || 0}s</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{project.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </LayoutWithNavigation>
  )
}
