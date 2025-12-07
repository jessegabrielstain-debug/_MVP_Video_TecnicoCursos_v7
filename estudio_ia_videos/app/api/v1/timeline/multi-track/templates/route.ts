// TODO: Fix timeline multi-track types
/**
 * 📋 Timeline Templates API - Reusable Templates
 * Sprint 44 - Save and load timeline templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST - Create template from timeline
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, name, description, category, isPublic } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { success: false, message: 'projectId e name são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`📋 Criando template "${name}" do projeto ${projectId}...`);

    // Get timeline from project
    const timeline = await prisma.timeline.findUnique({
      where: { projectId },
    });

    if (!timeline) {
      return NextResponse.json(
        { success: false, message: 'Timeline não encontrada' },
        { status: 404 }
      );
    }

    // Create template
    const template = await prisma.timelineTemplate.create({
      data: {
        name,
        description: description || '',
        category: category || 'custom',
        isPublic: isPublic || false,
        createdBy: session.user.id,
        tracks: timeline.tracks as any,
        settings: timeline.settings as any,
        totalDuration: timeline.totalDuration,
        metadata: {
          originalProjectId: projectId,
          tracksCount: Array.isArray(timeline.tracks) ? timeline.tracks.length : 0,
          version: timeline.version,
        },
      },
    });

    console.log(`✅ Template criado: ${template.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        isPublic: template.isPublic,
        tracksCount: (template.metadata as any)?.tracksCount || 0,
        totalDuration: template.totalDuration,
        createdAt: template.createdAt.toISOString(),
      },
      message: 'Template criado com sucesso',
    });

  } catch (error: unknown) {
    console.error('❌ Erro ao criar template:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Erro ao criar template', error: message },
      { status: 500 }
    );
  }
}

/**
 * GET - List templates or get specific template
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get specific template
    if (templateId) {
      const template = await prisma.timelineTemplate.findUnique({
        where: { id: templateId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!template) {
        return NextResponse.json(
          { success: false, message: 'Template não encontrado' },
          { status: 404 }
        );
      }

      // Check access (public or owned by user)
      if (!template.isPublic && template.createdBy !== session.user.id) {
        return NextResponse.json(
          { success: false, message: 'Acesso negado' },
          { status: 403 }
        );
      }

      const metadata = (template.metadata as any) || {};

      return NextResponse.json({
        success: true,
        data: {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          isPublic: template.isPublic,
          tracks: template.tracks,
          settings: template.settings,
          totalDuration: template.totalDuration,
          metadata: template.metadata,
          creator: {
            id: template.creator.id,
            name: template.creator.name,
            image: template.creator.avatarUrl,
          },
          createdAt: template.createdAt.toISOString(),
          usageCount: template.usageCount,
        },
      });
    }

    // List templates
    const where: import('@prisma/client').Prisma.TimelineTemplateWhereInput = {
      OR: [
        { isPublic: true },
        { createdBy: session.user.id },
      ],
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.timelineTemplate.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    const total = await prisma.timelineTemplate.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        templates: templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          isPublic: t.isPublic,
          tracksCount: (t.metadata as any)?.tracksCount || 0,
          totalDuration: t.totalDuration,
          usageCount: t.usageCount,
          creator: {
            id: t.creator.id,
            name: t.creator.name,
            image: t.creator.avatarUrl,
          },
          createdAt: t.createdAt.toISOString(),
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + templates.length < total,
        },
      },
    });

  } catch (error: unknown) {
    console.error('❌ Erro ao buscar templates:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Erro ao buscar templates', error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT - Apply template to project
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, projectId } = body;

    if (!templateId || !projectId) {
      return NextResponse.json(
        { success: false, message: 'templateId e projectId são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`📋 Aplicando template ${templateId} ao projeto ${projectId}...`);

    // Get template
    const template = await prisma.timelineTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Check access
    if (!template.isPublic && template.createdBy !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Apply template to timeline
    const timeline = await prisma.timeline.upsert({
      where: { projectId },
      create: {
        projectId,
        tracks: template.tracks as any,
        settings: template.settings as any,
        totalDuration: template.totalDuration,
        version: 1,
      },
      update: {
        tracks: template.tracks as any,
        settings: template.settings as any,
        totalDuration: template.totalDuration,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // Increment template usage count
    await prisma.timelineTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    console.log(`✅ Template aplicado à timeline ${timeline.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: timeline.id,
        projectId: timeline.projectId,
        version: timeline.version,
        tracks: timeline.tracks,
        settings: timeline.settings,
        totalDuration: timeline.totalDuration,
        updatedAt: timeline.updatedAt.toISOString(),
      },
      message: 'Template aplicado com sucesso',
    });

  } catch (error: unknown) {
    console.error('❌ Erro ao aplicar template:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Erro ao aplicar template', error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete template
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { success: false, message: 'templateId é obrigatório' },
        { status: 400 }
      );
    }

    // Get template to check ownership
    const template = await prisma.timelineTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template não encontrado' },
        { status: 404 }
      );
    }

    if (template.createdBy !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado - apenas o criador pode deletar' },
        { status: 403 }
      );
    }

    // Delete template
    await prisma.timelineTemplate.delete({
      where: { id: templateId },
    });

    console.log(`✅ Template deletado: ${templateId}`);

    return NextResponse.json({
      success: true,
      message: 'Template deletado com sucesso',
    });

  } catch (error: unknown) {
    console.error('❌ Erro ao deletar template:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: 'Erro ao deletar template', error: message },
      { status: 500 }
    );
  }
}


