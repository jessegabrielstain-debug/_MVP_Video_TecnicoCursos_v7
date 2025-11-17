
'use client'

import { useEffect, useState } from 'react'
import { useRenderCounter } from '@/lib/debug-utils'

interface EffectMonitorProps {
  children: React.ReactNode
  componentName?: string
}

export function EffectMonitor({ children, componentName = 'UnknownComponent' }: EffectMonitorProps) {
  const [stats, setStats] = useState<{ [key: string]: number }>({})
  
  // Monitor renders
  useRenderCounter(`EffectMonitor:${componentName}`)
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        // Aqui você pode coletar estatísticas de debug se necessário
        const effectDebugger = (window as Window & { _effectDebugger?: { getStats: () => typeof stats } })._effectDebugger
        if (effectDebugger) {
          setStats(effectDebugger.getStats())
        }
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [])

  // Em produção, apenas renderizar children
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }

  return (
    <div>
      {children}
      
      {/* Debug overlay - visível apenas em desenvolvimento */}
      {Object.keys(stats).length > 0 && (
        <div 
          className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs max-w-xs z-50"
          style={{ fontSize: '10px' }}
        >
          <div className="font-bold mb-1">Effect Stats:</div>
          {Object.entries(stats)
            .filter(([_, count]) => count > 10)
            .slice(0, 5)
            .map(([key, count]) => (
              <div key={key} className="truncate">
                {key}: {count}x
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
