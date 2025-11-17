
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  BookOpen,
  FileText,
  Users,
  Clock,
  Target,
  Zap,
  Eye,
  Download,
  Settings,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Star,
  Heart,
  Share2,
  ExternalLink,
  Building,
  HardHat,
  Wrench,
  Activity,
  Globe,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NRTemplate {
  id: string
  nr: 'NR-06' | 'NR-10' | 'NR-12' | 'NR-33' | 'NR-35' | 'NR-17' | 'NR-23'
  title: string
  description: string
  duration: number // em minutos
  difficulty: 'basic' | 'intermediate' | 'advanced'
  industry: string[]
  complianceScore: number
  lastUpdated: Date
  views: number
  rating: number
  scenarios: number
  interactive: boolean
  certified: boolean
  preview?: string
}

interface ComplianceCheck {
  id: string
  rule: string
  status: 'compliant' | 'warning' | 'non-compliant'
  description: string
  recommendation?: string
}

interface IndustryProfile {
  id: string
  name: string
  icon: any
  templates: number
  compliance: number
  popularNRs: string[]
}

export default function NRTemplatesEngine() {
  const [templates, setTemplates] = useState<NRTemplate[]>([
    {
      id: 'nr12-001',
      nr: 'NR-12',
      title: 'Segurança em Máquinas e Equipamentos - Módulo Básico',
      description: 'Treinamento fundamental sobre proteções físicas, dispositivos de segurança e procedimentos básicos de operação segura.',
      duration: 35,
      difficulty: 'basic',
      industry: ['Indústria', 'Manufatura', 'Automobilística'],
      complianceScore: 96.2,
      lastUpdated: new Date('2024-09-15'),
      views: 1247,
      rating: 4.8,
      scenarios: 8,
      interactive: true,
      certified: true
    },
    {
      id: 'nr33-002',
      nr: 'NR-33',
      title: 'Trabalho em Espaços Confinados - Avançado',
      description: 'Procedimentos para entrada em espaços confinados, monitoramento atmosférico e sistema de resgate.',
      duration: 42,
      difficulty: 'advanced',
      industry: ['Petróleo & Gás', 'Química', 'Siderurgia'],
      complianceScore: 94.8,
      lastUpdated: new Date('2024-09-10'),
      views: 856,
      rating: 4.9,
      scenarios: 12,
      interactive: true,
      certified: true
    },
    {
      id: 'nr35-003',
      nr: 'NR-35',
      title: 'Trabalho em Altura - Capacitação Completa',
      description: 'Treinamento completo sobre EPIs, sistemas de proteção coletiva e procedimentos de emergência.',
      duration: 38,
      difficulty: 'intermediate',
      industry: ['Construção Civil', 'Telecomunicações', 'Energia'],
      complianceScore: 92.1,
      lastUpdated: new Date('2024-09-08'),
      views: 1534,
      rating: 4.7,
      scenarios: 10,
      interactive: true,
      certified: true
    },
    {
      id: 'nr10-004',
      nr: 'NR-10',
      title: 'Segurança em Instalações Elétricas - Básico',
      description: 'Riscos elétricos, medidas de controle, uso de EPIs e procedimentos de trabalho.',
      duration: 28,
      difficulty: 'basic',
      industry: ['Elétrico', 'Manutenção', 'Construção Civil'],
      complianceScore: 98.7,
      lastUpdated: new Date('2024-09-12'),
      views: 967,
      rating: 4.6,
      scenarios: 6,
      interactive: true,
      certified: true
    },
    {
      id: 'nr06-005',
      nr: 'NR-06',
      title: 'Equipamentos de Proteção Individual - Completo',
      description: 'Seleção, uso, conservação e descarte correto de EPIs. Certificação CA.',
      duration: 25,
      difficulty: 'basic',
      industry: ['Todos os Setores'],
      complianceScore: 91.3,
      lastUpdated: new Date('2024-09-05'),
      views: 2134,
      rating: 4.5,
      scenarios: 5,
      interactive: false,
      certified: true
    }
  ])

  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([
    {
      id: 'check-1',
      rule: 'Atualização de Conteúdo',
      status: 'compliant',
      description: 'Todos os templates estão atualizados conforme legislação vigente',
      recommendation: 'Manter revisão mensal'
    },
    {
      id: 'check-2',
      rule: 'Carga Horária Mínima',
      status: 'warning',
      description: '2 templates com carga horária abaixo do recomendado',
      recommendation: 'Adicionar módulos complementares'
    },
    {
      id: 'check-3',
      rule: 'Interatividade Obrigatória',
      status: 'non-compliant',
      description: '1 template sem elementos interativos necessários',
      recommendation: 'Implementar exercícios práticos'
    },
    {
      id: 'check-4',
      rule: 'Certificação Digital',
      status: 'compliant',
      description: 'Sistema de certificação ativo e conforme',
      recommendation: 'Blockchain implementation ready'
    }
  ])

  const [selectedNR, setSelectedNR] = useState<string>('all')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('rating')

  const industryProfiles: IndustryProfile[] = [
    {
      id: 'construction',
      name: 'Construção Civil',
      icon: Building,
      templates: 12,
      compliance: 94.2,
      popularNRs: ['NR-35', 'NR-18', 'NR-06']
    },
    {
      id: 'industry',
      name: 'Indústria',
      icon: HardHat,
      templates: 15,
      compliance: 96.5,
      popularNRs: ['NR-12', 'NR-10', 'NR-06']
    },
    {
      id: 'oil-gas',
      name: 'Petróleo & Gás',
      icon: Wrench,
      templates: 8,
      compliance: 98.1,
      popularNRs: ['NR-33', 'NR-20', 'NR-35']
    },
    {
      id: 'healthcare',
      name: 'Saúde',
      icon: Heart,
      templates: 6,
      compliance: 92.7,
      popularNRs: ['NR-06', 'NR-09', 'NR-17']
    }
  ]

  // Filtros e busca
  const filteredTemplates = useMemo(() => {
    let filtered = templates

    if (selectedNR !== 'all') {
      filtered = filtered.filter(template => template.nr === selectedNR)
    }

    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(template => 
        template.industry.some(ind => 
          ind.toLowerCase().includes(selectedIndustry.toLowerCase())
        )
      )
    }

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'views':
          return b.views - a.views
        case 'updated':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime()
        case 'compliance':
          return b.complianceScore - a.complianceScore
        default:
          return 0
      }
    })

    return filtered
  }, [templates, selectedNR, selectedIndustry, searchTerm, sortBy])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getNRColor = (nr: string) => {
    const colors = {
      'NR-06': 'bg-blue-100 text-blue-800 border-blue-200',
      'NR-10': 'bg-purple-100 text-purple-800 border-purple-200',
      'NR-12': 'bg-green-100 text-green-800 border-green-200',
      'NR-33': 'bg-orange-100 text-orange-800 border-orange-200',
      'NR-35': 'bg-red-100 text-red-800 border-red-200',
      'NR-17': 'bg-pink-100 text-pink-800 border-pink-200',
      'NR-23': 'bg-cyan-100 text-cyan-800 border-cyan-200'
    }
    return colors[nr as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'non-compliant': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const generateTemplate = async (nr: NRTemplate['nr'], industry: string) => {
    // Simulate template generation
    const newTemplate: NRTemplate = {
      id: `${nr.toLowerCase()}-${Date.now()}`,
      nr,
      title: `Treinamento ${nr} - ${industry}`,
      description: `Template personalizado para ${industry} com foco em ${nr}`,
      duration: Math.floor(Math.random() * 30) + 20,
      difficulty: 'intermediate',
      industry: [industry],
      complianceScore: Math.floor(Math.random() * 10) + 90,
      lastUpdated: new Date(),
      views: 0,
      rating: 5.0,
      scenarios: Math.floor(Math.random() * 8) + 4,
      interactive: true,
      certified: true
    }

    setTemplates(prev => [newTemplate, ...prev])
  }

  const TemplateCard = ({ template }: { template: NRTemplate }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getNRColor(template.nr)}>
                {template.nr}
              </Badge>
              <Badge className={getDifficultyColor(template.difficulty)}>
                {template.difficulty === 'basic' ? 'Básico' : 
                 template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </Badge>
              {template.certified && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Award className="w-3 h-3 mr-1" />
                  Certificado
                </Badge>
              )}
              {template.interactive && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  <Zap className="w-3 h-3 mr-1" />
                  Interativo
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-lg mb-2">{template.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {template.industry.map((ind) => (
                <Badge key={ind} variant="outline" className="text-xs">
                  {ind}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="ml-4 text-right">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < Math.floor(template.rating) 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-gray-300"
                  )}
                />
              ))}
              <span className="text-sm text-gray-600 ml-1">
                {template.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-gray-500">{template.views} visualizações</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Duração</span>
            <p className="font-medium">{template.duration} min</p>
          </div>
          <div>
            <span className="text-gray-500">Cenários</span>
            <p className="font-medium">{template.scenarios}</p>
          </div>
          <div>
            <span className="text-gray-500">Compliance</span>
            <p className="font-medium text-green-600">{template.complianceScore}%</p>
          </div>
          <div>
            <span className="text-gray-500">Atualizado</span>
            <p className="font-medium">
              {format(template.lastUpdated, 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1" />
              Personalizar
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-1" />
              Usar Template
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates NR Inteligentes</h1>
            <p className="text-gray-600 mt-2">
              Sistema automatizado de templates para Normas Regulamentadoras com compliance garantido
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Shield className="w-3 h-3 mr-1" />
              Compliance 95.2%
            </Badge>
            
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Gerar Template IA
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="industries">Setores</TabsTrigger>
          <TabsTrigger value="generator">Gerador IA</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Buscar Templates</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Digite para buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nr-filter">Norma Regulamentadora</Label>
                  <Select value={selectedNR} onValueChange={setSelectedNR}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as NRs</SelectItem>
                      <SelectItem value="NR-06">NR-06 - EPI</SelectItem>
                      <SelectItem value="NR-10">NR-10 - Elétrica</SelectItem>
                      <SelectItem value="NR-12">NR-12 - Máquinas</SelectItem>
                      <SelectItem value="NR-33">NR-33 - Espaços Confinados</SelectItem>
                      <SelectItem value="NR-35">NR-35 - Trabalho em Altura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="industry-filter">Setor Industrial</Label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Setores</SelectItem>
                      <SelectItem value="construção">Construção Civil</SelectItem>
                      <SelectItem value="indústria">Indústria</SelectItem>
                      <SelectItem value="petróleo">Petróleo & Gás</SelectItem>
                      <SelectItem value="saúde">Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Avaliação</SelectItem>
                      <SelectItem value="views">Popularidade</SelectItem>
                      <SelectItem value="updated">Mais Recente</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid gap-6">
            <AnimatePresence>
              {filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TemplateCard template={template} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-600">95.2%</h3>
                <p className="text-sm text-gray-600">Score Médio Compliance</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-600">25</h3>
                <p className="text-sm text-gray-600">Templates Certificados</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-yellow-600">3</h3>
                <p className="text-sm text-gray-600">Alertas Pendentes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-purple-600">7</h3>
                <p className="text-sm text-gray-600">Dias até Atualização</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Verificações de Compliance
              </CardTitle>
              <CardDescription>
                Análise automática de conformidade com as normas regulamentadoras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceChecks.map((check) => (
                  <div key={check.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    {getComplianceIcon(check.status)}
                    <div className="flex-1">
                      <h4 className="font-medium">{check.rule}</h4>
                      <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                      {check.recommendation && (
                        <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                          <strong>Recomendação:</strong> {check.recommendation}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={
                        check.status === 'compliant'
                          ? 'bg-green-100 text-green-800'
                          : check.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {check.status === 'compliant' ? 'Conforme' : 
                       check.status === 'warning' ? 'Atenção' : 'Não Conforme'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Industries Tab */}
        <TabsContent value="industries" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {industryProfiles.map((industry) => {
              const Icon = industry.icon
              return (
                <Card key={industry.id} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{industry.name}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>{industry.templates} templates disponíveis</p>
                      <p>Compliance: {industry.compliance}%</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3 justify-center">
                      {industry.popularNRs.map((nr) => (
                        <Badge key={nr} variant="outline" className="text-xs">
                          {nr}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      Ver Templates
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* AI Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Gerador de Templates IA
              </CardTitle>
              <CardDescription>
                Crie templates personalizados usando inteligência artificial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="nr-select">Norma Regulamentadora</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a NR" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NR-06">NR-06 - Equipamento de Proteção Individual</SelectItem>
                      <SelectItem value="NR-10">NR-10 - Segurança em Instalações Elétricas</SelectItem>
                      <SelectItem value="NR-12">NR-12 - Segurança no Trabalho em Máquinas</SelectItem>
                      <SelectItem value="NR-33">NR-33 - Segurança em Espaços Confinados</SelectItem>
                      <SelectItem value="NR-35">NR-35 - Trabalho em Altura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="industry-select">Setor Industrial</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construção Civil</SelectItem>
                      <SelectItem value="manufacturing">Indústria</SelectItem>
                      <SelectItem value="oil-gas">Petróleo & Gás</SelectItem>
                      <SelectItem value="healthcare">Saúde</SelectItem>
                      <SelectItem value="logistics">Logística</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="requirements">Requisitos Específicos</Label>
                <Textarea
                  id="requirements"
                  placeholder="Descreva os requisitos específicos do treinamento (ex: equipamentos específicos, procedimentos customizados, casos reais da empresa...)"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input type="number" placeholder="30" min="15" max="120" />
                </div>

                <div>
                  <Label htmlFor="difficulty">Nível de Dificuldade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scenarios">Número de Cenários</Label>
                  <Input type="number" placeholder="6" min="3" max="15" />
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => generateTemplate('NR-12', 'Indústria')}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Gerar Template com IA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
