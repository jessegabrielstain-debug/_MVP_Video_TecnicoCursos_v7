import { NextRequest, NextResponse } from 'next/server';
import { heyGenService } from '@/lib/heygen-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const quota = await heyGenService.getQuota();

    if (quota.error) {
      return NextResponse.json(
        { error: quota.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      remaining: quota.remaining_quota,
      used: quota.used_quota,
      resetDate: quota.quota_reset_date,
    });
  } catch (error) {
    logger.error('Error fetching HeyGen quota:', error instanceof Error ? error : new Error(String(error))
, { component: 'API: heygen/credits' });
    return NextResponse.json(
      { error: 'Failed to fetch quota' },
      { status: 500 }
    );
  }
}
