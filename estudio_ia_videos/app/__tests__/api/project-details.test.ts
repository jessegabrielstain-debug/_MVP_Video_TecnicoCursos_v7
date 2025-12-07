// @jest-environment node
import { NextRequest } from 'next/server'
import { GET } from '@/api/projects/[id]/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  getSupabaseForRequest: jest.fn(),
  createClient: jest.fn()
}))

const { getSupabaseForRequest } = jest.requireMock('@/lib/supabase/server')

describe('/api/projects/[id]', () => {
  const existingProjectId = 'proj-001'
  const nonExistingProjectId = 'non-existing-project-id'
  
  const mockSupabase = {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSupabaseForRequest as jest.Mock).mockReturnValue(mockSupabase)
    
    // Default auth mock
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'user-123' } }, 
      error: null 
    })
  })

  it('retorna detalhes do projeto existente', async () => {
    const request = new NextRequest(`http://localhost/api/projects/${existingProjectId}`)

    // Mock database response
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: existingProjectId, name: 'Projeto Demo 1', user_id: 'user-123' },
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockChain)

    const response = await GET(request, { params: { id: existingProjectId } })
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.data.id).toBe(existingProjectId)
    expect(payload.data.name).toBe('Projeto Demo 1')
  })

  it('retorna 404 para projetos inexistentes', async () => {
    const request = new NextRequest(`http://localhost/api/projects/${nonExistingProjectId}`)

    // Mock database response for not found
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }
      })
    }
    mockSupabase.from.mockReturnValue(mockChain)

    const response = await GET(request, { params: { id: nonExistingProjectId } })
    expect(response.status).toBe(404)
  })
})
