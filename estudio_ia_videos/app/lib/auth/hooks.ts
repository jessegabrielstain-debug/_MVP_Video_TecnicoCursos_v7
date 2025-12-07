// Auth hooks stub
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export interface User {
  id: string
  email: string
  name?: string
  role?: string
  avatar_url?: string
}

export function useAuth() {
  const { data: session, status } = useSession()

  const user = useMemo((): User | null => {
    if (!session?.user) return null
    const sessionUser = session.user as { id?: string; role?: string; email?: string | null; name?: string | null; image?: string | null };
    return {
      id: sessionUser.id || '',
      email: sessionUser.email || '',
      name: sessionUser.name || undefined,
      role: sessionUser.role || 'user',
      avatar_url: sessionUser.image || undefined
    }
  }, [session])

  return {
    user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    session
  }
}

export function useRequireAuth(redirectUrl = '/login') {
  const { isAuthenticated, isLoading } = useAuth()

  return {
    isAuthenticated,
    isLoading,
    shouldRedirect: !isLoading && !isAuthenticated
  }
}

export function useRole() {
  const { user } = useAuth()
  
  return {
    role: user?.role || 'user',
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor' || user?.role === 'admin',
    isViewer: true
  }
}
