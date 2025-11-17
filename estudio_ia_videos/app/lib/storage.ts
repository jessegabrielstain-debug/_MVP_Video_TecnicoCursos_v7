/**
 * Storage Abstraction
 * Simplifica acesso a buckets Supabase (videos, avatars, thumbnails, assets).
 * Futuro: mover para '@/lib/services/storage-service.ts' com cache/CDN.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';

export type BucketName = 'videos' | 'avatars' | 'thumbnails' | 'assets';

export interface StoredFileMeta {
  name: string;
  bucket: BucketName;
  size?: number;
  lastModified?: string;
  publicUrl?: string;
}

function client() {
  return supabaseAdmin();
}

export async function listFiles(bucket: BucketName, prefix = ''): Promise<StoredFileMeta[]> {
  const { data, error } = await client().storage.from(bucket).list(prefix, { limit: 100, offset: 0 });
  if (error) throw error;
  return (data || []).map(f => ({
    name: f.name,
    bucket,
    size: f.metadata?.size ?? f.size,
    lastModified: f.updated_at,
    publicUrl: client().storage.from(bucket).getPublicUrl((prefix ? prefix + '/' : '') + f.name).data.publicUrl
  }));
}

export async function uploadFile(bucket: BucketName, path: string, contents: Buffer | ArrayBuffer | Blob): Promise<StoredFileMeta> {
  const { data, error } = await client().storage.from(bucket).upload(path, contents, { upsert: true });
  if (error) throw error;
  return {
    name: data?.path || path,
    bucket,
    publicUrl: client().storage.from(bucket).getPublicUrl(data?.path || path).data.publicUrl
  };
}

export async function getSignedUrl(bucket: BucketName, path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await client().storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeFile(bucket: BucketName, paths: string | string[]): Promise<boolean> {
  const arr = Array.isArray(paths) ? paths : [paths];
  const { error } = await client().storage.from(bucket).remove(arr);
  if (error) throw error;
  return true;
}
