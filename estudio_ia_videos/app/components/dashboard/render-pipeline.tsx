/**
 * 🎬 Render Pipeline Component
 * Advanced render queue management with real-time monitoring
 */

'use client'

import React, { useState } from 'react'
import { useRenderPipeline } from '@/hooks/use-render-pipeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Trash2, 
  MoreHorizontal, 
  Clock, 
  Cpu, 
  HardDrive, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
  Settings,
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  Users,
  Video,
  Server,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  Edit,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'

const statusIcons = {
  pending: Clock,
  processing: Loader,
  completed: CheckCircle,
  failed: XCircle,
  cancelled: Square,
  paused: Pause
}

const statusColors = {
  pending: 'text-yellow-500 bg-yellow-100',
  processing: 'text-blue-500 bg-blue-100',
  completed: 'text-green-500 bg-green-100',
  failed: 'text-red-500 bg-red-100',
  cancelled: 'text-gray-500 bg-gray-100',
  paused: 'text-orange-500 bg-orange-100'
}

const priorityColors = {
  low: 'bg-green-500',
  normal: 'bg-yellow-500',
  high: 'bg-red-500',
  urgent: 'bg-purple-500'
}

interface RenderJobFormData {
  project_id: string
  render_type: string
  quality_preset: string
  priority: "low" | "normal" | "high" | "urgent"
  settings: any
}

