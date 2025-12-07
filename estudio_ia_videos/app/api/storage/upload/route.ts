/**
 * STORAGE API - Upload e gerenciamento de arquivos
 * POST /api/storage/upload - Upload simples
 * GET /api/storage/upload - Listar arquivos do usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { storageSystem } from '@/lib/storage-system-real';
import { auditLogger, AuditAction, getRequestMetadata } from '@/lib/audit-logging-real';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter-real';
import { getServerSession } from 'next-auth';

const DEFAULT_BUCKET = 'videos';

export const POST = withRateLimit(RATE_LIMITS.UPLOAD, 'user')(async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const bucket = formData.get('bucket') as string || DEFAULT_BUCKET;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate path with userId for isolation
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `users/${session.user.id}/${folder}/${timestamp}_${safeName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    const publicUrl = await storageSystem.upload({
      bucket,
      path,
      file: fileBuffer,
      contentType: file.type || 'application/octet-stream',
    });

    // Audit log
    const { ip, userAgent } = getRequestMetadata(req);
    await auditLogger.logUserAction(
      session.user.id,
      AuditAction.FILE_UPLOAD,
      `${bucket}/${path}`,
      { fileName: file.name, size: file.size, ip, userAgent }
    );

    return NextResponse.json({ 
      url: publicUrl, 
      path, 
      bucket,
      fileName: file.name,
      size: file.size 
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get('bucket') || DEFAULT_BUCKET;

    const files = await storageSystem.listUserFiles(session.user.id, bucket);

    return NextResponse.json({ files });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

