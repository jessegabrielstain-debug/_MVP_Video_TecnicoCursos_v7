
'use client'

/**
 * 🚨 EMERGENCY LOOP KILLER SYSTEM 🚨
 * Sistema de emergência para detectar e quebrar loops infinitos
 */

import { useEffect, useRef, useState } from 'react'

// Global loop detection registry
const LOOP_DETECTION_REGISTRY = new Map<string, {
  count: number
  lastExecution: number
  blocked: boolean
}>()

// Emergency circuit breaker
export class LoopKiller {
  static MAX_EXECUTIONS = 10
  static TIME_WINDOW = 3000 // 3 segundos
  static BLOCKED_TIMEOUT = 10000 // 10 segundos bloqueado

  static isLoopDetected(componentId: string): boolean {
    const now = Date.now()
    const entry = LOOP_DETECTION_REGISTRY.get(componentId)
    
    if (!entry) {
      LOOP_DETECTION_REGISTRY.set(componentId, {
        count: 1,
        lastExecution: now,
        blocked: false
      })
      return false
    }
    
    // Se está bloqueado, check se pode desbloquear
    if (entry.blocked) {
      if (now - entry.lastExecution > this.BLOCKED_TIMEOUT) {
        entry.blocked = false
        entry.count = 1
        entry.lastExecution = now
        console.log(`🔓 [LOOP KILLER] Desbloqueado: ${componentId}`)
        return false
      }
      console.warn(`⛔ [LOOP KILLER] Bloqueado: ${componentId}`)
      return true
    }
    
    // Reset counter se passou do time window
    if (now - entry.lastExecution > this.TIME_WINDOW) {
      entry.count = 1
      entry.lastExecution = now
      return false
    }
    
    // Incrementa counter
    entry.count++
    entry.lastExecution = now
    
    // Detecta loop
    if (entry.count > this.MAX_EXECUTIONS) {
      entry.blocked = true
      console.error(`🚨 [LOOP KILLER] LOOP INFINITO DETECTADO: ${componentId} - BLOQUEANDO!`)
      return true
    }
    
    if (entry.count > 5) {
      console.warn(`⚠️ [LOOP KILLER] Alerta: ${componentId} executou ${entry.count} vezes`)
    }
    
    return false
  }
  
  static reset(componentId?: string) {
    if (componentId) {
      LOOP_DETECTION_REGISTRY.delete(componentId)
      console.log(`🔄 [LOOP KILLER] Reset: ${componentId}`)
    } else {
      LOOP_DETECTION_REGISTRY.clear()
      console.log('🔄 [LOOP KILLER] Reset total')
    }
  }
  
  static getStatus() {
    const entries = Array.from(LOOP_DETECTION_REGISTRY.entries())
    return entries.map(([id, data]) => ({
      componentId: id,
      executions: data.count,
      isBlocked: data.blocked,
      lastExecution: new Date(data.lastExecution).toLocaleTimeString()
    }))
  }
}

type EmergencyLoopKillerAPI = {
  status: () => ReturnType<typeof LoopKiller.getStatus>
  reset: (componentId?: string) => void
  resetAll: () => void
  info: () => void
}

declare global {
  interface Window {
    emergencyLoopKiller?: EmergencyLoopKillerAPI
  }
}

// Hook para proteger componentes
export function useLoopProtection(componentId: string, dependencies: unknown[] = []) {
  const executionCountRef = useRef(0)
  const lastExecutionRef = useRef(0)
  
  useEffect(() => {
    const now = Date.now()
    executionCountRef.current++
    
    // Check if loop detected
    if (LoopKiller.isLoopDetected(componentId)) {
      console.error(`🛑 [${componentId}] EXECUÇÃO BLOQUEADA - Loop detectado!`)
      return
    }
    
    lastExecutionRef.current = now
    
    return () => {
      // Cleanup logic if needed
    }
  }, dependencies)
  
  return {
    isBlocked: LoopKiller.isLoopDetected(componentId),
    executionCount: executionCountRef.current,
    reset: () => LoopKiller.reset(componentId)
  }
}

// Componente de monitoramento de loops
export function LoopDetectionMonitor() {
  const [status, setStatus] = useState<ReturnType<typeof LoopKiller.getStatus>>([])
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(LoopKiller.getStatus())
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  if (status.length === 0) return null
  
  return (
    <div className="fixed top-4 right-4 bg-red-100 border border-red-300 rounded-lg p-3 max-w-sm z-50">
      <h3 className="font-bold text-red-800 mb-2">🚨 Loop Detection Status</h3>
      {status.map((item) => (
        <div key={item.componentId} className={`text-xs mb-1 ${item.isBlocked ? 'text-red-700' : 'text-orange-700'}`}>
          <strong>{item.componentId}:</strong> {item.executions}x
          {item.isBlocked && <span className="ml-2 bg-red-200 px-1 rounded">BLOCKED</span>}
        </div>
      ))}
      <button 
        onClick={() => LoopKiller.reset()}
        className="mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
      >
        Reset All
      </button>
    </div>
  )
}

// 🚨 EMERGENCY GLOBAL LOOP KILLER - Adiciona ao window para acesso via console
if (typeof window !== 'undefined') {
  window.emergencyLoopKiller = {
    status: () => LoopKiller.getStatus(),
    reset: (componentId?: string) => LoopKiller.reset(componentId),
    resetAll: () => LoopKiller.reset(),
    info: () => console.log('🚨 Emergency Loop Killer Commands:\n- status()\n- reset(componentId)\n- resetAll()')
  }
  
  // Log inicial
  console.log('🚨 Emergency Loop Killer loaded. Type "emergencyLoopKiller.info()" for commands.')
}

// Emergency timeout wrapper
export function withTimeout<T extends (...args: any[]) => any>(
  fn: T, 
  timeout: number = 5000,
  componentId: string = 'unknown'
): T {
  return ((...args: Parameters<T>) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.error(`⏰ [TIMEOUT] ${componentId} excedeu ${timeout}ms`)
        reject(new Error(`Timeout: ${componentId}`))
      }, timeout)
      
      try {
        const result = fn(...args)
        clearTimeout(timeoutId)
        resolve(result)
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }) as T
}
