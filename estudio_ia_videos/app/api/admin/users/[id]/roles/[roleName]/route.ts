import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/services'
import { logger } from '@/lib/services'

const logContext = { component: 'AdminRemoveUserRoleAPI' }

/**
 * DELETE /api/admin/users/[id]/roles/[roleName]
 * Remove uma role de um usuário
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; roleName: string } }
) {
  const requestId = crypto.randomUUID()
  const contextLogger = logger.withContext({
    ...logContext,
    requestId,
    userId: params.id,
    roleName: params.roleName
  })

  try {
    contextLogger.info('Removing role from user')

    const supabase = createServerClient()

    // Buscar role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', params.roleName)
      .single()

    if (roleError || !roleData) {
      contextLogger.warn('Role not found', { roleName: params.roleName })
      return NextResponse.json(
        { error: 'Role não encontrada' },
        { status: 404 }
      )
    }

    // Remover role do usuário
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', params.id)
      .eq('role_id', roleData.id)

    if (deleteError) {
      contextLogger.error('Failed to remove role', { error: deleteError })
      return NextResponse.json(
        { error: 'Falha ao remover role', details: deleteError.message },
        { status: 500 }
      )
    }

    contextLogger.info('Role removed successfully')

    return NextResponse.json({
      message: 'Role removida com sucesso',
      removed: true,
      role: roleData.name
    })
  } catch (error) {
    contextLogger.error('Unexpected error in DELETE /api/admin/users/[id]/roles/[roleName]', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
