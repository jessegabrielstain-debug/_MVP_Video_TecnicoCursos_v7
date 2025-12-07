/**
 * API de Upload - Recebimento de Chunks
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'temp');
const METADATA_DIR = path.join(process.cwd(), 'uploads', 'metadata');

interface UploadMetadata {
  uploadId: string;
  filename: string;
  totalSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  createdAt: string;
  lastUpdated: string;
}

async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(METADATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

async function generateFileHash(buffer: Buffer): Promise<string> {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

export async function POST(request: NextRequest) {
  await ensureDirectories();

  try {
    const formData = await request.formData();
    
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const chunkHash = formData.get('chunkHash') as string;
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const chunkBlob = formData.get('chunk') as Blob;

    if (!uploadId || chunkIndex === undefined || !chunkHash || !chunkBlob) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Converter blob para buffer
    const chunkBuffer = Buffer.from(await chunkBlob.arrayBuffer());
    
    // Verificar integridade do chunk
    const calculatedHash = await generateFileHash(chunkBuffer);
    if (calculatedHash !== chunkHash) {
      return NextResponse.json(
        { error: 'Chunk integrity check failed' },
        { status: 400 }
      );
    }

    // Salvar chunk
    const chunkPath = path.join(UPLOAD_DIR, `${uploadId}_chunk_${chunkIndex}`);
    await fs.writeFile(chunkPath, chunkBuffer);

    // Atualizar metadata
    const metadataPath = path.join(METADATA_DIR, `${uploadId}.json`);
    
    let metadata: UploadMetadata;
    try {
      const existingData = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(existingData);
    } catch {
      // Criar metadata se não existir
      metadata = {
        uploadId,
        filename: `upload_${uploadId}`,
        totalSize: 0,
        totalChunks,
        uploadedChunks: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }

    // Adicionar chunk à lista se não estiver presente
    if (!metadata.uploadedChunks.includes(chunkIndex)) {
      metadata.uploadedChunks.push(chunkIndex);
      metadata.uploadedChunks.sort((a, b) => a - b);
    }

    metadata.lastUpdated = new Date().toISOString();
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      chunkIndex,
      uploadedChunks: metadata.uploadedChunks.length,
      totalChunks: metadata.totalChunks,
      progress: (metadata.uploadedChunks.length / metadata.totalChunks) * 100
    });

  } catch (error) {
    console.error('Chunk upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
