'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook para verificar se o usuário possui uma permissão específica
 * 
 * @param permission - Nome da permissão (ex: 'users.create', 'videos.edit')
 * @returns Objeto com estado de carregamento, resultado e erro
 * 
 * @example
 * const { hasPermission, loading } = usePermission('users.create')
 * if (loading) return <Spinner />
 * if (!hasPermission) return <Forbidden />
 */
export function usePermission(permission: string) {
  const [hasPermission, setHasPermission] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function checkPermission() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setHasPermission(false)
          setLoading(false)
          return
        }

        const { data, error: rpcError } = await supabase.rpc('user_has_permission', {
          user_id: user.id,
          permission_name: permission
        })

        if (rpcError) {
          throw rpcError
        }

        setHasPermission(data === true)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao verificar permissão'))
        setHasPermission(false)
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [permission])

  return { hasPermission, loading, error }
}

/**
 * Hook para obter o role do usuário atual
 * 
 * @returns Objeto com role, carregamento e erro
 * 
 * @example
 * const { role, loading } = useRole()
 * if (role === 'admin') return <AdminPanel />
 */
export function useRole() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchRole() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setRole(null)
          setLoading(false)
          return
        }

        const { data, error: rpcError } = await supabase.rpc('user_role', {
          user_id: user.id
        })

        if (rpcError) {
          throw rpcError
        }

        setRole(data as string | null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao buscar role'))
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [])

  return { role, loading, error }
}

/**
 * Hook para verificar se o usuário é administrador
 * 
 * @returns Objeto com estado de admin, carregamento e erro
 * 
 * @example
 * const { isAdmin, loading } = useIsAdmin()
 * if (!isAdmin) return <Navigate to="/dashboard" />
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        const { data, error: rpcError } = await supabase.rpc('is_admin', {
          user_id: user.id
        })

        if (rpcError) {
          throw rpcError
        }

        setIsAdmin(data === true)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao verificar admin'))
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  return { isAdmin, loading, error }
}

/**
 * Hook para obter todos os roles do usuário
 * 
 * @returns Objeto com array de roles, carregamento e erro
 * 
 * @example
 * const { roles, loading } = useUserRoles()
 * if (roles.includes('editor')) return <EditorTools />
 */
export function useUserRoles() {
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchRoles() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setRoles([])
          setLoading(false)
          return
        }

        const { data, error: queryError } = await supabase
          .from('user_roles')
          .select('role:roles(name)')
          .eq('user_id', user.id)

        if (queryError) {
          throw queryError
        }

        const roleNames = data
          ?.map((item: { role: { name: string } | null }) => item.role?.name)
          .filter((name): name is string => name !== null && name !== undefined) || []

        setRoles(roleNames)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao buscar roles'))
        setRoles([])
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [])

  return { roles, loading, error }
}

/**
 * Hook para verificar se usuário possui pelo menos um dos roles especificados
 * 
 * @param requiredRoles - Array de roles permitidos
 * @returns Objeto com resultado da verificação, carregamento e erro
 * 
 * @example
 * const { hasRole, loading } = useHasRole(['admin', 'editor'])
 * if (!hasRole) return <Forbidden />
 */
export function useHasRole(requiredRoles: string[]) {
  const { roles, loading, error } = useUserRoles()
  const hasRole = roles.some(role => requiredRoles.includes(role))

  return { hasRole, loading, error }
}
