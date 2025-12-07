import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { auditLogger } from '@/lib/audit-logging-real'

const prisma = new PrismaClient()

async function isAdmin(userId: string | undefined) {
  if (!userId) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return user?.role === 'admin'
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await isAdmin(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { role } = await request.json() as { role?: string }

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role },
    })

    await auditLogger.log({
      action: 'user.role_updated',
      userId: session.user.id,
      resource: `user:${params.id}`,
      metadata: { role, targetUserId: params.id },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.error('[Admin Users PUT] Error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await isAdmin(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    await auditLogger.log({
      action: 'user.deleted',
      userId: session.user.id,
      resource: `user:${params.id}`,
      metadata: { targetUserId: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.error('[Admin Users DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
