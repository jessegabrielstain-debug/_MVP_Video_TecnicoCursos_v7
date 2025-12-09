

'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Progress } from '../ui/progress'
import { 
  Sparkles, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Download,
  Share2,
  Wand2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ScriptScene {
  id: string
  title: string
  content: string
  duration: number
  avatar_instructions: string
  visual_cues: string[]
  safety_highlights: string[]
}

interface GeneratedScript {
  title: string
  scenes: ScriptScene[]
  total_duration: number
  compliance_notes: string[]
  engagement_tips: string[]
}

export default function AIScriptGenerator() {
  const [formData, setFormData] = useState({
    nr: '',
    topics: '',
    duration: '15',
    audience: 'geral',
    company_context: ''
  })
  const [loading, setLoading] = useState(false)
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null)
  const [step, setStep] = useState<'form' | 'generating' | 'review'>('form')

  const nrOptions = [
    { value: 'NR-12', label: 'NR-12 - Segurança em Máquinas' },
    { value: 'NR-35', label: 'NR-35 - Trabalho em Altura' },
    { value: 'NR-33', label: 'NR-33 - Espaços Confinados' },
    { value: 'NR-10', label: 'NR-10 - Instalações Elétricas' },
    { value: 'NR-06', label: 'NR-06 - Equipamentos de Proteção Individual' },
    { value: 'NR-17', label: 'NR-17 - Ergonomia' }
  ]

  const audienceOptions = [
    { value: 'operadores', label: 'Operadores de Campo' },
    { value: 'supervisores', label: 'Supervisores e Líderes' },
    { value: 'engenheiros', label: 'Engenheiros e Técnicos' },
    { value: 'geral', label: 'Público Geral' }
  ]

  const handleGenerate = async () => {
    if (!formData.nr || !formData.topics) {
      toast.error('Preencha NR e tópicos obrigatórios')
      return
    }

    setLoading(true)
    setStep('generating')

    try {
      const topics = formData.topics.split('\n').filter(t => t.trim())
      
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nr: formData.nr,
          topics,
          duration: parseInt(formData.duration),
          audience: formData.audience,
          company_context: formData.company_context
        })
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedScript(result.data)
        setStep('review')
        toast.success('Roteiro gerado com sucesso!')
      } else {
        throw new Error(result.error || 'Erro na geração')
      }
    } catch (error) {
      logger.error('Erro ao gerar roteiro', error instanceof Error ? error : new Error(String(error)), { component: 'AIScriptGenerator', nr: formData.nr })
      toast.error('Erro ao gerar roteiro')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  const handleExportScript = () => {
    if (!generatedScript) return

    const scriptText = `
# ${generatedScript.title}

**Duração Total:** ${generatedScript.total_duration} minutos
**Público-Alvo:** ${formData.audience}

${generatedScript.scenes.map((scene, index) => `
## Cena ${index + 1}: ${scene.title}
**Duração:** ${scene.duration} minutos

${scene.content}

**Instruções para Avatar:**
${scene.avatar_instructions}

**Elementos Visuais:**
${scene.visual_cues.map(cue => `- ${cue}`).join('\n')}

**Pontos de Segurança:**
${scene.safety_highlights.map(point => `⚠️ ${point}`).join('\n')}

---
`).join('')}

## Notas de Compliance
${generatedScript.compliance_notes.map(note => `- ${note}`).join('\n')}

## Dicas de Engajamento
${generatedScript.engagement_tips.map(tip => `💡 ${tip}`).join('\n')}
    `

    const blob = new Blob([scriptText], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedScript.title.replace(/\s+/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (step === 'generating') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <Wand2 className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Gerando Roteiro Inteligente</h3>
              <p className="text-gray-600">Criando conteúdo otimizado para {formData.nr}...</p>
            </div>
            <Progress value={loading ? 75 : 100} className="w-full max-w-xs mx-auto" />
            <div className="text-xs text-gray-500 space-y-1">
              <p>✅ Analisando requisitos da NR</p>
              <p>🔄 Gerando estrutura do roteiro</p>
              <p>⏳ Otimizando conteúdo para público-alvo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'review' && generatedScript) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  {generatedScript.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  Roteiro gerado automaticamente com IA avançada
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportScript}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </Button>
                <Button size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  Usar no Editor
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {generatedScript.total_duration} min
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {formData.audience}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {generatedScript.scenes.length} cenas
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Script Scenes */}
        <div className="space-y-4">
          {generatedScript.scenes.map((scene, index) => (
            <Card key={scene.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Cena {index + 1}: {scene.title}
                  </CardTitle>
                  <Badge variant="outline">
                    {scene.duration} min
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Roteiro</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                    {scene.content}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Instruções para Avatar</h4>
                  <p className="text-sm text-gray-600">{scene.avatar_instructions}</p>
                </div>

                {scene.visual_cues.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Elementos Visuais</h4>
                    <div className="flex flex-wrap gap-2">
                      {scene.visual_cues.map((cue, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {scene.safety_highlights.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      Pontos de Segurança Críticos
                    </h4>
                    <ul className="text-sm space-y-1">
                      {scene.safety_highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2 text-orange-700">
                          <span className="text-orange-500 mt-0.5">•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Compliance & Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Compliance Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                {generatedScript.compliance_notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {note}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Dicas de Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                {generatedScript.engagement_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => {
              setStep('form')
              setGeneratedScript(null)
            }}
          >
            Gerar Novo Roteiro
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            Gerador de Roteiros IA
          </CardTitle>
          <CardDescription>
            Crie roteiros profissionais para treinamentos de NRs usando inteligência artificial avançada
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nr">Norma Regulamentadora *</Label>
            <Select value={formData.nr} onValueChange={(value) => setFormData({...formData, nr: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a NR" />
              </SelectTrigger>
              <SelectContent>
                {nrOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">Tópicos a Cobrir *</Label>
            <Textarea 
              id="topics"
              placeholder="Digite os tópicos, um por linha&#10;Exemplo:&#10;Conceitos básicos de segurança&#10;Procedimentos obrigatórios&#10;Equipamentos de proteção&#10;Casos práticos"
              value={formData.topics}
              onChange={(e) => setFormData({...formData, topics: e.target.value})}
              className="min-h-[100px]"
            />
            <p className="text-xs text-gray-500">Um tópico por linha</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input 
                id="duration"
                type="number"
                min="5"
                max="60"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Público-Alvo</Label>
              <Select value={formData.audience} onValueChange={(value) => setFormData({...formData, audience: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audienceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_context">Contexto da Empresa (opcional)</Label>
            <Textarea 
              id="company_context"
              placeholder="Descreva sua empresa, setor, principais riscos ou contexto específico..."
              value={formData.company_context}
              onChange={(e) => setFormData({...formData, company_context: e.target.value})}
              className="min-h-[80px]"
            />
          </div>

          <Separator />

          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Gerando Roteiro...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Roteiro Inteligente
              </>
            )}
          </Button>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Dica</h4>
            <p className="text-sm text-blue-700">
              Seja específico nos tópicos para obter um roteiro mais direcionado. 
              A IA criará cenas estruturadas com instruções para avatares e elementos visuais.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
