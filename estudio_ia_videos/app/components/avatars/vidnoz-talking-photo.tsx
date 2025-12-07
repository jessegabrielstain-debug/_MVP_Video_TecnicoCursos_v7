
/**
 * 🎭 Vidnoz AI Talking Photo - Interface Idêntica
 * Replicação exata da interface original do Vidnoz
 */

"use client"

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Upload, Star, Crown, Volume2, Settings, Crop, Image as ImageIcon, Subtitles, Sparkles } from 'lucide-react'
import { avatar3DHyperOrchestrator, type OrchestratorPayload } from '@/lib/orchestrator/avatar-3d-hyperreal-orchestrator'

// Avatares exatos da galeria Vidnoz com imagens reais geradas
const VIDNOZ_AVATARS = [
  {
    id: 'woman-professional-1',
    name: 'Sarah - Professional',
    thumbnail: 'https://cdn.abacus.ai/images/3ab73c63-4654-47aa-b42f-bd6b81eba137.png',
    gender: 'female',
    style: 'professional',
    ethnicity: 'caucasian'
  },
  {
    id: 'man-young-casual',
    name: 'Alex - Young Professional', 
    thumbnail: 'https://cdn.abacus.ai/images/8850dca7-bb25-4b4a-a3d1-c136efb9dd24.png',
    gender: 'male',
    style: 'casual',
    ethnicity: 'caucasian'
  },
  {
    id: 'woman-african-business',
    name: 'Maya - Business Executive',
    thumbnail: 'https://cdn.abacus.ai/images/d678942c-bc97-4024-b815-c5f88f8a81af.png',
    gender: 'female',
    style: 'business',
    ethnicity: 'afro'
  },
  {
    id: 'man-business-suit',
    name: 'Marcus - Corporate',
    thumbnail: 'https://cdn.abacus.ai/images/7fc8db7d-8b81-4376-a12c-9e2c0298e0d2.png',
    gender: 'male',
    style: 'corporate',
    ethnicity: 'mixed'
  },
  {
    id: 'woman-nature-casual',
    name: 'Emma - Nature Guide',
    thumbnail: 'https://cdn.abacus.ai/images/6a076f92-f9dc-417f-bc80-4fb1b3332d04.png',
    gender: 'female', 
    style: 'casual',
    ethnicity: 'caucasian'
  },
  {
    id: 'woman-beach-relaxed',
    name: 'Sophia - Beach Style',
    thumbnail: 'https://cdn.abacus.ai/images/06b7deb4-d7c6-4742-85d6-8c0544239a70.png',
    gender: 'female',
    style: 'casual',
    ethnicity: 'latino'
  },
  {
    id: 'baby-cute',
    name: 'Baby Lucas',
    thumbnail: 'https://cdn.abacus.ai/images/8686fcf2-8e35-4e56-86f6-b77ff474c146.png',
    gender: 'male',
    style: 'cute',
    ethnicity: 'caucasian'
  },
  {
    id: 'man-corporate-blonde',
    name: 'David - Executive',
    thumbnail: 'https://cdn.abacus.ai/images/7c593e57-3010-4576-966f-984276ce7072.png',
    gender: 'male',
    style: 'corporate', 
    ethnicity: 'caucasian'
  },
  {
    id: 'woman-friendly-smile',
    name: 'Lisa - Friendly',
    thumbnail: 'https://cdn.abacus.ai/images/b562b8a1-a5d7-4098-9f0f-6671a5174e17.png',
    gender: 'female',
    style: 'friendly',
    ethnicity: 'caucasian'
  },
  {
    id: 'cartoon-adventure',
    name: 'Adventure Girl',
    thumbnail: 'https://cdn.abacus.ai/images/a90cc811-fb32-47d0-a4eb-288ec8a39d52.png',
    gender: 'female',
    style: 'cartoon',
    ethnicity: 'animated'
  },
  {
    id: 'cartoon-boy-adventure',
    name: 'Adventure Boy',
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
  { id: 'humberto-neural', name: 'Humberto', gender: 'male', tone: 'maduro', region: 'RS' }
]

const VOICE_TONES = [
  { id: 'amigavel', name: 'Amigável', icon: '😊' },
  { id: 'profissional', name: 'Profissional', icon: '🎯' },
  { id: 'calorosa', name: 'Calorosa', icon: '🤗' },
  { id: 'energetica', name: 'Energética', icon: '⚡' },
  { id: 'calma', name: 'Calma', icon: '😌' }
]

interface VidnozTalkingPhotoProps {
  className?: string
}

export default function VidnozTalkingPhoto({ className }: VidnozTalkingPhotoProps) {
  // Estados principais
  const [selectedAvatar, setSelectedAvatar] = useState(VIDNOZ_AVATARS[0])
  const [inputText, setInputText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('francisca-neural')
  const [selectedTone, setSelectedTone] = useState('amigavel')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [previewMode, setPreviewMode] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  
  // Controles laterais
  const [backgroundEnabled, setBackgroundEnabled] = useState(true)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [motionEnabled, setMotionEnabled] = useState(true)
  const [styleEnabled, setStyleEnabled] = useState(true)
  const [cropEnabled, setCropEnabled] = useState(false)
  
  // Job do orquestrador
  const [currentJob, setCurrentJob] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Usar apenas vozes brasileiras
  const availableVoices = BRAZILIAN_VOICES

  // Função para gerar vídeo
  const handleGenerateVideo = async () => {
    if (!inputText.trim()) {
      alert('Por favor, digite o texto que o avatar deve falar')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      console.log('🎬 Iniciando geração REAL de talking photo')
      console.log(`📝 Texto: "${inputText.substring(0, 100)}..."`)
      console.log(`🎭 Avatar: ${selectedAvatar.name}`)
      console.log(`🗣️ Voz: ${selectedVoice}`)
      
      // Progresso realista para operações reais
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 8 + 2 // Progresso mais lento e realista
        })
      }, 1000)

      // Usar API REAL de geração com TTS e lip sync funcional
      const response = await fetch('/api/talking-photo/generate-production-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          avatarId: selectedAvatar.id,
          photoUrl: selectedAvatar.thumbnail,
          voiceSettings: {
            voice: selectedVoice,
            language: 'pt-BR',
            speed: 1.0,
            pitch: 0.0,
            emotion: selectedTone
          },
          videoOptions: {
            format: 'mp4',
            resolution: '1080p',
            fps: 30,
            background: backgroundEnabled ? 'enabled' : 'transparent',
            effects: motionEnabled ? [{
              type: 'fade_in',
              startTime: 0,
              duration: 500,
              intensity: 0.5
            }] : []
          },
          processingMode: 'sync' // Processamento síncrono para demonstração imediata
        })
      })

      const result = await response.json()
      
      clearInterval(progressInterval)
      setGenerationProgress(100)
      setIsGenerating(false)

      if (result.success) {
        console.log('✅ Talking Photo REAL concluído!')
        console.log('📊 Dados REAIS:', result.data)
        console.log('🎵 Áudio URL:', result.data.audioUrl)
        console.log('🎬 Vídeo URL:', result.data.videoUrl)
        console.log('🔧 TTS Provider:', result.data.processing.ttsProvider)
        console.log('⚡ Qualidade TTS:', result.data.processing.ttsQuality)
        console.log('👄 Lip Sync Accuracy:', result.data.processing.lipSyncAccuracy)
        
        // Testar reprodução REAL do áudio
        try {
          const audio = new Audio(result.data.audioUrl)
          await audio.play()
          console.log('✅ Áudio REAL reproduzindo!')
        } catch (audioErr) {
          console.warn('⚠️ Erro ao reproduzir áudio:', audioErr)
        }
        
        // Modal de sucesso com dados REAIS
        alert(`🎉 TALKING PHOTO REAL - FUNCIONAL COMPLETO!

📊 ESTATÍSTICAS REAIS:
• ⏱️ Duração: ${Math.round(result.data.duration/1000)}s
• 🚀 Processamento: ${Math.round(result.data.processing.totalTime/1000)}s
• 🎭 Avatar: ${selectedAvatar.name}
• 🗣️ Voz: ${selectedVoice}
• 📹 Resolução: ${result.data.technical.videoData.resolution}
• 🔧 TTS: ${result.data.processing.ttsProvider.toUpperCase()}
• 🎤 Qualidade: ${result.data.processing.ttsQuality.toUpperCase()}

✅ FUNCIONALIDADES REAIS ATIVAS:
• 🎵 Áudio Reproduzível: ${result.data.realFeatures.audioPlayable ? 'SIM' : 'NÃO'}
• 👄 Lip Sync Funcional: ${result.data.realFeatures.lipSyncFunctional ? 'SIM' : 'NÃO'}
• 🗣️ Síntese de Voz: ${result.data.realFeatures.voiceSynthesis}
• 🎬 Geração de Vídeo: ${result.data.realFeatures.videoGeneration}
• 😊 Animação Facial: ${result.data.realFeatures.facialAnimation ? 'SIM' : 'NÃO'}
• 📈 Score de Qualidade: ${(result.data.realFeatures.qualityScore * 100).toFixed(1)}%

🔗 ARQUIVOS:
• 🎵 Áudio: ${result.data.audioUrl}
• 🎬 Vídeo: ${result.data.videoUrl}
• 🖼️ Thumbnail: ${result.data.thumbnailUrl}

O TALKING PHOTO AGORA REALMENTE FUNCIONA!`)
        
      } else {
        throw new Error(result.error || 'Falha na geração do talking photo real')
      }

    } catch (error: unknown) {
      console.error('❌ Erro na geração:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      alert(`❌ Erro na geração do talking photo:

${errorMessage}

Tente novamente. Se o problema persistir, verifique se o texto não é muito longo (máx. 3000 caracteres).`)
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  // Função de preview
  const handlePreview = () => {
    if (!inputText.trim()) {
      alert('Por favor, digite o texto para visualizar')
      return
    }
    
    setPreviewMode(true)
    // Simular preview rápido
    setTimeout(() => {
      setPreviewMode(false)
    }, 3000)
  }

  // Upload de imagem personalizada
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
          name: 'Custom Upload',
          thumbnail: e.target?.result as string,
          gender: 'neutral' as const,
          style: 'custom' as const,
          ethnicity: 'custom' as const
        }
        setSelectedAvatar(customAvatar)
        setShowUploadDialog(false)
      }
      reader.readAsDataURL(file)
    }
  }

  // Funcionalidade de clonagem de voz
  const handleCloneVoice = () => {
    alert('🎤 Funcionalidade de Clonagem de Voz\n\nEsta é uma funcionalidade premium que permite:\n\n• Gravar sua própria voz\n• Treinar IA para replicar seu tom\n• Usar sua voz clonada em qualquer idioma\n• Qualidade profissional de síntese\n\nEm breve disponível na versão PRO!')
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${className}`}>
      {/* Header */}
      <div className="text-center py-8 px-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 text-base font-semibold rounded-full">
            AI Talking Photo
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-base font-medium">
            🇧🇷 Português Brasil
          </Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 bg-clip-text text-transparent mb-4">
          Vidnoz AI Talking Photo - Dê Vida às suas Fotos
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-4">
          Transforme suas fotos em avatares falantes realistas gratuitamente. Faça upload ou selecione uma foto, digite o texto e crie um talking photo com IA em português brasileiro com vozes autênticas regionais.
        </p>
        
        <div className="flex justify-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            onClick={() => window.open('/talking-photo-pro', '_blank')}
          >
            <Crown className="w-5 h-5 mr-2" />
            Experimente a Versão PRO
          </Button>
        </div>
      </div>

      {/* Interface Principal */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LADO ESQUERDO - Preview do Avatar */}
          <div className="space-y-4">
            <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700">
              <CardContent className="p-0 relative aspect-[4/5]">
                {/* Avatar Preview */}
                <div className="relative w-full h-full">
                  <Image
                    src={selectedAvatar.thumbnail}
                    alt={selectedAvatar.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  
                  {/* Botão Play Central */}
                  {!previewMode && !isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg" 
                        className="w-16 h-16 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-2xl border-4 border-white/50"
                        onClick={handlePreview}
                      >
                        <Play className="w-8 h-8 fill-current" />
                      </Button>
                    </div>
                  )}

                  {/* Modo Preview */}
                  {previewMode && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                        <p className="text-lg font-medium">Gerando Preview...</p>
                      </div>
                    </div>
                  )}

                  {/* Progresso de Geração */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
                      <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
                        <div className="space-y-2">
                          <p className="text-xl font-semibold">Gerando Vídeo...</p>
                          <Progress value={generationProgress} className="w-64 h-2" />
                          <p className="text-sm text-gray-300">{Math.round(generationProgress)}% Concluído</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controles Laterais */}
                  <div className="absolute right-4 top-4 space-y-2">
                    {/* Background */}
                    <Button
                      variant={backgroundEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-12 h-12 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30"
                      onClick={() => setBackgroundEnabled(!backgroundEnabled)}
                    >
                      <div className="text-center">
                        <ImageIcon className="w-4 h-4 mb-1" />
                        <span className="text-xs">BG</span>
                      </div>
                    </Button>

                    {/* Subtitles */}
                    <Button
                      variant={subtitlesEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-12 h-12 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30"
                      onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                    >
                      <div className="text-center">
                        <Subtitles className="w-4 h-4 mb-1" />
                        <span className="text-xs">CC</span>
                      </div>
                    </Button>

                    {/* Motion */}
                    <Button
                      variant={motionEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-12 h-12 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30"
                      onClick={() => setMotionEnabled(!motionEnabled)}
                    >
                      <div className="text-center">
                        <Settings className="w-4 h-4 mb-1" />
                        <span className="text-xs">Motion</span>
                      </div>
                    </Button>

                    {/* Style HOT */}
                    <Button
                      variant={styleEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-12 h-12 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30 relative"
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

                    {/* Crop */}
                    <Button
                      variant={cropEnabled ? "default" : "outline"}
                      size="sm"
                      className="w-12 h-12 rounded-lg bg-black/50 hover:bg-black/70 border border-white/30"
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
            
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              View the full animated version after exporting the generated avatar video.
            </p>
          </div>

          {/* LADO DIREITO - Controles */}
          <div className="space-y-6">
            
            {/* PASSO 1 - Escolher Avatar */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-semibold">Escolha um avatar</h3>
                </div>

                {/* Galeria de Avatares */}
                <div className="grid grid-cols-6 gap-3 mb-4">
                  {/* Upload Button */}
                  <button
                    className="aspect-square rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
                    onClick={handleUpload}
                  >
                    <div className="text-center">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs font-medium">Upload</span>
                    </div>
                  </button>

                  {/* Avatar Grid */}
                  {VIDNOZ_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      className={`aspect-square rounded-full overflow-hidden border-3 transition-all hover:scale-105 ${
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <h3 className="text-xl font-semibold">Digite o texto para fala</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-purple-600 hover:text-purple-700"
                    onClick={handleCloneVoice}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Clonar minha voz
                  </Button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Embrace the AI revolution, drive your creativity with Vidnoz cutting-edge AI tools.
                </p>

                {/* Textarea */}
                <div className="relative mb-4">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter the text you want the avatar to speak..."
                    className="min-h-24 resize-none pr-16"
                    maxLength={300}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {inputText.length}/300
                  </div>
                </div>

                {/* Controles de Voz Brasileira */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Voz */}
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Voz Brasileira</label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4" />
                              <span>{voice.name}</span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                {voice.region}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tom */}
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Tom de Voz</label>
                    <Select value={selectedTone} onValueChange={setSelectedTone}>
                      <SelectTrigger className="h-12">
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

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePreview}
                    disabled={!inputText.trim() || isGenerating}
                    className="h-14"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Visualizar
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleGenerateVideo}
                    disabled={!inputText.trim() || isGenerating}
                    className="h-14 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Gerar Vídeo
                      </>
                    )}
                  </Button>
                </div>

                {/* Recursos PRO */}
                <div className="flex justify-between mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      PRO
                    </Badge>
                    <span className="text-gray-600 dark:text-gray-400">Remove watermark</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      PRO  
                    </Badge>
                    <span className="text-gray-600 dark:text-gray-400">Unlock voice limits</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
