/**
 * 🔊 TTS Providers API
 * Manages Text-to-Speech provider configurations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { z } from 'zod'

// Validation schema
const TTSProviderSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['azure', 'google', 'openai', 'elevenlabs']),
  enabled: z.boolean().default(true),
  config: z.object({
    api_key: z.string().optional(),
    region: z.string().optional(),
    endpoint: z.string().optional(),
    voice_models: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    max_characters: z.number().optional(),
    rate_limit: z.number().optional()
  }).optional(),
  pricing: z.object({
    per_character: z.number().optional(),
    per_request: z.number().optional(),
    monthly_quota: z.number().optional()
  }).optional()
})

// Default TTS providers configuration
const defaultProviders = [
  {
    id: 'azure-tts',
    name: 'Azure Cognitive Services',
    type: 'azure',
    enabled: false,
    config: {
      endpoint: 'https://eastus.tts.speech.microsoft.com/',
      voice_models: ['en-US-AriaNeural', 'en-US-JennyNeural', 'en-US-GuyNeural'],
      languages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR'],
      max_characters: 1000000,
      rate_limit: 20
    },
    pricing: {
      per_character: 0.000016,
      monthly_quota: 500000
    }
  },
  {
    id: 'google-tts',
    name: 'Google Cloud Text-to-Speech',
    type: 'google',
    enabled: false,
    config: {
      endpoint: 'https://texttospeech.googleapis.com/v1/',
      voice_models: ['en-US-Wavenet-D', 'en-US-Wavenet-F', 'en-US-Neural2-A'],
      languages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR'],
      max_characters: 1000000,
      rate_limit: 300
    },
    pricing: {
      per_character: 0.000016,
      monthly_quota: 1000000
    }
  },
  {
    id: 'openai-tts',
    name: 'OpenAI Text-to-Speech',
    type: 'openai',
    enabled: false,
    config: {
      endpoint: 'https://api.openai.com/v1/',
      voice_models: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
      languages: ['en-US'],
      max_characters: 4096,
      rate_limit: 50
    },
    pricing: {
      per_character: 0.000015,
      monthly_quota: 100000
    }
  },
  {
    id: 'elevenlabs-tts',
    name: 'ElevenLabs',
    type: 'elevenlabs',
    enabled: false,
    config: {
      endpoint: 'https://api.elevenlabs.io/v1/',
      voice_models: ['21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlld', 'EXAVITQu4vr4xnSDxMaL'],
      languages: ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
      max_characters: 10000,
      rate_limit: 10
    },
    pricing: {
      per_character: 0.00003,
      monthly_quota: 10000
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's TTS provider configurations
    const { data: userProviders, error } = await supabaseAdmin
      .from('user_external_api_configs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('api_type', 'tts')

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // If no user configurations exist, create default ones
    if (!userProviders || userProviders.length === 0) {
      const defaultConfigs = defaultProviders.map(provider => ({
        user_id: session.user.id,
        api_type: 'tts',
        provider_id: provider.id,
        provider_name: provider.name,
        provider_type: provider.type,
        enabled: provider.enabled,
        config: provider.config,
        pricing: provider.pricing,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data: createdConfigs, error: createError } = await supabaseAdmin
        .from('user_external_api_configs')
        .insert(defaultConfigs)
        .select()

      if (createError) throw createError

      // Transform to expected format
      const providers = createdConfigs.map(config => ({
        id: config.provider_id,
        name: config.provider_name,
        type: config.provider_type,
        enabled: config.enabled,
        config: config.config,
        pricing: config.pricing
      }))

      return NextResponse.json({
        success: true,
        data: providers,
        message: 'Default TTS providers created'
      })
    }

    // Transform existing configurations to expected format
    const providers = userProviders.map(config => ({
      id: config.provider_id,
      name: config.provider_name,
      type: config.provider_type,
      enabled: config.enabled,
      config: config.config,
      pricing: config.pricing
    }))

    return NextResponse.json({
      success: true,
      data: providers,
      message: 'TTS providers retrieved successfully'
    })

  } catch (error) {
    console.error('Get TTS providers API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve TTS providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
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
    const providerData = TTSProviderSchema.parse(body)

    // Generate provider ID
    const providerId = `${providerData.type}-${Date.now()}`

    // Create new TTS provider configuration
    const { data: newProvider, error } = await supabaseAdmin
      .from('user_external_api_configs')
      .insert({
        user_id: session.user.id,
        api_type: 'tts',
        provider_id: providerId,
        provider_name: providerData.name,
        provider_type: providerData.type,
        enabled: providerData.enabled,
        config: providerData.config || {},
        pricing: providerData.pricing || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Log the action for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          category: 'external_apis',
          action: 'tts_provider_created',
          metadata: {
            provider_id: providerId,
            provider_type: providerData.type,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      console.warn('Failed to log TTS provider creation:', analyticsError)
    }

    // Transform to expected format
    const provider = {
      id: newProvider.provider_id,
      name: newProvider.provider_name,
      type: newProvider.provider_type,
      enabled: newProvider.enabled,
      config: newProvider.config,
      pricing: newProvider.pricing
    }

    return NextResponse.json({
      success: true,
      data: provider,
      message: 'TTS provider created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create TTS provider API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid provider data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create TTS provider',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}