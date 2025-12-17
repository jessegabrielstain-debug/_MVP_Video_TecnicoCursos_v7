/**
 * API Route - WebSocket Notifications
 * 
 * Endpoint REST para gerenciar o sistema de notificações WebSocket
 * 
 * @route /api/notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, rateLimitPresets } from '@/lib/utils/rate-limit-middleware';
import { logger } from '@/lib/logger';
import { 
  NotificationSystem, 
  createProductionNotificationSystem,
  type Notification,
  type NotificationType 
} from '@/lib/websocket/notification-system';

// Singleton do sistema de notificações
let notificationSystem: NotificationSystem | null = null;

/**
 * Obtém ou cria a instância do sistema
 */
function getNotificationSystem(): NotificationSystem {
  if (!notificationSystem) {
    notificationSystem = createProductionNotificationSystem();
    notificationSystem.initialize().catch((err) => logger.error('Failed to initialize notification system', err instanceof Error ? err : new Error(String(err)), { component: 'NotificationsRoute' }));
  }
  return notificationSystem;
}
/**
 * POST /api/notifications - Envia uma notificação
 * 
 * Body:
 * {
 *   "type": "info",
 *   "channel": "user:123",
 *   "title": "Título",
 *   "message": "Mensagem",
 *   "data": {},
 *   "priority": "normal",
 *   "recipients": ["user123"]
 * }
 */
const rateLimiterPost = createRateLimiter(rateLimitPresets.authenticated);
export async function POST(request: NextRequest) {
  return rateLimiterPost(request, async (request: NextRequest) => {
  try {
    const system = getNotificationSystem();
    const body = await request.json();

    const { type, channel, title, message, data, priority, recipients, requiresAck } = body;

    // Validação
    if (!type || !channel || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, channel, title, message' },
        { status: 400 }
      );
    }

    // Enviar notificação
    const notification = await system.send({
      type: type as NotificationType,
      channel,
      title,
      message,
      data,
      priority: priority || 'normal',
      recipients: recipients || [],
      requiresAck: requiresAck || false,
    });

    return NextResponse.json({
      success: true,
      notification,
    });

  } catch (error) {
    logger.error('POST /api/notifications error', error instanceof Error ? error : new Error(String(error)), { component: 'NotificationsRoute' });
    return NextResponse.json(
      { error: 'Failed to send notification', details: String(error) },
      { status: 500 }
    );
  }
  });
}

/**
 * GET /api/notifications - Consulta notificações
 * 
 * Query params:
 * - userId: ID do usuário (required)
 * - status: 'unread' | 'history'
 * - type: Filtrar por tipo
 * - limit: Limite de resultados
 * - offset: Offset para paginação
 */
const rateLimiterGet = createRateLimiter(rateLimitPresets.authenticated);
export async function GET(request: NextRequest) {
  return rateLimiterGet(request, async (request: NextRequest) => {
  try {
    const system = getNotificationSystem();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'unread';
    const type = searchParams.get('type') as NotificationType | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    let notifications: Notification[];

    if (status === 'unread') {
      notifications = await system.getUnreadNotifications(userId, limit);
    } else if (status === 'history') {
      notifications = await system.getHistory(userId, { limit, offset, type: type || undefined });
    } else {
      return NextResponse.json(
        { error: 'Invalid status. Use "unread" or "history"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });

  } catch (error) {
    logger.error('GET /api/notifications error', error instanceof Error ? error : new Error(String(error)), { component: 'NotificationsRoute' });
    return NextResponse.json(
      { error: 'Failed to get notifications', details: String(error) },
      { status: 500 }
    );
  }
  });
}

/**
 * PATCH /api/notifications - Marca como lida
 * 
 * Body:
 * {
 *   "notificationId": "abc123",
 *   "userId": "user123"
 * }
 */
const rateLimiterPatch = createRateLimiter(rateLimitPresets.authenticated);
export async function PATCH(request: NextRequest) {
  return rateLimiterPatch(request, async (request: NextRequest) => {
  try {
    const system = getNotificationSystem();
    const body = await request.json();

    const { notificationId, userId } = body;

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: notificationId, userId' },
        { status: 400 }
      );
    }

    await system.markAsRead(notificationId, userId);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });

  } catch (error) {
    logger.error('PATCH /api/notifications error', error instanceof Error ? error : new Error(String(error)), { component: 'NotificationsRoute' });
    return NextResponse.json(
      { error: 'Failed to mark as read', details: String(error) },
      { status: 500 }
    );
  }
  });
}

