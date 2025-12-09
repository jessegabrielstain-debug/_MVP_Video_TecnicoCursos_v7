/**
 * Storage System Real
 * Sistema real de armazenamento (Supabase Storage)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export interface StorageUploadOptions {
  bucket: string;
  path: string;
  file: Buffer | File | Blob;
  contentType?: string;
  cacheControl?: string;
}

export interface StorageDownloadOptions {
  bucket: string;
  path: string;
}

export class StorageSystemReal {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role for full access
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('⚠️ Supabase credentials not found in StorageSystemReal', { component: 'StorageSystemReal' });
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async upload(options: StorageUploadOptions): Promise<string> {
    const { bucket, path, file, contentType, cacheControl } = options;
    
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          cacheControl: cacheControl || '3600',
          upsert: true
        });

      if (error) throw error;

      return this.getPublicUrl(bucket, path);
    } catch (error) {
      logger.error(`[Storage] Upload failed for ${bucket}/${path}:`, error instanceof Error ? error : new Error(String(error)), { component: 'StorageSystemReal' });
      throw error;
    }
  }
  
  async download(options: StorageDownloadOptions): Promise<Buffer> {
    const { bucket, path } = options;
    
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(path);

      if (error) throw error;
      if (!data) throw new Error('No data returned from download');

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      logger.error(`[Storage] Download failed for ${bucket}/${path}:`, error instanceof Error ? error : new Error(String(error)), { component: 'StorageSystemReal' });
      throw error;
    }
  }
  
  async delete(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error(`[Storage] Delete failed for ${bucket}/${path}:`, error instanceof Error ? error : new Error(String(error)), { component: 'StorageSystemReal' });
      return false;
    }
  }
  
  async exists(bucket: string, path: string): Promise<boolean> {
    try {
      // List files with the specific name in the folder
      const folder = path.split('/').slice(0, -1).join('/');
      const filename = path.split('/').pop();
      
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 1,
          search: filename
        });

      if (error) throw error;
      return data && data.length > 0 && data[0].name === filename;
    } catch (error) {
      return false;
    }
  }
  
  async list(bucket: string, prefix?: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(prefix || '');

      if (error) throw error;
      return data.map(f => f.name);
    } catch (error) {
      logger.error(`[Storage] List failed for ${bucket}/${prefix}:`, error instanceof Error ? error : new Error(String(error)), { component: 'StorageSystemReal' });
      return [];
    }
  }
  
  async getPublicUrl(bucket: string, path: string): Promise<string> {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    return data.publicUrl;
  }

  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }

  /**
   * Get storage quota for a user
   */
  async getQuota(userId: string): Promise<{ used: number; limit: number; percentage: number }> {
    try {
      // Get user's storage usage from analytics_events or calculate from storage
      const { data, error } = await this.supabase
        .from('users')
        .select('storage_quota, storage_used')
        .eq('id', userId)
        .single();

      if (error) {
        // Default quota if no data found
        return { used: 0, limit: 1073741824, percentage: 0 }; // 1GB default
      }

      const used = (data as { storage_used?: number }).storage_used || 0;
      const limit = (data as { storage_quota?: number }).storage_quota || 1073741824;
      const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;

      return { used, limit, percentage };
    } catch (error) {
      logger.error(`[Storage] GetQuota failed for user ${userId}:`, error instanceof Error ? error : new Error(String(error)), { component: 'StorageSystemReal' });
      return { used: 0, limit: 1073741824, percentage: 0 };
    }
  }

  /**
   * Set storage quota for a user (admin only)
   */
  async setQuota(userId: string, newLimit: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ storage_quota: newLimit })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error(`[Storage] SetQuota failed for user ${userId}:`, error instanceof Error ? error : new Error(String(error)), { component: 'StorageSystemReal' });
      return false;
    }
  }

  /**
   * List files for a specific user
   */
  async listUserFiles(userId: string, bucket: string = 'videos'): Promise<{ name: string; size: number; id: string }[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(`users/${userId}`);

      if (error) throw error;
      
      return (data || []).map(file => ({
        name: file.name,
        size: (file.metadata as { size?: number } | null)?.size || 0,
        id: file.id
      }));
    } catch (error) {
      logger.error(`[Storage] ListUserFiles failed for user ${userId}:`, error instanceof Error ? error : new Error(String(error)), { component: 'StorageSystemReal' });
      return [];
    }
  }
}

export const storageSystem = new StorageSystemReal();
