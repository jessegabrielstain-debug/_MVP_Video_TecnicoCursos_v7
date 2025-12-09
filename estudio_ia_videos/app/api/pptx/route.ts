/**
 * 📄 API PPTX - Upload, Parse e Processamento
 * Sistema completo para gerenciamento de apresentações
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/services';
import { logger } from '@/lib/logger';

/**
 * POST - Upload e parse de arquivo PPTX
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth Check
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    
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
        
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: 'dummy'
        });
        
        if (sessionError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const result = await supabase.auth.getUser();
        user = result.data.user;
    } else {
        supabase = getSupabaseForRequest(request);
        const result = await supabase.auth.getUser();
        user = result.data.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const settingsStr = formData.get('settings') as string;
    const settings = settingsStr ? JSON.parse(settingsStr) : {};

    if (!file) {
      return NextResponse.json({ error: 'Arquivo PPTX não fornecido' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pptx')) {
      return NextResponse.json({ error: 'Formato inválido. Apenas .pptx' }, { status: 400 });
    }

    // 2. Create Project in DB
    const { data: project, error: projectError } = await (supabaseAdmin as any)
      .from('projects')
      .insert({
        user_id: user.id,
        name: file.name.replace('.pptx', ''),
        status: 'processing', // Or 'draft'
        type: 'pptx',
        metadata: settings
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error(`Failed to create project: ${projectError?.message}`);
    }

    logger.info(`[PPTX API] Project created: ${project.id}`, { component: 'API: pptx' });

    // 3. Parse PPTX (Using Advanced Parser)
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Dynamically import the advanced parser
    const { parseCompletePPTX } = await import('@/lib/pptx/parsers/advanced-parser');
    
    logger.info(`[PPTX API] Starting Advanced Parse for project: ${project.id}`, { component: 'API: pptx' });
    
    // Parse with all features enabled
    const parsedData = await parseCompletePPTX(fileBuffer, project.id, {
      includeImages: true,
      includeNotes: true,
      includeAnimations: false // Animations can be complex, keeping it simple for now
    });

    if (!parsedData.success) {
        logger.error('[PPTX API] Parse errors:', new Error(parsedData.errors.join(', ')), { component: 'API: pptx' });
        throw new Error(`PPTX Parse failed: ${parsedData.errors.join(', ')}`);
    }

    // 4. Insert Slides
    const slidesToInsert = parsedData.slides.map((slide: any, index: number) => {
        // Combine text content
        const textContent = slide.text.textItems.map((t: any) => t.text).join('\n');
        
        // Get primary image if available
        const backgroundImage = slide.images.length > 0 ? slide.images[0].path : null;
        
        return {
            project_id: project.id,
            order_index: index,
            title: `Slide ${slide.slideNumber}`,
            content: textContent || `Slide ${slide.slideNumber}`, 
            duration: Math.max(5, slide.duration.estimatedDuration), // Use estimated duration or min 5s
            notes: slide.notes.notes || null,
            background_url: backgroundImage, // Store image URL if available
            layout: slide.layout.type || 'custom',
            metadata: {
                hasImages: slide.images.length > 0,
                wordCount: slide.text.wordCount,
                originalSlideNumber: slide.slideNumber
            }
        };
    });

    if (slidesToInsert.length > 0) {
      const { error: slidesError } = await supabaseAdmin
        .from('slides')
        .insert(slidesToInsert);

      if (slidesError) {
        logger.error('Failed to insert slides:', new Error(slidesError.message), { component: 'API: pptx' });
        // Don't fail the whole request, but log it. 
        // Actually, if slides fail, the project is empty. We should probably fail.
        throw new Error(`Failed to save slides: ${slidesError.message}`);
      }
    }

    // 5. Update Project Status
    await supabaseAdmin
      .from('projects')
      .update({
        status: 'draft', // Ready for editing
        total_slides: slidesToInsert.length
      })
      .eq('id', project.id);

    return NextResponse.json({
      success: true,
      projectId: project.id,
      message: 'PPTX processado com sucesso',
      slideCount: slidesToInsert.length
    });

  } catch (error) {
    logger.error('[PPTX API] Upload error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * GET - Obter status de job ou listar jobs
 */
export async function GET(request: NextRequest) {
    // Placeholder for future implementation if needed
    return NextResponse.json({ message: 'Use /api/projects to list projects' });
}

/**
 * DELETE - Cancelar job ou remover documento
 */
export async function DELETE(request: NextRequest) {
    // Placeholder
    return NextResponse.json({ message: 'Use /api/projects to delete projects' });
}
