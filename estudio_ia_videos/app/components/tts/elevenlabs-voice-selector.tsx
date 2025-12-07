

'use client'

/**
 * ElevenLabs Voice Selector - Professional TTS
 * Select from 29+ premium voices with preview
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'react-hot-toast'
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Download, 
  Settings,
  Mic,
  Users,
  Globe,
  Zap,
  Loader2
} from 'lucide-react'

interface ElevenLabsVoice {
  id: string
  name: string
  category: string
  description: string
  gender: string
  age: string
  accent: string
  language: string
  useCase: string
  previewUrl?: string
  samples: number
}

interface VoiceSettings {
  stability: number
  similarityBoost: number
  style: number
  useSpeakerBoost: boolean
}

interface AudioData {
  success: boolean;
  audioBase64: string;
  error?: string;
  [key: string]: unknown;
}

interface ElevenLabsVoiceSelectorProps {
  onVoiceSelect?: (voice: ElevenLabsVoice) => void
  onAudioGenerate?: (audioData: AudioData) => void
  defaultText?: string
}

export function ElevenLabsVoiceSelector({ 
  onVoiceSelect, 
  onAudioGenerate,
  defaultText = "Olá! Este é um exemplo de como minha voz soará no seu projeto de treinamento em segurança do trabalho."
}: ElevenLabsVoiceSelectorProps) {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [playing, setPlaying] = useState<string | null>(null)
  const [testText, setTestText] = useState(defaultText)
  const [searchFilter, setSearchFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  // Voice settings
  const [settings, setSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarityBoost: 0.8,
    style: 0.0,
    useSpeakerBoost: true
  })
  
  // Load voices on mount
  useEffect(() => {
    loadVoices()
  }, [])
  
  const loadVoices = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/v1/tts/elevenlabs/voices')
      const data = await response.json()
      
      if (data.success) {
        setVoices(data.voices)
        toast.success(`✅ ${data.total} vozes carregadas!`)
      } else {
        throw new Error(data.error || 'Erro ao carregar vozes')
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('❌ Erro ao carregar vozes: ' + errorMessage)
      setVoices([])
    } finally {
      setLoading(false)
    }
  }
  
  const handleVoiceSelect = (voice: ElevenLabsVoice) => {
    setSelectedVoice(voice)
    onVoiceSelect?.(voice)
  }
  
  const generateTestAudio = async () => {
    if (!selectedVoice || !testText.trim()) {
      toast.error('Selecione uma voz e digite o texto')
      return
    }
    
    try {
      setGenerating(true)
      toast.loading('🎙️ Gerando áudio...', { id: 'tts' })
      
      const response = await fetch('/api/v1/tts/elevenlabs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId: selectedVoice.id,
          settings: {
            stability: settings.stability,
            similarityBoost: settings.similarityBoost,
            style: settings.style,
            useSpeakerBoost: settings.useSpeakerBoost
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('✅ Áudio gerado!', { id: 'tts' })
        
        // Play audio
        const audioBlob = new Blob([
          Uint8Array.from(atob(result.audioBase64), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' })
        
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.play()
        
        onAudioGenerate?.(result)
        
      } else {
        throw new Error(result.error || 'Erro na geração')
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('❌ Erro: ' + errorMessage, { id: 'tts' })
    } finally {
      setGenerating(false)
    }
  }
  
  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         voice.description.toLowerCase().includes(searchFilter.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || voice.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })
  
  const categories = [
    { value: 'all', label: 'Todas', count: voices.length },
    { value: 'premade', label: 'Padrão', count: voices.filter(v => v.category === 'premade').length },
    { value: 'cloned', label: 'Clonadas', count: voices.filter(v => v.category === 'cloned').length },
    { value: 'professional', label: 'Premium', count: voices.filter(v => v.category === 'professional').length }
  ]
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Voice Library */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="h-6 w-6" />
              <span>Biblioteca ElevenLabs</span>
              <Badge variant="secondary">{voices.length} vozes</Badge>
            </CardTitle>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <Input
                placeholder="Buscar vozes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="flex-1"
              />
              <div className="flex space-x-2">
                {categories.map(category => (
                  <Button
                    key={category.value}
                    variant={categoryFilter === category.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter(category.value)}
                  >
                    {category.label} ({category.count})
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Carregando vozes...</span>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredVoices.map(voice => (
                  <div
                    key={voice.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedVoice?.id === voice.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleVoiceSelect(voice)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{voice.name}</h4>
                        <p className="text-sm text-gray-600">{voice.description}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {voice.gender}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {voice.accent}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {voice.category}
                          </Badge>
                        </div>
                      </div>
                      
                      {voice.previewUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Play preview
                            const audio = new Audio(voice.previewUrl)
                            audio.play()
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredVoices.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma voz encontrada com os filtros selecionados
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Voice Controls */}
      <div className="space-y-4">
        {/* Selected Voice */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Voz Selecionada</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVoice ? (
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{selectedVoice.name}</h3>
                  <p className="text-sm text-gray-600">{selectedVoice.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Gênero: {selectedVoice.gender}</div>
                  <div>Idade: {selectedVoice.age}</div>
                  <div>Sotaque: {selectedVoice.accent}</div>
                  <div>Idioma: {selectedVoice.language}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Selecione uma voz
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Voice Settings */}
        {selectedVoice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Settings className="h-5 w-5 mr-2" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Estabilidade: {settings.stability}</label>
                <Slider
                  value={[settings.stability]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, stability: value[0] }))}
                  min={0}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Similaridade: {settings.similarityBoost}</label>
                <Slider
                  value={[settings.similarityBoost]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, similarityBoost: value[0] }))}
                  min={0}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Estilo: {settings.style}</label>
                <Slider
                  value={[settings.style]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, style: value[0] }))}
                  min={0}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Test Audio */}
        {selectedVoice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Mic className="h-5 w-5 mr-2" />
                Testar Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Digite o texto para testar a voz..."
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={3}
              />
              
              <Button
                onClick={generateTestAudio}
                disabled={generating || !testText.trim()}
                className="w-full"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {generating ? 'Gerando...' : 'Gerar Teste'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

