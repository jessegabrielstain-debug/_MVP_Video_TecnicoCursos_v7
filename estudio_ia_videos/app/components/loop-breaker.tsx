
'use client'

/**
 * 🔄 LOOP BREAKER - Detecta e quebra loops infinitos de useEffect
 */

import React, { useEffect, useRef, useState } from 'react'
import { logger } from '@/lib/logger';
import { AlertTriangle, Zap } from 'lucide-react'

interface LoopBreakerProps {
  children: React.ReactNode
  maxRenders?: number
  timeWindow?: number
  onLoopDetected?: () => void
}

export function LoopBreaker({
  children,
  maxRenders = 50,
  timeWindow = 5000, // 5 seconds
  onLoopDetected
}: LoopBreakerProps) {
  const renderCountRef = useRef(0)
  const timeWindowStartRef = useRef(Date.now())
  const [isLoopDetected, setIsLoopDetected] = useState(false)
  const [renderStats, setRenderStats] = useState({
    count: 0,
    timeElapsed: 0
  })

  useEffect(() => {
    const now = Date.now()
    renderCountRef.current += 1
    
    // Reset counter if time window passed
    if (now - timeWindowStartRef.current > timeWindow) {
      renderCountRef.current = 1
      timeWindowStartRef.current = now
    }
    
    const timeElapsed = now - timeWindowStartRef.current
    
    setRenderStats({
      count: renderCountRef.current,
      timeElapsed
    })

    // Detect loop
    if (renderCountRef.current > maxRenders) {
      logger.warn('🚨 LOOP DETECTED: Too many renders in short time', {
        component: 'LoopBreaker',
        renders: renderCountRef.current,
        timeWindow: timeElapsed,
        maxAllowed: maxRenders
      });
      
      setIsLoopDetected(true)
      onLoopDetected?.()
      
      // Force break the loop
      renderCountRef.current = 0
      timeWindowStartRef.current = now
    }
  })

  if (isLoopDetected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
        <div className="text-center space-y-6 max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg border border-yellow-200">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-yellow-900 mb-2">Loop Infinito Detectado</h2>
            <p className="text-yellow-700 text-sm">
              Sistema detectou renderizações excessivas e interrompeu automaticamente
            </p>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 text-left">
            <strong>Estatísticas:</strong><br/>
            • Renders: {renderStats.count}/{maxRenders}<br/>
            • Tempo: {Math.round(renderStats.timeElapsed)}ms<br/>
            • Janela: {timeWindow}ms
          </div>

          <button
            onClick={() => {
              setIsLoopDetected(false)
              renderCountRef.current = 0
              timeWindowStartRef.current = Date.now()
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
          >
            <Zap className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default LoopBreaker
