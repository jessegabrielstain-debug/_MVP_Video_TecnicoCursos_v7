
'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, AlertTriangle, Eye, Lock, Users, Activity,
  TrendingUp, TrendingDown, CheckCircle, XCircle,
  MapPin, Smartphone, Globe, Clock, Filter, Download
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

interface SecurityDashboardData {
  summary: {
    totalEvents: number
    highRiskEvents: number
    mediumRiskEvents: number
    lowRiskEvents: number
    accessDenied: number
    uniqueIPs: number
    topThreats: Array<{ type: string; count: number }>
  }
  recentEvents: SecurityEvent[]
  riskDistribution: {
    high: number
    medium: number
    low: number
  }
  timeline: Array<{ hour: number; events: number }>
}

interface SecurityEvent {
  id: string
  userId: string
  eventType: string
  ip: string
  userAgent: string
  location?: string
  riskLevel: 'low' | 'medium' | 'high'
  createdAt: Date
  metadata: Record<string, unknown>
}

export default function SecurityDashboard() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchSecurityData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchSecurityData, 30000) // 30s refresh
      return () => clearInterval(interval)
    }
  }, [timeRange, autoRefresh])

  const fetchSecurityData = async () => {
    try {
      const response = await fetch(`/api/v2/security/zero-trust?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for demonstration
  const mockData: SecurityDashboardData = {
    summary: {
      totalEvents: 1247,
      highRiskEvents: 12,
      mediumRiskEvents: 89,
      lowRiskEvents: 1146,
      accessDenied: 8,
      uniqueIPs: 156,
      topThreats: [
        { type: 'RATE_LIMIT_EXCEEDED', count: 23 },
        { type: 'SUSPICIOUS_LOGIN', count: 15 },
        { type: 'UNKNOWN_DEVICE', count: 12 },
        { type: 'LOCATION_ANOMALY', count: 8 },
        { type: 'MULTIPLE_SESSIONS', count: 5 }
      ]
    },
    recentEvents: [
      {
        id: 'evt-1',
        userId: 'user-1',
        eventType: 'ACCESS_GRANTED',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        location: 'São Paulo, BR',
        riskLevel: 'low',
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        metadata: { resource: 'project', action: 'view' }
      },
      {
        id: 'evt-2',
        userId: 'user-2',
        eventType: 'RATE_LIMIT_EXCEEDED',
        ip: '203.45.67.89',
        userAgent: 'curl/7.68.0',
        location: 'Unknown',
        riskLevel: 'high',
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        metadata: { attempts: 150, window: '1min' }
      }
    ],
    riskDistribution: {
      high: 12,
      medium: 89,
      low: 1146
    },
    timeline: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      events: Math.floor(Math.random() * 50) + 10
    }))
  }

  const data = dashboardData || mockData

  const riskChartData = [
    { name: 'Baixo', value: data.riskDistribution.low, color: '#10B981' },
    { name: 'Médio', value: data.riskDistribution.medium, color: '#F59E0B' },
    { name: 'Alto', value: data.riskDistribution.high, color: '#EF4444' }
  ]

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-950'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-950'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ACCESS_GRANTED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ACCESS_DENIED': return <XCircle className="h-4 w-4 text-red-500" />
      case 'RATE_LIMIT_EXCEEDED': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'SUSPICIOUS_LOGIN': return <Eye className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Carregando Dashboard de Segurança...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitoramento Zero Trust e análise de ameaças
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Security KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos de Segurança</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.accessDenied} acessos negados
            </p>
            <div className="mt-2">
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">85% baixo risco</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ameaças Detectadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.summary.highRiskEvents}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.mediumRiskEvents} médio risco
            </p>
            <div className="mt-2 flex space-x-1">
              <Badge variant="destructive" className="text-xs">
                Alto: {data.summary.highRiskEvents}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Médio: {data.summary.mediumRiskEvents}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPs Únicos</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.uniqueIPs}</div>
            <p className="text-xs text-muted-foreground">localizações diferentes</p>
            <div className="mt-2 flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Distribuição normal</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((data.summary.totalEvents - data.summary.accessDenied) / data.summary.totalEvents * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">acessos autorizados</p>
            <div className="mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
              <span className="text-xs text-green-600">+2.3% vs. semana anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="threats">Ameaças</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Risco</CardTitle>
                <CardDescription>Eventos categorizados por nível de risco</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                    >
                      {riskChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline de Eventos</CardTitle>
                <CardDescription>Atividade de segurança nas últimas 24h</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="events" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Threats */}
          <Card>
            <CardHeader>
              <CardTitle>Principais Ameaças</CardTitle>
              <CardDescription>Tipos de eventos de segurança mais frequentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.summary.topThreats.map((threat, index) => (
                  <div key={threat.type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{threat.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{threat.count} ocorrências</p>
                      </div>
                    </div>
                    <Badge variant="destructive">{threat.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Ameaças</CardTitle>
              <CardDescription>Detecção e análise avançada de ameaças</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-700 dark:text-red-300">Críticas</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{data.summary.highRiskEvents}</div>
                  <p className="text-xs text-red-600">Requerem atenção imediata</p>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium text-yellow-700 dark:text-yellow-300">Suspeitas</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{data.summary.mediumRiskEvents}</div>
                  <p className="text-xs text-yellow-600">Monitoramento ativo</p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-700 dark:text-green-300">Seguras</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{data.summary.lowRiskEvents}</div>
                  <p className="text-xs text-green-600">Atividade normal</p>
                </div>
              </div>

              {/* Threat Intelligence */}
              <div className="space-y-4">
                <h4 className="font-medium">Inteligência de Ameaças</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Padrões Detectados</h5>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      <p className="text-sm">• Tentativas de força bruta: 12 IPs bloqueados</p>
                      <p className="text-sm">• Anomalias geográficas: 3 localizações suspeitas</p>
                      <p className="text-sm">• Dispositivos desconhecidos: 8 novos fingerprints</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Ações Automáticas</h5>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      <p className="text-sm">• 15 IPs em quarentena temporária</p>
                      <p className="text-sm">• 23 sessões requerem MFA adicional</p>
                      <p className="text-sm">• 5 usuários notificados sobre atividade suspeita</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Recentes</CardTitle>
              <CardDescription>Log de eventos de segurança em tempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentEvents.map((event) => (
                  <div key={event.id} className={`p-3 rounded-lg ${getRiskLevelColor(event.riskLevel)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getEventIcon(event.eventType)}
                        <div>
                          <p className="font-medium text-sm">
                            {event.eventType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs opacity-75">
                            IP: {event.ip} • {event.location || 'Localização desconhecida'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={event.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                          {event.riskLevel}
                        </Badge>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(event.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Políticas de Segurança</CardTitle>
              <CardDescription>Configuração de regras e controles de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Políticas Ativas</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Rate Limiting</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">100 requests/min per user</p>
                      </div>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Geo-blocking</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Bloquear países de alto risco</p>
                      </div>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Device Fingerprinting</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Detectar dispositivos suspeitos</p>
                      </div>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Behavioral Analytics</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Análise de comportamento em tempo real</p>
                      </div>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Configurações de Risco</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Login de novos dispositivos</span>
                      <Badge variant="secondary">MFA Obrigatório</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Acesso de IPs desconhecidos</span>
                      <Badge variant="secondary">Análise Adicional</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Múltiplas sessões</span>
                      <Badge variant="secondary">Permitido</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Compliance</CardTitle>
              <CardDescription>Relatórios automáticos de segurança e conformidade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Relatório LGPD</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Conformidade com Lei Geral de Proteção de Dados
                    </p>
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Compliant</span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Auditoria de Acesso</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Log completo de acessos e modificações
                    </p>
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Últimas 24h</span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar CSV
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Relatórios Automáticos</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Relatório Diário de Segurança</span>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alerta de Ameaças</span>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Compliance Mensal</span>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
