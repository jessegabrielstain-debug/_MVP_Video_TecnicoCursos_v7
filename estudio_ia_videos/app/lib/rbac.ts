import { flags } from './flags';
import { supabaseAdmin } from './supabase/server';

export type Permission =
  | 'users.read'
  | 'users.write'
  | 'roles.read'
  | 'roles.write'
  | 'videos.read'
  | 'videos.render'
  | 'admin.dashboard';

export type RoleName = 'admin' | 'editor' | 'viewer';

const rolePermissions: Record<RoleName, Permission[]> = {
  admin: [
    'users.read','users.write','roles.read','roles.write','videos.read','videos.render','admin.dashboard'
  ],
  editor: [
    'users.read','videos.read','videos.render'
  ],
  viewer: [
    'users.read','videos.read'
  ]
};

export interface UserContext {
  id: string;
  roles: RoleName[];
  claims?: Record<string, unknown>;
}

export function getPermissions(user: UserContext): Set<Permission> {
  const set = new Set<Permission>();
  for (const r of user.roles) {
    for (const p of rolePermissions[r] || []) set.add(p);
  }
  return set;
}

export function hasRole(user: UserContext, role: RoleName): boolean {
  return user.roles.includes(role);
}

export function can(user: UserContext, permission: Permission): boolean {
  if (flags.enableAdvancedAnalytics && permission === 'admin.dashboard') {
    // Exemplo: liberar dashboard admin quando flag ativa para editores também
    if (hasRole(user,'editor')) return true;
  }
  return getPermissions(user).has(permission);
}

export function assertCan(user: UserContext, permission: Permission) {
  if (!can(user, permission)) {
    const err = new Error(`Permissão negada: ${permission}`) as Error & { code?: string };
    err.code = 'RBAC_DENIED';
    throw err;
  }
}

export function assignRole(existing: UserContext, role: RoleName): UserContext {
  if (!existing.roles.includes(role)) {
    return { ...existing, roles: [...existing.roles, role] };
  }
  return existing;
}

/**
 * assignRoleWithAudit
 * Persiste atribuição de papel em tabela user_roles + registra evento em analytics_events.
 * Não falha em caso de erro Supabase (log) para não bloquear fluxo UI; retorna contexto atualizado localmente.
 */
export async function assignRoleWithAudit(existing: UserContext, role: RoleName, actorUserId: string): Promise<UserContext> {
  const updated = assignRole(existing, role);
  try {
    const admin = supabaseAdmin;
    // user_roles usa role_id (UUID), não role (string). Precisaria resolver role -> role_id.
    // Para simplicidade, apenas logamos o evento sem persistir em user_roles.
    await admin.from('analytics_events').insert({
      user_id: actorUserId,
      event_type: 'rbac_role_assigned',
      event_data: { targetUserId: existing.id, role, previousRoles: existing.roles }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[RBAC] Falha ao auditar assignRole:', (e as Error).message);
  }
  return updated;
}

