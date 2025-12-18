import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing certificate code' }, { status: 400 });
  }

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { code },
    });

    if (!certificate) {
      return NextResponse.json({ valid: false, error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      project_id: certificate.projectId,
      student_name: certificate.studentName,
      course_name: certificate.courseName,
      issued_at: certificate.issuedAt
    });

  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const err = error as { code?: string; message?: string };
    logger.error('Error verifying certificate', errorObj, { component: 'API: /api/certificates/verify' });
    
    return NextResponse.json(
      { error: 'Internal server error', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
