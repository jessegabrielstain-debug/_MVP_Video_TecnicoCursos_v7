'use client'

import React from 'react'

interface AnalyticsEvent {
  id: string
  type: string
  userId?: string
  sessionId: string
  timestamp: number
  data: Record<string, unknown>
}

const THROTTLE_REGISTRY = new Map<string, number>()
const THROTTLE_DELAY = 2000

class EmergencyAnalytics {
  private static instance: EmergencyAnalytics
  private sessionId: string
  private events: AnalyticsEvent[] = []
  private isBlocked = false

  private constructor() {
    this.sessionId = `session_${Date.now()}`

    setInterval(() => {
      if (this.events.length > 100) {
        console.warn('🚨 [ANALYTICS] Limpando eventos (>100)')
        this.events = this.events.slice(-50)
      }
    }, 30_000)
  }

  static getInstance() {
    if (!EmergencyAnalytics.instance) {
      EmergencyAnalytics.instance = new EmergencyAnalytics()
    }
    return EmergencyAnalytics.instance
  }

  private shouldThrottle(type: string) {
    const now = Date.now()
    const last = THROTTLE_REGISTRY.get(type) ?? 0
    if (now - last < THROTTLE_DELAY) {
      console.warn(`⏱️ [ANALYTICS] Throttled: ${type}`)
      return true
    }
    THROTTLE_REGISTRY.set(type, now)
    return false
  }

  track(type: string, data: Record<string, unknown> = {}) {
    if (this.isBlocked) return
    if (this.shouldThrottle(type)) return

    const event: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      data,
    }

    this.events.push(event)

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [ANALYTICS]', type, data)
    }

    const recent = this.events.filter((evt) => Date.now() - evt.timestamp < 10_000)
    if (recent.length > 20) {
      console.error('🚨 [ANALYTICS] BLOQUEANDO - muitos eventos!')
      this.isBlocked = true
      setTimeout(() => {
        this.isBlocked = false
        console.log('✅ [ANALYTICS] Desbloqueado')
      }, 10_000)
    }
  }

  trackPageView(page: string, title?: string) {
    this.track('page_view', { page, title })
  }

  trackUserAction(action: string, category: string, data: Record<string, unknown> = {}) {
    this.track('user_action', { action, category, ...data })
  }

  trackVideoCreation(data: Record<string, unknown>) {
    this.track('video_creation', data)
  }

  trackExport(data: Record<string, unknown>) {
    this.track('export', data)
  }

  trackFunnelStep(step: string, data: Record<string, unknown> = {}) {
    this.track('funnel_step', { step, ...data })
  }

  trackDropoff(point: string, reason?: string) {
    this.track('dropoff', { point, reason })
  }

  trackError(error: unknown) {
    const payload = error instanceof Error ? error.message : String(error)
    this.track('error', { error: payload })
  }

  getVariant(testName: string, variants: string[]) {
    const index = Math.abs((this.sessionId + testName).length) % variants.length
    return variants[index]
  }

  emergency = {
    block: () => {
      this.isBlocked = true
      console.log('🚨 Analytics BLOCKED')
    },
    unblock: () => {
      this.isBlocked = false
      console.log('✅ Analytics UNBLOCKED')
    },
    clear: () => {
      this.events = []
      console.log('🗑️ Analytics CLEARED')
    },
    status: () => ({
      isBlocked: this.isBlocked,
      eventCount: this.events.length,
      recentEvents: this.events.slice(-5),
    }),
  }
}

export const emergencyAnalytics = EmergencyAnalytics.getInstance()

export const useEmergencyAnalytics = () => ({
  track: emergencyAnalytics.track.bind(emergencyAnalytics),
  trackPageView: emergencyAnalytics.trackPageView.bind(emergencyAnalytics),
  trackUserAction: emergencyAnalytics.trackUserAction.bind(emergencyAnalytics),
  trackVideoCreation: emergencyAnalytics.trackVideoCreation.bind(emergencyAnalytics),
  trackExport: emergencyAnalytics.trackExport.bind(emergencyAnalytics),
  trackFunnelStep: emergencyAnalytics.trackFunnelStep.bind(emergencyAnalytics),
  trackDropoff: emergencyAnalytics.trackDropoff.bind(emergencyAnalytics),
  getVariant: emergencyAnalytics.getVariant.bind(emergencyAnalytics),
  emergency: emergencyAnalytics.emergency,
})

export const useEmergencyPerformanceMonitoring = () => {
  const measureOperation = (operationName: string) => {
    const started = Date.now()
    return () => {
      const duration = Date.now() - started
      if (duration < 10_000) {
        emergencyAnalytics.track('performance', { operation: operationName, duration })
      }
    }
  }

  return { measureOperation }
}

interface EmergencyErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorCount: number
}

export class EmergencyErrorBoundary extends React.Component<
  EmergencyErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: EmergencyErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, errorCount: 0 }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('🚨 Emergency Error Boundary:', error, info)
    
    this.setState({ errorInfo: info })
    
    try {
      if (this.state.errorCount < 3) {
        emergencyAnalytics.trackError(error)
        this.setState((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }))
      }
    } catch (err) {
      console.warn('Failed to track error:', err)
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private copyErrorToClipboard = () => {
    const errorText = `
Error: ${this.state.error?.message || 'Unknown error'}
Stack: ${this.state.error?.stack || 'No stack trace'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
    `.trim()
    
    navigator.clipboard.writeText(errorText).then(() => {
      alert('Erro copiado para a área de transferência!')
    })
  }

  render() {
    if (this.state.hasError) {
      // Se um fallback customizado foi fornecido, use-o
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isDev = process.env.NODE_ENV === 'development'
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
          <div className="w-full max-w-lg text-center">
            {/* Card principal */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Header com ícone */}
              <div className="bg-red-500 dark:bg-red-600 p-6">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Ops! Algo deu errado
                </h2>
                <p className="text-red-100 text-sm mt-2">
                  Encontramos um problema inesperado
                </p>
              </div>
              
              {/* Corpo */}
              <div className="p-6">
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Não se preocupe, sua sessão está segura. Tente uma das opções abaixo.
                </p>
                
                {/* Botões de ação */}
                <div className="space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Tentar Novamente
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={this.handleGoHome}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                    >
                      Ir para Home
                    </button>
                    <button
                      onClick={this.handleReload}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                    >
                      Recarregar Página
                    </button>
                  </div>
                </div>

                {/* Detalhes do erro (apenas em desenvolvimento) */}
                {isDev && this.state.error && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <details className="text-left">
                      <summary className="text-sm font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                        🔍 Detalhes técnicos (dev only)
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                          <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                            {this.state.error.message}
                          </p>
                        </div>
                        {this.state.error.stack && (
                          <pre className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto max-h-40">
                            {this.state.error.stack}
                          </pre>
                        )}
                        <button
                          onClick={this.copyErrorToClipboard}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          📋 Copiar erro para clipboard
                        </button>
                      </div>
                    </details>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tentativas: {this.state.errorCount}/3 • 
                  Se o problema persistir, entre em contato com o suporte.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
