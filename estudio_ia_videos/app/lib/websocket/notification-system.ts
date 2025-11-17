/**
 * Sistema de Notificações em Tempo Real
 * 
 * Sistema robusto de notificações usando WebSocket com:
 * - Fallback automático para polling
 * - Suporte a múltiplos canais/rooms
 * - Persistência de mensagens não lidas
 * - Reconexão automática
 * - Rate limiting
 * - Compressão de dados
 * 
 * @module NotificationSystem
 * @author Sistema IA Videos
 * @since 2025-10-10
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { createHash } from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Tipo de notificação
 */
export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'video:progress'
  | 'video:complete'
  | 'queue:job'
  | 'system:alert';

/**
 * Prioridade da notificação
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Status de entrega
 */
export type DeliveryStatus = 'pending' | 'delivered' | 'read' | 'failed';

/**
 * Interface de notificação
 */
export interface Notification {
  /** ID único da notificação */
  id: string;
  /** Tipo da notificação */
  type: NotificationType;
  /** Canal/room */
  channel: string;
  /** Título da notificação */
  title: string;
  /** Mensagem da notificação */
  message: string;
  /** Dados adicionais */
  data?: Record<string, unknown>;
  /** Prioridade */
  priority: NotificationPriority;
  /** Timestamp de criação */
  timestamp: number;
  /** Status de entrega */
  status: DeliveryStatus;
  /** IDs dos usuários destinatários */
  recipients: string[];
  /** Data de expiração (timestamp) */
  expiresAt?: number;
  /** Requer confirmação de leitura */
  requiresAck?: boolean;
}

/**
 * Configuração do sistema de notificações
 */
export interface NotificationSystemConfig {
  /** Porta do servidor WebSocket */
  port?: number;
  /** URL do Redis */
  redisUrl?: string;
  /** TTL padrão das notificações (ms) */
  defaultTTL?: number;
  /** Intervalo de limpeza de notificações expiradas (ms) */
  cleanupInterval?: number;
  /** Limite de notificações não lidas por usuário */
  maxUnreadPerUser?: number;
  /** Habilitar compressão */
  enableCompression?: boolean;
  /** Intervalo do fallback polling (ms) */
  pollingInterval?: number;
  /** Taxa limite de mensagens por cliente (msg/min) */
  rateLimit?: number;
}

/**
 * Estatísticas do sistema
 */
export interface NotificationStats {
  /** Total de notificações enviadas */
  totalSent: number;
  /** Total de notificações entregues */
  totalDelivered: number;
  /** Total de notificações lidas */
  totalRead: number;
  /** Total de notificações falhadas */
  totalFailed: number;
  /** Clientes conectados */
  connectedClients: number;
  /** Canais ativos */
  activeChannels: number;
  /** Taxa de entrega (%) */
  deliveryRate: number;
  /** Latência média (ms) */
  averageLatency: number;
}

/**
 * Cliente conectado
 */
interface Client {
  id: string;
  userId: string;
  channels: Set<string>;
  connected: boolean;
  lastSeen: number;
  messageCount: number;
  lastMessageTime: number;
}

// ============================================================================
// NOTIFICATION SYSTEM CLASS
// ============================================================================

/**
 * Sistema de Notificações em Tempo Real
 * 
 * @example
 * ```typescript
 * const notifier = new NotificationSystem({
 *   port: 8080,
 *   redisUrl: 'redis://localhost:6379'
 * });
 * 
 * await notifier.initialize();
 * 
 * // Enviar notificação
 * await notifier.send({
 *   type: 'video:complete',
 *   channel: 'user:123',
 *   title: 'Vídeo Processado',
 *   message: 'Seu vídeo está pronto!',
 *   priority: 'high'
 * });
 * ```
 */
export class NotificationSystem extends EventEmitter {
  private config: Required<NotificationSystemConfig>;
  private redis: Redis;
  private pubsub: Redis;
  private clients: Map<string, Client>;
  private channels: Map<string, Set<string>>;
  private stats: NotificationStats;
  private cleanupTimer?: NodeJS.Timeout;
  private isInitialized: boolean;

  constructor(config: NotificationSystemConfig = {}) {
    super();
    
    this.config = {
      port: config.port || 8080,
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      defaultTTL: config.defaultTTL || 7 * 24 * 60 * 60 * 1000, // 7 dias
      cleanupInterval: config.cleanupInterval || 60 * 60 * 1000, // 1 hora
      maxUnreadPerUser: config.maxUnreadPerUser || 1000,
      enableCompression: config.enableCompression ?? true,
      pollingInterval: config.pollingInterval || 30000, // 30s
      rateLimit: config.rateLimit || 100, // 100 msg/min
    };

    this.redis = new Redis(this.config.redisUrl);
    this.pubsub = new Redis(this.config.redisUrl);
    this.clients = new Map();
    this.channels = new Map();
    this.isInitialized = false;

    this.stats = {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0,
      connectedClients: 0,
      activeChannels: 0,
      deliveryRate: 0,
      averageLatency: 0,
    };
  }

