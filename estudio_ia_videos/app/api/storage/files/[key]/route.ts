/**
 * STORAGE FILE API
 * GET /api/storage/files/[key] - Obter signed URL
 * DELETE /api/storage/files/[key] - Deletar arquivo
 */

import { NextRequest, NextResponse } from 'next/server';
import { storageSystem } from '@/lib/storage-system-real';
import { auditLogger, AuditAction, getRequestMetadata } from '@/lib/audit-logging-real';
import { getServerSession } from 'next-auth';

const DEFAULT_BUCKET = 'videos';

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');
    const bucket = searchParams.get('bucket') || DEFAULT_BUCKET;

    const signedUrl = await storageSystem.getSignedUrl(bucket, params.key, expiresIn);

    // Audit log
    const { ip, userAgent } = getRequestMetadata(req);
    await auditLogger.logUserAction(
      session.user.id,
      AuditAction.FILE_DOWNLOAD,
      `${bucket}/${params.key}`,
      { key: params.key, bucket, ip, userAgent }
    );

    return NextResponse.json({ url: signedUrl });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get('bucket') || DEFAULT_BUCKET;

    await storageSystem.delete(bucket, params.key);

    // Audit log
    const { ip, userAgent } = getRequestMetadata(req);
    await auditLogger.logUserAction(
      session.user.id,
      AuditAction.FILE_DELETE,
      `${bucket}/${params.key}`,
      { key: params.key, bucket, ip, userAgent }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
