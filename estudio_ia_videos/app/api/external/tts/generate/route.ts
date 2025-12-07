/**
 * 🔊 TTS Generation API
 * Handles text-to-speech generation requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { z } from 'zod'

// Validation schema
const TTSGenerateSchema = z.object({
  text: z.string().min(1).max(10000),
  provider_id: z.string().min(1),
  voice_model: z.string().min(1),
  language: z.string().default('en-US'),
  speed: z.number().min(0.25).max(4.0).default(1.0),
  pitch: z.number().min(-20).max(20).default(0),
  volume: z.number().min(0).max(100).default(100),
  format: z.enum(['mp3', 'wav', 'ogg']).default('mp3'),
  quality: z.enum(['standard', 'premium']).default('standard')
})

type TTSParams = z.infer<typeof TTSGenerateSchema>

interface TTSProviderConfig {
  api_key?: string
  region?: string
  endpoint?: string
  max_characters?: number
  rate_limit?: number
  [key: string]: unknown
}

interface TTSProvider {
  provider_type: string
  config: TTSProviderConfig
  pricing?: {
    per_character?: number
    per_request?: number
  }
  provider_id: string
  provider_name: string
}

// TTS Provider implementations
class TTSProviderFactory {
  static async generateTTS(provider: TTSProvider, params: TTSParams): Promise<{ audio_url: string; duration: number; size: number }> {
    switch (provider.provider_type) {
      case 'azure':
        return await this.generateAzureTTS(provider, params)
      case 'google':
        return await this.generateGoogleTTS(provider, params)
      case 'openai':
        return await this.generateOpenAITTS(provider, params)
      case 'elevenlabs':
        return await this.generateElevenLabsTTS(provider, params)
      default:
        throw new Error(`Unsupported TTS provider: ${provider.provider_type}`)
    }
  }

  private static async generateAzureTTS(provider: TTSProvider, params: TTSParams) {
    // Azure TTS implementation
    const { api_key, region, endpoint } = provider.config
    
    if (!api_key) {
      throw new Error('Azure API key not configured')
    }

    // Create SSML
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${params.language}">
        <voice name="${params.voice_model}">
          <prosody rate="${params.speed}" pitch="${params.pitch > 0 ? '+' : ''}${params.pitch}Hz" volume="${params.volume}">
            ${params.text}
          </prosody>
        </voice>
      </speak>
    `

    const response = await fetch(`${endpoint}/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': api_key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': `audio-24khz-48kbitrate-mono-${params.format}`
      },
      body: ssml
    })

    if (!response.ok) {
      throw new Error(`Azure TTS API error: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    
    // In a real implementation, you would upload this to your storage service
    // For now, we'll simulate the response
    return {
      audio_url: `https://storage.example.com/tts/${Date.now()}.${params.format}`,
      duration: Math.ceil(params.text.length / 10), // Rough estimate
      size: audioBuffer.byteLength
    }
  }

  private static async generateGoogleTTS(provider: TTSProvider, params: TTSParams) {
    // Google TTS implementation
    const { api_key } = provider.config
    
    if (!api_key) {
      throw new Error('Google API key not configured')
    }

    const requestBody = {
      input: { text: params.text },
      voice: {
        languageCode: params.language,
        name: params.voice_model
      },
      audioConfig: {
        audioEncoding: params.format.toUpperCase(),
        speakingRate: params.speed,
        pitch: params.pitch,
        volumeGainDb: (params.volume - 100) / 10
      }
    }

    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Google TTS API error: ${response.statusText}`)
    }

    const result = await response.json()
    
    // In a real implementation, you would decode and upload the base64 audio
    return {
      audio_url: `https://storage.example.com/tts/${Date.now()}.${params.format}`,
      duration: Math.ceil(params.text.length / 10),
      size: Math.ceil(result.audioContent.length * 0.75) // Base64 to binary size estimate
    }
  }

  private static async generateOpenAITTS(provider: TTSProvider, params: TTSParams) {
    // OpenAI TTS implementation
    const { api_key } = provider.config
    
    if (!api_key) {
      throw new Error('OpenAI API key not configured')
    }

    const requestBody = {
      model: 'tts-1',
      input: params.text,
      voice: params.voice_model,
      response_format: params.format,
      speed: params.speed
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`OpenAI TTS API error: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    
    return {
      audio_url: `https://storage.example.com/tts/${Date.now()}.${params.format}`,
      duration: Math.ceil(params.text.length / 10),
      size: audioBuffer.byteLength
    }
  }

  private static async generateElevenLabsTTS(provider: TTSProvider, params: TTSParams) {
    // ElevenLabs TTS implementation
    const { api_key } = provider.config
    
    if (!api_key) {
      throw new Error('ElevenLabs API key not configured')
    }

    const requestBody = {
      text: params.text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true
      }
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${params.voice_model}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': api_key
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS API error: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    
    return {
      audio_url: `https://storage.example.com/tts/${Date.now()}.${params.format}`,
      duration: Math.ceil(params.text.length / 10),
      size: audioBuffer.byteLength
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const params = TTSGenerateSchema.parse(body)

    // Get provider configuration
    const { data: providerData, error: providerError } = await (supabaseAdmin as any)
      .from('user_external_api_configs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('api_type', 'tts')
      .eq('provider_id', params.provider_id)
      .eq('enabled', true)
      .single()

    const provider = providerData as TTSProvider

    if (providerError || !provider) {
      return NextResponse.json(
        { success: false, error: 'TTS provider not found or disabled' },
        { status: 404 }
      )
    }

    // Check rate limits and quotas
    const { data: usage, error: usageError } = await (supabaseAdmin as any)
      .from('external_api_usage')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('api_type', 'tts')
      .eq('provider_id', params.provider_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })

    if (usageError) {
      console.warn('Failed to check TTS usage:', usageError)
    }

    // Calculate current usage
    const dailyUsage = usage?.reduce((total: number, record: any) => total + (record.characters_used || 0), 0) || 0
    const dailyRequests = usage?.length || 0

    // Check limits
    const maxCharacters = provider.config?.max_characters || 10000
    const maxRequests = provider.config?.rate_limit || 10

    if (dailyUsage + params.text.length > maxCharacters) {
      return NextResponse.json(
        { success: false, error: 'Daily character limit exceeded' },
        { status: 429 }
      )
    }

    if (dailyRequests >= maxRequests) {
      return NextResponse.json(
        { success: false, error: 'Daily request limit exceeded' },
        { status: 429 }
      )
    }

    // Generate TTS
    const result = await TTSProviderFactory.generateTTS(provider, params)

    // Calculate cost
    const characterCost = (provider.pricing?.per_character || 0) * params.text.length
    const requestCost = provider.pricing?.per_request || 0
    const totalCost = characterCost + requestCost

    // Record usage
    try {
      await (supabaseAdmin as any)
        .from('external_api_usage')
        .insert({
          user_id: session.user.id,
          api_type: 'tts',
          provider_id: params.provider_id,
          characters_used: params.text.length,
          requests_made: 1,
          cost: totalCost,
          metadata: {
            voice_model: params.voice_model,
            language: params.language,
            format: params.format,
            duration: result.duration,
            file_size: result.size
          }
        })
    } catch (usageLogError) {
      console.warn('Failed to log TTS usage:', usageLogError)
    }

    // Log the action for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          category: 'external_apis',
          action: 'tts_generated',
          metadata: {
            provider_id: params.provider_id,
            provider_type: provider.provider_type,
            characters: params.text.length,
            duration: result.duration,
            cost: totalCost,
            timestamp: new Date().toISOString()
          } as any,
          created_at: new Date().toISOString()
        } as any)
    } catch (analyticsError) {
      console.warn('Failed to log TTS generation:', analyticsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        audio_url: result.audio_url,
        duration: result.duration,
        size: result.size,
        cost: totalCost,
        characters_used: params.text.length,
        provider: {
          id: provider.provider_id,
          name: provider.provider_name,
          type: provider.provider_type
        }
      },
      message: 'TTS generated successfully'
    })

  } catch (error) {
    console.error('TTS generation API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request parameters',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate TTS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
