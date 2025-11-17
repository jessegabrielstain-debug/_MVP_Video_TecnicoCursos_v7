'use client'

import { type ComponentType, type ReactNode } from 'react'
import { usePermission, useHasRole, useIsAdmin } from '@/lib/hooks/use-rbac'

/**
 * Componente de fallback padrão quando permissão negada
 */
function DefaultForbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
        <p className="text-gray-600 max-w-md">
          Você não possui permissão para acessar este conteúdo.
        </p>
      </div>
    </div>
  )
}

/**
 * Componente de fallback durante carregamento
 */
function DefaultLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

/**
 * Props para componentes protegidos por permissão
 */
interface WithPermissionProps {
  /** Componente a ser exibido quando permissão negada */
  fallback?: ComponentType | ReactNode
  /** Componente a ser exibido durante carregamento */
  loading?: ComponentType | ReactNode
}

/**
 * HOC que protege um componente baseado em permissão específica
 * 
 * @param permission - Nome da permissão necessária
 * @param Component - Componente a ser protegido
 * @param options - Opções de customização
 * @returns Componente protegido por permissão
 * 
 * @example
 * const ProtectedEditor = withPermission('videos.edit', VideoEditor)
 * 
 * @example
 * const ProtectedEditor = withPermission('videos.edit', VideoEditor, {
 *   fallback: () => <div>Sem permissão para editar</div>,
 *   loading: () => <Spinner />
 * })
 */
export function withPermission<P extends object>(
  permission: string,
  Component: ComponentType<P>,
  options: WithPermissionProps = {}
) {
  return function ProtectedComponent(props: P) {
    const { hasPermission, loading, error } = usePermission(permission)

    // Renderizar loading
    if (loading) {
      if (options.loading) {
        return typeof options.loading === 'function' 
          ? <options.loading /> 
          : options.loading
      }
      return <DefaultLoading />
    }

    // Renderizar erro ou fallback
    if (error || !hasPermission) {
      if (options.fallback) {
        return typeof options.fallback === 'function'
          ? <options.fallback />
          : options.fallback
      }
      return <DefaultForbidden />
    }

    // Renderizar componente protegido
    return <Component {...props} />
  }
}

/**
 * Props para componentes protegidos por role
 */
interface WithRoleProps extends WithPermissionProps {
  /** Se true, permite múltiplos roles (OR). Se false, exige todos (AND) */
  requireAll?: boolean
}

/**
 * HOC que protege um componente baseado em role(s)
 * 
 * @param roles - Role ou array de roles necessários
 * @param Component - Componente a ser protegido
 * @param options - Opções de customização
 * @returns Componente protegido por role
 * 
 * @example
 * const AdminPanel = withRole('admin', AdminDashboard)
 * 
 * @example
 * const EditorPanel = withRole(['editor', 'admin'], EditorTools, {
 *   fallback: () => <div>Apenas editores e admins</div>
 * })
 */
export function withRole<P extends object>(
  roles: string | string[],
  Component: ComponentType<P>,
  options: WithRoleProps = {}
) {
  return function ProtectedComponent(props: P) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles]
    const { hasRole, loading, error } = useHasRole(requiredRoles)

    // Renderizar loading
    if (loading) {
      if (options.loading) {
        return typeof options.loading === 'function'
          ? <options.loading />
          : options.loading
      }
      return <DefaultLoading />
    }

    // Renderizar erro ou fallback
    if (error || !hasRole) {
      if (options.fallback) {
        return typeof options.fallback === 'function'
          ? <options.fallback />
          : options.fallback
      }
      return <DefaultForbidden />
    }

    // Renderizar componente protegido
    return <Component {...props} />
  }
}

/**
 * HOC que protege um componente para acesso exclusivo de administradores
 * 
 * @param Component - Componente a ser protegido
 * @param options - Opções de customização
 * @returns Componente protegido para admins
 * 
 * @example
 * const AdminSettings = withAdminOnly(SettingsPanel)
 * 
 * @example
 * const AdminSettings = withAdminOnly(SettingsPanel, {
 *   fallback: () => <div>Acesso restrito a administradores</div>
 * })
 */
export function withAdminOnly<P extends object>(
  Component: ComponentType<P>,
  options: WithPermissionProps = {}
) {
  return function ProtectedComponent(props: P) {
    const { isAdmin, loading, error } = useIsAdmin()

    // Renderizar loading
    if (loading) {
      if (options.loading) {
        return typeof options.loading === 'function'
          ? <options.loading />
          : options.loading
      }
      return <DefaultLoading />
    }

    // Renderizar erro ou fallback
    if (error || !isAdmin) {
      if (options.fallback) {
        return typeof options.fallback === 'function'
          ? <options.fallback />
          : options.fallback
      }
      return <DefaultForbidden />
    }

    // Renderizar componente protegido
    return <Component {...props} />
  }
}

/**
 * Componente para renderização condicional baseada em permissão
 * 
 * @example
 * <PermissionGate permission="users.delete" fallback={<div>Sem acesso</div>}>
 *   <DeleteButton />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
  loading = <DefaultLoading />
}: {
  permission: string
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
}) {
  const { hasPermission, loading: isLoading, error } = usePermission(permission)

  if (isLoading) return <>{loading}</>
  if (error || !hasPermission) return <>{fallback}</>
  return <>{children}</>
}

/**
 * Componente para renderização condicional baseada em role
 * 
 * @example
 * <RoleGate roles={['admin', 'editor']} fallback={<div>Sem acesso</div>}>
 *   <EditorTools />
 * </RoleGate>
 */
export function RoleGate({
  roles,
  children,
  fallback = null,
  loading = <DefaultLoading />
}: {
  roles: string | string[]
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
}) {
  const requiredRoles = Array.isArray(roles) ? roles : [roles]
  const { hasRole, loading: isLoading, error } = useHasRole(requiredRoles)

  if (isLoading) return <>{loading}</>
  if (error || !hasRole) return <>{fallback}</>
  return <>{children}</>
}

/**
 * Componente para renderização condicional exclusiva para admin
 * 
 * @example
 * <AdminGate fallback={<div>Acesso restrito</div>}>
 *   <AdminPanel />
 * </AdminGate>
 */
export function AdminGate({
  children,
  fallback = null,
  loading = <DefaultLoading />
}: {
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
}) {
  const { isAdmin, loading: isLoading, error } = useIsAdmin()

  if (isLoading) return <>{loading}</>
  if (error || !isAdmin) return <>{fallback}</>
  return <>{children}</>
}
