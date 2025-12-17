import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

// Global mock store for development/testing when DB is down
declare global {
  var mockCertificates: Map<string, any>;
}

if (!global.mockCertificates) {
  global.mockCertificates = new Map();
}

export async function POST(request: NextRequest) {
  try {
    // Authentication Logic (copied from projects/route.ts)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    
    let supabase;
    let user;
    
    if (authHeader) {
        // Create a clean client and set session manually
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        );
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader.startsWith('bearer ') ? authHeader.substring(7) : authHeader;
        
        await supabase.auth.setSession({
            access_token: token,
            refresh_token: 'dummy'
        });
        
        const result = await supabase.auth.getUser();
        user = result.data.user;
    } else {
        // Fallback to cookie based
        supabase = getSupabaseForRequest(request);
        const result = await supabase.auth.getUser();
        user = result.data.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, courseName, studentName } = body;

    if (!projectId || !courseName || !studentName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique certificate code
    const code = uuidv4().split('-')[0].toUpperCase();

    // Try to create in DB
    try {
      const certificate = await prisma.certificate.create({
        data: {
          projectId,
          userId: user.id,
          studentName,
          courseName,
          code,
          certificateUrl: `https://cert.tecnocursos.com.br/${code}`,
          metadata: {
            generatedBy: 'AI Studio',
            version: '1.0'
          }
        },
      });
      return NextResponse.json(certificate, { status: 201 });
    } catch (dbError: unknown) {
      logger.error('Database error creating certificate', dbError instanceof Error ? dbError : new Error(String(dbError))
      , { component: 'API: certificates' });
      
      const err = dbError as { code?: string; message?: string };
      // Fallback: Store in memory
      if (err.code === 'P2010' || err.code === 'P2021' || err.message?.includes('does not exist') || err.message?.includes('Tenant or user not found')) {
        logger.warn('Certificate table missing or DB error', {
          component: 'API: certificates'
        });
        
        const mockCert = {
          id: uuidv4(),
          projectId,
          userId: user.id,
          studentName,
          courseName,
          code,
          certificateUrl: `https://cert.tecnocursos.com.br/${code}`,
          issuedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        global.mockCertificates.set(code, mockCert);
        
        return NextResponse.json(mockCert, { status: 201 });
      }
      
      return NextResponse.json(
        { error: 'Failed to create certificate', details: err.message || 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error)); 
    logger.error('Error generating certificate', err, { component: 'API: certificates' });
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
