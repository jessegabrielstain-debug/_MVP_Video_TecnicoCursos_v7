
export function isAdminUser(email?: string | null): boolean {
  if (!email) return false
  // TODO: Move to environment variable or database check
  const adminEmails = ['admin@estudioia.com', 'admin@tecnicocursos.com.br']
  return adminEmails.includes(email)
}
