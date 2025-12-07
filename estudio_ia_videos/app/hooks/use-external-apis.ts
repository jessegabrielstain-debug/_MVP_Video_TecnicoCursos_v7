/**
 * 🔌 External APIs Integration Hook
 * Provides unified access to TTS providers, media libraries, and NR compliance APIs
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Types and Interfaces
export interface TTSProvider {
  id: string
  name: string
  provider_name: string
  description?: string
  type: 'azure' | 'google' | 'openai' | 'elevenlabs'
  enabled: boolean
  usage_today?: number
  cost_today?: number
  rate_limit?: number
  last_error?: string
  config: {
    api_key?: string
    region?: string
    endpoint?: string
    voice_models?: string[]
    languages?: string[]
    max_characters?: number
    rate_limit?: number
  }
  pricing: {
    per_character?: number
    per_request?: number
    monthly_quota?: number
  }
}

export interface MediaProvider {
  id: string
  name: string
  provider_name: string
  type: 'unsplash' | 'pexels' | 'pixabay' | 'shutterstock'
  enabled: boolean
  downloads_today?: number
  cost_today?: number
  config: {
    api_key?: string
    endpoint?: string
    max_requests_per_hour?: number
    supported_formats?: string[]
    max_resolution?: string
  }
  pricing: {
    per_download?: number
    monthly_quota?: number
    premium_access?: boolean
  }
}

export interface NRComplianceProvider {
  id: string
  name: string
  type: 'accessibility' | 'content_rating' | 'copyright' | 'privacy'
  enabled: boolean
  config: {
    api_key?: string
    endpoint?: string
    compliance_standards?: string[]
    auto_check?: boolean
  }
}

export interface TTSRequest {
  text: string
  voice: string
  language: string
  provider: string
  settings: {
    speed?: number
    pitch?: number
    volume?: number
    format?: string
    quality?: string
  }
}

export interface TTSResponse {
  id: string
  audio_url: string
  duration: number
  characters_used: number
  cost: number
  provider: string
  metadata: {
    voice: string
    language: string
    format: string
    file_size: number
  }
}

export interface MediaSearchRequest {
  query: string
  provider: string
  filters: {
    category?: string
    orientation?: 'landscape' | 'portrait' | 'square'
    size?: 'small' | 'medium' | 'large'
    color?: string
    safe_search?: boolean
  }
  pagination: {
    page: number
    per_page: number
  }
}

export interface MediaItem {
  id: string
  title: string
  description: string
  url: string
  thumbnail_url: string
  download_url: string
  author: string
  license: string
  tags: string[]
  dimensions: {
    width: number
    height: number
  }
  file_size?: number
  provider: string
}

export interface ComplianceCheckRequest {
  content_type: 'text' | 'image' | 'video' | 'audio'
  content_url?: string
  content_text?: string
  checks: string[]
  metadata?: Record<string, unknown>
}

export interface ComplianceResult {
  id: string
  status: 'passed' | 'failed' | 'warning'
  score: number
  checks: {
    type: string
    status: 'passed' | 'failed' | 'warning'
    message: string
    suggestions?: string[]
  }[]
  recommendations: string[]
  compliance_level: string
}

// API Fetcher
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch external API data')
  }
  return response.json()
}

export function useExternalAPIs() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // SWR Hooks for provider configurations
  const { 
    data: ttsProviders, 
    error: ttsError, 
    mutate: mutateTTS,
    isLoading: isLoadingTTS 
  } = useSWR<TTSProvider[]>(
    user ? '/api/external/tts/providers' : null,
    fetcher
  )

  const { 
    data: mediaProviders, 
    error: mediaError, 
    mutate: mutateMedia,
    isLoading: isLoadingMedia 
  } = useSWR<MediaProvider[]>(
    user ? '/api/external/media/providers' : null,
    fetcher
  )

  const { 
    data: complianceProviders, 
    error: complianceError, 
    mutate: mutateCompliance,
    isLoading: isLoadingCompliance 
  } = useSWR<NRComplianceProvider[]>(
    user ? '/api/external/compliance/providers' : null,
    fetcher
  )
  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        console.error('[ExternalAPIs] Falha ao carregar usuário:', error)
      }
    }

    void loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase])


  // TTS Functions
  const generateTTS = useCallback(async (request: TTSRequest): Promise<TTSResponse> => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/external/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to generate TTS')
      }

      const result = await response.json()
      toast.success('TTS generated successfully')
      return result.data
    } catch (error) {
      toast.error('Failed to generate TTS')
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const getVoices = useCallback(async (provider: string, language?: string) => {
    try {
      const params = new URLSearchParams({ provider })
      if (language) params.append('language', language)

      const response = await fetch(`/api/external/tts/voices?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch voices')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      toast.error('Failed to fetch voices')
      throw error
    }
  }, [])

  const getTTSUsage = useCallback(async (timeRange: string = '30d') => {
    try {
      const response = await fetch(`/api/external/tts/usage?time_range=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch TTS usage')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      toast.error('Failed to fetch TTS usage')
      throw error
    }
  }, [])

  // Media Functions
  const searchMedia = useCallback(async (request: MediaSearchRequest): Promise<MediaItem[]> => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/external/media/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to search media')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      toast.error('Failed to search media')
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const downloadMedia = useCallback(async (mediaId: string, provider: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/external/media/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ media_id: mediaId, provider })
      })

      if (!response.ok) {
        throw new Error('Failed to download media')
      }

      const result = await response.json()
      toast.success('Media downloaded successfully')
      return result.data
    } catch (error) {
      toast.error('Failed to download media')
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const getMediaUsage = useCallback(async (timeRange: string = '30d') => {
    try {
      const response = await fetch(`/api/external/media/usage?time_range=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch media usage')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      toast.error('Failed to fetch media usage')
      throw error
    }
  }, [])

  // Compliance Functions
  const checkCompliance = useCallback(async (request: ComplianceCheckRequest): Promise<ComplianceResult> => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/external/compliance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to check compliance')
      }

      const result = await response.json()
      
      if (result.data.status === 'failed') {
        toast.warning('Compliance check failed - review recommendations')
      } else if (result.data.status === 'warning') {
        toast.warning('Compliance check has warnings')
      } else {
        toast.success('Compliance check passed')
      }

      return result.data
    } catch (error) {
      toast.error('Failed to check compliance')
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const getComplianceHistory = useCallback(async (timeRange: string = '30d') => {
    try {
      const response = await fetch(`/api/external/compliance/history?time_range=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch compliance history')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      toast.error('Failed to fetch compliance history')
      throw error
    }
  }, [])

  // Provider Management Functions
  const updateTTSProvider = useCallback(async (providerId: string, config: Partial<TTSProvider>) => {
    try {
      const response = await fetch(`/api/external/tts/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error('Failed to update TTS provider')
      }

      mutateTTS()
      toast.success('TTS provider updated successfully')
    } catch (error) {
      toast.error('Failed to update TTS provider')
      throw error
    }
  }, [mutateTTS])

  const updateMediaProvider = useCallback(async (providerId: string, config: Partial<MediaProvider>) => {
    try {
      const response = await fetch(`/api/external/media/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error('Failed to update media provider')
      }

      mutateMedia()
      toast.success('Media provider updated successfully')
    } catch (error) {
      toast.error('Failed to update media provider')
      throw error
    }
  }, [mutateMedia])

  const updateComplianceProvider = useCallback(async (providerId: string, config: Partial<NRComplianceProvider>) => {
    try {
      const response = await fetch(`/api/external/compliance/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error('Failed to update compliance provider')
      }

      mutateCompliance()
      toast.success('Compliance provider updated successfully')
    } catch (error) {
      toast.error('Failed to update compliance provider')
      throw error
    }
  }, [mutateCompliance])

  // Utility Functions
  const getEnabledTTSProviders = useCallback(() => {
    return ttsProviders?.filter(provider => provider.enabled) || []
  }, [ttsProviders])

  const getEnabledMediaProviders = useCallback(() => {
    return mediaProviders?.filter(provider => provider.enabled) || []
  }, [mediaProviders])

  const getEnabledComplianceProviders = useCallback(() => {
    return complianceProviders?.filter(provider => provider.enabled) || []
  }, [complianceProviders])

  const refreshProviders = useCallback(() => {
    mutateTTS()
    mutateMedia()
    mutateCompliance()
  }, [mutateTTS, mutateMedia, mutateCompliance])

  // New functions to match usage in external-apis.tsx
  const updateProviderConfig = useCallback(async (providerId: string, config: any) => {
    // Try to update as TTS provider first, then Media, then Compliance
    // In a real implementation, we would know the type
    try {
        await updateTTSProvider(providerId, config)
    } catch {
        try {
            await updateMediaProvider(providerId, config)
        } catch {
             await updateComplianceProvider(providerId, config)
        }
    }
  }, [updateTTSProvider, updateMediaProvider, updateComplianceProvider])

  const testProvider = useCallback(async (providerId: string, testData: any) => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
  }, [])

  const exportUsageData = useCallback(async () => {
      // Mock implementation
      toast.success('Usage data exported')
  }, [])

  // Mock usage stats
  const usageStats = {
      total_calls: 1250,
      calls_today: 45,
      total_cost: 15.50,
      cost_today: 0.75,
      success_rate: 98.5,
      active_providers: (ttsProviders?.filter(p => p.enabled).length || 0) + (mediaProviders?.filter(p => p.enabled).length || 0),
      total_providers: (ttsProviders?.length || 0) + (mediaProviders?.length || 0)
  }

  return {
    // Data
    ttsProviders,
    mediaProviders,
    complianceProviders,
    usageStats,
    
    // Loading states
    isLoading: isLoadingTTS || isLoadingMedia || isLoadingCompliance,
    isLoadingTTS,
    isLoadingMedia,
    isLoadingCompliance,
    isProcessing,
    
    // Error states
    error: ttsError || mediaError || complianceError,
    ttsError,
    mediaError,
    complianceError,
    
    // TTS Functions
    generateTTS,
    getVoices,
    getTTSUsage,
    
    // Media Functions
    searchMedia,
    downloadMedia,
    getMediaUsage,
    
    // Compliance Functions
    checkCompliance,
    getComplianceHistory,
    
    // Provider Management
    updateTTSProvider,
    updateMediaProvider,
    updateComplianceProvider,
    updateProviderConfig,
    testProvider,
    
    // Utility Functions
    getEnabledTTSProviders,
    getEnabledMediaProviders,
    getEnabledComplianceProviders,
    refreshProviders,
    exportUsageData
  }
}