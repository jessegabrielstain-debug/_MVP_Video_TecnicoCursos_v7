/**
 * API Route para Integração Upload-Notificações
 */

import { NextRequest } from 'next/server';
import { notificationManager } from '@/lib/notifications/notification-manager';
import { getWebSocketServer } from '@/lib/notifications/websocket-server';
import { logger } from '@/lib/logger';

interface UploadProgressData {
  uploadId: string;
  userId: string;
  roomId?: string;
  filename: string;
  progress: number;
  total: number;
  speed?: number;
  eta?: number;
  phase: 'preparing' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadProgressData = await request.json();
    
    const {
      uploadId,
      userId,
      roomId,
      filename,
      progress,
      total,
      speed,
      eta,
      phase,
      error
    } = body;

    const percentage = total > 0 ? (progress / total) * 100 : 0;
    const wsServer = getWebSocketServer();

    // Criar notificação baseada na fase
    switch (phase) {
      case 'preparing':
        {
          const notification = {
            id: `upload_${uploadId}_preparing`,
            type: 'upload_progress' as const,
            title: 'Preparando Upload',
            message: `Preparando upload do arquivo ${filename}`,
            priority: 'medium' as const,
            timestamp: Date.now(),
            userId,
            roomId,
            data: {
              uploadId,
              filename,
              progress: 0,
              total,
              percentage: 0,
              phase: 'preparing'
            }
          };

          if (roomId) {
            notificationManager.broadcastToRoom(roomId, notification);
            wsServer?.sendNotificationToRoom(roomId, notification);
          } else {
            notificationManager.sendToUser(userId, notification);
            wsServer?.sendNotificationToUser(userId, notification);
          }
        }
        break;

      case 'uploading':
        {
          const notification = {
            id: `upload_${uploadId}_progress`,
            type: 'upload_progress' as const,
            title: 'Upload em Andamento',
            message: `Enviando ${filename} - ${percentage.toFixed(1)}%`,
            priority: 'medium' as const,
            timestamp: Date.now(),
            userId,
            roomId,
            data: {
              uploadId,
              filename,
              progress,
              total,
              percentage,
              speed,
              eta,
              phase: 'uploading'
            }
          };

          if (roomId) {
            notificationManager.broadcastToRoom(roomId, notification);
            wsServer?.sendNotificationToRoom(roomId, notification);
          } else {
            notificationManager.sendToUser(userId, notification);
            wsServer?.sendNotificationToUser(userId, notification);
          }
        }
        break;

      case 'processing':
        {
          const notification = {
            id: `upload_${uploadId}_processing`,
            type: 'video_processing' as const,
            title: 'Processando Arquivo',
            message: `Processando ${filename}...`,
            priority: 'medium' as const,
            timestamp: Date.now(),
            userId,
            roomId,
            data: {
              uploadId,
              filename,
              progress,
              total,
              percentage,
              phase: 'processing'
            }
          };

          if (roomId) {
            notificationManager.broadcastToRoom(roomId, notification);
            wsServer?.sendNotificationToRoom(roomId, notification);
          } else {
            notificationManager.sendToUser(userId, notification);
            wsServer?.sendNotificationToUser(userId, notification);
          }
        }
        break;

      case 'complete':
        {
          const notification = {
            id: `upload_${uploadId}_complete`,
            type: 'upload_complete' as const,
            title: 'Upload Concluído',
            message: `${filename} foi enviado com sucesso!`,
            priority: 'low' as const,
            timestamp: Date.now(),
            userId,
            roomId,
            persistent: true,
            data: {
              uploadId,
              filename,
              progress: total,
              total,
              percentage: 100,
              phase: 'complete'
            }
          };

          if (roomId) {
            notificationManager.broadcastToRoom(roomId, notification);
            wsServer?.sendNotificationToRoom(roomId, notification);
          } else {
            notificationManager.sendToUser(userId, notification);
            wsServer?.sendNotificationToUser(userId, notification);
          }
        }
        break;

      case 'error':
        {
          const notification = {
            id: `upload_${uploadId}_error`,
            type: 'upload_error' as const,
            title: 'Erro no Upload',
            message: `Falha ao enviar ${filename}: ${error || 'Erro desconhecido'}`,
            priority: 'high' as const,
            timestamp: Date.now(),
            userId,
            roomId,
            persistent: true,
            data: {
              uploadId,
              filename,
              error: error || 'Erro desconhecido',
              phase: 'error'
            }
          };

          if (roomId) {
            notificationManager.broadcastToRoom(roomId, notification);
            wsServer?.sendNotificationToRoom(roomId, notification);
          } else {
            notificationManager.sendToUser(userId, notification);
            wsServer?.sendNotificationToUser(userId, notification);
          }
        }
        break;

      default:
        return Response.json({
          success: false,
          error: 'Invalid phase'
        }, { status: 400 });
    }

    return Response.json({
      success: true,
      message: 'Notification sent',
      phase,
      percentage: percentage.toFixed(1)
    });

  } catch (error) {
    logger.error('Error sending upload notification', error instanceof Error ? error : new Error(String(error))
, { component: 'API: notifications/upload' });
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
