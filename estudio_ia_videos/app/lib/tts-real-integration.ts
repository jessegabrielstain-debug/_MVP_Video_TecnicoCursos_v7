import { randomUUID } from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getServiceRoleClient } from '@/lib/supabase/service'
import { generateTTSAudio, listVoices as listElevenLabsVoices } from '@/lib/services/tts/elevenlabs-service'

type TTSProvider = 'elevenlabs' | 'azure'

export interface VoiceConfig {
  provider: TTSProvider
  voiceId: string
  language?: string
  stability?: number
  similarityBoost?: number
  style?: string
  speed?: number
  pitch?: number
  modelId?: string
}

interface GenerateAudioParams {
  text: string
  voice: VoiceConfig
  outputFormat?: 'mp3' | 'wav'
  destinationPath?: string
}

interface AudioGenerationResult {
  audioUrl: string
  duration: number
  provider: TTSProvider
  metadata?: Record<string, unknown>
}

interface VoiceInfo {
  id: string
  name: string
  language: string
  gender?: string
  provider: TTSProvider
}

export interface AudioTimelineEntry {
  slideId: string
  slideNumber: number
  title: string
  audioUrl: string | null
  duration: number
  startsAt: number
  provider: TTSProvider
  status: 'completed' | 'failed'
  error?: string
}

export interface ProjectTTSResult {
  success: boolean
  audioTimeline?: AudioTimelineEntry[]
  totalDuration?: number
  projectAudioUrl?: string | null
  error?: string
}

const AUDIO_BUCKET = 'assets'
const DEFAULT_MODEL = 'eleven_multilingual_v2'
const DEFAULT_ELEVENLABS_VOICE = '21m00Tcm4TlvDq8ikWAM'
const AZURE_VOICE_CACHE_TTL = 5 * 60 * 1000

const sanitizePathSegment = (value?: string) => (value || 'segment').replace(/[^a-zA-Z0-9-_]/g, '_')

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: {
    language?: string;
    gender?: string;
  };
}

interface AzureVoice {
  ShortName?: string;
  VoiceId?: string;
  DisplayName?: string;
  LocalName?: string;
  Locale?: string;
  Language?: string;
  Gender?: string;
}

class RealTTSIntegration {
  private azureVoiceCache: { data: VoiceInfo[]; expiresAt: number } | null = null

  async generateElevenLabsAudio(params: GenerateAudioParams): Promise<AudioGenerationResult> {
    if (!params.text?.trim()) {
      throw new Error('Texto para TTS é obrigatório')
    }

    const voiceId = params.voice.voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_ELEVENLABS_VOICE
    const modelId = params.voice.modelId || DEFAULT_MODEL
    const audioBuffer = await generateTTSAudio(params.text.trim(), voiceId, modelId)
    const storagePath = params.destinationPath ?? this.buildStoragePath('elevenlabs')
    const audioUrl = await this.uploadAudioBuffer(audioBuffer, storagePath)

    return {
      audioUrl,
      duration: this.estimateDuration(params.text, params.voice.speed),
      provider: 'elevenlabs',
      metadata: {
        voiceId,
        modelId,
        stability: params.voice.stability,
        similarityBoost: params.voice.similarityBoost,
      },
    }
  }

