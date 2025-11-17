/**
 * 🎙️ TTS Manager - Multi-Provider com Fallback
 * Sistema unificado de Text-to-Speech
 * 
 * Features:
 * - Múltiplos providers (ElevenLabs, Azure)
 * - Fallback automático
 * - Cache de áudio
 * - Gestão de créditos
 * - Retry logic
 */

import { ElevenLabsProvider, TTSOptions as ElevenLabsTTSOptions, TTSResult } from './providers/elevenlabs'
import { AzureTTSProvider, AzureTTSOptions } from './providers/azure'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

export type TTSProvider = 'elevenlabs' | 'azure'

export interface TTSManagerConfig {
  elevenlabs?: {
    apiKey: string
    modelId?: string
  }
  azure?: {
    subscriptionKey: string
    region: string
  }
  supabase?: {
    url: string
    key: string
  }
  preferredProvider?: TTSProvider
  enableCache?: boolean
  enableFallback?: boolean
}

export interface GenerateTTSOptions {
  text: string
  voiceId: string
  provider?: TTSProvider
  cacheKey?: string
  metadata?: Record<string, unknown>
  // ElevenLabs specific
  stability?: number
  similarityBoost?: number
  // Azure specific
  rate?: string
  pitch?: string
}

export interface CachedAudio {
  id: string
  text: string
  provider: TTSProvider
  voiceId: string
  audioUrl: string
  characters: number
  duration?: number
  metadata?: Record<string, unknown>
  createdAt: Date
}

export class TTSManager {
  private providers: Map<TTSProvider, any> = new Map()
  private supabase: ReturnType<typeof createClient> | null = null
  private config: TTSManagerConfig
  private cache: Map<string, CachedAudio> = new Map()

  constructor(config: TTSManagerConfig) {
    this.config = {
      preferredProvider: 'elevenlabs',
      enableCache: true,
      enableFallback: true,
      ...config,
    }

    // Inicializar providers
    if (config.elevenlabs) {
      this.providers.set('elevenlabs', new ElevenLabsProvider(config.elevenlabs))
    }

    if (config.azure) {
      this.providers.set('azure', new AzureTTSProvider(config.azure))
    }

    // Inicializar Supabase para cache
    if (config.supabase) {
      this.supabase = createClient(config.supabase.url, config.supabase.key)
    }
  }

