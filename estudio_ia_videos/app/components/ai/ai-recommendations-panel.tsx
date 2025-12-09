
/**
 * 🤖 AI Recommendations Panel
 * 
 * Painel de recomendações inteligentes de conteúdo
 */

'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Sparkles, TrendingUp, Shield, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Recommendation {
  type: 'content' | 'structure' | 'engagement' | 'compliance'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  implementation: string
  impact: string
}

interface AIRecommendationsPanelProps {
  slides?: Array<{
    title: string
    content: string
    notes?: string
  }>
  targetAudience?: string
  duration?: number
  nr?: string
  onApplyRecommendation?: (rec: Recommendation) => void
}

const typeConfig = {
  content: { icon: Sparkles, color: 'bg-blue-500', label: 'Conteúdo' },
  structure: { icon: TrendingUp, color: 'bg-purple-500', label: 'Estrutura' },
  engagement: { icon: Lightbulb, color: 'bg-yellow-500', label: 'Engajamento' },
  compliance: { icon: Shield, color: 'bg-green-500', label: 'Compliance' },
}

const priorityConfig = {
  high: { color: 'bg-red-500 text-white', label: 'Alta' },
  medium: { color: 'bg-orange-500 text-white', label: 'Média' },
  low: { color: 'bg-blue-500 text-white', label: 'Baixa' },
}

export function AIRecommendationsPanel({
  slides,
  targetAudience,
  duration,
  nr,
  onApplyRecommendation,
}: AIRecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const fetchRecommendations = async () => {
    if (!slides || slides.length === 0) {
      toast.error('Adicione slides para receber recomendações')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides,
          targetAudience,
          duration,
          nr,
        }),
      })

      if (!response.ok) throw new Error('Erro ao buscar recomendações')

      const data = await response.json()
      setRecommendations(data.recommendations || [])
      
      toast.success(`${data.recommendations.length} recomendações geradas!`)
    } catch (error) {
      logger.error('Error fetching recommendations', error instanceof Error ? error : new Error(String(error)), { component: 'AIRecommendationsPanel' });
      toast.error('Erro ao gerar recomendações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Recomendações Inteligentes
          </CardTitle>
          <CardDescription>
            Sugestões geradas por IA para melhorar seu treinamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={fetchRecommendations}
            disabled={loading || !slides || slides.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando recomendações...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Recomendações AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const typeInfo = typeConfig[rec.type]
            const priorityInfo = priorityConfig[rec.priority]
            const Icon = typeInfo.icon
            const isExpanded = expandedIndex === index

            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${typeInfo.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                          <Badge variant="outline">{typeInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        
                        {isExpanded && (
                          <div className="space-y-3 pt-3 border-t">
                            <div>
                              <h5 className="text-sm font-semibold mb-1">Como Implementar:</h5>
                              <p className="text-sm text-muted-foreground">{rec.implementation}</p>
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold mb-1">Impacto Esperado:</h5>
                              <p className="text-sm text-muted-foreground">{rec.impact}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      >
                        {isExpanded ? 'Menos' : 'Mais'}
                      </Button>
                      {onApplyRecommendation && (
                        <Button
                          size="sm"
                          onClick={() => onApplyRecommendation(rec)}
                        >
                          Aplicar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