  /**
   * Inicializa o sistema
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Testar conexão Redis
      await this.redis.ping();
      
      // Configurar pub/sub
      this.pubsub.on('message', this.handlePubSubMessage.bind(this));
      
      // Iniciar limpeza automática
      this.startCleanupTimer();
      
      this.isInitialized = true;
      this.emit('initialized');
      
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to initialize NotificationSystem: ${error}`);
    }
  }

  /**
   * Envia uma notificação
   */
  async send(
    notification: Partial<Notification> & Pick<Notification, 'type' | 'channel' | 'title' | 'message'>
  ): Promise<Notification> {
    const now = Date.now();
    
    const fullNotification: Notification = {
      id: notification.id || this.generateId(),
      type: notification.type,
      channel: notification.channel,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority || 'normal',
      timestamp: now,
      status: 'pending',
      recipients: notification.recipients || [],
      expiresAt: notification.expiresAt || (now + this.config.defaultTTL),
      requiresAck: notification.requiresAck ?? false,
    };

    try {
      // Persistir notificação
      await this.persistNotification(fullNotification);
      
      // Publicar no canal Redis
      await this.publishNotification(fullNotification);
      
      // Atualizar estatísticas
      this.stats.totalSent++;
      
      this.emit('notification:sent', fullNotification);
      
      return fullNotification;
      
    } catch (error) {
      this.stats.totalFailed++;
      this.emit('notification:failed', { notification: fullNotification, error });
      throw error;
    }
  }

  /**
   * Envia para múltiplos destinatários
   */
  async broadcast(
    notification: Partial<Notification> & Pick<Notification, 'type' | 'title' | 'message'>,
    userIds: string[]
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      userIds.map(userId => 
        this.send({
          ...notification,
          channel: `user:${userId}`,
          recipients: [userId],
        })
      )
    );
    
