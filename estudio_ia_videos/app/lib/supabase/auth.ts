'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type AppSupabaseClient = SupabaseClient<Database>

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export const createBrowserClient = (): AppSupabaseClient => {
  return createClientComponentClient<Database>()
}

const getRedirectUrl = (path: string) => {
  if (typeof window === 'undefined') {
    return undefined
  }

  const origin = window.location.origin.replace(/\/$/, '')
  return `${origin}${path}`
}

const DEFAULT_PROFILE_VALUES: Pick<UserProfile, 'role' | 'credits' | 'subscription_tier' | 'metadata'> = {
  role: 'user',
  credits: 100,
  subscription_tier: 'free',
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
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.toLowerCase().includes('no rows')) {
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
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
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
  const { data, error } = await supabase
    .from('user_profiles')
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
