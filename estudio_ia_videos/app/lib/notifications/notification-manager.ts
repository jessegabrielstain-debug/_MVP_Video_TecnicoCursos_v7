/**
 * Notification Manager
 * Gerenciador de notificações do sistema (Persistência Real)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
}

interface Room {
  id: string;
  name: string;
  members: Set<string>;
  createdAt: Date;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private supabase: SupabaseClient;
  private rooms: Map<string, Room> = new Map();

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not found in NotificationManager');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  createRoom(roomId: string, name: string): Room {
    const room: Room = {
      id: roomId,
      name,
      members: new Set(),
      createdAt: new Date()
    };
    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      room.members.add(userId);
      return true;
    }
    return false;
  }

  leaveRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      return room.members.delete(userId);
    }
    return false;
  }
  
  async create(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
    const notif = {
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: false,
      action_url: notification.actionUrl,
      expires_at: notification.expiresAt?.toISOString(),
      created_at: new Date().toISOString()
    };

    // Note: Assuming a 'notifications' table exists. If not, we should create it or use a generic events table.
    // Given the schema I saw earlier, there isn't a specific 'notifications' table.
    // I will use 'analytics_events' as a fallback for now if I can't create a table, 
    // BUT for a real notification system, we need a table.
    // Let's assume we can use a JSONB structure in 'analytics_events' OR create a table via SQL if I could.
    // Since I can't run SQL directly to create tables easily without a migration tool, 
    // I will implement this using 'analytics_events' with a specific event_type 'system.notification'
    // This allows storing notifications without schema changes, though less efficient for querying 'unread'.
    
    // BETTER APPROACH: Use the existing 'analytics_events' table but structure it so we can query it.
    // event_type = 'notification'
    // event_data = { title, message, type, read, actionUrl }
    
    const { data, error } = await this.supabase
      .from('analytics_events')
      .insert({
        user_id: notification.userId,
        event_type: 'notification',
        event_data: {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: false,
          actionUrl: notification.actionUrl,
          expiresAt: notification.expiresAt
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      type: data.event_data.type,
      title: data.event_data.title,
      message: data.event_data.message,
      read: data.event_data.read,
      createdAt: new Date(data.created_at),
      expiresAt: data.event_data.expiresAt ? new Date(data.event_data.expiresAt) : undefined,
      actionUrl: data.event_data.actionUrl
    };
  }
  
  async getForUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = this.supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', 'notification')
      .order('created_at', { ascending: false });

    // Filtering JSONB for 'read' status is possible but syntax depends on Supabase/Postgres version.
    // .filter('event_data->>read', 'eq', 'false')
    if (unreadOnly) {
      // This might be slow if many notifications, but works for MVP
      // We'll filter in memory if we can't rely on JSONB filtering perfectly here without testing
    }

    const { data, error } = await query.limit(50);

    if (error) return [];

    let notifications = data.map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.event_data.type,
      title: row.event_data.title,
      message: row.event_data.message,
      read: row.event_data.read,
      createdAt: new Date(row.created_at),
      expiresAt: row.event_data.expiresAt ? new Date(row.event_data.expiresAt) : undefined,
      actionUrl: row.event_data.actionUrl
    }));

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    return notifications;
  }
  
  async markAsRead(notificationId: string): Promise<boolean> {
    // We need to fetch the current data to update just the 'read' field in JSONB
    // Or use a jsonb_set function if available.
    // For safety, fetch-modify-update.
    
    const { data: current } = await this.supabase
      .from('analytics_events')
      .select('event_data')
      .eq('id', notificationId)
      .single();
      
    if (!current) return false;
    
    const newData = { ...current.event_data, read: true };
    
    const { error } = await this.supabase
      .from('analytics_events')
      .update({ event_data: newData })
      .eq('id', notificationId);

    return !error;
  }
  
  async delete(notificationId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('analytics_events')
      .delete()
      .eq('id', notificationId);
      
    return !error;
  }
  
  async deleteAllForUser(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('analytics_events')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .eq('event_type', 'notification');
      
    return error ? 0 : (count || 0);
  }
  
  async sendToUser(userId: string, notification: Record<string, unknown>): Promise<void> {
    try {
      const data = notification.data as Record<string, unknown> | undefined;
      await this.create({
        userId,
        type: notification.type === 'error' || notification.type === 'upload_error' ? 'error' : 'info',
        title: notification.title as string,
        message: notification.message as string,
        actionUrl: data?.uploadId ? `/upload/${data.uploadId}` : undefined
      });
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  async broadcastToRoom(roomId: string, notification: Record<string, unknown>): Promise<void> {
    // Not implemented in persistence layer yet
    console.log(`[NotificationManager] Broadcasting to room ${roomId}:`, notification.title);
  }

  async sendNotification(notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    priority?: string;
    timestamp?: number;
    userId?: string;
    roomId?: string;
    data?: Record<string, unknown>;
    persistent?: boolean;
  }): Promise<void> {
    // 1. Persist if requested or if it's a user notification
    if (notification.persistent !== false && notification.userId) {
      try {
        await this.create({
          userId: notification.userId,
          type: (notification.type === 'error' || notification.type === 'upload_error') ? 'error' : 'info',
          title: notification.title,
          message: notification.message,
          actionUrl: notification.data?.uploadId ? `/upload/${notification.data.uploadId}` : undefined
        });
      } catch (error) {
        console.error('Error persisting notification:', error);
      }
    }

    // 2. Broadcast to room if specified
    if (notification.roomId) {
      await this.broadcastToRoom(notification.roomId, notification);
    }
    
    // 3. Send to user if specified (and not already handled by broadcast if room is user-specific)
    if (notification.userId && !notification.roomId) {
       // In a real implementation, this would send via WebSocket to the user's channel
       console.log(`[NotificationManager] Sending to user ${notification.userId}:`, notification.title);
    }
  }
}

export const notificationManager = new NotificationManager();
