'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { FolderOpen, Play, Zap, Bell, Plus, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { RecentProjects } from '@/components/dashboard/recent-projects'
import { useProjects } from '@/hooks/use-projects'
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog'
import { EmptyStateHero } from '@/components/dashboard/empty-state-hero'
import { useMemo, useCallback } from 'react'

// Componente de card de estatística reutilizável
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  loading, 
  trend,
  testId 
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: any
  loading?: boolean
  trend?: { value: number; positive: boolean }
  testId?: string
}) {
  return (
    <Card data-testid={testId} className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{value}</div>
              {trend && (
                <span className={`text-xs flex items-center ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`h-3 w-3 mr-0.5 ${!trend.positive && 'rotate-180'}`} />
                  {trend.value}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { stats, isLoading: statsLoading, isError: statsError } = useDashboardStats()
  const { projects, isLoading: projectsLoading } = useProjects({
    limit: 6,
    sortBy: 'updated_at',
    sortOrder: 'desc'
  })

  // Check for empty state
  const hasNoProjects = !statsLoading && stats?.totalProjects === 0 && !projectsLoading && projects.length === 0

  // Memoize mapped projects
  const mappedProjects = useMemo(() => 
    projects.map(p => ({
      id: p.id,
      title: p.name,
      thumbnail: p.thumbnail_url,
      updatedAt: new Date(p.updated_at),
      status: p.status as 'draft' | 'completed' | 'processing'
    })), [projects]
  )

  // Health badge component
  const getHealthBadge = useCallback((health: string | undefined) => {
    const config = {
      healthy: { className: 'bg-green-500', label: 'Saudável' },
      warning: { className: 'bg-yellow-500', label: 'Atenção' },
      error: { className: 'bg-red-500', label: 'Crítico' },
      default: { className: 'bg-gray-500', label: 'Desconhecido' }
    }
    const { className, label } = config[health as keyof typeof config] || config.default
    return <Badge className={className}>{label}</Badge>
  }, [])

  if (hasNoProjects) {
    return <EmptyStateHero />
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header com ação principal */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Bem-vindo de volta! Aqui está um resumo dos seus projetos.</p>
        </div>
        <CreateProjectDialog
          trigger={
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Criar Projeto
            </Button>
          }
        />
      </div>

      {/* Erro de carregamento de stats */}
      {statsError && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Não foi possível carregar as estatísticas. Alguns dados podem estar desatualizados.
            </p>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          testId="dashboard-card-total-projects"
          title="Total de Projetos"
          value={stats?.totalProjects || 0}
          subtitle="Projetos ativos"
          icon={FolderOpen}
          loading={statsLoading}
        />
        
        <StatCard
          testId="dashboard-card-active-renders"
          title="Renders Ativos"
          value={stats?.activeRenders || 0}
          subtitle={`${stats?.completedToday || 0} concluídos hoje`}
          icon={Play}
          loading={statsLoading}
        />
        
        <StatCard
          testId="dashboard-card-total-views"
          title="Visualizações"
          value={stats?.totalViews || 0}
          subtitle="Em todos os projetos"
          icon={Zap}
          loading={statsLoading}
        />
        
        <StatCard
          testId="dashboard-card-avg-render-time"
          title="Tempo Médio de Render"
          value={`${stats?.avgRenderTime || 0}m`}
          subtitle="Últimos 10 jobs"
          icon={Bell}
          loading={statsLoading}
        />
      </div>

      {/* Conteúdo principal */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Projetos Recentes</CardTitle>
              <CardDescription>Seus últimos projetos de vídeo</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <RecentProjects
              loading={projectsLoading}
              projects={mappedProjects}
            />
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Saúde e performance atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Saúde Geral</span>
                {statsLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  getHealthBadge(stats?.systemHealth)
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Serviços de API</span>
                <Badge className="bg-green-500">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Banco de Dados</span>
                <Badge className="bg-green-500">Conectado</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fila de Render</span>
                <Badge className="bg-green-500">Ativa</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
