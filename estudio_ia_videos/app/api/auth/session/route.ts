export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      user: session?.user || null,
      expires: session?.expires || null
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({
      user: null,
      expires: null
    })
  }
}

