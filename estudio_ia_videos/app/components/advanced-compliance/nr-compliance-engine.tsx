
'use client'

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Award,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Eye,
  Star,
  Zap,
  Globe,
  Lock,
  BarChart3,
  Activity,
  Target,
  Bookmark
} from 'lucide-react'

interface NRCompliance {
  nr: string
  name: string
  status: 'compliant' | 'partial' | 'non_compliant'
  score: number
  requirements: {
    met: number
    total: number
  }
  lastUpdate: string
  nextAudit: string
  criticalPoints: string[]
  recommendations: string[]
  certificate?: {
    issued: string
    expires: string
    pdf_hash: string
  }
}

interface ComplianceMetrics {
  overallScore: number
  totalNRs: number
  compliantNRs: number
  certificatesIssued: number
  auditsPending: number
  trendsData: {
    month: string
    score: number
    certificates: number
  }[]
}

const NRComplianceEngine = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedNR, setSelectedNR] = useState<string | null>(null)

  // Mock data - Em produção viria da API
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    overallScore: 97.2,
    totalNRs: 37,
    compliantNRs: 35,
    certificatesIssued: 2847,
    auditsPending: 3,
    trendsData: [
      { month: 'Jul', score: 94.1, certificates: 2156 },
      { month: 'Ago', score: 95.8, certificates: 2398 },
      { month: 'Set', score: 97.2, certificates: 2847 }
    ]
  })

  const [nrCompliance, setNrCompliance] = useState<NRCompliance[]>([
    {
      nr: 'NR-06',
      name: 'Equipamentos de Proteção Individual',
      status: 'compliant',
      score: 99.1,
      requirements: { met: 47, total: 47 },
      lastUpdate: '2025-09-25',
      nextAudit: '2025-12-25',
      criticalPoints: [
        'Especificações técnicas dos EPIs',
        'Treinamento de uso correto',
        'Registro de entrega'
      ],
      recommendations: [],
      certificate: {
        issued: '2025-09-25',
        expires: '2026-09-25',
        pdf_hash: 'bc1q3f2a8...k8d9x'
      }
    },
    {
      nr: 'NR-10',
      name: 'Instalações Elétricas',
      status: 'compliant',
      score: 98.7,
      requirements: { met: 82, total: 83 },
      lastUpdate: '2025-09-24',
      nextAudit: '2025-11-24',
      criticalPoints: [
        'Procedimentos de segurança',
        'Qualificação de eletricistas',
        'Equipamentos de proteção coletiva'
      ],
      recommendations: [
        'Atualizar procedimento de desenergização'
      ],
      certificate: {
        issued: '2025-09-24',
        expires: '2026-09-24',
        pdf_hash: 'bc1q9x7m2...p5k1s'
      }
    },
    {
      nr: 'NR-12',
      name: 'Máquinas e Equipamentos',
      status: 'partial',
      score: 94.3,
      requirements: { met: 156, total: 165 },
      lastUpdate: '2025-09-20',
      nextAudit: '2025-10-20',
      criticalPoints: [
        'Dispositivos de segurança',
        'Treinamento operacional',
        'Manutenção preventiva'
      ],
      recommendations: [
        'Implementar sistema de parada de emergência',
        'Atualizar manual de operação',
        'Certificar operadores adicionais'
      ]
    },
    {
      nr: 'NR-33',
      name: 'Espaços Confinados',
      status: 'compliant',
      score: 96.8,
      requirements: { met: 34, total: 35 },
      lastUpdate: '2025-09-22',
      nextAudit: '2026-03-22',
      criticalPoints: [
        'Procedimentos de entrada',
        'Monitoramento atmosférico',
        'Equipe de resgate'
      ],
      recommendations: [
        'Ampliar treinamento de resgate'
      ]
    }
  ])

  const generateComplianceReport = async (nr: string) => {
    setIsGenerating(true)
    
    // Simulação de geração de relatório
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setIsGenerating(false)
    
    // Em produção, faria download do relatório
    logger.info(`Relatório NR-${nr} gerado com sucesso`, { component: 'NRComplianceEngine', nr });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-500'
      case 'partial': return 'text-yellow-500'
      case 'non_compliant': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'compliant': return 'default'
      case 'partial': return 'secondary'  
      case 'non_compliant': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'non_compliant': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Advanced NR Compliance Engine</h2>
          <p className="text-muted-foreground">
            Sistema avançado de conformidade com Normas Regulamentadoras brasileiras
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Sistema Ativo</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Globe className="h-3 w-3" />
            <span>certificados digitais Certified</span>
          </Badge>
        </div>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Geral</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{metrics.overallScore}%</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={metrics.overallScore} className="flex-1" />
              <span className="text-xs text-muted-foreground">Excelente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NRs Conformes</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.compliantNRs}/{metrics.totalNRs}</div>
            <p className="text-xs text-green-500 mt-1">
              +2 desde último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificados</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.certificatesIssued.toLocaleString()}</div>
            <p className="text-xs text-green-500 mt-1">
              +449 este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auditorias Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{metrics.auditsPending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximas 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="nrs">NRs Detalhadas</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Status de Conformidade</span>
                </CardTitle>
                <CardDescription>
                  Distribuição do compliance por NR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {nrCompliance.map((nr) => (
                  <div key={nr.nr} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(nr.status)}
                      <div>
                        <div className="font-medium">{nr.nr}</div>
                        <div className="text-sm text-muted-foreground">{nr.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-500">{nr.score}%</div>
                      <div className="text-xs text-muted-foreground">
                        {nr.requirements.met}/{nr.requirements.total}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Trending */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Tendências</span>
                </CardTitle>
                <CardDescription>
                  Evolução do compliance e certificados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {metrics.trendsData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{data.month}</span>
                      <div className="text-right">
                        <div className="text-green-500 font-bold">{data.score}%</div>
                        <div className="text-xs text-muted-foreground">{data.certificates} certs</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center space-x-2 text-green-500">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+3.1% crescimento mensal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nrs" className="space-y-4">
          <div className="grid gap-4">
            {nrCompliance.map((nr) => (
              <Card key={nr.nr} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(nr.status)}
                        <span>{nr.nr} - {nr.name}</span>
                      </CardTitle>
                      <CardDescription>
                        Última atualização: {new Date(nr.lastUpdate).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadgeVariant(nr.status)} className="mb-2">
                        {nr.status === 'compliant' ? 'Conforme' : 
                         nr.status === 'partial' ? 'Parcial' : 'Não Conforme'}
                      </Badge>
                      <div className="text-2xl font-bold text-green-500">{nr.score}%</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Progress value={nr.score} className="h-2" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {nr.requirements.met}/{nr.requirements.total} requisitos
                    </span>
                  </div>

                  {nr.certificate && (
                    <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <Award className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Certificado Digital Ativo</div>
                        <div className="text-xs text-muted-foreground">
                          Válido até {new Date(nr.certificate.expires).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Badge variant="outline">certificados digitais</Badge>
                    </div>
                  )}

                  {nr.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center space-x-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span>Recomendações:</span>
                      </div>
                      {nr.recommendations.map((rec, index) => (
                        <div key={index} className="text-sm text-muted-foreground ml-5">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateComplianceReport(nr.nr)}
                      disabled={isGenerating}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Gerando...' : 'Relatório'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                    {nr.certificate && (
                      <Button variant="outline" size="sm">
                        <Lock className="h-4 w-4 mr-2" />
                        certificados digitais
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Certificados Digitais</span>
              </CardTitle>
              <CardDescription>
                Gestão de certificados com certificados digitais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {nrCompliance.filter(nr => nr.certificate).map((nr) => (
                  <div key={nr.nr} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{nr.nr.replace('NR-', '')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{nr.nr} - {nr.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Emitido em {new Date(nr.certificate!.issued).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="mb-2">Válido</Badge>
                      <div className="text-xs text-muted-foreground">
                        Expira {new Date(nr.certificate!.expires).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Auditoria e Compliance</span>
              </CardTitle>
              <CardDescription>
                Sistema de auditoria automática e trail de conformidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Auditoria Automatizada Ativa</div>
                    <Badge variant="default">Executando</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Próxima execução completa: 15 de outubro de 2025
                  </div>
                  <Progress value={87} className="mt-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    87% das verificações concluídas
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-500">98.7%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Aprovação</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold">47</div>
                    <div className="text-sm text-muted-foreground">Auditorias Mensais</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Últimas Verificações:</div>
                  <ScrollArea className="h-32">
                    {[
                      'NR-06: Verificação EPIs - Aprovado (99.1%)',
                      'NR-10: Auditoria elétrica - Aprovado (98.7%)',
                      'NR-12: Inspeção máquinas - Pendência menor (94.3%)',
                      'NR-33: Espaços confinados - Aprovado (96.8%)',
                      'NR-35: Trabalho altura - Em progresso'
                    ].map((item, index) => (
                      <div key={index} className="text-sm p-2 border-b last:border-0">
                        {item}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default NRComplianceEngine
