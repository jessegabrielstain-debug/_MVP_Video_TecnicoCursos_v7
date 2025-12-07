import { NextResponse } from 'next/server';
import { heyGenService } from '@/lib/heygen-service';

export async function GET() {
  try {
    const avatars = await heyGenService.listAvatars();
    return NextResponse.json({ avatars });
  } catch (error) {
    console.error('Error fetching HeyGen avatars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch avatars' },
      { status: 500 }
    );
  }
}
