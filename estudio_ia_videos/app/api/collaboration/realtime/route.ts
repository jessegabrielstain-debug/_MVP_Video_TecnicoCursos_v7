/**
 * API: Real-Time Collaboration
 * Endpoints para colaboração simultânea
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar usuários ativos do projeto no banco de dados
    const { prisma } = await import('@/lib/prisma');
    
    try {
      // Buscar projeto e seus colaboradores
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          }
        }
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Projeto não encontrado' },
          { status: 404 }
        );
      }

      // Mapear colaboradores para formato de usuários ativos com status real via WebSocket
      const { getWebSocketServer } = await import('@/lib/notifications/websocket-server');
      const wsServer = getWebSocketServer();
      
      const activeUsers = project.collaborators.map((collab, index) => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        const isOnline = wsServer.isUserOnline(collab.user.id);
        
        return {
          id: collab.user.id,
          name: collab.user.name || 'Usuário',
          email: collab.user.email || '',
          image: collab.user.image || null,
          role: collab.role || 'viewer',
          color: colors[index % colors.length],
          status: isOnline ? 'online' : 'offline',
          connectionCount: wsServer.getUserConnectionCount(collab.user.id)
        };
      });

      logger.info('Usuários ativos do projeto', { projectId, usersCount: activeUsers.length, component: 'API: collaboration/realtime' });

      return NextResponse.json({
        success: true,
        projectId,
        activeUsers,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erro ao buscar usuários ativos', error instanceof Error ? error : new Error(String(error)), { component: 'API: collaboration/realtime' });
      // Fallback para array vazio em caso de erro
      return NextResponse.json({
        success: true,
        projectId,
        activeUsers: [],
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Erro na API de colaboração', err, { component: 'API: collaboration/realtime' })
    return NextResponse.json(
      { error: 'Erro ao buscar dados de colaboração' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, projectId, userId, data } = body

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'projectId e userId são obrigatórios' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma');

    switch (action) {
      case 'lock_element': {
        const { elementId, trackId } = data;
        
        // Verificar se já está bloqueado
        const existingLock = await prisma.timelineTrackLock.findFirst({
          where: {
            projectId,
            trackId: trackId || elementId,
            userId: { not: userId }
          }
        });

        if (existingLock) {
          return NextResponse.json({
            success: false,
            error: 'Elemento já está bloqueado por outro usuário',
            lockedBy: existingLock.userId
          }, { status: 409 });
        }

        // Criar lock
        await prisma.timelineTrackLock.upsert({
          where: {
            projectId_trackId_userId: {
              projectId,
              trackId: trackId || elementId,
              userId
            }
          },
          update: {
            updatedAt: new Date()
          },
          create: {
            projectId,
            trackId: trackId || elementId,
            userId
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Elemento bloqueado',
          elementId: trackId || elementId,
          lockedBy: userId
        });
      }

      case 'unlock_element': {
        const { elementId, trackId } = data;
        
        await prisma.timelineTrackLock.deleteMany({
          where: {
            projectId,
            trackId: trackId || elementId,
            userId
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Elemento desbloqueado',
          elementId: trackId || elementId
        });
      }

      case 'add_comment': {
        const { commentsService } = await import('@/lib/collab/comments-service');
        const comment = await commentsService.createComment({
          projectId,
          userId,
          content: data.content,
          position: data.position || null,
          parentId: data.parentId || null
        });

        return NextResponse.json({
          success: true,
          message: 'Comentário adicionado',
          commentId: comment?.id || `comment-${Date.now()}`
        });
      }

      case 'save_version': {
        const { name, description, projectData } = data;
        
        // Obter versão atual
        const currentVersion = await prisma.projectVersion.findFirst({
          where: { projectId },
          orderBy: { versionNumber: 'desc' }
        });

        const nextVersion = currentVersion ? currentVersion.versionNumber + 1 : 1;

        const version = await prisma.projectVersion.create({
          data: {
            projectId,
            userId,
            name: name || `Versão ${nextVersion}`,
            description: description || '',
            versionNumber: nextVersion,
            projectData: projectData || {}
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Versão salva',
          versionId: version.id,
          versionNumber: nextVersion
        });
      }

      case 'sync_change': {
        const { syncEngine } = await import('@/lib/collaboration/sync-engine');
        const result = await syncEngine.applyChange({
          id: data.changeId || `change-${Date.now()}`,
          projectId,
          userId,
          elementId: data.elementId,
          changeType: data.changeType,
          data: data.data,
          timestamp: new Date(),
          version: data.version || 0
        });

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); 
    logger.error('Erro ao processar ação de colaboração', err, { component: 'API: collaboration/realtime' })
    return NextResponse.json(
      { error: 'Erro ao processar requisição', details: err.message },
      { status: 500 }
    )
  }
}
