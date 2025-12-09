
'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Download,
  Package,
  School,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileText,
  Zap,
  Shield,
  Award,
  Clock,
  Users
} from 'lucide-react'
import { SlideData, VideoConfig } from '../lib/ai-services'
import { LMSMetadata } from '../lib/lms-integration'
import { toast } from 'react-hot-toast'

interface LMSExportInterfaceProps {
  slides: SlideData[]
  config: VideoConfig
  projectTitle: string
  videoUrl?: string
  onExport?: (format: string, packageUrl: string) => void
}

export default function LMSExportInterface({
  slides,
  config,
  projectTitle,
  videoUrl,
  onExport
}: LMSExportInterfaceProps) {
  interface ExportResult {
    success: boolean;
    format: string;
    package_id: string;
    download_url: string;
    error?: string;
  }

  const [selectedFormat, setSelectedFormat] = useState<string>('SCORM_1_2')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  
  // Metadados do curso
  const [metadata, setMetadata] = useState<Partial<LMSMetadata>>({
    title: projectTitle || 'Treinamento de Segurança',
    description: 'Curso de segurança do trabalho com vídeos interativos',
    keywords: ['segurança', 'trabalho', 'treinamento'],
    difficulty: 'intermediate',
    target_audience: 'Trabalhadores em geral',
    learning_objectives: [
      'Compreender os principais riscos de segurança',
      'Aplicar medidas preventivas adequadas',
      'Seguir procedimentos estabelecidos'
    ],
    prerequisites: [],
    certification: {
      available: true,
      hours: 8,
      authority: 'Estúdio IA de Vídeos'
    }
  })

  const formats = [
    {
      id: 'SCORM_1_2',
      name: 'SCORM 1.2',
      description: 'Padrão amplamente compatível com a maioria dos LMS',
      compatibility: ['Moodle', 'Blackboard', 'Canvas', 'Cornerstone'],
      icon: <Package className="w-5 h-5" />,
      popular: true
    },
    {
      id: 'SCORM_2004', 
      name: 'SCORM 2004',
      description: 'Versão avançada com sequenciamento e navegação melhorados',
      compatibility: ['Moodle', 'Canvas', 'Brightspace', 'Absorb'],
      icon: <Zap className="w-5 h-5" />,
      popular: false
    },
    {
      id: 'xAPI',
      name: 'xAPI (Tin Can)',
      description: 'Padrão moderno para tracking avançado de aprendizagem',
      compatibility: ['Watershed LRS', 'SCORM Cloud', 'Learning Locker'],
      icon: <Shield className="w-5 h-5" />,
      popular: false
    }
  ]

  const estimatedDuration = slides.reduce((sum, slide) => sum + (slide.duration || 0), 0)

  const handleExport = async () => {
    if (!selectedFormat) {
      toast.error('Selecione um formato de exportação')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simular progresso de exportação
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          const next = prev + Math.random() * 15
          return next > 90 ? 90 : next
        })
      }, 500)

      const exportData = {
        slides,
        config,
        metadata: {
          ...metadata,
          duration_minutes: Math.ceil(estimatedDuration / 60),
          identifier: `course_${Date.now()}`,
          language: 'pt-BR',
          typical_learning_time: `${Math.ceil(estimatedDuration / 60)} minutos`
        },
        format: selectedFormat,
        video_url: videoUrl || '/videos/placeholder.mp4'
      }

      const response = await fetch('/api/lms/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      })

      clearInterval(progressInterval)
      
      const result = await response.json()
      
      if (result.success) {
        setExportProgress(100)
        setExportResult(result)
        toast.success('Pacote LMS gerado com sucesso!')
        
        if (onExport) {
          onExport(selectedFormat, result.download_url)
        }
      } else {
        throw new Error(result.error || 'Erro na exportação')
      }
    } catch (error) {
      logger.error('Export error', error instanceof Error ? error : new Error(String(error)), { component: 'LMSExportInterface' });
      toast.error('Erro na exportação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setIsExporting(false)
    }
  }

  const downloadPackage = (downloadUrl: string) => {
    window.open(downloadUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Exportar para LMS</h3>
          <p className="text-sm text-gray-600">
            Gere pacotes compatíveis com principais sistemas LMS
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {slides.length} slides
          </Badge>
          <Badge variant="outline" className="text-xs">
            ~{Math.ceil(estimatedDuration / 60)} min
          </Badge>
        </div>
      </div>

      {/* Resumo do conteúdo */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{slides.length}</div>
              <div className="text-sm text-gray-600">Slides</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{Math.ceil(estimatedDuration / 60)}</div>
              <div className="text-sm text-gray-600">Minutos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {metadata.certification?.hours || 8}
              </div>
              <div className="text-sm text-gray-600">H. Certificação</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">85%</div>
              <div className="text-sm text-gray-600">Taxa Conclusão</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="format" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="format">1. Formato</TabsTrigger>
          <TabsTrigger value="metadata">2. Metadados</TabsTrigger>
          <TabsTrigger value="export">3. Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="format" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formats.map((format) => (
              <Card
                key={format.id}
                className={`cursor-pointer transition-all ${
                  selectedFormat === format.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedFormat(format.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {format.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{format.name}</h4>
                        {format.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {format.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-700">
                          Compatível com:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {format.compatibility.slice(0, 2).map((lms) => (
                            <Badge key={lms} variant="outline" className="text-xs">
                              {lms}
                            </Badge>
                          ))}
                          {format.compatibility.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{format.compatibility.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedFormat === format.id && (
                    <div className="mt-3 pt-3 border-t text-sm text-blue-600">
                      ✓ Formato selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <School className="h-4 w-4" />
            <AlertDescription>
              <strong>Recomendação:</strong> SCORM 1.2 oferece máxima compatibilidade com sistemas LMS corporativos. 
              xAPI é ideal para analytics avançados de aprendizagem.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Título do Curso</label>
                <Input
                  value={metadata.title || ''}
                  onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                  placeholder="Ex: NR-10 - Segurança em Eletricidade"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Descrição</label>
                <Textarea
                  value={metadata.description || ''}
                  onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                  rows={3}
                  placeholder="Descrição detalhada do curso..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Público-Alvo</label>
                <Input
                  value={metadata.target_audience || ''}
                  onChange={(e) => setMetadata({...metadata, target_audience: e.target.value})}
                  placeholder="Ex: Eletricistas e técnicos"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Nível de Dificuldade</label>
                <Select
                  value={metadata.difficulty || 'intermediate'}
                  onValueChange={(value) => setMetadata({...metadata, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Palavras-chave (separadas por vírgula)</label>
                <Input
                  value={metadata.keywords?.join(', ') || ''}
                  onChange={(e) => setMetadata({
                    ...metadata, 
                    keywords: e.target.value.split(',').map(k => k.trim())
                  })}
                  placeholder="segurança, eletricidade, NR-10"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Objetivos de Aprendizagem</label>
                <Textarea
                  value={metadata.learning_objectives?.join('\n') || ''}
                  onChange={(e) => setMetadata({
                    ...metadata,
                    learning_objectives: e.target.value.split('\n').filter(obj => obj.trim())
                  })}
                  rows={4}
                  placeholder="Um objetivo por linha..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Certificação Disponível</label>
                  <Switch
                    checked={metadata.certification?.available || false}
                    onCheckedChange={(checked) => setMetadata({
                      ...metadata,
                      certification: {
                        ...metadata.certification,
                        available: checked,
                        hours: metadata.certification?.hours || 8,
                        authority: metadata.certification?.authority || 'Estúdio IA'
                      }
                    })}
                  />
                </div>
                
                {metadata.certification?.available && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Carga Horária (horas)</label>
                    <Input
                      type="number"
                      value={metadata.certification?.hours || 8}
                      onChange={(e) => setMetadata({
                        ...metadata,
                        certification: {
                          ...metadata.certification!,
                          hours: parseInt(e.target.value) || 8
                        }
                      })}
                      min="1"
                      max="100"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          {/* Resumo da configuração */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo da Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Formato:</strong> {formats.find(f => f.id === selectedFormat)?.name}
                </div>
                <div>
                  <strong>Título:</strong> {metadata.title}
                </div>
                <div>
                  <strong>Slides:</strong> {slides.length} slides
                </div>
                <div>
                  <strong>Duração:</strong> ~{Math.ceil(estimatedDuration / 60)} minutos
                </div>
                <div>
                  <strong>Certificação:</strong> {metadata.certification?.available ? 
                    `${metadata.certification.hours}h` : 'Não disponível'}
                </div>
                <div>
                  <strong>Público:</strong> {metadata.target_audience}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progresso de exportação */}
          {isExporting && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 animate-pulse" />
                    <span className="font-medium">Gerando pacote LMS...</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                  <div className="text-sm text-gray-600">
                    {exportProgress < 30 && 'Processando metadados...'}
                    {exportProgress >= 30 && exportProgress < 60 && 'Gerando conteúdo SCORM...'}
                    {exportProgress >= 60 && exportProgress < 90 && 'Compactando arquivos...'}
                    {exportProgress >= 90 && 'Finalizando pacote...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado da exportação */}
          {exportResult && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="font-medium text-green-800">Pacote LMS Gerado com Sucesso!</h4>
                      <p className="text-sm text-green-700">
                        Seu curso está pronto para upload no LMS
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Formato:</strong> {exportResult.format}
                      </div>
                      <div className="text-sm">
                        <strong>ID do Pacote:</strong> {exportResult.package_id}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadPackage(exportResult.download_url)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Pacote
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Instruções de Upload
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão de exportação */}
          {!isExporting && !exportResult && (
            <div className="flex justify-center">
              <Button
                onClick={handleExport}
                size="lg"
                disabled={!selectedFormat || !metadata.title}
                className="px-8"
              >
                <Package className="w-5 h-5 mr-2" />
                Gerar Pacote LMS
              </Button>
            </div>
          )}

          {/* Instruções */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Próximos Passos:</strong> Após o download, faça upload do arquivo ZIP no seu LMS. 
              O curso aparecerá automaticamente com tracking de progresso e certificação configurados.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}
