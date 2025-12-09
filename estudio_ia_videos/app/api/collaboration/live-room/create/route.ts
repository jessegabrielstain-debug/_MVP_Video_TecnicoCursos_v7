
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { projectId, roomName, maxCollaborators = 10 } = await request.json();

    // Validate required fields
    if (!projectId || !roomName) {
      return NextResponse.json(
        { error: 'Project ID and room name are required' },
        { status: 400 }
      );
    }

    // Generate room ID and configuration
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const roomConfig = {
      id: roomId,
      projectId,
      name: roomName,
      maxCollaborators,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      settings: {
        allowEdit: true,
        allowComment: true,
        allowDownload: false,
        recordSession: true,
        enableWebRTC: true
      },
      security: {
        requireAuth: true,
        allowGuests: false,
        accessCode: Math.random().toString(36).substr(2, 8).toUpperCase()
      }
    };

    // In production, this would be stored in database
    logger.info('Live collaboration room created', {
      component: 'API: collaboration/live-room/create',
      context: { roomConfig }
    });

    return NextResponse.json({
      success: true,
      room: roomConfig,
      joinUrl: `/live-editing-room?room=${roomId}&project=${projectId}`,
      message: 'Sala de colaboração criada com sucesso'
    });

  } catch (error) {
    logger.error('Error creating live room', {
      component: 'API: collaboration/live-room/create',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Mock active rooms for project
    const activeRooms = [
      {
        id: 'room_abc123',
        projectId,
        name: 'NR-12 Review Session',
        collaborators: 4,
        maxCollaborators: 10,
        status: 'active',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: 'room_def456',
        projectId,
        name: 'Voice Cloning Updates',
        collaborators: 2,
        maxCollaborators: 6,
        status: 'active',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      rooms: activeRooms,
      totalActiveRooms: activeRooms.length
    });

  } catch (error) {
    logger.error('Error fetching live rooms', {
      component: 'API: collaboration/live-room/create',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

