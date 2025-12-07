'use client'

import { getBrowserClient } from './browser'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type AppSupabaseClient = SupabaseClient<Database>

export type UserProfile = Database['public']['Tables']['users']['Row']

export const createBrowserClient = (): AppSupabaseClient => {
  return getBrowserClient()
}

const getRedirectUrl = (path: string) => {
  if (typeof window === 'undefined') {
    return undefined
  }

  const origin = window.location.origin.replace(/\/$/, '')
  return `${origin}${path}`
}

const DEFAULT_PROFILE_VALUES: Pick<UserProfile, 'role' | 'metadata'> = {
  role: 'user',
  metadata: {},
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signUp(email: string, password: string, fullName?: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: getRedirectUrl('/auth/callback'),
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

export async function resetPassword(email: string) {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl('/auth/reset-password'),
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updatePassword(newPassword: string) {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentUser() {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw new Error(error.message)
  }

  return data.user ?? null
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (
      error.code === 'PGRST116' ||
      msg.includes('no rows') ||
      msg.includes('jwt expired') ||
      error.code === 'PGRST303'
    ) {
      // Trata como sessão inválida/expirada ou perfil inexistente
      return null
    }
    console.error('Error fetching user profile:', error)
    return null
  }

  return data as UserProfile
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = createBrowserClient()
  let { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (msg.includes("could not find the 'role' column") || msg.includes('column role')) {
      // Fallback: remover campos não existentes e tentar novamente
      const { role, metadata, ...rest } = updates as Record<string, unknown>
      const retry = await supabase
        .from('users')
        .update({
          ...rest,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()
      if (retry.error) throw new Error(retry.error.message)
      return retry.data as UserProfile
    }
    throw new Error(error.message)
  }

  return data as UserProfile
}

export async function ensureUserProfile(userId: string, email: string) {
  const existingProfile = await getUserProfile(userId)
  if (existingProfile) {
    return existingProfile
  }

  const supabase = createBrowserClient()
  const timestamp = new Date().toISOString()
  let { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      ...DEFAULT_PROFILE_VALUES,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select()
    .single()

  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (msg.includes("could not find the 'role' column") || msg.includes('column role')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          created_at: timestamp,
          updated_at: timestamp,
        })
        .select()
        .single()
      if (fallbackError) throw new Error(fallbackError.message)
      return fallbackData as UserProfile
    }
    throw new Error(error.message)
  }

  return data as UserProfile
}

export async function signInWithGoogle() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl('/auth/callback'),
    },
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function signInWithGithub() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: getRedirectUrl('/auth/callback'),
    },
  })

  if (error) {
    throw new Error(error.message)
  }
}
