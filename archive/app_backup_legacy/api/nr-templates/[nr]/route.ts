import { NextResponse } from 'next/server'
import { getNRTemplate } from '@/lib/services/nr-templates-service'

export const dynamic = 'force-dynamic'

type Params = { params: { nr: string } }

export async function GET(_req: Request, { params }: Params) {
  const item = await getNRTemplate(params.nr)
  if (!item) {
    return NextResponse.json({ error: 'NR template not found' }, { status: 404 })
  }
  return NextResponse.json({ item })
}
