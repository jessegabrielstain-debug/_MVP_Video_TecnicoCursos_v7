import { NextRequest, NextResponse } from 'next/server'
import { mockProjects } from '@/lib/projects/mockStore'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const project = mockProjects.get(params.id)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
  return NextResponse.json({ project })
}
