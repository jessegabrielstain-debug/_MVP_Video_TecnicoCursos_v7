
'use client'

/**
 * 🛡️ COMPLIANCE PANEL - Sprint 44
 * Painel profissional para validação de conformidade NR
 */

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Download,
  RefreshCw,
  Lock
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ComplianceIssue {
  id: string
  slideNumber: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  description: string
  suggestion: string
  compliant: boolean
}

interface ComplianceResult {
  projectId: string
  overallScore: number
  totalChecks: number
  passed: number
  failed: number
  issues: ComplianceIssue[]
  timestamp: string
}

export default function CompliancePanel({ projectId }: { projectId: string }) {
  const [complianceData, setComplianceData] = useState<ComplianceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [blockPublish, setBlockPublish] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadComplianceData()
  }, [projectId])

  const loadComplianceData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/compliance/check?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setComplianceData(data)
      }
    } catch (error) {
      logger.error('Erro ao carregar compliance', error instanceof Error ? error : new Error(String(error)), { component: 'CompliancePanel' });
    } finally {
      setLoading(false)
    }
  }

  const runComplianceCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      
      if (response.ok) {
        const data = await response.json()
        setComplianceData(data)
        toast.success('✓ Verificação de compliance concluída')
      }
    } catch (error) {
      toast.error('Erro ao executar verificação')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/compliance/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `compliance-report-${projectId}.pdf`
        a.click()
        toast.success('✓ Relatório gerado com sucesso')
      }
    } catch (error) {
      toast.error('Erro ao gerar relatório')
    } finally {
      setGenerating(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (loading && !complianceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance NR - Painel de Validação
              </CardTitle>
              <CardDescription>
                Verificação automática de conformidade com Normas Regulamentadoras
              </CardDescription>
            </div>
            <Button onClick={runComplianceCheck} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Verificar
            </Button>
          </div>
        </CardHeader>
        {complianceData && (
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{complianceData.overallScore}%</div>
                <div className="text-sm text-muted-foreground">Score Geral</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{complianceData.passed}</div>
                <div className="text-sm text-muted-foreground">Aprovados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{complianceData.failed}</div>
                <div className="text-sm text-muted-foreground">Reprovados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{complianceData.totalChecks}</div>
                <div className="text-sm text-muted-foreground">Total Checks</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="block-publish"
                  checked={blockPublish}
                  onCheckedChange={setBlockPublish}
                />
                <Label htmlFor="block-publish" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Bloquear publicação se reprovar
                </Label>
              </div>
            </div>
            <Button onClick={generateReport} disabled={generating || !complianceData}>
              <Download className="h-4 w-4 mr-2" />
              {generating ? 'Gerando...' : 'Gerar Relatório PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      {complianceData && complianceData.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Achados de Conformidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceData.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {getSeverityIcon(issue.severity)}
                          <span className="ml-1 uppercase">{issue.severity}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Slide {issue.slideNumber}
                        </span>
                        <Badge variant="outline">{issue.category}</Badge>
                      </div>
                      <div>
                        <p className="font-medium">{issue.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          💡 {issue.suggestion}
                        </p>
                      </div>
                    </div>
                    <div>
                      {issue.compliant ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {complianceData && complianceData.issues.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">100% Conforme!</h3>
            <p className="text-muted-foreground">
              Nenhum problema de conformidade detectado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
