import type { NextAuthOptions } from 'next-auth'

// Stub simplificado para testes; em produção substituir pela configuração real.
export const authOptions: NextAuthOptions = {
  providers: [],
  session: { strategy: 'jwt' },
  callbacks: {}
}
