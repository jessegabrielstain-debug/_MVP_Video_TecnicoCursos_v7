import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'
import path from 'path'
import { createStorage } from '@/lib/storage'

export const maxDuration = 60
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sanitize(name: string) {
  return name.normalize('NFKD').replace(/[^\w.\- ]/g, '_').replace(/\s+/g, '_')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const original = file.name || 'presentation.pptx'
    const ext = path.extname(original).toLowerCase()
    if (!['.pptx', '.ppt', '.odp', '.pdf'].includes(ext)) {
      return NextResponse.json({ error: 'Formato não suportado' }, { status: 415 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const key = `pptx/${Date.now()}-${sanitize(original)}`

    const storage = createStorage()
    await storage.saveFile(buf, key, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')

    const jobId = randomUUID()
    return NextResponse.json({
      success: true,
      job: { id: jobId, s3Key: key },
      message: 'Upload concluído'
    })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: String(e) }, { status: 500 })
  }
}

