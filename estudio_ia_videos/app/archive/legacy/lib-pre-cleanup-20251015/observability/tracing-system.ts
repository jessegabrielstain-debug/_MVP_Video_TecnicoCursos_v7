

/**
 * OpenTelemetry-inspired Tracing System
 * Performance monitoring and bottleneck identification
 */

export interface TraceSpan {
  trace_id: string
  span_id: string
  parent_span_id?: string
  operation_name: string
  start_time: number
  end_time?: number
  duration?: number
  tags: Record<string, unknown>
  logs: Array<{
    timestamp: number
    level: 'info' | 'warn' | 'error'
    message: string
    fields?: Record<string, unknown>
  }>
  status: 'ok' | 'error' | 'timeout'
}

export interface PerformanceTrace {
  trace_id: string
  root_span: TraceSpan
  spans: TraceSpan[]
  total_duration: number
  bottlenecks: Array<{
    span_name: string
    duration: number
    percentage: number
  }>
  errors: TraceSpan[]
}

/**
 * Distributed Tracing Manager
 */
export class TracingManager {
  private traces: Map<string, PerformanceTrace> = new Map()
  private activeSpans: Map<string, TraceSpan> = new Map()
  private maxTraces = 1000
  
  /**
   * Start new trace
   */
  startTrace(operationName: string, tags: Record<string, unknown> = {}): string {
    const traceId = this.generateTraceId()
    const spanId = this.generateSpanId()
    
    const rootSpan: TraceSpan = {
      trace_id: traceId,
      span_id: spanId,
      operation_name: operationName,
      start_time: Date.now(),
      tags: {
        ...tags,
        'service.name': 'estudio-ia-videos',
        'service.version': '4.0.0'
      },
      logs: [],
      status: 'ok'
    }

    const trace: PerformanceTrace = {
      trace_id: traceId,
      root_span: rootSpan,
      spans: [rootSpan],
      total_duration: 0,
      bottlenecks: [],
      errors: []
    }

    this.traces.set(traceId, trace)
    this.activeSpans.set(spanId, rootSpan)

    console.log(`Started trace ${traceId} for ${operationName}`)
    return traceId
  }

  /**
   * Start child span
   */
  startSpan(
    traceId: string, 
    operationName: string, 
    parentSpanId?: string,
    tags: Record<string, unknown> = {}
  ): string {
    const trace = this.traces.get(traceId)
    if (!trace) {
      throw new Error(`Trace ${traceId} not found`)
    }

    const spanId = this.generateSpanId()
    
    const span: TraceSpan = {
      trace_id: traceId,
      span_id: spanId,
      parent_span_id: parentSpanId,
      operation_name: operationName,
      start_time: Date.now(),
      tags,
      logs: [],
      status: 'ok'
    }

    trace.spans.push(span)
    this.activeSpans.set(spanId, span)

    return spanId
  }

  /**
   * Finish span
   */
  finishSpan(spanId: string, status: 'ok' | 'error' | 'timeout' = 'ok'): void {
    const span = this.activeSpans.get(spanId)
    if (!span) {
      console.warn(`Span ${spanId} not found`)
      return
    }

    span.end_time = Date.now()
    span.duration = span.end_time - span.start_time
    span.status = status

    this.activeSpans.delete(spanId)

    // Update trace if this is the root span
    const trace = this.traces.get(span.trace_id)
    if (trace && span.span_id === trace.root_span.span_id) {
      this.finalizeTrace(trace)
    }

    console.log(`Finished span ${spanId} (${span.duration}ms) - ${status}`)
  }

