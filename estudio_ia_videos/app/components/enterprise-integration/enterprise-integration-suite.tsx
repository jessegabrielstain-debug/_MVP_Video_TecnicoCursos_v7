
'use client'

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Building2, 
  Database,
  Users,
  BarChart3,
  Shield,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Target,
  Briefcase,
  Server,
  Cloud,
  Link,
  Activity,
  Webhook,
  Key,
  Lock,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Calendar,
  FileText,
  PieChart,
  LineChart
} from 'lucide-react'

interface ERPIntegration {
  id: string
  name: string
  vendor: string
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  version: string
  lastSync: string
  records: number
  modules: string[]
  apiEndpoint: string
  authentication: 'api_key' | 'oauth2' | 'saml'
  syncFrequency: string
  dataMapping: {
    employees: boolean
    departments: boolean
    training_records: boolean
    certifications: boolean
    compliance: boolean
  }
}

interface HRSystem {
  id: string
  name: string
  provider: string
  status: 'active' | 'inactive' | 'maintenance'
  employees: number
  departments: number
  integration_type: 'rest_api' | 'webhook' | 'file_sync'
  features: string[]
  lastUpdate: string
}

interface ExecutiveDashboard {
  totalEmployees: number
  trainingCompleted: number
  complianceScore: number
  costsReduction: number
  roi: number
  trends: {
    month: string
    completion: number
    compliance: number
    cost: number
  }[]
}

interface ROIMetrics {
  totalInvestment: number
  timeSaved: number
  trainingSavings: number
  complianceAvoidanceCosts: number
  productivityGains: number
  calculatedROI: number
  paybackPeriod: number
}

