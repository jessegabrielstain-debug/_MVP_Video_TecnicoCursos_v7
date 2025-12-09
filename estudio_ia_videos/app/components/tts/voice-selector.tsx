/**
 * 🎙️ Voice Selector Component
 * Componente para seleção de voz TTS e preview de áudio
 */

'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Volume2, Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'

export interface Voice {
  voiceId: string
  name: string
  description?: string
  gender?: 'male' | 'female' | 'neutral'
  locale?: string
  previewUrl?: string
}

export interface VoiceSelectorProps {
  provider?: 'elevenlabs' | 'azure'
  selectedVoice?: string
  onVoiceSelect: (voiceId: string) => void
  className?: string
}

export function VoiceSelector({
  provider = 'elevenlabs',
  selectedVoice,
  onVoiceSelect,
  className = '',
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carregar vozes disponíveis
   */
  useEffect(() => {
    fetchVoices()
  }, [provider])

  /**
   * Cleanup audio on unmount
   */
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ''
      }
    }
  }, [audio])

  /**
   * Buscar vozes da API
   */
  async function fetchVoices() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tts/generate?provider=${provider}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch voices')
      }

      setVoices(data.data || [])

      // Selecionar primeira voz se nenhuma selecionada
      if (!selectedVoice && data.data.length > 0) {
        onVoiceSelect(data.data[0].voiceId)
      }
    } catch (err) {
      logger.error('Error fetching voices', err instanceof Error ? err : new Error(String(err)), { component: 'VoiceSelector' })
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Preview de voz
   */
  async function playVoicePreview(voice: Voice) {
    try {
      // Parar áudio anterior
      if (audio) {
        audio.pause()
      }

      // Se já está tocando esta voz, pausar
      if (playingVoice === voice.voiceId) {
        setPlayingVoice(null)
        return
      }

      setPlayingVoice(voice.voiceId)

      // Se tem URL de preview
      if (voice.previewUrl) {
        const newAudio = new Audio(voice.previewUrl)
        setAudio(newAudio)

        newAudio.onended = () => setPlayingVoice(null)
        newAudio.onerror = () => {
          setPlayingVoice(null)
          logger.error('Error playing voice preview', new Error('Audio playback failed'), { component: 'VoiceSelector', voiceId: voice.voiceId })
        }

        await newAudio.play()
      } else {
        // Gerar preview usando API
        const response = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Olá, esta é uma prévia desta voz.',
            voiceId: voice.voiceId,
            provider,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate preview')
        }

        // Criar áudio a partir do base64
        const audioBlob = base64ToBlob(data.data.audio, 'audio/mpeg')
        const audioUrl = URL.createObjectURL(audioBlob)
        
        const newAudio = new Audio(audioUrl)
        setAudio(newAudio)

        newAudio.onended = () => {
          setPlayingVoice(null)
          URL.revokeObjectURL(audioUrl)
        }
        
        newAudio.onerror = () => {
          setPlayingVoice(null)
          URL.revokeObjectURL(audioUrl)
        }

        await newAudio.play()
      }
    } catch (err) {
      logger.error('Error playing preview', err instanceof Error ? err : new Error(String(err)), { component: 'VoiceSelector' })
      setPlayingVoice(null)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Carregando vozes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-700">Erro ao carregar vozes: {error}</p>
        <button
          onClick={fetchVoices}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Selecione uma Voz
        </h3>
        <span className="text-xs text-gray-500">
          {voices.length} vozes disponíveis
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {voices.map((voice) => (
          <button
            key={voice.voiceId}
            onClick={() => onVoiceSelect(voice.voiceId)}
            className={`
              relative p-4 rounded-lg border-2 transition-all text-left
              ${
                selectedVoice === voice.voiceId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {voice.name}
                </h4>
                {voice.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {voice.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {voice.gender && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {voice.gender === 'male' ? '👨' : voice.gender === 'female' ? '👩' : '🧑'}{' '}
                      {voice.gender}
                    </span>
                  )}
                  {voice.locale && (
                    <span className="text-xs text-gray-500">
                      {voice.locale}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  playVoicePreview(voice)
                }}
                className="ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Preview voz"
              >
                {playingVoice === voice.voiceId ? (
                  <Pause className="w-5 h-5 text-blue-600" />
                ) : (
                  <Play className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Converter base64 para Blob
 */
function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: contentType })
}