  async generateAzureAudio(params: GenerateAudioParams): Promise<AudioGenerationResult> {
    if (!params.text?.trim()) {
      throw new Error('Texto para TTS é obrigatório')
    }

    const apiKey = process.env.AZURE_SPEECH_KEY || process.env.AZURE_TTS_KEY
    const region = process.env.AZURE_SPEECH_REGION || process.env.AZURE_TTS_REGION

    if (!apiKey || !region) {
      throw new Error('Credenciais do Azure Speech não configuradas')
    }

    const voiceName = params.voice.voiceId || 'pt-BR-FranciscaNeural'
    const language = params.voice.language || 'pt-BR'
    const rate = this.normalizeRate(params.voice.speed)
    const pitch = this.normalizePitch(params.voice.pitch)
    const ssml = this.buildSsml({ text: params.text, language, voiceName, rate, pitch, style: params.voice.style })

    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': params.outputFormat === 'wav'
          ? 'riff-16khz-16bit-mono-pcm'
          : 'audio-24khz-160kbitrate-mono-mp3',
      },
      body: ssml,
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(`Azure TTS error ${response.status}: ${details}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)
    const extension = params.outputFormat === 'wav' ? 'wav' : 'mp3'
    const storagePath = params.destinationPath ?? this.buildStoragePath('azure', undefined, undefined, undefined, extension)
    const contentType = extension === 'wav' ? 'audio/wav' : 'audio/mpeg'
    const audioUrl = await this.uploadAudioBuffer(audioBuffer, storagePath, contentType)

    return {
      audioUrl,
      duration: this.estimateDuration(params.text, params.voice.speed),
      provider: 'azure',
      metadata: {
        voiceId: voiceName,
        language,
        style: params.voice.style,
        rate,
        pitch,
      },
    }
  }

  async getAvailableVoices(provider: TTSProvider): Promise<VoiceInfo[]> {
    if (provider === 'elevenlabs') {
      try {
        const voices = await listElevenLabsVoices()
        return (voices as unknown as ElevenLabsVoice[]).map((voice) => ({
          id: voice.voice_id,
          name: voice.name,
          language: voice?.labels?.language || 'unknown',
          gender: voice?.labels?.gender,
          provider: 'elevenlabs',
        }))
      } catch (error) {
        logger.warn('Falha ao listar vozes ElevenLabs, usando fallback', { error })
        return this.elevenLabsFallback()
      }
    }

    const cachedVoices = this.azureVoiceCache
    if (cachedVoices && cachedVoices.expiresAt > Date.now()) {
      return cachedVoices.data
    }

    try {
      const voices = await this.fetchAzureVoices()
      this.azureVoiceCache = { data: voices, expiresAt: Date.now() + AZURE_VOICE_CACHE_TTL }
      return voices
    } catch (error) {
      logger.warn('Falha ao listar vozes Azure, usando fallback', { error })
      return this.azureFallback()
    }
  }

  private async uploadAudioBuffer(buffer: Buffer, filePath: string, contentType = 'audio/mpeg'): Promise<string> {
    try {
      const supabase = getServiceRoleClient()
      const { error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(filePath, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType,
        })

      if (error) {
        throw error
      }

      const { data: publicUrl } = supabase.storage
        .from(AUDIO_BUCKET)
        .getPublicUrl(filePath)

      return publicUrl.publicUrl
    } catch (error) {
      logger.warn('Falha ao salvar áudio no Storage, retornando base64 inline', { error })
      return `data:${contentType};base64,${buffer.toString('base64')}`
    }
  }

  private async fetchAzureVoices(): Promise<VoiceInfo[]> {
    const apiKey = process.env.AZURE_SPEECH_KEY || process.env.AZURE_TTS_KEY
    const region = process.env.AZURE_SPEECH_REGION || process.env.AZURE_TTS_REGION

    if (!apiKey || !region) {
      throw new Error('Credenciais Azure ausentes para listar vozes')
    }

    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(`Azure voices error ${response.status}: ${details}`)
    }

    const voices = await response.json()
    return (voices as AzureVoice[]).map((voice) => ({
      id: voice.ShortName || voice.VoiceId || '',
      name: voice.DisplayName || voice.LocalName || '',
      language: voice.Locale || voice.Language || '',
      gender: voice.Gender,
      provider: 'azure',
    }))
  }

  private estimateDuration(text: string, speed = 1): number {
    const clean = text.trim()
    if (!clean) {
      return 0
    }

    const words = clean.split(/\s+/).length
    const baseRate = 160
    const effectiveSpeed = speed > 0 ? speed : 1
    const seconds = (words / baseRate) * 60 * (1 / effectiveSpeed)
    return Number(seconds.toFixed(2))
  }

  private normalizeRate(speed?: number): string {
    if (!speed || speed === 1) {
      return '1.0'
    }

    return speed.toFixed(2)
  }

  private normalizePitch(pitch?: number): string {
    if (!pitch) {
      return '0%'
    }

    const clamped = Math.max(-20, Math.min(20, pitch))
    const sign = clamped > 0 ? '+' : ''
    return `${sign}${clamped}%`
  }

  private buildSsml({
    text,
    language,
    voiceName,
    rate,
    pitch,
    style,
  }: {
    text: string
    language: string
    voiceName: string
    rate: string
    pitch: string
    style?: string
  }): string {
    const escaped = this.escapeSsml(text)
    const expressWrapperStart = style ? `<mstts:express-as style="${style}">` : ''
    const expressWrapperEnd = style ? '</mstts:express-as>' : ''

    return `
      <speak version="1.0" xml:lang="${language}" xmlns:mstts="https://www.w3.org/2001/mstts">
        <voice name="${voiceName}">
          ${expressWrapperStart}
            <prosody rate="${rate}" pitch="${pitch}">
              ${escaped}
            </prosody>
          ${expressWrapperEnd}
        </voice>
      </speak>
    `
  }

  private escapeSsml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/\s+/g, ' ')
  }

  private buildStoragePath(
    provider: TTSProvider,
    projectId?: string,
    slideId?: string,
    voiceId?: string,
    extension: 'mp3' | 'wav' = 'mp3',
  ): string {
    const safeVoice = sanitizePathSegment(voiceId || provider)
    if (projectId && slideId) {
      return `audio/tts/projects/${projectId}/${slideId}-${safeVoice}-${Date.now()}.${extension}`
    }

    return `audio/tts/${provider}/${randomUUID()}.${extension}`
  }

  private elevenLabsFallback(): VoiceInfo[] {
    return [
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', language: 'en-US', gender: 'female', provider: 'elevenlabs' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', language: 'en-US', gender: 'female', provider: 'elevenlabs' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', language: 'en-US', gender: 'female', provider: 'elevenlabs' },
    ]
  }

  private azureFallback(): VoiceInfo[] {
    return [
      { id: 'pt-BR-FranciscaNeural', name: 'Francisca', language: 'pt-BR', gender: 'female', provider: 'azure' },
      { id: 'pt-BR-AntonioNeural', name: 'Antonio', language: 'pt-BR', gender: 'male', provider: 'azure' },
      { id: 'en-US-JennyNeural', name: 'Jenny', language: 'en-US', gender: 'female', provider: 'azure' },
      { id: 'en-US-GuyNeural', name: 'Guy', language: 'en-US', gender: 'male', provider: 'azure' },
    ]
  }

}

export const ttsIntegration = new RealTTSIntegration()

export async function generateProjectTTS(projectId: string, voice: VoiceConfig): Promise<ProjectTTSResult> {
  if (!voice?.provider || !voice.voiceId) {
    return { success: false, error: 'Configurações de voz inválidas' }
  }

  if (!['elevenlabs', 'azure'].includes(voice.provider)) {
    return { success: false, error: `Provider não suportado: ${voice.provider}` }
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            orderIndex: true,
            content: true,
            audioConfig: true,
          },
        },
      },
    })

    if (!project) {
      return { success: false, error: 'Projeto não encontrado' }
    }

    if (!project.slides.length) {
      return { success: false, error: 'Projeto não possui slides processados' }
    }

    const slidesToProcess = project.slides.filter((slide) => (slide.content)?.trim())

    if (!slidesToProcess.length) {
      return { success: false, error: 'Nenhum slide possui conteúdo para gerar TTS' }
    }

    const audioTimeline: AudioTimelineEntry[] = []
    let totalDuration = 0

    for (const slide of slidesToProcess) {
      const text = (slide.content || '').trim()
      if (!text) {
        continue
      }

      try {
        const destinationPath = `audio/tts/projects/${projectId}/${slide.id}-${sanitizePathSegment(voice.voiceId)}.mp3`
        const audioResult = voice.provider === 'elevenlabs'
          ? await ttsIntegration.generateElevenLabsAudio({ text, voice, destinationPath })
          : await ttsIntegration.generateAzureAudio({ text, voice, destinationPath })

        audioTimeline.push({
          slideId: slide.id,
          slideNumber: slide.orderIndex,
          title: slide.title || `Slide ${slide.orderIndex}`,
          audioUrl: audioResult.audioUrl,
          duration: audioResult.duration,
          startsAt: Number(totalDuration.toFixed(2)),
          provider: voice.provider,
          status: 'completed',
        })

        totalDuration += audioResult.duration

        const currentAudioConfig = (slide.audioConfig as Record<string, unknown>) || {}

        await prisma.slide.update({
          where: { id: slide.id },
          data: {
            audioConfig: {
              ...currentAudioConfig,
              audioUrl: audioResult.audioUrl,
              ttsGenerated: true,
              lastGeneratedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          },
        })
      } catch (slideError) {
        logger.error('Falha ao gerar áudio para slide', slideError instanceof Error ? slideError : new Error(String(slideError)), {
          projectId,
          slideId: slide.id,
        })

        audioTimeline.push({
          slideId: slide.id,
          slideNumber: slide.orderIndex,
          title: slide.title || `Slide ${slide.orderIndex}`,
          audioUrl: null,
          duration: 0,
          startsAt: Number(totalDuration.toFixed(2)),
          provider: voice.provider,
          status: 'failed',
          error: slideError instanceof Error ? slideError.message : 'Erro desconhecido',
        })
      }
    }

    const projectAudioUrl = audioTimeline.length && audioTimeline.every((entry) => entry.audioUrl)
      ? audioTimeline[0]?.audioUrl || null
      : null

    const currentSettings = (project.settings as Record<string, unknown>) || {}
    const currentProcessingLog = (project.settings as { processingLog?: Record<string, unknown> })?.processingLog || {}

    const processingLog = {
      ...currentProcessingLog,
      audioTimeline,
      generatedAt: new Date().toISOString(),
      ttsProvider: voice.provider,
      voiceId: voice.voiceId,
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        settings: {
          ...currentSettings,
          ttsProvider: voice.provider,
          voiceId: voice.voiceId,
          audioUrl: projectAudioUrl ?? (currentSettings.audioUrl as string),
          processingLog,
        } as unknown as Prisma.InputJsonValue,
        duration: Math.round(totalDuration),
      },
    })

    return {
      success: true,
      audioTimeline,
      totalDuration: Number(totalDuration.toFixed(2)),
      projectAudioUrl,
    }
  } catch (error) {
    logger.error('Erro ao gerar TTS completo do projeto', error instanceof Error ? error : new Error(String(error)), { projectId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
