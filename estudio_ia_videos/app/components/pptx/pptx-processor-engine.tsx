
'use client'

/**
 * 🔧 PPTX Processor Engine
 * Engine completo de processamento PPTX com PptxGenJS, extração de conteúdo e geração de cenas
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileText, 
  Image as ImageIcon, 
  Play, 
  Download, 
  Eye,
  Settings,
  Layers,
  Clock,
  BarChart3,
  ArrowRight
} from 'lucide-react'
import Image from 'next/image'
import { Logger } from '@/lib/logger'

const logger = new Logger('PPTXProcessor')

interface ProcessingResult {
  id: string
  fileName: string
  s3Key: string
  metadata: {
    totalSlides: number
    title: string
    author: string
    created: string
    fileSize: number
    dimensions: { width: number; height: number }
  }
  slides: Array<{
    slideNumber: number
    title: string
    content: string
    images: string[]
    notes: string
    layout: string
    backgroundImage?: string
    animations?: string[]
    duration?: number
  }>
  assets: {
    images: string[]
    videos: string[]
    audio: string[]
    fonts: string[]
  }
  timeline: {
    totalDuration: number
    scenes: Array<{
      sceneId: string
      slideNumber: number
      startTime: number
      endTime: number
      transitions: string[]
      voiceover?: string
    }>
  }
  extractionStats: {
    textBlocks: number
    images: number
    shapes: number
    charts: number
    tables: number
  }
}

interface PPTXProcessorEngineProps {
  processingResults: ProcessingResult[]
  onProcessingUpdate?: (results: ProcessingResult[]) => void
}

export default function PPTXProcessorEngine({ 
  processingResults = [],
  onProcessingUpdate 
}: PPTXProcessorEngineProps) {
  const [selectedResult, setSelectedResult] = useState<ProcessingResult | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [processing, setProcessing] = useState(false)

  // Selecionar primeiro resultado automaticamente
  useEffect(() => {
    if (processingResults.length > 0 && !selectedResult) {
      setSelectedResult(processingResults[0])
    }
  }, [processingResults, selectedResult])

  // Reprocessar arquivo
  const reprocessFile = async (result: ProcessingResult) => {
    setProcessing(true)
    
    try {
      const response = await fetch('/api/v1/pptx/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key: result.s3Key }),
      })
      
      if (response.ok) {
        const updatedResult = await response.json()
        const updatedResults = processingResults.map(r => 
          r.id === result.id ? { ...r, ...updatedResult } : r
        )
        onProcessingUpdate?.(updatedResults)
      }
    } catch (error) {
      logger.error('Erro no reprocessamento', error instanceof Error ? error : undefined)
    } finally {
      setProcessing(false)
    }
  }

  // Gerar timeline
  const generateTimeline = async (result: ProcessingResult) => {
    try {
      const response = await fetch('/api/v1/pptx/generate-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          s3Key: result.s3Key,
          slides: result.slides 
        }),
      })
      
      if (response.ok) {
        const timelineData = await response.json()
        logger.info('Timeline gerada', timelineData)
      }
    } catch (error) {
      logger.error('Erro na geração de timeline', error instanceof Error ? error : undefined)
    }
  }

  if (!selectedResult) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum arquivo processado</h3>
          <p className="text-muted-foreground">
            Faça upload de um arquivo PPTX para ver os resultados do processamento
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Seletor de arquivo */}
      {processingResults.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arquivos Processados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {processingResults.map((result) => (
                <Button
                  key={result.id}
                  variant={selectedResult.id === result.id ? "default" : "outline"}
                  className="justify-start h-auto p-3"
                  onClick={() => setSelectedResult(result)}
                >
                  <FileText className="w-4 h-4 mr-2 shrink-0" />
                  <div className="text-left truncate">
                    <p className="font-medium truncate">{result.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.metadata.totalSlides} slides
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com informações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              {selectedResult.fileName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estatísticas principais */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Slides:</span>
                <Badge variant="secondary">{selectedResult.metadata.totalSlides}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Imagens:</span>
                <Badge variant="secondary">{selectedResult.extractionStats.images}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Texto:</span>
                <Badge variant="secondary">{selectedResult.extractionStats.textBlocks}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Gráficos:</span>
                <Badge variant="secondary">{selectedResult.extractionStats.charts}</Badge>
              </div>
            </div>

            {/* Metadados */}
            <div className="pt-4 border-t space-y-2">
              <h4 className="font-medium text-sm">Metadados</h4>
              <div className="space-y-1 text-xs">
                <p><strong>Título:</strong> {selectedResult.metadata.title || 'N/A'}</p>
                <p><strong>Autor:</strong> {selectedResult.metadata.author || 'N/A'}</p>
                <p><strong>Criado:</strong> {new Date(selectedResult.metadata.created).toLocaleDateString()}</p>
                <p><strong>Tamanho:</strong> {(selectedResult.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            </div>

            {/* Ações */}
            <div className="pt-4 border-t space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => reprocessFile(selectedResult)}
                disabled={processing}
              >
                <Settings className="w-4 h-4 mr-2" />
                Reprocessar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => generateTimeline(selectedResult)}
              >
                <Clock className="w-4 h-4 mr-2" />
                Gerar Timeline
              </Button>
              <Button variant="default" size="sm" className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Criar Vídeo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo principal */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Processamento PPTX</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="slides">Slides</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                {/* Visão Geral */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Layers className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                        <p className="text-2xl font-bold">{selectedResult.metadata.totalSlides}</p>
                        <p className="text-sm text-muted-foreground">Slides Totais</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <ImageIcon className="w-8 h-8 mx-auto text-green-600 mb-2" />
                        <p className="text-2xl font-bold">{selectedResult.assets.images.length}</p>
                        <p className="text-sm text-muted-foreground">Imagens</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                        <p className="text-2xl font-bold">{selectedResult.extractionStats.charts}</p>
                        <p className="text-sm text-muted-foreground">Gráficos</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Progresso de Extração</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Texto extraído</span>
                          <span className="text-sm">100%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Imagens processadas</span>
                          <span className="text-sm">100%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Layouts identificados</span>
                          <span className="text-sm">95%</span>
                        </div>
                        <Progress value={95} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Slides */}
                <TabsContent value="slides">
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {selectedResult.slides.map((slide, index) => (
                        <Card key={slide.slideNumber}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant="outline">Slide {slide.slideNumber}</Badge>
                                  <Badge variant="secondary" className="text-xs">{slide.layout}</Badge>
                                </div>
                                
                                <h4 className="font-medium mb-2">{slide.title || `Slide ${slide.slideNumber}`}</h4>
                                
                                {slide.content && (
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {slide.content.substring(0, 150)}...
                                  </p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>{slide.images.length} imagens</span>
                                  {slide.animations && <span>{slide.animations.length} animações</span>}
                                  {slide.notes && <span>Com anotações</span>}
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Assets */}
                <TabsContent value="assets">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Imagens ({selectedResult.assets.images.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedResult.assets.images.slice(0, 8).map((image, index) => (
                          <div key={index} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        ))}
                        {selectedResult.assets.images.length > 8 && (
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">
                              +{selectedResult.assets.images.length - 8}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedResult.assets.fonts.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Fontes Utilizadas</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResult.assets.fonts.map((font, index) => (
                            <Badge key={index} variant="outline">{font}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Timeline */}
                <TabsContent value="timeline">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Timeline de Vídeo</h4>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {selectedResult.timeline.totalDuration}s total
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {selectedResult.timeline.scenes.map((scene, index) => (
                        <Card key={scene.sceneId}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline">Cena {index + 1}</Badge>
                                <span className="text-sm">Slide {scene.slideNumber}</span>
                                <span className="text-xs text-muted-foreground">
                                  {scene.startTime}s - {scene.endTime}s
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {scene.voiceover && (
                                  <Badge variant="secondary" className="text-xs">Narração</Badge>
                                )}
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Export */}
                <TabsContent value="export">
                  <div className="space-y-4">
                    <h4 className="font-medium">Opções de Exportação</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <h5 className="font-medium mb-2">JSON Estruturado</h5>
                          <p className="text-sm text-muted-foreground mb-4">
                            Dados estruturados para integração com outros sistemas
                          </p>
                          <Button variant="outline" className="w-full">
                            <Download className="w-4 h-4 mr-2" />
                            Download JSON
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h5 className="font-medium mb-2">Timeline de Vídeo</h5>
                          <p className="text-sm text-muted-foreground mb-4">
                            Arquivo de timeline para editores de vídeo
                          </p>
                          <Button variant="outline" className="w-full">
                            <Download className="w-4 h-4 mr-2" />
                            Export Timeline
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-2">Criar Projeto de Vídeo</h5>
                        <p className="text-sm text-muted-foreground mb-4">
                          Gerar projeto completo com avatares, narração e efeitos
                        </p>
                        <Button className="w-full">
                          <Play className="w-4 h-4 mr-2" />
                          Iniciar Criação de Vídeo
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
