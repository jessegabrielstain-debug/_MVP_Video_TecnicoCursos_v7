'use client'

import React, { useEffect, useState } from 'react'
import { Coins, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface QuotaData {
  remaining: number
  used: number
  resetDate?: string
  error?: string
}

interface HeyGenCreditsWidgetProps {
  className?: string
}

export function HeyGenCreditsWidget({ className }: HeyGenCreditsWidgetProps) {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuota = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/heygen/credits')
      if (!response.ok) {
        throw new Error('Failed to fetch credits')
      }
      const data = await response.json()
      if (data.error) {
        setError(data.error)
      } else {
        setQuota(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuota()
    // Refresh every 5 minutes
    const interval = setInterval(fetchQuota, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (error || !quota) return 'text-gray-400'
    if (quota.remaining <= 0) return 'text-red-400'
    if (quota.remaining < 10) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusBg = () => {
    if (error || !quota) return 'bg-gray-700'
    if (quota.remaining <= 0) return 'bg-red-900/30'
    if (quota.remaining < 10) return 'bg-yellow-900/30'
    return 'bg-green-900/30'
  }

  const formatResetDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      })
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-700', className)}>
        <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">Carregando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-900/30 cursor-help', className)}>
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-red-400">Erro</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-sm">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-1 text-xs w-full"
              onClick={fetchQuota}
            >
              Tentar novamente
            </Button>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md cursor-default transition-colors',
            getStatusBg(),
            className
          )}>
            <Coins className={cn('h-4 w-4', getStatusColor())} />
            <span className={cn('text-xs font-medium', getStatusColor())}>
              {quota?.remaining ?? 0} créditos
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-56">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disponível:</span>
              <span className="font-medium">{quota?.remaining ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Utilizado:</span>
              <span className="font-medium">{quota?.used ?? 0}</span>
            </div>
            {quota?.resetDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Renova em:</span>
                <span className="font-medium">{formatResetDate(quota.resetDate)}</span>
              </div>
            )}
            <div className="pt-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={fetchQuota}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
