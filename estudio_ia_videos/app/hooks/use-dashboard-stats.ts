
import useSWR from 'swr'
import { useAuth } from '@/hooks/use-auth'

export interface DashboardStats {
  totalProjects: number
  activeRenders: number
  completedToday: number
  totalViews: number
  avgRenderTime: number
  systemHealth: 'healthy' | 'warning' | 'error'
}

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) {
      // Silenciar 401 para evitar ruído quando não autenticado; retorna null
      if (res.status === 401) return null
      throw new Error(`HTTP ${res.status}`)
    }
    return await res.json()
  } catch (e) {
    // Tratar abortos de navegação/HMR sem lançar
    return null
  }
}

export function useDashboardStats() {
  const { user, loading } = useAuth()
  const { data, error, isLoading } = useSWR<DashboardStats>(
    user ? '/api/dashboard/unified-stats' : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      isPaused: () => loading || !user,
    }
  )

  return {
    stats: data,
    isLoading,
    isError: error
  }
}
