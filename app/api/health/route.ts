import { NextResponse } from 'next/server'

export function checkStorage() {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
  if (provider === 's3') {
    return Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_REGION)
  }
  if (provider === 'supabase') {
    return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return true
}

export async function GET() {
  const status = {
    app: 'ok',
    storageProvider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),
    storageReady: checkStorage(),
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime())
  }
  const code = status.storageReady ? 200 : 503
  return NextResponse.json(status, { status: code })
}
