import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Video Pipeline Render API',
    status: 'working',
    timestamp: new Date().toISOString()
  })
}
