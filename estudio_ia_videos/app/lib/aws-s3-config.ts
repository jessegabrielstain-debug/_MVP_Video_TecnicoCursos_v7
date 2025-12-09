/**
 * AWS S3 Config
 * Configuração do cliente S3
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '@/lib/logger';

/**
 * AWS S3 Config
 * Configuração do cliente S3
 */

export interface S3Config {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  bucket: string;
}

export const s3Config: S3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  bucket: process.env.AWS_S3_BUCKET || 'estudio-ia-videos',
};

let s3ClientInstance: S3Client | null = null;

export const createS3Client = () => {
  if (s3ClientInstance) return s3ClientInstance;

  logger.info('[S3] Creating S3 client for region', { component: 'AwsS3Config', region: s3Config.region });
  s3ClientInstance = new S3Client({
    region: s3Config.region,
    credentials: s3Config.credentials,
  });
  
  return s3ClientInstance;
};

export const validateFile = (file: File) => {
  // Basic validation
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large (max 100MB)' };
  }
  return { valid: true, error: null };
};

export const uploadFileToS3 = async (file: File | Buffer, key: string, contentType?: string) => {
  logger.info('[S3] Uploading file to S3', { component: 'AwsS3Config', key });
  
  const client = createS3Client();
  
  // Determine content type if not provided
  let type = contentType;
  if (!type && 'type' in file) {
    type = file.type;
  }
  if (!type) {
    type = 'application/octet-stream';
  }

  // Handle Buffer vs File
  let body: Buffer | Uint8Array | Blob;
  if (Buffer.isBuffer(file)) {
    body = file;
  } else if (file instanceof Blob) {
    // Browser environment
    body = file;
  } else {
    // Fallback or error
    throw new Error('Invalid file format for upload');
  }

  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    Body: body,
    ContentType: type,
  });

  try {
    await client.send(command);
    const url = `https://${s3Config.bucket}.s3.amazonaws.com/${key}`;
    return { url, key };
  } catch (error) {
    logger.error('[S3] Upload error', error instanceof Error ? error : new Error(String(error)), { component: 'AwsS3Config' });
    throw error;
  }
};

