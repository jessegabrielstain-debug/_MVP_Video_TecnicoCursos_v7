
/**
 * ⚡ Performance Monitor - Monitoramento de Performance em Tempo Real
 * Para acompanhar métricas do sistema durante renderização
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  Thermometer, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface PerformanceMetrics {
  cpu: number
  memory: number
  disk: number
  temperature: number
  renderSpeed: number
  networkSpeed: number
  timestamp: Date
}

interface PerformanceMonitorProps {
  showDetailed?: boolean
  updateInterval?: number
}

export default function PerformanceMonitor({ 
  showDetailed = true, 
  updateInterval = 2000 
}: PerformanceMonitorProps) {
  
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    temperature: 0,
    renderSpeed: 0,
    networkSpeed: 0,
    timestamp: new Date()
  })
  
  const [previousMetrics, setPreviousMetrics] = useState<PerformanceMetrics | null>(null)
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([])
  const intervalRef = useRef<NodeJS.Timeout>()

  // Simular métricas do sistema
  const generateMetrics = (): PerformanceMetrics => {
    // Simular variações realísticas baseadas no estado anterior
    const base = currentMetrics
    
    return {
      cpu: Math.max(0, Math.min(100, base.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(0, Math.min(100, base.memory + (Math.random() - 0.5) * 5)),
      disk: Math.max(0, Math.min(100, base.disk + (Math.random() - 0.5) * 2)),
      temperature: Math.max(30, Math.min(85, base.temperature + (Math.random() - 0.5) * 3)),
      renderSpeed: Math.max(0, base.renderSpeed + (Math.random() - 0.5) * 0.5),
      networkSpeed: Math.max(0, Math.random() * 1000),
      timestamp: new Date()
    }
  }

  // Inicializar com valores base
  useEffect(() => {
    setCurrentMetrics({
      cpu: 15 + Math.random() * 20,
      memory: 45 + Math.random() * 15,
      disk: 65 + Math.random() * 10,
      temperature: 50 + Math.random() * 15,
      renderSpeed: 0,
      networkSpeed: Math.random() * 500,
      timestamp: new Date()
    })
  }, [])

  // Atualizar métricas
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPreviousMetrics(currentMetrics)
      const newMetrics = generateMetrics()
      setCurrentMetrics(newMetrics)
      
      // Manter histórico dos últimos 30 pontos
      setMetricsHistory(prev => {
        const updated = [...prev, newMetrics]
        return updated.slice(-30)
      })
    }, updateInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentMetrics, updateInterval])

  // Calcular trend
  const getTrend = (current: number, previous: number | undefined) => {
    if (!previous) return 'neutral'
    const diff = current - previous
    if (Math.abs(diff) < 1) return 'neutral'
    return diff > 0 ? 'up' : 'down'
  }

  // Obter cor baseada na métrica
  const getMetricColor = (value: number, type: 'cpu' | 'memory' | 'disk' | 'temperature') => {
    const thresholds = {
      cpu: { warning: 70, critical: 85 },
      memory: { warning: 80, critical: 90 },
      disk: { warning: 85, critical: 95 },
      temperature: { warning: 70, critical: 80 }
    }

    const threshold = thresholds[type]
    if (value >= threshold.critical) return 'text-red-500'
    if (value >= threshold.warning) return 'text-yellow-500'
    return 'text-green-500'
  }

  // Ícone de trend
  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />
      default: return <Minus className="h-3 w-3 text-muted-foreground" />
    }
  }

  // Componente de métrica
  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    unit, 
    type,
    previousValue 
  }: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: number
    unit: string
    type: 'cpu' | 'memory' | 'disk' | 'temperature'
    previousValue?: number
  }) => {
    const trend = getTrend(value, previousValue)
    const colorClass = getMetricColor(value, type)

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", colorClass)} />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <TrendIcon trend={trend} />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className={cn("text-xl font-bold", colorClass)}>
                {value.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            
            <Progress 
              value={type === 'temperature' ? (value / 100) * 100 : value} 
              className="h-1"
            />
            
            {showDetailed && previousValue !== undefined && (
              <div className="text-xs text-muted-foreground">
                {trend === 'up' && '↗'} {trend === 'down' && '↘'} 
                {Math.abs(value - previousValue).toFixed(1)} desde último
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      
      {/* Header com status geral */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Monitor</h3>
          <p className="text-sm text-muted-foreground">
            Atualizado a cada {updateInterval / 1000}s
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Sistema Ativo
          </Badge>
          
          {currentMetrics.renderSpeed > 0 && (
            <Badge className="flex items-center gap-1 bg-blue-500">
              <Zap className="h-3 w-3" />
              {currentMetrics.renderSpeed.toFixed(1)}x
            </Badge>
          )}
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <MetricCard
          icon={Cpu}
          label="CPU"
          value={currentMetrics.cpu}
          unit="%"
          type="cpu"
          previousValue={previousMetrics?.cpu}
        />

        <MetricCard
          icon={HardDrive}
          label="Memória"
          value={currentMetrics.memory}
          unit="%"
          type="memory"
          previousValue={previousMetrics?.memory}
        />

        <MetricCard
          icon={HardDrive}
          label="Disco"
          value={currentMetrics.disk}
          unit="%"
          type="disk"
          previousValue={previousMetrics?.disk}
        />

        <MetricCard
          icon={Thermometer}
          label="Temperatura"
          value={currentMetrics.temperature}
          unit="°C"
          type="temperature"
          previousValue={previousMetrics?.temperature}
        />

      </div>

      {/* Métricas adicionais detalhadas */}
      {showDetailed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Velocidade de Renderização</CardTitle>
              <CardDescription>
                Multiplicador da velocidade real de renderização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {currentMetrics.renderSpeed.toFixed(1)}x
                </span>
                <span className="text-sm text-muted-foreground">tempo real</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {currentMetrics.renderSpeed === 0 && 'Sistema em standby'}
                {currentMetrics.renderSpeed > 0 && currentMetrics.renderSpeed < 1 && 'Renderização mais lenta que tempo real'}
                {currentMetrics.renderSpeed >= 1 && currentMetrics.renderSpeed < 2 && 'Renderização em tempo real'}
                {currentMetrics.renderSpeed >= 2 && 'Renderização acelerada'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rede</CardTitle>
              <CardDescription>
                Velocidade de download/upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {currentMetrics.networkSpeed.toFixed(0)}
                </span>
                <span className="text-sm text-muted-foreground">Mbps</span>
              </div>
              <div className="mt-2">
                <Progress value={(currentMetrics.networkSpeed / 1000) * 100} className="h-1" />
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* Alertas de performance */}
      {(currentMetrics.cpu > 85 || currentMetrics.memory > 90 || currentMetrics.temperature > 80) && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-700">
              <Activity className="h-4 w-4" />
              <span className="font-medium">Alerta de Performance</span>
            </div>
            <div className="mt-2 text-sm text-yellow-600">
              {currentMetrics.cpu > 85 && 'CPU em uso elevado. '}
              {currentMetrics.memory > 90 && 'Memória quase esgotada. '}
              {currentMetrics.temperature > 80 && 'Temperatura alta detectada. '}
              Considere reduzir a carga de trabalho.
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
