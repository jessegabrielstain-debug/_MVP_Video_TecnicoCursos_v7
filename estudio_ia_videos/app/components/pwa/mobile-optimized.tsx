

'use client'

/**
 * 📱 MOBILE PWA OTIMIZADO - Sprint 17
 * Experiência mobile premium com funcionalidades offline
 * Interface adaptativa e otimizada para dispositivos móveis
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Smartphone,
  Menu,
  Home,
  Video,
  Upload,
  Users,
  Settings,
  Download,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Clock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Fullscreen,
  Share,
  Heart,
  MessageSquare,
  Bookmark,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Star,
  Zap,
  Shield,
  Bell,
  User,
  Edit,
  Trash2,
  Info,
  HelpCircle,
  LogOut
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/services'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface NavigatorConnection extends EventTarget {
  type?: string
}

interface BatteryManagerLike extends EventTarget {
  charging: boolean
  level: number
}

type NavigatorWithExtras = Navigator & {
  connection?: NavigatorConnection
  getBattery?: () => Promise<BatteryManagerLike>
}

const isNavigatorWithExtras = (
  value: Navigator | NavigatorWithExtras
): value is NavigatorWithExtras => {
  return typeof value === 'object' && value !== null && ('connection' in value || 'getBattery' in value)
}

const resolveNavigatorExtras = (): NavigatorWithExtras | null => {
  if (typeof navigator === 'undefined') {
    return null
  }

  const candidate: Navigator | NavigatorWithExtras = navigator
  if (!isNavigatorWithExtras(candidate)) {
    return null
  }

  return candidate
}

const resolveNavigatorConnection = (): NavigatorConnection | null => {
  const extras = resolveNavigatorExtras()
  if (!extras?.connection || typeof extras.connection !== 'object') {
    return null
  }

  return extras.connection
}

const normalizeConnectionType = (
  connection: NavigatorConnection | null
): 'wifi' | 'cellular' | 'unknown' => {
  const type = connection?.type?.toLowerCase()

  if (type === 'wifi') {
    return 'wifi'
  }

  if (type === 'cellular' || type === 'cell' || type === '4g' || type === '5g' || type === '3g') {
    return 'cellular'
  }

  return 'unknown'
}

// ==================== INTERFACES ====================

interface MobileProject {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: number
  status: 'draft' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: string
  updatedAt: string
  size: number
  isOfflineAvailable: boolean
  type: 'nr-training' | 'corporate' | 'marketing'
  tags: string[]
  author: {
    name: string
    avatar?: string
  }
}

interface OfflineContent {
  id: string
  type: 'project' | 'template' | 'asset'
  size: number
  downloadedAt: string
  lastAccessed: string
  isAvailable: boolean
}

interface MobileSettings {
  offlineMode: boolean
  autoDownload: boolean
  cellularDownload: boolean
  highQualityVideo: boolean
  pushNotifications: boolean
  darkMode: boolean
  reducedMotion: boolean
  dataUsageLimit: number
}

// ==================== DADOS MOCKADOS ====================

const mockProjects: MobileProject[] = [
  {
    id: 'mobile-1',
    title: 'NR-12 Segurança em Máquinas',
    description: 'Treinamento completo sobre segurança em equipamentos industriais',
    thumbnail: '/nr12-thumb.jpg',
    duration: 240,
    status: 'completed',
    progress: 100,
    createdAt: '2024-09-25T10:00:00Z',
    updatedAt: '2024-09-25T16:30:00Z',
    size: 45600000,
    isOfflineAvailable: true,
    type: 'nr-training',
    tags: ['segurança', 'nr-12', 'máquinas', 'industrial'],
    author: {
      name: 'Carlos Santos',
      avatar: '/avatars/carlos-santos.jpg'
    }
  },
  {
    id: 'mobile-2',
    title: 'NR-33 Espaços Confinados',
    description: 'Procedimentos de segurança para trabalho em espaços confinados',
    thumbnail: '/nr33-thumb.jpg',
    duration: 180,
    status: 'processing',
    progress: 75,
    createdAt: '2024-09-24T14:20:00Z',
    updatedAt: '2024-09-25T09:15:00Z',
    size: 32400000,
    isOfflineAvailable: false,
    type: 'nr-training',
    tags: ['segurança', 'nr-33', 'confinado', 'gases'],
    author: {
      name: 'Ana Silva',
      avatar: '/avatars/ana-silva.jpg'
    }
  },
  {
    id: 'mobile-3',
    title: 'Apresentação Corporativa',
    description: 'Vídeo institucional com avatares 3D para apresentação da empresa',
    thumbnail: '/corporativa-thumb.jpg',
    duration: 120,
    status: 'completed',
    progress: 100,
    createdAt: '2024-09-23T08:45:00Z',
    updatedAt: '2024-09-23T11:30:00Z',
    size: 28800000,
    isOfflineAvailable: true,
    type: 'corporate',
    tags: ['corporativo', 'institucional', 'avatar', '3d'],
    author: {
      name: 'Dr. Ricardo Lima',
      avatar: '/avatars/ricardo-lima.jpg'
    }
  }
]

// ==================== HOOKS PERSONALIZADOS ====================

function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [networkType, setNetworkType] = useState<'wifi' | 'cellular' | 'unknown'>('unknown')

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : false)
    const updateNetworkType = () => setNetworkType(normalizeConnectionType(resolveNavigatorConnection()))

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    updateOnlineStatus()
    updateNetworkType()

    const connection = resolveNavigatorConnection()
    connection?.addEventListener('change', updateNetworkType)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      connection?.removeEventListener('change', updateNetworkType)
    }
  }, [])

  return { isOnline, networkType }
}

function useBattery() {
  const [batteryLevel, setBatteryLevel] = useState(1)
  const [isCharging, setIsCharging] = useState(false)

  useEffect(() => {
    let isMounted = true
    let batteryManager: BatteryManagerLike | null = null

    const handleLevelChange = () => {
      if (!isMounted || !batteryManager) {
        return
      }

      setBatteryLevel(batteryManager.level)
    }

    const handleChargingChange = () => {
      if (!isMounted || !batteryManager) {
        return
      }

      setIsCharging(batteryManager.charging)
    }

    const setupBattery = async () => {
      const extras = resolveNavigatorExtras()
      if (!extras?.getBattery) {
        return
      }

      try {
        const battery = await extras.getBattery()
        if (!isMounted) {
          return
        }

        batteryManager = battery
        setBatteryLevel(battery.level)
        setIsCharging(battery.charging)
        battery.addEventListener('levelchange', handleLevelChange)
        battery.addEventListener('chargingchange', handleChargingChange)
      } catch (error) {
        logger.warn('Battery API indisponível', { component: 'MobileOptimized', error })
      }
    }

    void setupBattery()

    return () => {
      isMounted = false
      if (batteryManager) {
        batteryManager.removeEventListener('levelchange', handleLevelChange)
        batteryManager.removeEventListener('chargingchange', handleChargingChange)
      }
      batteryManager = null
    }
  }, [])

  return { batteryLevel, isCharging }
}

function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }

    window.addEventListener('resize', handleOrientationChange)
    handleOrientationChange()

    return () => window.removeEventListener('resize', handleOrientationChange)
  }, [])

  return orientation
}

// ==================== COMPONENTE PRINCIPAL ====================

export default function MobileOptimized() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const { isOnline, networkType } = useNetworkStatus()
  const { batteryLevel, isCharging } = useBattery()
  const orientation = useDeviceOrientation()
  
  const [projects, setProjects] = useState<MobileProject[]>(mockProjects)
  const [selectedProject, setSelectedProject] = useState<MobileProject | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'nr-training' | 'corporate' | 'marketing'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [settings, setSettings] = useState<MobileSettings>({
    offlineMode: false,
    autoDownload: true,
    cellularDownload: false,
    highQualityVideo: true,
    pushNotifications: true,
    darkMode: false,
    reducedMotion: false,
    dataUsageLimit: 500
  })
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const filteredProjects = projects.filter(project => {
    const matchesType = filterType === 'all' || project.type === filterType
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesType && matchesSearch
  })

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        const authUser = data.user ?? null
        setUser(authUser)

        if (authUser) {
          const { data: profile, error } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('id', authUser.id)
            .maybeSingle()

          if (!isMounted) return
          if (error) {
            logger.warn('Erro ao carregar perfil', { component: 'MobileOptimized', userId: authUser.id, error })
          }

          setDisplayName(profile?.name ?? authUser.user_metadata?.name ?? authUser.email ?? null)
          setAvatarUrl(profile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null)
        } else {
          setDisplayName(null)
          setAvatarUrl(null)
        }
      } catch (error) {
        logger.error('Erro ao carregar sessão do usuário', error instanceof Error ? error : new Error(String(error)), { component: 'MobileOptimized' })
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

  // ==================== COMPONENTE DE STATUS BAR ====================

  const MobileStatusBar = () => (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white text-xs">
      <div className="flex items-center space-x-2">
        <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <div className="flex items-center space-x-1">
            {networkType === 'wifi' ? <Wifi className="h-3 w-3" /> : <Signal className="h-3 w-3" />}
            <span>{networkType === 'wifi' ? 'WiFi' : '4G'}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <Battery className={cn("h-3 w-3", isCharging ? "text-green-400" : batteryLevel < 0.2 ? "text-red-400" : "text-white")} />
          <span>{Math.round(batteryLevel * 100)}%</span>
        </div>
      </div>
    </div>
  )

  // ==================== COMPONENTE DE HEADER MOBILE ====================

  const MobileHeader = () => (
    <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <MobileMenu />
          </SheetContent>
        </Sheet>
        <h1 className="font-bold text-lg">Estúdio IA</h1>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm">
          <Bell className="h-5 w-5" />
          <Badge variant="secondary" className="ml-1 text-xs">3</Badge>
        </Button>
      </div>
    </div>
  )

  // ==================== COMPONENTE DE MENU MOBILE ====================

  const MobileMenu = () => (
    <div className="py-4">
      <SheetHeader className="mb-6">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback>
              {(displayName ?? user?.email ?? 'U')
                .split(' ')
                .map((n) => n[0])
                .join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{displayName ?? 'Usuário'}</p>
            <p className="text-sm text-muted-foreground">{user?.email || 'email@exemplo.com'}</p>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-start" onClick={() => setShowMobileMenu(false)}>
          <Home className="h-5 w-5 mr-3" />
          Início
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => setShowMobileMenu(false)}>
          <Video className="h-5 w-5 mr-3" />
          Meus Projetos
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => setShowMobileMenu(false)}>
          <Upload className="h-5 w-5 mr-3" />
          Novo Projeto
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => setShowMobileMenu(false)}>
          <Users className="h-5 w-5 mr-3" />
          Colaboração
        </Button>
        
        <Separator className="my-4" />
        
        <Button variant="ghost" className="w-full justify-start" onClick={() => setShowMobileMenu(false)}>
          <Download className="h-5 w-5 mr-3" />
          Conteúdo Offline
          <Badge variant="secondary" className="ml-auto">
            {projects.filter(p => p.isOfflineAvailable).length}
          </Badge>
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => setShowMobileMenu(false)}>
          <Settings className="h-5 w-5 mr-3" />
          Configurações
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => setShowMobileMenu(false)}>
          <HelpCircle className="h-5 w-5 mr-3" />
          Ajuda e Suporte
        </Button>
        
        <Separator className="my-4" />
        
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600"
          onClick={async () => {
            setShowMobileMenu(false)
            if (!signingOut) {
              await handleLogout()
            }
          }}
          disabled={signingOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {signingOut ? 'Saindo...' : 'Sair'}
        </Button>
      </div>
    </div>
  )

  // ==================== COMPONENTE DE FILTROS MOBILE ====================

  const MobileFilters = () => (
    <div className="p-4 border-b bg-gray-50">
      <div className="flex items-center space-x-2 mb-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType('all')}>
              Todos os tipos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('nr-training')}>
              Treinamentos NR
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('corporate')}>
              Corporativo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('marketing')}>
              Marketing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex space-x-2">
        <Badge variant={filterType === 'all' ? 'default' : 'outline'} className="text-xs">
          Todos ({projects.length})
        </Badge>
        <Badge variant={filterType === 'nr-training' ? 'default' : 'outline'} className="text-xs">
          NR ({projects.filter(p => p.type === 'nr-training').length})
        </Badge>
        <Badge variant={filterType === 'corporate' ? 'default' : 'outline'} className="text-xs">
          Corporativo ({projects.filter(p => p.type === 'corporate').length})
        </Badge>
      </div>
    </div>
  )

  // ==================== COMPONENTE DE CARD DE PROJETO MOBILE ====================

  const MobileProjectCard = ({ project }: { project: MobileProject }) => {
    if (viewMode === 'list') {
      return (
        <Card className="mb-3">
          <CardContent className="p-3">
            <div className="flex space-x-3">
              <div className="relative">
                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                  <img 
                    src={project.thumbnail} 
                    alt={project.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-video.png'
                    }}
                  />
                </div>
                {project.status === 'processing' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{project.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{Math.floor(project.duration / 60)}min</span>
                    {project.isOfflineAvailable && (
                      <Download className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {project.status === 'completed' ? 'Concluído' : 
                     project.status === 'processing' ? 'Processando' : 
                     project.status === 'draft' ? 'Rascunho' : 'Erro'}
                  </Badge>
                </div>
                {project.status === 'processing' && (
                  <Progress value={project.progress} className="mt-2 h-1" />
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Play className="h-4 w-4 mr-2" />
                    Reproduzir
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="h-4 w-4 mr-2" />
                    Compartilhar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="mb-4">
        <div className="relative">
          <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
            <img 
              src={project.thumbnail} 
              alt={project.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-video.png'
              }}
            />
            {project.status === 'processing' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-white text-sm">Processando...</p>
                <Progress value={project.progress} className="w-20 mt-2 h-1" />
              </div>
            )}
            <div className="absolute top-2 right-2 flex space-x-1">
              {project.isOfflineAvailable && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  <Download className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {Math.floor(project.duration / 60)}min
              </Badge>
            </div>
          </div>
        </div>
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-sm line-clamp-2">{project.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Play className="h-4 w-4 mr-2" />
                  Reproduzir
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{project.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={project.author.avatar} />
                <AvatarFallback className="text-xs">
                  {project.author.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{project.author.name}</span>
            </div>
            <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
              {project.status === 'completed' ? '✓' : 
               project.status === 'processing' ? '⏳' : 
               project.status === 'draft' ? '📝' : '❌'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ==================== COMPONENTE DE BOTÃO FLUTUANTE ====================

  const FloatingActionButton = () => (
    <div className="fixed bottom-6 right-6 z-50">
      <Button className="h-14 w-14 rounded-full shadow-lg">
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )

  // ==================== RENDER PRINCIPAL ====================

  const handleLogout = async () => {
    if (signingOut) return
    try {
      setSigningOut(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      window.location.href = '/login?reason=session_expired'
    } catch (error) {
      logger.error('Erro ao encerrar sessão', error instanceof Error ? error : new Error(String(error)), { component: 'MobileOptimized' })
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileStatusBar />
      <MobileHeader />
      <MobileFilters />

      <div className="p-4">
        {/* Indicador de conexão */}
        {!isOnline && (
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="flex items-center space-x-2 p-3">
              <WifiOff className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">Modo Offline</p>
                <p className="text-xs text-orange-600">
                  Alguns recursos podem estar limitados
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modo economia de bateria */}
        {batteryLevel < 0.2 && !isCharging && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="flex items-center space-x-2 p-3">
              <Battery className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Bateria Baixa</p>
                <p className="text-xs text-red-600">
                  Alguns recursos foram desabilitados para economizar energia
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de projetos */}
        <div className={cn(
          viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-3'
        )}>
          {filteredProjects.map(project => (
            <MobileProjectCard key={project.id} project={project} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhum projeto encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || filterType !== 'all' 
                  ? 'Tente ajustar seus filtros de busca' 
                  : 'Crie seu primeiro projeto para começar'}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <FloatingActionButton />
    </div>
  )
}

