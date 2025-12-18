/**
 * AWS Integration
 * Integração completa com AWS S3, CloudFront e MediaConvert
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { MediaConvertClient, CreateJobCommand, GetJobCommand } from '@aws-sdk/client-mediaconvert';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';

// ==============================================
// TIPOS
// ==============================================

export interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  s3Bucket: string;
  cloudFrontDistributionId?: string;
  mediaConvertEndpoint?: string;
}

export interface UploadOptions {
  file: Buffer | string; // Buffer ou path do arquivo
  key: string; // Caminho no S3
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
  cacheControl?: string;
}

export interface SignedUrlOptions {
  key: string;
  expiresIn?: number; // segundos (default: 3600 - 1 hora)
  responseHeaders?: {
    contentDisposition?: string;
    contentType?: string;
  };
}

export interface MediaConvertJobOptions {
  inputKey: string;
  outputPrefix: string;
  outputFormats: Array<{
    format: 'mp4' | 'hls' | 'dash';
    resolution: '360p' | '480p' | '720p' | '1080p' | '4k';
    bitrate?: number;
  }>;
}

// ==============================================
// AWS INTEGRATION
// ==============================================

export class AWSIntegration {
  private s3Client: S3Client;
  private cloudFrontClient?: CloudFrontClient;
  private mediaConvertClient?: MediaConvertClient;
  private config: AWSConfig;

  constructor(config?: Partial<AWSConfig>) {
    this.config = {
      region: config?.region || process.env.AWS_REGION || 'us-east-1',
      accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
      s3Bucket: config?.s3Bucket || process.env.AWS_S3_BUCKET || '',
      cloudFrontDistributionId: config?.cloudFrontDistributionId || process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
      mediaConvertEndpoint: config?.mediaConvertEndpoint || process.env.AWS_MEDIACONVERT_ENDPOINT
    };

    // Inicializar S3 Client
    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      }
    });

    // Inicializar CloudFront Client se configurado
    if (this.config.cloudFrontDistributionId) {
      this.cloudFrontClient = new CloudFrontClient({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey
        }
      });
    }

    // Inicializar MediaConvert Client se configurado
    if (this.config.mediaConvertEndpoint) {
      this.mediaConvertClient = new MediaConvertClient({
        region: this.config.region,
        endpoint: this.config.mediaConvertEndpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey
        }
      });
    }
  }

  /**
   * Upload de arquivo para S3
   */
  async upload(options: UploadOptions): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      let body: Buffer;

      // Se for path, ler arquivo
      if (typeof options.file === 'string') {
        body = await fs.readFile(options.file);
      } else {
        body = options.file;
      }

      const command = new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: options.key,
        Body: body,
        ContentType: options.contentType || this.guessContentType(options.key),
        Metadata: options.metadata,
        ACL: options.acl || 'private',
        CacheControl: options.cacheControl || 'max-age=31536000'
      });

      await this.s3Client.send(command);

      const url = this.getPublicUrl(options.key);

      logger.info('File uploaded to S3', {
        component: 'AWSIntegration',
        key: options.key,
        size: body.length
      });

      return { success: true, url };
    } catch (error) {
      logger.error('S3 upload error', error instanceof Error ? error : new Error(String(error)), {
        component: 'AWSIntegration',
        key: options.key
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Download de arquivo do S3
   */
  async download(key: string): Promise<{ success: boolean; data?: Buffer; error?: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        return { success: false, error: 'No data received' };
      }

      const data = await response.Body.transformToByteArray();

      logger.info('File downloaded from S3', {
        component: 'AWSIntegration',
        key,
        size: data.length
      });

      return { success: true, data: Buffer.from(data) };
    } catch (error) {
      logger.error('S3 download error', error instanceof Error ? error : new Error(String(error)), {
        component: 'AWSIntegration',
        key
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Deletar arquivo do S3
   */
  async delete(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key
      });

      await this.s3Client.send(command);

      logger.info('File deleted from S3', {
        component: 'AWSIntegration',
        key
      });

      return { success: true };
    } catch (error) {
      logger.error('S3 delete error', error instanceof Error ? error : new Error(String(error)), {
        component: 'AWSIntegration',
        key
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verificar se arquivo existe no S3
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gerar URL assinada (signed URL) para acesso temporário
   */
  async getSignedUrl(options: SignedUrlOptions): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: options.key,
        ResponseContentDisposition: options.responseHeaders?.contentDisposition,
        ResponseContentType: options.responseHeaders?.contentType
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: options.expiresIn || 3600
      });

      return { success: true, url };
    } catch (error) {
      logger.error('Error generating signed URL', error instanceof Error ? error : new Error(String(error)), {
        component: 'AWSIntegration',
        key: options.key
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Invalidar cache do CloudFront
   */
  async invalidateCloudFront(paths: string[]): Promise<{ success: boolean; error?: string }> {
    if (!this.cloudFrontClient || !this.config.cloudFrontDistributionId) {
      return { success: false, error: 'CloudFront not configured' };
    }

    try {
      const command = new CreateInvalidationCommand({
        DistributionId: this.config.cloudFrontDistributionId,
        InvalidationBatch: {
          CallerReference: `invalidation-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths.map(p => (p.startsWith('/') ? p : `/${p}`))
          }
        }
      });

      const response = await this.cloudFrontClient.send(command);

      logger.info('CloudFront invalidation created', {
        component: 'AWSIntegration',
        invalidationId: response.Invalidation?.Id,
        pathsCount: paths.length
      });

      return { success: true };
    } catch (error) {
      logger.error('CloudFront invalidation error', error instanceof Error ? error : new Error(String(error)), {
        component: 'AWSIntegration'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Criar job de transcodificação no MediaConvert
   */
  async createMediaConvertJob(
    options: MediaConvertJobOptions
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    if (!this.mediaConvertClient) {
      return { success: false, error: 'MediaConvert not configured' };
    }

    try {
      const inputS3 = `s3://${this.config.s3Bucket}/${options.inputKey}`;
      const outputS3 = `s3://${this.config.s3Bucket}/${options.outputPrefix}`;

      // Construir settings de output baseado nos formatos solicitados
      const outputs = options.outputFormats.map(format => ({
        ContainerSettings: {
          Container: format.format === 'mp4' ? 'MP4' : format.format === 'hls' ? 'M3U8' : 'MPD'
        },
        VideoDescription: {
          Width: this.getResolutionWidth(format.resolution),
          Height: this.getResolutionHeight(format.resolution),
          CodecSettings: {
            Codec: 'H_264',
            H264Settings: {
              MaxBitrate: format.bitrate || this.getDefaultBitrate(format.resolution),
              RateControlMode: 'QVBR',
              QualityTuningLevel: 'SINGLE_PASS_HQ'
            }
          }
        },
        AudioDescriptions: [
          {
            CodecSettings: {
              Codec: 'AAC',
              AacSettings: {
                Bitrate: 128000,
                CodingMode: 'CODING_MODE_2_0',
                SampleRate: 48000
              }
            }
          }
        ]
      }));

      const command = new CreateJobCommand({
        Role: process.env.AWS_MEDIACONVERT_ROLE_ARN,
        Settings: {
          Inputs: [
            {
              FileInput: inputS3,
              AudioSelectors: {
                'Audio Selector 1': {
                  DefaultSelection: 'DEFAULT'
                }
              },
              VideoSelector: {}
            }
          ],
          OutputGroups: [
            {
              OutputGroupSettings: {
                Type: 'FILE_GROUP_SETTINGS',
                FileGroupSettings: {
                  Destination: outputS3
                }
              },
              Outputs: outputs
            }
          ]
        }
      });

      const response = await this.mediaConvertClient.send(command);

      logger.info('MediaConvert job created', {
        component: 'AWSIntegration',
        jobId: response.Job?.Id
      });

      return { success: true, jobId: response.Job?.Id };
    } catch (error) {
      logger.error('MediaConvert job creation error', error instanceof Error ? error : new Error(String(error)), {
        component: 'AWSIntegration'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verificar status de job do MediaConvert
   */
  async getMediaConvertJobStatus(jobId: string): Promise<{
    success: boolean;
    status?: 'SUBMITTED' | 'PROGRESSING' | 'COMPLETE' | 'CANCELED' | 'ERROR';
    progress?: number;
    error?: string;
  }> {
    if (!this.mediaConvertClient) {
      return { success: false, error: 'MediaConvert not configured' };
    }

    try {
      const command = new GetJobCommand({ Id: jobId });
      const response = await this.mediaConvertClient.send(command);

      return {
        success: true,
        status: response.Job?.Status as any,
        progress: response.Job?.JobPercentComplete
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obtém URL pública do arquivo (via CloudFront se configurado, senão S3)
   */
  private getPublicUrl(key: string): string {
    if (this.config.cloudFrontDistributionId) {
      const domain = process.env.AWS_CLOUDFRONT_DOMAIN;
      if (domain) {
        return `https://${domain}/${key}`;
      }
    }
    return `https://${this.config.s3Bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Adivinha content type baseado na extensão
   */
  private guessContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      gif: 'image/gif',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      pdf: 'application/pdf',
      json: 'application/json',
      txt: 'text/plain',
      html: 'text/html',
      m3u8: 'application/vnd.apple.mpegurl',
      ts: 'video/mp2t',
      mpd: 'application/dash+xml'
    };
    return types[ext || ''] || 'application/octet-stream';
  }

  private getResolutionWidth(resolution: string): number {
    const widths: Record<string, number> = {
      '360p': 640,
      '480p': 854,
      '720p': 1280,
      '1080p': 1920,
      '4k': 3840
    };
    return widths[resolution] || 1920;
  }

  private getResolutionHeight(resolution: string): number {
    const heights: Record<string, number> = {
      '360p': 360,
      '480p': 480,
      '720p': 720,
      '1080p': 1080,
      '4k': 2160
    };
    return heights[resolution] || 1080;
  }

  private getDefaultBitrate(resolution: string): number {
    const bitrates: Record<string, number> = {
      '360p': 1000000,
      '480p': 2000000,
      '720p': 5000000,
      '1080p': 8000000,
      '4k': 35000000
    };
    return bitrates[resolution] || 5000000;
  }
}

// Export singleton
export const awsIntegration = new AWSIntegration();
