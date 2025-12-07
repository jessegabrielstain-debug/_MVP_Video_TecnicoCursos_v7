// @ts-nocheck
// TODO: Backup - fix types
import { NextResponse } from 'next/server'
import { listNRTemplates } from '@/lib/services/nr-templates-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const nr = searchParams.get('nr')

  // Delegar busca por NR específico via serviço (mantém compatibilidade)
  if (nr) {
    const { getNRTemplate, searchNRTemplates } = await import('@/lib/services/nr-templates-service')
    const item = await getNRTemplate(nr)
    if (!item) {
      return NextResponse.json({ error: 'NR template not found' }, { status: 404 })
    }
    return NextResponse.json({ item })
  }

  if (q) {
    const { searchNRTemplates } = await import('@/lib/services/nr-templates-service')
    const results = await searchNRTemplates(q)
    return NextResponse.json({ items: results, total: results.length })
  }

  const items = await listNRTemplates()
  return NextResponse.json({ items, total: items.length })
}