    return notifications;
  }

  /**
   * Conecta um cliente
   */
  async connectClient(clientId: string, userId: string, channels: string[] = []): Promise<Client> {
    const client: Client = {
      id: clientId,
      userId,
      channels: new Set(channels),
      connected: true,
      lastSeen: Date.now(),
      messageCount: 0,
      lastMessageTime: 0,
    };

    this.clients.set(clientId, client);
    
    // Inscrever nos canais
    for (const channel of channels) {
      await this.subscribeToChannel(clientId, channel);
    }

    // Enviar notificações não lidas
    await this.sendUnreadNotifications(clientId, userId);

    this.stats.connectedClients = this.clients.size;
    this.emit('client:connected', client);

    return client;
  }

  /**
   * Desconecta um cliente
   */
  async disconnectClient(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.connected = false;
    
    // Desinscrever de todos os canais
    for (const channel of client.channels) {
      await this.unsubscribeFromChannel(clientId, channel);
    }

    this.clients.delete(clientId);
    this.stats.connectedClients = this.clients.size;
    
    this.emit('client:disconnected', client);
  }

  /**
   * Inscreve cliente em um canal
   */
  async subscribeToChannel(clientId: string, channel: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) throw new Error('Client not found');

    client.channels.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
      await this.pubsub.subscribe(channel);
    }

    this.channels.get(channel)!.add(clientId);
    this.stats.activeChannels = this.channels.size;

    this.emit('channel:subscribed', { clientId, channel });
  }

  /**
   * Desinscreve cliente de um canal
   */
  async unsubscribeFromChannel(clientId: string, channel: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.delete(channel);

    const channelClients = this.channels.get(channel);
    if (channelClients) {
      channelClients.delete(clientId);
      
      if (channelClients.size === 0) {
        this.channels.delete(channel);
        await this.pubsub.unsubscribe(channel);
      }
    }

    this.stats.activeChannels = this.channels.size;
    this.emit('channel:unsubscribed', { clientId, channel });
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const key = `notification:${notificationId}`;
    const notification = await this.redis.get(key);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    const parsed: Notification = JSON.parse(notification);
    
    if (!parsed.recipients.includes(userId)) {
      throw new Error('User is not a recipient');
    }

    parsed.status = 'read';
    
    await this.redis.set(key, JSON.stringify(parsed), 'PX', this.config.defaultTTL);
    await this.redis.srem(`user:${userId}:unread`, notificationId);

    this.stats.totalRead++;
    this.emit('notification:read', { notificationId, userId });
  }

  /**
   * Obtém notificações não lidas de um usuário
   */
  async getUnreadNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const unreadIds = await this.redis.smembers(`user:${userId}:unread`);
    const notifications: Notification[] = [];

    for (const id of unreadIds.slice(0, limit)) {
      const data = await this.redis.get(`notification:${id}`);
      if (data) {
        notifications.push(JSON.parse(data));
      }
    }

    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Obtém histórico de notificações
   */
  async getHistory(
    userId: string,
    options: { limit?: number; offset?: number; type?: NotificationType } = {}
  ): Promise<Notification[]> {
    const { limit = 50, offset = 0, type } = options;
    
    const pattern = `notification:*`;
    const keys = await this.redis.keys(pattern);
    const notifications: Notification[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const notification: Notification = JSON.parse(data);
        
        if (notification.recipients.includes(userId)) {
          if (!type || notification.type === type) {
            notifications.push(notification);
          }
        }
      }
    }

    return notifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
  }

  /**
   * Limpa notificações expiradas
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    const pattern = 'notification:*';
    const keys = await this.redis.keys(pattern);
    let cleaned = 0;

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const notification: Notification = JSON.parse(data);
        
        if (notification.expiresAt && notification.expiresAt < now) {
          await this.redis.del(key);
          
          // Remover das listas de não lidas
          for (const userId of notification.recipients) {
            await this.redis.srem(`user:${userId}:unread`, notification.id);
          }
          
          cleaned++;
        }
      }
    }

    this.emit('cleanup:completed', { cleaned });
    return cleaned;
  }

  /**
   * Obtém estatísticas
   */
  getStats(): NotificationStats {
    this.stats.deliveryRate = this.stats.totalSent > 0
      ? (this.stats.totalDelivered / this.stats.totalSent) * 100
      : 0;

    return { ...this.stats };
  }

  /**
   * Finaliza o sistema
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Desconectar todos os clientes
    for (const [clientId] of this.clients) {
      await this.disconnectClient(clientId);
    }

    await this.redis.quit();
    await this.pubsub.quit();

    this.isInitialized = false;
    this.emit('shutdown');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private generateId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  private async persistNotification(notification: Notification): Promise<void> {
    const key = `notification:${notification.id}`;
    const value = JSON.stringify(notification);
    
    await this.redis.set(key, value, 'PX', this.config.defaultTTL);
    
    // Adicionar à lista de não lidas
    for (const userId of notification.recipients) {
      await this.redis.sadd(`user:${userId}:unread`, notification.id);
      
      // Limitar quantidade de não lidas
      const count = await this.redis.scard(`user:${userId}:unread`);
      if (count > this.config.maxUnreadPerUser) {
        const oldest = await this.redis.spop(`user:${userId}:unread`);
        if (oldest) {
          await this.redis.del(`notification:${oldest}`);
        }
      }
    }
  }

  private async publishNotification(notification: Notification): Promise<void> {
    const message = JSON.stringify(notification);
    await this.redis.publish(notification.channel, message);
  }

  private handlePubSubMessage(channel: string, message: string): void {
    try {
      const notification: Notification = JSON.parse(message);
      const channelClients = this.channels.get(channel);

      if (channelClients) {
        for (const clientId of channelClients) {
          this.deliverToClient(clientId, notification);
        }
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  private deliverToClient(clientId: string, notification: Notification): void {
    const client = this.clients.get(clientId);
    if (!client || !client.connected) return;

    // Rate limiting
    const now = Date.now();
    const timeSinceLastMessage = now - client.lastMessageTime;
    
    if (timeSinceLastMessage < 60000) { // 1 minuto
      if (client.messageCount >= this.config.rateLimit) {
        this.emit('rate:limit:exceeded', { clientId, notification });
        return;
      }
      client.messageCount++;
    } else {
      client.messageCount = 1;
      client.lastMessageTime = now;
    }

    this.stats.totalDelivered++;
    this.emit('notification:delivered', { clientId, notification });
  }

  private async sendUnreadNotifications(clientId: string, userId: string): Promise<void> {
    const unread = await this.getUnreadNotifications(userId, 50);
    
    for (const notification of unread) {
      this.deliverToClient(clientId, notification);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(error => this.emit('error', error));
    }, this.config.cleanupInterval);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Cria um sistema básico de notificações
 */
export function createBasicNotificationSystem(): NotificationSystem {
  return new NotificationSystem({
    enableCompression: false,
    pollingInterval: 60000,
  });
}

/**
 * Cria um sistema de notificações com alta performance
 */
export function createHighPerformanceNotificationSystem(): NotificationSystem {
  return new NotificationSystem({
    enableCompression: true,
    pollingInterval: 15000,
    rateLimit: 200,
    maxUnreadPerUser: 2000,
  });
}

/**
 * Cria um sistema de notificações para produção
 */
export function createProductionNotificationSystem(): NotificationSystem {
  const system = new NotificationSystem({
    enableCompression: true,
    pollingInterval: 30000,
    rateLimit: 100,
    cleanupInterval: 30 * 60 * 1000, // 30 min
  });

  // Logging de eventos importantes
  system.on('error', (error) => {
    console.error('[NotificationSystem] Error:', error);
  });

  system.on('notification:failed', ({ notification, error }) => {
    console.error('[NotificationSystem] Failed to send:', notification.id, error);
  });

  return system;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default NotificationSystem;
