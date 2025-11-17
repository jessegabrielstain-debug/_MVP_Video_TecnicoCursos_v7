/**
 * 🖼️ Media Library Providers API
 * Manages media library provider configurations (Unsplash, Pexels, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { z } from 'zod'

// Validation schema
const MediaProviderSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['unsplash', 'pexels', 'pixabay', 'shutterstock']),
  enabled: z.boolean().default(true),
  config: z.object({
    api_key: z.string().optional(),
    endpoint: z.string().optional(),
    max_requests_per_hour: z.number().optional(),
    max_downloads_per_day: z.number().optional(),
    supported_formats: z.array(z.string()).optional(),
    max_resolution: z.string().optional(),
    commercial_use: z.boolean().optional()
  }).optional(),
  pricing: z.object({
    per_download: z.number().optional(),
    per_search: z.number().optional(),
    monthly_quota: z.number().optional(),
    premium_features: z.boolean().optional()
  }).optional()
})

// Default media providers configuration
const defaultProviders = [
  {
    id: 'unsplash-api',
    name: 'Unsplash',
    type: 'unsplash',
    enabled: false,
    config: {
      endpoint: 'https://api.unsplash.com/',
      max_requests_per_hour: 50,
      max_downloads_per_day: 50,
      supported_formats: ['jpg', 'webp'],
      max_resolution: '6000x4000',
      commercial_use: true
    },
    pricing: {
      per_download: 0,
      per_search: 0,
      monthly_quota: 50,
      premium_features: false
    }
  },
  {
    id: 'pexels-api',
    name: 'Pexels',
    type: 'pexels',
    enabled: false,
    config: {
      endpoint: 'https://api.pexels.com/v1/',
      max_requests_per_hour: 200,
      max_downloads_per_day: 200,
      supported_formats: ['jpg', 'webp'],
      max_resolution: '8000x6000',
      commercial_use: true
    },
    pricing: {
      per_download: 0,
      per_search: 0,
      monthly_quota: 200,
      premium_features: false
    }
  },
  {
    id: 'pixabay-api',
    name: 'Pixabay',
    type: 'pixabay',
    enabled: false,
    config: {
      endpoint: 'https://pixabay.com/api/',
      max_requests_per_hour: 100,
      max_downloads_per_day: 100,
      supported_formats: ['jpg', 'png', 'webp', 'svg'],
      max_resolution: '6000x4000',
      commercial_use: true
    },
    pricing: {
      per_download: 0,
      per_search: 0,
      monthly_quota: 100,
      premium_features: false
    }
  },
  {
    id: 'shutterstock-api',
    name: 'Shutterstock',
    type: 'shutterstock',
    enabled: false,
    config: {
      endpoint: 'https://api.shutterstock.com/v2/',
      max_requests_per_hour: 1000,
      max_downloads_per_day: 25,
      supported_formats: ['jpg', 'eps', 'ai', 'png'],
      max_resolution: '8000x6000',
      commercial_use: true
    },
    pricing: {
      per_download: 0.99,
      per_search: 0,
      monthly_quota: 25,
      premium_features: true
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

    // Get user's media provider configurations
    const { data: userProviders, error } = await supabaseAdmin
      .from('user_external_api_configs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('api_type', 'media')

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // If no user configurations exist, create default ones
    if (!userProviders || userProviders.length === 0) {
      const defaultConfigs = defaultProviders.map(provider => ({
        user_id: session.user.id,
        api_type: 'media',
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
        message: 'Default media providers created'
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
      message: 'Media providers retrieved successfully'
    })

  } catch (error) {
    console.error('Get media providers API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve media providers',
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
    const providerData = MediaProviderSchema.parse(body)

    // Generate provider ID
    const providerId = `${providerData.type}-${Date.now()}`

    // Create new media provider configuration
    const { data: newProvider, error } = await supabaseAdmin
      .from('user_external_api_configs')
      .insert({
        user_id: session.user.id,
        api_type: 'media',
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
          action: 'media_provider_created',
          metadata: {
            provider_id: providerId,
            provider_type: providerData.type,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      console.warn('Failed to log media provider creation:', analyticsError)
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
      message: 'Media provider created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create media provider API error:', error)
    
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
        error: 'Failed to create media provider',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}