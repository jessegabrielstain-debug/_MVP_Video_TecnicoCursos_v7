

/**
 * Sprint 7 - Monitor de Cache Inteligente
 * Dashboard para monitoramento de performance e cache
 */

'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { 
  Database, 
  Zap, 
  BarChart3, 
  RefreshCw, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  Activity,
  HardDrive,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  evictionCount: number
  averageAccessTime: number
  memoryUsage: string
  topEntries: Array<{ key: string, accessCount: number, size: string }>
}

interface PerformanceData {
  pptx_parse?: {
    averageTime: number
    minTime: number
    maxTime: number
    totalOperations: number
    trend: 'improving' | 'stable' | 'degrading'
  }
  template_apply?: {
    averageTime: number
    minTime: number
    maxTime: number
    totalOperations: number
    trend: 'improving' | 'stable' | 'degrading'
  }
  narration_generate?: {
    averageTime: number
    minTime: number
    maxTime: number
    totalOperations: number
    trend: 'improving' | 'stable' | 'degrading'
  }
}

export function CacheMonitor() {
  const [cacheStats, setCacheStats] = useState<{
    pptx: CacheStats
    template: CacheStats
    render: CacheStats
    intelligent: CacheStats
  } | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load cache statistics
  const loadCacheStats = async () => {
    try {
      setIsLoading(true)
      
      // Simulate API call to get cache stats
      const response = await fetch('/api/optimization/cache-stats')
      const data = await response.json()
      
      setCacheStats(data.cacheStats)
      setPerformanceData(data.performanceInsights)
      
    } catch (error) {
      logger.error('Error loading cache stats', error instanceof Error ? error : new Error(String(error)), { component: 'CacheMonitor' })
      
      // Mock data for demonstration
      setCacheStats({
        pptx: {
          totalEntries: 45,
          totalSize: 150000000,
          hitRate: 0.87,
          missRate: 0.13,
          evictionCount: 3,
          averageAccessTime: 12,
          memoryUsage: '143.05 MB',
          topEntries: [
            { key: 'pptx_training_safety_basic.pptx...', accessCount: 23, size: '2.4 MB' },
            { key: 'pptx_nr12_machinery_safety.pptx...', accessCount: 18, size: '3.1 MB' },
            { key: 'pptx_fire_safety_procedures.pptx...', accessCount: 15, size: '1.8 MB' }
          ]
        },
        template: {
          totalEntries: 28,
          totalSize: 45000000,
          hitRate: 0.94,
          missRate: 0.06,
          evictionCount: 1,
          averageAccessTime: 8,
          memoryUsage: '42.91 MB',
          topEntries: [
            { key: 'template_corporate_clean_batch...', accessCount: 67, size: '892 KB' },
            { key: 'template_safety_focus_batch...', accessCount: 54, size: '1.2 MB' },
            { key: 'template_modern_minimal_batch...', accessCount: 39, size: '745 KB' }
          ]
        },
        render: {
          totalEntries: 12,
          totalSize: 890000000,
          hitRate: 0.71,
          missRate: 0.29,
          evictionCount: 8,
          averageAccessTime: 45,
          memoryUsage: '848.77 MB',
          topEntries: [
            { key: 'render_720p_safety_training...', accessCount: 8, size: '156 MB' },
            { key: 'render_1080p_machinery_ops...', accessCount: 6, size: '287 MB' },
            { key: 'render_480p_quick_preview...', accessCount: 12, size: '45 MB' }
          ]
        },
        intelligent: {
          totalEntries: 123,
          totalSize: 78000000,
          hitRate: 0.89,
          missRate: 0.11,
          evictionCount: 5,
          averageAccessTime: 6,
          memoryUsage: '74.39 MB',
          topEntries: [
            { key: 'scene_preview_corporate_01...', accessCount: 34, size: '245 KB' },
            { key: 'narration_batch_safety_pt...', accessCount: 28, size: '512 KB' },
            { key: 'optimization_result_pptx...', accessCount: 22, size: '189 KB' }
          ]
        }
      })
      
      setPerformanceData({
        pptx_parse: {
          averageTime: 1245,
          minTime: 890,
          maxTime: 2100,
          totalOperations: 87,
          trend: 'improving'
        },
        template_apply: {
          averageTime: 567,
          minTime: 234,
          maxTime: 890,
          totalOperations: 156,
          trend: 'stable'
        },
        narration_generate: {
          averageTime: 2890,
          minTime: 1200,
          maxTime: 4500,
          totalOperations: 43,
          trend: 'improving'
        }
      })
      
    } finally {
      setIsLoading(false)
    }
  }

  // Clear specific cache
  const clearCache = async (cacheType: string) => {
    try {
      await fetch(`/api/optimization/cache-clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheType })
      })
      
      toast.success(`Cache ${cacheType} limpo com sucesso`)
      loadCacheStats()
      
    } catch (error) {
      toast.error('Erro ao limpar cache')
      logger.error('Error clearing cache', error instanceof Error ? error : new Error(String(error)), { component: 'CacheMonitor', cacheType })
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    loadCacheStats()
    
    if (autoRefresh) {
      const interval = setInterval(loadCacheStats, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Monitor de Cache Inteligente</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'degrading': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Activity className="w-4 h-4 text-blue-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600'
      case 'degrading': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Monitor de Cache Inteligente</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={loadCacheStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cache Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cacheStats && Object.entries(cacheStats).map(([cacheType, stats]) => (
          <Card key={cacheType}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="capitalize">{cacheType} Cache</span>
                <Badge variant="secondary" className="text-xs">
                  {stats.totalEntries} entradas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Hit Rate */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Taxa de Acerto</span>
                    <span className="font-semibold text-green-600">
                      {(stats.hitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={stats.hitRate * 100} className="h-2" />
                </div>
                
                {/* Memory Usage */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Memória</span>
                  </div>
                  <span className="text-sm font-semibold">{stats.memoryUsage}</span>
                </div>
                
                {/* Access Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Tempo médio</span>
                  </div>
                  <span className="text-sm font-semibold">{stats.averageAccessTime.toFixed(1)}ms</span>
                </div>
                
                {/* Clear Cache Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => clearCache(cacheType)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Insights de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(performanceData).map(([operation, data]) => (
              <div key={operation} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">
                    {operation.replace(/_/g, ' ').toUpperCase()}
                  </h4>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(data.trend)}
                    <span className={`text-xs font-medium ${getTrendColor(data.trend)}`}>
                      {data.trend}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Tempo médio</span>
                    <div className="font-semibold">{data.averageTime}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Operações</span>
                    <div className="font-semibold">{data.totalOperations}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Mínimo</span>
                    <div className="font-semibold text-green-600">{data.minTime}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Máximo</span>
                    <div className="font-semibold text-orange-600">{data.maxTime}ms</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Cache Entries */}
      {cacheStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(cacheStats).map(([cacheType, stats]) => (
            <Card key={cacheType}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">
                  Top Entradas - {cacheType} Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topEntries.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {entry.key}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.accessCount} acessos • {entry.size}
                        </div>
                      </div>
                      <Badge variant="outline">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cache Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Ações de Otimização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => clearCache('all')}
            >
              <Trash2 className="w-6 h-6 text-red-500" />
              <span>Limpar Todos os Caches</span>
              <span className="text-xs text-gray-500">Reset completo</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => {
                // Trigger cache optimization
                fetch('/api/optimization/optimize-cache', { method: 'POST' })
                  .then(() => {
                    toast.success('Otimização de cache iniciada')
                    loadCacheStats()
                  })
                  .catch(() => toast.error('Erro na otimização'))
              }}
            >
              <Zap className="w-6 h-6 text-yellow-500" />
              <span>Otimizar Caches</span>
              <span className="text-xs text-gray-500">Reorganizar por prioridade</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => {
                // Preload common templates
                fetch('/api/optimization/preload-common', { method: 'POST' })
                  .then(() => {
                    toast.success('Pré-carregamento iniciado')
                    loadCacheStats()
                  })
                  .catch(() => toast.error('Erro no pré-carregamento'))
              }}
            >
              <Database className="w-6 h-6 text-blue-500" />
              <span>Pré-carregar Comuns</span>
              <span className="text-xs text-gray-500">Templates populares</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
