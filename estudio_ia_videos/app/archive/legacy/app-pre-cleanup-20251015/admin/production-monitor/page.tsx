
/**
 * 📊 Dashboard de Monitoramento Production-Ready
 * Interface completa para monitoramento do sistema em produção
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Cloud,
  Shield,
  Zap,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  TrendingUp,
  RefreshCw,
  Download,
  TestTube,
  AlertCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemMetrics {
  timestamp: string
  uptime: number
  version: string
  environment: string
  os: {
    platform: string
    arch: string
    cpus: number
    totalMemory: number
    freeMemory: number
    loadAverage: number[]
  }
  process: {
    memoryUsage: {
      rss: number
      heapTotal: number
      heapUsed: number
    }
  }
  metrics: Record<string, unknown>
  alerts: {
    active: number
    total: number
    recent: any[]
  }
  rateLimit: {
    totalKeys: number
    activeKeys: number
  }
  security: {
    whitelist: number
    blacklist: number
  }
  config: {
    hasDatabase: boolean
    hasGoogleTTS: boolean
    hasAWSS3: boolean
    hasOpenAI: boolean
    backupEnabled: boolean
  }
}

interface HealthStatus {
  status: string
  timestamp: string
  duration: number
  checks: Record<string, {
    healthy: boolean
    error?: string
    duration: number
  }>
  system: {
    memory: {
      heapUsedPercentage: number
      rss: number
      heapUsed: number
      heapTotal: number
    }
    uptime: number
    freeMemory: number
    totalMemory: number
  }
}

export default function ProductionMonitorPage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30s

  // Carregar dados
  const loadData = async () => {
    try {
      const [systemResponse, healthResponse] = await Promise.all([
        fetch('/api/admin/system'),
        fetch('/api/health')
      ])

      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        setSystemMetrics(systemData.data)
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setHealthStatus(healthData)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados de monitoramento')
    } finally {
      setLoading(false)
    }
  }

  // Auto refresh
  useEffect(() => {
    loadData()

    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Executar backup manual
  const executeBackup = async (type: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Backup ${type} executado com sucesso!`)
        loadData() // Recarregar dados
      } else {
        toast.error(`Erro no backup: ${data.message}`)
      }
    } catch (error) {
      toast.error('Erro ao executar backup')
    } finally {
      setLoading(false)
    }
  }

  // Executar testes
  const runTests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/tests')
      const data = await response.json()

      if (response.ok) {
        const { summary } = data
        toast.success(`Testes executados: ${summary.passed}/${summary.total} passaram`)
      } else {
        toast.error('Erro ao executar testes')
      }
    } catch (error) {
      toast.error('Erro ao executar testes')
    } finally {
      setLoading(false)
    }
  }

  // Resolver alerta
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolveAlert', params: { alertId } })
      })

      if (response.ok) {
        toast.success('Alerta resolvido')
        loadData()
      } else {
        toast.error('Erro ao resolver alerta')
      }
    } catch (error) {
      toast.error('Erro ao resolver alerta')
    }
  }

  if (loading && !systemMetrics && !healthStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Carregando dados de monitoramento...</p>
          </div>
        </div>
      </div>
    )
  }

  const healthStatusIcon = healthStatus?.status === 'healthy' ? 
    <CheckCircle className="w-5 h-5 text-green-500" /> :
    <XCircle className="w-5 h-5 text-red-500" />

  const uptimeFormatted = systemMetrics ? 
    new Date(systemMetrics.uptime * 1000).toISOString().substr(11, 8) : '00:00:00'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Production Monitor
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sistema de monitoramento em tempo real
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {healthStatusIcon}
              <span className="font-semibold">
                {healthStatus?.status === 'healthy' ? 'Sistema Saudável' : 'Problemas Detectados'}
              </span>
            </div>

            <Button
              onClick={loadData}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Uptime */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
                  <p className="text-2xl font-bold">{uptimeFormatted}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memória</p>
                  <p className="text-2xl font-bold">
                    {healthStatus?.system.memory.heapUsedPercentage || 0}%
                  </p>
                  <Progress 
                    value={healthStatus?.system.memory.heapUsedPercentage || 0} 
                    className="w-full mt-2"
                  />
                </div>
                <MemoryStick className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alertas Ativos</p>
                  <p className="text-2xl font-bold text-red-500">
                    {systemMetrics?.alerts.active || 0}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          {/* Rate Limiting */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rate Limit</p>
                  <p className="text-2xl font-bold">
                    {systemMetrics?.rateLimit.activeKeys || 0}
                  </p>
                  <p className="text-xs text-gray-500">chaves ativas</p>
                </div>
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Testes
            </TabsTrigger>
          </TabsList>

          {/* Health Tab */}
          <TabsContent value="health">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Health Checks */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Checks</CardTitle>
                  <CardDescription>
                    Status detalhado dos componentes do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthStatus?.checks && Object.entries(healthStatus.checks).map(([name, check]) => (
                      <div key={name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {check.healthy ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{name}</p>
                            {check.error && (
                              <p className="text-sm text-red-600">{check.error}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={check.healthy ? "default" : "destructive"}>
                          {check.duration}ms
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Recursos do Sistema</CardTitle>
                  <CardDescription>
                    Uso atual de CPU, memória e disk
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    
                    {/* Memory */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Memória Heap</span>
                        <span>{healthStatus?.system.memory.heapUsed}MB / {healthStatus?.system.memory.heapTotal}MB</span>
                      </div>
                      <Progress value={healthStatus?.system.memory.heapUsedPercentage || 0} />
                    </div>

                    {/* System Memory */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Memória Sistema</span>
                        <span>
                          {healthStatus?.system.freeMemory}MB / {healthStatus?.system.totalMemory}MB livres
                        </span>
                      </div>
                      <Progress 
                        value={healthStatus ? 
                          ((healthStatus.system.totalMemory - healthStatus.system.freeMemory) / healthStatus.system.totalMemory) * 100 : 0
                        } 
                      />
                    </div>

                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* System Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Versão</p>
                        <p className="text-gray-600">{systemMetrics?.version}</p>
                      </div>
                      <div>
                        <p className="font-medium">Ambiente</p>
                        <Badge variant={systemMetrics?.environment === 'production' ? "default" : "secondary"}>
                          {systemMetrics?.environment}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">Platform</p>
                        <p className="text-gray-600">{systemMetrics?.os.platform}</p>
                      </div>
                      <div>
                        <p className="font-medium">Arquitetura</p>
                        <p className="text-gray-600">{systemMetrics?.os.arch}</p>
                      </div>
                      <div>
                        <p className="font-medium">CPUs</p>
                        <p className="text-gray-600">{systemMetrics?.os.cpus}</p>
                      </div>
                      <div>
                        <p className="font-medium">Load Average</p>
                        <p className="text-gray-600">
                          {systemMetrics?.os.loadAverage.map(l => l.toFixed(2)).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status das Configurações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemMetrics?.config && Object.entries(systemMetrics.config).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        {value ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>Métricas da Aplicação</CardTitle>
                <CardDescription>
                  Métricas coletadas em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                {systemMetrics?.metrics && Object.keys(systemMetrics.metrics).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(systemMetrics.metrics).map(([metric, data]) => (
                      <div key={metric} className="p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold mb-2">{metric}</h4>
                        <div className="text-sm text-gray-600">
                          <pre className="overflow-auto">{JSON.stringify(data, null, 2)}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma métrica disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Alertas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Alertas de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {systemMetrics?.alerts.recent && systemMetrics.alerts.recent.length > 0 ? (
                    <div className="space-y-3">
                      {systemMetrics.alerts.recent.map((alert, index) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="flex items-center justify-between">
                            <span>{alert.message}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolver
                            </Button>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-green-600 py-8">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                      <p>Nenhum alerta ativo</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rate Limiting */}
              <Card>
                <CardHeader>
                  <CardTitle>Rate Limiting</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total de chaves</span>
                      <Badge>{systemMetrics?.rateLimit.totalKeys || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Chaves ativas</span>
                      <Badge variant="secondary">{systemMetrics?.rateLimit.activeKeys || 0}</Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span>IPs na Whitelist</span>
                      <Badge variant="outline">{systemMetrics?.security.whitelist || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>IPs na Blacklist</span>
                      <Badge variant="destructive">{systemMetrics?.security.blacklist || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Backup</CardTitle>
                <CardDescription>
                  Gerenciamento de backups automáticos e manuais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <Button
                    onClick={() => executeBackup('full')}
                    disabled={loading}
                    className="h-20 flex-col"
                  >
                    <Database className="w-6 h-6 mb-2" />
                    Backup Completo
                  </Button>

                  <Button
                    onClick={() => executeBackup('database')}
                    disabled={loading}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <Database className="w-6 h-6 mb-2" />
                    Apenas Database
                  </Button>

                  <Button
                    onClick={() => executeBackup('files')}
                    disabled={loading}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <HardDrive className="w-6 h-6 mb-2" />
                    Apenas Arquivos
                  </Button>

                  <Button
                    onClick={() => executeBackup('config')}
                    disabled={loading}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <Server className="w-6 h-6 mb-2" />
                    Configurações
                  </Button>
                </div>

                <Separator className="my-6" />

                <div className="text-sm text-gray-600">
                  <p><strong>Agendamento:</strong> Backups automáticos todos os dias às 2h da manhã</p>
                  <p><strong>Retenção:</strong> 30 dias</p>
                  <p><strong>Status:</strong> {systemMetrics?.config.backupEnabled ? 'Ativo' : 'Inativo'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Testes</CardTitle>
                <CardDescription>
                  Execução de testes automatizados em produção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Button
                    onClick={runTests}
                    disabled={loading}
                    size="lg"
                    className="mb-4"
                  >
                    <TestTube className="w-5 h-5 mr-2" />
                    {loading ? 'Executando...' : 'Executar Todos os Testes'}
                  </Button>
                  
                  <p className="text-sm text-gray-600">
                    Executa testes de unidade, integração e health checks
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Os testes são executados de forma segura e não afetam a operação normal do sistema.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
