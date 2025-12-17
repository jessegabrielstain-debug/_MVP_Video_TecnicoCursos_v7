// TODO: Fix null vs undefined return types
/**
 * API de Upload - Finalização e Montagem do Arquivo
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'temp');
const METADATA_DIR = path.join(process.cwd(), 'uploads', 'metadata');
const FINAL_DIR = path.join(process.cwd(), 'uploads', 'files');

interface UploadMetadata {
  uploadId: string;
  filename: string;
  totalSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  createdAt: string;
  lastUpdated: string;
}

interface UploadResponse {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  metadata: Record<string, unknown>;
  uploadedAt: string;
}

async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(METADATA_DIR, { recursive: true });
    await fs.mkdir(FINAL_DIR, { recursive: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Error creating directories', err, { component: 'API: upload/finalize' });
  }
}

async function assembleFile(uploadId: string, totalChunks: number): Promise<string> {
  const finalPath = path.join(FINAL_DIR, `${uploadId}_assembled`);
  const writeStream = await fs.open(finalPath, 'w');

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(UPLOAD_DIR, `${uploadId}_chunk_${i}`);
      
      try {
        const chunkData = await fs.readFile(chunkPath);
        await writeStream.write(chunkData, 0, chunkData.length, null);
      } catch (error) {
        throw new Error(`Missing chunk ${i} for upload ${uploadId}`);
      }
    }
  } finally {
    await writeStream.close();
  }

  return finalPath;
}

async function cleanupChunks(uploadId: string, totalChunks: number) {
  const cleanupPromises = [];
  
  // Remover chunks
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(UPLOAD_DIR, `${uploadId}_chunk_${i}`);
    cleanupPromises.push(
      fs.unlink(chunkPath).catch(() => {
        // Ignorar erros de arquivos que não existem
      })
    );
  }

  // Remover metadata
  const metadataPath = path.join(METADATA_DIR, `${uploadId}.json`);
  cleanupPromises.push(
    fs.unlink(metadataPath).catch(() => {
      // Ignorar erro se arquivo não existir
    })
  );

  await Promise.all(cleanupPromises);
}

async function generateThumbnail(filePath: string, mimeType: string): Promise<string | null> {
  // Implementação simplificada - em produção usar sharp, ffmpeg, etc.
  if (mimeType.startsWith('image/')) {
    // Para imagens, poderia gerar thumbnail
    return null;
  } else if (mimeType.startsWith('video/')) {
    // Para vídeos, poderia extrair frame
    return null;
  }
  return null;
}

function getPublicUrl(filename: string): string {
  // Em produção, retornar URL do CDN/storage
  return `/api/files/${filename}`;
}

export async function POST(request: NextRequest) {
  await ensureDirectories();

  try {
    const { uploadId, filename, mimeType, totalSize, chunks } = await request.json();

    if (!uploadId || !filename || !mimeType || !totalSize || !chunks) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar metadata
    const metadataPath = path.join(METADATA_DIR, `${uploadId}.json`);
    let metadata: UploadMetadata;

    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch {
      return NextResponse.json(
        { error: 'Upload session not found' },
        { status: 404 }
      );
    }

    // Verificar se todos os chunks foram enviados
    if (metadata.uploadedChunks.length !== chunks) {
      return NextResponse.json(
        { 
          error: 'Upload incomplete',
          uploadedChunks: metadata.uploadedChunks.length,
          expectedChunks: chunks
        },
        { status: 400 }
      );
    }

    // Montar arquivo final
    const assembledPath = await assembleFile(uploadId, chunks);
    
    // Verificar tamanho do arquivo montado
    const stats = await fs.stat(assembledPath);
    if (stats.size !== totalSize) {
      await fs.unlink(assembledPath);
      return NextResponse.json(
        { error: 'File size mismatch after assembly' },
        { status: 400 }
      );
    }

    // Mover para localização final
    const finalFilename = `${uploadId}_${filename}`;
    const finalPath = path.join(FINAL_DIR, finalFilename);
    await fs.rename(assembledPath, finalPath);

    // Gerar thumbnail se aplicável
    const thumbnailUrl = await generateThumbnail(finalPath, mimeType);

    // Limpar arquivos temporários
    await cleanupChunks(uploadId, chunks);

    // Preparar resposta
    const response: UploadResponse = {
      id: uploadId,
      filename,
      size: stats.size,
      mimeType,
      url: getPublicUrl(finalFilename),
      thumbnailUrl: thumbnailUrl || undefined,
      metadata: {
        originalFilename: filename,
        uploadedChunks: chunks,
        assembledAt: new Date().toISOString(),
        contentLength: stats.size
      },
      uploadedAt: new Date().toISOString()
    };

    // Log de sucesso
    logger.info(`Upload completed: ${uploadId} - ${filename} (${stats.size} bytes)`, { component: 'API: upload/finalize', uploadId, filename, size: stats.size });

    return NextResponse.json(response);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Upload finalization error', err, { component: 'API: upload/finalize' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
