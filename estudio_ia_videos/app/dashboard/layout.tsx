'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  LogOut,
  Menu,
  X,
  Monitor,
  LayoutTemplate,
  Edit3,
  Film,
  LayoutGrid,
  Search,
  Plus,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog'
import { HelpDialog } from '@/components/dashboard/help-dialog'
import { WelcomeTour } from '@/components/dashboard/welcome-tour'

const navigationItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    exact: true
  },
  {
    href: '/dashboard/browse',
    label: 'Browse',
    icon: LayoutGrid
  },
  {
    href: '/dashboard/projects',
    label: 'Projects',
    icon: FolderOpen
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: BarChart3
  },
  {
    href: '/dashboard/notifications',
    label: 'Notifications',
    icon: Bell
  },
  {
    href: '/dashboard/render',
    label: 'Render Pipeline',
    icon: Play
  },
  {
    href: '/dashboard/apis',
    label: 'External APIs',
    icon: Zap
  }
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [theme, setTheme] = useState('system')

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun
      case 'dark': return Moon
      default: return Monitor
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
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href)

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      !isSidebarOpen && "px-2"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isSidebarOpen && "mr-2")} />
                    {isSidebarOpen && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Button>
                </Link>
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
              <HelpDialog trigger={
                <Button variant="ghost" size="sm" title="Central de Ajuda">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              } />
              <Button variant="ghost" size="sm" onClick={toggleTheme} title="Alternar Tema">
                <ThemeIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Configurações">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <WelcomeTour />
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center space-x-4">
            {/* Breadcrumbs or Title could go here */}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <CreateProjectDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New
                </Button>
              }
            />
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          {children}
        </ScrollArea>
      </div>
    </div>
  )
}
