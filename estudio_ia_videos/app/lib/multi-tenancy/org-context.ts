/**
 * Organization Context
 * Contexto de organização para multi-tenancy
 */

export interface OrgContext {
  orgId: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  role?: 'owner' | 'admin' | 'member' | 'viewer';
  limits: {
    maxUsers: number;
    maxProjects: number;
    maxStorageGB: number;
  };
}

class OrgContextManager {
  private contexts: Map<string, OrgContext> = new Map();
  
  async get(orgId: string): Promise<OrgContext | null> {
    // Placeholder - buscar do DB
    return this.contexts.get(orgId) || null;
  }
  
  async set(context: OrgContext): Promise<void> {
    this.contexts.set(context.orgId, context);
  }
  
  async getAll(): Promise<OrgContext[]> {
    return Array.from(this.contexts.values());
  }
}

export const orgContextManager = new OrgContextManager();

export async function getOrgContext(userId: string, orgId: string): Promise<OrgContext | null> {
  // In a real implementation, we would check if the user belongs to the org
  return orgContextManager.get(orgId);
}

export function hasPermission(role: string | undefined, permission: string): boolean {
  if (!role) return false;
  
  // Permission hierarchy
  const rolePermissions: Record<string, string[]> = {
    owner: ['org:manage', 'org:write', 'org:read', 'org:delete', 'user:manage'],
    admin: ['org:manage', 'org:write', 'org:read', 'user:manage'],
    member: ['org:write', 'org:read'],
    viewer: ['org:read']
  };
  
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}