export function RenderPipeline() {
  const {
    renderJobs,
    queueStats,
    systemResources,
    isLoading,
    error,
    createRenderJob,
    updateRenderJob,
    cancelRenderJob,
    retryRenderJob,
    deleteRenderJob,
    pauseQueue,
    resumeQueue,
    clearQueue,
    optimizeQueue,
    exportQueue,
    filters,
    setFilters
  } = useRenderPipeline()

  const [activeTab, setActiveTab] = useState('queue')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [formData, setFormData] = useState<RenderJobFormData>({
    project_id: '',
    render_type: 'video',
    quality_preset: 'high',
    priority: 'normal',
    settings: {}
  })

  // Filter render jobs
  const filteredJobs = renderJobs?.filter(job => {
    const matchesSearch = job.project_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || job.priority === selectedPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  }) || []

  const handleCreateRenderJob = async () => {
    try {
      await createRenderJob(formData)
      setIsCreateDialogOpen(false)
      setFormData({
        project_id: '',
        render_type: 'video',
        quality_preset: 'high',
        priority: 'normal',
        settings: {}
      })
      toast.success('Render job created successfully')
    } catch (error) {
      toast.error('Failed to create render job')
    }
  }

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelRenderJob(jobId)
      toast.success('Render job cancelled')
    } catch (error) {
      toast.error('Failed to cancel render job')
    }
  }

  const handleRetryJob = async (jobId: string) => {
    try {
      await retryRenderJob(jobId)
      toast.success('Render job restarted')
    } catch (error) {
      toast.error('Failed to retry render job')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteRenderJob(jobId)
      toast.success('Render job deleted')
    } catch (error) {
      toast.error('Failed to delete render job')
    }
  }

  const handlePauseQueue = async () => {
    try {
      await pauseQueue()
      toast.success('Render queue paused')
    } catch (error) {
      toast.error('Failed to pause queue')
    }
  }

  const handleResumeQueue = async () => {
    try {
      await resumeQueue()
      toast.success('Render queue resumed')
    } catch (error) {
      toast.error('Failed to resume queue')
    }
  }

  const handleOptimizeQueue = async () => {
    try {
      await optimizeQueue()
      toast.success('Queue optimized successfully')
    } catch (error) {
      toast.error('Failed to optimize queue')
    }
  }

  const handleClearQueue = async () => {
    try {
      await clearQueue()
      toast.success('Queue cleared successfully')
    } catch (error) {
      toast.error('Failed to clear queue')
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getEstimatedTime = (job: any) => {
    if (job.estimated_duration) {
      return formatDuration(job.estimated_duration)
    }
    return 'Calculating...'
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading render pipeline: {error.message}
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
          <h2 className="text-3xl font-bold tracking-tight">Render Pipeline</h2>
          <p className="text-muted-foreground">
            Monitor and manage video rendering with real-time queue optimization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={queueStats?.is_paused ? handleResumeQueue : handlePauseQueue}
          >
            {queueStats?.is_paused ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume Queue
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause Queue
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleOptimizeQueue}>
            <Zap className="mr-2 h-4 w-4" />
            Optimize
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                New Render Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Render Job</DialogTitle>
                <DialogDescription>
                  Add a new video render job to the queue
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="project-id">Project ID</Label>
                  <Input
                    id="project-id"
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    placeholder="Enter project ID"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="render-type">Render Type</Label>
                    <Select value={formData.render_type} onValueChange={(value) => setFormData({ ...formData, render_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="preview">Preview</SelectItem>
                        <SelectItem value="thumbnail">Thumbnail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: "low" | "normal" | "high" | "urgent") => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRenderJob} disabled={!formData.project_id}>
                  Create Job
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.total_jobs || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Activity className="mr-1 h-3 w-3" />
              {queueStats?.processing_jobs || 0} processing
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(queueStats?.avg_wait_time || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {queueStats?.wait_time_trend === 'up' ? (
                <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              )}
              {queueStats?.wait_time_change || 0}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(queueStats?.success_rate || 0).toFixed(1)}%</div>
            <Progress value={queueStats?.success_rate || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(systemResources?.cpu_usage || 0).toFixed(1)}%</div>
            <Progress value={systemResources?.cpu_usage || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle>System Resources</CardTitle>
          <CardDescription>Real-time resource monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Cpu className="mr-2 h-4 w-4" />
                  CPU Usage
                </span>
                <span>{(systemResources?.cpu_usage || 0).toFixed(1)}%</span>
              </div>
              <Progress value={systemResources?.cpu_usage || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Server className="mr-2 h-4 w-4" />
                  Memory
                </span>
                <span>{(systemResources?.memory_usage || 0).toFixed(1)}%</span>
              </div>
              <Progress value={systemResources?.memory_usage || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <HardDrive className="mr-2 h-4 w-4" />
                  Disk I/O
                </span>
                <span>{formatBytes(systemResources?.disk_io || 0)}/s</span>
              </div>
              <Progress value={Math.min((systemResources?.disk_io || 0) / 1000000 * 100, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Queue ({renderJobs?.length || 0})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search render jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Render Jobs List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Render Queue</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleOptimizeQueue}>
                    <Zap className="mr-2 h-4 w-4" />
                    Optimize
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearQueue}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Completed
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="space-y-4 p-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
                        <div className="h-10 w-10 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No render jobs</h3>
                    <p className="mt-2 text-muted-foreground">
                      {searchQuery || selectedStatus !== 'all' || selectedPriority !== 'all'
                        ? 'No jobs match your filters'
                        : 'Create your first render job to get started'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredJobs.map((job) => {
                      const StatusIcon = statusIcons[job.status as keyof typeof statusIcons] || Clock
                      const statusColor = statusColors[job.status as keyof typeof statusColors] || 'text-gray-500 bg-gray-100'
                      
                      return (
                        <div key={job.id} className="flex items-center space-x-4 p-4 hover:bg-muted/50">
                          <div className={`flex-shrink-0 p-2 rounded-full ${statusColor}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium">{job.project_id || job.id}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline">{job.type || 'video'}</Badge>
                                  <Badge variant="outline">{job.metadata?.quality || 'standard'}</Badge>
                                  <Badge className={`${priorityColors[job.priority as keyof typeof priorityColors]} text-white`}>
                                    {job.priority}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">
                                  {job.status === 'processing' && job.progress !== undefined ? (
                                    <div className="space-y-1">
                                      <div>{job.progress}% complete</div>
                                      <Progress value={job.progress} className="w-24 h-2" />
                                    </div>
                                  ) : (
                                    <div>
                                      <div>ETA: {getEstimatedTime(job)}</div>
                                      <div className="text-xs">
                                        Created: {new Date(job.created_at).toLocaleString()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {job.error_message && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                                <AlertTriangle className="inline mr-1 h-3 w-3" />
                                {job.error_message}
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {job.status === 'processing' && (
                                <DropdownMenuItem onClick={() => handleCancelJob(job.id)}>
                                  <Square className="mr-2 h-4 w-4" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                              {(job.status === 'failed' || job.status === 'cancelled') && (
                                <DropdownMenuItem onClick={() => handleRetryJob(job.id)}>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Retry
                                </DropdownMenuItem>
                              )}
                              {job.status === 'completed' && (
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteJob(job.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Render History</CardTitle>
              <CardDescription>Complete history of all render jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Render History</h3>
                <p className="mt-2">Historical render data will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Render Analytics</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Render Analytics</h3>
                <p className="mt-2">Performance analytics and insights will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}