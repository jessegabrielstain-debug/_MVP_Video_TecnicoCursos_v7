import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Video Pipeline Test API',
    status: 'working',
    timestamp: new Date().toISOString()
  })
}
    
