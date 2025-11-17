
'use client'

/**
 * 🏗️ APP SHELL - Layout Principal do Dashboard
 * Layout responsivo com Header, Sidebar, Content Area e Footer
 */

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Menu, 
  X, 
  Search,
  Bell,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Command
} from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import Breadcrumbs from './Breadcrumbs'
import CommandPalette from './CommandPalette'
import Footer from './Footer'

interface Breadcrumb {
  label: string
  href: string
}

interface AppShellProps {
  children: React.ReactNode
  title?: string
  description?: string
  showBreadcrumbs?: boolean
  breadcrumbs?: Breadcrumb[]
  showFooter?: boolean
  sidebarCollapsed?: boolean
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl'
}

export default function AppShell({
  children,
  title,
  description,
  showBreadcrumbs = true,
  breadcrumbs,
  showFooter = true,
  sidebarCollapsed: initialCollapsed = false,
  maxWidth = 'full'
}: AppShellProps) {
  const pathname = usePathname()
  
  // Estado do layout
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false) // Fechar sidebar mobile quando expandir
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Atalhos do teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘+K ou Ctrl+K para Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      
      // Escape para fechar sidebar mobile
      if (e.key === 'Escape' && sidebarOpen && isMobile) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen, isMobile])

  // Auto-colapsar sidebar em telas pequenas
  useEffect(() => {
    if (isMobile && sidebarCollapsed) {
      setSidebarCollapsed(false)
    }
  }, [isMobile, sidebarCollapsed])

  // Fechar sidebar mobile ao navegar
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  const maxWidthClass = {
    full: 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl'
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Command Palette */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />

      {/* Sidebar Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col bg-surface border-r border-border transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64",
        "relative z-sticky"
      )}>
        <Sidebar 
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {/* Sidebar Mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-surface">
          <Sidebar 
            collapsed={false}
            onCollapse={() => setSidebarOpen(false)}
            mobile
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setCommandPaletteOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          showMobileMenu={isMobile}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Page Header */}
          {(title || showBreadcrumbs) && (
            <div className="bg-surface border-b border-border">
              <div className={cn(
                "container-fluid py-4 space-y-2",
                maxWidthClass[maxWidth],
                "mx-auto"
              )}>
                {showBreadcrumbs && (
                  <Breadcrumbs />
                )}
                
                {title && (
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-text tracking-tight">
                      {title}
                    </h1>
                    {description && (
                      <p className="text-text-secondary text-base max-w-3xl">
                        {description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            <div className={cn(
              "container-fluid py-6",
              maxWidthClass[maxWidth],
              "mx-auto"
            )}>
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        {showFooter && <Footer />}
      </div>

      {/* Overlay para sidebar mobile */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-modal-backdrop md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// Hooks para usar o AppShell
export function useAppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  
  const openCommandPalette = () => setCommandPaletteOpen(true)
  const closeCommandPalette = () => setCommandPaletteOpen(false)
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)
  
  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    commandPaletteOpen,
    setCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    toggleSidebar
  }
}

// Layout wrapper para páginas
export function AppShellProvider({
  children,
  ...props
}: AppShellProps) {
  return (
    <AppShell {...props}>
      {children}
    </AppShell>
  )
}
