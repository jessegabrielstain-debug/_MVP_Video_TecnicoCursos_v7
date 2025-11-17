/**
 * 📈 METRICS COLLECTION SYSTEM
 * Sistema de coleta de métricas para monitoramento
 */

import { logger } from './logger'

export interface Metric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
  type: 'counter' | 'gauge' | 'histogram' | 'timer'
}

export interface SystemMetrics {
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    used: number
    free: number
    total: number
    percentage: number
  }
  requests: {
    total: number
    success: number
    errors: number
    rate: number
  }
  database: {
    connections: number
    queries: number
    avgResponseTime: number
  }
  redis: {
    connected: boolean
    hitRate: number
    memory: string
    keys: number
  }
}

class MetricsCollector {
  private static instance: MetricsCollector
  private metrics: Map<string, Metric[]> = new Map()
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()
  private timers: Map<string, number[]> = new Map()
  private maxMetricsPerType = 1000

  private constructor() {
    this.startSystemMetricsCollection()
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  // 📊 COUNTER
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const currentValue = this.counters.get(name) || 0
    this.counters.set(name, currentValue + value)
    
    this.addMetric({
      name,
      value: currentValue + value,
      timestamp: Date.now(),
      tags,
      type: 'counter'
    })
  }

  // 📏 GAUGE
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.gauges.set(name, value)
    
    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'gauge'
    })
  }

  // ⏱️ TIMER
  timer(name: string, duration: number, tags?: Record<string, string>): void {
    const timings = this.timers.get(name) || []
    timings.push(duration)
    
    // Keep only last 100 timings
    if (timings.length > 100) {
      timings.shift()
    }
    
    this.timers.set(name, timings)
    
    this.addMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      tags,
      type: 'timer'
    })
  }

  // 📊 HISTOGRAM
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'histogram'
    })
  }

  // 📈 ADD METRIC
  private addMetric(metric: Metric): void {
    const metrics = this.metrics.get(metric.name) || []
    metrics.push(metric)
    
    // Keep only recent metrics
    if (metrics.length > this.maxMetricsPerType) {
      metrics.shift()
    }
    
    this.metrics.set(metric.name, metrics)
  }

  // 🔍 GET METRICS
  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.get(name) || []
    }
    
    const allMetrics: Metric[] = []
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics)
    }
    
    return allMetrics.sort((a, b) => b.timestamp - a.timestamp)
  }

  // 📊 GET SUMMARY
  getSummary(): Record<string, unknown> {
    const summary: Record<string, unknown> = {}
    
    // Counters
    summary.counters = Object.fromEntries(this.counters)
    
    // Gauges
    summary.gauges = Object.fromEntries(this.gauges)
    
    // Timers (with statistics)
    summary.timers = {}
    for (const [name, timings] of this.timers) {
      if (timings.length > 0) {
        const sorted = [...timings].sort((a, b) => a - b)
        summary.timers[name] = {
          count: timings.length,
          min: Math.min(...timings),
          max: Math.max(...timings),
          avg: timings.reduce((a, b) => a + b, 0) / timings.length,
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)]
        }
      }
    }
    
    return summary
  }

  // 🖥️ SYSTEM METRICS
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage()
    
    return {
      cpu: {
        usage: process.cpuUsage().user / 1000000, // Convert to seconds
        loadAverage: [0, 0, 0] // Not available in Node.js on Windows
      },
      memory: {
        used: memoryUsage.heapUsed,
        free: memoryUsage.heapTotal - memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      requests: {
        total: this.counters.get('http.requests.total') || 0,
        success: this.counters.get('http.requests.success') || 0,
        errors: this.counters.get('http.requests.errors') || 0,
        rate: this.calculateRequestRate()
      },
      database: {
        connections: this.gauges.get('database.connections') || 0,
        queries: this.counters.get('database.queries') || 0,
        avgResponseTime: this.calculateAverageResponseTime('database.query.time')
      },
      redis: {
        connected: this.gauges.get('redis.connected') === 1,
        hitRate: this.gauges.get('redis.hit_rate') || 0,
        memory: 'N/A',
        keys: this.gauges.get('redis.keys') || 0
      }
    }
  }

  // 📊 CALCULATE REQUEST RATE
  private calculateRequestRate(): number {
    const requestMetrics = this.metrics.get('http.requests.total') || []
    if (requestMetrics.length < 2) return 0
    
    const recent = requestMetrics.slice(-10) // Last 10 requests
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp
    
    return timeSpan > 0 ? (recent.length / timeSpan) * 1000 : 0 // Requests per second
  }

  // ⏱️ CALCULATE AVERAGE RESPONSE TIME
  private calculateAverageResponseTime(metricName: string): number {
    const timings = this.timers.get(metricName) || []
    if (timings.length === 0) return 0
    
    return timings.reduce((a, b) => a + b, 0) / timings.length
  }

  // 🔄 START SYSTEM METRICS COLLECTION
  private startSystemMetricsCollection(): void {
    setInterval(async () => {
      try {
        const systemMetrics = await this.getSystemMetrics()
        
        // Update gauges with system metrics
        this.gauge('system.memory.usage', systemMetrics.memory.percentage)
        this.gauge('system.memory.used', systemMetrics.memory.used)
        this.gauge('system.cpu.usage', systemMetrics.cpu.usage)
        
        logger.debug('System metrics collected', { systemMetrics })
      } catch (error) {
        logger.error('Failed to collect system metrics', error as Error)
      }
    }, 30000) // Every 30 seconds
  }

  // 🧹 CLEANUP OLD METRICS
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    
    for (const [name, metrics] of this.metrics) {
      const filtered = metrics.filter(m => m.timestamp > cutoff)
      this.metrics.set(name, filtered)
    }
  }
}

// 🚀 EXPORT SINGLETON
export const metrics = MetricsCollector.getInstance()

// 🎯 CONVENIENCE FUNCTIONS
export const track = {
  increment: (name: string, value?: number, tags?: Record<string, string>) => 
    metrics.increment(name, value, tags),
  
  gauge: (name: string, value: number, tags?: Record<string, string>) => 
    metrics.gauge(name, value, tags),
  
  timer: (name: string, duration: number, tags?: Record<string, string>) => 
    metrics.timer(name, duration, tags),
  
  histogram: (name: string, value: number, tags?: Record<string, string>) => 
    metrics.histogram(name, value, tags)
}

// 🎯 PERFORMANCE TRACKING DECORATOR
export function trackPerformance(metricName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      
      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - startTime
        
        metrics.timer(metricName, duration)
        metrics.increment(`${metricName}.success`)
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        
        metrics.timer(metricName, duration)
        metrics.increment(`${metricName}.error`)
        
        throw error
      }
    }
    
    return descriptor
  }
}

export default {
  metrics,
  track,
  trackPerformance,
}
