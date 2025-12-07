/**
 * Auth Utilities
 * Funções auxiliares para autenticação e autorização
 */

// Type-safe helper extraindo organizationId
export const getOrgId = (user: unknown): string | undefined => {
  const u = user as { currentOrgId?: string; organizationId?: string };
  return u.currentOrgId || u.organizationId || undefined;
};

// Type-safe helper verificando admin
export const isAdmin = (user: unknown): boolean => {
  return ((user as { isAdmin?: boolean }).isAdmin) === true;
};

// Type-safe helper extraindo user ID
export const getUserId = (user: unknown): string | undefined => {
  return (user as { id?: string }).id;
};
