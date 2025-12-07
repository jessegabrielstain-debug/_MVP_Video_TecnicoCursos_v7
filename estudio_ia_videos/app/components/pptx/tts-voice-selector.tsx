
/**
 * 🗣️ Seletor de Vozes TTS Brasileiras
 * Interface para configurar narração
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { Logger } from '@/lib/logger'
import { 
  Mic, 
  Play, 
  Pause, 
  Volume2, 
  Settings,
  User,
  Heart,
  Sparkles
} from 'lucide-react'

interface TTSVoice {
  name: string
  displayName: string
  gender: 'male' | 'female'
  quality: 'standard' | 'wavenet' | 'neural2'
  region: string
}

interface Props {
  onVoiceSelect?: (voice: string) => void
  onGenerateTTS?: (config: any) => void
  selectedSlideText?: string
}

export function TTSVoiceSelector({ onVoiceSelect, onGenerateTTS, selectedSlideText }: Props) {
  const [voices, setVoices] = useState<TTSVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState('pt-BR-Neural2-A')
  const [speed, setSpeed] = useState([1.0])
  const [pitch, setPitch] = useState([0])
  const [volume, setVolume] = useState([0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    loadVoices()
  }, [])

  const loadVoices = async () => {
    try {
      const response = await fetch('/api/v1/tts/generate')
      const data = await response.json()
      
      if (data.success) {
        setVoices(data.voices)
      }
    } catch (error) {
      const logger = new Logger('TTSVoiceSelector')
      logger.error('Error loading voices', error instanceof Error ? error : undefined)
      // Fallback para vozes mock
      setVoices([
        {
          name: 'pt-BR-Neural2-A',
          displayName: 'Ana Clara (Neural)',
          gender: 'female',
          quality: 'neural2',
          region: 'Brasil'
        },
        {
          name: 'pt-BR-Neural2-B',
          displayName: 'João Pedro (Neural)',
          gender: 'male',
          quality: 'neural2',
          region: 'Brasil'
        },
        {
          name: 'pt-BR-Wavenet-A',
          displayName: 'Camila (Wavenet)',
          gender: 'female',
          quality: 'wavenet',
          region: 'Brasil'
        },
        {
          name: 'pt-BR-Wavenet-B',
          displayName: 'Ricardo (Wavenet)',
          gender: 'male',
          quality: 'wavenet',
          region: 'Brasil'
        }
      ])
    }
  }

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName)
    onVoiceSelect?.(voiceName)
    toast.success(`🗣️ Voz "${voices.find(v => v.name === voiceName)?.displayName}" selecionada`)
  }

  const handleTestVoice = async () => {
    const testText = customText || selectedSlideText || 'Olá, este é um teste da voz selecionada para o Estúdio IA de Vídeos. Como você avalia a qualidade desta narração?'
    
    if (!testText.trim()) {
      toast.error('❌ Adicione texto para testar a voz')
      return
    }

    try {
      setIsPlaying(true)
      
      const response = await fetch('/api/v1/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: testText,
          voice: selectedVoice,
          speed: speed[0],
          pitch: pitch[0],
          volume: volume[0]
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('🎵 Reproduzindo preview da voz...')
        // Em produção, reproduzir o áudio real
        setTimeout(() => {
          setIsPlaying(false)
          toast.success('✅ Preview concluído')
        }, 3000)
      } else {
        setIsPlaying(false)
        toast.error(`❌ ${data.error}`)
      }

    } catch (error) {
      setIsPlaying(false)
      toast.error('❌ Erro ao testar voz')
    }
  }

  const handleGenerateForProject = () => {
    const config = {
      voice: selectedVoice,
      speed: speed[0],
      pitch: pitch[0],
      volume: volume[0],
      customText: customText || selectedSlideText
    }
    
    onGenerateTTS?.(config)
    toast.success('🎬 Configuração de TTS aplicada ao projeto')
  }

  const getVoiceIcon = (voice: TTSVoice) => {
    if (voice.gender === 'female') {
      return voice.quality === 'neural2' ? '👩‍💼' : '👩‍🏫'
    } else {
      return voice.quality === 'neural2' ? '👨‍💼' : '👨‍🏫'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mic className="h-5 w-5 mr-2 text-green-600" />
          Narração TTS Brasileira
          <Badge variant="outline" className="ml-2">
            Google Cloud
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Seletor de Voz */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Escolher Voz</label>
          <Select value={selectedVoice} onValueChange={handleVoiceChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voices.map(voice => (
                <SelectItem key={voice.name} value={voice.name}>
                  <div className="flex items-center">
                    <span className="mr-2">{getVoiceIcon(voice)}</span>
                    <span>{voice.displayName}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {voice.quality}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Controles de Ajuste */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Velocidade</label>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="text-xs text-gray-600 text-center">{speed[0]}x</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tom</label>
            <Slider
              value={pitch}
              onValueChange={setPitch}
              min={-10}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-gray-600 text-center">{pitch[0]}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Volume</label>
            <Slider
              value={volume}
              onValueChange={setVolume}
              min={-20}
              max={15}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-gray-600 text-center">{volume[0]}dB</div>
          </div>
        </div>

        {/* Texto de Teste */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Texto para Teste</label>
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={selectedSlideText || "Digite um texto para testar a voz selecionada..."}
            rows={3}
            maxLength={500}
            className="resize-none"
          />
          <div className="text-xs text-gray-600">
            {customText.length}/500 caracteres
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleTestVoice}
            variant="outline"
            disabled={isPlaying}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Reproduzindo...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Testar Voz
              </>
            )}
          </Button>

          <Button 
            onClick={handleGenerateForProject}
            className="bg-green-600 hover:bg-green-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Aplicar ao Projeto
          </Button>

          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>

        {/* Informações de Custo */}
        <div className="text-xs text-gray-600 bg-green-50 p-2 rounded">
          💰 <strong>Custo estimado:</strong> Neural2: $16/1M chars | Wavenet: $16/1M chars | Standard: $4/1M chars
        </div>
      </CardContent>
    </Card>
  )
}