const EnterpriseIntegrationSuite = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedERP, setSelectedERP] = useState<string>('')
  const [isSyncing, setIsSyncing] = useState(false)

  // Mock data
  const [erpIntegrations] = useState<ERPIntegration[]>([
    {
      id: 'sap-001',
      name: 'SAP ECC',
      vendor: 'SAP SE',
      status: 'connected',
      version: '6.0 EHP8',
      lastSync: '2025-09-26T08:30:00Z',
      records: 15847,
      modules: ['HR', 'MM', 'FI', 'CO'],
      apiEndpoint: 'https://sap.empresa.com/api/v1',
      authentication: 'oauth2',
      syncFrequency: '4 hours',
      dataMapping: {
        employees: true,
        departments: true,
        training_records: true,
        certifications: true,
        compliance: true
      }
    },
    {
      id: 'oracle-002',
      name: 'Oracle HCM Cloud',
      vendor: 'Oracle Corporation',
      status: 'connected',
      version: '23C',
      lastSync: '2025-09-26T07:45:00Z',
      records: 8934,
      modules: ['HCM', 'Payroll', 'Talent', 'Learning'],
      apiEndpoint: 'https://oracle-hcm.empresa.com/api',
      authentication: 'api_key',
      syncFrequency: '6 hours',
      dataMapping: {
        employees: true,
        departments: true,
        training_records: false,
        certifications: true,
        compliance: false
      }
    },
    {
      id: 'workday-003',
      name: 'Workday',
      vendor: 'Workday Inc.',
      status: 'syncing',
      version: '2024R2',
      lastSync: '2025-09-26T09:15:00Z',
      records: 12567,
      modules: ['HCM', 'Financials', 'Planning', 'Analytics'],
      apiEndpoint: 'https://workday.empresa.com/api/v35',
      authentication: 'oauth2',
      syncFrequency: '2 hours',
      dataMapping: {
        employees: true,
        departments: true,
        training_records: true,
        certifications: true,
        compliance: true
      }
    }
  ])

  const [hrSystems] = useState<HRSystem[]>([
    {
      id: 'adp-001',
      name: 'ADP Workforce Now',
      provider: 'ADP',
      status: 'active',
      employees: 3456,
      departments: 24,
      integration_type: 'rest_api',
      features: ['Payroll', 'Benefits', 'Time Tracking', 'Performance'],
      lastUpdate: '2025-09-26T10:00:00Z'
    },
    {
      id: 'bamboohr-002',
      name: 'BambooHR',
      provider: 'BambooHR',
      status: 'active',
      employees: 1789,
      departments: 12,
      integration_type: 'webhook',
      features: ['HRIS', 'Recruiting', 'Onboarding', 'Performance'],
      lastUpdate: '2025-09-26T09:30:00Z'
    }
  ])

  const [executiveDashboard] = useState<ExecutiveDashboard>({
    totalEmployees: 15847,
    trainingCompleted: 13294,
    complianceScore: 97.2,
    costsReduction: 2840000,
    roi: 347,
    trends: [
      { month: 'Jul', completion: 78, compliance: 94, cost: 2650000 },
      { month: 'Ago', completion: 85, compliance: 95, cost: 2740000 },
      { month: 'Set', completion: 89, compliance: 97, cost: 2840000 }
    ]
  })

  const [roiMetrics] = useState<ROIMetrics>({
    totalInvestment: 850000,
    timeSaved: 45000,
    trainingSavings: 1850000,
    complianceAvoidanceCosts: 2300000,
    productivityGains: 1650000,
    calculatedROI: 347,
    paybackPeriod: 8.5
  })

  const syncERP = async (erpId: string) => {
    setIsSyncing(true)
    setSelectedERP(erpId)
    
    // Simulação de sincronização
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setIsSyncing(false)
    setSelectedERP('')
    
    logger.info(`ERP ${erpId} sincronizado com sucesso`, { component: 'EnterpriseIntegrationSuite', erpId })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active': return 'text-green-500'
      case 'syncing': return 'text-blue-500'
      case 'maintenance': return 'text-yellow-500'
      case 'disconnected':
      case 'inactive': return 'text-gray-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'maintenance': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'disconnected':
      case 'inactive': return <AlertCircle className="h-4 w-4 text-gray-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getAuthIcon = (auth: string) => {
    switch (auth) {
      case 'oauth2': return <Shield className="h-4 w-4 text-blue-500" />
      case 'api_key': return <Key className="h-4 w-4 text-yellow-500" />
      case 'saml': return <Lock className="h-4 w-4 text-green-500" />
      default: return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Enterprise Integration Suite</h2>
          <p className="text-muted-foreground">
            Integração completa com sistemas corporativos e dashboard executivo
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Database className="h-3 w-3" />
            <span>{erpIntegrations.length} ERPs</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>{roiMetrics.calculatedROI}% ROI</span>
          </Badge>
        </div>
      </div>

      {/* Métricas Executivas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executiveDashboard.totalEmployees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total integrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treinados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{executiveDashboard.trainingCompleted.toLocaleString()}</div>
            <p className="text-xs text-green-500 mt-1">
              {Math.round((executiveDashboard.trainingCompleted / executiveDashboard.totalEmployees) * 100)}% conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{executiveDashboard.complianceScore}%</div>
            <p className="text-xs text-blue-500 mt-1">
              Score médio NR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {(executiveDashboard.costsReduction / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-green-500 mt-1">
              Este ano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{executiveDashboard.roi}%</div>
            <p className="text-xs text-purple-500 mt-1">
              Retorno investimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="erp">ERP Systems</TabsTrigger>
          <TabsTrigger value="hr">HR APIs</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="roi">ROI Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status das Integrações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Status das Integrações</span>
                </CardTitle>
                <CardDescription>
                  Conexões ativas com sistemas corporativos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {erpIntegrations.map((erp) => (
                  <div key={erp.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(erp.status)}
                      <div>
                        <div className="font-medium">{erp.name}</div>
                        <div className="text-sm text-muted-foreground">{erp.vendor}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{erp.records.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">registros</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Métricas de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Mensal</span>
                </CardTitle>
                <CardDescription>
                  Evolução de compliance e treinamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {executiveDashboard.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="font-medium">{trend.month}</div>
                    <div className="grid grid-cols-3 gap-4 text-right">
                      <div>
                        <div className="text-sm font-bold text-green-500">{trend.completion}%</div>
                        <div className="text-xs text-muted-foreground">Conclusão</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-blue-500">{trend.compliance}%</div>
                        <div className="text-xs text-muted-foreground">Compliance</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-purple-500">
                          R$ {(trend.cost / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-muted-foreground">Economia</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="erp" className="space-y-4">
          <div className="grid gap-4">
            {erpIntegrations.map((erp) => (
              <Card key={erp.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-8 w-8 text-blue-500" />
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{erp.name}</span>
                          {getStatusIcon(erp.status)}
                        </CardTitle>
                        <CardDescription>
                          {erp.vendor} • {erp.version} • Última sincronização: {new Date(erp.lastSync).toLocaleString('pt-BR')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={erp.status === 'connected' ? 'default' : 'secondary'}>
                        {erp.status === 'connected' ? 'Conectado' :
                         erp.status === 'syncing' ? 'Sincronizando' :
                         erp.status === 'error' ? 'Erro' : 'Desconectado'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Módulos Integrados:</div>
                      <div className="flex flex-wrap gap-1">
                        {erp.modules.map((module) => (
                          <Badge key={module} variant="outline" className="text-xs">{module}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Autenticação:</div>
                      <div className="flex items-center space-x-2">
                        {getAuthIcon(erp.authentication)}
                        <span className="text-sm capitalize">{erp.authentication.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-center">
                    {Object.entries(erp.dataMapping).map(([key, enabled]) => (
                      <div key={key} className="p-2 border rounded">
                        <div className={`text-sm ${enabled ? 'text-green-500' : 'text-gray-400'}`}>
                          {enabled ? <CheckCircle2 className="h-4 w-4 mx-auto" /> : <AlertCircle className="h-4 w-4 mx-auto opacity-30" />}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 capitalize">
                          {key.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Registros: <strong>{erp.records.toLocaleString()}</strong></span>
                    <span>Frequência: <strong>{erp.syncFrequency}</strong></span>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => syncERP(erp.id)}
                      disabled={isSyncing || erp.status === 'error'}
                    >
                      {(isSyncing && selectedERP === erp.id) ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sincronizar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hr" className="space-y-4">
          <div className="grid gap-4">
            {hrSystems.map((hr) => (
              <Card key={hr.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-green-500" />
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{hr.name}</span>
                          {getStatusIcon(hr.status)}
                        </CardTitle>
                        <CardDescription>
                          {hr.provider} • {hr.integration_type.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{hr.employees.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">funcionários</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {hr.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-500">{hr.employees.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Funcionários</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-500">{hr.departments}</div>
                      <div className="text-xs text-muted-foreground">Departamentos</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-500">{hr.features.length}</div>
                      <div className="text-xs text-muted-foreground">Recursos</div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Última atualização: {new Date(hr.lastUpdate).toLocaleString('pt-BR')}
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Webhook className="h-4 w-4 mr-2" />
                      Webhook
                    </Button>
                    <Button size="sm" variant="outline">
                      <Activity className="h-4 w-4 mr-2" />
                      Status
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dashboard Executivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Dashboard Executivo</span>
                </CardTitle>
                <CardDescription>
                  Métricas consolidadas de todos os sistemas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-500">
                      {Math.round((executiveDashboard.trainingCompleted / executiveDashboard.totalEmployees) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Taxa de Conclusão</div>
                    <Progress value={(executiveDashboard.trainingCompleted / executiveDashboard.totalEmployees) * 100} className="mt-2" />
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-500">{executiveDashboard.complianceScore}%</div>
                    <div className="text-sm text-muted-foreground mt-2">Compliance Score</div>
                    <Progress value={executiveDashboard.complianceScore} className="mt-2" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total de Funcionários</span>
                    <span className="font-bold">{executiveDashboard.totalEmployees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Treinamentos Concluídos</span>
                    <span className="font-bold text-green-500">{executiveDashboard.trainingCompleted.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Economia Anual</span>
                    <span className="font-bold text-purple-500">
                      R$ {(executiveDashboard.costsReduction / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ROI Calculado</span>
                    <span className="font-bold text-orange-500">{executiveDashboard.roi}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5" />
                  <span>Tendências Analytics</span>
                </CardTitle>
                <CardDescription>
                  Evolução das métricas ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {executiveDashboard.trends.map((trend, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{trend.month}/2025</span>
                      <Badge variant="outline">{index === executiveDashboard.trends.length - 1 ? 'Atual' : 'Histórico'}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Conclusão de Treinamentos</span>
                        <span className="text-green-500 font-bold">{trend.completion}%</span>
                      </div>
                      <Progress value={trend.completion} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Score de Compliance</span>
                        <span className="text-blue-500 font-bold">{trend.compliance}%</span>
                      </div>
                      <Progress value={trend.compliance} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Economia Acumulada</span>
                        <span className="text-purple-500 font-bold">
                          R$ {(trend.cost / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>ROI Calculator</span>
                </CardTitle>
                <CardDescription>
                  Análise detalhada de retorno sobre investimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Investimento Total</span>
                      <span className="text-lg font-bold text-red-500">
                        R$ {(roiMetrics.totalInvestment / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {roiMetrics.timeSaved.toLocaleString()}h
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Tempo Economizado</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        R$ {(roiMetrics.trainingSavings / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Economia Treinamento</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-500">
                        R$ {(roiMetrics.complianceAvoidanceCosts / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Custos Evitados</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-500">
                        R$ {(roiMetrics.productivityGains / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Ganhos Produtividade</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-500 mb-2">
                        {roiMetrics.calculatedROI}%
                      </div>
                      <div className="text-sm text-muted-foreground">ROI Calculado</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Payback em {roiMetrics.paybackPeriod} meses
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Detalhamento de Custos</span>
                </CardTitle>
                <CardDescription>
                  Análise detalhada dos benefícios financeiros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Economia em Treinamentos</div>
                      <div className="text-sm text-muted-foreground">Redução custos presenciais</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-500">
                        R$ {(roiMetrics.trainingSavings / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-muted-foreground">32% do total</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Custos de Compliance Evitados</div>
                      <div className="text-sm text-muted-foreground">Multas e sanções evitadas</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-500">
                        R$ {(roiMetrics.complianceAvoidanceCosts / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-muted-foreground">40% do total</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Ganhos de Produtividade</div>
                      <div className="text-sm text-muted-foreground">Funcionários mais capacitados</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-500">
                        R$ {(roiMetrics.productivityGains / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-muted-foreground">28% do total</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">Benefício Total Anual</div>
                    <div className="text-3xl font-bold text-green-500">
                      R$ {((roiMetrics.trainingSavings + roiMetrics.complianceAvoidanceCosts + roiMetrics.productivityGains) / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Relatório ROI
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnterpriseIntegrationSuite
