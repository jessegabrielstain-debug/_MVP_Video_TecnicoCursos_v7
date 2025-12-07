import { promises as fs } from 'fs'
import path from 'path'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface S3DownloadResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

function getProvider() {
  return (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
}

export class S3StorageService {
  static async deleteFile(key: string): Promise<void> {
    const provider = getProvider()
    if (provider === 'local') {
      const fp = path.join(process.cwd(), 'public', 'uploads', key)
      await fs.rm(fp, { force: true })
      return
    }
    // noop for other providers in this minimal implementation
  }

  static async downloadFile(key: string): Promise<S3DownloadResult> {
    try {
      const provider = getProvider()
      if (provider === 'local') {
        const fp = path.join(process.cwd(), 'public', 'uploads', key)
        const buf = await fs.readFile(fp)
        return { success: true, buffer: buf }
      }
      if (provider === 'supabase') {
        const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'public'
        const client = createSupabaseClient(url, serviceKey)
        const { data, error } = await client.storage.from(bucket).download(key)
        if (error || !data) return { success: false, error: error?.message || 'Download failed' }
        const arrayBuf = await data.arrayBuffer()
        return { success: true, buffer: Buffer.from(arrayBuf) }
      }
      // S3
      const region = process.env.AWS_REGION || 'us-east-1'
      const bucket = process.env.AWS_S3_BUCKET || ''
      if (!bucket) return { success: false, error: 'AWS_S3_BUCKET not configured' }
      const client = new S3Client({ region })
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const stream = res.Body as AsyncIterable<Uint8Array>
      const chunks: Buffer[] = []
      for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      return { success: true, buffer: Buffer.concat(chunks) }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }

  static async fileExists(key: string): Promise<boolean> {
    const provider = getProvider()
    if (provider === 'local') {
      const fp = path.join(process.cwd(), 'public', 'uploads', key)
      try { await fs.access(fp); return true } catch { return false }
    }
    // minimal: return true for other providers
    return true
  }

  static async uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    const provider = getProvider()
    if (provider === 'local') {
      const fp = path.join(process.cwd(), 'public', 'uploads', key)
      await fs.mkdir(path.dirname(fp), { recursive: true })
      await fs.writeFile(fp, buffer)
      return `/uploads/${key}`.replace(/\\/g, '/')
    }
    if (provider === 'supabase') {
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'public'
      const client = createSupabaseClient(url, serviceKey)
      const { error } = await client.storage.from(bucket).upload(key, buffer, { contentType, upsert: true })
      if (error) throw error
      const { data } = client.storage.from(bucket).getPublicUrl(key)
      return data.publicUrl
    }
    const region = process.env.AWS_REGION || 'us-east-1'
    const bucket = process.env.AWS_S3_BUCKET || ''
    const client = new S3Client({ region })
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType || 'application/octet-stream' }))
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  }

  static async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const provider = getProvider()
    if (provider === 'local') {
      return `/uploads/${key}`.replace(/\\/g, '/')
    }
    if (provider === 'supabase') {
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'public'
      const client = createSupabaseClient(url, serviceKey)
      const { data, error } = await client.storage.from(bucket).createSignedUrl(key, expiresIn)
      if (error || !data) throw error || new Error('Failed to sign URL')
      return data.signedUrl
    }
    // minimal: return public S3 URL
    const region = process.env.AWS_REGION || 'us-east-1'
    const bucket = process.env.AWS_S3_BUCKET || ''
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  }
}
