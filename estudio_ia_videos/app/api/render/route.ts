import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Endpoint deprecated. Use /api/render/jobs' }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ error: 'Endpoint deprecated. Use /api/render/jobs' }, { status: 410 });
}
