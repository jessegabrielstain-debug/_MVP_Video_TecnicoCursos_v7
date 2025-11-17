import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/services'
import { logger } from '@/lib/services'
import { z } from 'zod'

const logContext = { component: 'AdminUserRolesAPI' }

const assignRoleSchema = z.object({
  role: z.string().min(1, 'Role é obrigatória')
})

/**
 * POST /api/admin/users/[id]/roles
 * Atribui uma role a um usuário
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = crypto.randomUUID()
  const contextLogger = logger.withContext({ ...logContext, requestId, userId: params.id })

  try {
    contextLogger.info('Assigning role to user')

    const body = await req.json()
    const validation = assignRoleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validação falhou', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { role } = validation.data
    const supabase = createServerClient()

    // Verificar se role existe
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', role)
      .single()

    if (roleError || !roleData) {
      contextLogger.warn('Role not found', { role })
      return NextResponse.json(
        { error: 'Role não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se usuário já possui essa role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', params.id)
      .eq('role_id', roleData.id)
      .single()

    if (existingRole) {
      contextLogger.info('User already has this role', { role })
      return NextResponse.json({
        message: 'Usuário já possui essa role',
        assigned: false
      })
    }

    // Atribuir role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: params.id,
        role_id: roleData.id
      })

    if (insertError) {
      contextLogger.error('Failed to assign role', { error: insertError })
      return NextResponse.json(
        { error: 'Falha ao atribuir role', details: insertError.message },
        { status: 500 }
      )
    }

    contextLogger.info('Role assigned successfully', { role })

    return NextResponse.json({
      message: 'Role atribuída com sucesso',
      assigned: true,
      role: roleData.name
    })
  } catch (error) {
    contextLogger.error('Unexpected error in POST /api/admin/users/[id]/roles', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
