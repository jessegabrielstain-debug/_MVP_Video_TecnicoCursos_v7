import path from 'path'
import { promises as fs } from 'fs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

type SaveResult = { url: string }

interface StorageAdapter {
  saveFile(buffer: Buffer, key: string, contentType?: string): Promise<SaveResult>
}

class LocalStorage implements StorageAdapter {
  async saveFile(buffer: Buffer, key: string): Promise<SaveResult> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, buffer)
    const url = `/uploads/${key}`.replace(/\\/g, '/')
    return { url }
  }
}

class S3Storage implements StorageAdapter {
  private client: S3Client
  private bucket: string
  private region: string
  private publicBase?: string

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1'
    this.bucket = process.env.AWS_S3_BUCKET || ''
    this.publicBase = process.env.AWS_PUBLIC_BASE || ''
    this.client = new S3Client({ region: this.region })
  }

  async saveFile(buffer: Buffer, key: string, contentType = 'application/octet-stream'): Promise<SaveResult> {
    if (!this.bucket) throw new Error('AWS_S3_BUCKET not configured')
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }))
    const url = this.publicBase
      ? `${this.publicBase.replace(/\/$/, '')}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`
    return { url }
  }
}

export function createStorage(): StorageAdapter {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
  if (provider === 's3') return new S3Storage()
  return new LocalStorage()
}

