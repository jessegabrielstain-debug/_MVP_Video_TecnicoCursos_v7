/**
 * 🔍 Media Search API
 * Handles media search across different providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { z } from 'zod'

// Validation schema
const MediaSearchSchema = z.object({
  query: z.string().min(1).max(200),
  provider_id: z.string().min(1),
  category: z.enum(['photo', 'illustration', 'vector']).default('photo'),
  orientation: z.enum(['all', 'horizontal', 'vertical', 'square']).default('all'),
  size: z.enum(['all', 'large', 'medium', 'small']).default('all'),
  color: z.enum(['all', 'grayscale', 'transparent', 'red', 'orange', 'yellow', 'green', 'turquoise', 'blue', 'lilac', 'pink', 'white', 'gray', 'black', 'brown']).default('all'),
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  safe_search: z.boolean().default(true)
})

// Media provider implementations
class MediaProviderFactory {
  static async searchMedia(provider: any, params: any): Promise<{ results: any[]; total: number; page: number; per_page: number }> {
    switch (provider.provider_type) {
      case 'unsplash':
        return await this.searchUnsplash(provider, params)
      case 'pexels':
        return await this.searchPexels(provider, params)
      case 'pixabay':
        return await this.searchPixabay(provider, params)
      case 'shutterstock':
        return await this.searchShutterstock(provider, params)
      default:
        throw new Error(`Unsupported media provider: ${provider.provider_type}`)
    }
  }

  private static async searchUnsplash(provider: any, params: any) {
    const { api_key } = provider.config
    
    if (!api_key) {
      throw new Error('Unsplash API key not configured')
    }

    const searchParams = new URLSearchParams({
      query: params.query,
      page: params.page.toString(),
      per_page: params.per_page.toString(),
      orientation: params.orientation === 'all' ? '' : params.orientation,
      color: params.color === 'all' ? '' : params.color,
      content_filter: params.safe_search ? 'high' : 'low'
    })

    const response = await fetch(`https://api.unsplash.com/search/photos?${searchParams}`, {
      headers: {
        'Authorization': `Client-ID ${api_key}`
      }
    })

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    const results = data.results.map((photo: any) => ({
      id: photo.id,
      title: photo.description || photo.alt_description || 'Untitled',
      description: photo.description,
      url: photo.urls.regular,
      thumbnail: photo.urls.thumb,
      width: photo.width,
      height: photo.height,
      author: {
        name: photo.user.name,
        username: photo.user.username,
        profile_url: photo.user.links.html
      },
      download_url: photo.links.download,
      tags: photo.tags?.map((tag: any) => tag.title) || [],
      license: 'Unsplash License',
      provider: 'unsplash'
    }))

    return {
      results,
      total: data.total,
      page: params.page,
      per_page: params.per_page
    }
  }

  private static async searchPexels(provider: any, params: any) {
    const { api_key } = provider.config
    
    if (!api_key) {
      throw new Error('Pexels API key not configured')
    }

    const searchParams = new URLSearchParams({
      query: params.query,
      page: params.page.toString(),
      per_page: params.per_page.toString(),
      orientation: params.orientation === 'all' ? '' : params.orientation,
      size: params.size === 'all' ? '' : params.size
    })

    const response = await fetch(`https://api.pexels.com/v1/search?${searchParams}`, {
      headers: {
        'Authorization': api_key
      }
    })

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    const results = data.photos.map((photo: any) => ({
      id: photo.id.toString(),
      title: photo.alt || 'Untitled',
      description: photo.alt,
      url: photo.src.large,
      thumbnail: photo.src.medium,
      width: photo.width,
      height: photo.height,
      author: {
        name: photo.photographer,
        username: photo.photographer,
        profile_url: photo.photographer_url
      },
      download_url: photo.src.original,
      tags: [],
      license: 'Pexels License',
      provider: 'pexels'
    }))

    return {
      results,
      total: data.total_results,
      page: params.page,
      per_page: params.per_page
    }
  }

  private static async searchPixabay(provider: any, params: any) {
    const { api_key } = provider.config
    
    if (!api_key) {
      throw new Error('Pixabay API key not configured')
    }

    const searchParams = new URLSearchParams({
      key: api_key,
      q: params.query,
      image_type: params.category,
      orientation: params.orientation === 'all' ? 'all' : params.orientation,
      category: 'all',
      min_width: '0',
      min_height: '0',
      colors: params.color === 'all' ? '' : params.color,
      safesearch: params.safe_search ? 'true' : 'false',
      page: params.page.toString(),
      per_page: params.per_page.toString()
    })

    const response = await fetch(`https://pixabay.com/api/?${searchParams}`)

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    const results = data.hits.map((image: any) => ({
      id: image.id.toString(),
      title: image.tags,
      description: image.tags,
      url: image.webformatURL,
      thumbnail: image.previewURL,
      width: image.imageWidth,
      height: image.imageHeight,
      author: {
        name: image.user,
        username: image.user,
        profile_url: `https://pixabay.com/users/${image.user}-${image.user_id}/`
      },
      download_url: image.fullHDURL || image.largeImageURL,
      tags: image.tags.split(', '),
      license: 'Pixabay License',
      provider: 'pixabay'
    }))

    return {
      results,
      total: data.totalHits,
      page: params.page,
      per_page: params.per_page
    }
  }

  private static async searchShutterstock(provider: any, params: any) {
    const { api_key } = provider.config
    
    if (!api_key) {
      throw new Error('Shutterstock API key not configured')
    }

    const searchParams = new URLSearchParams({
      query: params.query,
      page: params.page.toString(),
      per_page: params.per_page.toString(),
      orientation: params.orientation === 'all' ? '' : params.orientation,
      category: params.category,
      safe: params.safe_search ? 'true' : 'false'
    })

    const response = await fetch(`https://api.shutterstock.com/v2/images/search?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${api_key}`
      }
    })

    if (!response.ok) {
      throw new Error(`Shutterstock API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    const results = data.data.map((image: any) => ({
      id: image.id,
      title: image.description,
      description: image.description,
      url: image.assets.preview.url,
      thumbnail: image.assets.preview_1000.url,
      width: image.assets.preview.width,
      height: image.assets.preview.height,
      author: {
        name: image.contributor.display_name,
        username: image.contributor.display_name,
        profile_url: `https://www.shutterstock.com/g/${image.contributor.display_name}`
      },
      download_url: image.assets.huge_jpg?.url || image.assets.preview.url,
      tags: image.keywords,
      license: 'Shutterstock Standard License',
      provider: 'shutterstock'
    }))

    return {
      results,
      total: data.total_count,
      page: params.page,
      per_page: params.per_page
    }
  }
}

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = MediaSearchSchema.parse({
      query: searchParams.get('query'),
      provider_id: searchParams.get('provider_id'),
      category: searchParams.get('category') || 'photo',
      orientation: searchParams.get('orientation') || 'all',
      size: searchParams.get('size') || 'all',
      color: searchParams.get('color') || 'all',
      page: parseInt(searchParams.get('page') || '1'),
      per_page: parseInt(searchParams.get('per_page') || '20'),
      safe_search: searchParams.get('safe_search') !== 'false'
    })

    // Get provider configuration
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('user_external_api_configs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('api_type', 'media')
      .eq('provider_id', params.provider_id)
      .eq('enabled', true)
      .single()

    if (providerError || !provider) {
      return NextResponse.json(
        { success: false, error: 'Media provider not found or disabled' },
        { status: 404 }
      )
    }

    // Check rate limits
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('external_api_usage')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('api_type', 'media')
      .eq('provider_id', params.provider_id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false })

    if (usageError) {
      console.warn('Failed to check media usage:', usageError)
    }

    // Calculate current usage
    const hourlyRequests = usage?.length || 0
    const maxRequests = provider.config?.max_requests_per_hour || 50

    if (hourlyRequests >= maxRequests) {
      return NextResponse.json(
        { success: false, error: 'Hourly request limit exceeded' },
        { status: 429 }
      )
    }

    // Search media
    const result = await MediaProviderFactory.searchMedia(provider, params)

    // Calculate cost
    const searchCost = provider.pricing?.per_search || 0

    // Record usage
    try {
      await supabaseAdmin
        .from('external_api_usage')
        .insert({
          user_id: session.user.id,
          api_type: 'media',
          provider_id: params.provider_id,
          requests_made: 1,
          cost: searchCost,
          metadata: {
            query: params.query,
            category: params.category,
            results_count: result.results.length,
            total_results: result.total
          },
          created_at: new Date().toISOString()
        })
    } catch (usageLogError) {
      console.warn('Failed to log media search usage:', usageLogError)
    }

    // Log the action for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          category: 'external_apis',
          action: 'media_searched',
          metadata: {
            provider_id: params.provider_id,
            provider_type: provider.provider_type,
            query: params.query,
            results_count: result.results.length,
            cost: searchCost,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      console.warn('Failed to log media search:', analyticsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        cost: searchCost,
        provider: {
          id: provider.provider_id,
          name: provider.provider_name,
          type: provider.provider_type
        }
      },
      message: 'Media search completed successfully'
    })

  } catch (error) {
    console.error('Media search API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid search parameters',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search media',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}