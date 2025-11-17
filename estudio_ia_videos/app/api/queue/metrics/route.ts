import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || ''

  if (!redisUrl) {
    return NextResponse.json({
      ok: true,
      provider: 'none',
      metrics: { waiting: 0, active: 0, delayed: 0, failed: 0 },
      message: 'Redis URL not configured',
    })
  }

  try {
    const { Queue } = await import('bullmq')
    const queue = new Queue('render', { connection: { url: redisUrl } })

    const [waiting, active, delayed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getDelayedCount(),
      queue.getFailedCount(),
    ])

    await queue.close()

    return NextResponse.json({
      ok: true,
      provider: 'bullmq',
      metrics: { waiting, active, delayed, failed },
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      provider: 'bullmq',
      metrics: { waiting: 0, active: 0, delayed: 0, failed: 0 },
      error: (err as Error).message,
    }, { status: 200 })
  }
}
