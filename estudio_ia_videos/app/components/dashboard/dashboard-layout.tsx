/**
 * 🏠 Dashboard Layout Component
 * Main layout wrapper for the unified dashboard with navigation and content areas
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Bell,
  Play,
  Zap,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Search,
  Plus,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  LayoutTemplate,
  Edit3,
  Film,
  LayoutGrid
} from 'lucide-react'
import { ProjectManagement } from './project-management'
import { AnalyticsDashboard } from './analytics-dashboard'
import { NotificationCenter } from './notification-center'
import { RenderPipeline } from './render-pipeline'
import { ExternalAPIs } from './external-apis'
import { BrowseView } from './browse-view'
import { PPTXTimelineIntegration } from '@/components/timeline/PPTXTimelineIntegration'
import MotionityIntegration from '@/components/timeline/MotionityIntegration'
import { TemplateSystem } from '@/components/templates/template-system'
import { WYSIWYGEditor } from '@/components/editor/wysiwyg-editor'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Dashboard overview and quick stats'
  },
  {
    id: 'browse',
    label: 'Browse',
    icon: LayoutGrid,
    description: 'Explore courses and templates'
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderOpen,
    description: 'Manage your video projects'
  },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, description: 'Browse and manage video templates' },
    { id: 'editor', label: 'Editor', icon: Edit3, description: 'WYSIWYG content editor with timeline and 3D preview' },
  {
    id: 'timeline',
    label: 'Timeline Editor',
    icon: Film,
    description: 'Professional timeline editor for video production'
  },
  {
    id: 'motionity',
    label: 'Motionity PoC',
    icon: Zap,
    description: 'Advanced Motionity integration with keyframes and animations'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'System and user analytics'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Alerts and notification center'
  },
  {
    id: 'render',
    label: 'Render Pipeline',
    icon: Play,
    description: 'Render queue and monitoring'
  },
  {
    id: 'apis',
    label: 'External APIs',
    icon: Zap,
    description: 'TTS, media, and compliance integrations'
  }
]

interface DashboardLayoutProps {
  children?: React.ReactNode
  defaultTab?: string
}

export function DashboardLayout({ children, defaultTab = 'overview' }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [theme, setTheme] = useState('system')
  const { stats, isLoading: statsLoading } = useDashboardStats()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return Sun
      case 'dark':
        return Moon
      default:
        return Monitor
    }
  }

  const ThemeIcon = getThemeIcon()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-sm">Video Studio</h1>
                <p className="text-xs text-muted-foreground">AI Dashboard</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0"
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    !isSidebarOpen && "px-2"
                  )}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className={cn("h-4 w-4", isSidebarOpen && "mr-2")} />
                  {isSidebarOpen && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">User Name</p>
                <p className="text-xs text-muted-foreground truncate">user@example.com</p>
              </div>
            )}
          </div>
          
          {isSidebarOpen && (
            <div className="flex items-center justify-between mt-3">
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                <ThemeIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-lg font-semibold">
                {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {navigationItems.find(item => item.id === activeTab)?.description || 'Welcome to your dashboard'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card data-testid="dashboard-card-total-projects">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
                        <p className="text-xs text-muted-foreground">Active projects</p>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <Card data-testid="dashboard-card-active-renders">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Renders</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stats?.activeRenders || 0}</div>
                        <p className="text-xs text-muted-foreground">{stats?.completedToday || 0} completed today</p>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <Card data-testid="dashboard-card-total-views">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
                        <p className="text-xs text-muted-foreground">Across all projects</p>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <Card data-testid="dashboard-card-avg-render-time">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Render Time</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stats?.avgRenderTime || 0}m</div>
                        <p className="text-xs text-muted-foreground">Last 10 jobs</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Projects</CardTitle>
                    <CardDescription>Your latest video projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* We could fetch recent projects here too, but for now let's keep the placeholder or use a separate component */}
                      <p className="text-sm text-muted-foreground">Check the Projects tab for full list.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Current system health and performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Health</span>
                        {statsLoading ? (
                          <Skeleton className="h-5 w-20" />
                        ) : (
                          <Badge className={stats?.systemHealth === 'healthy' ? "bg-green-500" : stats?.systemHealth === 'warning' ? "bg-yellow-500" : "bg-red-500"}>
                            {stats?.systemHealth || 'Unknown'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Services</span>
                        <Badge className="bg-green-500">Online</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database</span>
                        <Badge className="bg-green-500">Connected</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {activeTab === 'browse' && <BrowseView />}
          {activeTab === 'projects' && <ProjectManagement />}
          {activeTab === 'templates' && <TemplateSystem />}
          {activeTab === 'editor' && <WYSIWYGEditor />}
          {activeTab === 'timeline' && <PPTXTimelineIntegration />}
          {activeTab === 'motionity' && <MotionityIntegration />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'notifications' && <NotificationCenter />}
          {activeTab === 'render' && <RenderPipeline />}
          {activeTab === 'apis' && <ExternalAPIs />}
          
          {children}
        </ScrollArea>
      </div>
    </div>
  )
}