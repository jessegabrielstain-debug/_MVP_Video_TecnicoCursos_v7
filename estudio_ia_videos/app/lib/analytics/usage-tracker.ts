import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/services/logger-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type UsageEventType = 
  | 'tts_generated' 
  | 'voice_cloned' 
  | 'avatar_video_generated' 
  | 'lip_sync_generated';

export interface UsageEventData {
  provider: 'elevenlabs' | 'd-id' | 'synthesia';
  resourceId?: string; // voiceId, videoId, talkId
  cost_estimate?: number; // credits or currency
  details?: Record<string, any>;
}

export async function trackUsage(
  eventType: UsageEventType,
  userId: string | null,
  data: UsageEventData
) {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: userId, // Can be null for system events or if user not known contextually
        event_type: eventType,
        event_data: data,
        created_at: new Date().toISOString()
      });

    if (error) {
      logger.error('UsageTracker', 'Failed to track usage event', error);
    } else {
      logger.info('UsageTracker', 'Usage event tracked', { eventType, userId });
    }
  } catch (error) {
    logger.error('UsageTracker', 'Exception tracking usage event', error as Error);
  }
}
