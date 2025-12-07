/**
 * 🧪 Testes do Sistema de Autenticação
 * Suite completa de testes para auth functions
 */

import {
  signIn,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  ensureUserProfile,
} from '@/lib/supabase/auth'

// Mock do Supabase client
jest.mock('@/lib/supabase/browser', () => ({
  getBrowserClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithOAuth: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  })),
}))

describe('Sistema de Autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signIn', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'token' },
        },
        error: null,
      }

      const { getBrowserClient } = require('@/lib/supabase/browser')
      getBrowserClient.mockReturnValue({
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue(mockResponse),
        },
      })

      const result = await signIn('test@example.com', 'password123')
      expect(result).toBeDefined()
      expect(result.user?.email).toBe('test@example.com')
    })

    it('deve lançar erro com credenciais inválidas', async () => {
      const { getBrowserClient } = require('@/lib/supabase/browser')
      getBrowserClient.mockReturnValue({
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Invalid credentials' },
          }),
        },
      })

      await expect(signIn('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('signUp', () => {
    it('deve criar nova conta com dados válidos', async () => {
      const mockResponse = {
        data: {
          user: { id: '123', email: 'newuser@example.com' },
          session: null, // Aguardando confirmação de email
        },
        error: null,
      }

      const { getBrowserClient } = require('@/lib/supabase/browser')
      getBrowserClient.mockReturnValue({
        auth: {
          signUp: jest.fn().mockResolvedValue(mockResponse),
        },
      })

      const result = await signUp('newuser@example.com', 'password123', 'New User')
      expect(result).toBeDefined()
      expect(result.user?.email).toBe('newuser@example.com')
    })

    it('deve lançar erro ao tentar registrar email duplicado', async () => {
      const { getBrowserClient } = require('@/lib/supabase/browser')
      getBrowserClient.mockReturnValue({
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'User already registered' },
          }),
        },
      })

      await expect(
        signUp('existing@example.com', 'password123')
      ).rejects.toThrow('User already registered')
    })
  })

  describe('getUserProfile', () => {
    it('deve retornar perfil do usuário', async () => {
      const mockProfile = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        credits: 100,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { getBrowserClient } = require('@/lib/supabase/browser')
      getBrowserClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
            })),
          })),
        })),
      })

      const profile = await getUserProfile('123')
      expect(profile).toBeDefined()
      expect(profile?.email).toBe('test@example.com')
      expect(profile?.credits).toBe(100)
    })

    it('deve retornar null se perfil não existir', async () => {
      const { getBrowserClient } = require('@/lib/supabase/browser')
      getBrowserClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            })),
          })),
        })),
      })

      const profile = await getUserProfile('nonexistent')
      expect(profile).toBeNull()
    })
  })

  describe('updateUserProfile', () => {
    it('deve atualizar perfil do usuário', async () => {
      const mockUpdatedProfile = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Updated Name',
        role: 'user',
        credits: 150,
        subscription_tier: 'pro',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { getBrowserClient } = require('@/lib/supabase/browser')
      getBrowserClient.mockReturnValue({
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null }),
              })),
            })),
          })),
        })),
      })

      const updated = await updateUserProfile('123', {
        full_name: 'Updated Name',
        subscription_tier: 'pro',
      })

      expect(updated).toBeDefined()
      expect(updated.full_name).toBe('Updated Name')
      expect(updated.subscription_tier).toBe('pro')
    })
  })

  describe('ensureUserProfile', () => {
    it('deve retornar perfil existente', async () => {
      const mockProfile = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user',
        credits: 100,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { getBrowserClient } = require('@/lib/supabase/browser')
      getBrowserClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
            })),
          })),
        })),
      })

      const profile = await ensureUserProfile('123', 'test@example.com')
      expect(profile).toBeDefined()
      expect(profile.id).toBe('123')
    })

    it('deve criar novo perfil se não existir', async () => {
      const mockNewProfile = {
        id: '456',
        email: 'new@example.com',
        role: 'user',
        credits: 100,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { getBrowserClient } = require('@/lib/supabase/browser')
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          // Primeira chamada - select (não encontra)
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            })),
          })),
        })
        .mockReturnValueOnce({
          // Segunda chamada - insert (cria novo)
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: mockNewProfile, error: null }),
            })),
          })),
        })

      getBrowserClient.mockReturnValue({
        from: mockFrom,
      })

      const profile = await ensureUserProfile('456', 'new@example.com')
      expect(profile).toBeDefined()
      expect(profile.id).toBe('456')
      expect(profile.credits).toBe(100)
    })
  })
})
