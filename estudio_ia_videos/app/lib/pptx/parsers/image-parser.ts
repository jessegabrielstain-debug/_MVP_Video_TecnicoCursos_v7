import JSZip from 'jszip';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { XMLParser } from 'fast-xml-parser';

export interface ImageExtractionOptions {
  maxImages?: number;
  includeThumbnails?: boolean;
  uploadToS3?: boolean;
  generateThumbnails?: boolean;
}

export interface ExtractedImage {
  id: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  position?: {
    x: number;
    y: number;
  };
}

export interface ImageExtractionResult {
  success: boolean;
  totalImages: number;
  images: ExtractedImage[];
  errors: string[];
}

export class PPTXImageParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  static async extractImages(
    zip: JSZip,
    projectId: string,
    options: ImageExtractionOptions = {},
  ): Promise<ImageExtractionResult> {
    const parser = new PPTXImageParser();
    return parser.extract(zip, projectId, options);
  }

  private async extract(
    zip: JSZip,
    projectId: string,
    options: ImageExtractionOptions = {},
  ): Promise<ImageExtractionResult> {
    const errors: string[] = [];
    const images: ExtractedImage[] = [];

    try {
      // Extrair todas as imagens da pasta ppt/media/
      const mediaFiles = Object.keys(zip.files).filter(
        (filename) => filename.startsWith('ppt/media/') && !zip.files[filename].dir
      );

      const maxImages = options.maxImages || mediaFiles.length;
      const filesToProcess = mediaFiles.slice(0, maxImages);

      for (const filename of filesToProcess) {
        try {
          const file = zip.files[filename];
          const buffer = await file.async('nodebuffer');
          const mimeType = this.getMimeType(filename);
          const imageName = filename.split('/').pop() || `image-${images.length}`;

          const extractedImage: ExtractedImage = {
            id: `img-${images.length}`,
            filename: imageName,
            buffer,
            mimeType,
          };

          // Upload para Supabase Storage se solicitado
          if (options.uploadToS3) {
            try {
              const uploadedUrl = await this.uploadToSupabase(
                buffer,
                projectId,
                imageName,
                mimeType
              );
              extractedImage.url = uploadedUrl;

              // Gerar thumbnail se solicitado
              if (options.generateThumbnails) {
                const thumbnailBuffer = await this.generateThumbnail(buffer, 300, 225);
                if (thumbnailBuffer) {
                  const thumbnailUrl = await this.uploadToSupabase(
                    thumbnailBuffer,
                    projectId,
                    `thumb_${imageName}`,
                    'image/png'
                  );
                  extractedImage.thumbnailUrl = thumbnailUrl;
                }
              }
            } catch (uploadError) {
              errors.push(`Erro ao fazer upload de ${imageName}: ${uploadError}`);
            }
          }

          images.push(extractedImage);
        } catch (fileError) {
          errors.push(`Erro ao processar ${filename}: ${fileError}`);
        }
      }

      return {
        success: errors.length === 0,
        totalImages: images.length,
        images,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        totalImages: 0,
        images: [],
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
      };
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      webp: 'image/webp',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  private async uploadToSupabase(
    buffer: Buffer,
    projectId: string,
    filename: string,
    mimeType: string
  ): Promise<string> {
    const supabase = createClientComponentClient();
    
    const filePath = `${projectId}/${Date.now()}-${filename}`;
    
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('assets')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  static async generateThumbnail(buffer: Buffer, width: number, height: number): Promise<Buffer | null> {
    try {
      const sharp = require('sharp') as typeof import('sharp');
      return await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
    } catch (error) {
      console.error('Sharp is not available or error generating thumbnail:', error);
      return null;
    }
  }
}
