
'use client'

import useSWR from 'swr'
import { logger } from '@/lib/logger'

interface Metrics {
  overview: {
    totalProjects: number
    completedProjects: number
    processingProjects: number
    totalDuration: number
    totalViews: number
    totalDownloads: number
    avgProcessingTime: number
  }
  projectStatus: Array<{
    status: string
    count: number
  }>
  activity: {
    timeline: Array<{
      date: string
      activities: number
    }>
    events: Array<{
      type: string
      count: number
    }>
  }
  performance: {
    avgProcessingTime: number
    successRate: number
    cacheHitRate: number
  }
  period: string
  dateRange: {
    start: string
    end: string
  }
}

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url)
    const data = await res.json()
    return data.data || data // Support both {data: ...} and direct response
  } catch (error) {
    logger.error('Error fetching metrics', error as Error, { component: 'use-metrics' })
    // Return fallback data on error
    return {
      overview: {
        totalProjects: 0,
        completedProjects: 0,
        processingProjects: 0,
        totalDuration: 0,
        totalViews: 0,
        totalDownloads: 0,
        avgProcessingTime: 0
      },
      projectStatus: [],
      activity: {
        timeline: [],
        events: []
      },
      performance: {
        avgProcessingTime: 0,
        successRate: 0,
        cacheHitRate: 0
      },
      period: 'month',
      dateRange: {
        start: '',
        end: ''
      }
    }
  }
}

export function useMetrics(period: 'day' | 'week' | 'month' | 'quarter' = 'month') {
  const { data, error, mutate, isLoading } = useSWR<Metrics>(
    `/api/metrics?period=${period}`,
    fetcher,
    { 
      refreshInterval: 0, // 🚨 EMERGENCY: Disabled auto-refresh to prevent loops
      revalidateOnFocus: false, // 🚨 EMERGENCY: Disabled focus revalidation
      revalidateOnReconnect: false, // 🚨 EMERGENCY: Disabled reconnect revalidation
      dedupingInterval: 60000, // 60 second deduping
      errorRetryCount: 1, // Limit retry attempts
      errorRetryInterval: 5000, // 5 second retry interval
      fallbackData: {
        overview: {
          totalProjects: 0,
          completedProjects: 0,
          processingProjects: 0,
          totalDuration: 0,
          totalViews: 0,
          totalDownloads: 0,
          avgProcessingTime: 0
        },
        projectStatus: [],
        activity: {
          timeline: [],
          events: []
        },
        performance: {
          avgProcessingTime: 0,
          successRate: 0,
          cacheHitRate: 0
        },
        period: 'month',
        dateRange: {
          start: '',
          end: ''
        }
      }
    }
  )

  return {
    metrics: data,
    loading: isLoading,
    error,
    refresh: mutate
  }
}
