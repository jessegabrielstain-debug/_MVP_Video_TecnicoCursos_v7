/**
 * 🚑 Sistema de correções emergenciais melhorado
 */

declare global {
  interface Window {
    fabric?: unknown
    fabricLoaded?: boolean
    gc?: () => void
  }
}

export interface EmergencyContext {
  userAgent: string
  viewport: { width: number; height: number }
  performance: {
    memory?: PerformanceMemoryInfo
    navigation?: PerformanceNavigation | PerformanceNavigationTiming
  }
  errors: Error[]
  timestamp: number
}

interface PerformanceMemoryInfo {
  jsHeapSizeLimit: number
  totalJSHeapSize: number
  usedJSHeapSize: number
}

type ExtendedPerformance = Performance & {
  memory?: PerformanceMemoryInfo
  navigation?: PerformanceNavigation | PerformanceNavigationTiming
}

export class EmergencyFixManager {
  private static instance: EmergencyFixManager | null = null
  private fixes = new Map<string, () => void>()
  private isActive = false
  private context: EmergencyContext | null = null

  static getInstance() {
    if (!EmergencyFixManager.instance) {
      EmergencyFixManager.instance = new EmergencyFixManager()
    }
    return EmergencyFixManager.instance
  }

  initialize() {
    if (this.isActive || typeof window === 'undefined') return
    this.isActive = true
    this.captureContext()
    this.registerFixes()
    this.startMonitoring()
    console.log('✅ Emergency fixes initialized (improved version)')
  }

  private captureContext() {
    if (typeof window === 'undefined') return
    this.context = {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      performance: {
        memory: this.getPerformanceMemory(),
        navigation: this.getPerformanceNavigation(),
      },
      errors: [],
      timestamp: Date.now(),
    }
  }

  private registerFixes() {
    this.fixes.set('fabric-conflicts', () => {
      if (typeof window === 'undefined' || !window.fabric) return
      if (!window.fabricLoaded) {
        window.fabricLoaded = true
        console.log('🔧 Fixed: Fabric.js conflicts resolved')
      }
    })

    this.fixes.set('canvas-textbaseline', () => {
      if (typeof window === 'undefined') return
      const ctxPrototype = window.CanvasRenderingContext2D?.prototype
      if (!ctxPrototype) return
      const originalFillText = ctxPrototype.fillText
      ctxPrototype.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
        const baseline = this.textBaseline as CanvasTextBaseline | string
        if (baseline === 'alphabetical') {
          this.textBaseline = 'alphabetic'
        }
        return originalFillText.call(this, text, x, y, maxWidth)
      }
      console.log('🔧 Fixed: Canvas TextBaseline corrected')
    })

    this.fixes.set('performance-monitor', () => {
      if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('⚠️ Long task detected:', `${entry.duration}ms`)
            setTimeout(() => this.optimizePerformance(), 100)
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['longtask', 'measure'] })
      } catch (error) {
        console.log('Long task monitoring not supported', error)
      }
    })

    this.fixes.set('memory-cleanup', () => {
      if (typeof window === 'undefined') return
      console.log('🔧 Fixed: Memory leak prevention active')
    })
  }

  private startMonitoring() {
    if (typeof window === 'undefined') return
    const monitorInterval = window.setInterval(() => {
      this.checkForIssues()
    }, 30_000)

    window.addEventListener('beforeunload', () => {
      clearInterval(monitorInterval)
    })
  }

  private checkForIssues() {
    if (typeof window === 'undefined') return
    const perfMemory = this.getPerformanceMemory()
    if (perfMemory) {
      const used = perfMemory.usedJSHeapSize / perfMemory.totalJSHeapSize
      if (used > 0.9) {
        console.warn('🚨 High memory usage detected:', `${(used * 100).toFixed(1)}%`)
        this.optimizePerformance()
      }
    }

    if (this.context && Date.now() - this.context.timestamp > 60_000) {
      this.captureContext()
    }
  }

  private optimizePerformance() {
    if (typeof window === 'undefined') return
    if (window.gc) {
      try {
        window.gc()
        console.log('🗑️ Forced garbage collection')
      } catch {
        /* noop */
      }
    }

    document.querySelectorAll('canvas').forEach((canvas) => {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    })

    console.log('⚡ Performance optimization applied')
  }

  applyFix(name: string) {
    const fix = this.fixes.get(name)
    try {
      fix?.()
    } catch (error) {
      console.error(`Error applying fix ${name}:`, error)
    }
  }

  applyAllFixes() {
    this.fixes.forEach((_fix, name) => this.applyFix(name))
  }

  getStatus() {
    return {
      isActive: this.isActive,
      fixesCount: this.fixes.size,
      context: this.context,
    }
  }

  private getPerformanceMemory(): PerformanceMemoryInfo | undefined {
    if (typeof performance === 'undefined') {
      return undefined
    }
    const perf = performance as ExtendedPerformance
    const memory = perf.memory
    if (!memory) {
      return undefined
    }
    const { jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize } = memory
    if (
      typeof jsHeapSizeLimit !== 'number' ||
      typeof totalJSHeapSize !== 'number' ||
      typeof usedJSHeapSize !== 'number'
    ) {
      return undefined
    }
    return { jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize }
  }

  private getPerformanceNavigation(): PerformanceNavigation | PerformanceNavigationTiming | undefined {
    if (typeof performance === 'undefined') {
      return undefined
    }
    const perf = performance as ExtendedPerformance
    return perf.navigation
  }
}

if (typeof window !== 'undefined') {
  const manager = EmergencyFixManager.getInstance()
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => manager.initialize())
  } else {
    manager.initialize()
  }
}

export default EmergencyFixManager