/**
 * DELETE /api/notifications - Operações de limpeza
 * 
 * Query params:
 * - action: 'cleanup' (limpa expiradas) | 'clear' (limpa todas do usuário)
 * - userId: ID do usuário (para action=clear)
 */
const rateLimiterDelete = createRateLimiter(rateLimitPresets.authenticated);
export async function DELETE(request: NextRequest) {
  return rateLimiterDelete(request, async (request: NextRequest) => {
  try {
    const system = getNotificationSystem();
    const { searchParams } = new URL(request.url);

    const action = searchParams.get('action');

    if (action === 'cleanup') {
      const cleaned = await system.cleanup();
      
      return NextResponse.json({
        success: true,
        message: `Cleaned ${cleaned} expired notifications`,
        cleaned,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "cleanup"' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('DELETE /api/notifications error', error instanceof Error ? error : new Error(String(error)), { component: 'NotificationsRoute' });
    return NextResponse.json(
      { error: 'Failed to perform cleanup', details: String(error) },
      { status: 500 }
    );
  }
  });
}

/**
 * PUT /api/notifications - Operações de conexão
 * 
 * Body:
 * {
 *   "action": "connect" | "disconnect" | "subscribe" | "unsubscribe",
 *   "clientId": "client123",
 *   "userId": "user123",
 *   "channels": ["channel1", "channel2"]
 * }
 */
const rateLimiterPut = createRateLimiter(rateLimitPresets.authenticated);
export async function PUT(request: NextRequest) {
  return rateLimiterPut(request, async (request: NextRequest) => {
  try {
    const system = getNotificationSystem();
    const body = await request.json();

    const { action, clientId, userId, channels, channel } = body;

    if (!action || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, clientId' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'connect':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for connect' },
            { status: 400 }
          );
        }
        const client = await system.connectClient(clientId, userId, channels || []);
        return NextResponse.json({
          success: true,
          client: {
            id: client.id,
            userId: client.userId,
            channels: Array.from(client.channels),
            connected: client.connected,
          },
        });

      case 'disconnect':
        await system.disconnectClient(clientId);
        return NextResponse.json({
          success: true,
          message: 'Client disconnected',
        });

      case 'subscribe':
        if (!channel) {
          return NextResponse.json(
            { error: 'channel is required for subscribe' },
            { status: 400 }
          );
        }
        await system.subscribeToChannel(clientId, channel);
        return NextResponse.json({
          success: true,
          message: `Subscribed to ${channel}`,
        });

      case 'unsubscribe':
        if (!channel) {
          return NextResponse.json(
            { error: 'channel is required for unsubscribe' },
            { status: 400 }
          );
        }
        await system.unsubscribeFromChannel(clientId, channel);
        return NextResponse.json({
          success: true,
          message: `Unsubscribed from ${channel}`,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: connect, disconnect, subscribe, unsubscribe' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('PUT /api/notifications error', error instanceof Error ? error : new Error(String(error)), { component: 'NotificationsRoute' });
    return NextResponse.json(
      { error: 'Failed to perform action', details: String(error) },
      { status: 500 }
    );
  }
  });
}

/**
 * HEAD /api/notifications - Verifica status do sistema
 */
export async function HEAD() {
  try {
    const system = getNotificationSystem();
    const stats = system.getStats();
    
    return new NextResponse(null, {
      status: stats.connectedClients > 0 ? 200 : 503,
      headers: {
        'X-Connected-Clients': stats.connectedClients.toString(),
        'X-Active-Channels': stats.activeChannels.toString(),
        'X-Total-Sent': stats.totalSent.toString(),
        'X-Delivery-Rate': stats.deliveryRate.toFixed(2),
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
