
'use client'

/**
 * Advanced Analytics System - Simplified Version
 */

import React from 'react'

interface AnalyticsEvent {
  id: string
  type: string
  userId?: string
  sessionId: string
  timestamp: number
  data: Record<string, unknown>
}

class SimpleAnalytics {
  private static instance: SimpleAnalytics
  private sessionId: string
  private events: AnalyticsEvent[] = []

  private constructor() {
    this.sessionId = 'session_' + Date.now()
  }

  static getInstance(): SimpleAnalytics {
    if (!SimpleAnalytics.instance) {
      SimpleAnalytics.instance = new SimpleAnalytics()
    }
    return SimpleAnalytics.instance
  }

  track(type: string, data: Record<string, unknown> = {}): void {
    const event: AnalyticsEvent = {
      id: 'evt_' + Date.now(),
      type,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      data
    }

    this.events.push(event)
    console.log('Analytics Event:', event)
  }

  trackPageView(page: string, title?: string): void {
    this.track('page_view', { page, title })
  }

  trackUserAction(action: string, category: string, data: Record<string, unknown> = {}): void {
    this.track('user_action', { action, category, ...data })
  }

  trackVideoCreation(data: Record<string, unknown>): void {
    this.track('video_creation', data)
  }

  trackExport(data: Record<string, unknown>): void {
    this.track('export', data)
  }

  trackFunnelStep(step: string, data: Record<string, unknown> = {}): void {
    this.track('funnel_step', { step, ...data })
  }

  trackDropoff(point: string, reason?: string): void {
    this.track('dropoff', { point, reason })
  }

  trackError(error: any): void {
    this.track('error', { error: error.toString() })
  }

  getVariant(testName: string, variants: string[]): string {
    const index = Math.abs(this.sessionId.length) % variants.length
    return variants[index]
  }
}

// Export instance
export const analytics = SimpleAnalytics.getInstance()

// React hooks
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackVideoCreation: analytics.trackVideoCreation.bind(analytics),
    trackExport: analytics.trackExport.bind(analytics),
    trackFunnelStep: analytics.trackFunnelStep.bind(analytics),
    trackDropoff: analytics.trackDropoff.bind(analytics),
    getVariant: analytics.getVariant.bind(analytics)
  }
}

export const usePerformanceMonitoring = () => {
  const measureOperation = (operationName: string) => {
    const startTime = Date.now()
    return () => {
      const duration = Date.now() - startTime
      analytics.track('performance', { operation: operationName, duration })
    }
  }

  return { measureOperation }
}

interface AnalyticsErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class AnalyticsErrorBoundary extends React.Component<AnalyticsErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: AnalyticsErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analytics Error Boundary caught an error:', error, errorInfo)
    analytics.trackError(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Algo deu errado</h2>
            <p className="text-gray-600 mb-4">Houve um erro inesperado na aplicação.</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
