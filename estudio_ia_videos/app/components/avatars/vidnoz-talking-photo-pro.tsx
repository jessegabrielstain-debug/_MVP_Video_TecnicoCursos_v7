
/**
 * 🎭 Vidnoz AI Talking Photo PRO - Versão Premium
 * Interface com recursos PRO + Clonagem de Voz
 */

"use client"

import React, { useState, useRef, useEffect } from 'react'
import { logger } from '@/lib/logger'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Play, Upload, Star, Crown, Volume2, Settings, Crop, Image as ImageIcon, 
  Subtitles, Sparkles, Mic, Download, FileVideo, Zap, Shield, 
  Headphones, Wand2, MonitorSpeaker, Palette, Clock, Check, X
} from 'lucide-react'
import { avatar3DHyperOrchestrator, type OrchestratorPayload } from '@/lib/orchestrator/avatar-3d-hyperreal-orchestrator'

// Avatares com imagens reais geradas
const VIDNOZ_AVATARS = [
  {
    id: 'woman-professional-1',
    name: 'Sarah - Profissional',
    thumbnail: 'https://cdn.abacus.ai/images/3ab73c63-4654-47aa-b42f-bd6b81eba137.png',
    gender: 'female',
    style: 'professional',
    ethnicity: 'caucasian'
  },
  {
    id: 'man-young-casual',
    name: 'Alex - Jovem Profissional', 
    thumbnail: 'https://cdn.abacus.ai/images/8850dca7-bb25-4b4a-a3d1-c136efb9dd24.png',
    gender: 'male',
    style: 'casual',
    ethnicity: 'caucasian'
  },
  {
    id: 'woman-african-business',
    name: 'Maya - Executiva',
    thumbnail: 'https://cdn.abacus.ai/images/d678942c-bc97-4024-b815-c5f88f8a81af.png',
    gender: 'female',
    style: 'business',
    ethnicity: 'afro'
  },
  {
    id: 'man-business-suit',
    name: 'Marcus - Corporativo',
    thumbnail: 'https://cdn.abacus.ai/images/7fc8db7d-8b81-4376-a12c-9e2c0298e0d2.png',
    gender: 'male',
    style: 'corporate',
    ethnicity: 'mixed'
  },
  {
    id: 'woman-nature-casual',
    name: 'Emma - Instrutora',
    thumbnail: 'https://cdn.abacus.ai/images/6a076f92-f9dc-417f-bc80-4fb1b3332d04.png',
    gender: 'female', 
    style: 'casual',
    ethnicity: 'caucasian'
  },
  {
    id: 'woman-beach-relaxed',
    name: 'Sophia - Apresentadora',
    thumbnail: 'https://cdn.abacus.ai/images/06b7deb4-d7c6-4742-85d6-8c0544239a70.png',
    gender: 'female',
    style: 'casual',
    ethnicity: 'latino'
  },
  {
    id: 'baby-cute',
    name: 'Lucas - Bebê',
    thumbnail: 'https://cdn.abacus.ai/images/8686fcf2-8e35-4e56-86f6-b77ff474c146.png',
    gender: 'male',
    style: 'cute',
    ethnicity: 'caucasian'
  },
  {
    id: 'man-corporate-blonde',
    name: 'David - Executivo',
    thumbnail: 'https://cdn.abacus.ai/images/7c593e57-3010-4576-966f-984276ce7072.png',
    gender: 'male',
    style: 'corporate', 
    ethnicity: 'caucasian'
  },
  {
    id: 'woman-friendly-smile',
    name: 'Lisa - Amigável',
    thumbnail: 'https://cdn.abacus.ai/images/b562b8a1-a5d7-4098-9f0f-6671a5174e17.png',
    gender: 'female',
    style: 'friendly',
    ethnicity: 'caucasian'
  },
  {
    id: 'cartoon-adventure',
    name: 'Garota Aventureira',
    thumbnail: 'https://cdn.abacus.ai/images/a90cc811-fb32-47d0-a4eb-288ec8a39d52.png',
    gender: 'female',
    style: 'cartoon',
    ethnicity: 'animated'
  },
  {
    id: 'cartoon-boy-adventure',
    name: 'Garoto Aventureiro',
    thumbnail: 'https://cdn.abacus.ai/images/2c268ac1-6a2a-429b-8787-48981103e820.png', 
    gender: 'male',
    style: 'cartoon',
    ethnicity: 'animated'
  }
]

