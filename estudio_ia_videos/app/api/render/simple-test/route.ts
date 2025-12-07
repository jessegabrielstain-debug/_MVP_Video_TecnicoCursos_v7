import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Render simple test route operational',
    timestamp: new Date().toISOString(),
  });
}

