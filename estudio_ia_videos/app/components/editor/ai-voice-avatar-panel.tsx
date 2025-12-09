
/**
 * 🎙️ AI Voice & Avatar Panel
 * Painel para geração de voz e avatares com IA
 */

'use client'

import React, { useState } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Mic,
  User,
  Play,
  Pause,
  Square,
  Download,
  Settings,
  Sparkles,
  Volume2
} from 'lucide-react'

interface AIVoiceAvatarPanelProps {
  onContentGenerated: (content: { type: 'tts' | 'avatar'; data: any }) => void
  onAddToSlide: (content: { type: 'tts' | 'avatar'; data: any }, slideIndex: number) => void
}

export function AIVoiceAvatarPanel({ onContentGenerated, onAddToSlide }: AIVoiceAvatarPanelProps) {
  const [text, setText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('pt-BR-female-1')
  const [selectedAvatar, setSelectedAvatar] = useState('instructor-male')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  const voices = [
    { id: 'pt-BR-female-1', name: 'Ana (Feminina)', language: 'Português', premium: false },
    { id: 'pt-BR-male-1', name: 'Carlos (Masculino)', language: 'Português', premium: false },
    { id: 'pt-BR-female-2', name: 'Beatriz (Profissional)', language: 'Português', premium: true },
    { id: 'pt-BR-male-2', name: 'Eduardo (Corporativo)', language: 'Português', premium: true }
  ]

  const avatars = [
    { id: 'instructor-male', name: 'Instrutor Masculino', category: 'Profissional' },
    { id: 'instructor-female', name: 'Instrutora Feminina', category: 'Profissional' },
    { id: 'safety-engineer', name: 'Engenheiro de Segurança', category: 'Técnico' },
    { id: 'worker', name: 'Operador', category: 'Industrial' }
  ]

  const handleGenerateTTS = async () => {
    if (!text.trim()) return

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Simular geração (aqui seria a API real)
      await new Promise(resolve => setTimeout(resolve, 2000))

      clearInterval(progressInterval)
      setGenerationProgress(100)

      const generatedContent = {
        type: 'tts' as const,
        data: {
          text,
          voice: selectedVoice,
          audioUrl: `/api/tts/generated/${Date.now()}.mp3`,
          duration: Math.ceil(text.length * 0.1), // Estimativa
        }
      }

      onContentGenerated(generatedContent)

    } catch (error) {
      logger.error('Erro na geração TTS', error instanceof Error ? error : new Error(String(error)), { component: 'AIVoiceAvatarPanel' })
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleGenerateAvatar = async () => {
    if (!text.trim()) return

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 8, 85))
      }, 300)

      // Simular geração (aqui seria a API real)
      await new Promise(resolve => setTimeout(resolve, 3000))

      clearInterval(progressInterval)
      setGenerationProgress(100)

      const generatedContent = {
        type: 'avatar' as const,
        data: {
          text,
          avatar: selectedAvatar,
          voice: selectedVoice,
          videoUrl: `/api/avatar/generated/${Date.now()}.mp4`,
          duration: Math.ceil(text.length * 0.12), // Estimativa
        }
      }

      onContentGenerated(generatedContent)

    } catch (error) {
      logger.error('Erro na geração Avatar', error instanceof Error ? error : new Error(String(error)), { component: 'AIVoiceAvatarPanel' })
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="tts" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tts" className="flex items-center">
            <Mic className="w-4 h-4 mr-2" />
            TTS
          </TabsTrigger>
          <TabsTrigger value="avatar" className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            Avatar
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="tts" className="h-full">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {/* Text input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Texto para Narração</label>
                  <Textarea
                    placeholder="Digite o texto que será narrado..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {text.length} caracteres • ~{Math.ceil(text.length * 0.1)}s
                  </div>
                </div>

                {/* Voice selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Voz</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar voz" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center space-x-2">
                            <span>{voice.name}</span>
                            {voice.premium && (
                              <Badge variant="secondary" className="text-xs">Premium</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generation progress */}
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} />
                    <p className="text-sm text-center text-gray-600">
                      Gerando narração... {generationProgress}%
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateTTS}
                    disabled={!text.trim() || isGenerating}
                    className="flex-1"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Gerar TTS
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="avatar" className="h-full">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {/* Text input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Texto para Avatar</label>
                  <Textarea
                    placeholder="Digite o texto que o avatar falará..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {text.length} caracteres • ~{Math.ceil(text.length * 0.12)}s
                  </div>
                </div>

                {/* Avatar selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Avatar</label>
                  <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar avatar" />
                    </SelectTrigger>
                    <SelectContent>
                      {avatars.map((avatar) => (
                        <SelectItem key={avatar.id} value={avatar.id}>
                          <div className="flex items-center space-x-2">
                            <span>{avatar.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {avatar.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice for avatar */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Voz do Avatar</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar voz" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center space-x-2">
                            <span>{voice.name}</span>
                            {voice.premium && (
                              <Badge variant="secondary" className="text-xs">Premium</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generation progress */}
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} />
                    <p className="text-sm text-center text-gray-600">
                      Gerando avatar falante... {generationProgress}%
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateAvatar}
                    disabled={!text.trim() || isGenerating}
                    className="flex-1"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Avatar
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default AIVoiceAvatarPanel