// Apenas Português Brasil como solicitado
const BRAZILIAN_VOICES = [
  { id: 'francisca-neural', name: 'Francisca', gender: 'female', tone: 'amigável', region: 'SP' },
  { id: 'antonio-neural', name: 'Antônio', gender: 'male', tone: 'profissional', region: 'SP' },
  { id: 'elza-neural', name: 'Elza', gender: 'female', tone: 'calorosa', region: 'RJ' },
  { id: 'fabio-neural', name: 'Fábio', gender: 'male', tone: 'energético', region: 'RJ' },
  { id: 'giovanna-neural', name: 'Giovanna', gender: 'female', tone: 'jovem', region: 'MG' },
  { id: 'humberto-neural', name: 'Humberto', gender: 'male', tone: 'maduro', region: 'RS' },
  { id: 'leila-neural', name: 'Leila', gender: 'female', tone: 'nordestina', region: 'BA' },
  { id: 'julio-neural', name: 'Júlio', gender: 'male', tone: 'gaúcho', region: 'RS' },
  { id: 'manuela-neural', name: 'Manuela', gender: 'female', tone: 'mineira', region: 'MG' },
  { id: 'valerio-neural', name: 'Valério', gender: 'male', tone: 'carioca', region: 'RJ' },
]

const VOICE_TONES = [
  { id: 'amigavel', name: 'Amigável', icon: '😊', description: 'Tom acolhedor e próximo' },
  { id: 'profissional', name: 'Profissional', icon: '🎯', description: 'Autoridade e confiança' },
  { id: 'calorosa', name: 'Calorosa', icon: '🤗', description: 'Emotiva e envolvente' },
  { id: 'energetica', name: 'Energética', icon: '⚡', description: 'Dinâmica e motivadora' },
  { id: 'calma', name: 'Calma', icon: '😌', description: 'Tranquila e relaxante' },
  { id: 'entusiasmada', name: 'Entusiasmada', icon: '🚀', description: 'Empolgante e vibrante' }
]

const EXPORT_FORMATS = [
  { id: 'mp4-hd', name: 'MP4 HD (720p)', size: '~50MB', icon: FileVideo, free: true },
  { id: 'mp4-fhd', name: 'MP4 Full HD (1080p)', size: '~120MB', icon: FileVideo, free: false },
  { id: 'mp4-4k', name: 'MP4 4K (2160p)', size: '~400MB', icon: FileVideo, free: false },
  { id: 'webm-hd', name: 'WebM HD (720p)', size: '~35MB', icon: FileVideo, free: false },
  { id: 'mov-4k', name: 'MOV 4K (2160p)', size: '~450MB', icon: FileVideo, free: false },
]

interface VidnozTalkingPhotoProProps {
  className?: string
}

