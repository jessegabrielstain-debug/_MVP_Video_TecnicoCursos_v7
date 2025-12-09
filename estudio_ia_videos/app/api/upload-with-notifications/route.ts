// TODO: Fix ActiveUpload type parameter
/**
 * API Route: Upload com Notificações Real-time
 */

import { NextRequest, NextResponse } from 'next/server';
import { UploadManager } from '@/lib/upload/upload-manager';
import { NotificationManager } from '@/lib/notifications/notification-manager';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const roomId = formData.get('roomId') as string;
    const enableNotifications = formData.get('enableNotifications') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }

    // Validações
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 100MB permitido.' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado' },
        { status: 400 }
      );
    }

    // Configurar notificações se solicitado
    const notificationManager = NotificationManager.getInstance();
    if (enableNotifications && userId && roomId) {
      // Verificar se a sala existe, criar se necessário
      const room = notificationManager.getRoom(roomId);
      if (!room) {
        notificationManager.createRoom(roomId, `Sala de Upload - ${userId}`);
      }
      
      // Garantir que o usuário está na sala
      notificationManager.joinRoom(roomId, userId);
    }

    // Iniciar upload com configurações
    const uploadManager = new UploadManager();
    const result = await uploadManager.uploadFile(file, '/api/storage/upload', {
      enableNotifications,
      userId,
      roomId,
      chunkSize: 1024 * 1024 * 5, // 5MB chunks
      maxRetries: 3,
      enableCompression: true,
      compressionQuality: 0.8,
      metadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        mimeType: file.type,
        size: file.size
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Upload concluído com sucesso'
    });

  } catch (error) {
    logger.error('Erro no upload', { component: 'API: upload-with-notifications', error: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json(
        { error: 'ID do upload é obrigatório' },
        { status: 400 }
      );
    }

    const uploadManager = new UploadManager();
    const progress = uploadManager.getUploadProgress(uploadId);
    const activeUploads = uploadManager.getActiveUploads();

    return NextResponse.json({
      success: true,
      data: {
        progress,
        isActive: activeUploads.some(u => u.id === uploadId),
        activeUploads: activeUploads.length
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar progresso', { component: 'API: upload-with-notifications', error: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');
    const action = searchParams.get('action');

    if (!uploadId || !action) {
      return NextResponse.json(
        { error: 'ID do upload e ação são obrigatórios' },
        { status: 400 }
      );
    }

    const uploadManager = new UploadManager();
    let result: boolean | Record<string, unknown> = false;

    switch (action) {
      case 'pause':
        result = await uploadManager.pauseUpload(uploadId);
        break;
      case 'resume':
        result = await uploadManager.resumeUpload(uploadId);
        break;
      case 'cancel':
        result = await uploadManager.cancelUpload(uploadId);
        break;
      default:
        return NextResponse.json(
          { error: 'Ação inválida. Use: pause, resume ou cancel' },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Upload não encontrado ou ação não pôde ser executada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Upload ${action === 'resume' ? 'retomado' : action === 'pause' ? 'pausado' : 'cancelado'} com sucesso`,
      data: typeof result === 'object' ? result : { uploadId, action }
    });

  } catch (error) {
    logger.error('Erro na ação do upload', { component: 'API: upload-with-notifications', error: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json(
        { error: 'ID do upload é obrigatório' },
        { status: 400 }
      );
    }

    const uploadManager = new UploadManager();
    const result = await uploadManager.cancelUpload(uploadId);

    if (!result) {
      return NextResponse.json(
        { error: 'Upload não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Upload cancelado e removido com sucesso'
    });

  } catch (error) {
    logger.error('Erro ao deletar upload', { component: 'API: upload-with-notifications', error: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
