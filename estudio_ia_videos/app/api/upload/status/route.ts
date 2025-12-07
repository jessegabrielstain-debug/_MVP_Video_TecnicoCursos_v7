/**
 * API de Upload - Status e Verificação de Chunks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, rateLimitPresets } from '@/lib/utils/rate-limit-middleware';
import { promises as fs } from 'fs';
import path from 'path';

// Simulação de storage - em produção usar S3, Google Cloud Storage, etc.
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'temp');
const METADATA_DIR = path.join(process.cwd(), 'uploads', 'metadata');

// Garantir que diretórios existam
async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(METADATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

interface UploadMetadata {
  uploadId: string;
  filename: string;
  totalSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  createdAt: string;
  lastUpdated: string;
}

const rateLimiterPost = createRateLimiter(rateLimitPresets.upload);
export async function POST(request: NextRequest) {
  return rateLimiterPost(request, async (request: NextRequest) => {
  await ensureDirectories();

  try {
    const { uploadId, filename, totalSize, chunks } = await request.json();

    if (!uploadId || !filename || !totalSize || !chunks) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const metadataPath = path.join(METADATA_DIR, `${uploadId}.json`);
    let uploadedChunks: number[] = [];

    try {
      // Verificar se upload já existe
      const existingData = await fs.readFile(metadataPath, 'utf-8');
      const metadata: UploadMetadata = JSON.parse(existingData);
      uploadedChunks = metadata.uploadedChunks || [];

      // Verificar integridade dos chunks existentes
      const validChunks: number[] = [];
      for (const chunkIndex of uploadedChunks) {
        const chunkPath = path.join(UPLOAD_DIR, `${uploadId}_chunk_${chunkIndex}`);
        try {
          await fs.access(chunkPath);
          validChunks.push(chunkIndex);
        } catch {
          // Chunk não existe mais, remover da lista
          console.warn(`Chunk ${chunkIndex} for upload ${uploadId} not found`);
        }
      }
      uploadedChunks = validChunks;

    } catch {
      // Upload novo, criar metadata
      const metadata: UploadMetadata = {
        uploadId,
        filename,
        totalSize,
        totalChunks: chunks.length,
        uploadedChunks: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }

    return NextResponse.json({
      uploadId,
      uploadedChunks,
      totalChunks: chunks.length,
      resumable: uploadedChunks.length > 0
    });

  } catch (error) {
    console.error('Upload status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
  });
}
