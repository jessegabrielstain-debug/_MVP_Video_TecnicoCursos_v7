

'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Target,
  Lightbulb,
  BarChart3,
  ArrowUp,
  ArrowRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface OptimizationSuggestion {
  type: 'content' | 'structure' | 'engagement' | 'compliance'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  impact: string
  implementation: string
}

export default function ContentOptimizer() {
  const [content, setContent] = useState('')
  const [nr, setNr] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [analysis, setAnalysis] = useState<any>(null)

  const handleOptimize = async () => {
    if (!content.trim()) {
      toast.error('Digite o conteúdo para otimizar')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/optimize-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          context: {
            nr: nr || undefined,
            target_audience: 'geral',
            current_engagement: 65
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuggestions(result.data.suggestions)
        setAnalysis(result.data.analysis)
        toast.success('Análise concluída!')
      } else {
        throw new Error(result.error || 'Erro na otimização')
      }
    } catch (error) {
      logger.error('Erro ao otimizar conteúdo', error instanceof Error ? error : new Error(String(error)), { component: 'ContentOptimizer' });
      toast.error('Erro ao otimizar conteúdo')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'engagement': return <TrendingUp className="w-4 h-4" />
      case 'compliance': return <CheckCircle className="w-4 h-4" />
      case 'structure': return <BarChart3 className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Otimizador de Conteúdo IA
          </CardTitle>
          <CardDescription>
            Analise e melhore seu conteúdo de treinamento usando inteligência artificial
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo para Otimizar</label>
            <Textarea 
              placeholder="Cole aqui o conteúdo do seu treinamento que você gostaria de otimizar..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-gray-500">
              {content.length} caracteres
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">NR Relacionada (opcional)</label>
            <input 
              type="text"
              placeholder="Ex: NR-12, NR-35, NR-33"
              value={nr}
              onChange={(e) => setNr(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>

          <Button 
            onClick={handleOptimize} 
            disabled={loading || !content.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analisando...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Otimizar Conteúdo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(75)}`}>
                  75<span className="text-sm">%</span>
                </div>
                <p className="text-xs text-gray-600">Score de Qualidade</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.estimated_improvements}
                </div>
                <p className="text-xs text-gray-600">Melhorias Sugeridas</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {analysis.priority_items}
                </div>
                <p className="text-xs text-gray-600">Itens Alta Prioridade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Sugestões de Otimização ({suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(suggestion.type)}
                      <span className="font-medium capitalize">{suggestion.type}</span>
                    </div>
                    <Badge className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority === 'high' ? 'Alta' : suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Sugestão</h4>
                    <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Impacto Esperado</h4>
                    <p className="text-sm text-green-700 flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      {suggestion.impact}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Como Implementar</h4>
                    <p className="text-sm text-blue-700 flex items-start gap-1">
                      <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {suggestion.implementation}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Próximos Passos</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Foque primeiro nas sugestões de alta prioridade</li>
                <li>• Teste as mudanças com uma amostra do público-alvo</li>
                <li>• Use métricas de engajamento para medir melhorias</li>
                <li>• Revise novamente após implementar as mudanças</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length === 0 && !loading && content && (
        <Card className="border-dashed">
          <CardContent className="text-center py-8">
            <Target className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              Clique em "Otimizar Conteúdo" para receber sugestões personalizadas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
