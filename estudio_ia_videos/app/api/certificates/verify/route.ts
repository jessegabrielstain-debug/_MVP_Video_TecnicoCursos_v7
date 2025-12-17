import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Access global mock store
declare global {
  var mockCertificates: Map<string, any>;
}

if (!global.mockCertificates) {
  global.mockCertificates = new Map();
}

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
         // Check mock store
         if (global.mockCertificates.has(code)) {
             const mockCert = global.mockCertificates.get(code);
             return NextResponse.json({
                valid: true,
                project_id: mockCert.projectId,
                student_name: mockCert.studentName,
                course_name: mockCert.courseName,
                issued_at: mockCert.issuedAt
            });
         }

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
     // Fallback for missing table
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const err = error as { code?: string; message?: string };
    logger.error('Error verifying certificate', errorObj, { component: 'API: /api/certificates/verify' });
    if (err.code === 'P2010' || err.code === 'P2021' || err.message?.includes('does not exist') || err.message?.includes('Tenant or user not found')) {
         if (global.mockCertificates.has(code)) {
             const mockCert = global.mockCertificates.get(code);
             return NextResponse.json({
                valid: true,
                project_id: mockCert.projectId,
                student_name: mockCert.studentName,
                course_name: mockCert.courseName,
                issued_at: mockCert.issuedAt
            });
         }
         return NextResponse.json({ valid: false, error: 'Certificate not found (mock)' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
