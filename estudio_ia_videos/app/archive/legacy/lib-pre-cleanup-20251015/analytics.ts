
// Analytics e Telemetria
import mixpanel from 'mixpanel-browser'

// Inicializar Mixpanel (versão simplificada para MVP)
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || 'mock-token'

// Configuração do Mixpanel
if (typeof window !== 'undefined') {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage'
  })
}

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, unknown>
  timestamp?: Date
}

export class Analytics {
  
  // Tracking de eventos principais
  static track(event: string, properties?: Record<string, unknown>) {
    try {
      // Para desenvolvimento, logar no console
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Analytics Event:', { event, properties })
      }
      
      // Enviar para Mixpanel em produção
      if (typeof window !== 'undefined' && MIXPANEL_TOKEN !== 'mock-token') {
        mixpanel.track(event, {
          ...properties,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        })
      }
      
      // Salvar localmente para dashboard admin
      this.saveLocalMetric({ event, properties, timestamp: new Date() })
    } catch (error) {
      console.error('Analytics Error:', error)
    }
  }

  // Eventos específicos da aplicação
  static editorStarted(projectId?: string) {
    this.track('editor_started', {
      project_id: projectId,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
    })
  }

  static pptxImportStarted(fileName: string, fileSize: number) {
    this.track('pptx_import_started', {
      file_name: fileName,
      file_size: fileSize,
      file_size_mb: Math.round(fileSize / (1024 * 1024) * 100) / 100
    })
  }

  static pptxImportCompleted(fileName: string, slidesCount: number, duration: number) {
    this.track('pptx_import_completed', {
      file_name: fileName,
      slides_count: slidesCount,
      processing_duration_ms: duration,
      success: true
    })
  }

  static pptxImportFailed(fileName: string, error: string, duration: number) {
    this.track('pptx_import_failed', {
      file_name: fileName,
      error_message: error,
      processing_duration_ms: duration,
      success: false
    })
  }

  static videoPreviewStarted(projectId: string, slidesCount: number) {
    this.track('video_preview_started', {
      project_id: projectId,
      slides_count: slidesCount
    })
  }

  static videoPreviewCompleted(projectId: string, renderDuration: number) {
    this.track('video_preview_completed', {
      project_id: projectId,
      render_duration_ms: renderDuration,
      success: true
    })
  }

  static videoRenderStarted(projectId: string, quality: string, slidesCount: number) {
    this.track('video_render_started', {
      project_id: projectId,
      quality: quality,
      slides_count: slidesCount
    })
  }

  static videoRenderCompleted(projectId: string, renderDuration: number, outputSize: number) {
    this.track('video_render_completed', {
      project_id: projectId,
      render_duration_ms: renderDuration,
      output_size_mb: Math.round(outputSize / (1024 * 1024) * 100) / 100,
      success: true
    })
  }

  static videoRenderFailed(projectId: string, error: string, renderDuration: number) {
    this.track('video_render_failed', {
      project_id: projectId,
      error_message: error,
      render_duration_ms: renderDuration,
      success: false
    })
  }

  static avatarSelected(avatarId: string, projectId: string) {
    this.track('avatar_selected', {
      avatar_id: avatarId,
      project_id: projectId
    })
  }

  static voiceSelected(voiceId: string, language: string, projectId: string) {
    this.track('voice_selected', {
      voice_id: voiceId,
      language: language,
      project_id: projectId
    })
  }

  // Performance tracking
  static pageLoadCompleted(page: string, loadTime: number) {
    this.track('page_load_completed', {
      page: page,
      load_time_ms: loadTime
    })
  }

  // Salvar métricas localmente para dashboard admin
  private static saveLocalMetric(metric: AnalyticsEvent) {
    if (typeof window === 'undefined') return

    try {
      const existingMetrics = JSON.parse(localStorage.getItem('estudio_metrics') || '[]')
      const newMetrics = [...existingMetrics, metric].slice(-1000) // Manter apenas últimas 1000
      localStorage.setItem('estudio_metrics', JSON.stringify(newMetrics))
    } catch (error) {
      console.warn('Erro ao salvar métrica local:', error)
    }
  }

  // Obter métricas para dashboard admin
  static getLocalMetrics(days: number = 7): AnalyticsEvent[] {
    if (typeof window === 'undefined') return []

    try {
      const metrics = JSON.parse(localStorage.getItem('estudio_metrics') || '[]')
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      return metrics.filter((metric: AnalyticsEvent) => {
        const metricDate = new Date(metric.timestamp || 0)
        return metricDate >= cutoffDate
      })
    } catch (error) {
      console.error('Erro ao obter métricas locais:', error)
      return []
    }
  }

  // Calcular KPIs
  static calculateKPIs(metrics: AnalyticsEvent[]) {
    const pptxImports = metrics.filter(m => m.event === 'pptx_import_completed')
    const pptxImportsFailed = metrics.filter(m => m.event === 'pptx_import_failed')
    const videoRenders = metrics.filter(m => m.event === 'video_render_completed')
    const videoRendersFailed = metrics.filter(m => m.event === 'video_render_failed')
    const editorSessions = metrics.filter(m => m.event === 'editor_started')

    const totalPptxImports = pptxImports.length + pptxImportsFailed.length
    const pptxSuccessRate = totalPptxImports > 0 ? (pptxImports.length / totalPptxImports) * 100 : 0

    const totalVideoRenders = videoRenders.length + videoRendersFailed.length
    const videoSuccessRate = totalVideoRenders > 0 ? (videoRenders.length / totalVideoRenders) * 100 : 0

    const avgRenderTime = videoRenders.length > 0 
      ? videoRenders.reduce((sum, m) => sum + (m.properties?.render_duration_ms || 0), 0) / videoRenders.length
      : 0

    return {
      editorSessions: editorSessions.length,
      pptxImports: totalPptxImports,
      pptxSuccessRate: Math.round(pptxSuccessRate * 100) / 100,
      videoRenders: totalVideoRenders,
      videoSuccessRate: Math.round(videoSuccessRate * 100) / 100,
      avgRenderTime: Math.round(avgRenderTime / 1000 * 100) / 100 // em segundos
    }
  }
}

// Hook para tracking de performance de página
export function usePagePerformance(pageName: string) {
  if (typeof window !== 'undefined') {
    const startTime = performance.now()
    
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime
      Analytics.pageLoadCompleted(pageName, loadTime)
    })
  }
}
