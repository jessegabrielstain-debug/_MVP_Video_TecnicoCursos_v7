import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Cria um cliente Supabase para uso em middleware
 * Gerencia cookies de forma segura no contexto de middleware
 */
export function createClient(request: NextRequest) {
  // Criar resposta que pode ser modificada
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Definir cookie na requisição para a rota
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Definir cookie na resposta
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remover cookie da requisição
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Remover cookie da resposta
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}