  /**
   * Add log to span
   */
  addSpanLog(
    spanId: string, 
    level: 'info' | 'warn' | 'error',
    message: string,
    fields?: Record<string, unknown>
  ): void {
    const span = this.activeSpans.get(spanId)
    if (!span) return

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields
    })
  }

  /**
   * Add tags to span
   */
  addSpanTags(spanId: string, tags: Record<string, unknown>): void {
    const span = this.activeSpans.get(spanId)
    if (!span) return

    Object.assign(span.tags, tags)
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): PerformanceTrace | null {
    return this.traces.get(traceId) || null
  }

  /**
   * Get recent traces
   */
  getRecentTraces(limit = 50): PerformanceTrace[] {
    return Array.from(this.traces.values())
      .sort((a, b) => b.root_span.start_time - a.root_span.start_time)
      .slice(0, limit)
  }

  /**
   * Get traces by operation
   */
  getTracesByOperation(operationName: string): PerformanceTrace[] {
    return Array.from(this.traces.values())
      .filter(trace => trace.root_span.operation_name === operationName)
  }

  /**
   * Finalize trace and calculate bottlenecks
   */
  private finalizeTrace(trace: PerformanceTrace): void {
    trace.total_duration = trace.root_span.duration || 0

    // Find bottlenecks (spans taking >20% of total time)
    trace.bottlenecks = trace.spans
      .filter(span => span.duration && span.duration > trace.total_duration * 0.2)
      .map(span => ({
        span_name: span.operation_name,
        duration: span.duration!,
        percentage: (span.duration! / trace.total_duration) * 100
      }))
      .sort((a, b) => b.duration - a.duration)

    // Find error spans
    trace.errors = trace.spans.filter(span => span.status === 'error')

    // Cleanup old traces if needed
    if (this.traces.size > this.maxTraces) {
      this.cleanupOldTraces()
    }
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return `span-${Math.random().toString(36).substr(2, 8)}`
  }

  /**
   * Cleanup old traces
   */
  private cleanupOldTraces(): void {
    const traces = Array.from(this.traces.entries())
      .sort((a, b) => a[1].root_span.start_time - b[1].root_span.start_time)
    
    const toRemove = traces.slice(0, traces.length - this.maxTraces + 100)
    toRemove.forEach(([traceId]) => this.traces.delete(traceId))

    console.log(`Cleaned up ${toRemove.length} old traces`)
  }

  /**
   * Get tracing statistics
   */
  getTracingStats(): {
    total_traces: number
    active_spans: number
    avg_trace_duration: number
    error_rate: number
    top_bottlenecks: Array<{ operation: string, avg_duration: number, count: number }>
  } {
    const traces = Array.from(this.traces.values())
    const recentTraces = traces.filter(t => 
      Date.now() - t.root_span.start_time < 60 * 60 * 1000 // Last hour
    )

    const avgDuration = recentTraces.length > 0
      ? recentTraces.reduce((sum, t) => sum + t.total_duration, 0) / recentTraces.length
      : 0

    const errorTraces = recentTraces.filter(t => t.errors.length > 0)
    const errorRate = recentTraces.length > 0 ? errorTraces.length / recentTraces.length : 0

    // Calculate top bottlenecks
    const bottleneckMap = new Map<string, { total_duration: number, count: number }>()
    
    recentTraces.forEach(trace => {
      trace.bottlenecks.forEach(bottleneck => {
        const existing = bottleneckMap.get(bottleneck.span_name) || { total_duration: 0, count: 0 }
        bottleneckMap.set(bottleneck.span_name, {
          total_duration: existing.total_duration + bottleneck.duration,
          count: existing.count + 1
        })
      })
    })

    const topBottlenecks = Array.from(bottleneckMap.entries())
      .map(([operation, data]) => ({
        operation,
        avg_duration: data.total_duration / data.count,
        count: data.count
      }))
      .sort((a, b) => b.avg_duration - a.avg_duration)
      .slice(0, 5)

    return {
      total_traces: this.traces.size,
      active_spans: this.activeSpans.size,
      avg_trace_duration: avgDuration,
      error_rate: errorRate,
      top_bottlenecks: topBottlenecks
    }
  }
}

export const tracingManager = new TracingManager()

/**
 * Trace decorator for automatic instrumentation
 */
export function traced(operationName: string, tags: Record<string, unknown> = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function(...args: any[]) {
      const traceId = tracingManager.startTrace(operationName, {
        ...tags,
        'method.name': propertyKey,
        'method.args': args.length
      })

      const spanId = tracingManager.startSpan(traceId, propertyKey)

      try {
        const result = await originalMethod.apply(this, args)
        tracingManager.finishSpan(spanId, 'ok')
        return result
      } catch (error) {
        tracingManager.addSpanLog(spanId, 'error', 
          error instanceof Error ? error.message : 'Unknown error'
        )
        tracingManager.finishSpan(spanId, 'error')
        throw error
      }
    }

    return descriptor
  }
}
