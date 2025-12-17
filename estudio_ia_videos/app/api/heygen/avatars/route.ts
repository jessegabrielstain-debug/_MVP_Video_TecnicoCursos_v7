import { NextResponse } from 'next/server';
import { heyGenService } from '@/lib/heygen-service';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const avatars = await heyGenService.listAvatars();
    return NextResponse.json({ avatars });
  } catch (error) {
    logger.error('Error fetching HeyGen avatars:', error instanceof Error ? error : new Error(String(error))
, { component: 'API: heygen/avatars' });
    return NextResponse.json(
      { error: 'Failed to fetch avatars' },
      { status: 500 }
    );
  }
}
