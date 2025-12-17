export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      user: session?.user || null,
      expires: session?.expires || null
    })
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Session error', errorObj, { component: 'API: auth/session' })
    return NextResponse.json({
      user: null,
      expires: null
    })
  }
}

