/**
 * 📄 PPTX IMPORT MODULE
 * Módulo de importação de PPTX para o Studio Unificado
 */

'use client'

import React, { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  File,
  Image,
  Play,
  Settings
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

import type { UnifiedProject, ProjectSlide } from '@/lib/stores/unified-project-store'

interface PPTXImportModuleProps {
  project?: UnifiedProject
  onProjectCreate?: (data: { name: string; type: UnifiedProject['type']; source?: any }) => Promise<UnifiedProject>
  onProjectUpdate?: (updates: Partial<UnifiedProject>) => void
  onExecuteStep?: (data: any) => Promise<void>
}

interface ImportProgress {
  stage: 'upload' | 'extract' | 'process' | 'tts' | 'avatar' | 'complete'
  progress: number
  message: string
  details?: string
}

export default function PPTXImportModule({ 
  project, 
  onProjectCreate, 
  onProjectUpdate, 
  onExecuteStep 
}: PPTXImportModuleProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectType, setProjectType] = useState<UnifiedProject['type']>('presentation')
  const [extractedSlides, setExtractedSlides] = useState<ProjectSlide[]>([])
  const [importSettings, setImportSettings] = useState({
    extractImages: true,
    extractAnimations: true,
    extractNotes: true,
    defaultSlideDuration: 5,
    autoGenerateTTS: true
  })

  // File drop handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.endsWith('.pptx')) {
      toast.error('Por favor, selecione um arquivo PPTX válido')
      return
    }

    setIsImporting(true)
    setImportProgress({
      stage: 'upload',
      progress: 0,
      message: 'Fazendo upload do arquivo...'
    })

    try {
      // Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('autoTTS', importSettings.autoGenerateTTS.toString())
      formData.append('autoAvatar', 'true') // Enable avatar generation by default
      formData.append('extractNotes', importSettings.extractNotes.toString())
      formData.append('combineTextAndNotes', 'true')
      formData.append('settings', JSON.stringify(importSettings))

      setImportProgress({
        stage: 'upload',
        progress: 50,
        message: 'Enviando arquivo para o servidor...'
      })

      const uploadResponse = await fetch('/api/pptx/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload do arquivo')
      }

      const { fileId, fileName } = await uploadResponse.json()

      setImportProgress({
        stage: 'extract',
        progress: 25,
        message: 'Extraindo conteúdo do PPTX...'
      })

      // Extract content with automatic TTS and Avatar generation
      const extractResponse = await fetch('/api/pptx/process', {
        method: 'POST',
        body: formData // Use FormData instead of JSON to include file and settings
      })

      if (!extractResponse.ok) {
        throw new Error('Falha na extração do conteúdo')
      }

      const result = await extractResponse.json()
      const { slides, metadata, ttsResult, avatarResult, nextSteps } = result

      // Update progress based on what was processed
      if (ttsResult && importSettings.autoGenerateTTS) {
        setImportProgress({
          stage: 'tts',
          progress: 60,
          message: 'Gerando áudio com TTS...',
          details: `${ttsResult.ttsJobs?.length || 0} áudios gerados`
        })
      }

      if (avatarResult) {
        setImportProgress({
          stage: 'avatar',
          progress: 80,
          message: 'Configurando Avatar 3D...',
          details: `Avatar ${avatarResult.config?.model || 'padrão'} configurado`
        })
      }

      setImportProgress({
        stage: 'process',
        progress: 90,
        message: 'Processando slides...'
      })

      // Convert to project slides with enhanced data
      const projectSlides: ProjectSlide[] = slides.map((slide: any, index: number) => ({
        id: `slide-${index + 1}`,
        slideNumber: index + 1,
        title: slide.title || `Slide ${index + 1}`,
        content: slide.content || '',
        duration: slide.duration || importSettings.defaultSlideDuration,
        thumbnailUrl: slide.thumbnailUrl,
        notes: slide.notes,
        animations: slide.animations || [],
        transitions: slide.transitions,
        // Add TTS data if available
        audioText: slide.audioText,
        ttsJobId: slide.ttsJobId,
        audioUrl: slide.audioUrl,
        // Add Avatar data if available
        avatarConfig: avatarResult?.config
      }))

      setExtractedSlides(projectSlides)

      // Create or update project
      if (!project && onProjectCreate) {
        const newProject = await onProjectCreate({
          name: projectName || fileName.replace('.pptx', ''),
          type: projectType,
          source: {
            type: 'pptx',
            fileId,
            fileName,
            metadata,
            slides: projectSlides
          }
        })

        if (onProjectUpdate) {
          onProjectUpdate({
            slides: projectSlides,
            duration: projectSlides.reduce((total, slide) => total + (slide.duration || 5), 0),
            metadata: {
              ttsJobs: ttsResult?.ttsJobs || [],
              avatarJobs: avatarResult?.avatarJobs || [],
              autoTTSEnabled: importSettings.autoGenerateTTS,
              autoAvatarEnabled: true,
              processingStatus: {
                ttsComplete: !!ttsResult,
                avatarComplete: !!avatarResult,
                readyForRender: nextSteps?.readyForRender || false
              }
            }
          })
        }
      } else if (project && onProjectUpdate) {
        onProjectUpdate({
          slides: projectSlides,
          duration: projectSlides.reduce((total, slide) => total + (slide.duration || 5), 0),
          metadata: {
            ttsJobs: ttsResult?.ttsJobs || [],
            avatarJobs: avatarResult?.avatarJobs || [],
            autoTTSEnabled: importSettings.autoGenerateTTS,
            autoAvatarEnabled: true,
            processingStatus: {
              ttsComplete: !!ttsResult,
              avatarComplete: !!avatarResult,
              readyForRender: nextSteps?.readyForRender || false
            }
          }
        })
      }

      setImportProgress({
        stage: 'complete',
        progress: 100,
        message: 'Importação concluída com sucesso!'
      })

      // Show success message with details
      let successMessage = 'PPTX importado com sucesso!'
      if (ttsResult && avatarResult) {
        successMessage += ` TTS e Avatar configurados automaticamente.`
      } else if (ttsResult) {
        successMessage += ` TTS gerado automaticamente.`
      } else if (avatarResult) {
        successMessage += ` Avatar configurado automaticamente.`
      }
      
      toast.success(successMessage)

      // Show next steps if ready for render
      if (nextSteps?.readyForRender) {
        toast.success('🎬 Projeto pronto para renderização!', {
          description: 'Todos os componentes foram configurados automaticamente.'
        })
      }

      // Execute import step if handler provided
      if (onExecuteStep) {
        await onExecuteStep({
          fileId,
          slides: projectSlides,
          settings: importSettings,
          ttsResult,
          avatarResult,
          nextSteps
        })
      }

    } catch (error: any) {
      logger.error('PPTX import error', error instanceof Error ? error : new Error(String(error)), { component: 'PPTXImportModule' })
      toast.error('Erro na importação: ' + error.message)
    } finally {
      setIsImporting(false)
      setTimeout(() => setImportProgress(null), 3000)
    }
  }, [project, projectName, projectType, importSettings, onProjectCreate, onProjectUpdate, onExecuteStep])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    disabled: isImporting
  })

  // Render import progress
  const renderImportProgress = () => {
    if (!importProgress) return null

    const stageLabels = {
      upload: 'Upload',
      extract: 'Extração',
      process: 'Processamento',
      tts: 'Geração de TTS',
      avatar: 'Configuração de Avatar',
      complete: 'Concluído'
    }

    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="font-medium">{stageLabels[importProgress.stage]}</span>
            </div>
            <span className="text-sm text-gray-500">{importProgress.progress}%</span>
          </div>
          <Progress value={importProgress.progress} className="mb-2" />
          <p className="text-sm text-gray-600">{importProgress.message}</p>
          {importProgress.details && (
            <p className="text-xs text-gray-500 mt-1">{importProgress.details}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Render extracted slides preview
  const renderSlidesPreview = () => {
    if (extractedSlides.length === 0) return null

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Slides Extraídos ({extractedSlides.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extractedSlides.map((slide) => (
              <Card key={slide.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      Slide {slide.slideNumber}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {slide.duration}s
                    </span>
                  </div>
                  
                  {slide.thumbnailUrl && (
                    <div className="mb-3">
                      <img 
                        src={slide.thumbnailUrl} 
                        alt={slide.title}
                        className="w-full h-24 object-cover rounded border"
                      />
                    </div>
                  )}
                  
                  <h4 className="font-medium text-sm mb-1 line-clamp-1">
                    {slide.title}
                  </h4>
                  
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {slide.content}
                  </p>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {slide.animations && slide.animations.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Play className="w-3 h-3" />
                        <span>{slide.animations.length}</span>
                      </div>
                    )}
                    {slide.notes && (
                      <div className="flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>Notas</span>
                      </div>
                    )}
                    {slide.audioUrl && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>TTS</span>
                      </div>
                    )}
                    {!!slide.avatarConfig && (
                      <div className="flex items-center space-x-1 text-purple-600">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>Avatar</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Import Progress */}
      {renderImportProgress()}

      {/* Project Configuration */}
      {!project && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projectName">Nome do Projeto</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Digite o nome do projeto"
              />
            </div>

            <div>
              <Label htmlFor="projectDescription">Descrição (opcional)</Label>
              <Textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Descreva o objetivo do projeto"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="projectType">Tipo de Projeto</Label>
              <Select value={projectType} onValueChange={(value: UnifiedProject['type']) => setProjectType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentation">Apresentação</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="interactive">Interativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configurações de Importação</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="extractImages"
                  checked={importSettings.extractImages}
                  onChange={(e) => setImportSettings(prev => ({ ...prev, extractImages: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="extractImages">Extrair imagens</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="extractAnimations"
                  checked={importSettings.extractAnimations}
                  onChange={(e) => setImportSettings(prev => ({ ...prev, extractAnimations: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="extractAnimations">Extrair animações</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="extractNotes"
                  checked={importSettings.extractNotes}
                  onChange={(e) => setImportSettings(prev => ({ ...prev, extractNotes: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="extractNotes">Extrair notas do apresentador</Label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="defaultDuration">Duração padrão por slide (segundos)</Label>
                <Input
                  id="defaultDuration"
                  type="number"
                  min="1"
                  max="60"
                  value={importSettings.defaultSlideDuration}
                  onChange={(e) => setImportSettings(prev => ({ 
                    ...prev, 
                    defaultSlideDuration: parseInt(e.target.value) || 5 
                  }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoGenerateTTS"
                  checked={importSettings.autoGenerateTTS}
                  onChange={(e) => setImportSettings(prev => ({ ...prev, autoGenerateTTS: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="autoGenerateTTS">Gerar TTS automaticamente</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Drop Zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <Upload className="w-8 h-8 text-gray-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Importar Apresentação PPTX'}
                </h3>
                <p className="text-gray-600">
                  Arraste e solte seu arquivo PPTX aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Suporte para arquivos .pptx até 100MB
                </p>
              </div>

              {!isImporting && (
                <Button variant="outline" className="mt-4">
                  <File className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slides Preview */}
      {renderSlidesPreview()}

      {/* Action Buttons */}
      {extractedSlides.length > 0 && (
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setExtractedSlides([])}>
            Limpar
          </Button>
          <Button 
            onClick={() => onExecuteStep && onExecuteStep({ slides: extractedSlides })}
            disabled={isImporting}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Continuar para Editor
          </Button>
        </div>
      )}
    </div>
  )
}