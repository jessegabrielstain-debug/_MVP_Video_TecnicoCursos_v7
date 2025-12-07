import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Test endpoint is reachable',
    timestamp: new Date().toISOString(),
  });
}

