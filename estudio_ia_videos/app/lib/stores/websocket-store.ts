import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RenderProgress {
  progress: number;
  jobId?: string;
  status?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  [key: string]: unknown;
}

interface JobPayload {
  id: string;
  status: string;
  progress?: number;
}

export interface WebSocketStore {
  isConnected: boolean;
  renderProgress: RenderProgress | null;
  notifications: Notification[];
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => {
  const supabase = createClient();
  let channel: RealtimeChannel | null = null;

  return {
    isConnected: false,
    renderProgress: null,
    notifications: [],

    connect: async () => {
      if (get().isConnected) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase.channel('studio_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'render_jobs',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const job = payload.new as unknown as JobPayload;
              if (job.status === 'processing') {
                set({ 
                  renderProgress: { 
                    progress: job.progress || 0, 
                    jobId: job.id,
                    status: job.status
                  } 
                });
              } else if (job.status === 'completed') {
                 set({ 
                  renderProgress: { 
                    progress: 100, 
                    jobId: job.id,
                    status: job.status
                  } 
                });
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const notification = payload.new as unknown as Notification;
            set((state) => ({
              notifications: [notification, ...state.notifications]
            }));
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            set({ isConnected: true });
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            set({ isConnected: false });
          }
        });
    },

    disconnect: () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      set({ isConnected: false });
    }
  };
});
