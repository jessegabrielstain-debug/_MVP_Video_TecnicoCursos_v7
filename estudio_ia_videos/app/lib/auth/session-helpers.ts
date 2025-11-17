/**
 * Type-safe helpers for extracting session user properties
 * Centraliza lógica evitando `as any` em routes
 */

/**
 * Extrai organizationId do user object (currentOrgId ou organizationId)
 */
export const getOrgId = (user: unknown): string | undefined => {
  const u = user as { currentOrgId?: string; organizationId?: string };
  return u.currentOrgId || u.organizationId || undefined;
};

/**
 * Verifica se user é admin
 */
export const isAdmin = (user: unknown): boolean => {
  return ((user as { isAdmin?: boolean }).isAdmin) === true;
};

/**
 * Extrai user ID (já existe getUserId em alguns routes, consolidar aqui)
 */
export const getUserId = (user: unknown): string => {
  return ((user as { id?: string }).id) || '';
};
