import { NextResponse } from 'next/server';
import { heyGenService } from '@/lib/heygen-service';

export async function GET() {
  try {
    const voices = await heyGenService.listVoices();
    return NextResponse.json({ voices });
  } catch (error) {
    console.error('Error fetching HeyGen voices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
