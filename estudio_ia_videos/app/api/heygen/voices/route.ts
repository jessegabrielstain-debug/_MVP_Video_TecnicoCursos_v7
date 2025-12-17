import { NextResponse } from 'next/server';
import { heyGenService } from '@/lib/heygen-service';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const voices = await heyGenService.listVoices();
    return NextResponse.json({ voices });
  } catch (error) {
    logger.error('Error fetching HeyGen voices', error instanceof Error ? error : new Error(String(error))
, { component: 'API: heygen/voices' });
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
