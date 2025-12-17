/**
 * 🎬 API de Download de Arquivos
 * Endpoint para download de vídeos renderizados
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobManager as renderJobManager } from '@/lib/render/job-manager';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;

    if (!filename) {
      return NextResponse.json(
        { error: 'Nome do arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Extrair jobId do filename (formato: jobId.format)
    const jobId = filename.split('.')[0];
    
    // Verificar se job existe e foi concluído
    const job = await renderJobManager.getJob(jobId);
    if (!job || job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Arquivo não disponível' },
        { status: 404 }
      );
    }

    // Caminho do arquivo
    const filePath = path.join(process.cwd(), 'public', 'renders', filename);

    try {
      // Verificar se arquivo existe
      await fs.access(filePath);

      // Ler arquivo
      const fileBuffer = await fs.readFile(filePath);

      // Determinar Content-Type
      const contentType = getContentType(filename);

      // Retornar arquivo
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000' // Cache por 1 ano
        }
      });

    } catch (fileError) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }

  } catch (error) {
    logger.error('Erro ao fazer download', error instanceof Error ? error : new Error(String(error)), { component: 'API: render/output' });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;

    if (!filename) {
      return NextResponse.json(
        { error: 'Nome do arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Caminho do arquivo
    const filePath = path.join(process.cwd(), 'public', 'renders', filename);

    try {
      // Deletar arquivo
      await fs.unlink(filePath);

      // Extrair jobId e remover do gerenciador
      const jobId = filename.split('.')[0];
      renderJobManager.removeJob(jobId);

      return NextResponse.json({
        success: true,
        message: 'Arquivo deletado com sucesso'
      });

    } catch (fileError) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }

  } catch (error) {
    logger.error('Erro ao deletar arquivo', error instanceof Error ? error : new Error(String(error)), { component: 'API: render/output' });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Determina Content-Type baseado na extensão do arquivo
 */
function getContentType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();

  switch (extension) {
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.gif':
      return 'image/gif';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    default:
      return 'application/octet-stream';
  }
}