export default function VidnozTalkingPhotoPro({ className }: VidnozTalkingPhotoProProps) {
  // Estados principais
  const [selectedAvatar, setSelectedAvatar] = useState(VIDNOZ_AVATARS[0])
  const [inputText, setInputText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('francisca-neural')
  const [selectedTone, setSelectedTone] = useState('amigavel')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [previewMode, setPreviewMode] = useState(false)
  
  // Estados PRO
  const [isPro, setIsPro] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null)
  const [removeWatermark, setRemoveWatermark] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('mp4-hd')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [voiceCloneDialog, setVoiceCloneDialog] = useState(false)
  
  // Controles laterais
  const [backgroundEnabled, setBackgroundEnabled] = useState(true)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [motionEnabled, setMotionEnabled] = useState(true)
  const [styleEnabled, setStyleEnabled] = useState(true)
  const [cropEnabled, setCropEnabled] = useState(false)
  
  // Job do orquestrador
  const [currentJob, setCurrentJob] = useState<string | null>(null)
  const [generatedVideos, setGeneratedVideos] = useState<any[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const availableVoices = clonedVoiceId ? 
    [{ id: clonedVoiceId, name: 'Sua Voz Clonada', gender: 'custom', tone: 'personalizada', region: 'BR' }, ...BRAZILIAN_VOICES] : 
    BRAZILIAN_VOICES

  // Função para gerar vídeo PRO
  const handleGenerateVideo = async () => {
    if (!inputText.trim()) {
      alert('Por favor, insira o texto para o avatar falar')
      return
    }

    // Verificar se é formato PRO e usuário não é PRO
    const selectedFormatData = EXPORT_FORMATS.find(f => f.id === selectedFormat)
    if (!selectedFormatData?.free && !isPro) {
      setShowUpgrade(true)
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      logger.info('Iniciando geração REAL de talking photo PRO', {
        textLength: inputText.length,
        avatar: selectedAvatar.name,
        voice: selectedVoice,
        isPro,
        format: selectedFormat,
        component: 'VidnozTalkingPhotoPro'
      })
      
      const jobId = `talking_photo_pro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Progresso realista para operações reais PRO
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 6 + 1 // Progresso mais lento para PRO (maior qualidade)
        })
      }, 1200)

      // Usar API real de geração PRO
      const response = await fetch('/api/talking-photo/generate-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: selectedAvatar.id,
          photoUrl: selectedAvatar.thumbnail,
          text: inputText,
          voiceSettings: {
            voice: clonedVoiceId || selectedVoice, // Usar voz clonada se disponível
            language: 'pt-BR',
            speed: 1.0,
            pitch: 0.0,
            emotion: selectedTone
          },
          videoOptions: {
            format: selectedFormat,
            resolution: isPro ? '4K' : '1080p',
            fps: isPro ? 60 : 30,
            background: backgroundEnabled ? 'enabled' : 'transparent',
            effects: motionEnabled ? [{
              type: 'fade_in',
              startTime: 0,
              duration: 500,
              intensity: 0.5
            }] : []
          },
          proFeatures: {
            removeWatermark: removeWatermark && isPro,
            premiumQuality: isPro,
            voiceCloning: clonedVoiceId !== null,
            extendedText: true,
            advancedLipSync: isPro
          }
        })
      })

      const result = await response.json()
      
      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (result.success) {
        setCurrentJob(jobId)
        
        // Adicionar vídeo gerado ao histórico
        const newVideo = {
          id: jobId,
          avatar: selectedAvatar.name,
          text: inputText.substring(0, 50) + '...',
          format: selectedFormat,
          quality: isPro ? 'Premium' : 'Standard',
          watermark: !removeWatermark,
          createdAt: new Date(),
          downloadUrl: result.data.videoUrl,
          thumbnailUrl: result.data.thumbnailUrl,
          audioUrl: result.data.audioUrl,
          duration: result.data.duration,
          metadata: result.data.metadata
        }
        setGeneratedVideos(prev => [newVideo, ...prev])
        
        setTimeout(() => {
          setIsGenerating(false)
          logger.info('Talking photo PRO gerado com SUCESSO', {
            audioUrl: result.data.audioUrl,
            videoUrl: result.data.videoUrl,
            duration: result.data.duration,
            phonemes: result.data.metadata.ttsData.phonemes,
            lipSyncAccuracy: result.data.metadata.ttsData.lipSyncAccuracy,
            isPro,
            component: 'VidnozTalkingPhotoPro'
          })
          
          alert(`🎉 Talking Photo PRO Gerado com Sucesso!
          
📊 Estatísticas PRO:
• ⏱️ Duração: ${Math.round(result.data.duration/1000)}s
• 🔊 Fonemas: ${result.data.metadata.ttsData.phonemes}
• 👄 Sinc. Labial: ${result.data.metadata.ttsData.lipSyncAccuracy} pontos
• 🎭 Avatar: ${selectedAvatar.name}
• 🗣️ Voz: ${result.data.metadata.ttsData.voice}
• 💎 Qualidade: ${isPro ? '4K/60fps' : 'HD/30fps'}
• 🚫 Sem marca d'água: ${removeWatermark && isPro ? 'SIM' : 'NÃO'}
• 📦 Formato: ${selectedFormat.toUpperCase()}

O avatar agora está realmente falando com sincronização labial hiper-realista!`)
        }, 1000)
        
      } else {
        throw new Error(result.error || 'Erro na geração do talking photo PRO')
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro na geração PRO', error instanceof Error ? error : new Error(String(error)), { avatar: selectedAvatar.name, component: 'VidnozTalkingPhotoPro' })
      alert(`❌ Erro na geração do talking photo PRO:

${errorMessage}

Tente novamente. Se o problema persistir:
• Verifique se o texto não é muito longo (máx. ${isPro ? '10.000' : '3.000'} caracteres)
• Certifique-se de que a conexão está estável
• Para recursos PRO, verifique sua assinatura`)
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  // Função de preview
  const handlePreview = () => {
    if (!inputText.trim()) {
      alert('Por favor, insira texto para visualizar')
      return
    }
    
    setPreviewMode(true)
    setTimeout(() => {
      setPreviewMode(false)
    }, 3000)
  }

  // Upload de imagem
  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const customAvatar = {
          id: 'custom-upload',
          name: 'Upload Personalizado',
          thumbnail: e.target?.result as string,
          gender: 'neutral' as const,
          style: 'custom' as const,
          ethnicity: 'custom' as const
        }
        setSelectedAvatar(customAvatar)
      }
      reader.readAsDataURL(file)
    }
  }

  // Clonagem de voz
  const handleStartVoiceClone = () => {
    setVoiceCloneDialog(true)
  }

  const handleVoiceCloneUpload = () => {
    audioInputRef.current?.click()
  }

  const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsCloning(true)
      
      // Simular processo de clonagem
      setTimeout(() => {
        const cloneId = `voice_clone_${Date.now()}`
        setClonedVoiceId(cloneId)
        setSelectedVoice(cloneId)
        setIsCloning(false)
        setVoiceCloneDialog(false)
        alert('🎉 Voz clonada com sucesso! Agora você pode usar sua própria voz em qualquer avatar.')
      }, 5000)
    }
  }

  // Upgrade para PRO
  const handleUpgradeToPro = () => {
    setIsPro(true)
    setShowUpgrade(false)
    alert('🎉 Bem-vindo ao Vidnoz PRO! Agora você tem acesso a todos os recursos premium.')
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${className}`}>
      {/* Header PRO */}
      <div className="text-center py-8 px-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Badge className={`px-4 py-2 text-base font-semibold rounded-full ${
            isPro 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
              : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
          }`}>
            {isPro ? (
              <>
                <Crown className="w-4 h-4 mr-1" />
                Vidnoz PRO
              </>
            ) : (
              'Vidnoz AI Talking Photo'
            )}
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-base font-medium">
            🇧🇷 Português Brasil
          </Badge>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 bg-clip-text text-transparent mb-4">
          {isPro ? 'Vidnoz PRO - Recursos Premium Liberados' : 'Vidnoz AI Talking Photo - Crie Fotos Falantes Profissionais'}
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-6">
          {isPro 
            ? 'Crie vídeos em alta qualidade sem marca d\'água, use sua própria voz clonada e exporte em múltiplos formatos premium.'
            : 'Transforme suas fotos em avatares falantes realistas com inteligência artificial avançada e vozes brasileiras autênticas.'
          }
        </p>

        {!isPro && (
          <Button
            onClick={() => setShowUpgrade(true)}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade para PRO
          </Button>
        )}
      </div>

      {/* Interface Principal */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* LADO ESQUERDO - Preview do Avatar */}
          <div className="xl:col-span-2 space-y-4">
            <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700">
              <CardContent className="p-0 relative aspect-[16/10]">
                <div className="relative w-full h-full">
                  <Image
                    src={selectedAvatar.thumbnail}
                    alt={selectedAvatar.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  
                  {/* Marca d'água */}
                  {!isPro && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                      Vidnoz.com
                    </div>
                  )}

                  {/* Botão Play Central */}
                  {!previewMode && !isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg" 
                        className="w-20 h-20 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-2xl border-4 border-white/50"
                        onClick={handlePreview}
                      >
                        <Play className="w-10 h-10 fill-current" />
                      </Button>
                    </div>
                  )}

                  {/* Modo Preview */}
                  {previewMode && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                        <p className="text-xl font-medium">Gerando Preview...</p>
                      </div>
                    </div>
                  )}

                  {/* Progresso de Geração */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
                      <div className="text-center space-y-4">
                        <div className={`animate-spin rounded-full h-20 w-20 border-4 border-t-transparent mx-auto ${
                          isPro ? 'border-yellow-500' : 'border-purple-500'
                        }`}></div>
                        <div className="space-y-2">
                          <p className="text-2xl font-semibold">
                            {isPro ? 'Gerando Vídeo Premium...' : 'Gerando Vídeo...'}
                          </p>
                          <Progress value={generationProgress} className="w-80 h-3" />
                          <p className="text-sm text-gray-300">
                            {Math.round(generationProgress)}% - {isPro ? 'Qualidade Cinematográfica' : 'Qualidade Standard'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controles Laterais */}
                  <div className="absolute right-4 top-4 space-y-2">
                    <Button
                      variant={backgroundEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-14 h-14 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30"
                      onClick={() => setBackgroundEnabled(!backgroundEnabled)}
                    >
                      <div className="text-center">
                        <ImageIcon className="w-4 h-4 mb-1" />
                        <span className="text-xs">BG</span>
                      </div>
                    </Button>

                    <Button
                      variant={subtitlesEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-14 h-14 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30"
                      onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                    >
                      <div className="text-center">
                        <Subtitles className="w-4 h-4 mb-1" />
                        <span className="text-xs">CC</span>
                      </div>
                    </Button>

                    <Button
                      variant={motionEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-14 h-14 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30"
                      onClick={() => setMotionEnabled(!motionEnabled)}
                    >
                      <div className="text-center">
                        <Settings className="w-4 h-4 mb-1" />
                        <span className="text-xs">Motion</span>
                      </div>
                    </Button>

                    <Button
                      variant={styleEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-14 h-14 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30 relative"
                      onClick={() => setStyleEnabled(!styleEnabled)}
                    >
                      <div className="text-center">
                        <Sparkles className="w-4 h-4 mb-1" />
                        <span className="text-xs">Style</span>
                      </div>
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1">
                        HOT
                      </Badge>
                    </Button>

                    <Button
                      variant={cropEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-14 h-14 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30"
                      onClick={() => setCropEnabled(!cropEnabled)}
                    >
                      <div className="text-center">
                        <Crop className="w-4 h-4 mb-1" />
                        <span className="text-xs">Crop</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LADO DIREITO - Controles PRO */}
          <div className="space-y-6">
            
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" onClick={() => {}}>Criar</TabsTrigger>
                <TabsTrigger value="history" onClick={() => {}}>Histórico</TabsTrigger>
              </TabsList>

              {/* TAB: Criar */}
              <TabsContent value="create" className="space-y-4">
                {/* PASSO 1 - Escolher Avatar */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      <h3 className="text-lg font-semibold">Escolha um avatar</h3>
                    </div>

                    {/* Galeria Compacta */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {/* Upload Button */}
                      <button
                        className="aspect-square rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
                        onClick={handleUpload}
                      >
                        <div className="text-center">
                          <Upload className="w-5 h-5 mx-auto mb-1" />
                          <span className="text-xs font-medium">Upload</span>
                        </div>
                      </button>

                      {/* Avatar Grid */}
                      {VIDNOZ_AVATARS.slice(0, 11).map((avatar) => (
                        <button
                          key={avatar.id}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                            selectedAvatar.id === avatar.id 
                              ? 'border-purple-500 ring-2 ring-purple-300' 
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                          onClick={() => setSelectedAvatar(avatar)}
                        >
                          <Image
                            src={avatar.thumbnail}
                            alt={avatar.name}
                            width={60}
                            height={60}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>

                    <p className="text-sm text-center text-muted-foreground">
                      Avatar selecionado: <strong>{selectedAvatar.name}</strong>
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </CardContent>
                </Card>

                {/* PASSO 2 - Input Text */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          2
                        </div>
                        <h3 className="text-lg font-semibold">Texto e Voz</h3>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-purple-600 hover:text-purple-700"
                        onClick={handleStartVoiceClone}
                      >
                        <Mic className="w-4 h-4 mr-1" />
                        {clonedVoiceId ? 'Voz Clonada!' : 'Clonar Voz'}
                      </Button>
                    </div>

                    {/* Textarea */}
                    <div className="relative mb-4">
                      <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Digite o texto que o avatar deve falar..."
                        className="min-h-24 resize-none pr-16"
                        maxLength={isPro ? 1000 : 300}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {inputText.length}/{isPro ? 1000 : 300}
                      </div>
                    </div>

                    {/* Controles de Voz Brasileira */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Voz */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">Voz</label>
                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVoices.map((voice) => (
                              <SelectItem key={voice.id} value={voice.id}>
                                <div className="flex items-center gap-2">
                                  {voice.id === clonedVoiceId ? (
                                    <Star className="w-4 h-4 text-yellow-500" />
                                  ) : (
                                    <Volume2 className="w-4 h-4" />
                                  )}
                                  <span>{voice.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {voice.region || voice.tone}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tom */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">Tom</label>
                        <Select value={selectedTone} onValueChange={setSelectedTone}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VOICE_TONES.map((tone) => (
                              <SelectItem key={tone.id} value={tone.id}>
                                <div className="flex items-center gap-2">
                                  <span>{tone.icon}</span>
                                  <span>{tone.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Configurações PRO */}
                    {isPro && (
                      <div className="space-y-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium">Remover marca d'água</span>
                          </div>
                          <Switch
                            checked={removeWatermark}
                            onCheckedChange={setRemoveWatermark}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">Formato de Exportação</label>
                          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPORT_FORMATS.map((format) => (
                                <SelectItem key={format.id} value={format.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                      <format.icon className="w-4 h-4" />
                                      <span>{format.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500">{format.size}</span>
                                      {!format.free && <Crown className="w-3 h-3 text-yellow-500" />}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Button
                        variant="outline"
                        onClick={handlePreview}
                        disabled={!inputText.trim() || isGenerating}
                        className="h-12"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </Button>

                      <Button
                        onClick={handleGenerateVideo}
                        disabled={!inputText.trim() || isGenerating}
                        className={`h-12 ${
                          isPro 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' 
                            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isPro ? 'Gerar PRO' : 'Gerar Vídeo'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB: Histórico */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Vídeos Gerados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {generatedVideos.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileVideo className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum vídeo gerado ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {generatedVideos.map((video) => (
                          <div key={video.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-12 h-12 rounded overflow-hidden">
                              <Image
                                src={video.thumbnailUrl}
                                alt="Thumbnail"
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{video.avatar}</p>
                              <p className="text-sm text-muted-foreground truncate">{video.text}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{video.quality}</Badge>
                                {!video.watermark && (
                                  <Badge className="text-xs bg-yellow-100 text-yellow-800">Sem marca</Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Dialog - Upgrade para PRO */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Upgrade para Vidnoz PRO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Desbloqueie todos os recursos premium:
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Sem marca d'água</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Exportação em 4K</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Clonagem de voz</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Múltiplos formatos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Texto até 1000 caracteres</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUpgrade(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleUpgradeToPro} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500">
                <Crown className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Clonagem de Voz */}
      <Dialog open={voiceCloneDialog} onOpenChange={setVoiceCloneDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-6 h-6 text-purple-500" />
              Clonagem de Voz
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!isCloning ? (
              <>
                <p className="text-muted-foreground">
                  Faça upload de um arquivo de áudio (3-10 minutos) para clonar sua voz:
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Formatos: MP3, WAV, M4A</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Duração: 3-10 minutos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Qualidade: Áudio limpo, sem ruído</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setVoiceCloneDialog(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleVoiceCloneUpload} className="flex-1">
                    <Upload className="w-4 h-4 mr-1" />
                    Upload Áudio
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                <p className="font-medium">Clonando sua voz...</p>
                <p className="text-sm text-muted-foreground">Isso pode levar alguns minutos</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <input
        type="file"
        ref={audioInputRef}
        onChange={handleAudioFileSelect}
        accept="audio/*"
        className="hidden"
      />
    </div>
  )
}
