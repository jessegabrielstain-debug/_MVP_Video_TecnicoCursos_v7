
'use client'

/**
 * 🚨 SAFE PERFORMANCE MONITOR - ANTI-LOOP VERSION 🚨
 */

import React, { useEffect, useState, useRef } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'
import { useLoopProtection } from '@/utils/emergency-loop-killer'

interface SystemMetrics {
  memory: number
  cpu: number
  networkSpeed: number
  cacheHitRate: number
  responseTime: number
  errorRate: number
}

export function PerformanceMonitorSafe() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    memory: 45,
    cpu: 30,
    networkSpeed: 8.5,
    cacheHitRate: 85,
    responseTime: 150,
    errorRate: 0.01
  })
  const [isVisible, setIsVisible] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // 🚨 PROTEÇÃO ANTI-LOOP
  const { isBlocked, reset } = useLoopProtection('PerformanceMonitorSafe')
  
  useEffect(() => {
    // 🛡️ Se detectou loop, não executa
    if (isBlocked) {
      logger.warn('PerformanceMonitor bloqueado - loop detectado', { component: 'PerformanceMonitorSafe' })
      return
    }
    
    // 🚨 INTERVALO MUITO MAIS LENTO PARA EVITAR LOOPS
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') { // Só atualiza se tab está visível
        setMetrics(prev => ({
          memory: Math.max(20, Math.min(90, prev.memory + (Math.random() - 0.5) * 5)),
          cpu: Math.max(10, Math.min(80, prev.cpu + (Math.random() - 0.5) * 10)),
          networkSpeed: Math.max(1, Math.min(15, prev.networkSpeed + (Math.random() - 0.5) * 2)),
          cacheHitRate: Math.max(70, Math.min(99, prev.cacheHitRate + (Math.random() - 0.5) * 3)),
          responseTime: Math.max(50, Math.min(500, prev.responseTime + (Math.random() - 0.5) * 50)),
          errorRate: Math.max(0, Math.min(1, prev.errorRate + (Math.random() - 0.5) * 0.05))
        }))
      }
    }, 5000) // 🚨 5 segundos em vez de 2!
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isBlocked])
  
  // 🚨 Se está bloqueado, mostra botão de emergência
  if (isBlocked) {
    return (
      <div className="fixed bottom-20 right-4 p-3 bg-red-100 border border-red-300 rounded-lg shadow-lg z-40">
        <div className="text-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
          <p className="text-xs text-red-700 mb-2">Monitor bloqueado</p>
          <button
            onClick={reset}
            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Reset
          </button>
        </div>
      </div>
    )
  }
  
  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500'
    if (value >= thresholds.warning) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (value >= thresholds.warning) return <Activity className="h-4 w-4 text-yellow-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow z-40"
        title="Performance Monitor (Safe Mode)"
      >
        <Activity className="h-4 w-4 text-green-600" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 z-40">
      <Card className="border-2 shadow-xl border-green-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              Performance Monitor
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">SAFE</Badge>
            </CardTitle>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Memory Usage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3 w-3" />
                <span className="text-xs font-medium">Memória</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${getStatusColor(metrics.memory, { warning: 70, critical: 90 })}`}>
                  {metrics.memory.toFixed(1)}%
                </span>
                {getStatusIcon(metrics.memory, { warning: 70, critical: 90 })}
              </div>
            </div>
            <Progress value={metrics.memory} className="h-1" />
          </div>

          {/* CPU Usage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-3 w-3" />
                <span className="text-xs font-medium">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${getStatusColor(metrics.cpu, { warning: 70, critical: 90 })}`}>
                  {metrics.cpu.toFixed(1)}%
                </span>
                {getStatusIcon(metrics.cpu, { warning: 70, critical: 90 })}
              </div>
            </div>
            <Progress value={metrics.cpu} className="h-1" />
          </div>

          {/* Network Speed */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-3 w-3" />
                <span className="text-xs font-medium">Rede</span>
              </div>
              <span className="text-xs text-green-500">
                {metrics.networkSpeed.toFixed(1)} MB/s
              </span>
            </div>
          </div>

          {/* Response Time */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-medium">Resposta</span>
              </div>
              <span className={`text-xs ${getStatusColor(metrics.responseTime, { warning: 300, critical: 500 })}`}>
                {metrics.responseTime.toFixed(0)}ms
              </span>
            </div>
          </div>

          {/* Overall Status */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                Modo Seguro Ativo
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
