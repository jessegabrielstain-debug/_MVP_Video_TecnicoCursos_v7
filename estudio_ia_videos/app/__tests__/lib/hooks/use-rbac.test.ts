import { renderHook, waitFor } from '@testing-library/react'
import { usePermission, useRole, useIsAdmin, useUserRoles, useHasRole } from '@/lib/hooks/use-rbac'
import { createClient } from '@/lib/supabase/client'

// Mock do cliente Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  rpc: jest.fn(),
  from: jest.fn()
}

describe('RBAC Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('usePermission', () => {
    it('deve retornar hasPermission=true quando usuário tem permissão', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null
      })

      const { result } = renderHook(() => usePermission('videos.edit'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasPermission).toBe(true)
      expect(result.current.error).toBeNull()
      expect(mockSupabase.rpc).toHaveBeenCalledWith('user_has_permission', {
        user_id: 'user-123',
        permission_name: 'videos.edit'
      })
    })

    it('deve retornar hasPermission=false quando usuário não tem permissão', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null
      })

      const { result } = renderHook(() => usePermission('users.delete'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasPermission).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('deve retornar false quando usuário não está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      const { result } = renderHook(() => usePermission('videos.edit'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasPermission).toBe(false)
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('deve capturar erro e retornar hasPermission=false', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC failed')
      })

      const { result } = renderHook(() => usePermission('videos.edit'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasPermission).toBe(false)
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('useRole', () => {
    it('deve retornar role do usuário', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      mockSupabase.rpc.mockResolvedValue({
        data: 'editor',
        error: null
      })

      const { result } = renderHook(() => useRole())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('editor')
      expect(result.current.error).toBeNull()
      expect(mockSupabase.rpc).toHaveBeenCalledWith('user_role')
    })

    it('deve retornar null quando usuário não tem role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      })

      const { result } = renderHook(() => useRole())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBeNull()
    })
  })

  describe('useIsAdmin', () => {
    it('deve retornar true quando usuário é admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } }
      })
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null
      })

      const { result } = renderHook(() => useIsAdmin())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isAdmin).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('is_admin')
    })

    it('deve retornar false quando usuário não é admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null
      })

      const { result } = renderHook(() => useIsAdmin())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isAdmin).toBe(false)
    })
  })

  describe('useUserRoles', () => {
    it('deve retornar array de roles do usuário', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { role: { name: 'editor' } },
            { role: { name: 'moderator' } }
          ],
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const { result } = renderHook(() => useUserRoles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.roles).toEqual(['editor', 'moderator'])
      expect(mockSupabase.from).toHaveBeenCalledWith('user_roles')
    })

    it('deve filtrar roles nulos ou undefined', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { role: { name: 'editor' } },
            { role: null },
            { role: { name: 'viewer' } }
          ],
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const { result } = renderHook(() => useUserRoles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.roles).toEqual(['editor', 'viewer'])
    })

    it('deve retornar array vazio quando usuário não tem roles', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const { result } = renderHook(() => useUserRoles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.roles).toEqual([])
    })
  })

  describe('useHasRole', () => {
    it('deve retornar true quando usuário tem um dos roles', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { role: { name: 'editor' } }
          ],
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const { result } = renderHook(() => useHasRole(['admin', 'editor']))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasRole).toBe(true)
    })

    it('deve retornar false quando usuário não tem nenhum dos roles', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { role: { name: 'viewer' } }
          ],
          error: null
        })
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const { result } = renderHook(() => useHasRole(['admin', 'editor']))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasRole).toBe(false)
    })
  })
})
