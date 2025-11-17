/**
 * 📤 EXPORT MODULE
 * Módulo de Exportação para o Studio Unificado
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Download, 
  Upload, 
  Share2, 
  Cloud, 
  Link, 
  Copy,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Settings,
  Zap,
  RotateCcw,
  FileVideo,
  Globe,
  Lock,
  Users,
  Calendar,
  HardDrive,
  Monitor,
  Smartphone,
  Youtube,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  MessageSquare
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

import type { UnifiedProject } from '@/lib/stores/unified-project-store'

interface ExportModuleProps {
  project: UnifiedProject
  onComplete: () => void
}

interface ExportOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  type: 'download' | 'cloud' | 'social' | 'embed'
  formats?: string[]
  requirements?: string[]
}

interface ExportJob {
  id: string
  option: ExportOption
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  url?: string
  error?: string
  metadata?: Record<string, unknown>
}

interface ShareSettings {
  title: string
  description: string
  tags: string[]
  visibility: 'public' | 'private' | 'unlisted'
  allowDownload: boolean
  allowComments: boolean
  expiresAt?: Date
}

const exportOptions: ExportOption[] = [
  {
    id: 'download-mp4',
    name: 'Download MP4',
    description: 'Baixar vídeo em alta qualidade',
    icon: <Download className="w-5 h-5" />,
    type: 'download',
    formats: ['mp4', 'mov', 'avi']
  },
  {
    id: 'cloud-storage',
    name: 'Armazenamento na Nuvem',
    description: 'Salvar no Google Drive, Dropbox ou OneDrive',
    icon: <Cloud className="w-5 h-5" />,
    type: 'cloud',
    requirements: ['Conta conectada']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Publicar diretamente no YouTube',
    icon: <Youtube className="w-5 h-5" />,
    type: 'social',
    requirements: ['Conta YouTube conectada']
  },
  {
    id: 'social-media',
    name: 'Redes Sociais',
    description: 'Compartilhar no Facebook, Instagram, LinkedIn',
    icon: <Share2 className="w-5 h-5" />,
    type: 'social',
    requirements: ['Contas conectadas']
  },
  {
    id: 'embed-link',
    name: 'Link de Incorporação',
    description: 'Gerar link para incorporar em sites',
    icon: <Link className="w-5 h-5" />,
    type: 'embed'
  },
  {
    id: 'email-share',
    name: 'Compartilhar por Email',
    description: 'Enviar vídeo por email',
    icon: <Mail className="w-5 h-5" />,
    type: 'embed'
  }
]

export default function ExportModule({ 
  project, 
  onComplete 
}: ExportModuleProps) {
  const [activeTab, setActiveTab] = useState('download')
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    title: project.name || 'Meu Vídeo',
    description: 'Vídeo criado com Estúdio IA de Vídeos',
    tags: ['apresentação', 'educacional'],
    visibility: 'private',
    allowDownload: true,
    allowComments: false
  })
  
  const [selectedFormat, setSelectedFormat] = useState('mp4')
  const [selectedQuality, setSelectedQuality] = useState('1080p')
  const [cloudProvider, setCloudProvider] = useState('google-drive')
  const [socialPlatform, setSocialPlatform] = useState('youtube')
  
  // Export handlers
  const handleDownloadExport = async () => {
    const option = exportOptions.find(o => o.id === 'download-mp4')!
    const jobId = `export_${Date.now()}`
    
    const job: ExportJob = {
      id: jobId,
      option,
      status: 'processing',
      progress: 0
    }
    
    setExportJobs(prev => [...prev, job])

    try {
      // Simulate export process
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setExportJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, progress } : j
        ))
      }

      // Complete export
      const downloadUrl = `/api/exports/${jobId}/download.${selectedFormat}`
      setExportJobs(prev => prev.map(j => 
        j.id === jobId ? { 
          ...j, 
          status: 'completed', 
          url: downloadUrl,
          metadata: { format: selectedFormat, quality: selectedQuality }
        } : j
      ))

      // Trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${project.name || 'video'}.${selectedFormat}`
      link.click()

      toast.success('Download iniciado!')

    } catch (error: any) {
      setExportJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: 'error', error: error.message } : j
      ))
      toast.error('Erro no download: ' + error.message)
    }
  }

  const handleCloudExport = async () => {
    const option = exportOptions.find(o => o.id === 'cloud-storage')!
    const jobId = `cloud_${Date.now()}`
    
    const job: ExportJob = {
      id: jobId,
      option,
      status: 'processing',
      progress: 0
    }
    
    setExportJobs(prev => [...prev, job])

    try {
      // Simulate cloud upload
      for (let progress = 0; progress <= 100; progress += 5) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setExportJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, progress } : j
        ))
      }

      const cloudUrl = `https://${cloudProvider}.com/file/${jobId}`
      setExportJobs(prev => prev.map(j => 
        j.id === jobId ? { 
          ...j, 
          status: 'completed', 
          url: cloudUrl,
          metadata: { provider: cloudProvider }
        } : j
      ))

      toast.success(`Vídeo salvo no ${cloudProvider}!`)

    } catch (error: any) {
      setExportJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: 'error', error: error.message } : j
      ))
      toast.error('Erro no upload: ' + error.message)
    }
  }

  const handleSocialExport = async () => {
    const option = exportOptions.find(o => o.id === socialPlatform)!
    const jobId = `social_${Date.now()}`
    
    const job: ExportJob = {
      id: jobId,
      option,
      status: 'processing',
      progress: 0
    }
    
    setExportJobs(prev => [...prev, job])

    try {
      // Simulate social media upload
      for (let progress = 0; progress <= 100; progress += 8) {
        await new Promise(resolve => setTimeout(resolve, 400))
        setExportJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, progress } : j
        ))
      }

      const socialUrl = `https://${socialPlatform}.com/watch?v=${jobId}`
      setExportJobs(prev => prev.map(j => 
        j.id === jobId ? { 
          ...j, 
          status: 'completed', 
          url: socialUrl,
          metadata: { platform: socialPlatform, settings: shareSettings }
        } : j
      ))

      toast.success(`Vídeo publicado no ${socialPlatform}!`)

    } catch (error: any) {
      setExportJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: 'error', error: error.message } : j
      ))
      toast.error('Erro na publicação: ' + error.message)
    }
  }

  const handleEmbedExport = async () => {
    const option = exportOptions.find(o => o.id === 'embed-link')!
    const jobId = `embed_${Date.now()}`
    
    const embedUrl = `https://studio.exemplo.com/embed/${jobId}`
    const embedCode = `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
    
    const job: ExportJob = {
      id: jobId,
      option,
      status: 'completed',
      progress: 100,
      url: embedUrl,
      metadata: { embedCode, settings: shareSettings }
    }
    
    setExportJobs(prev => [...prev, job])
    
    // Copy embed code to clipboard
    navigator.clipboard.writeText(embedCode)
    toast.success('Código de incorporação copiado!')
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Render download tab
  const renderDownloadTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Download Local</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Formato</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4 (Recomendado)</SelectItem>
                  <SelectItem value="mov">MOV</SelectItem>
                  <SelectItem value="avi">AVI</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Qualidade</Label>
              <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p (~100MB)</SelectItem>
                  <SelectItem value="1080p">1080p (~200MB)</SelectItem>
                  <SelectItem value="1440p">1440p (~400MB)</SelectItem>
                  <SelectItem value="4K">4K (~800MB)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleDownloadExport} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Baixar Vídeo
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Render cloud tab
  const renderCloudTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="w-5 h-5" />
            <span>Armazenamento na Nuvem</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provedor</Label>
            <Select value={cloudProvider} onValueChange={setCloudProvider}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google-drive">Google Drive</SelectItem>
                <SelectItem value="dropbox">Dropbox</SelectItem>
                <SelectItem value="onedrive">OneDrive</SelectItem>
                <SelectItem value="icloud">iCloud</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                Conecte sua conta {cloudProvider} para continuar
              </p>
            </div>
          </div>

          <Button onClick={handleCloudExport} className="w-full">
            <Cloud className="w-4 h-4 mr-2" />
            Salvar na Nuvem
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Render social tab
  const renderSocialTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Redes Sociais</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Plataforma</Label>
            <Select value={socialPlatform} onValueChange={setSocialPlatform}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Título</Label>
            <Input
              value={shareSettings.title}
              onChange={(e) => setShareSettings(prev => ({ ...prev, title: e.target.value }))}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={shareSettings.description}
              onChange={(e) => setShareSettings(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={shareSettings.tags.join(', ')}
              onChange={(e) => setShareSettings(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()) 
              }))}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Visibilidade</Label>
            <Select 
              value={shareSettings.visibility} 
              onValueChange={(value: string) => setShareSettings(prev => ({ ...prev, visibility: value }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="unlisted">Não listado</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSocialExport} className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Publicar no {socialPlatform}
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Render embed tab
  const renderEmbedTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="w-5 h-5" />
            <span>Link de Incorporação</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Permitir download</Label>
              <Switch
                checked={shareSettings.allowDownload}
                onCheckedChange={(checked) => setShareSettings(prev => ({ ...prev, allowDownload: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Permitir comentários</Label>
              <Switch
                checked={shareSettings.allowComments}
                onCheckedChange={(checked) => setShareSettings(prev => ({ ...prev, allowComments: checked }))}
              />
            </div>
          </div>

          <Button onClick={handleEmbedExport} className="w-full">
            <Link className="w-4 h-4 mr-2" />
            Gerar Link de Incorporação
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Render export jobs
  const renderExportJobs = () => {
    if (exportJobs.length === 0) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileVideo className="w-5 h-5" />
            <span>Histórico de Exportações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {exportJobs.map((job) => (
                <div key={job.id} className="p-3 border border-gray-200 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {job.option.icon}
                      <span className="font-medium text-sm">{job.option.name}</span>
                    </div>
                    
                    <Badge 
                      variant={
                        job.status === 'completed' ? 'default' :
                        job.status === 'error' ? 'destructive' : 'secondary'
                      }
                    >
                      {job.status === 'pending' ? 'Pendente' :
                       job.status === 'processing' ? 'Processando' :
                       job.status === 'completed' ? 'Concluído' : 'Erro'}
                    </Badge>
                  </div>

                  {job.status === 'processing' && (
                    <Progress value={job.progress} className="mb-2" />
                  )}

                  {job.status === 'completed' && job.url && (
                    <div className="flex items-center justify-between">
                      <Input
                        value={job.url}
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(job.url!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {job.metadata?.embedCode && (
                    <div className="mt-2">
                      <Label className="text-xs">Código de Incorporação:</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={job.metadata.embedCode}
                          readOnly
                          className="text-xs font-mono"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(job.metadata.embedCode)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {job.error && (
                    <p className="text-xs text-red-600 mt-2">{job.error}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="download">Download</TabsTrigger>
          <TabsTrigger value="cloud">Nuvem</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="embed">Incorporar</TabsTrigger>
        </TabsList>

        <TabsContent value="download">
          {renderDownloadTab()}
        </TabsContent>

        <TabsContent value="cloud">
          {renderCloudTab()}
        </TabsContent>

        <TabsContent value="social">
          {renderSocialTab()}
        </TabsContent>

        <TabsContent value="embed">
          {renderEmbedTab()}
        </TabsContent>
      </Tabs>

      {/* Export Jobs */}
      {renderExportJobs()}

      {/* Complete Button */}
      <div className="flex justify-end">
        <Button onClick={onComplete} size="lg">
          <CheckCircle className="w-4 h-4 mr-2" />
          Finalizar Projeto
        </Button>
      </div>
    </div>
  )
}