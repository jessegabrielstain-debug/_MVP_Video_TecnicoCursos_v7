import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Cria um cliente Supabase para uso em middleware
 * Gerencia cookies de forma segura no contexto de middleware
 * 
 * @throws Error se as variáveis de ambiente não estiverem configuradas
 */
export function createClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validação das variáveis de ambiente com mensagem clara
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Your project\'s URL and Key are required to create a Supabase client!\n\n' +
      'Check your Supabase project\'s API settings to find these values\n\n' +
      'https://supabase.com/dashboard/project/_/settings/api\n\n' +
      'Required environment variables:\n' +
      `  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}\n` +
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '✗ Missing'}`
    )
  }

  // Criar resposta que pode ser modificada
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
