'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { 
  Award,
  Shield,
  Search,
  Download,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Building,
  FileText,
  QrCode,
  Link,
  Sparkles,
  BarChart3,
  RefreshCw
} from 'lucide-react'

// Types para certificados PDF (sem blockchain)
interface Certificate {
  id: string
  certificate_number: string
  pdf_hash: string // Hash do PDF para verificação
  learner: {
    id: string
    name: string
    email: string
    employee_id?: string
    company?: string
  }
  training: {
    id: string
    title: string
    description: string
    nr_codes: string[]
    duration_hours: number
    completion_date: string
    expiration_date: string
  }
  assessment: {
    final_score: number
    max_score: number
    passing_score: number
    attempts: number
    quiz_scores: Array<{ section: string; score: number; max_score: number }>
  }
  issuer: {
    organization: string
    instructor: string
    authority: string
    license_number: string
  }
  verification: {
    pdf_url: string
    verification_hash: string
    verification_url: string
  }
  metadata: {
    created_at: string
    signed_by: string
    digital_signature: string
    pdf_url: string
    qr_code_url: string
    validity_period: number
  }
  compliance: {
    nr_standards: string[]
    government_recognition: boolean
    international_recognition: boolean
    renewal_required: boolean
    ceu_credits: number
  }
}

interface CertificateVerification {
  is_valid: boolean
  certificate?: Certificate
  error?: string
  expiration_status?: 'valid' | 'expiring_soon' | 'expired'
  warnings?: string[]
}

interface IssuanceProgress {
  step: string
  progress: number
  error?: string
}

