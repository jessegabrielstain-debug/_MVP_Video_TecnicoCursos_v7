import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class AuditLoggingService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not found in AuditLoggingService');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async log(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('analytics_events')
        .insert({
          user_id: log.userId,
          event_type: `audit.${log.action}`,
          event_data: {
            resource: log.resource,
            ...log.metadata
          },
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to write audit log:', error);
      }
    } catch (error) {
      console.error('Error in audit logger:', error);
    }
  }

  async query(filters: Partial<AuditLog>): Promise<AuditLog[]> {
    try {
      let query = this.supabase
        .from('analytics_events')
        .select('*')
        .ilike('event_type', 'audit.%')
        .order('created_at', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.action) {
        query = query.eq('event_type', `audit.${filters.action}`);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        action: row.event_type.replace('audit.', ''),
        resource: row.event_data?.resource || 'unknown',
        timestamp: new Date(row.created_at),
        metadata: row.event_data
      }));
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      return [];
    }
  }
  
  async getUserActivity(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.query({ userId });
  }

  async logUserAction(userId: string, action: string, resource: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log({
      userId,
      action,
      resource,
      metadata
    });
  }
}

export const auditLogger = new AuditLoggingService();

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  LOGIN = 'login',
  LOGOUT = 'logout',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  FILE_UPLOAD = 'file_upload',
  FILE_DOWNLOAD = 'file_download',
  FILE_DELETE = 'file_delete',
}

export function getRequestMetadata(req: Request) {
  return {
    ip: req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };
}
