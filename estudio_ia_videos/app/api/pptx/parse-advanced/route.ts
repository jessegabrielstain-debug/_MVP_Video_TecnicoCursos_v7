/**
 * API para parsear PPTX com parser avançado
 * POST /api/pptx/parse-advanced
 * Sprint 48 - FASE 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { parsePPTXAdvanced } from '@/lib/pptx-parser-advanced';
import { uploadFile } from '@/lib/s3';
import sharp from 'sharp';

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'pptx-uploads';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não enviado' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.pptx')) {
      return NextResponse.json(
        { error: 'Arquivo deve ser .pptx' },
        { status: 400 }
      );
    }

    // Converte para buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse avançado
    console.log(`🔍 Iniciando parsing avançado de: ${file.name} (${buffer.length} bytes)`);
    const parseResult = await parsePPTXAdvanced(buffer);
    console.log(`✅ Parsing concluído: ${parseResult.slides.length} slides, ${parseResult.images.length} imagens`);

    // Upload do arquivo original para S3
    const folderPrefix = process.env.AWS_FOLDER_PREFIX || '';
    const s3Key = `${folderPrefix}pptx/${Date.now()}-${file.name}`;
    const s3Url = await uploadFile(BUCKET_NAME, s3Key, buffer);

    // Salva no banco (opcional - pode ser salvo depois no upload real)
    const slidesDataJson = {
      slides: parseResult.slides.map(s => ({
        slideNumber: s.slideNumber,
        title: s.title,
        content: s.content,
        notes: s.notes,
        layout: s.layout,
        imageCount: s.images.length
      })),
      metadata: {
        title: parseResult.metadata.title,
        author: parseResult.metadata.author,
        subject: parseResult.metadata.subject,
        created: parseResult.metadata.created ? new Date(parseResult.metadata.created).toISOString() : null,
        modified: parseResult.metadata.modified ? new Date(parseResult.metadata.modified).toISOString() : null,
        slideCount: parseResult.metadata.slideCount
      },
      parsedAt: new Date().toISOString()
    };

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: parseResult.metadata.title || file.name,
        description: parseResult.metadata.subject || '',
        user_id: user.id,
        type: 'pptx',
        status: 'draft',
        metadata: {
            pptxUrl: s3Url,
            originalFileName: file.name,
            totalSlides: parseResult.slides.length,
            slidesData: slidesDataJson
        }
      })
      .select()
      .single();

    if (projectError || !project) {
        throw new Error(`Erro ao criar projeto: ${projectError?.message}`);
    }

    // Upload de imagens para S3 com otimização (se houver)
    const imageUrls: Record<string, string> = {};
    const processedImages = [];
    
    for (const image of parseResult.images) {
      try {
        // Otimizar imagem com Sharp
        const optimizedBuffer = await sharp(image.data)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();

        // Upload para S3
        const imageKey = `${folderPrefix}pptx-images/${project.id}/${image.name}`;
        const imageUrl = await uploadFile(BUCKET_NAME, imageKey, optimizedBuffer, 'image/jpeg');
        
        // Obter dimensões da imagem otimizada
        const metadata = await sharp(optimizedBuffer).metadata();
        
        imageUrls[image.id] = imageUrl;
        processedImages.push({
          id: image.id,
          name: image.name,
          url: imageUrl,
          width: metadata.width || 0,
          height: metadata.height || 0,
          size: optimizedBuffer.length
        });
        
        console.log(`✅ Imagem otimizada: ${image.name} -> ${imageUrl}`);
      } catch (error) {
        console.error(`❌ Erro ao processar imagem ${image.name}:`, error);
        // Fallback: upload sem otimização
        const imageKey = `${folderPrefix}pptx-images/${project.id}/${image.name}`;
        const imageUrl = await uploadFile(BUCKET_NAME, imageKey, image.data);
        imageUrls[image.id] = imageUrl;
      }
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      metadata: parseResult.metadata,
      slides: parseResult.slides.map(slide => ({
        slideNumber: slide.slideNumber,
        title: slide.title,
        content: slide.content,
        notes: slide.notes,
        layout: slide.layout,
        imageCount: slide.images.length
      })),
      imageUrls,
      processedImages,
      s3Url,
      stats: {
        totalSlides: parseResult.slides.length,
        totalImages: parseResult.images.length,
        processedImages: processedImages.length,
        fileSize: buffer.length
      }
    });

  } catch (error) {
    console.error('[API] Erro ao parsear PPTX:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao processar PPTX',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Retorna informações sobre um projeto já parseado
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId obrigatório' },
        { status: 400 }
      );
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    const metadata = project.metadata as any;

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        slidesData: metadata?.slidesData,
        totalSlides: metadata?.totalSlides,
        pptxUrl: metadata?.pptxUrl,
        originalFileName: metadata?.originalFileName,
        createdAt: project.created_at
      }
    });

  } catch (error) {
    console.error('[API] Erro ao buscar projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar projeto' },
      { status: 500 }
    );
  }
}


