/**
 * 📁 Project Management Component
 * Advanced project management with CRUD operations, versioning, and metadata
 */

'use client'

import React, { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Archive, 
  Star, 
  StarOff,
  Eye,
  Download,
  Upload,
  Share,
  Settings,
  Clock,
  Users,
  FileText,
  Video,
  Image,
  Music,
  Calendar,
  Tag,
  GitBranch,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  ExternalLink,
  Bookmark,
  BookmarkCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

const statusColors = {
  draft: 'bg-gray-500',
  active: 'bg-blue-500',
  completed: 'bg-green-500',
  archived: 'bg-yellow-500',
  cancelled: 'bg-red-500'
}

const priorityColors = {
  low: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  high: 'text-red-600 bg-red-100'
}

const typeIcons = {
  video: Video,
  audio: Music,
  image: Image,
  document: FileText,
  presentation: FileText,
  other: FolderOpen
}

export function ProjectManagement() {
  const {
    projects,
    currentProject,
    projectVersions,
    projectStats,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    archiveProject,
    restoreProject,
    setCurrentProject,
    createVersion,
    restoreVersion,
    deleteVersion,
    addCollaborator,
    removeCollaborator,
    updatePermissions,
    exportProject,
    importProject,
    searchProjects,
    getProjectAnalytics
  } = useProjects()

  const [activeTab, setActiveTab] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false)
  const [isCollaboratorDialogOpen, setIsCollaboratorDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<unknown>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('updated_at')
  const [viewMode, setViewMode] = useState('grid')
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    type: 'video',
    priority: 'medium',
    tags: '',
    is_public: false
  })
  const [newVersion, setNewVersion] = useState({
    name: '',
    description: '',
    changes: ''
  })
  const [newCollaborator, setNewCollaborator] = useState({
    email: '',
    role: 'viewer'
  })

  const handleCreateProject = async () => {
    try {
      const projectData = {
        ...newProject,
        tags: newProject.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        metadata: {
          created_via: 'dashboard',
          initial_version: '1.0.0'
        }
      }
      await createProject(projectData)
      setIsCreateDialogOpen(false)
      setNewProject({
        name: '',
        description: '',
        type: 'video',
        priority: 'medium',
        tags: '',
        is_public: false
      })
      toast.success('Project created successfully')
    } catch (error) {
      toast.error('Failed to create project')
    }
  }

  const handleUpdateProject = async () => {
    if (!selectedProject) return
    
    try {
      await updateProject(selectedProject.id, selectedProject)
      setIsEditDialogOpen(false)
      toast.success('Project updated successfully')
    } catch (error) {
      toast.error('Failed to update project')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId)
      toast.success('Project deleted successfully')
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }

  const handleDuplicateProject = async (projectId: string) => {
    try {
      await duplicateProject(projectId)
      toast.success('Project duplicated successfully')
    } catch (error) {
      toast.error('Failed to duplicate project')
    }
  }

  const handleArchiveProject = async (projectId: string) => {
    try {
      await archiveProject(projectId)
      toast.success('Project archived successfully')
    } catch (error) {
      toast.error('Failed to archive project')
    }
  }

  const handleCreateVersion = async () => {
    if (!selectedProject) return
    
    try {
      await createVersion(selectedProject.id, newVersion)
      setIsVersionDialogOpen(false)
      setNewVersion({
        name: '',
        description: '',
        changes: ''
      })
      toast.success('Version created successfully')
    } catch (error) {
      toast.error('Failed to create version')
    }
  }

  const handleAddCollaborator = async () => {
    if (!selectedProject) return
    
    try {
      await addCollaborator(selectedProject.id, newCollaborator.email, newCollaborator.role)
      setIsCollaboratorDialogOpen(false)
      setNewCollaborator({
        email: '',
        role: 'viewer'
      })
      toast.success('Collaborator added successfully')
    } catch (error) {
      toast.error('Failed to add collaborator')
    }
  }

  const handleExportProject = async (projectId: string) => {
    try {
      await exportProject(projectId)
      toast.success('Project exported successfully')
    } catch (error) {
      toast.error('Failed to export project')
    }
  }

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    const matchesType = filterType === 'all' || project.type === filterType
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'starred' && project.is_starred) ||
                      (activeTab === 'recent' && new Date(project.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                      (activeTab === 'shared' && project.collaborators?.length > 0)
    
    return matchesSearch && matchesStatus && matchesType && matchesTab
  }) || []

  const sortedProjects = filteredProjects.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'updated_at':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      default:
        return 0
    }
  })

  const getProjectProgress = (project: any) => {
    if (project.status === 'completed') return 100
    if (project.status === 'active') return 60
    if (project.status === 'draft') return 20
    return 0
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading projects: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Project Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and collaborate on your video projects
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats?.total || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +{projectStats?.created_this_month || 0} this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats?.active || 0}</div>
            <div className="text-xs text-muted-foreground">
              {projectStats?.completed || 0} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats?.total_collaborators || 0}</div>
            <div className="text-xs text-muted-foreground">
              across all projects
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats?.storage_used || '0 GB'}</div>
            <Progress value={projectStats?.storage_percentage || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="document">Document</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Last Updated</SelectItem>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedProjects.map((project) => {
          const TypeIcon = typeIcons[project.type as keyof typeof typeIcons] || FolderOpen
          const progress = getProjectProgress(project)
          
          return (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || 'No description'}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setCurrentProject(project.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedProject(project)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateProject(project.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedProject(project)
                          setIsVersionDialogOpen(true)
                        }}
                      >
                        <GitBranch className="mr-2 h-4 w-4" />
                        Versions
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedProject(project)
                          setIsCollaboratorDialogOpen(true)
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Collaborators
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportProject(project.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleArchiveProject(project.id)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                    {project.status}
                  </Badge>
                  <Badge className={priorityColors[project.priority as keyof typeof priorityColors]}>
                    {project.priority}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{project.collaborators?.length || 0}</span>
                  </div>
                </div>

                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {project.collaborators?.slice(0, 3).map((collaborator: any, index: number) => (
                      <Avatar key={index} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={collaborator.avatar} />
                        <AvatarFallback className="text-xs">
                          {collaborator.name?.charAt(0) || collaborator.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {(project.collaborators?.length || 0) > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                        +{(project.collaborators?.length || 0) - 3}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Toggle star
                      updateProject(project.id, { is_starred: !project.is_starred })
                    }}
                  >
                    {project.is_starred ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sortedProjects.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first project'}
              </p>
              {!searchQuery && filterStatus === 'all' && filterType === 'all' && (
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Set up a new project with initial configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enter project name..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Describe your project..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-type">Type</Label>
                <Select value={newProject.type} onValueChange={(value) => setNewProject({ ...newProject, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-priority">Priority</Label>
                <Select value={newProject.priority} onValueChange={(value) => setNewProject({ ...newProject, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-tags">Tags</Label>
              <Input
                id="project-tags"
                value={newProject.tags}
                onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                placeholder="Enter tags separated by commas..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="project-public"
                checked={newProject.is_public}
                onCheckedChange={(checked) => setNewProject({ ...newProject, is_public: checked })}
              />
              <Label htmlFor="project-public">Make project public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProject.name}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and settings
            </DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project-name">Project Name</Label>
                <Input
                  id="edit-project-name"
                  value={selectedProject.name}
                  onChange={(e) => setSelectedProject({ ...selectedProject, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-project-description">Description</Label>
                <Textarea
                  id="edit-project-description"
                  value={selectedProject.description || ''}
                  onChange={(e) => setSelectedProject({ ...selectedProject, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-project-status">Status</Label>
                  <Select 
                    value={selectedProject.status} 
                    onValueChange={(value) => setSelectedProject({ ...selectedProject, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-project-priority">Priority</Label>
                  <Select 
                    value={selectedProject.priority} 
                    onValueChange={(value) => setSelectedProject({ ...selectedProject, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Management Dialog */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Project Versions</DialogTitle>
            <DialogDescription>
              Manage project versions and restore previous states
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Create New Version</h4>
                <Button size="sm" onClick={handleCreateVersion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Version
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version-name">Version Name</Label>
                  <Input
                    id="version-name"
                    value={newVersion.name}
                    onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                    placeholder="v1.1.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version-description">Description</Label>
                  <Input
                    id="version-description"
                    value={newVersion.description}
                    onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                    placeholder="Bug fixes and improvements"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Version History</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {projectVersions?.map((version: any) => (
                    <div key={version.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{version.name}</div>
                        <div className="text-sm text-muted-foreground">{version.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collaborator Management Dialog */}
      <Dialog open={isCollaboratorDialogOpen} onOpenChange={setIsCollaboratorDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Project Collaborators</DialogTitle>
            <DialogDescription>
              Manage project access and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Add Collaborator</h4>
                <Button size="sm" onClick={handleAddCollaborator}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collaborator-email">Email</Label>
                  <Input
                    id="collaborator-email"
                    value={newCollaborator.email}
                    onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collaborator-role">Role</Label>
                  <Select 
                    value={newCollaborator.role} 
                    onValueChange={(value) => setNewCollaborator({ ...newCollaborator, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Current Collaborators</h4>
              <div className="space-y-2">
                {selectedProject?.collaborators?.map((collaborator: any) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={collaborator.avatar} />
                        <AvatarFallback>
                          {collaborator.name?.charAt(0) || collaborator.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{collaborator.name || collaborator.email}</div>
                        <div className="text-sm text-muted-foreground">{collaborator.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{collaborator.role}</Badge>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}