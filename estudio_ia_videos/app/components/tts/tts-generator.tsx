/**
 * 🎙️ TTS Generator Component
 * Componente completo para geração de narração TTS
 */

'use client'

import { useState } from 'react'
import { VoiceSelector } from './voice-selector'
import { Volume2, Wand2, Download, Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'

export interface TTSGeneratorProps {
  text: string
  projectId?: string
  slideId?: string
  onAudioGenerated?: (audioUrl: string, audioData: string) => void
  className?: string
}

export function TTSGenerator({
  text,
  projectId,
  slideId,
  onAudioGenerated,
  className = '',
}: TTSGeneratorProps) {
  const [provider, setProvider] = useState<'elevenlabs' | 'azure'>('elevenlabs')
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [stability, setStability] = useState(0.5)
  const [similarityBoost, setSimilarityBoost] = useState(0.75)
  const [rate, setRate] = useState('0%')
  const [pitch, setPitch] = useState('0%')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [credits, setCredits] = useState<{ used: number; limit: number } | null>(null)

  /**
   * Gerar áudio TTS
   */
  async function generateAudio() {
    if (!selectedVoice) {
      setError('Selecione uma voz primeiro')
      return
    }

    if (!text || text.trim().length === 0) {
      setError('Texto não pode estar vazio')
      return
    }

    try {
      setGenerating(true)
      setError(null)

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice,
          provider,
          stability: provider === 'elevenlabs' ? stability : undefined,
          similarityBoost: provider === 'elevenlabs' ? similarityBoost : undefined,
          rate: provider === 'azure' ? rate : undefined,
          pitch: provider === 'azure' ? pitch : undefined,
          projectId,
          slideId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate audio')
      }

      // Criar URL para o áudio
      const audioBlob = base64ToBlob(data.data.audio, 'audio/mpeg')
      const url = URL.createObjectURL(audioBlob)
      
      setAudioUrl(url)

      // Callback
      if (onAudioGenerated) {
        onAudioGenerated(data.data.audioUrl || url, data.data.audio)
      }

      // Atualizar créditos
      fetchCredits()

    } catch (err) {
      logger.error('Error generating audio', err instanceof Error ? err : new Error(String(err)), { component: 'TTSGenerator', provider })
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setGenerating(false)
    }
  }

  /**
   * Buscar créditos do usuário
   */
  async function fetchCredits() {
    try {
      const response = await fetch(`/api/tts/credits?provider=${provider}`)
      const data = await response.json()

      if (response.ok) {
        setCredits(data.data.user)
      }
    } catch (err) {
      logger.error('Error fetching credits', err instanceof Error ? err : new Error(String(err)), { component: 'TTSGenerator', provider })
    }
  }

  /**
   * Download do áudio
   */
  function downloadAudio() {
    if (!audioUrl) return

    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `narration-${Date.now()}.mp3`
    link.click()
  }

  const charactersCount = text.length
  const estimatedCost = charactersCount

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Provider TTS
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setProvider('elevenlabs')}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium transition-colors
              ${
                provider === 'elevenlabs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            ElevenLabs
          </button>
          <button
            onClick={() => setProvider('azure')}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium transition-colors
              ${
                provider === 'azure'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            Azure
          </button>
        </div>
      </div>

      {/* Voice Selector */}
      <VoiceSelector
        provider={provider}
        selectedVoice={selectedVoice}
        onVoiceSelect={setSelectedVoice}
      />

      {/* Voice Settings - ElevenLabs */}
      {provider === 'elevenlabs' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700">
            Configurações de Voz
          </h4>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Stability: {stability.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={stability}
              onChange={(e) => setStability(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maior = mais consistente, Menor = mais expressivo
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Similarity Boost: {similarityBoost.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={similarityBoost}
              onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maior = mais próximo da voz original
            </p>
          </div>
        </div>
      )}

      {/* Voice Settings - Azure */}
      {provider === 'azure' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700">
            Configurações de Voz
          </h4>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Taxa: {rate}
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={parseInt(rate)}
              onChange={(e) => setRate(`${e.target.value}%`)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Tom: {pitch}
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={parseInt(pitch)}
              onChange={(e) => setPitch(`${e.target.value}%`)}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
        <div>
          <p className="text-gray-600">Caracteres</p>
          <p className="text-lg font-semibold text-gray-900">{charactersCount}</p>
        </div>
        <div>
          <p className="text-gray-600">Custo Estimado</p>
          <p className="text-lg font-semibold text-gray-900">{estimatedCost} créditos</p>
        </div>
        {credits && (
          <>
            <div>
              <p className="text-gray-600">Créditos Usados</p>
              <p className="text-lg font-semibold text-gray-900">{credits.used}</p>
            </div>
            <div>
              <p className="text-gray-600">Créditos Restantes</p>
              <p className="text-lg font-semibold text-blue-600">
                {credits.limit - credits.used}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={generateAudio}
        disabled={generating || !selectedVoice}
        className="
          w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
          hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
          transition-colors flex items-center justify-center gap-2
        "
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Gerando Áudio...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Gerar Narração
          </>
        )}
      </button>

      {/* Audio Player */}
      {audioUrl && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Áudio Gerado com Sucesso!
              </span>
            </div>
            <button
              onClick={downloadAudio}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}
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
