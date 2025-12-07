/**
 * 📁 Project Management Component - Simplified
 * Works with available useProjects hook functions
 */

'use client'

import React, { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { UnifiedProject } from '@/lib/stores/unified-project-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FolderOpen,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Archive,
  Clock,
  Users,
  Video,
  TrendingUp,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

const statusColors = {
  draft: 'bg-gray-500',
  'in-progress': 'bg-blue-500',
  review: 'bg-yellow-500',
  completed: 'bg-green-500',
  archived: 'bg-gray-400',
  error: 'bg-red-500'
}

const priorityColors = {
  low: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  high: 'text-red-600 bg-red-100',
  urgent: 'text-red-700 bg-red-200'
}

export function ProjectManagement() {
  const {
    projects,
    total,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    archiveProject,
    restoreProject,
    refresh
  } = useProjects()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    type: 'pptx' as const,
    metadata: {
      priority: 'medium' as const,
      tags: [] as string[],
      category: 'general'
    }
  })

  const handleCreateProject = async () => {
    try {
      await createProject(newProject)
      setIsCreateDialogOpen(false)
      setNewProject({
        name: '',
        description: '',
        type: 'pptx',
        metadata: {
          priority: 'medium',
          tags: [],
          category: 'general'
        }
      })
      toast.success('Project created successfully')
    } catch (error) {
      toast.error('Failed to create project')
    }
  }

  const handleUpdateProject = async () => {
    if (!selectedProject) return

    try {
      await updateProject(selectedProject.id, {
        name: selectedProject.name,
        description: selectedProject.description,
        status: selectedProject.status
      })
      setIsEditDialogOpen(false)
      toast.success('Project updated successfully')
    } catch (error) {
      toast.error('Failed to update project')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

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

  const getProjectProgress = (project: UnifiedProject) => {
    if (project.status === 'completed') return 100
    if (project.status === 'in-progress') return 60
    if (project.status === 'review') return 80
    if (project.status === 'draft') return 20
    return 0
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="font-semibold">Error loading projects</p>
            <p className="text-sm mt-2">{error.message}</p>
            <Button onClick={() => refresh()} className="mt-4">
              Try Again
            </Button>
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
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage your video projects
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="project-type">Type</Label>
                <Select value={newProject.type} onValueChange={(value: string) => setNewProject({ ...newProject, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pptx">PPTX</SelectItem>
                    <SelectItem value="template-nr">Template NR</SelectItem>
                    <SelectItem value="talking-photo">Talking Photo</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="ai-generated">AI Generated</SelectItem>
                  </SelectContent>
                </Select>
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter((p: UnifiedProject) => p.status === 'in-progress').length}
            </div>
            <div className="text-xs text-muted-foreground">
              {projects.filter((p: UnifiedProject) => p.status === 'completed').length} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Projects</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter((p: UnifiedProject) => p.status === 'draft').length}
            </div>
            <div className="text-xs text-muted-foreground">
              Waiting to start
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((acc: number, p: UnifiedProject) => acc + (p.collaborators?.length || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              across all projects
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: UnifiedProject) => {
          const progress = getProjectProgress(project)

          return (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Video className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                  <Badge className={statusColors[project.status as keyof typeof statusColors] || 'bg-gray-500'}>
                    {project.status}
                  </Badge>
                  <Badge className={priorityColors[project.metadata?.priority as keyof typeof priorityColors] || 'text-gray-600 bg-gray-100'}>
                    {project.metadata?.priority || 'medium'}
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
              </CardContent>
            </Card>
          )
        })}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
              <p className="mt-2 text-muted-foreground">
                Get started by creating your first project
              </p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details
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

              <div className="space-y-2">
                <Label htmlFor="edit-project-status">Status</Label>
                <Select value={selectedProject.status} onValueChange={(value) => setSelectedProject({ ...selectedProject, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
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
    </div>
  )
}