  /**
   * Gerar áudio com cache e fallback
   */
  async generateAudio(options: GenerateTTSOptions): Promise<TTSResult & { fromCache: boolean }> {
    const {
      text,
      voiceId,
      provider = this.config.preferredProvider,
      cacheKey,
      metadata = {},
    } = options

    // Verificar cache
    if (this.config.enableCache) {
      const cached = await this.getFromCache(text, voiceId, provider!)
      if (cached) {
        console.log('Audio served from cache')
        
        // Baixar áudio do storage
        const audioBuffer = await this.downloadAudio(cached.audioUrl)
        
        return {
          audio: audioBuffer,
          characters: cached.characters,
          duration: cached.duration,
          format: 'mp3',
          fromCache: true,
        }
      }
    }

    // Tentar gerar com provider preferido
    try {
      const result = await this.generateWithProvider(provider!, options)
      
      // Salvar no cache
      if (this.config.enableCache) {
        await this.saveToCache(text, voiceId, provider!, result, metadata)
      }

      return {
        ...result,
        fromCache: false,
      }
    } catch (error) {
      console.error(`Error with ${provider} provider:`, error)

      // Tentar fallback
      if (this.config.enableFallback) {
        const fallbackProvider = this.getFallbackProvider(provider!)
        
        if (fallbackProvider) {
          console.log(`Falling back to ${fallbackProvider}`)
          
          try {
            const result = await this.generateWithProvider(fallbackProvider, options)
            
            if (this.config.enableCache) {
              await this.saveToCache(text, voiceId, fallbackProvider, result, metadata)
            }

            return {
              ...result,
              fromCache: false,
            }
          } catch (fallbackError) {
            console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError)
            throw fallbackError
          }
        }
      }

      throw error
    }
  }

  /**
   * Gerar áudio com provider específico
   */
  private async generateWithProvider(
    provider: TTSProvider,
    options: GenerateTTSOptions
  ): Promise<TTSResult> {
    const providerInstance = this.providers.get(provider)
    
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not configured`)
    }

    if (provider === 'elevenlabs') {
      return await providerInstance.textToSpeech({
        text: options.text,
        voiceId: options.voiceId,
        stability: options.stability,
        similarityBoost: options.similarityBoost,
      } as ElevenLabsTTSOptions)
    } else if (provider === 'azure') {
      const audio = await providerInstance.textToSpeech({
        text: options.text,
        voice: options.voiceId,
        rate: options.rate,
        pitch: options.pitch,
      } as AzureTTSOptions)

      return {
        audio,
        characters: options.text.length,
        format: 'mp3',
      }
    }

    throw new Error(`Unknown provider: ${provider}`)
  }

  /**
   * Obter provider de fallback
   */
  private getFallbackProvider(currentProvider: TTSProvider): TTSProvider | null {
    const allProviders = Array.from(this.providers.keys())
    const otherProviders = allProviders.filter(p => p !== currentProvider)
    return otherProviders[0] || null
  }

  /**
   * Gerar cache key
   */
  private generateCacheKey(text: string, voiceId: string, provider: TTSProvider): string {
    const hash = createHash('sha256')
    hash.update(`${provider}:${voiceId}:${text}`)
    return hash.digest('hex')
  }

  /**
   * Buscar áudio no cache
   */
  private async getFromCache(
    text: string,
    voiceId: string,
    provider: TTSProvider
  ): Promise<CachedAudio | null> {
    if (!this.supabase) return null

    const cacheKey = this.generateCacheKey(text, voiceId, provider)

    // Verificar cache em memória
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Buscar no banco
    try {
      const { data, error } = await this.supabase
        .from('tts_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .single()

      if (error || !data) return null

      const cached: CachedAudio = {
        id: data.id,
        text: data.text,
        provider: data.provider,
        voiceId: data.voice_id,
        audioUrl: data.audio_url,
        characters: data.characters,
        duration: data.duration,
        metadata: data.metadata,
        createdAt: new Date(data.created_at),
      }

      // Salvar em memória
      this.cache.set(cacheKey, cached)

      return cached
    } catch (error) {
      console.error('Error fetching from cache:', error)
      return null
    }
  }

  /**
   * Salvar áudio no cache
   */
  private async saveToCache(
    text: string,
    voiceId: string,
    provider: TTSProvider,
    result: TTSResult,
    metadata: Record<string, unknown>
  ): Promise<void> {
    if (!this.supabase) return

    const cacheKey = this.generateCacheKey(text, voiceId, provider)

    try {
      // Upload áudio para storage
      const audioPath = `tts-cache/${provider}/${cacheKey}.mp3`
      
      const { error: uploadError } = await this.supabase.storage
        .from('audio')
        .upload(audioPath, result.audio, {
          contentType: 'audio/mpeg',
          upsert: true,
        })

      if (uploadError) {
        console.error('Error uploading audio:', uploadError)
        return
      }

      // Obter URL pública
      const { data: { publicUrl } } = this.supabase.storage
        .from('audio')
        .getPublicUrl(audioPath)

      // Salvar no banco
      const { error: dbError } = await this.supabase
        .from('tts_cache')
        .upsert({
          cache_key: cacheKey,
          text,
          provider,
          voice_id: voiceId,
          audio_url: publicUrl,
          characters: result.characters,
          duration: result.duration,
          metadata,
        })

      if (dbError) {
        console.error('Error saving to cache:', dbError)
      }
    } catch (error) {
      console.error('Error in saveToCache:', error)
    }
  }

  /**
   * Baixar áudio do storage
   */
  private async downloadAudio(url: string): Promise<Buffer> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Listar vozes disponíveis
   */
  async getVoices(provider?: TTSProvider) {
    const targetProvider = provider || this.config.preferredProvider!
    const providerInstance = this.providers.get(targetProvider)

    if (!providerInstance) {
      throw new Error(`Provider ${targetProvider} not configured`)
    }

    return await providerInstance.getVoices()
  }

  /**
   * Obter informações de uso (créditos)
   */
  async getUsageInfo(provider?: TTSProvider) {
    const targetProvider = provider || this.config.preferredProvider!
    const providerInstance = this.providers.get(targetProvider)

    if (!providerInstance) {
      throw new Error(`Provider ${targetProvider} not configured`)
    }

    if (targetProvider === 'elevenlabs' && providerInstance.getSubscriptionInfo) {
      return await providerInstance.getSubscriptionInfo()
    }

    return null
  }

  /**
   * Limpar cache
   */
  clearMemoryCache() {
    this.cache.clear()
  }

  /**
   * Estimar custo
   */
  estimateCost(text: string): number {
    return text.length // caracteres
  }
}
