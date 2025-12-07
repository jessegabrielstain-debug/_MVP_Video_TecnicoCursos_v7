import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { trainVoice } from '@/lib/voice/voice-cloning'


const getUserId = (user: unknown): string => ((user as { id?: string }).id || '');
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const samples = formData.getAll('samples') as File[]

    if (!name || samples.length < 3) {
      return NextResponse.json(
        { error: 'Nome e pelo menos 3 amostras são obrigatórios' },
        { status: 400 }
      )
    }

    // Converte samples para Buffer
    const sampleBuffers = await Promise.all(
      samples.map(async (sample) => Buffer.from(await sample.arrayBuffer()))
    )

    // Inicia treinamento
    const result = await trainVoice({
      userId: getUserId(session.user),
      name,
      description,
      samples: sampleBuffers
    })

    // Salva no banco
    // Note: VoiceClone model must be present in schema.prisma and prisma generate run
    const voiceClone = await (prisma as any).voiceClone.create({
      data: {
        userId: getUserId(session.user),
        name,
        description,
        provider: 'elevenlabs',
        voiceId: result.voiceId || result.id,
        sampleCount: samples.length,
        trainingStatus: result.status || 'pending',
        qualityScore: result.qualityScore || 0
      }
    })

    return NextResponse.json({ voiceClone })

  } catch (error) {
    console.error('[VOICE_CREATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao criar voz' },
      { status: 500 }
    )
  }
}


