

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Volume2,
  Layers,
  DollarSign,
  Users,
  Activity
} from 'lucide-react'

interface PerformanceStats {
  totalConversions: number
  successRate: number
  averageProcessingTime: number
  averageSlideCount: number
  mostUsedTemplates: Array<{ templateId: string; usage: number }>
  mostUsedVoices: Array<{ voiceId: string; usage: number }>
  errorBreakdown: Array<{ error: string; count: number }>
}

interface QualityMetrics {
  contentAnalysis: {
    averageTextLength: number
    slidesWithImages: number
    slidesWithNotes: number
    slidesWithLongContent: number
  }
  narrationAnalysis: {
    totalAudioDuration: number
    averageSegmentDuration: number
    segmentCount: number
    estimatedCost: number
  }
  templateAnalysis: {
    autoSelectedTemplates: number
    manuallyChangedTemplates: number
    templateDistribution: Record<string, number>
  }
}

export function PPTXMetricsDashboard() {
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null)
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      
      // Load performance stats
      const perfResponse = await fetch('/api/pptx/metrics?type=performance&days=30')
      const perfData = await perfResponse.json()
      setPerformanceStats(perfData.data)
      
      // Load quality metrics  
      const qualityResponse = await fetch('/api/pptx/metrics?type=quality&days=30')
      const qualityData = await qualityResponse.json()
      setQualityMetrics(qualityData.data)
      
    } catch (error) {
      console.error('Error loading PPTX metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Activity className="w-8 h-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Métricas PPTX Studio
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Análise de performance do sistema de conversão PPTX → Vídeo
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversões Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{performanceStats?.totalConversions || 0}</span>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{performanceStats?.successRate || 0}%</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <Progress value={performanceStats?.successRate || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{performanceStats?.averageProcessingTime || 0}s</span>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Slides Médios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{performanceStats?.averageSlideCount || 0}</span>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="quality">
            <BarChart3 className="w-4 h-4 mr-2" />
            Qualidade
          </TabsTrigger>
          <TabsTrigger value="usage">
            <Users className="w-4 h-4 mr-2" />
            Uso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Templates Mais Usados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates Mais Usados</CardTitle>
                <CardDescription>Templates selecionados automaticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceStats?.mostUsedTemplates?.map((template: any, index: number) => (
                    <div key={template.templateId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">
                          {template.templateId.replace(/[_-]/g, ' ').replace(/\d+$/, '')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.usage} usos</Badge>
                        <div className="w-16">
                          <Progress value={(template.usage / performanceStats.totalConversions) * 100} />
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum dado disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vozes Mais Usadas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vozes Mais Populares</CardTitle>
                <CardDescription>Preferências de narração</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceStats?.mostUsedVoices?.map((voice: any, index: number) => (
                    <div key={voice.voiceId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">
                          {voice.voiceId.replace('pt-BR-', '').replace('Neural', '')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{voice.usage} usos</Badge>
                        <div className="w-16">
                          <Progress value={(voice.usage / performanceStats.totalConversions) * 100} />
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum dado disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Analysis */}
          {(performanceStats?.errorBreakdown?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise de Erros</CardTitle>
                <CardDescription>Erros mais frequentes nas conversões</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performanceStats?.errorBreakdown?.map((error: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium">{error.error}</span>
                      </div>
                      <Badge variant="destructive">{error.count} ocorrências</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          {qualityMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Content Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise de Conteúdo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Texto médio por slide</span>
                    <span className="font-medium">{qualityMetrics.contentAnalysis.averageTextLength} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Slides com imagens</span>
                    <span className="font-medium">{qualityMetrics.contentAnalysis.slidesWithImages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Slides com notas</span>
                    <span className="font-medium">{qualityMetrics.contentAnalysis.slidesWithNotes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Conteúdo extenso</span>
                    <span className="font-medium">{qualityMetrics.contentAnalysis.slidesWithLongContent}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Narration Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise de Narração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Duração total de áudio</span>
                    <span className="font-medium">{Math.round(qualityMetrics.narrationAnalysis.totalAudioDuration / 60)}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Duração média por segmento</span>
                    <span className="font-medium">{qualityMetrics.narrationAnalysis.averageSegmentDuration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total de segmentos</span>
                    <span className="font-medium">{qualityMetrics.narrationAnalysis.segmentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Custo estimado</span>
                    <span className="font-medium text-green-600">
                      ${qualityMetrics.narrationAnalysis.estimatedCost}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Template Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise de Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Seleção automática</span>
                    <span className="font-medium text-green-600">{qualityMetrics.templateAnalysis.autoSelectedTemplates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Alterações manuais</span>
                    <span className="font-medium text-blue-600">{qualityMetrics.templateAnalysis.manuallyChangedTemplates}</span>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">Distribuição de Templates</h5>
                    <div className="space-y-2">
                      {Object.entries(qualityMetrics.templateAnalysis.templateDistribution || {}).map(([template, count]) => (
                        <div key={template} className="flex items-center justify-between">
                          <span className="text-xs">{template.replace(/[_-]/g, ' ')}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={Number(count)} className="w-12" />
                            <span className="text-xs">{String(count)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Trend Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendência de Uso</CardTitle>
                <CardDescription>Conversões por dia (últimos 30 dias)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Gráfico de tendências</p>
                    <p className="text-xs text-gray-500">Implementação com Chart.js em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo de Uso</CardTitle>
                <CardDescription>Estatísticas agregadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Usuários ativos</span>
                  </div>
                  <span className="font-bold">12</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Custo total TTS</span>
                  </div>
                  <span className="font-bold">${qualityMetrics?.narrationAnalysis?.estimatedCost || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Tempo médio de processamento</span>
                  </div>
                  <span className="font-bold">{performanceStats?.averageProcessingTime || 0}s</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Templates disponíveis</span>
                  </div>
                  <span className="font-bold">6</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recomendações</CardTitle>
          <CardDescription>Sugestões para otimização baseadas nos dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(performanceStats?.successRate ?? 100) < 95 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Taxa de sucesso baixa</p>
                  <p className="text-xs text-gray-600">
                    Taxa atual: {performanceStats?.successRate}%. Considere melhorar validação de arquivos PPTX.
                  </p>
                </div>
              </div>
            )}
            
            {(performanceStats?.averageProcessingTime ?? 0) > 30 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Tempo de processamento alto</p>
                  <p className="text-xs text-gray-600">
                    Média atual: {performanceStats?.averageProcessingTime}s. Considere otimização de parser.
                  </p>
                </div>
              </div>
            )}
            
            {(qualityMetrics?.contentAnalysis?.slidesWithLongContent ?? 0) > (qualityMetrics?.contentAnalysis?.averageTextLength ?? 0) && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Conteúdo extenso detectado</p>
                  <p className="text-xs text-gray-600">
                    Muitos slides com texto longo. Considere implementar auto-resumo.
                  </p>
                </div>
              </div>
            )}
            
            {!performanceStats?.totalConversions && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Pronto para usar</p>
                  <p className="text-xs text-gray-600">
                    Sistema PPTX Studio configurado e funcionando. Comece convertendo sua primeira apresentação!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
