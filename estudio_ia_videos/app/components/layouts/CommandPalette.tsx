
'use client'

/**
 * ⌨️ COMMAND PALETTE - Busca Global (⌘+K)
 * Sistema de navegação rápida e execução de comandos
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Kbd } from '@/components/ui/kbd'
import {
  Calculator,
  Calendar,
  CreditCard,
  Home,
  Search,
  Settings,
  Smile,
  User,
  Upload,
  Edit3,
  Users,
  Mic,
  BarChart3,
  Building,
  Shield,
  Smartphone,
  Brain,
  Video,
  FileVideo,
  Image,
  Volume2,
  Crown,
  Zap,
  Play,
  Download,
  Share2,
  Workflow,
  Database,
  Server,
  TestTube,
  Activity,
  Lock,
  Users2,
  Sparkles,
  Gamepad2,
  Link2,
  Layers,
  BookOpen,
  TrendingUp,
  Eye,
  Cpu,
  Monitor,
  Package,
  HelpCircle,
  Keyboard,
  Moon,
  Sun,
  LogOut,
  RefreshCw,
  Plus,
  Copy,
  Trash2,
  Archive,
  Star
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  action?: () => void
  group: string
  keywords: string[]
  status?: 'active' | 'partial' | 'mockup'
  badge?: string
  shortcut?: string[]
}

const commands: CommandItem[] = [
  // === NAVEGAÇÃO PRINCIPAL ===
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Visão geral do sistema',
    icon: Home,
    href: '/',
    group: 'Navegação',
    keywords: ['dashboard', 'home', 'inicio', 'principal'],
    status: 'active'
  },

  // === ESTÚDIO PRINCIPAL ===
  {
    id: 'pptx-upload',
    title: 'Upload PPTX',
    description: 'Enviar apresentações PowerPoint',
    icon: Upload,
    href: '/pptx-upload',
    group: 'Estúdio',
    keywords: ['upload', 'pptx', 'powerpoint', 'arquivo'],
    status: 'active'
  },
  {
    id: 'pptx-upload-real',
    title: 'Upload Real',
    description: 'Sistema de upload otimizado',
    icon: Zap,
    href: '/pptx-upload-real',
    group: 'Estúdio',
    keywords: ['upload', 'real', 'otimizado', 'rapido'],
    status: 'active'
  },
  {
    id: 'pptx-upload-production',
    title: 'Upload Produção',
    description: 'Upload em ambiente de produção',
    icon: Crown,
    href: '/pptx-upload-production',
    group: 'Estúdio',
    keywords: ['upload', 'producao', 'profissional'],
    status: 'active'
  },
  {
    id: 'pptx-editor',
    title: 'Editor PPTX',
    description: 'Editar apresentações',
    icon: Edit3,
    href: '/pptx-editor',
    group: 'Estúdio',
    keywords: ['editor', 'editar', 'pptx', 'apresentacao'],
    status: 'partial'
  },
  {
    id: 'canvas-editor',
    title: 'Canvas Editor',
    description: 'Editor visual avançado',
    icon: Edit3,
    href: '/canvas-editor-demo',
    group: 'Estúdio',
    keywords: ['canvas', 'editor', 'visual', 'grafico'],
    status: 'mockup'
  },
  {
    id: 'timeline-pro',
    title: 'Timeline Pro',
    description: 'Editor de timeline profissional',
    icon: Play,
    href: '/editor-timeline-pro',
    group: 'Estúdio',
    keywords: ['timeline', 'pro', 'linha', 'tempo', 'video'],
    status: 'partial'
  },

  // === AVATARES & 3D ===
  {
    id: 'talking-photo',
    title: 'Talking Photo',
    description: 'Transformar fotos em vídeos falantes',
    icon: Image,
    href: '/talking-photo',
    group: 'Avatares',
    keywords: ['talking', 'photo', 'foto', 'avatar', 'falante'],
    status: 'active'
  },
  {
    id: 'talking-photo-pro',
    title: 'Talking Photo Pro',
    description: 'Versão profissional do Talking Photo',
    icon: Crown,
    href: '/talking-photo-pro',
    group: 'Avatares',
    keywords: ['talking', 'photo', 'pro', 'profissional', 'avatar'],
    status: 'active'
  },
  {
    id: 'avatares-3d',
    title: 'Avatares 3D',
    description: 'Avatares tridimensionais',
    icon: Users2,
    href: '/avatares-3d',
    group: 'Avatares',
    keywords: ['avatar', '3d', 'tridimensional', 'personagem'],
    status: 'partial'
  },
  {
    id: 'hyperreal-studio',
    title: 'Hyperreal Studio',
    description: 'Estúdio de avatares hiper-realistas',
    icon: Sparkles,
    href: '/avatar-studio-hyperreal',
    group: 'Avatares',
    keywords: ['hyperreal', 'hiper', 'realista', 'studio'],
    status: 'mockup'
  },

  // === TTS & VOICE ===
  {
    id: 'tts-test',
    title: 'Teste TTS',
    description: 'Testar síntese de voz',
    icon: Volume2,
    href: '/tts-test',
    group: 'TTS & Voice',
    keywords: ['tts', 'text', 'speech', 'voz', 'sintese'],
    status: 'active'
  },
  {
    id: 'voice-cloning',
    title: 'Clonagem de Voz',
    description: 'Clonar e sintetizar vozes',
    icon: Brain,
    href: '/voice-cloning',
    group: 'TTS & Voice',
    keywords: ['voice', 'cloning', 'voz', 'clonagem', 'ia'],
    status: 'mockup'
  },

  // === ANALYTICS & ADMIN ===
  {
    id: 'admin-metrics',
    title: 'Métricas Admin',
    description: 'Métricas administrativas do sistema',
    icon: BarChart3,
    href: '/admin/metrics',
    group: 'Analytics',
    keywords: ['metrics', 'metricas', 'admin', 'estatisticas'],
    status: 'active'
  },
  {
    id: 'pptx-metrics',
    title: 'Métricas PPTX',
    description: 'Estatísticas de processamento PPTX',
    icon: FileVideo,
    href: '/admin/pptx-metrics',
    group: 'Analytics',
    keywords: ['metrics', 'pptx', 'estatisticas', 'processamento'],
    status: 'active'
  },
  {
    id: 'render-metrics',
    title: 'Métricas Render',
    description: 'Performance de renderização',
    icon: Cpu,
    href: '/admin/render-metrics',
    group: 'Analytics',
    keywords: ['render', 'metrics', 'performance', 'processamento'],
    status: 'active'
  },
  {
    id: 'production-dashboard',
    title: 'Dashboard Produção',
    description: 'Monitoramento de produção',
    icon: Crown,
    href: '/admin/production-dashboard',
    group: 'Analytics',
    keywords: ['dashboard', 'producao', 'monitor', 'sistema'],
    status: 'active'
  },
  {
    id: 'admin-config',
    title: 'Configurações Admin',
    description: 'Configurações do administrador',
    icon: Settings,
    href: '/admin/configuracoes',
    group: 'Configurações',
    keywords: ['config', 'configuracoes', 'admin', 'settings'],
    status: 'active'
  },

  // === ENTERPRISE ===
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'Recursos empresariais',
    icon: Building,
    href: '/enterprise',
    group: 'Enterprise',
    keywords: ['enterprise', 'empresa', 'corporativo', 'business'],
    status: 'mockup'
  },
  {
    id: 'security-dashboard',
    title: 'Dashboard Segurança',
    description: 'Centro de segurança',
    icon: Shield,
    href: '/security-dashboard',
    group: 'Enterprise',
    keywords: ['security', 'seguranca', 'protecao', 'shield'],
    status: 'mockup'
  },

  // === AÇÕES RÁPIDAS ===
  {
    id: 'new-project',
    title: 'Novo Projeto',
    description: 'Criar um novo projeto',
    icon: Plus,
    action: () => logger.debug('Novo projeto action triggered', { component: 'CommandPalette' }),
    group: 'Ações',
    keywords: ['novo', 'new', 'project', 'projeto', 'criar'],
    shortcut: ['⌘', 'N']
  },
  {
    id: 'search-projects',
    title: 'Buscar Projetos',
    description: 'Encontrar projetos existentes',
    icon: Search,
    action: () => logger.debug('Buscar projetos action triggered', { component: 'CommandPalette' }),
    group: 'Ações',
    keywords: ['buscar', 'search', 'find', 'projetos', 'encontrar'],
    shortcut: ['⌘', 'F']
  },
  {
    id: 'toggle-theme',
    title: 'Alternar Tema',
    description: 'Mudar entre claro e escuro',
    icon: Moon,
    action: () => logger.debug('Toggle theme action triggered', { component: 'CommandPalette' }),
    group: 'Ações',
    keywords: ['theme', 'tema', 'dark', 'light', 'escuro', 'claro'],
    shortcut: ['⌘', 'T']
  },
  {
    id: 'refresh',
    title: 'Atualizar',
    description: 'Recarregar dados',
    icon: RefreshCw,
    action: () => window.location.reload(),
    group: 'Ações',
    keywords: ['refresh', 'atualizar', 'reload', 'recarregar'],
    shortcut: ['⌘', 'R']
  },

  // === AJUDA ===
  {
    id: 'keyboard-shortcuts',
    title: 'Atalhos do Teclado',
    description: 'Ver todos os atalhos disponíveis',
    icon: Keyboard,
    action: () => logger.debug('Mostrar atalhos action triggered', { component: 'CommandPalette' }),
    group: 'Ajuda',
    keywords: ['keyboard', 'shortcuts', 'atalhos', 'teclas', 'help']
  },
  {
    id: 'help',
    title: 'Central de Ajuda',
    description: 'Documentação e suporte',
    icon: HelpCircle,
    href: '/help',
    group: 'Ajuda',
    keywords: ['help', 'ajuda', 'suporte', 'documentacao', 'faq']
  }
]

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  // Filtrar comandos baseado na busca
  const filteredCommands = useMemo(() => {
    if (!search) return commands

    const searchLower = search.toLowerCase()
    return commands.filter(command => 
      command.title.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.keywords.some(keyword => keyword.includes(searchLower))
    )
  }, [search])

  // Agrupar comandos filtrados
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    
    filteredCommands.forEach(command => {
      if (!groups[command.group]) {
        groups[command.group] = []
      }
      groups[command.group].push(command)
    })
    
    return groups
  }, [filteredCommands])

  // Executar comando
  const handleCommand = useCallback((command: CommandItem) => {
    if (command.href) {
      router.push(command.href)
    } else if (command.action) {
      command.action()
    }
    onOpenChange(false)
    setSearch('')
  }, [router, onOpenChange])

  // Reset ao fechar
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSearch('')
    }
    onOpenChange(open)
  }, [onOpenChange])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-success'
      case 'partial': return 'text-warning'
      case 'mockup': return 'text-text-muted'
      default: return 'text-text-secondary'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'partial': return 'Parcial'
      case 'mockup': return 'Demo'
      default: return ''
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput 
        placeholder="Digite para buscar funcionalidades, páginas e ações..."
        value={search}
        onValueChange={setSearch}
        className="text-base"
      />
      
      <CommandList className="max-h-[70vh]">
        <CommandEmpty className="py-6 text-center">
          <div className="space-y-2">
            <Search className="h-8 w-8 mx-auto text-text-muted" />
            <p className="text-sm text-text-muted">
              Nenhum resultado encontrado para "{search}"
            </p>
            <p className="text-xs text-text-muted">
              Tente buscar por "upload", "editor", "avatar" ou "analytics"
            </p>
          </div>
        </CommandEmpty>

        {Object.entries(groupedCommands).map(([group, groupCommands], groupIndex) => (
          <React.Fragment key={group}>
            {groupIndex > 0 && <CommandSeparator />}
            
            <CommandGroup heading={group}>
              {groupCommands.map((command) => {
                const Icon = command.icon
                
                return (
                  <CommandItem
                    key={command.id}
                    value={`${command.title} ${command.description} ${command.keywords.join(' ')}`}
                    onSelect={() => handleCommand(command)}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className="h-4 w-4 flex-shrink-0 text-text-secondary" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {command.title}
                          </span>
                          
                          {command.status && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs px-1.5 py-0 h-4",
                                getStatusColor(command.status)
                              )}
                            >
                              {getStatusText(command.status)}
                            </Badge>
                          )}
                          
                          {command.badge && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                              {command.badge}
                            </Badge>
                          )}
                        </div>
                        
                        {command.description && (
                          <p className="text-xs text-text-muted truncate mt-0.5">
                            {command.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {command.shortcut && (
                      <div className="flex items-center gap-1">
                        {command.shortcut.map((key, index) => (
                          <Kbd key={index} className="text-xs">
                            {key}
                          </Kbd>
                        ))}
                      </div>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </React.Fragment>
        ))}

        {/* Dicas de uso */}
        {!search && (
          <>
            <CommandSeparator />
            <div className="px-4 py-3 text-xs text-text-muted">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Pressione Enter para selecionar</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Use ↑ ↓ para navegar</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pressione Esc para fechar</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

// Hook para usar o Command Palette
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  // Atalhos globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return {
    open,
    setOpen,
    toggle: () => setOpen(!open),
    close: () => setOpen(false)
  }
}

// Componente para o atalho visual
export function CommandPaletteShortcut() {
  return (
    <div className="flex items-center gap-1 text-xs text-text-muted">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </div>
  )
}