export default function CertificationCenter() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [verificationInput, setVerificationInput] = useState('')
  const [verificationResult, setVerificationResult] = useState<CertificateVerification | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [issuanceProgress, setIssuanceProgress] = useState<IssuanceProgress | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    // Simular carregamento de certificados
    const mockCertificates: Certificate[] = [
      {
        id: 'cert-1',
        certificate_number: 'CERT-2025-001-ABC123',
        pdf_hash: 'sha256:1234567890abcdef...',
        learner: {
          id: 'user-123',
          name: 'João Silva',
          email: 'joao@empresa.com',
          employee_id: 'EMP001',
          company: 'Empresa Industrial Ltda'
        },
        training: {
          id: 'nr12-training',
          title: 'NR-12: Segurança em Máquinas',
          description: 'Treinamento completo sobre segurança em máquinas industriais',
          nr_codes: ['NR-12'],
          duration_hours: 8,
          completion_date: '2025-08-25T10:30:00Z',
          expiration_date: '2027-08-25T10:30:00Z'
        },
        assessment: {
          final_score: 87,
          max_score: 100,
          passing_score: 70,
          attempts: 1,
          quiz_scores: [
            { section: 'Conceitos Básicos', score: 85, max_score: 100 },
            { section: 'Práticas Seguras', score: 92, max_score: 100 },
            { section: 'Legislação', score: 84, max_score: 100 }
          ]
        },
        issuer: {
          organization: 'Estúdio IA de Vídeos',
          instructor: 'Prof. Maria Santos',
          authority: 'Ministério do Trabalho e Emprego',
          license_number: 'LIC-2025-001'
        },
        verification: {
          pdf_url: '/certificates/CERT-2025-001-ABC123.pdf',
          verification_hash: 'sha256:abcdef1234567890...',
          verification_url: 'https://estudio-ia.com/verify/CERT-2025-001-ABC123'
        },
        metadata: {
          created_at: '2025-08-25T10:45:00Z',
          signed_by: 'Prof. Maria Santos',
          digital_signature: 'DS-Q0VDVC0yMDI1LTAwMS1BQkMxMjM=-1724585100',
          pdf_url: '/certificates/CERT-2025-001-ABC123.pdf',
          qr_code_url: '/certificates/qr/CERT-2025-001-ABC123.png',
          validity_period: 24
        },
        compliance: {
          nr_standards: ['NR-12'],
          government_recognition: true,
          international_recognition: false,
          renewal_required: true,
          ceu_credits: 8
        }
      }
    ]
    
    setCertificates(mockCertificates)
  }

  const handleVerifyCertificate = async () => {
    if (!verificationInput.trim()) return

    setIsVerifying(true)
    try {
      // Simular verificação de certificado via API
      const response = await fetch('/api/certificates/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: verificationInput })
      })
      const result = await response.json()
      setVerificationResult(result)
    } catch (error) {
      logger.error('Erro ao verificar certificado:', error instanceof Error ? error : new Error(String(error)), { component: 'CertificationCenter' })
      setVerificationResult({ is_valid: false, error: 'Erro ao verificar certificado' })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleIssueCertificate = async () => {
    setIssuanceProgress({ step: 'Preparando', progress: 0 })
    
    try {
      // Simular processo de emissão
      const steps = [
        { step: 'Validando dados', progress: 20 },
        { step: 'Criando registro no banco', progress: 50 },
        { step: 'Gerando PDF', progress: 75 },
        { step: 'Finalizando', progress: 100 }
      ]

      for (const stepData of steps) {
        setIssuanceProgress(stepData)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Emitir certificado via API
      const response = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learner_id: 'demo-user',
          training_id: 'nr12-demo',
          completion_date: new Date().toISOString(),
          final_score: 85,
          training_duration_hours: 8,
          template: selectedTemplate || 'nr-standard',
          issuer: {
            organization: 'Estúdio IA de Vídeos',
            instructor: 'Sistema IA',
            authority: 'Plataforma Certificada'
          }
        })
      })

      const newCertificate = await response.json()
      setCertificates(prev => [newCertificate, ...prev])
      setIssuanceProgress(null)
      
    } catch (error) {
      logger.error('Erro ao emitir certificado:', error instanceof Error ? error : new Error(String(error)), { component: 'CertificationCenter' })
      setIssuanceProgress({ step: 'Erro', progress: 0, error: 'Falha na emissão' })
    }
  }

  const getExpirationStatus = (expirationDate: string) => {
    const now = new Date()
    const expiration = new Date(expirationDate)
    const daysUntilExpiration = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiration < 0) return { status: 'expired', color: 'bg-red-500', days: Math.abs(daysUntilExpiration) }
    if (daysUntilExpiration < 30) return { status: 'expiring', color: 'bg-yellow-500', days: daysUntilExpiration }
    return { status: 'valid', color: 'bg-green-500', days: daysUntilExpiration }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-600" />
            Centro de Certificação Digital
          </h3>
          <p className="text-muted-foreground">
            Certificados verificáveis e assinados digitalmente
          </p>
        </div>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Digitalmente Assinado
        </Badge>
      </div>

      <Tabs defaultValue="certificates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="certificates">Meus Certificados</TabsTrigger>
          <TabsTrigger value="verify">Verificar</TabsTrigger>
          <TabsTrigger value="issue">Emitir</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Certificados */}
        <TabsContent value="certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificados Digitais</CardTitle>
              <CardDescription>
                Todos os seus certificados verificáveis na blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="font-semibold mb-2">Nenhum certificado ainda</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Complete um treinamento para receber seu primeiro certificado digital
                  </p>
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Começar Treinamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {certificates.map((certificate) => {
                    const expiration = getExpirationStatus(certificate.training.expiration_date!)
                    
                    return (
                      <Card key={certificate.id} className="relative overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{certificate.training.title}</h4>
                              <p className="text-sm text-muted-foreground">{certificate.training.description}</p>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                {certificate.training.nr_codes.map(nr => (
                                  <Badge key={nr} variant="secondary" className="text-xs">
                                    {nr}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${expiration.color}`} />
                                <span className="text-sm font-medium">
                                  {expiration.status === 'valid' ? 'Válido' : 
                                   expiration.status === 'expiring' ? 'Expirando' : 'Expirado'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {expiration.status === 'expired' ? `Expirou há ${expiration.days} dias` :
                                 `${expiration.days} dias restantes`}
                              </p>
                            </div>
                          </div>

                          {/* Métricas */}
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{certificate.assessment.final_score}%</div>
                              <div className="text-xs text-muted-foreground">Score Final</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{certificate.training.duration_hours}h</div>
                              <div className="text-xs text-muted-foreground">Duração</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">{certificate.compliance.ceu_credits || 0}</div>
                              <div className="text-xs text-muted-foreground">CEU Credits</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-orange-600">{certificate.assessment.attempts}</div>
                              <div className="text-xs text-muted-foreground">Tentativas</div>
                            </div>
                          </div>

                          {/* Informações Blockchain */}
                          <div className="bg-muted/50 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Verificação Digital</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Hash:</span>
                                <p className="font-mono text-muted-foreground break-all">
                                  {certificate.pdf_hash}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                            <Button size="sm" variant="outline">
                              <QrCode className="h-3 w-3 mr-1" />
                              QR Code
                            </Button>
                            <Button size="sm" variant="outline">
                              <Link className="h-3 w-3 mr-1" />
                              Compartilhar
                            </Button>
                            {expiration.status === 'expiring' || expiration.status === 'expired' ? (
                              <Button size="sm" className="bg-green-600">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Renovar
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verificação */}
        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Verificar Certificado
              </CardTitle>
              <CardDescription>
                Verifique a autenticidade de qualquer certificado digital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o número do certificado ou hash de verificação..."
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleVerifyCertificate}
                  disabled={!verificationInput.trim() || isVerifying}
                >
                  {isVerifying ? (
                    <Search className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Resultado da Verificação */}
              {verificationResult && (
                <Card className={`${verificationResult.is_valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {verificationResult.is_valid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {verificationResult.is_valid ? 'Certificado Válido' : 'Certificado Inválido'}
                      </span>
                    </div>

                    {verificationResult.is_valid && (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Status:</span>
                            <p className={`${
                              verificationResult.expiration_status === 'valid' ? 'text-green-600' :
                              verificationResult.expiration_status === 'expiring_soon' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {verificationResult.expiration_status === 'valid' ? 'Válido' :
                               verificationResult.expiration_status === 'expiring_soon' ? 'Expirando em breve' :
                               'Expirado'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Assinatura Digital:</span>
                            <p className="text-green-600">
                              {verificationResult.is_valid ? 'Confirmado' : 'Pendente'}
                            </p>
                          </div>
                        </div>

                        {verificationResult.certificate && (
                          <div className="mt-3 p-2 bg-white rounded border">
                            <span className="font-medium">Hash de Verificação:</span>
                            <p className="font-mono text-xs text-muted-foreground break-all">
                              {verificationResult.certificate.pdf_hash}
                            </p>
                          </div>
                        )}

                        {verificationResult.warnings && verificationResult.warnings.length > 0 && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <h5 className="font-medium text-yellow-800 mb-1">Avisos:</h5>
                            {verificationResult.warnings.map((warning, index) => (
                              <p key={index} className="text-sm text-yellow-700">{warning}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emissão */}
        <TabsContent value="issue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Emitir Novo Certificado
              </CardTitle>
              <CardDescription>
                Criar certificado digital para treinamento concluído
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Template Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Template do Certificado</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nr-standard">NR Padrão - Certificado padrão para NRs</SelectItem>
                    <SelectItem value="nr-advanced">NR Avançado - Certificado detalhado</SelectItem>
                    <SelectItem value="custom">Personalizado - Layout customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Demo de Emissão */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-3">Demo de Emissão</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Simule a emissão de um certificado digital para testar o sistema
                </p>
                
                <Button 
                  onClick={handleIssueCertificate}
                  disabled={!selectedTemplate || !!issuanceProgress}
                  className="w-full"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Emitir Certificado Demo
                </Button>
              </div>

              {/* Progress da Emissão */}
              {issuanceProgress && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>{issuanceProgress.step}</span>
                        <span>{issuanceProgress.progress}%</span>
                      </div>
                      <Progress value={issuanceProgress.progress} />
                      {issuanceProgress.error && (
                        <p className="text-sm text-red-600">{issuanceProgress.error}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Emitidos</p>
                    <p className="text-2xl font-bold">2,847</p>
                    <p className="text-xs text-green-600">+12% este mês</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa Verificação</p>
                    <p className="text-2xl font-bold">97.8%</p>
                    <p className="text-xs text-blue-600">Excelente confiabilidade</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Economia de Custos</p>
                    <p className="text-2xl font-bold">R$ 89K</p>
                    <p className="text-xs text-green-600">vs certificação tradicional</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por NR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { nr: 'NR-12', count: 856, percentage: 30.1 },
                  { nr: 'NR-35', count: 734, percentage: 25.8 },
                  { nr: 'NR-10', count: 623, percentage: 21.9 },
                  { nr: 'NR-33', count: 456, percentage: 16.0 },
                  { nr: 'Outros', count: 178, percentage: 6.2 }
                ].map((item) => (
                  <div key={item.nr} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.nr}</Badge>
                      <span className="text-sm">{item.count} certificados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

