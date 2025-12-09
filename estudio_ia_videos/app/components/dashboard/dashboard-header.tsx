
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { logger } from '@/lib/logger'
import { Video, User, LogOut, Settings, Shield } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isAdminUser } from '@/lib/auth/admin-middleware'
import { createBrowserSupabaseClient } from '@/lib/services'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export default function DashboardHeader() {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const loadProfile = useCallback(
    async (authUser: SupabaseUser | null) => {
      if (!authUser) {
        setDisplayName(null)
        setAvatarUrl(null)
        return
      }

      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', authUser.id)
          .maybeSingle()

        if (error) {
          logger.warn('Não foi possível carregar perfil do usuário', { component: 'DashboardHeader', error: String(error) })
        }

        setDisplayName(profile?.name ?? authUser.user_metadata?.name ?? authUser.email ?? null)
        setAvatarUrl(profile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null)
      } catch (error) {
        logger.error('Erro ao carregar perfil do usuário', error instanceof Error ? error : new Error(String(error)), { component: 'DashboardHeader' })
        setDisplayName(authUser.user_metadata?.name ?? authUser.email ?? null)
        setAvatarUrl(authUser.user_metadata?.avatar_url ?? null)
      }
    },
    [supabase]
  )

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!isMounted) return
      setUser(data.user ?? null)
      await loadProfile(data.user ?? null)
    }

    void init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      const authUser = session?.user ?? null
      setUser(authUser)
      void loadProfile(authUser)
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [loadProfile, supabase])

  const handleSignOut = useCallback(async () => {
    if (signingOut) return
    try {
      setSigningOut(true)
      toast.success('Encerrando sessão...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      toast.success('Sessão finalizada')
      router.replace('/login?reason=session_expired')
      router.refresh()
    } catch (error) {
      logger.error('Erro ao sair', error instanceof Error ? error : new Error(String(error)), { component: 'DashboardHeader' })
      toast.error('Não foi possível encerrar a sessão. Tente novamente.')
    } finally {
      setSigningOut(false)
    }
  }, [router, signingOut, supabase])

  const userInitials = (displayName ?? user?.email ?? 'U')
    ?.split(' ')
    ?.map((word: string) => word[0])
    ?.join('')
    ?.toUpperCase() || 'U'

  const isAdmin = isAdminUser(user?.email)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Estúdio IA</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled={!user}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{displayName ?? 'Usuário'}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email ?? 'usuario@exemplo.com'}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center w-full">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Painel Admin</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{signingOut ? 'Saindo...' : 'Sair'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
